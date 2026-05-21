import type { AppServer, AppSocket } from "../index";
import type { GameRoomRegistry } from "../../game/GameRoomRegistry";
import { LudoEngine } from "../../game/LudoEngine";
import { GameRoom } from "../../game/GameRoom";
import { deductEntryFees, payoutWinner } from "../../db/queries/wallets";
import {
  createMatch,
  recordMove,
  endMatch,
  deleteMatch,
} from "../../db/queries/matches";
import { updateRoomStatus, getRoomByCode } from "../../db/queries/rooms";
import { getLeaderboard } from "../../db/queries/chats";

const TURN_DURATION_SECONDS = GameRoom.TURN_DURATION_SECONDS;

export const registerGameHandlers = (
  io: AppServer,
  socket: AppSocket,
  registry: GameRoomRegistry,
): void => {
  socket.on("game:start", async ({ roomCode }, callback) => {
    const gameRoom = registry.get(roomCode);
    try {
      if (!gameRoom) {
        callback({ ok: false, error: "Room not found" });
        return;
      }

      if (gameRoom.gameState !== null || gameRoom.isStarting) {
        callback({ ok: false, error: "Game already started" });
        return;
      }
      gameRoom.isStarting = true;

      if (gameRoom.createdBy !== socket.userId) {
        gameRoom.isStarting = false;
        callback({ ok: false, error: "Only the host can start the game" });
        return;
      }

      if (!gameRoom.roomId) {
        gameRoom.isStarting = false;
        callback({ ok: false, error: "Room ID not found" });
        return;
      }

      // Sync DB players into memory before count check
      const dbRoom = await getRoomByCode(gameRoom.roomCode);
      if (dbRoom) {
        for (const p of dbRoom.players) {
          if (!gameRoom.getPlayer(p.userId)) {
            gameRoom.addPlayer({
              userId: p.userId,
              displayName: p.displayName,
              color: p.color,
              corner: p.corner,
              socketId: "",
              isConnected: false,
              isForfeited: false,
            });
          }
        }
      }

      if (gameRoom.players.length < 2) {
        gameRoom.isStarting = false;
        callback({
          ok: false,
          error: "At least 2 players are required to start",
        });
        return;
      }

      const playerIds = gameRoom.players.map((p) => p.userId);
      const colors = gameRoom.players.map((p) => p.color);

      // Roll back match on fee deduction failure
      const matchId = await createMatch(gameRoom.roomId, playerIds, colors);
      try {
        await deductEntryFees(playerIds, GameRoom.ENTRY_FEE, matchId);
      } catch (feeErr) {
        gameRoom.isStarting = false;
        await deleteMatch(matchId).catch(() => null);
        throw feeErr;
      }

      await updateRoomStatus(gameRoom.roomId, "active");

      gameRoom.initGameState(matchId);
      gameRoom.isStarting = false;
      const gs = gameRoom.gameState!;
      io.to(roomCode).emit("game:state", { gameState: gs });
      io.to(roomCode).emit("turn:changed", {
        playerId: gs.currentTurnUserId,
        timeRemaining: TURN_DURATION_SECONDS,
      });

      gameRoom.startTurnTimer(io, () =>
        handleTimerExpiry(io, socket, registry, roomCode),
      );

      callback({ ok: true, data: null });
    } catch (err) {
      if (gameRoom) gameRoom.isStarting = false;
      console.error("[game:start] Failed to start game", err);
      callback({ ok: false, error: "Failed to start game" });
    }
  });

  socket.on("game:forfeit", async ({ roomCode }, callback) => {
    try {
      const gameRoom = registry.get(roomCode);
      if (!gameRoom?.gameState) {
        callback({ ok: false, error: "No active game" });
        return;
      }

      if (
        gameRoom.gameState.status !== "active" &&
        gameRoom.gameState.status !== "paused"
      ) {
        callback({ ok: false, error: "Game is not in progress" });
        return;
      }

      const player = gameRoom.getPlayer(socket.userId);
      if (!player) {
        callback({ ok: false, error: "Player not in room" });
        return;
      }

      if (player.isForfeited) {
        callback({ ok: false, error: "Already forfeited" });
        return;
      }

      gameRoom.forfeitPlayer(io, socket.userId);

      callback({ ok: true, data: null });
    } catch (err) {
      console.error("[game:forfeit] Failed to forfeit", err);
      callback({ ok: false, error: "Failed to forfeit" });
    }
  });

  socket.on("dice:roll", async ({ roomCode }, callback) => {
    try {
      const gameRoom = registry.get(roomCode);
      const gameState = gameRoom?.gameState;

      if (!gameRoom || !gameState) {
        callback({ ok: false, error: "No active game in this room" });
        return;
      }

      if (gameState.status !== "active") {
        callback({ ok: false, error: "Game is not active" });
        return;
      }

      if (gameState.currentTurnUserId !== socket.userId) {
        callback({ ok: false, error: "Not your turn" });
        return;
      }

      if (gameState.lastDiceValue !== null) {
        callback({ ok: false, error: "Already rolled this turn" });
        return;
      }

      const value = LudoEngine.rollDice();
      const playerState = gameState.players.find(
        (p) => p.userId === socket.userId,
      );
      if (!playerState) {
        callback({ ok: false, error: "Player not found in game" });
        return;
      }

      const validMoves = LudoEngine.getValidMoves(playerState, value);

      gameState.lastDiceValue = value;
      gameState.validMoves = validMoves;

      io.to(roomCode).emit("dice:result", {
        value,
        playerId: socket.userId,
        validMoves,
      });

      // Brief delay so clients see the dice value before turn advances
      if (validMoves.length === 0) {
        gameRoom.clearTurnTimer();
        setTimeout(() => gameRoom.advanceTurnWithTimer(io), 1200);
      }

      callback({ ok: true, data: null });
    } catch (err) {
      console.error("[dice:roll] Failed to roll dice", err);
      callback({ ok: false, error: "Failed to roll dice" });
    }
  });

  socket.on("move:pawn", async ({ roomCode, pawnIndex }, callback) => {
    try {
      const gameRoom = registry.get(roomCode);
      const gameState = gameRoom?.gameState;

      if (!gameRoom || !gameState) {
        callback({ ok: false, error: "No active game in this room" });
        return;
      }

      if (gameState.currentTurnUserId !== socket.userId) {
        callback({ ok: false, error: "Not your turn" });
        return;
      }

      if (gameState.lastDiceValue === null) {
        callback({ ok: false, error: "Must roll dice first" });
        return;
      }

      if (!gameState.validMoves.includes(pawnIndex)) {
        callback({ ok: false, error: "Invalid pawn selection" });
        return;
      }

      const playerState = gameState.players.find(
        (p) => p.userId === socket.userId,
      );
      if (!playerState) {
        callback({ ok: false, error: "Player not found in game" });
        return;
      }

      const validation = LudoEngine.validateMove(
        playerState,
        pawnIndex,
        gameState.lastDiceValue,
      );
      if (!validation.valid) {
        callback({ ok: false, error: validation.reason });
        return;
      }

      const diceValue = gameState.lastDiceValue;
      const fromPos = playerState.pawns[pawnIndex].position;

      const result = LudoEngine.applyMove(
        playerState,
        gameState.players,
        pawnIndex,
        diceValue,
      );

      playerState.pawns[pawnIndex] = result.updatedPawn;

      if (result.kill) {
        const killedPlayer = gameState.players.find(
          (p) => p.userId === result.kill!.killedUserId,
        );
        if (killedPlayer) {
          killedPlayer.pawns[result.kill.killedPawnIndex] =
            LudoEngine.sendToBase(
              killedPlayer.pawns[result.kill.killedPawnIndex],
            );
        }
      }

      if (gameRoom.matchId) {
        recordMove({
          matchId: gameRoom.matchId,
          userId: socket.userId,
          diceValue,
          pawnIndex,
          fromPos,
          toPos: result.updatedPawn.position,
        }).catch(() => null);
      }

      io.to(roomCode).emit("pawn:moved", {
        pawnIndex,
        playerId: socket.userId,
        path: result.path,
        kill: result.kill,
        reachedHome: result.reachedHome,
      });

      if (LudoEngine.checkWin(playerState)) {
        await handleGameOver(io, gameRoom, roomCode, socket.userId, registry);
        callback({ ok: true, data: null });
        return;
      }

      gameRoom.clearTurnTimer();

      if (
        LudoEngine.grantsExtraTurn(diceValue, result.kill, result.reachedHome)
      ) {
        gameState.lastDiceValue = null;
        gameState.validMoves = [];
        gameState.timeRemaining = TURN_DURATION_SECONDS;
        io.to(roomCode).emit("game:state", { gameState });
        io.to(roomCode).emit("turn:changed", {
          playerId: socket.userId,
          timeRemaining: TURN_DURATION_SECONDS,
        });
        gameRoom.startTurnTimer(io, () => gameRoom.advanceTurnWithTimer(io));
      } else {
        gameRoom.advanceTurnWithTimer(io);
      }

      callback({ ok: true, data: null });
    } catch (err) {
      console.error("[move:pawn] Failed to apply move", err);
      callback({ ok: false, error: "Failed to apply move" });
    }
  });

  socket.on("game:replay:vote", async ({ roomCode, vote }, callback) => {
    try {
      const gameRoom = registry.get(roomCode);
      if (!gameRoom?.gameState) {
        callback({ ok: false, error: "No completed game" });
        return;
      }

      if (gameRoom.gameState.status !== "completed") {
        callback({ ok: false, error: "Game is not completed" });
        return;
      }

      const activePlayers = gameRoom.players.filter((p) => !p.isForfeited);
      const votingPlayer = gameRoom.getPlayer(socket.userId);
      if (!votingPlayer) {
        callback({ ok: false, error: "Player not in room" });
        return;
      }

      if (vote === "no") {
        registry.clearReplayVotes(roomCode);
        gameRoom.removePlayer(socket.userId);
        registry.untrackUser(socket.userId);
        socket.leave(roomCode);
        io.to(roomCode).emit("game:replay:cancelled", {
          reason: `${votingPlayer.displayName} declined to play again`,
        });
        callback({ ok: true, data: null });
        return;
      }

      // Threshold snapshotted on first yes-vote
      const { votes, required } = registry.getOrCreateReplayVotes(
        roomCode,
        activePlayers.length,
      );
      votes.add(socket.userId);

      const currentVotes = votes.size;

      io.to(roomCode).emit("game:replay:pending", {
        requestedBy: socket.userId,
        displayName: votingPlayer.displayName,
        votes: currentVotes,
        required,
      });

      if (currentVotes < required) {
        callback({ ok: true, data: null });
        return;
      }

      registry.clearReplayVotes(roomCode);

      if (!gameRoom.roomId) {
        callback({ ok: false, error: "Room ID not found" });
        return;
      }

      const playerIds = gameRoom.players.map((p) => p.userId);
      const colors = gameRoom.players.map((p) => p.color);

      const matchId = await createMatch(gameRoom.roomId, playerIds, colors);
      await deductEntryFees(playerIds, GameRoom.ENTRY_FEE, matchId);

      gameRoom.gameState = null;
      gameRoom.matchId = null;
      gameRoom.initGameState(matchId);
      const rs = gameRoom.gameState!;
      io.to(roomCode).emit("game:state", { gameState: rs });
      io.to(roomCode).emit("turn:changed", {
        playerId: rs.currentTurnUserId,
        timeRemaining: TURN_DURATION_SECONDS,
      });

      gameRoom.startTurnTimer(io, () =>
        handleTimerExpiry(io, socket, registry, roomCode),
      );

      callback({ ok: true, data: null });
    } catch (err) {
      console.error("[game:replay:vote] Failed to process replay vote", err);
      callback({ ok: false, error: "Failed to process replay vote" });
    }
  });

  socket.on("game:replay", async ({ roomCode }, callback) => {
    try {
      const gameRoom = registry.get(roomCode);
      if (!gameRoom?.gameState) {
        callback({ ok: false, error: "No completed game to replay" });
        return;
      }

      if (gameRoom.gameState.status !== "completed") {
        callback({ ok: false, error: "Game is not yet completed" });
        return;
      }

      if (gameRoom.players.length > 1) {
        callback({
          ok: false,
          error: "Use game:replay:vote for multiplayer replay",
        });
        return;
      }

      if (!gameRoom.roomId) {
        callback({ ok: false, error: "Room ID not found" });
        return;
      }

      const playerIds = gameRoom.players.map((p) => p.userId);
      const colors = gameRoom.players.map((p) => p.color);

      const matchId = await createMatch(gameRoom.roomId, playerIds, colors);
      await deductEntryFees(playerIds, GameRoom.ENTRY_FEE, matchId);

      gameRoom.gameState = null;
      gameRoom.matchId = null;
      gameRoom.initGameState(matchId);
      const rs = gameRoom.gameState!;
      io.to(roomCode).emit("game:state", { gameState: rs });
      io.to(roomCode).emit("turn:changed", {
        playerId: rs.currentTurnUserId,
        timeRemaining: TURN_DURATION_SECONDS,
      });

      gameRoom.startTurnTimer(io, () =>
        handleTimerExpiry(io, socket, registry, roomCode),
      );

      callback({ ok: true, data: null });
    } catch (err) {
      console.error("[game:replay] Failed to start replay", err);
      callback({ ok: false, error: "Failed to start replay" });
    }
  });
};

const handleTimerExpiry = (
  io: AppServer,
  _socket: AppSocket,
  registry: GameRoomRegistry,
  roomCode: string,
): void => {
  const gameRoom = registry.get(roomCode);
  if (!gameRoom) return;
  gameRoom.clearTurnTimer();
  gameRoom.advanceTurnWithTimer(io);
};

const handleGameOver = async (
  io: AppServer,
  gameRoom: InstanceType<typeof import("../../game/GameRoom").GameRoom>,
  roomCode: string,
  winnerId: string,
  registry: GameRoomRegistry,
): Promise<void> => {
  gameRoom.clearTurnTimer();

  const { gameState, matchId } = gameRoom;
  if (!gameState || !matchId) return;

  gameState.status = "completed";
  gameState.winnerId = winnerId;

  const playerCount = gameRoom.players.length;
  const winnerPayout = GameRoom.calcPayout(playerCount);

  await Promise.all([
    endMatch(matchId, winnerId),
    payoutWinner(winnerId, winnerPayout, matchId),
  ]);

  const winnerPlayer = gameState.players.find((p) => p.userId === winnerId);
  const payouts: Record<string, number> = { [winnerId]: winnerPayout };

  io.to(roomCode).emit("game:over", {
    result: {
      winnerId,
      winnerDisplayName: winnerPlayer?.displayName ?? "Unknown",
      payouts,
    },
  });

  getLeaderboard()
    .then((entries) => {
      io.emit("leaderboard:update", { entries });
    })
    .catch(() => null);

  gameRoom.players.forEach((p) => registry.untrackUser(p.userId));
  gameRoom.cleanup();
  registry.delete(roomCode);
};
