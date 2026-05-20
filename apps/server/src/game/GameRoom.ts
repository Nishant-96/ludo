import type { GameState, PlayerGameState, Pawn, PlayerColor } from '@ludo/shared';
import type { AppServer } from '../socket';
import { LudoEngine } from './LudoEngine';
import { payoutWinner } from '../db/queries/wallets';
import { endMatch } from '../db/queries/matches';
import { getLeaderboard } from '../db/queries/chats';

const TURN_DURATION_SECONDS = 30;
const RECONNECT_GRACE_SECONDS = 60;
const ENTRY_FEE = 100;
const PAYOUT_MULTIPLIER = 0.8;

export interface GameRoomPlayer {
  userId: string;
  displayName: string;
  color: PlayerColor;
  corner: 0 | 1 | 2 | 3;
  socketId: string;
  isConnected: boolean;
  isForfeited: boolean;
}

export class GameRoom {
  readonly roomCode: string;
  roomId: string | null = null;
  createdBy: string | null = null;
  players: GameRoomPlayer[] = [];
  matchId: string | null = null;
  gameState: GameState | null = null;
  isStarting = false;

  private turnTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }

  addPlayer(player: GameRoomPlayer): void {
    const existing = this.players.findIndex((p) => p.userId === player.userId);
    if (existing >= 0) {
      this.players[existing].socketId = player.socketId;
      this.players[existing].isConnected = true;
    } else {
      this.players.push(player);
    }
  }

  removePlayer(userId: string): void {
    this.players = this.players.filter((p) => p.userId !== userId);
  }

  getPlayer(userId: string): GameRoomPlayer | undefined {
    return this.players.find((p) => p.userId === userId);
  }

  isFull(capacity: number): boolean {
    return this.players.length >= capacity;
  }

  initGameState(matchId: string): void {
    this.matchId = matchId;

    const playerStates: PlayerGameState[] = this.players.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      color: p.color,
      corner: p.corner,
      pawns: LudoEngine.createInitialPawns(p.color),
      isConnected: true,
      isForfeited: false,
    }));

    this.gameState = {
      matchId,
      roomCode: this.roomCode,
      status: 'active',
      players: playerStates,
      currentTurnUserId: this.players[0].userId,
      turnOrder: this.players.map((p) => p.userId),
      timeRemaining: TURN_DURATION_SECONDS,
      lastDiceValue: null,
      validMoves: [],
      winnerId: null,
    };
  }

  startTurnTimer(io: AppServer, onExpire: () => void): void {
    this.clearTurnTimer();
    if (!this.gameState) return;

    this.gameState.timeRemaining = TURN_DURATION_SECONDS;
    this.turnTimer = setInterval(() => {
      if (!this.gameState) return;
      this.gameState.timeRemaining -= 1;
      io.to(this.roomCode).emit('timer:tick', { timeRemaining: this.gameState.timeRemaining });
      if (this.gameState.timeRemaining <= 0) {
        this.clearTurnTimer();
        onExpire();
      }
    }, 1000);
  }

  clearTurnTimer(): void {
    if (this.turnTimer) {
      clearInterval(this.turnTimer);
      this.turnTimer = null;
    }
  }

  advanceTurn(): string {
    if (!this.gameState) throw new Error('No active game state');

    const activePlayers = this.gameState.turnOrder.filter((id) => {
      const p = this.gameState!.players.find((pl) => pl.userId === id);
      return p && !p.isForfeited;
    });

    const currentIndex = activePlayers.indexOf(this.gameState.currentTurnUserId);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    this.gameState.currentTurnUserId = activePlayers[nextIndex];
    this.gameState.lastDiceValue = null;
    this.gameState.validMoves = [];
    this.gameState.timeRemaining = TURN_DURATION_SECONDS;

    return this.gameState.currentTurnUserId;
  }

  advanceTurnWithTimer(io: AppServer): void {
    const nextId = this.advanceTurn();
    if (!this.gameState) return;
    this.gameState.status = 'active';
    io.to(this.roomCode).emit('game:state', { gameState: this.gameState });
    io.to(this.roomCode).emit('turn:changed', { playerId: nextId, timeRemaining: TURN_DURATION_SECONDS });
    this.startTurnTimer(io, () => this.advanceTurnWithTimer(io));
  }

  handlePlayerDisconnect(io: AppServer, userId: string): void {
    const player = this.getPlayer(userId);
    if (!player) return;

    player.isConnected = false;

    if (this.gameState) {
      const playerState = this.gameState.players.find((p) => p.userId === userId);
      if (playerState) playerState.isConnected = false;

      this.gameState.status = 'paused';
      this.clearTurnTimer();
      io.to(this.roomCode).emit('player:disconnected', { userId, gracePeriodSeconds: RECONNECT_GRACE_SECONDS });

      const timer = setTimeout(() => this.forfeitPlayer(io, userId), RECONNECT_GRACE_SECONDS * 1000);
      this.reconnectTimers.set(userId, timer);
    }
  }

  handlePlayerReconnect(io: AppServer, userId: string, socketId: string): void {
    const timer = this.reconnectTimers.get(userId);
    if (timer) { clearTimeout(timer); this.reconnectTimers.delete(userId); }

    const player = this.getPlayer(userId);
    if (player) { player.isConnected = true; player.socketId = socketId; }

    if (this.gameState) {
      const playerState = this.gameState.players.find((p) => p.userId === userId);
      if (playerState) playerState.isConnected = true;

      io.to(this.roomCode).emit('player:reconnected', { userId });
      io.to(this.roomCode).emit('game:state', { gameState: this.gameState });

      if (player?.isForfeited) return; // observer only — no turn timer restart

      const allConnected = this.players.filter((p) => !p.isForfeited).every((p) => p.isConnected);
      if (allConnected) {
        this.gameState.status = 'active';
        this.startTurnTimer(io, () => this.advanceTurnWithTimer(io));
      }
    }
  }

  forfeitPlayer(io: AppServer, userId: string): void {
    if (!this.gameState) return;

    const playerState = this.gameState.players.find((p) => p.userId === userId);
    if (playerState) playerState.isForfeited = true;

    const player = this.getPlayer(userId);
    if (player) player.isForfeited = true;

    const activePlayers = this.gameState.players.filter((p) => !p.isForfeited);

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      this.gameState.status = 'completed';
      this.gameState.winnerId = winner.userId;
      this.clearTurnTimer();

      const { userId: winnerId, displayName } = winner;
      const winnerPayout = GameRoom.calcPayout(this.players.length);
      const matchId = this.matchId;

      if (!matchId) {
        io.to(this.roomCode).emit('game:over', { result: { winnerId, winnerDisplayName: displayName, payouts: {} } });
        return;
      }

      Promise.all([endMatch(matchId, winnerId), payoutWinner(winnerId, winnerPayout, matchId)])
        .then(() => {
          io.to(this.roomCode).emit('game:over', { result: { winnerId, winnerDisplayName: displayName, payouts: { [winnerId]: winnerPayout } } });
          getLeaderboard().then((entries) => io.emit('leaderboard:update', { entries })).catch(() => null);
        })
        .catch(() => {
          io.to(this.roomCode).emit('game:over', { result: { winnerId, winnerDisplayName: displayName, payouts: { [winnerId]: 0 } } });
        });

      return;
    }

    if (this.gameState.currentTurnUserId === userId) {
      io.to(this.roomCode).emit('game:state', { gameState: this.gameState });
      this.advanceTurnWithTimer(io);
    } else {
      this.gameState.status = 'active';
      io.to(this.roomCode).emit('game:state', { gameState: this.gameState });
    }
  }

  getPawnsByPlayer(userId: string): Pawn[] {
    return this.gameState?.players.find((p) => p.userId === userId)?.pawns ?? [];
  }

  cleanup(): void {
    this.clearTurnTimer();
    this.reconnectTimers.forEach((t) => clearTimeout(t));
    this.reconnectTimers.clear();
  }

  static calcPayout(playerCount: number): number {
    return Math.floor(playerCount * GameRoom.ENTRY_FEE * PAYOUT_MULTIPLIER);
  }

  static readonly ENTRY_FEE = ENTRY_FEE;
  static readonly TURN_DURATION_SECONDS = TURN_DURATION_SECONDS;
}
