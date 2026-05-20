import type { PlayerColor } from './user';

export type BoardPosition = number; // -1 = base, 0-51 = main track, 52-57 = home column, 58 = home

export type PawnIndex = 0 | 1 | 2 | 3;

export interface Pawn {
  id: string; // e.g. "red-0"
  color: PlayerColor;
  index: PawnIndex;
  position: BoardPosition;
  isHome: boolean;
}

export interface PlayerGameState {
  userId: string;
  displayName: string;
  color: PlayerColor;
  corner: 0 | 1 | 2 | 3;
  pawns: [Pawn, Pawn, Pawn, Pawn];
  isConnected: boolean;
  isForfeited: boolean;
}

export type GameStatus = 'waiting' | 'starting' | 'active' | 'paused' | 'completed';

export interface GameState {
  matchId: string;
  roomCode: string;
  status: GameStatus;
  players: PlayerGameState[];
  currentTurnUserId: string;
  turnOrder: string[];
  timeRemaining: number;
  lastDiceValue: number | null;
  validMoves: PawnIndex[];
  winnerId: string | null;
}

export interface KillEvent {
  killedPawnIndex: PawnIndex;
  killedUserId: string;
}

export interface MatchResult {
  winnerId: string;
  winnerDisplayName: string;
  payouts: Record<string, number>; // userId → coins received
}
