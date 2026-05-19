// Simple module that tracks the count of connected, authenticated Socket.IO users.
// Updated by socket/index.ts on connect/disconnect events.
// Exposed to REST routes via getConnectedCount().

let connectedCount = 0;

export const incrementConnected = (): void => { connectedCount += 1; };
export const decrementConnected = (): void => { connectedCount = Math.max(0, connectedCount - 1); };
export const getConnectedCount = (): number => connectedCount;
