import { createServiceClient } from "../supabase/server";
import { scrapeUrl, rateLimitDelay } from "./scraper";
import { enrichArticle } from "./enrichment";
import type {
  ScrapedArticle,
  IngestedArticle,
  IngestionOptions,
  BatchResult,
} from "./types";

const MAX_SCRAPE_RETRIES = 3;
const SCRAPE_RETRY_BASE_MS = 1000;

/**
 * Ingest a single article from a URL.
 * Pipeline: deduplicate -> scrape -> enrich -> store.
 */
export async function ingestUrl(
  url: string,
  options: IngestionOptions = {}
): Promise<IngestedArticle> {
  const supabase = createServiceClient();

  // 1. Check for duplicate URL
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("url", url)
    .maybeSingle();

  if (existing) {
    throw new Error(`Article already exists: ${url}`);
  }

  // 2. Scrape the article (with retries), or use manual content
  let scraped: ScrapedArticle;

  if (options.manual_content) {
    // User pasted article text directly (paywalled articles)
    scraped = {
      url,
      title: "Manual Submission",
      thumbnail_url: null,
      source_name: new URL(url).hostname.replace(/^www\./, ""),
      source_favicon: `${new URL(url).origin}/favicon.ico`,
      author: null,
      published_at: null,
      raw_content: options.manual_content,
    };

    // Still try to scrape metadata (title, image, etc.) but don't fail if it doesn't work
    try {
      const metadata = await scrapeUrl(url);
      scraped.title = metadata.title;
      scraped.thumbnail_url = metadata.thumbnail_url;
      scraped.source_name = metadata.source_name;
      scraped.source_favicon = metadata.source_favicon;
      scraped.author = metadata.author;
      scraped.published_at = metadata.published_at;
      // Keep the manual content, not the scraped content
    } catch {
      // Metadata scrape failed — that's fine, we have the manual content
    }
  } else {
    scraped = await scrapeWithRetry(url);
  }

  // 3. Enrich with AI (unless skipped)
  let headline: string | null = null;
  let summary: string | null = null;
  let tagNames: string[] = [];

  if (!options.skip_enrichment && scraped.raw_content.length > 0) {
    try {
      // Fetch current tag taxonomy
      const { data: tags } = await supabase.from("tags").select("name");
      const tagTaxonomy = (tags || []).map((t) => t.name);

      const enrichment = await enrichArticle(scraped, tagTaxonomy);
      headline = enrichment.headline;
      summary = enrichment.summary;
      tagNames = enrichment.tags;
    } catch (err) {
      console.error(
        `AI enrichment failed for ${url}, storing without enrichment:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  // 4. Insert article
  const { data: article, error: insertError } = await supabase
    .from("articles")
    .insert({
      url: scraped.url,
      title: scraped.title,
      headline,
      summary,
      thumbnail_url: scraped.thumbnail_url,
      source_name: scraped.source_name,
      source_favicon: scraped.source_favicon,
      author: scraped.author,
      published_at: scraped.published_at,
      raw_content: scraped.raw_content,
      ingested_by: options.ingested_by || "auto",
      status: "active",
    })
    .select()
    .single();

  if (insertError || !article) {
    throw new Error(
      `Failed to insert article: ${insertError?.message || "Unknown error"}`
    );
  }

  // 5. Resolve tag names to IDs and insert article_tags
  if (tagNames.length > 0) {
    const { data: matchedTags } = await supabase
      .from("tags")
      .select("id, name")
      .in("name", tagNames);

    if (matchedTags && matchedTags.length > 0) {
      const articleTags = matchedTags.map((tag) => ({
        article_id: article.id,
        tag_id: tag.id,
        source: "ai" as const,
      }));

      const { error: tagError } = await supabase
        .from("article_tags")
        .insert(articleTags);

      if (tagError) {
        console.error(
          `Failed to insert article tags for ${url}:`,
          tagError.message
        );
      }
    }
  }

  return {
    id: article.id,
    url: article.url,
    title: article.title,
    headline: article.headline,
    summary: article.summary,
    thumbnail_url: article.thumbnail_url,
    source_name: article.source_name,
    source_favicon: article.source_favicon,
    author: article.author,
    published_at: article.published_at,
    ingested_at: article.ingested_at,
    ingested_by: article.ingested_by,
    raw_content: article.raw_content,
    status: article.status,
    tags: tagNames,
  };
}

/**
 * Ingest a batch of URLs. Processes sequentially with rate limiting.
 * Never lets one failure block the rest.
 */
export async function ingestBatch(
  urls: string[],
  options: IngestionOptions = {}
): Promise<BatchResult> {
  const result: BatchResult = { success: [], failures: [] };

  for (const url of urls) {
    try {
      const article = await ingestUrl(url, options);
      result.success.push(article);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`Batch ingestion failed for ${url}:`, errorMsg);
      result.failures.push({ url, error: errorMsg });
    }

    // Rate limit between articles
    await rateLimitDelay();
  }

  return result;
}

/**
 * Scrape with retry logic and exponential backoff.
 */
async function scrapeWithRetry(url: string): Promise<ScrapedArticle> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_SCRAPE_RETRIES; attempt++) {
    try {
      return await scrapeUrl(url);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `Scrape attempt ${attempt + 1}/${MAX_SCRAPE_RETRIES} failed for ${url}:`,
        lastError.message
      );

      if (attempt < MAX_SCRAPE_RETRIES - 1) {
        const delay = SCRAPE_RETRY_BASE_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Scraping failed after ${MAX_SCRAPE_RETRIES} attempts: ${lastError?.message}`
  );
}
