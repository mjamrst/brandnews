// Supabase Edge Function: poll-feeds
// Fetches all active RSS feed sources, parses them, and ingests new articles.
//
// Deploy: supabase functions deploy poll-feeds
// Invoke: POST /functions/v1/poll-feeds (no body needed)
// Schedule via Supabase cron or external scheduler every 2-3 hours.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface FeedItem {
  title: string;
  link: string;
  pubDate?: string;
}

function extractItems(xml: string): FeedItem[] {
  const items: FeedItem[] = [];

  // RSS 2.0 items
  const rssItemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = rssItemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
    const link = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || '';
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
    if (link) {
      items.push({ title, link, pubDate });
    }
  }

  // Atom entries (if no RSS items found)
  if (items.length === 0) {
    const atomEntryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = atomEntryRegex.exec(xml)) !== null) {
      const entryXml = match[1];
      const title = entryXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
      const linkMatch = entryXml.match(/<link[^>]*href="([^"]*)"[^>]*>/i);
      const link = linkMatch?.[1] || '';
      const pubDate = entryXml.match(/<published>([\s\S]*?)<\/published>/i)?.[1]?.trim()
        || entryXml.match(/<updated>([\s\S]*?)<\/updated>/i)?.[1]?.trim();
      if (link) {
        items.push({ title, link, pubDate });
      }
    }
  }

  return items;
}

async function fetchFeed(feedUrl: string): Promise<FeedItem[]> {
  const response = await fetch(feedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TheBrief/1.0)',
      'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feed ${feedUrl}: ${response.status}`);
  }

  const xml = await response.text();
  return extractItems(xml);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      db: { schema: 'the_brief' },
    });

    // Get active feed sources
    const { data: feeds, error: feedsError } = await supabase
      .from('feed_sources')
      .select('*')
      .eq('active', true);

    if (feedsError) throw feedsError;
    if (!feeds || feeds.length === 0) {
      return new Response(JSON.stringify({ message: 'No active feeds found' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all existing article URLs for deduplication
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('url');
    const existingUrls = new Set((existingArticles ?? []).map((a) => a.url));

    const results: { feed: string; new_articles: number; errors: string[] }[] = [];

    for (const feed of feeds) {
      const feedResult = { feed: feed.name, new_articles: 0, errors: [] as string[] };

      try {
        const items = await fetchFeed(feed.url);
        const newItems = items.filter((item) => !existingUrls.has(item.link));

        for (const item of newItems) {
          try {
            // Call ingest-article function for each new article
            const ingestResponse = await fetch(`${SUPABASE_URL}/functions/v1/ingest-article`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                url: item.link,
                ingested_by: 'auto',
              }),
            });

            if (ingestResponse.ok) {
              feedResult.new_articles++;
              existingUrls.add(item.link);
            } else {
              const errBody = await ingestResponse.text();
              // 409 = duplicate, not really an error
              if (ingestResponse.status !== 409) {
                feedResult.errors.push(`${item.link}: ${errBody}`);
              }
            }

            // Rate limit: 1.5s delay between scrapes
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } catch (itemError: unknown) {
            const msg = itemError instanceof Error ? itemError.message : 'Unknown error';
            feedResult.errors.push(`${item.link}: ${msg}`);
          }
        }

        // Update last_fetched_at
        await supabase
          .from('feed_sources')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', feed.id);
      } catch (feedError: unknown) {
        const msg = feedError instanceof Error ? feedError.message : 'Unknown error';
        feedResult.errors.push(`Feed fetch failed: ${msg}`);
      }

      results.push(feedResult);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Poll feeds error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
