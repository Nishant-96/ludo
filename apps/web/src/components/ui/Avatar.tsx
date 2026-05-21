import { type FC, useState } from "react";
import type { PlayerColor } from "@ludo/shared";

interface AvatarProps {
  src: string | null;
  displayName: string;
  size?: "sm" | "md" | "lg" | "xl";
  showOnline?: boolean;
  colorRing?: PlayerColor;
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
} as const;

const COLOR_RING: Record<PlayerColor, string> = {
  red: "ring-ludo-red",
  blue: "ring-ludo-blue",
  green: "ring-ludo-green",
  yellow: "ring-ludo-yellow",
};

export const Avatar: FC<AvatarProps> = ({
  src,
  displayName,
  size = "md",
  showOnline = false,
  colorRing,
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const initials = displayName.slice(0, 2).toUpperCase();
  const ringClass = colorRing ? `ring-2 ${COLOR_RING[colorRing]}` : "";
  // Resets automatically when src changes to a new URL
  const showImage = src !== null && src !== failedSrc;

  return (
    <div className="relative shrink-0">
      <div
        className={`${SIZE_CLASSES[size]} overflow-hidden rounded-full bg-surface-3 ${ringClass}`}
      >
        {showImage ? (
          <img
            src={src}
            alt={displayName}
            className="h-full w-full object-cover"
            onError={() => setFailedSrc(src)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-bold text-white bg-gradient-to-br from-primary/60 to-primary-dark/80">
            {initials}
          </div>
        )}
      </div>
      {showOnline && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-online ring-2 ring-bg" />
      )}
    </div>
  );
};
