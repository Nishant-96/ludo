import { type FC } from 'react';
import { RoomCard } from './RoomCard';
import type { RoomSummary } from '@ludo/shared';

interface RoomListProps {
  rooms: RoomSummary[];
  isLoading: boolean;
}

export const RoomList: FC<RoomListProps> = ({ rooms, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-800" />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 py-10 text-center text-slate-500">
        No open rooms. Create one!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
};
