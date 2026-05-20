import { type FC } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  timeRemaining: number;
  totalSeconds?: number;
}

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const Timer: FC<TimerProps> = ({ timeRemaining, totalSeconds = 30 }) => {
  const progress = Math.max(0, timeRemaining / totalSeconds);
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isWarning = timeRemaining <= 10;

  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 50 50">
        {/* Track */}
        <circle cx={25} cy={25} r={RADIUS} fill="none" stroke="#334155" strokeWidth={4} />
        {/* Progress arc */}
        <motion.circle
          cx={25}
          cy={25}
          r={RADIUS}
          fill="none"
          stroke={isWarning ? '#F87171' : '#6366F1'}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>
      <motion.span
        animate={{ color: isWarning ? '#F87171' : '#e2e8f0' }}
        className="relative text-sm font-bold tabular-nums"
      >
        {Math.max(0, timeRemaining)}
      </motion.span>
    </div>
  );
};
