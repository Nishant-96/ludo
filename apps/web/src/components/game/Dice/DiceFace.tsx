import { type FC } from 'react';

interface DiceFaceProps {
  value: number;
}

// Dot positions for each face value [cx, cy] in a 40×40 viewBox
const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[20, 20]],
  2: [[12, 12], [28, 28]],
  3: [[12, 12], [20, 20], [28, 28]],
  4: [[12, 12], [28, 12], [12, 28], [28, 28]],
  5: [[12, 12], [28, 12], [20, 20], [12, 28], [28, 28]],
  6: [[12, 12], [28, 12], [12, 20], [28, 20], [12, 28], [28, 28]],
};

export const DiceFace: FC<DiceFaceProps> = ({ value }) => {
  const dots = DOT_POSITIONS[value] ?? [];

  return (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <rect width={40} height={40} rx={6} fill="white" />
      {dots.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#1e293b" />
      ))}
    </svg>
  );
};
