import { supabase } from '@/lib/supabase';

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};

export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};
