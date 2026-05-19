import { type FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiceFace } from './DiceFace';
import { Button } from '@/components/ui/Button';
import { getSocket } from '@/lib/socket';

interface DiceProps {
  roomCode: string;
  diceValue: number | null;
  isMyTurn: boolean;
  hasRolled: boolean; // true if dice already rolled this turn
}

export const Dice: FC<DiceProps> = ({ roomCode, diceValue, isMyTurn, hasRolled }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRoll = isMyTurn && !hasRolled && !isRolling;

  const handleRoll = (): void => {
    if (!canRoll) return;
    setIsRolling(true);
    setError(null);

    try {
      const socket = getSocket();
      socket.emit('dice:roll', { roomCode }, (res) => {
        setIsRolling(false);
        if (!res.ok) setError(res.error ?? 'Failed to roll');
      });
    } catch {
      setIsRolling(false);
      setError('Not connected');
    }
  };

  const displayValue = diceValue ?? 1;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Dice face */}
      <AnimatePresence mode="wait">
        <motion.div
          key={diceValue}
          className="h-14 w-14"
          initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 180, scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <DiceFace value={displayValue} />
        </motion.div>
      </AnimatePresence>

      {/* Roll button */}
      <Button
        onClick={handleRoll}
        disabled={!canRoll}
        isLoading={isRolling}
        size="sm"
        className="min-w-[80px]"
      >
        {isRolling ? 'Rolling…' : 'Roll'}
      </Button>

      {error !== null && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};
