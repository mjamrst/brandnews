import { createClient } from '@/lib/supabase/client';
import type { Profile, ProfileUpdate } from '@/lib/supabase/database.types';

export async function getProfile(userId: string): Promise<Profile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getCurrentProfile(): Promise<Profile> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw authError || new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listProfiles(): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name');
  if (error) throw error;
  return data;
}
