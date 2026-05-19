export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';

export interface User {
  id: string;
  googleId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface WalletBalance {
  userId: string;
  balance: number;
}
