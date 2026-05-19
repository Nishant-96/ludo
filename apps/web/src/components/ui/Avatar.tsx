import { type FC } from 'react';

interface AvatarProps {
  src: string | null;
  displayName: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;

export const Avatar: FC<AvatarProps> = ({ src, displayName, size = 'md' }) => {
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className={`${SIZE_CLASSES[size]} shrink-0 overflow-hidden rounded-full bg-slate-600`}>
      {src ? (
        <img src={src} alt={displayName} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-semibold text-white">
          {initials}
        </div>
      )}
    </div>
  );
};
