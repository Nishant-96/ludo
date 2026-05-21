import type { AppServer } from "../socket";
import { GameRoom } from "./GameRoom";
import { removePlayerFromRoom, getRoomByCode } from "../db/queries/rooms";

export class GameRoomRegistry {
  private static instance: GameRoomRegistry;
  private rooms = new Map<string, GameRoom>();
  private userRoomMap = new Map<string, string>();
  private replayVotes = new Map<
    string,
    { votes: Set<string>; required: number }
  >();
  private joinLocks = new Map<string, Promise<void>>();

  static getInstance(): GameRoomRegistry {
    if (!GameRoomRegistry.instance)
      GameRoomRegistry.instance = new GameRoomRegistry();
    return GameRoomRegistry.instance;
  }

  get(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode);
  }
  create(roomCode: string): GameRoom {
    const room = new GameRoom(roomCode);
    this.rooms.set(roomCode, room);
    return room;
  }
  getOrCreate(roomCode: string): GameRoom {
    return this.rooms.get(roomCode) ?? this.create(roomCode);
  }
  delete(roomCode: string): void {
    this.rooms.delete(roomCode);
  }
  trackUser(userId: string, roomCode: string): void {
    this.userRoomMap.set(userId, roomCode);
  }
  untrackUser(userId: string): void {
    this.userRoomMap.delete(userId);
  }
  getRoomCodeForUser(userId: string): string | undefined {
    return this.userRoomMap.get(userId);
  }

  async withJoinLock<T>(roomCode: string, fn: () => Promise<T>): Promise<T> {
    while (this.joinLocks.has(roomCode)) {
      await this.joinLocks.get(roomCode);
    }
    let releaseLock!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.joinLocks.set(roomCode, lockPromise);
    try {
      return await fn();
    } finally {
      this.joinLocks.delete(roomCode);
      releaseLock();
    }
  }

  getOrCreateReplayVotes(
    roomCode: string,
    required: number,
  ): { votes: Set<string>; required: number } {
    const existing = this.replayVotes.get(roomCode);
    if (existing) return existing;
    const entry = { votes: new Set<string>(), required };
    this.replayVotes.set(roomCode, entry);
    return entry;
  }

  clearReplayVotes(roomCode: string): void {
    this.replayVotes.delete(roomCode);
  }

  handleDisconnect(io: AppServer, userId: string): void {
    const roomCode = this.userRoomMap.get(userId);
    if (!roomCode) return;
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const entry = this.replayVotes.get(roomCode);
    if (entry) entry.votes.delete(userId);

    if (room.gameState) {
      room.handlePlayerDisconnect(io, userId);
    } else {
      this.removePlayerFromWaitingRoom(io, room, roomCode, userId).catch(
        () => null,
      );
    }
  }

  async removePlayerFromWaitingRoom(
    io: AppServer,
    room: GameRoom,
    roomCode: string,
    userId: string,
  ): Promise<void> {
    room.removePlayer(userId);
    this.untrackUser(userId);

    io.to(roomCode).emit("player:left", { userId });

    if (room.roomId) {
      await removePlayerFromRoom(room.roomId, userId);
      const updatedRoom = await getRoomByCode(roomCode);
      if (updatedRoom) {
        const mergedPlayers = updatedRoom.players.map((p) => ({
          ...p,
          isConnected: room.getPlayer(p.userId)?.isConnected ?? true,
        }));
        io.to(roomCode).emit("room:state", {
          room: { ...updatedRoom, players: mergedPlayers },
        });
      }
    }
  }
}
