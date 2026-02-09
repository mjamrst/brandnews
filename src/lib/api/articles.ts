import { createClient } from '@/lib/supabase/client';
import type { Article, ArticleInsert, ArticleUpdate } from '@/lib/supabase/database.types';

export interface ArticleWithTags extends Article {
  article_tags: { tag_id: string; source: string; tags: { id: string; name: string; category: string | null } }[];
}

export interface ArticleSearchParams {
  query?: string;
  tagIds?: string[];
  status?: string;
  sourceName?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export async function listArticles(params: ArticleSearchParams = {}): Promise<{ articles: Article[]; count: number }> {
  const supabase = createClient();
  const { limit = 20, offset = 0 } = params;

  let query = supabase
    .from('articles')
    .select('*', { count: 'exact' });

  if (params.status) {
    query = query.eq('status', params.status);
  } else {
    query = query.eq('status', 'active');
  }

  if (params.sourceName) {
    query = query.eq('source_name', params.sourceName);
  }

  if (params.dateFrom) {
    query = query.gte('published_at', params.dateFrom);
  }

  if (params.dateTo) {
    query = query.lte('published_at', params.dateTo);
  }

  if (params.query) {
    query = query.textSearch('search_vector', params.query, { type: 'websearch' });
  }

  const { data, error, count } = await query
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { articles: data ?? [], count: count ?? 0 };
}

export async function listArticlesWithTags(params: ArticleSearchParams = {}): Promise<{ articles: ArticleWithTags[]; count: number }> {
  const supabase = createClient();
  const { limit = 50, offset = 0 } = params;

  let query = supabase
    .from('articles')
    .select(`
      *,
      article_tags (
        tag_id,
        source,
        tags (id, name, category)
      )
    `, { count: 'exact' });

  if (params.status) {
    query = query.eq('status', params.status);
  } else {
    query = query.eq('status', 'active');
  }

  if (params.sourceName) {
    query = query.eq('source_name', params.sourceName);
  }

  if (params.dateFrom) {
    query = query.gte('published_at', params.dateFrom);
  }

  if (params.dateTo) {
    query = query.lte('published_at', params.dateTo);
  }

  if (params.query) {
    query = query.textSearch('search_vector', params.query, { type: 'websearch' });
  }

  const { data, error, count } = await query
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { articles: (data ?? []) as ArticleWithTags[], count: count ?? 0 };
}

export async function searchArticles(searchQuery: string, limit = 20): Promise<Article[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .textSearch('search_vector', searchQuery, { type: 'websearch' })
    .eq('status', 'active')
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getArticle(id: string): Promise<Article> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getArticleWithTags(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      article_tags (
        tag_id,
        source,
        tags (id, name, category)
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createArticle(article: ArticleInsert): Promise<Article> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('articles')
    .insert(article)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateArticle(id: string, updates: ArticleUpdate): Promise<Article> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function archiveArticle(id: string): Promise<Article> {
  return updateArticle(id, { status: 'archived' });
}

export async function bulkArchiveArticles(ids: string[]): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('articles')
    .update({ status: 'archived' })
    .in('id', ids);
  if (error) throw error;
}

export async function addTagsToArticle(articleId: string, tagIds: string[], source: string = 'manual'): Promise<void> {
  const supabase = createClient();
  const rows = tagIds.map((tagId) => ({
    article_id: articleId,
    tag_id: tagId,
    source,
  }));
  const { error } = await supabase
    .from('article_tags')
    .upsert(rows, { onConflict: 'article_id,tag_id' });
  if (error) throw error;
}

export async function removeTagFromArticle(articleId: string, tagId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('article_tags')
    .delete()
    .eq('article_id', articleId)
    .eq('tag_id', tagId);
  if (error) throw error;
}

export async function getArticlesByTagIds(tagIds: string[], limit = 50): Promise<Article[]> {
  const supabase = createClient();
  const { data: articleTagRows, error: atError } = await supabase
    .from('article_tags')
    .select('article_id')
    .in('tag_id', tagIds);
  if (atError) throw atError;

  const articleIds = [...new Set((articleTagRows ?? []).map((r) => r.article_id))];
  if (articleIds.length === 0) return [];

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .in('id', articleIds)
    .eq('status', 'active')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getDistinctSources(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('articles')
    .select('source_name')
    .not('source_name', 'is', null)
    .order('source_name');
  if (error) throw error;
  const unique = [...new Set((data ?? []).map((r) => r.source_name).filter(Boolean))] as string[];
  return unique;
}
