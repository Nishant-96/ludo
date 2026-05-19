import type { AppServer, AppSocket } from '../index';
import type { GameRoomRegistry } from '../../game/GameRoomRegistry';
import { LudoEngine } from '../../game/LudoEngine';
import { GameRoom } from '../../game/GameRoom';
import { deductEntryFees, payoutWinner } from '../../db/queries/wallets';
import { createMatch, recordMove, endMatch, deleteMatch } from '../../db/queries/matches';
import { updateRoomStatus } from '../../db/queries/rooms';
import { getLeaderboard } from '../../db/queries/chats';

const ENTRY_FEE = 100;
const TURN_DURATION_SECONDS = GameRoom.TURN_DURATION_SECONDS;

// 80% of pool goes to winner, 20% is platform fee
const calcPayout = (playerCount: number): number =>
  Math.floor(playerCount * ENTRY_FEE * 0.8);

export const registerGameHandlers = (
  io: AppServer,
  socket: AppSocket,
  registry: GameRoomRegistry
): void => {
  socket.on('game:start', async ({ roomCode }, callback) => {
    try {
      const gameRoom = registry.get(roomCode);
      if (!gameRoom) {
        callback({ ok: false, error: 'Room not found' });
        return;
      }

      if (gameRoom.gameState !== null) {
        callback({ ok: false, error: 'Game already started' });
        return;
      }

      // Only the room host (first connected player) may start the game
      const host = gameRoom.players.find((p) => p.isConnected);
      if (host?.userId !== socket.userId) {
        callback({ ok: false, error: 'Only the host can start the game' });
        return;
      }

      if (gameRoom.players.length < 2) {
        callback({ ok: false, error: 'At least 2 players are required to start' });
        return;
      }

      if (!gameRoom.roomId) {
        callback({ ok: false, error: 'Room ID not found' });
        return;
      }

      const playerIds = gameRoom.players.map((p) => p.userId);
      const colors = gameRoom.players.map((p) => p.color);

      // Create match record, then deduct fees. Fee deduction can fail if a player's
      // balance dropped between joining and the host clicking Start. On failure, roll
      // back the match rows so the DB stays clean — no dangling orphaned records.
      const matchId = await createMatch(gameRoom.roomId, playerIds, colors);
      try {
        await deductEntryFees(playerIds, ENTRY_FEE, matchId);
      } catch (feeErr) {
        await deleteMatch(matchId).catch(() => null);
        throw feeErr;
      }

      // Close room to new joiners
      await updateRoomStatus(gameRoom.roomId, 'active');

      gameRoom.initGameState(matchId);
      const gs = gameRoom.gameState!;
      io.to(roomCode).emit('game:state', { gameState: gs });
      io.to(roomCode).emit('turn:changed', {
        playerId: gs.currentTurnUserId,
        timeRemaining: TURN_DURATION_SECONDS,
      });

      // Start server-side turn timer
      gameRoom.startTurnTimer(io, () => handleTimerExpiry(io, socket, registry, roomCode));

      callback({ ok: true, data: null });
    } catch (err) {
      console.error('game:start error:', err);
      callback({ ok: false, error: 'Failed to start game' });
    }
  });

  socket.on('dice:roll', async ({ roomCode }, callback) => {
    try {
      const gameRoom = registry.get(roomCode);
      const gameState = gameRoom?.gameState;

      if (!gameRoom || !gameState) {
        callback({ ok: false, error: 'No active game in this room' });
        return;
      }

      if (gameState.status !== 'active') {
        callback({ ok: false, error: 'Game is not active' });
        return;
      }

      if (gameState.currentTurnUserId !== socket.userId) {
        callback({ ok: false, error: 'Not your turn' });
        return;
      }

      if (gameState.lastDiceValue !== null) {
        callback({ ok: false, error: 'Already rolled this turn' });
        return;
      }

      const value = LudoEngine.rollDice();
      const playerState = gameState.players.find((p) => p.userId === socket.userId);
      if (!playerState) {
        callback({ ok: false, error: 'Player not found in game' });
        return;
      }

      const validMoves = LudoEngine.getValidMoves(playerState, value);

      gameState.lastDiceValue = value;
      gameState.validMoves = validMoves;

      io.to(roomCode).emit('dice:result', {
        value,
        playerId: socket.userId,
        validMoves,
      });

      // If no valid moves — auto-advance turn (unless 6 was rolled with no moves, still no move)
      if (validMoves.length === 0) {
        gameRoom.clearTurnTimer();
        gameRoom.advanceTurnWithTimer(io);
      }

      callback({ ok: true, data: null });
    } catch (err) {
      console.error('dice:roll error:', err);
      callback({ ok: false, error: 'Failed to roll dice' });
    }
  });

  socket.on('move:pawn', async ({ roomCode, pawnIndex }, callback) => {
    try {
      const gameRoom = registry.get(roomCode);
      const gameState = gameRoom?.gameState;

      if (!gameRoom || !gameState) {
        callback({ ok: false, error: 'No active game in this room' });
        return;
      }

      if (gameState.currentTurnUserId !== socket.userId) {
        callback({ ok: false, error: 'Not your turn' });
        return;
      }

      if (gameState.lastDiceValue === null) {
        callback({ ok: false, error: 'Must roll dice first' });
        return;
      }

      if (!gameState.validMoves.includes(pawnIndex)) {
        callback({ ok: false, error: 'Invalid pawn selection' });
        return;
      }

      const playerState = gameState.players.find((p) => p.userId === socket.userId);
      if (!playerState) {
        callback({ ok: false, error: 'Player not found in game' });
        return;
      }

      const validation = LudoEngine.validateMove(playerState, pawnIndex, gameState.lastDiceValue);
      if (!validation.valid) {
        callback({ ok: false, error: validation.reason });
        return;
      }

      const diceValue = gameState.lastDiceValue;
      const fromPos = playerState.pawns[pawnIndex].position;

      const result = LudoEngine.applyMove(playerState, gameState.players, pawnIndex, diceValue);

      // Update pawn in game state
      playerState.pawns[pawnIndex] = result.updatedPawn;

      // Handle kill — send opponent pawn to base
      if (result.kill) {
        const killedPlayer = gameState.players.find((p) => p.userId === result.kill!.killedUserId);
        if (killedPlayer) {
          killedPlayer.pawns[result.kill.killedPawnIndex] = LudoEngine.sendToBase(
            killedPlayer.pawns[result.kill.killedPawnIndex]
          );
        }
      }

      // Persist move (non-blocking — don't await in critical path)
      if (gameRoom.matchId) {
        recordMove({
          matchId: gameRoom.matchId,
          userId: socket.userId,
          diceValue,
          pawnIndex,
          fromPos,
          toPos: result.updatedPawn.position,
        }).catch((err) => console.error('recordMove failed:', err));
      }

      io.to(roomCode).emit('pawn:moved', {
        pawnIndex,
        playerId: socket.userId,
        path: result.path,
        kill: result.kill,
        reachedHome: result.reachedHome,
      });

      // Check win
      if (LudoEngine.checkWin(playerState)) {
        await handleGameOver(io, gameRoom, roomCode, socket.userId, registry);
        callback({ ok: true, data: null });
        return;
      }

      gameRoom.clearTurnTimer();

      // Rolling a 6 grants an extra turn (unless the player just won)
      if (LudoEngine.grantsExtraTurn(diceValue)) {
        gameState.lastDiceValue = null;
        gameState.validMoves = [];
        gameState.timeRemaining = TURN_DURATION_SECONDS;
        io.to(roomCode).emit('turn:changed', {
          playerId: socket.userId,
          timeRemaining: TURN_DURATION_SECONDS,
        });
        gameRoom.startTurnTimer(io, () => gameRoom.advanceTurnWithTimer(io));
      } else {
        gameRoom.advanceTurnWithTimer(io);
      }

      callback({ ok: true, data: null });
    } catch (err) {
      console.error('move:pawn error:', err);
      callback({ ok: false, error: 'Failed to apply move' });
    }
  });

  // ─── Replay consent flow ────────────────────────────────────────────────────
  // Requires all active (non-forfeited) players to vote 'yes' before replay starts.
  // 'no' vote cancels the replay; voter leaves (they can rejoin later as a new player).
  // Votes are tracked in a per-room Map on the registry; cleared on replay or cancel.

  socket.on('game:replay:vote', async ({ roomCode, vote }, callback) => {
    try {
      const gameRoom = registry.get(roomCode);
      if (!gameRoom?.gameState) {
        callback({ ok: false, error: 'No completed game' });
        return;
      }

      if (gameRoom.gameState.status !== 'completed') {
        callback({ ok: false, error: 'Game is not completed' });
        return;
      }

      const activePlayers = gameRoom.players.filter((p) => !p.isForfeited);
      const votingPlayer = gameRoom.getPlayer(socket.userId);
      if (!votingPlayer) {
        callback({ ok: false, error: 'Player not in room' });
        return;
      }

      if (vote === 'no') {
        // Cancel replay — inform everyone, remove the voter from room players,
        // and evict them from the Socket.IO room so they stop receiving game events.
        gameRoom.removePlayer(socket.userId);
        registry.untrackUser(socket.userId);
        socket.leave(roomCode);
        io.to(roomCode).emit('game:replay:cancelled', {
          reason: `${votingPlayer.displayName} declined to play again`,
        });
        callback({ ok: true, data: null });
        return;
      }

      // Record 'yes' vote in registry
      const votes = registry.getOrCreateReplayVotes(roomCode);
      votes.add(socket.userId);

      const required = activePlayers.length;
      const currentVotes = votes.size;

      // Broadcast current vote tally
      io.to(roomCode).emit('game:replay:pending', {
        requestedBy: socket.userId,
        displayName: votingPlayer.displayName,
        votes: currentVotes,
        required,
      });

      if (currentVotes < required) {
        callback({ ok: true, data: null });
        return;
      }

      // All players voted yes — start replay
      registry.clearReplayVotes(roomCode);

      if (!gameRoom.roomId) {
        callback({ ok: false, error: 'Room ID not found' });
        return;
      }

      const playerIds = gameRoom.players.map((p) => p.userId);
      const colors = gameRoom.players.map((p) => p.color);

      const matchId = await createMatch(gameRoom.roomId, playerIds, colors);
      await deductEntryFees(playerIds, ENTRY_FEE, matchId);

      gameRoom.gameState = null;
      gameRoom.matchId = null;
      gameRoom.initGameState(matchId);
      const rs = gameRoom.gameState!;
      io.to(roomCode).emit('game:state', { gameState: rs });
      io.to(roomCode).emit('turn:changed', {
        playerId: rs.currentTurnUserId,
        timeRemaining: TURN_DURATION_SECONDS,
      });

      gameRoom.startTurnTimer(io, () =>
        handleTimerExpiry(io, socket, registry, roomCode)
      );

      callback({ ok: true, data: null });
    } catch (err) {
      console.error('game:replay:vote error:', err);
      callback({ ok: false, error: 'Failed to process replay vote' });
    }
  });

  // Keep game:replay for direct replay (host-only, single player case)
  socket.on('game:replay', async ({ roomCode }, callback) => {
    try {
      const gameRoom = registry.get(roomCode);
      if (!gameRoom?.gameState) {
        callback({ ok: false, error: 'No completed game to replay' });
        return;
      }

      if (gameRoom.gameState.status !== 'completed') {
        callback({ ok: false, error: 'Game is not yet completed' });
        return;
      }

      if (gameRoom.players.length > 1) {
        // Multi-player: use the consent flow instead
        callback({ ok: false, error: 'Use game:replay:vote for multiplayer replay' });
        return;
      }

      // Single player replay (edge case)
      if (!gameRoom.roomId) {
        callback({ ok: false, error: 'Room ID not found' });
        return;
      }

      const playerIds = gameRoom.players.map((p) => p.userId);
      const colors = gameRoom.players.map((p) => p.color);

      const matchId = await createMatch(gameRoom.roomId, playerIds, colors);
      await deductEntryFees(playerIds, ENTRY_FEE, matchId);

      gameRoom.gameState = null;
      gameRoom.matchId = null;
      gameRoom.initGameState(matchId);
      const rs = gameRoom.gameState!;
      io.to(roomCode).emit('game:state', { gameState: rs });
      io.to(roomCode).emit('turn:changed', {
        playerId: rs.currentTurnUserId,
        timeRemaining: TURN_DURATION_SECONDS,
      });

      gameRoom.startTurnTimer(io, () =>
        handleTimerExpiry(io, socket, registry, roomCode)
      );

      callback({ ok: true, data: null });
    } catch (err) {
      console.error('game:replay error:', err);
      callback({ ok: false, error: 'Failed to start replay' });
    }
  });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const handleTimerExpiry = (
  io: AppServer,
  _socket: AppSocket,
  registry: GameRoomRegistry,
  roomCode: string
): void => {
  const gameRoom = registry.get(roomCode);
  if (!gameRoom) return;
  // clearTurnTimer is a no-op if the timer already fired, but guards against
  // a race where expiry fires and then a move is played in the same tick.
  gameRoom.clearTurnTimer();
  gameRoom.advanceTurnWithTimer(io);
};

const handleGameOver = async (
  io: AppServer,
  gameRoom: InstanceType<typeof import('../../game/GameRoom').GameRoom>,
  roomCode: string,
  winnerId: string,
  registry: GameRoomRegistry
): Promise<void> => {
  gameRoom.clearTurnTimer();

  const { gameState, matchId } = gameRoom;
  if (!gameState || !matchId) return;

  gameState.status = 'completed';
  gameState.winnerId = winnerId;

  const playerCount = gameRoom.players.length;
  const winnerPayout = calcPayout(playerCount);

  await Promise.all([
    endMatch(matchId, winnerId),
    payoutWinner(winnerId, winnerPayout, matchId),
  ]);

  const winnerPlayer = gameState.players.find((p) => p.userId === winnerId);
  const payouts: Record<string, number> = { [winnerId]: winnerPayout };

  io.to(roomCode).emit('game:over', {
    result: {
      winnerId,
      winnerDisplayName: winnerPlayer?.displayName ?? 'Unknown',
      payouts,
    },
  });

  // Broadcast updated leaderboard to all connected clients
  getLeaderboard().then((entries) => {
    io.emit('leaderboard:update', { entries });
  }).catch((err) => console.error('leaderboard:update error:', err));

  // Clean up: release memory for completed room and untrack all players
  gameRoom.players.forEach((p) => registry.untrackUser(p.userId));
  gameRoom.cleanup();
  registry.delete(roomCode);
};
