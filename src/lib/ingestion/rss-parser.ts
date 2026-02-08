import Parser from "rss-parser";
import { createServiceClient } from "../supabase/server";
import { ingestUrl } from "./pipeline";
import { rateLimitDelay } from "./scraper";
import type { FeedEntry, PollResult } from "./types";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "TheBriefBot/1.0 (+https://thebrief.agency; content aggregation)",
  },
});

/**
 * Parse an RSS/Atom feed and extract entries.
 */
export async function parseFeed(
  feedUrl: string
): Promise<{ title: string; entries: FeedEntry[] }> {
  const feed = await parser.parseURL(feedUrl);

  const entries: FeedEntry[] = (feed.items || [])
    .filter((item) => item.link)
    .map((item) => ({
      url: item.link!,
      title: item.title || "Untitled",
      published_at: item.isoDate || item.pubDate || null,
      description: item.contentSnippet || item.content || null,
    }));

  return {
    title: feed.title || feedUrl,
    entries,
  };
}

/**
 * Poll a single feed source: parse feed, deduplicate, ingest new articles.
 */
export async function pollFeed(feedSourceId: string): Promise<PollResult> {
  const supabase = createServiceClient();

  // Fetch the feed source record
  const { data: feedSource, error: feedError } = await supabase
    .from("feed_sources")
    .select("*")
    .eq("id", feedSourceId)
    .single();

  if (feedError || !feedSource) {
    throw new Error(
      `Feed source ${feedSourceId} not found: ${feedError?.message}`
    );
  }

  if (!feedSource.active) {
    return { ingested: 0, skipped: 0, failed: 0 };
  }

  // Check if enough time has passed since last fetch
  if (feedSource.last_fetched_at) {
    const lastFetched = new Date(feedSource.last_fetched_at).getTime();
    const intervalMs = (feedSource.fetch_interval_minutes || 120) * 60 * 1000;
    if (Date.now() - lastFetched < intervalMs) {
      console.log(
        `Feed ${feedSource.name}: skipping, last fetched ${feedSource.last_fetched_at}`
      );
      return { ingested: 0, skipped: 0, failed: 0 };
    }
  }

  // Parse the feed
  const { entries } = await parseFeed(feedSource.url);

  const result: PollResult = { ingested: 0, skipped: 0, failed: 0 };

  for (const entry of entries) {
    // Check for duplicate URL
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("url", entry.url)
      .maybeSingle();

    if (existing) {
      result.skipped++;
      continue;
    }

    try {
      await ingestUrl(entry.url, { ingested_by: "auto" });
      result.ingested++;
    } catch (err) {
      console.error(
        `Failed to ingest ${entry.url} from feed ${feedSource.name}:`,
        err instanceof Error ? err.message : err
      );
      result.failed++;
    }

    // Rate limit between articles
    await rateLimitDelay();
  }

  // Update last_fetched_at
  await supabase
    .from("feed_sources")
    .update({ last_fetched_at: new Date().toISOString() })
    .eq("id", feedSourceId);

  console.log(
    `Feed ${feedSource.name}: ingested=${result.ingested}, skipped=${result.skipped}, failed=${result.failed}`
  );

  return result;
}

/**
 * Poll all active feeds.
 */
export async function pollAllFeeds(): Promise<
  Record<string, PollResult>
> {
  const supabase = createServiceClient();

  const { data: feeds, error } = await supabase
    .from("feed_sources")
    .select("id, name")
    .eq("active", true);

  if (error) {
    throw new Error(`Failed to fetch feed sources: ${error.message}`);
  }

  const results: Record<string, PollResult> = {};

  for (const feed of feeds || []) {
    try {
      results[feed.name] = await pollFeed(feed.id);
    } catch (err) {
      console.error(
        `Failed to poll feed ${feed.name}:`,
        err instanceof Error ? err.message : err
      );
      results[feed.name] = { ingested: 0, skipped: 0, failed: 0 };
    }
  }

  return results;
}
