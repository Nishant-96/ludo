import { create } from "zustand";
import type { Room, RoomPlayer } from "@ludo/shared";

interface RoomStore {
  room: Room | null;
  isSocketConnected: boolean;
  isSocketReconnectFailed: boolean;
  gracePeriodRemaining: number | null;
  setRoom: (room: Room) => void;
  addPlayer: (player: RoomPlayer) => void;
  removePlayer: (userId: string) => void;
  updatePlayerConnection: (userId: string, isConnected: boolean) => void;
  setSocketConnected: (connected: boolean) => void;
  setSocketReconnectFailed: (failed: boolean) => void;
  setGracePeriodRemaining: (seconds: number | null) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  isSocketConnected: true,
  isSocketReconnectFailed: false,
  gracePeriodRemaining: null,
  setRoom: (room) => set({ room }),
  addPlayer: (player) =>
    set((state) => {
      if (!state.room) return state;
      const exists = state.room.players.some((p) => p.userId === player.userId);
      if (exists) return state;
      return {
        room: { ...state.room, players: [...state.room.players, player] },
      };
    }),
  removePlayer: (userId) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          players: state.room.players.filter((p) => p.userId !== userId),
        },
      };
    }),
  updatePlayerConnection: (userId, isConnected) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          players: state.room.players.map((p) =>
            p.userId === userId ? { ...p, isConnected } : p,
          ),
        },
      };
    }),
  setSocketConnected: (connected) => set({ isSocketConnected: connected }),
  setSocketReconnectFailed: (failed) =>
    set({ isSocketReconnectFailed: failed }),
  setGracePeriodRemaining: (seconds) => set({ gracePeriodRemaining: seconds }),
  clearRoom: () =>
    set({
      room: null,
      isSocketConnected: true,
      isSocketReconnectFailed: false,
      gracePeriodRemaining: null,
    }),
}));
