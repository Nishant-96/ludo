import { type FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Confetti } from './Confetti';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/store/gameStore';
import type { GameState } from '@ludo/shared';
import { ENTRY_FEE } from '@/lib/constants';

interface WinnerScreenProps {
  gameState: GameState;
  currentUserId: string;
  roomCode: string;
}

export const WinnerScreen: FC<WinnerScreenProps> = ({ gameState, currentUserId, roomCode }) => {
  const navigate = useNavigate();
  const { matchPayouts, replayVoteState, replayCancelledReason } = useGameStore();
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const winner = gameState.players.find((p) => p.userId === gameState.winnerId);
  const isWinner = gameState.winnerId === currentUserId;
  const myPayout = matchPayouts?.[currentUserId] ?? null;
  const isMultiplayer = gameState.players.filter((p) => !p.isForfeited).length > 1;

  const sendVote = (vote: 'yes' | 'no'): void => {
    if (isVoting) return;
    setIsVoting(true);
    setVoteError(null);

    try {
      const socket = getSocket();
      socket.emit('game:replay:vote', { roomCode, vote }, (res) => {
        setIsVoting(false);
        if (res.ok) {
          if (vote === 'yes') setHasVoted(true);
          else navigate('/lobby');
        } else {
          setVoteError(res.error ?? 'Failed to submit vote');
        }
      });
    } catch {
      setIsVoting(false);
      setVoteError('Not connected');
    }
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 bg-slate-900 p-8 text-center">
      {isWinner && <Confetti />}

      <div className="relative z-10 text-6xl">{isWinner ? '🏆' : '😔'}</div>

      <div className="relative z-10">
        <p className="text-2xl font-bold text-white">
          {isWinner ? 'You won!' : `${winner?.displayName ?? 'Someone'} won!`}
        </p>
        <p className="mt-1 text-slate-400">
          {isWinner ? 'Congratulations — payout added to your wallet' : 'Better luck next time'}
        </p>
      </div>

      <div className="relative z-10 w-full max-w-xs rounded-xl bg-slate-800 px-5 py-4 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Entry fee paid</span>
          <span className="text-red-400">-{ENTRY_FEE} coins</span>
        </div>
        {isWinner && myPayout !== null && (
          <div className="mt-2 flex justify-between font-semibold">
            <span className="text-slate-300">Payout received</span>
            <span className="text-emerald-400">+{myPayout} coins</span>
          </div>
        )}
        {isWinner && myPayout !== null && (
          <div className="mt-3 border-t border-slate-700 pt-3 flex justify-between font-bold">
            <span className="text-white">Net</span>
            <span className={myPayout - ENTRY_FEE >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {myPayout - ENTRY_FEE >= 0 ? '+' : ''}{myPayout - ENTRY_FEE} coins
            </span>
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3">
        {replayCancelledReason !== null && (
          <p className="text-sm text-amber-400">{replayCancelledReason}</p>
        )}

        {replayVoteState !== null && (
          <div className="rounded-xl bg-slate-800 px-4 py-3 text-sm text-center">
            <p className="text-slate-300 font-semibold">
              {replayVoteState.requestedByName} wants to play again
            </p>
            <p className="mt-1 text-slate-500">
              {replayVoteState.votes}/{replayVoteState.required} players agreed
            </p>
          </div>
        )}

        {voteError !== null && <p className="text-xs text-red-400">{voteError}</p>}

        {isMultiplayer ? (
          hasVoted ? (
            <p className="text-sm text-slate-400">Waiting for other players…</p>
          ) : (
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigate('/lobby')}>
                Lobby
              </Button>
              <Button
                variant="secondary"
                isLoading={isVoting}
                onClick={() => sendVote('no')}
              >
                Decline
              </Button>
              <Button isLoading={isVoting} onClick={() => sendVote('yes')}>
                Play Again
              </Button>
            </div>
          )
        ) : (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/lobby')}>
              Lobby
            </Button>
            <Button onClick={() => sendVote('yes')} isLoading={isVoting}>
              Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
