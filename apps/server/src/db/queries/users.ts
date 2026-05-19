import { db } from '../client';
import type { User } from '@ludo/shared';

export const getUserByGoogleId = async (googleId: string): Promise<User | null> => {
  const { data, error } = await db
    .from('users')
    .select('*')
    .eq('google_id', googleId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    googleId: data.google_id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
};

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await db
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    googleId: data.google_id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
};

export const createUser = async (params: {
  id: string;
  googleId: string;
  displayName: string;
  avatarUrl: string | null;
}): Promise<User> => {
  const { data, error } = await db
    .from('users')
    .insert({
      id: params.id,
      google_id: params.googleId,
      display_name: params.displayName,
      avatar_url: params.avatarUrl,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create user: ${error?.message}`);
  }

  // Create wallet with default 10,000 coins
  await db.from('wallets').insert({ user_id: data.id });

  return {
    id: data.id,
    googleId: data.google_id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
};
