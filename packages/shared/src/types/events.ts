import type { Room, RoomPlayer, RoomSummary } from "./room";
import type { GameState, KillEvent, MatchResult, PawnIndex } from "./game";

export interface ClientToServerEvents {
  "room:create": (
    payload: { capacity: 2 | 3 | 4 },
    callback: (res: SocketResponse<{ room: Room }>) => void,
  ) => void;
  "room:join": (
    payload: { roomCode: string },
    callback: (res: SocketResponse<{ room: Room }>) => void,
  ) => void;
  "game:start": (
    payload: { roomCode: string },
    callback: (res: SocketResponse<null>) => void,
  ) => void;
  "dice:roll": (
    payload: { roomCode: string },
    callback: (res: SocketResponse<null>) => void,
  ) => void;
  "move:pawn": (
    payload: { roomCode: string; pawnIndex: PawnIndex },
    callback: (res: SocketResponse<null>) => void,
  ) => void;
  "chat:send": (
    payload: { roomCode: string; message: string },
    callback: (res: SocketResponse<null>) => void,
  ) => void;
  "game:replay": (
    payload: { roomCode: string },
    callback: (res: SocketResponse<null>) => void,
  ) => void;
  "game:replay:vote": (
    payload: { roomCode: string; vote: "yes" | "no" },
    callback: (res: SocketResponse<null>) => void,
  ) => void;
  "game:forfeit": (
    payload: { roomCode: string },
    callback: (res: SocketResponse<null>) => void,
  ) => void;
  "room:leave": (payload: { roomCode: string }) => void;
}

export interface ServerToClientEvents {
  "room:state": (payload: { room: Room }) => void;
  "game:state": (payload: { gameState: GameState }) => void;
  "player:joined": (payload: { player: RoomPlayer }) => void;
  "player:disconnected": (payload: {
    userId: string;
    gracePeriodSeconds: number;
  }) => void;
  "player:reconnected": (payload: { userId: string }) => void;
  "player:left": (payload: { userId: string }) => void;
  "dice:result": (payload: {
    value: number;
    playerId: string;
    validMoves: PawnIndex[];
  }) => void;
  "pawn:moved": (payload: {
    pawnIndex: PawnIndex;
    playerId: string;
    path: number[];
    kill: KillEvent | null;
    reachedHome: boolean;
  }) => void;
  "turn:changed": (payload: {
    playerId: string;
    timeRemaining: number;
  }) => void;
  "timer:tick": (payload: { timeRemaining: number }) => void;
  "chat:message": (payload: {
    senderId: string;
    displayName: string;
    message: string;
    timestamp: string;
  }) => void;
  "game:over": (payload: { result: MatchResult }) => void;
  "game:replay:pending": (payload: {
    requestedBy: string;
    displayName: string;
    votes: number;
    required: number;
  }) => void;
  "game:replay:cancelled": (payload: { reason: string }) => void;
  "leaderboard:update": (payload: { entries: LeaderboardEntry[] }) => void;
  "lobby:rooms": (payload: { rooms: RoomSummary[] }) => void;
  error: (payload: { code: string; message: string }) => void;
}

export interface SocketResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  balance: number;
  rank: number;
}
