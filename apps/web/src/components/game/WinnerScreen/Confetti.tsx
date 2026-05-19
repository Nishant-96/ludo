import { type FC } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#E53E3E', '#3182CE', '#38A169', '#D69E2E', '#805AD5', '#DD6B20'];
const PARTICLE_COUNT = 40;

interface Particle {
  id: number;
  color: string;
  x: number;
  vx: number;
  vy: number;
  rotate: number;
  size: number;
}

// Seeded-ish: consistent between renders in the same session
const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  color: COLORS[i % COLORS.length],
  x: 10 + (i / PARTICLE_COUNT) * 80, // spread across 10–90% width
  vx: (i % 2 === 0 ? 1 : -1) * (20 + (i % 5) * 10),
  vy: -(200 + (i % 7) * 40),
  rotate: (i % 3) * 120,
  size: 6 + (i % 3) * 3,
}));

export const Confetti: FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    {particles.map((p) => (
      <motion.div
        key={p.id}
        className="absolute rounded-sm"
        style={{
          left: `${p.x}%`,
          top: '-10px',
          width: p.size,
          height: p.size,
          backgroundColor: p.color,
        }}
        initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
        animate={{
          y: ['0vh', '110vh'],
          x: [0, p.vx],
          rotate: [0, p.rotate + 360],
          opacity: [1, 1, 0],
        }}
        transition={{
          duration: 2 + (p.id % 4) * 0.3,
          delay: (p.id % 5) * 0.1,
          ease: 'easeIn',
          times: [0, 0.8, 1],
        }}
      />
    ))}
  </div>
);
