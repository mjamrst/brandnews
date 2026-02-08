// Supabase Edge Function: ingest-article
// Accepts a URL, scrapes it, enriches with Claude AI, and stores in the_brief.articles
//
// Deploy: supabase functions deploy ingest-article
// Invoke: POST /functions/v1/ingest-article { "url": "https://..." }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

interface IngestRequest {
  url: string;
  raw_text?: string;      // optional: paste-in for paywalled content
  ingested_by?: string;   // user ID or 'auto'
}

interface ScrapedData {
  title: string;
  body_text: string;
  thumbnail_url: string | null;
  author: string | null;
  published_at: string | null;
  source_name: string;
  source_favicon: string | null;
}

interface EnrichmentResult {
  headline: string;
  summary: string;
  tags: string[];
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

async function scrapeUrl(url: string): Promise<ScrapedData> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TheBrief/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const domain = extractDomain(url);

  // Basic HTML parsing (Edge Functions don't have Cheerio/DOM, so use regex extraction)
  // For production, this would use Cheerio in a Node.js environment
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"[^>]*>/i);
  const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"[^>]*>/i);
  const authorMatch = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"[^>]*>/i)
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*name="author"[^>]*>/i);
  const dateMatch = html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]*)"[^>]*>/i)
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="article:published_time"[^>]*>/i)
    || html.match(/<time[^>]*datetime="([^"]*)"[^>]*>/i);
  const faviconMatch = html.match(/<link[^>]*rel="(?:shortcut )?icon"[^>]*href="([^"]*)"[^>]*>/i);

  // Extract body text by stripping HTML tags from article content
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const bodyHtml = articleMatch ? articleMatch[1] : html;
  const bodyText = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000); // Limit to ~10k chars for Claude

  const title = ogTitleMatch?.[1] || titleMatch?.[1] || 'Untitled';

  let faviconUrl = faviconMatch?.[1] || null;
  if (faviconUrl && !faviconUrl.startsWith('http')) {
    const base = new URL(url);
    faviconUrl = `${base.protocol}//${base.host}${faviconUrl.startsWith('/') ? '' : '/'}${faviconUrl}`;
  }

  return {
    title: title.trim(),
    body_text: bodyText,
    thumbnail_url: ogImageMatch?.[1] || null,
    author: authorMatch?.[1] || null,
    published_at: dateMatch?.[1] || null,
    source_name: domain,
    source_favicon: faviconUrl,
  };
}

async function enrichWithClaude(title: string, sourceName: string, bodyText: string, existingTags: string[]): Promise<EnrichmentResult> {
  const tagList = existingTags.join(', ');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a trends analyst at a leading sports and entertainment marketing agency. Given the following article, provide:

1. HEADLINE: A concise, engaging headline (max 12 words) that would grab the attention of brand marketers and sponsorship professionals.

2. SUMMARY: A 2-3 sentence overview that explains why this matters for brands investing in sports, entertainment, and culture. Focus on the strategic implications, not just what happened.

3. TAGS: Select all applicable tags from this list: ${tagList}. Return as a JSON array.

Article title: ${title}
Article source: ${sourceName}
Article text: ${bodyText}

Respond in JSON format:
{
  "headline": "...",
  "summary": "...",
  "tags": ["tag1", "tag2", ...]
}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const content = result.content?.[0]?.text;
  if (!content) throw new Error('Empty response from Claude');

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse Claude response as JSON');

  const parsed = JSON.parse(jsonMatch[0]) as EnrichmentResult;
  return parsed;
}

Deno.serve(async (req: Request) => {
  // CORS headers
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
    const { url, raw_text, ingested_by = 'auto' } = (await req.json()) as IngestRequest;

    if (!url) {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      db: { schema: 'the_brief' },
    });

    // Check if URL already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('url', url)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Article already exists', article_id: existing.id }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Scrape or use provided text
    let scraped: ScrapedData;
    if (raw_text) {
      scraped = {
        title: 'Manually submitted article',
        body_text: raw_text,
        thumbnail_url: null,
        author: null,
        published_at: null,
        source_name: extractDomain(url),
        source_favicon: null,
      };
      // Still try to get metadata from URL
      try {
        const metadata = await scrapeUrl(url);
        scraped.title = metadata.title;
        scraped.thumbnail_url = metadata.thumbnail_url;
        scraped.author = metadata.author;
        scraped.published_at = metadata.published_at;
        scraped.source_favicon = metadata.source_favicon;
      } catch {
        // metadata fetch failed, use defaults
      }
    } else {
      scraped = await scrapeUrl(url);
    }

    // Get existing tags for Claude prompt
    const { data: allTags } = await supabase.from('tags').select('name');
    const tagNames = (allTags ?? []).map((t) => t.name);

    // Enrich with Claude
    const enrichment = await enrichWithClaude(
      scraped.title,
      scraped.source_name,
      raw_text || scraped.body_text,
      tagNames
    );

    // Insert article
    const { data: article, error: insertError } = await supabase
      .from('articles')
      .insert({
        url,
        title: scraped.title,
        headline: enrichment.headline,
        summary: enrichment.summary,
        thumbnail_url: scraped.thumbnail_url,
        source_name: scraped.source_name,
        source_favicon: scraped.source_favicon,
        author: scraped.author,
        published_at: scraped.published_at,
        ingested_by,
        raw_content: raw_text || scraped.body_text,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Link tags
    if (enrichment.tags.length > 0) {
      const { data: matchedTags } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', enrichment.tags);

      if (matchedTags && matchedTags.length > 0) {
        const tagRows = matchedTags.map((t) => ({
          article_id: article.id,
          tag_id: t.id,
          source: 'ai',
        }));
        await supabase.from('article_tags').insert(tagRows);
      }
    }

    return new Response(JSON.stringify({ article }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Ingest error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
