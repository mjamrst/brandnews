export interface ScrapedArticle {
  url: string;
  title: string;
  thumbnail_url: string | null;
  source_name: string | null;
  source_favicon: string | null;
  author: string | null;
  published_at: string | null;
  raw_content: string;
}

export interface EnrichmentResult {
  headline: string;
  summary: string;
  tags: string[];
}

export interface IngestedArticle {
  id: string;
  url: string;
  title: string;
  headline: string | null;
  summary: string | null;
  thumbnail_url: string | null;
  source_name: string | null;
  source_favicon: string | null;
  author: string | null;
  published_at: string | null;
  ingested_at: string;
  ingested_by: string | null;
  raw_content: string | null;
  status: string;
  tags: string[];
}

export interface IngestionOptions {
  /** Skip AI enrichment (store raw only) */
  skip_enrichment?: boolean;
  /** User-provided article text (for paywalled articles) */
  manual_content?: string;
  /** Who initiated the ingestion ('auto' or a user UUID) */
  ingested_by?: string;
}

export interface FeedEntry {
  url: string;
  title: string;
  published_at: string | null;
  description: string | null;
}

export interface PollResult {
  ingested: number;
  skipped: number;
  failed: number;
}

export interface BatchResult {
  success: IngestedArticle[];
  failures: { url: string; error: string }[];
}
