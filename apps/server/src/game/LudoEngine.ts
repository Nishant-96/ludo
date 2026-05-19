import type { Pawn, PawnIndex, PlayerGameState, PlayerColor, KillEvent } from '@ludo/shared';
import {
  HOME_POSITION,
  SAFE_TILES,
  relativeToAbsolute,
  isOnMainTrack,
  isInBase,
} from './BoardLayout';

export interface MoveResult {
  updatedPawn: Pawn;
  path: number[];           // relative positions traversed (for frontend animation)
  kill: KillEvent | null;
  reachedHome: boolean;
}

export interface ValidationError {
  valid: false;
  reason: string;
}

export interface ValidationSuccess {
  valid: true;
}

export type ValidationResult = ValidationError | ValidationSuccess;

export class LudoEngine {
  // ─── Initial State ──────────────────────────────────────────────────────────

  static createInitialPawns(color: PlayerColor): [Pawn, Pawn, Pawn, Pawn] {
    return [0, 1, 2, 3].map((index) => ({
      id: `${color}-${index}`,
      color,
      index: index as PawnIndex,
      position: -1, // in base
      isHome: false,
    })) as [Pawn, Pawn, Pawn, Pawn];
  }

  // ─── Valid Moves ────────────────────────────────────────────────────────────

  // Returns indices (0–3) of pawns that can legally move given a dice value.
  static getValidMoves(playerState: PlayerGameState, diceValue: number): PawnIndex[] {
    return playerState.pawns
      .filter((pawn: Pawn) => !pawn.isHome)
      .filter((pawn: Pawn) => LudoEngine.canMove(pawn, diceValue))
      .map((pawn: Pawn) => pawn.index);
  }

  private static canMove(pawn: Pawn, diceValue: number): boolean {
    // Pawn in base: only a 6 can bring it out
    if (isInBase(pawn.position)) return diceValue === 6;

    const newPos = pawn.position + diceValue;

    // Cannot overshoot home
    if (newPos > HOME_POSITION) return false;

    return true;
  }

  // ─── Move Validation ────────────────────────────────────────────────────────

  static validateMove(
    playerState: PlayerGameState,
    pawnIndex: number,
    diceValue: number
  ): ValidationResult {
    if (pawnIndex < 0 || pawnIndex > 3) {
      return { valid: false, reason: 'Invalid pawn index' };
    }

    const pawn = playerState.pawns[pawnIndex];

    if (pawn.isHome) {
      return { valid: false, reason: 'Pawn is already home' };
    }

    if (!LudoEngine.canMove(pawn, diceValue)) {
      return { valid: false, reason: 'Pawn cannot move with this dice value' };
    }

    return { valid: true };
  }

  // ─── Apply Move ─────────────────────────────────────────────────────────────

  static applyMove(
    movingPlayer: PlayerGameState,
    allPlayers: PlayerGameState[],
    pawnIndex: number,
    diceValue: number
  ): MoveResult {
    const pawn = movingPlayer.pawns[pawnIndex];
    const fromPos = pawn.position;

    // Compute new position
    const toPos = isInBase(fromPos) ? 0 : fromPos + diceValue;

    // Build animation path (every step the pawn moves through)
    const path = LudoEngine.buildPath(fromPos, toPos);

    // Check for kill — only on main track, not home column
    const kill = LudoEngine.checkKill(movingPlayer.color, toPos, allPlayers);

    const reachedHome = toPos === HOME_POSITION;

    const updatedPawn: Pawn = {
      ...pawn,
      position: toPos,
      isHome: reachedHome,
    };

    return { updatedPawn, path, kill, reachedHome };
  }

  // ─── Path Building ──────────────────────────────────────────────────────────

  // Returns every relative position the pawn passes through (inclusive of destination).
  // fromPos === -1 means the pawn is leaving base (path starts at 0).
  private static buildPath(fromPos: number, toPos: number): number[] {
    if (isInBase(fromPos)) return [0]; // single step out of base

    const path: number[] = [];
    for (let pos = fromPos + 1; pos <= toPos; pos++) {
      path.push(pos);
    }
    return path;
  }

  // ─── Kill Logic ─────────────────────────────────────────────────────────────

  private static checkKill(
    movingColor: PlayerColor,
    landingRelativePos: number,
    allPlayers: PlayerGameState[]
  ): KillEvent | null {
    // Kills only happen on the main track (0–51)
    if (!isOnMainTrack(landingRelativePos)) return null;

    const landingAbsolute = relativeToAbsolute(movingColor, landingRelativePos);

    // Safe tiles — no kill
    if (SAFE_TILES.has(landingAbsolute)) return null;

    for (const player of allPlayers) {
      if (player.color === movingColor) continue;
      if (player.isForfeited) continue;

      for (const pawn of player.pawns) {
        if (pawn.isHome || isInBase(pawn.position)) continue;
        if (!isOnMainTrack(pawn.position)) continue;

        const opponentAbsolute = relativeToAbsolute(player.color, pawn.position);
        if (opponentAbsolute === landingAbsolute) {
          return { killedPawnIndex: pawn.index, killedUserId: player.userId };
        }
      }
    }

    return null;
  }

  // ─── Win Check ──────────────────────────────────────────────────────────────

  static checkWin(playerState: PlayerGameState): boolean {
    return playerState.pawns.every((pawn) => pawn.isHome);
  }

  // ─── Dice Roll ──────────────────────────────────────────────────────────────

  // Always generated server-side. Never trust client dice values.
  static rollDice(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  // A player gets an extra turn if they rolled a 6
  static grantsExtraTurn(diceValue: number): boolean {
    return diceValue === 6;
  }

  // ─── State Mutation Helpers ─────────────────────────────────────────────────

  // Send a killed pawn back to base. Returns the updated pawn.
  static sendToBase(pawn: Pawn): Pawn {
    return { ...pawn, position: -1, isHome: false };
  }
}
