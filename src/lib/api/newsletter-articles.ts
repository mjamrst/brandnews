import { createClient } from '@/lib/supabase/client';
import type { NewsletterArticle, NewsletterArticleInsert } from '@/lib/supabase/database.types';

export async function getNewsletterArticles(newsletterId: string): Promise<NewsletterArticle[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('newsletter_articles')
    .select('*')
    .eq('newsletter_id', newsletterId)
    .order('position');
  if (error) throw error;
  return data ?? [];
}

export async function addArticleToNewsletter(
  newsletterId: string,
  articleId: string,
  position: number,
  section?: string
): Promise<NewsletterArticle> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('newsletter_articles')
    .insert({
      newsletter_id: newsletterId,
      article_id: articleId,
      position,
      section,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeArticleFromNewsletter(
  newsletterId: string,
  articleId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('newsletter_articles')
    .delete()
    .eq('newsletter_id', newsletterId)
    .eq('article_id', articleId);
  if (error) throw error;
}

export async function updateNewsletterArticle(
  newsletterId: string,
  articleId: string,
  updates: {
    position?: number;
    section?: string | null;
    custom_headline?: string | null;
    custom_summary?: string | null;
  }
): Promise<NewsletterArticle> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('newsletter_articles')
    .update(updates)
    .eq('newsletter_id', newsletterId)
    .eq('article_id', articleId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function reorderNewsletterArticles(
  newsletterId: string,
  orderedArticleIds: string[]
): Promise<void> {
  const supabase = createClient();

  // Update positions sequentially based on array order
  const updates = orderedArticleIds.map((articleId, index) =>
    supabase
      .from('newsletter_articles')
      .update({ position: index })
      .eq('newsletter_id', newsletterId)
      .eq('article_id', articleId)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function bulkAddArticlesToNewsletter(
  newsletterId: string,
  articleIds: string[],
  startPosition: number = 0
): Promise<void> {
  const supabase = createClient();
  const rows: NewsletterArticleInsert[] = articleIds.map((articleId, index) => ({
    newsletter_id: newsletterId,
    article_id: articleId,
    position: startPosition + index,
  }));
  const { error } = await supabase
    .from('newsletter_articles')
    .upsert(rows, { onConflict: 'newsletter_id,article_id' });
  if (error) throw error;
}

export async function replaceNewsletterArticles(
  newsletterId: string,
  articles: {
    article_id: string;
    position: number;
    custom_headline?: string | null;
    custom_summary?: string | null;
  }[]
): Promise<void> {
  const supabase = createClient();

  // Delete all existing articles for this newsletter
  const { error: deleteError } = await supabase
    .from('newsletter_articles')
    .delete()
    .eq('newsletter_id', newsletterId);
  if (deleteError) throw deleteError;

  if (articles.length === 0) return;

  // Insert the new set
  const rows: NewsletterArticleInsert[] = articles.map((a) => ({
    newsletter_id: newsletterId,
    article_id: a.article_id,
    position: a.position,
    custom_headline: a.custom_headline || null,
    custom_summary: a.custom_summary || null,
  }));
  const { error: insertError } = await supabase
    .from('newsletter_articles')
    .insert(rows);
  if (insertError) throw insertError;
}
