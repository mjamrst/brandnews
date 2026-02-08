import { createClient } from '@/lib/supabase/client';
import type { FeedSource, FeedSourceInsert, FeedSourceUpdate } from '@/lib/supabase/database.types';

export async function listFeedSources(): Promise<FeedSource[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('feed_sources')
    .select('*')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getActiveFeedSources(): Promise<FeedSource[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('feed_sources')
    .select('*')
    .eq('active', true)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getFeedSource(id: string): Promise<FeedSource> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('feed_sources')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createFeedSource(feedSource: FeedSourceInsert): Promise<FeedSource> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('feed_sources')
    .insert(feedSource)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFeedSource(id: string, updates: FeedSourceUpdate): Promise<FeedSource> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('feed_sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFeedSource(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('feed_sources')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function toggleFeedSource(id: string, active: boolean): Promise<FeedSource> {
  return updateFeedSource(id, { active });
}
