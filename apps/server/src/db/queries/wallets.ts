import { db } from '../client';

export const getBalance = async (userId: string): Promise<number> => {
  const { data, error } = await db
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error(`Wallet not found for user ${userId}`);

  return data.balance as number;
};

export const deductEntryFees = async (
  playerIds: string[],
  amount: number,
  matchId: string
): Promise<void> => {
  const { error } = await db.rpc('deduct_entry_fees', {
    player_ids: playerIds,
    amount,
    p_match_id: matchId,
  });

  if (error) throw new Error(`Entry fee deduction failed: ${error.message}`);
};

export const payoutWinner = async (
  winnerId: string,
  payoutAmount: number,
  matchId: string
): Promise<void> => {
  const { error } = await db.rpc('payout_winner', {
    winner_id: winnerId,
    payout_amount: payoutAmount,
    p_match_id: matchId,
  });

  if (error) throw new Error(`Payout failed: ${error.message}`);
};
