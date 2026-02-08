// Re-export database types for convenience
export type {
  Article,
  ArticleInsert,
  ArticleUpdate,
  Tag,
  TagInsert,
  ArticleTag,
  Profile,
  ProfileUpdate,
  Newsletter,
  NewsletterInsert,
  NewsletterUpdate,
  NewsletterArticle,
  NewsletterArticleInsert,
  FeedSource,
  FeedSourceInsert,
  FeedSourceUpdate,
} from "@/lib/supabase/database.types";

// Frontend-specific types

export interface ArticleWithTags {
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
  search_vector: string | null;
  created_at: string;
  updated_at: string;
  tags?: { id: string; name: string; category: string | null }[];
}

export interface PartnerLogo {
  url: string;
  alt: string;
}

export interface BrandTemplate {
  id: string;
  name: string;
  // Identity
  logo_url: string | null;
  header_image_url: string | null;
  partner_logos: PartnerLogo[];
  // Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  // Typography
  heading_font: string;
  body_font: string;
  // Content
  subtitle: string | null;
  footer_text: string | null;
  brand_description: string | null;
  // Layout
  default_template_id: string;
  show_why_it_matters: boolean;
  // Timestamps
  created_at: string;
}

export type SortOption = "recent" | "most-selected" | "alphabetical";

export interface ArticleFilters {
  search: string;
  tags: string[];
  dateFrom: string | null;
  dateTo: string | null;
  sources: string[];
  status: string;
  sort: SortOption;
}
