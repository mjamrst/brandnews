import { createClient } from '@/lib/supabase/client';
import type { Tag, TagInsert } from '@/lib/supabase/database.types';

export async function listTags(): Promise<Tag[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function listTagsByCategory(category: string): Promise<Tag[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('category', category)
    .order('name');
  if (error) throw error;
  return data;
}

export async function getTagsGroupedByCategory(): Promise<Record<string, Tag[]>> {
  const tags = await listTags();
  const grouped: Record<string, Tag[]> = {};
  for (const tag of tags) {
    const cat = tag.category || 'uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(tag);
  }
  return grouped;
}

export async function createTag(tag: TagInsert): Promise<Tag> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tags')
    .insert(tag)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTag(id: string, updates: { name?: string; category?: string }): Promise<Tag> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTag(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
