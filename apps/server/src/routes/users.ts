import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { getUserById, getUserByGoogleId, createUser } from '../db/queries/users';
import { getBalance } from '../db/queries/wallets';
import { createClient } from '@supabase/supabase-js';
import type { Request } from 'express';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const usersRouter: Router = Router();

// Called after Google OAuth — ensures user record exists in our DB
usersRouter.post('/me', requireAuth, async (req: Request, res) => {
  const userId = (req as AuthenticatedRequest).userId;

  try {
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    const authUser = authData?.user;

    if (!authUser) {
      res.status(404).json({ error: 'Auth user not found' });
      return;
    }

    const googleId = authUser.user_metadata?.sub as string;
    const avatarUrl = (authUser.user_metadata?.avatar_url as string) ?? null;

    let user = await getUserByGoogleId(googleId);

    if (!user) {
      const displayName = generateDisplayName();
      user = await createUser({ id: userId, googleId, displayName, avatarUrl });
    }

    const balance = await getBalance(user.id);

    res.json({ user, balance });
  } catch (err) {
    console.error('[POST /users/me] Failed to initialize user', err);
    res.status(500).json({ error: 'Failed to initialize user' });
  }
});

usersRouter.get('/me', requireAuth, async (req: Request, res) => {
  const userId = (req as AuthenticatedRequest).userId;

  try {
    const user = await getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const balance = await getBalance(userId);
    res.json({ user, balance });
  } catch (err) {
    console.error('[GET /users/me] Failed to fetch user', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

const ADJECTIVES = ['Silent', 'Neon', 'Angry', 'Swift', 'Shadow', 'Iron', 'Cosmic', 'Fierce', 'Bold', 'Sly'];
const ANIMALS = ['Tiger', 'Wizard', 'Panda', 'Wolf', 'Eagle', 'Fox', 'Bear', 'Shark', 'Falcon', 'Lion'];

const generateDisplayName = (): string => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj}${animal}`;
};
