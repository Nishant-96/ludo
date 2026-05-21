import { randomUUID } from "node:crypto";
import type { AppServer, AppSocket } from "../index";
import type { GameRoomRegistry } from "../../game/GameRoomRegistry";
import type { GameRoom } from "../../game/GameRoom";
import type { Room } from "@ludo/shared";
import {
  getRoomByCode,
  createRoom,
  addPlayerToRoom,
  getNextAvailableColorAndCorner,
  removePlayerFromRoom,
} from "../../db/queries/rooms";
import { getUserById } from "../../db/queries/users";
import { getBalance } from "../../db/queries/wallets";
import { getRoomMessages } from "../../db/queries/chats";

const generateRoomCode = (): string =>
  randomUUID().replace(/-/g, "").slice(0, 6).toLowerCase();

const mergeConnectionStatus = (room: Room, gameRoom: GameRoom): Room => ({
  ...room,
  players: room.players.map((p) => ({
    ...p,
    isConnected: gameRoom.getPlayer(p.userId)?.isConnected ?? true,
  })),
});

export const registerRoomHandlers = (
  io: AppServer,
  socket: AppSocket,
  registry: GameRoomRegistry,
): void => {
  socket.on("room:create", async ({ capacity }, callback) => {
    try {
      const user = await getUserById(socket.userId);
      if (!user) {
        callback({ ok: false, error: "User not found" });
        return;
      }

      const code = generateRoomCode();
      const room = await createRoom({
        code,
        capacity,
        createdBy: socket.userId,
      });

      const { color, corner } = await getNextAvailableColorAndCorner(room.id);
      await addPlayerToRoom({
        roomId: room.id,
        userId: socket.userId,
        color,
        corner,
      });

      const gameRoom = registry.getOrCreate(code);
      gameRoom.roomId = room.id;
      gameRoom.createdBy = socket.userId;
      gameRoom.addPlayer({
        userId: socket.userId,
        displayName: user.displayName,
        color,
        corner,
        socketId: socket.id,
        isConnected: true,
        isForfeited: false,
      });
      registry.trackUser(socket.userId, code);

      await socket.join(code);

      const fullRoom = await getRoomByCode(code);
      if (!fullRoom) throw new Error("Room not found after creation");

      callback({
        ok: true,
        data: { room: mergeConnectionStatus(fullRoom, gameRoom) },
      });
    } catch (err) {
      console.error("[room:create] Failed to create room", err);
      callback({ ok: false, error: "Failed to create room" });
    }
  });

  socket.on("room:leave", async ({ roomCode }) => {
    try {
      const gameRoom = registry.get(roomCode);
      if (!gameRoom || gameRoom.gameState) return;

      const player = gameRoom.getPlayer(socket.userId);
      if (!player) return;

      await registry.removePlayerFromWaitingRoom(
        io,
        gameRoom,
        roomCode,
        socket.userId,
      );
      await socket.leave(roomCode);
    } catch (err) {
      console.error("[room:leave] Failed to process leave", err);
    }
  });

  socket.on("room:join", async ({ roomCode }, callback) => {
    try {
      const room = await getRoomByCode(roomCode);
      if (!room) {
        callback({ ok: false, error: "Room not found" });
        return;
      }

      const gameRoom = registry.getOrCreate(roomCode);
      gameRoom.roomId = room.id;
      gameRoom.createdBy ??= room.createdBy;

      const existingPlayer = room.players.find(
        (p) => p.userId === socket.userId,
      );

      if (existingPlayer) {
        const liveSockets = await io.in(roomCode).fetchSockets();
        const connectedSocketUserIds = new Set(
          liveSockets.map((s) => (s as unknown as AppSocket).userId),
        );

        for (const p of room.players) {
          if (!gameRoom.getPlayer(p.userId)) {
            const isLive =
              p.userId === socket.userId ||
              connectedSocketUserIds.has(p.userId);
            gameRoom.addPlayer({
              userId: p.userId,
              displayName: p.displayName,
              color: p.color,
              corner: p.corner,
              socketId: p.userId === socket.userId ? socket.id : "",
              isConnected: isLive,
              isForfeited: false,
            });
          }
        }

        registry.trackUser(socket.userId, roomCode);

        // Replay chat history before join to avoid gaps
        const history = await getRoomMessages(room.id);
        for (const msg of history) {
          socket.emit("chat:message", {
            senderId: msg.senderId,
            displayName: msg.displayName,
            message: msg.message,
            timestamp: msg.timestamp,
          });
        }

        await socket.join(roomCode);
        gameRoom.handlePlayerReconnect(io, socket.userId, socket.id);

        const updatedRoom = await getRoomByCode(roomCode);
        const mergedRoom = mergeConnectionStatus(updatedRoom!, gameRoom);
        io.to(roomCode).emit("room:state", { room: mergedRoom });
        callback({ ok: true, data: { room: mergedRoom } });
        return;
      }

      await registry.withJoinLock(roomCode, async () => {
        const currentRoom = await getRoomByCode(roomCode);
        if (!currentRoom) {
          callback({ ok: false, error: "Room not found" });
          return;
        }

        const alreadyJoined = currentRoom.players.find(
          (p) => p.userId === socket.userId,
        );
        if (alreadyJoined) {
          await socket.join(roomCode);
          const merged = mergeConnectionStatus(currentRoom, gameRoom);
          io.to(roomCode).emit("room:state", { room: merged });
          callback({ ok: true, data: { room: merged } });
          return;
        }

        if (currentRoom.status !== "waiting") {
          callback({ ok: false, error: "Room is no longer accepting players" });
          return;
        }
        if (currentRoom.players.length >= currentRoom.capacity) {
          callback({ ok: false, error: "Room is full" });
          return;
        }

        const balance = await getBalance(socket.userId);
        if (balance < 100) {
          callback({
            ok: false,
            error: "Insufficient coins to join (minimum 100 required)",
          });
          return;
        }

        const user = await getUserById(socket.userId);
        if (!user) {
          callback({ ok: false, error: "User not found" });
          return;
        }

        const { color, corner } = await getNextAvailableColorAndCorner(
          currentRoom.id,
        );
        await addPlayerToRoom({
          roomId: currentRoom.id,
          userId: socket.userId,
          color,
          corner,
        });

        gameRoom.addPlayer({
          userId: socket.userId,
          displayName: user.displayName,
          color,
          corner,
          socketId: socket.id,
          isConnected: true,
          isForfeited: false,
        });
        registry.trackUser(socket.userId, roomCode);

        socket
          .to(roomCode)
          .emit("player:joined", {
            player: {
              userId: socket.userId,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              color,
              corner,
              isConnected: true,
            },
          });

        const updatedRoom = await getRoomByCode(roomCode);
        if (!updatedRoom) throw new Error("Room not found after join");

        const history = await getRoomMessages(updatedRoom.id);
        for (const msg of history) {
          socket.emit("chat:message", {
            senderId: msg.senderId,
            displayName: msg.displayName,
            message: msg.message,
            timestamp: msg.timestamp,
          });
        }

        await socket.join(roomCode);

        const mergedRoom = mergeConnectionStatus(updatedRoom, gameRoom);
        io.to(roomCode).emit("room:state", { room: mergedRoom });
        callback({ ok: true, data: { room: mergedRoom } });
      });
    } catch (err) {
      console.error("[room:join] Failed to join room", err);
      callback({ ok: false, error: "Failed to join room" });
    }
  });
};
