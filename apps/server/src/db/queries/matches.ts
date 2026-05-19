import { db } from '../client';

export const createMatch = async (roomId: string, playerIds: string[], colors: string[]): Promise<string> => {
  const { data, error } = await db
    .from('matches')
    .insert({ room_id: roomId })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create match: ${error?.message}`);

  const participants = playerIds.map((userId, i) => ({
    match_id: data.id,
    user_id: userId,
    color: colors[i],
  }));

  const { error: participantsError } = await db.from('match_participants').insert(participants);
  if (participantsError) throw new Error(`Failed to insert match participants: ${participantsError.message}`);

  return data.id as string;
};

export const recordMove = async (params: {
  matchId: string;
  userId: string;
  diceValue: number;
  pawnIndex: number;
  fromPos: number;
  toPos: number;
}): Promise<void> => {
  await db.from('moves').insert({
    match_id: params.matchId,
    user_id: params.userId,
    dice_value: params.diceValue,
    pawn_index: params.pawnIndex,
    from_pos: params.fromPos,
    to_pos: params.toPos,
  });
};

// Called in the catch path of game:start to roll back a match whose fee deduction failed.
export const deleteMatch = async (matchId: string): Promise<void> => {
  // Participants have a FK cascade on match delete, but delete explicitly to be safe
  await db.from('match_participants').delete().eq('match_id', matchId);
  await db.from('matches').delete().eq('id', matchId);
};

export const endMatch = async (matchId: string, winnerId: string): Promise<void> => {
  await db
    .from('matches')
    .update({ status: 'completed', ended_at: new Date().toISOString(), winner_user_id: winnerId })
    .eq('id', matchId);
};
