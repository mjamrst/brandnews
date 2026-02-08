import * as cheerio from "cheerio";
import type { ScrapedArticle } from "./types";

const USER_AGENT =
  "TheBriefBot/1.0 (+https://thebrief.agency; content aggregation)";

const DEFAULT_DELAY_MS = 1500;

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scrape an article from a URL.
 * Primary: fetch + Cheerio. Fallback: Puppeteer (for JS-rendered pages).
 */
export async function scrapeUrl(url: string): Promise<ScrapedArticle> {
  try {
    const result = await scrapeWithCheerio(url);

    // If body text is too short, try Puppeteer fallback
    if (result.raw_content.length < 200) {
      try {
        const puppeteerResult = await scrapeWithPuppeteer(url);
        if (puppeteerResult.raw_content.length > result.raw_content.length) {
          return puppeteerResult;
        }
      } catch (err) {
        console.warn(
          `Puppeteer fallback failed for ${url}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    return result;
  } catch (err) {
    // Cheerio fetch failed entirely — try Puppeteer
    console.warn(
      `Cheerio scrape failed for ${url}, trying Puppeteer:`,
      err instanceof Error ? err.message : err
    );
    return scrapeWithPuppeteer(url);
  }
}

/**
 * Scrape using fetch + Cheerio (fast, lightweight).
 */
async function scrapeWithCheerio(url: string): Promise<ScrapedArticle> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const parsedUrl = new URL(url);

  return {
    url,
    title: extractTitle($),
    thumbnail_url: extractThumbnail($, url),
    source_name: extractSourceName($, parsedUrl),
    source_favicon: extractFavicon($, parsedUrl),
    author: extractAuthor($),
    published_at: extractPublishDate($),
    raw_content: extractBodyText($),
  };
}

/**
 * Scrape using Puppeteer (for JS-rendered pages).
 */
async function scrapeWithPuppeteer(url: string): Promise<ScrapedArticle> {
  // Dynamic imports so Puppeteer is only loaded when needed
  const puppeteer = await import("puppeteer-core");
  const chromium = await import("@sparticuz/chromium");

  const browser = await puppeteer.default.launch({
    args: chromium.default.args,
    defaultViewport: { width: 1920, height: 1080 },
    executablePath: await chromium.default.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const html = await page.content();
    const $ = cheerio.load(html);
    const parsedUrl = new URL(url);

    return {
      url,
      title: extractTitle($),
      thumbnail_url: extractThumbnail($, url),
      source_name: extractSourceName($, parsedUrl),
      source_favicon: extractFavicon($, parsedUrl),
      author: extractAuthor($),
      published_at: extractPublishDate($),
      raw_content: extractBodyText($),
    };
  } finally {
    await browser.close();
  }
}

function extractTitle($: cheerio.CheerioAPI): string {
  return (
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled"
  );
}

function extractThumbnail(
  $: cheerio.CheerioAPI,
  baseUrl: string
): string | null {
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) return resolveUrl(ogImage, baseUrl);

  const twitterImage = $('meta[name="twitter:image"]').attr("content");
  if (twitterImage) return resolveUrl(twitterImage, baseUrl);

  return null;
}

function extractSourceName(
  $: cheerio.CheerioAPI,
  parsedUrl: URL
): string | null {
  return (
    $('meta[property="og:site_name"]').attr("content") ||
    parsedUrl.hostname.replace(/^www\./, "")
  );
}

function extractFavicon(
  $: cheerio.CheerioAPI,
  parsedUrl: URL
): string | null {
  const iconLink =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href");
  if (iconLink) return resolveUrl(iconLink, parsedUrl.origin);

  return `${parsedUrl.origin}/favicon.ico`;
}

function extractAuthor($: cheerio.CheerioAPI): string | null {
  return (
    $('meta[name="author"]').attr("content") ||
    $('meta[property="article:author"]').attr("content") ||
    $('[rel="author"]').first().text().trim() ||
    $(".author, .byline, [class*='author']").first().text().trim() ||
    null
  );
}

function extractPublishDate($: cheerio.CheerioAPI): string | null {
  // Try meta tags
  const metaDate =
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="date"]').attr("content") ||
    $('meta[name="publish-date"]').attr("content");
  if (metaDate) return metaDate;

  // Try JSON-LD
  const jsonLd = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => {
      try {
        return JSON.parse($(el).text());
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  for (const ld of jsonLd) {
    const data = Array.isArray(ld) ? ld[0] : ld;
    if (data?.datePublished) return data.datePublished;
  }

  // Try <time> element
  const timeEl = $("time[datetime]").first().attr("datetime");
  if (timeEl) return timeEl;

  return null;
}

function extractBodyText($: cheerio.CheerioAPI): string {
  // Remove non-content elements
  $(
    "script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar, .nav, .menu, .social-share, .comments, [role='navigation'], [role='banner'], [role='complementary']"
  ).remove();

  // Try specific content containers first
  const contentSelectors = [
    "article",
    '[role="main"]',
    ".article-body",
    ".article-content",
    ".post-content",
    ".entry-content",
    ".story-body",
    "main",
  ];

  for (const selector of contentSelectors) {
    const el = $(selector).first();
    if (el.length) {
      const text = el.text().replace(/\s+/g, " ").trim();
      if (text.length > 200) return text;
    }
  }

  // Fallback: get all paragraph text from body
  const paragraphs = $("body p")
    .toArray()
    .map((p) => $(p).text().trim())
    .filter((t) => t.length > 20);

  return paragraphs.join("\n\n") || $("body").text().replace(/\s+/g, " ").trim();
}

function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

/**
 * Wait between requests to respect rate limits.
 */
export async function rateLimitDelay(ms: number = DEFAULT_DELAY_MS) {
  await sleep(ms);
}
