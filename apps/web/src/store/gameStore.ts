import { create } from 'zustand';
import type { GameState, PawnIndex } from '@ludo/shared';

export interface ReplayVoteState {
  votes: number;
  required: number;
  requestedByName: string;
}

interface GameStore {
  gameState: GameState | null;
  disconnectedUserId: string | null;
  matchPayouts: Record<string, number> | null;
  killedPawnId: string | null; // briefly set on kill for animation; cleared after 600ms
  replayVoteState: ReplayVoteState | null;
  replayCancelledReason: string | null;
  setGameState: (gameState: GameState) => void;
  updateDiceResult: (value: number, validMoves: PawnIndex[]) => void;
  setDisconnectedPlayer: (userId: string | null) => void;
  setMatchPayouts: (payouts: Record<string, number>) => void;
  setKilledPawnId: (pawnId: string | null) => void;
  setReplayVoteState: (state: ReplayVoteState | null) => void;
  setReplayCancelledReason: (reason: string | null) => void;
  clearGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  disconnectedUserId: null,
  matchPayouts: null,
  killedPawnId: null,
  replayVoteState: null,
  replayCancelledReason: null,

  setGameState: (gameState) => set({ gameState }),

  updateDiceResult: (value, validMoves) =>
    set((state) => {
      if (!state.gameState) return state;
      return {
        gameState: {
          ...state.gameState,
          lastDiceValue: value,
          validMoves,
        },
      };
    }),

  setDisconnectedPlayer: (userId) => set({ disconnectedUserId: userId }),

  setMatchPayouts: (payouts) => set({ matchPayouts: payouts }),

  setKilledPawnId: (pawnId) => set({ killedPawnId: pawnId }),

  setReplayVoteState: (state) => set({ replayVoteState: state }),

  setReplayCancelledReason: (reason) => set({ replayCancelledReason: reason }),

  clearGame: () => set({
    gameState: null,
    disconnectedUserId: null,
    matchPayouts: null,
    killedPawnId: null,
    replayVoteState: null,
    replayCancelledReason: null,
  }),
}));
