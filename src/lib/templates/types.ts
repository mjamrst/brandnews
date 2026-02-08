import type { ComponentType } from 'react';

export interface PartnerLogo {
  url: string;
  alt: string;
}

export interface TemplateArticle {
  id: string;
  url: string;
  title: string;
  headline: string | null;
  summary: string | null;
  thumbnail_url: string | null;
  source_name: string | null;
  tags: string[];
  position: number;
  section: string | null;
  custom_headline: string | null;
  custom_summary: string | null;
  why_it_matters: string | null;
}

export interface BrandConfig {
  logo_url: string | null;
  header_image_url: string | null;
  partner_logos: PartnerLogo[];
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  heading_font: string;
  body_font: string;
  subtitle: string | null;
  footer_text: string;
  show_why_it_matters: boolean;
}

export interface NewsletterData {
  id: string;
  title: string;
  template_id: string;
  brand_config: BrandConfig;
  articles: TemplateArticle[];
  created_at: string;
  published_at: string | null;
}

export interface TemplateProps {
  newsletter: NewsletterData;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  component: ComponentType<TemplateProps>;
  renderHtml: (data: NewsletterData) => string;
  renderEmailHtml: (data: NewsletterData) => string;
}

/** Helper to get the display headline for an article (custom overrides AI-generated) */
export function getHeadline(article: TemplateArticle): string {
  return article.custom_headline || article.headline || article.title;
}

/** Helper to get the display summary for an article (custom overrides AI-generated) */
export function getSummary(article: TemplateArticle): string {
  return article.custom_summary || article.summary || '';
}

/** Helper to get the "why it matters" text for an article */
export function getWhyItMatters(article: TemplateArticle): string {
  return article.why_it_matters || '';
}
