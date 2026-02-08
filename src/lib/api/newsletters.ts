import { createClient } from '@/lib/supabase/client';
import type { Newsletter, NewsletterInsert, NewsletterUpdate } from '@/lib/supabase/database.types';

export interface NewsletterWithArticleCount extends Newsletter {
  article_count: number;
}

export async function listNewsletters(): Promise<Newsletter[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('newsletters')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getNewsletter(id: string): Promise<Newsletter> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('newsletters')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getNewsletterWithArticles(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('newsletters')
    .select(`
      *,
      newsletter_articles (
        article_id,
        position,
        section,
        custom_headline,
        custom_summary,
        articles (
          id, url, title, headline, summary, thumbnail_url,
          source_name, source_favicon, author, published_at
        )
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createNewsletter(newsletter: NewsletterInsert): Promise<Newsletter> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('newsletters')
    .insert(newsletter)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNewsletter(id: string, updates: NewsletterUpdate): Promise<Newsletter> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('newsletters')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNewsletter(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('newsletters')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function publishNewsletter(id: string, publishedUrl: string): Promise<Newsletter> {
  return updateNewsletter(id, {
    status: 'published',
    published_at: new Date().toISOString(),
    published_url: publishedUrl,
  });
}

export async function unpublishNewsletter(id: string): Promise<Newsletter> {
  return updateNewsletter(id, {
    status: 'draft',
    published_at: null,
    published_url: null,
  });
}
