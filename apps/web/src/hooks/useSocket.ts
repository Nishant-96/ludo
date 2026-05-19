import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/store/gameStore';
import { useRoomStore } from '@/store/roomStore';
import { useUserStore } from '@/store/userStore';
import { sounds } from '@/lib/sounds';
import type { ServerToClientEvents } from '@ludo/shared';
import { ENTRY_FEE } from '@/lib/constants';

// Extract the handler type for a given server→client event
type EventHandler<E extends keyof ServerToClientEvents> = ServerToClientEvents[E];

// Register all global socket event listeners.
// Call once at the app level after the socket is connected.
export const useSocket = (): void => {
  const { setGameState, updateDiceResult, setDisconnectedPlayer, setMatchPayouts, setKilledPawnId, setReplayVoteState, setReplayCancelledReason } = useGameStore();
  const { setRoom, addPlayer, updatePlayerConnection, setSocketConnected, setSocketReconnectFailed, setGracePeriodRemaining } = useRoomStore();
  const { updateBalance } = useUserStore();

  // Grace period countdown interval — kept in a ref so it survives re-renders
  const gracePeriodTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearGraceTimer = (): void => {
    if (gracePeriodTimerRef.current) {
      clearInterval(gracePeriodTimerRef.current);
      gracePeriodTimerRef.current = null;
    }
  };

  useEffect(() => {
    let socket: ReturnType<typeof getSocket>;

    try {
      socket = getSocket();
    } catch {
      // Socket not yet connected — will retry on next render
      return;
    }

    // ── Server→Client handlers — explicitly typed, no `as any` ──

    const onRoomState: EventHandler<'room:state'> = ({ room }) => {
      setRoom(room);
    };

    const onGameState: EventHandler<'game:state'> = ({ gameState }) => {
      setGameState(gameState);
    };

    const onPlayerJoined: EventHandler<'player:joined'> = ({ player }) => {
      addPlayer(player);
    };

    const onPlayerDisconnected: EventHandler<'player:disconnected'> = ({ userId, gracePeriodSeconds }) => {
      updatePlayerConnection(userId, false);
      setDisconnectedPlayer(userId);
      sounds.play('disconnect');

      clearGraceTimer();
      setGracePeriodRemaining(gracePeriodSeconds);
      let remaining = gracePeriodSeconds;
      gracePeriodTimerRef.current = setInterval(() => {
        remaining -= 1;
        setGracePeriodRemaining(remaining > 0 ? remaining : null);
        if (remaining <= 0) clearGraceTimer();
      }, 1000);
    };

    const onPlayerReconnected: EventHandler<'player:reconnected'> = ({ userId }) => {
      updatePlayerConnection(userId, true);
      setDisconnectedPlayer(null);
      clearGraceTimer();
      setGracePeriodRemaining(null);
    };

    const onDiceResult: EventHandler<'dice:result'> = ({ value, validMoves }) => {
      updateDiceResult(value, validMoves);
      sounds.play('dice');
    };

    const onPawnMoved: EventHandler<'pawn:moved'> = ({ kill, reachedHome }) => {
      sounds.play('move');
      if (reachedHome) sounds.play('home');
      if (kill) {
        sounds.play('kill');
        const { gameState: gs } = useGameStore.getState();
        const killedPlayer = gs?.players.find((p) => p.userId === kill.killedUserId);
        if (killedPlayer) {
          const pawnId = `${killedPlayer.color}-${kill.killedPawnIndex}`;
          setKilledPawnId(pawnId);
          setTimeout(() => setKilledPawnId(null), 600);
        }
      }
    };

    const onTimerTick: EventHandler<'timer:tick'> = ({ timeRemaining }) => {
      useGameStore.setState((state) => {
        if (!state.gameState) return state;
        return { gameState: { ...state.gameState, timeRemaining } };
      });
      if (timeRemaining === 10) sounds.play('timerWarning');
    };

    const onReplayPending: EventHandler<'game:replay:pending'> = ({ displayName, votes, required }) => {
      setReplayVoteState({ votes, required, requestedByName: displayName });
    };

    const onReplayCancelled: EventHandler<'game:replay:cancelled'> = ({ reason }) => {
      setReplayCancelledReason(reason);
      setReplayVoteState(null);
    };

    const onGameOver: EventHandler<'game:over'> = ({ result }) => {
      useGameStore.setState((state) => {
        if (!state.gameState) return state;
        return { gameState: { ...state.gameState, status: 'completed', winnerId: result.winnerId } };
      });
      setMatchPayouts(result.payouts);
      clearGraceTimer();
      setGracePeriodRemaining(null);
      // Reconcile local wallet balance.
      // The server has already deducted the entry fee and paid the winner.
      // Winners: balance += payout (net positive after entry fee was deducted at game start)
      // Losers:  balance -= ENTRY_FEE (fee was deducted at game start; no payout)
      const { user, balance } = useUserStore.getState();
      if (user) {
        const payout = result.payouts[user.id] ?? 0;
        if (payout > 0) {
          updateBalance(balance + payout);
        } else {
          updateBalance(Math.max(0, balance - ENTRY_FEE));
        }
      }
      sounds.play('winner');
    };

    // Track own socket connectivity for reconnecting overlay
    const handleDisconnect = (): void => setSocketConnected(false);
    const handleConnect = (): void => {
      setSocketConnected(true);
      setSocketReconnectFailed(false);
    };
    const handleReconnectFailed = (): void => setSocketReconnectFailed(true);

    socket.on('room:state', onRoomState);
    socket.on('game:state', onGameState);
    socket.on('player:joined', onPlayerJoined);
    socket.on('player:disconnected', onPlayerDisconnected);
    socket.on('player:reconnected', onPlayerReconnected);
    socket.on('dice:result', onDiceResult);
    socket.on('pawn:moved', onPawnMoved);
    socket.on('timer:tick', onTimerTick);
    socket.on('game:replay:pending', onReplayPending);
    socket.on('game:replay:cancelled', onReplayCancelled);
    socket.on('game:over', onGameOver);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);
    socket.io.on('reconnect_failed', handleReconnectFailed);

    return () => {
      socket.off('room:state', onRoomState);
      socket.off('game:state', onGameState);
      socket.off('player:joined', onPlayerJoined);
      socket.off('player:disconnected', onPlayerDisconnected);
      socket.off('player:reconnected', onPlayerReconnected);
      socket.off('dice:result', onDiceResult);
      socket.off('pawn:moved', onPawnMoved);
      socket.off('timer:tick', onTimerTick);
      socket.off('game:replay:pending', onReplayPending);
      socket.off('game:replay:cancelled', onReplayCancelled);
      socket.off('game:over', onGameOver);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
      socket.io.off('reconnect_failed', handleReconnectFailed);
      clearGraceTimer();
    };
  }, [setGameState, updateDiceResult, setDisconnectedPlayer, setMatchPayouts, setKilledPawnId, setReplayVoteState, setReplayCancelledReason, setRoom, addPlayer, updatePlayerConnection, setSocketConnected, setSocketReconnectFailed, setGracePeriodRemaining, updateBalance]);
};
