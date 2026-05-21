import { create } from "zustand";
import type { GameState, PawnIndex } from "@ludo/shared";

export interface ReplayVoteState {
  votes: number;
  required: number;
  requestedByName: string;
}

interface GameStore {
  gameState: GameState | null;
  disconnectedUserId: string | null;
  matchPayouts: Record<string, number> | null;
  killedPawnId: string | null;
  replayVoteState: ReplayVoteState | null;
  replayCancelledReason: string | null;
  animatingPawnPositions: Record<string, number>;
  setGameState: (gameState: GameState) => void;
  updateDiceResult: (value: number, validMoves: PawnIndex[]) => void;
  setDisconnectedPlayer: (userId: string | null) => void;
  setMatchPayouts: (payouts: Record<string, number>) => void;
  setKilledPawnId: (pawnId: string | null) => void;
  setReplayVoteState: (state: ReplayVoteState | null) => void;
  setReplayCancelledReason: (reason: string | null) => void;
  setAnimatingPawnPosition: (pawnId: string, position: number | null) => void;
  clearGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  disconnectedUserId: null,
  matchPayouts: null,
  killedPawnId: null,
  replayVoteState: null,
  replayCancelledReason: null,
  animatingPawnPositions: {},

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

  setAnimatingPawnPosition: (pawnId, position) =>
    set((state) => {
      if (position === null) {
        const { [pawnId]: _, ...rest } = state.animatingPawnPositions;
        return { animatingPawnPositions: rest };
      }
      return {
        animatingPawnPositions: {
          ...state.animatingPawnPositions,
          [pawnId]: position,
        },
      };
    }),

  clearGame: () =>
    set({
      gameState: null,
      disconnectedUserId: null,
      matchPayouts: null,
      killedPawnId: null,
      replayVoteState: null,
      replayCancelledReason: null,
      animatingPawnPositions: {},
    }),
}));
