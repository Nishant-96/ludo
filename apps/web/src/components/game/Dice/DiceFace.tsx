import { type FC } from "react";

interface DiceFaceProps {
  value: number;
  size?: "sm" | "lg";
}

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[22, 22]],
  2: [
    [13, 13],
    [31, 31],
  ],
  3: [
    [13, 13],
    [22, 22],
    [31, 31],
  ],
  4: [
    [13, 13],
    [31, 13],
    [13, 31],
    [31, 31],
  ],
  5: [
    [13, 13],
    [31, 13],
    [22, 22],
    [13, 31],
    [31, 31],
  ],
  6: [
    [13, 12],
    [31, 12],
    [13, 22],
    [31, 22],
    [13, 32],
    [31, 32],
  ],
};

export const DiceFace: FC<DiceFaceProps> = ({ value, size = "sm" }) => {
  const dots = DOT_POSITIONS[value] ?? [];
  const dotRadius = size === "lg" ? 4.5 : 3.5;

  return (
    <svg viewBox="0 0 44 44" className="h-full w-full drop-shadow-md">
      <rect width={44} height={44} rx={8} fill="white" />
      <rect
        width={44}
        height={44}
        rx={8}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={1}
      />
      {dots.map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={dotRadius}
          fill="#1a1a2e"
        />
      ))}
    </svg>
  );
};
