import type { AppServer } from '../socket';
import { GameRoom } from './GameRoom';

export class GameRoomRegistry {
  private static instance: GameRoomRegistry;
  private rooms = new Map<string, GameRoom>();
  // Map userId → roomCode for quick disconnect lookup
  private userRoomMap = new Map<string, string>();
  // Map roomCode → Set of userIds who voted 'yes' for replay
  private replayVotes = new Map<string, Set<string>>();

  static getInstance(): GameRoomRegistry {
    if (!GameRoomRegistry.instance) {
      GameRoomRegistry.instance = new GameRoomRegistry();
    }
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

  getOrCreateReplayVotes(roomCode: string): Set<string> {
    const existing = this.replayVotes.get(roomCode);
    if (existing) return existing;
    const votes = new Set<string>();
    this.replayVotes.set(roomCode, votes);
    return votes;
  }

  clearReplayVotes(roomCode: string): void {
    this.replayVotes.delete(roomCode);
  }

  handleDisconnect(io: AppServer, userId: string): void {
    const roomCode = this.userRoomMap.get(userId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.handlePlayerDisconnect(io, userId);
  }
}
