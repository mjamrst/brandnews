import type { BrandConfig } from './types';

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  logo_url: null,
  header_image_url: null,
  partner_logos: [],
  primary_color: '#1a1a2e',
  secondary_color: '#16213e',
  accent_color: '#0f3460',
  heading_font: 'Inter',
  body_font: 'Inter',
  subtitle: null,
  footer_text: 'Powered by The Brief',
  show_why_it_matters: false,
};

/**
 * Merge a partial brand config (from newsletters.config JSONB) over defaults.
 * Any non-null/non-undefined value in overrides replaces the default.
 */
export function applyBrandConfig(
  overrides?: Partial<BrandConfig> | null,
): BrandConfig {
  if (!overrides) return { ...DEFAULT_BRAND_CONFIG };
  return {
    logo_url: overrides.logo_url ?? DEFAULT_BRAND_CONFIG.logo_url,
    header_image_url: overrides.header_image_url ?? DEFAULT_BRAND_CONFIG.header_image_url,
    partner_logos: overrides.partner_logos ?? DEFAULT_BRAND_CONFIG.partner_logos,
    primary_color: overrides.primary_color ?? DEFAULT_BRAND_CONFIG.primary_color,
    secondary_color: overrides.secondary_color ?? DEFAULT_BRAND_CONFIG.secondary_color,
    accent_color: overrides.accent_color ?? DEFAULT_BRAND_CONFIG.accent_color,
    heading_font: overrides.heading_font ?? DEFAULT_BRAND_CONFIG.heading_font,
    body_font: overrides.body_font ?? DEFAULT_BRAND_CONFIG.body_font,
    subtitle: overrides.subtitle ?? DEFAULT_BRAND_CONFIG.subtitle,
    footer_text: overrides.footer_text ?? DEFAULT_BRAND_CONFIG.footer_text,
    show_why_it_matters: overrides.show_why_it_matters ?? DEFAULT_BRAND_CONFIG.show_why_it_matters,
  };
}

/**
 * Extract the brand config from the newsletters.config JSONB column.
 * Expected shape: { brand: { logo_url, primary_color, ... } }
 */
export function extractBrandConfig(config: Record<string, unknown> | null): BrandConfig {
  const brandOverrides = (config?.brand as Partial<BrandConfig>) ?? null;
  return applyBrandConfig(brandOverrides);
}
