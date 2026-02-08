import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      query,
      tagIds,
      status = 'active',
      sourceName,
      dateFrom,
      dateTo,
      limit = 20,
      offset = 0,
    } = body;

    let dbQuery = supabase
      .from('articles')
      .select('*', { count: 'exact' });

    if (status) {
      dbQuery = dbQuery.eq('status', status);
    }

    if (sourceName) {
      dbQuery = dbQuery.eq('source_name', sourceName);
    }

    if (dateFrom) {
      dbQuery = dbQuery.gte('published_at', dateFrom);
    }

    if (dateTo) {
      dbQuery = dbQuery.lte('published_at', dateTo);
    }

    if (query) {
      dbQuery = dbQuery.textSearch('search_vector', query, { type: 'websearch' });
    }

    // If filtering by tags, first get matching article IDs
    if (tagIds && tagIds.length > 0) {
      const { data: articleTagRows, error: atError } = await supabase
        .from('article_tags')
        .select('article_id')
        .in('tag_id', tagIds);

      if (atError) throw atError;

      const articleIds = [...new Set((articleTagRows ?? []).map((r) => r.article_id))];
      if (articleIds.length === 0) {
        return NextResponse.json({ articles: [], count: 0 });
      }
      dbQuery = dbQuery.in('id', articleIds);
    }

    const { data, error, count } = await dbQuery
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      articles: data ?? [],
      count: count ?? 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
