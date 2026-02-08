import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedArticle, EnrichmentResult } from "./types";

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_BODY_LENGTH = 15000;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

function buildPrompt(
  article: ScrapedArticle,
  tagTaxonomy: string[]
): string {
  const truncatedBody =
    article.raw_content.length > MAX_BODY_LENGTH
      ? article.raw_content.slice(0, MAX_BODY_LENGTH) + "..."
      : article.raw_content;

  const tagList = tagTaxonomy.join(", ");

  return `You are a trends analyst at a leading sports and entertainment marketing agency. Given the following article, provide:

1. HEADLINE: A concise, engaging headline (max 12 words) that would grab the attention of brand marketers and sponsorship professionals.

2. SUMMARY: A 2-3 sentence overview that explains why this matters for brands investing in sports, entertainment, and culture. Focus on the strategic implications, not just what happened.

3. TAGS: Select all applicable tags from this list: [${tagList}]. Return as a JSON array.

Article title: ${article.title}
Article source: ${article.source_name || "Unknown"}
Article text: ${truncatedBody}

Respond in JSON format:
{
  "headline": "...",
  "summary": "...",
  "tags": ["tag1", "tag2", ...]
}`;
}

function parseEnrichmentResponse(text: string): EnrichmentResult {
  // Try to extract JSON from the response (Claude may wrap it in markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in enrichment response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (typeof parsed.headline !== "string") {
    throw new Error("Missing or invalid headline in enrichment response");
  }
  if (typeof parsed.summary !== "string") {
    throw new Error("Missing or invalid summary in enrichment response");
  }
  if (!Array.isArray(parsed.tags)) {
    throw new Error("Missing or invalid tags in enrichment response");
  }

  return {
    headline: parsed.headline,
    summary: parsed.summary,
    tags: parsed.tags.map((t: unknown) => String(t).toLowerCase().trim()),
  };
}

/**
 * Enrich an article using Claude API.
 * Sends the article text and tag taxonomy, returns headline, summary, and tags.
 */
export async function enrichArticle(
  article: ScrapedArticle,
  tagTaxonomy: string[]
): Promise<EnrichmentResult> {
  const client = getClient();
  const prompt = buildPrompt(article, tagTaxonomy);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      // Extract text from the response
      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text content in Claude response");
      }

      return parseEnrichmentResponse(textBlock.text);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `Enrichment attempt ${attempt + 1}/${MAX_RETRIES} failed for ${article.url}:`,
        lastError.message
      );

      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Enrichment failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}
