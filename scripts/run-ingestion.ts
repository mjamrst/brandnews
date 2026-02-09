/**
 * Run first RSS ingestion: parse feeds → scrape → AI enrich → store.
 * Run: npx tsx scripts/run-ingestion.ts
 *
 * This is a standalone script that avoids Next.js server imports.
 * It re-implements the poll logic using @supabase/supabase-js directly.
 */
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: "the_brief" },
});

const rssParser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "TheBriefBot/1.0 (+https://thebrief.agency)" },
});

const anthropic = new Anthropic({ apiKey: anthropicApiKey });

const SCRAPE_UA = "TheBriefBot/1.0 (+https://thebrief.agency; content aggregation)";
const MAX_ARTICLES_PER_FEED = 5; // Limit per feed for first run
const DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Scraper (Cheerio only, no Puppeteer in script context) ────────────
async function scrapeArticle(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": SCRAPE_UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const parsedUrl = new URL(url);

  // Remove junk
  $("script, style, nav, header, footer, aside, .ad, .sidebar, .comments").remove();

  // Extract body
  let body = "";
  for (const sel of ["article", '[role="main"]', ".article-body", ".post-content", ".entry-content", "main"]) {
    const el = $(sel).first();
    if (el.length) {
      body = el.text().replace(/\s+/g, " ").trim();
      if (body.length > 200) break;
    }
  }
  if (body.length < 200) {
    body = $("body p").toArray().map((p) => $(p).text().trim()).filter((t) => t.length > 20).join("\n\n");
  }

  return {
    url,
    title: $('meta[property="og:title"]').attr("content") || $("title").text().trim() || "Untitled",
    thumbnail_url: $('meta[property="og:image"]').attr("content") || null,
    source_name: $('meta[property="og:site_name"]').attr("content") || parsedUrl.hostname.replace(/^www\./, ""),
    source_favicon: `${parsedUrl.origin}/favicon.ico`,
    author: $('meta[name="author"]').attr("content") || $('[rel="author"]').first().text().trim() || null,
    published_at: $('meta[property="article:published_time"]').attr("content") || $("time[datetime]").first().attr("datetime") || null,
    raw_content: body,
  };
}

// ─── AI Enrichment ─────────────────────────────────────────────────────
async function enrichArticle(article: { title: string; source_name: string | null; raw_content: string }, tagTaxonomy: string[]) {
  const truncated = article.raw_content.length > 15000 ? article.raw_content.slice(0, 15000) + "..." : article.raw_content;
  const prompt = `You are a trends analyst at a leading sports and entertainment marketing agency. Given the following article, provide:

1. HEADLINE: A concise, engaging headline (max 12 words) that would grab the attention of brand marketers and sponsorship professionals.
2. SUMMARY: A 2-3 sentence overview that explains why this matters for brands investing in sports, entertainment, and culture. Focus on the strategic implications, not just what happened.
3. TAGS: Select all applicable tags from this list: [${tagTaxonomy.join(", ")}]. Return as a JSON array.

Article title: ${article.title}
Article source: ${article.source_name || "Unknown"}
Article text: ${truncated}

Respond in JSON format:
{
  "headline": "...",
  "summary": "...",
  "tags": ["tag1", "tag2", ...]
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text in Claude response");

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in enrichment response");
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    headline: parsed.headline as string,
    summary: parsed.summary as string,
    tags: (parsed.tags as string[]).map((t) => t.toLowerCase().trim()),
  };
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("=== RSS Ingestion Pipeline ===\n");

  // Get tag taxonomy
  const { data: tags } = await supabase.from("tags").select("id, name");
  const tagTaxonomy = (tags || []).map((t) => t.name);
  const tagMap = new Map((tags || []).map((t) => [t.name, t.id]));
  console.log(`Tag taxonomy: ${tagTaxonomy.length} tags loaded\n`);

  // Get active feeds
  const { data: feeds } = await supabase.from("feed_sources").select("*").eq("active", true).order("name");
  if (!feeds || feeds.length === 0) {
    console.log("No active feeds found.");
    return;
  }
  console.log(`Active feeds: ${feeds.length}\n`);

  let totalIngested = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const feed of feeds) {
    console.log(`\n── ${feed.name} (${feed.url}) ──`);

    let entries: { url: string; title: string }[] = [];
    try {
      const parsed = await rssParser.parseURL(feed.url);
      entries = (parsed.items || [])
        .filter((item) => item.link)
        .slice(0, MAX_ARTICLES_PER_FEED)
        .map((item) => ({ url: item.link!, title: item.title || "Untitled" }));
      console.log(`  Parsed ${entries.length} entries (capped at ${MAX_ARTICLES_PER_FEED})`);
    } catch (err) {
      console.error(`  FAIL parsing feed: ${err instanceof Error ? err.message : err}`);
      totalFailed++;
      continue;
    }

    for (const entry of entries) {
      // Deduplicate
      const { data: existing } = await supabase.from("articles").select("id").eq("url", entry.url).maybeSingle();
      if (existing) {
        console.log(`  SKIP  ${entry.title.slice(0, 60)}`);
        totalSkipped++;
        continue;
      }

      try {
        // Scrape
        console.log(`  SCRAPE ${entry.title.slice(0, 60)}...`);
        const scraped = await scrapeArticle(entry.url);

        if (scraped.raw_content.length < 50) {
          console.log(`  SKIP  (too short: ${scraped.raw_content.length} chars)`);
          totalSkipped++;
          await sleep(DELAY_MS);
          continue;
        }

        // Enrich
        console.log(`  ENRICH...`);
        let headline: string | null = null;
        let summary: string | null = null;
        let enrichTags: string[] = [];
        try {
          const enrichment = await enrichArticle(scraped, tagTaxonomy);
          headline = enrichment.headline;
          summary = enrichment.summary;
          enrichTags = enrichment.tags;
        } catch (err) {
          console.warn(`  WARN  enrichment failed: ${err instanceof Error ? err.message : err}`);
        }

        // Insert article
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
            author: scraped.author || null,
            published_at: scraped.published_at,
            raw_content: scraped.raw_content,
            ingested_by: "auto",
            status: "active",
          })
          .select("id")
          .single();

        if (insertError) {
          console.error(`  FAIL  insert: ${insertError.message}`);
          totalFailed++;
          await sleep(DELAY_MS);
          continue;
        }

        // Insert tags
        if (enrichTags.length > 0 && article) {
          const tagRows = enrichTags
            .map((name) => tagMap.get(name))
            .filter(Boolean)
            .map((tagId) => ({ article_id: article.id, tag_id: tagId!, source: "ai" }));

          if (tagRows.length > 0) {
            await supabase.from("article_tags").insert(tagRows);
          }
        }

        console.log(`  OK    "${headline || scraped.title}" [${enrichTags.join(", ")}]`);
        totalIngested++;
      } catch (err) {
        console.error(`  FAIL  ${entry.url}: ${err instanceof Error ? err.message : err}`);
        totalFailed++;
      }

      await sleep(DELAY_MS);
    }

    // Update last_fetched_at
    await supabase
      .from("feed_sources")
      .update({ last_fetched_at: new Date().toISOString() })
      .eq("id", feed.id);
  }

  console.log(`\n=== Done ===`);
  console.log(`Ingested: ${totalIngested}`);
  console.log(`Skipped:  ${totalSkipped}`);
  console.log(`Failed:   ${totalFailed}`);

  // Show article count
  const { count } = await supabase.from("articles").select("*", { count: "exact", head: true });
  console.log(`\nTotal articles in database: ${count}`);
}

main().catch(console.error);
