import type { PlayerColor } from './user';

export type RoomStatus = 'waiting' | 'active' | 'paused' | 'completed';

export type RoomCapacity = 2 | 3 | 4;

export interface RoomPlayer {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  color: PlayerColor;
  corner: 0 | 1 | 2 | 3;
  isConnected: boolean;
}

export interface Room {
  id: string;
  code: string;
  capacity: RoomCapacity;
  status: RoomStatus;
  createdBy: string;
  players: RoomPlayer[];
  createdAt: string;
}

export interface RoomSummary {
  id: string;
  code: string;
  capacity: RoomCapacity;
  status: RoomStatus;
  playerCount: number;
  participantIds: string[];
  createdAt: string;
}
