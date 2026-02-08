import type { BrandConfig, NewsletterData, TemplateArticle } from './types';
import { getHeadline, getSummary, getWhyItMatters } from './types';

/** Escape HTML entities */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format a date string for display */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Generate the standard HTML page wrapper (for static HTML renderers) */
export function htmlPageWrapper(
  title: string,
  bodyHtml: string,
  styles: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${styles}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/** Generate the standard email HTML wrapper (table-based) */
export function emailPageWrapper(
  title: string,
  bodyHtml: string,
  styles: string,
): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; display: block; }
    ${styles}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">
          <tr>
            <td>
${bodyHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Render partner logos bar for static HTML */
function renderHtmlPartnerLogosBar(data: NewsletterData): string {
  const { brand_config } = data;
  if (!brand_config.partner_logos.length) return '';
  const logosHtml = brand_config.partner_logos
    .map((l) => `<img src="${escapeHtml(l.url)}" alt="${escapeHtml(l.alt)}" style="height: 24px; max-width: 80px; object-fit: contain;">`)
    .join('');
  return `<div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 24px; border-bottom: 1px solid #e2e8f0;">
  <span style="font-size: 12px; color: #718096;">${formatDate(data.created_at).toUpperCase()}</span>
  <div style="display: flex; align-items: center; gap: 12px;">${logosHtml}</div>
</div>`;
}

/** Render the standard header banner for static HTML */
export function renderHtmlHeader(data: NewsletterData): string {
  const { brand_config } = data;
  const partnersBar = renderHtmlPartnerLogosBar(data);

  let headerHtml: string;
  if (brand_config.header_image_url) {
    headerHtml = `<div style="background-color: ${brand_config.primary_color};">
  <img src="${escapeHtml(brand_config.header_image_url)}" alt="" style="width: 100%; max-height: 200px; object-fit: cover; display: block;">
</div>`;
  } else {
    const logoHtml = brand_config.logo_url
      ? `<img src="${escapeHtml(brand_config.logo_url)}" alt="Logo" style="max-height: 40px; margin-bottom: 8px;">`
      : '';
    const dateHtml = brand_config.partner_logos.length === 0
      ? `<p style="margin: 8px 0 0; font-size: 14px; opacity: 0.8;">${formatDate(data.created_at)}</p>`
      : '';
    headerHtml = `<header style="background-color: ${brand_config.primary_color}; color: #ffffff; padding: 32px; text-align: center; font-family: ${brand_config.heading_font}, sans-serif;">
  ${logoHtml}
  <h1 style="margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">${escapeHtml(data.title)}</h1>
  ${dateHtml}
</header>`;
  }

  const subtitleHtml = brand_config.subtitle
    ? `<div style="background-color: ${brand_config.primary_color}; color: rgba(255,255,255,0.9); padding: 12px 24px; text-align: center; font-size: 14px; font-style: italic;">${escapeHtml(brand_config.subtitle)}</div>`
    : '';

  return `${partnersBar}${headerHtml}${subtitleHtml}`;
}

/** Render partner logos bar for email HTML (table-based) */
function renderEmailPartnerLogosBar(data: NewsletterData): string {
  const { brand_config } = data;
  if (!brand_config.partner_logos.length) return '';
  const logosHtml = brand_config.partner_logos
    .map((l) => `<img src="${escapeHtml(l.url)}" alt="${escapeHtml(l.alt)}" style="height: 24px; max-width: 80px;" height="24">`)
    .join('&nbsp;&nbsp;');
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid #e2e8f0;">
  <tr>
    <td style="padding: 8px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #718096;">${formatDate(data.created_at).toUpperCase()}</td>
    <td align="right" style="padding: 8px 20px;">${logosHtml}</td>
  </tr>
</table>`;
}

/** Render the standard header banner for email HTML (table-based) */
export function renderEmailHeader(data: NewsletterData): string {
  const { brand_config } = data;
  const partnersBar = renderEmailPartnerLogosBar(data);

  let headerHtml: string;
  if (brand_config.header_image_url) {
    headerHtml = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${brand_config.primary_color};">
  <tr>
    <td><img src="${escapeHtml(brand_config.header_image_url)}" alt="" width="600" style="width: 100%; max-height: 200px; display: block;"></td>
  </tr>
</table>`;
  } else {
    const logoHtml = brand_config.logo_url
      ? `<tr><td align="center" style="padding-bottom: 8px;"><img src="${escapeHtml(brand_config.logo_url)}" alt="Logo" style="max-height: 40px;" width="auto" height="40"></td></tr>`
      : '';
    const dateHtml = brand_config.partner_logos.length === 0
      ? `<tr><td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #ffffff; opacity: 0.8; padding-top: 8px;">${formatDate(data.created_at)}</td></tr>`
      : '';
    headerHtml = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${brand_config.primary_color};">
  <tr>
    <td align="center" style="padding: 32px 20px; color: #ffffff;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        ${logoHtml}
        <tr>
          <td align="center" style="font-family: ${brand_config.heading_font}, Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 700; color: #ffffff; line-height: 1.3;">
            ${escapeHtml(data.title)}
          </td>
        </tr>
        ${dateHtml}
      </table>
    </td>
  </tr>
</table>`;
  }

  const subtitleHtml = brand_config.subtitle
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${brand_config.primary_color};">
  <tr>
    <td align="center" style="padding: 0 20px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-style: italic; color: rgba(255,255,255,0.9);">
      ${escapeHtml(brand_config.subtitle)}
    </td>
  </tr>
</table>`
    : '';

  return `${partnersBar}${headerHtml}${subtitleHtml}`;
}

/** Render the standard footer for static HTML */
export function renderHtmlFooter(brand_config: BrandConfig): string {
  return `<footer style="background-color: ${brand_config.secondary_color}; color: #ffffff; padding: 24px; text-align: center; font-size: 13px; opacity: 0.9;">
  <p style="margin: 0;">${escapeHtml(brand_config.footer_text)}</p>
</footer>`;
}

/** Render the standard footer for email HTML (table-based) */
export function renderEmailFooter(brand_config: BrandConfig): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${brand_config.secondary_color};">
  <tr>
    <td align="center" style="padding: 24px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #ffffff;">
      ${escapeHtml(brand_config.footer_text)}
    </td>
  </tr>
</table>`;
}

/** Render "Why it matters" block for static HTML */
export function renderHtmlWhyItMatters(article: TemplateArticle, brandName: string, accentColor: string): string {
  const text = getWhyItMatters(article);
  if (!text) return '';
  return `<div style="margin-top: 12px;">
  <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${accentColor}; margin: 0 0 4px;">WHY IT MATTERS TO ${escapeHtml(brandName.toUpperCase())}</p>
  <p style="font-size: 14px; color: #4a5568; line-height: 1.5; margin: 0;">${escapeHtml(text)}</p>
</div>`;
}

/** Render "Why it matters" block for email HTML (table-based) */
export function renderEmailWhyItMatters(article: TemplateArticle, brandName: string, accentColor: string): string {
  const text = getWhyItMatters(article);
  if (!text) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding-top: 12px; font-family: Arial, Helvetica, sans-serif;">
      <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${accentColor}; margin: 0 0 4px;">WHY IT MATTERS TO ${escapeHtml(brandName.toUpperCase())}</p>
      <p style="font-size: 14px; color: #4a5568; line-height: 1.5; margin: 0;">${escapeHtml(text)}</p>
    </td>
  </tr>
</table>`;
}

/** Render article link for static HTML */
export function renderHtmlArticleLink(url: string, accentColor: string): string {
  return `<a href="${escapeHtml(url)}" style="display: inline-block; margin-top: 8px; font-size: 12px; font-weight: 500; font-style: italic; color: ${accentColor}; text-decoration: none;">Article Link</a>`;
}

/** Render article link for email HTML */
export function renderEmailArticleLink(url: string, accentColor: string): string {
  return `<a href="${escapeHtml(url)}" style="display: inline-block; margin-top: 8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 500; font-style: italic; color: ${accentColor}; text-decoration: none;">Article Link</a>`;
}

/** Render a single article card for static HTML */
export function renderHtmlArticleRow(article: TemplateArticle, accentColor: string, showWhyItMatters = false, brandName = ''): string {
  const headline = getHeadline(article);
  const summary = getSummary(article);
  const thumbnailHtml = article.thumbnail_url
    ? `<img src="${escapeHtml(article.thumbnail_url)}" alt="" style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">`
    : `<div style="width: 120px; height: 80px; background-color: #e2e8f0; border-radius: 6px; flex-shrink: 0;"></div>`;

  const wimHtml = showWhyItMatters ? renderHtmlWhyItMatters(article, brandName, accentColor) : '';
  const linkHtml = renderHtmlArticleLink(article.url, accentColor);

  return `<div style="display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
  ${thumbnailHtml}
  <div style="flex: 1; min-width: 0;">
    <a href="${escapeHtml(article.url)}" style="text-decoration: none; color: ${accentColor}; font-weight: 600; font-size: 16px; line-height: 1.4; display: block;">${escapeHtml(headline)}</a>
    <p style="margin: 4px 0 0; font-size: 14px; color: #4a5568; line-height: 1.5;">${escapeHtml(summary)}</p>
    ${article.source_name ? `<span style="font-size: 12px; color: #718096; margin-top: 4px; display: inline-block;">${escapeHtml(article.source_name)}</span>` : ''}
    ${wimHtml}
    ${linkHtml}
  </div>
</div>`;
}

/** Render a single article row for email HTML (table-based) */
export function renderEmailArticleRow(article: TemplateArticle, accentColor: string, showWhyItMatters = false, brandName = ''): string {
  const headline = getHeadline(article);
  const summary = getSummary(article);
  const thumbnailHtml = article.thumbnail_url
    ? `<img src="${escapeHtml(article.thumbnail_url)}" alt="" width="120" height="80" style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; display: block;">`
    : `<div style="width: 120px; height: 80px; background-color: #e2e8f0; border-radius: 6px;"></div>`;

  const wimHtml = showWhyItMatters ? renderEmailWhyItMatters(article, brandName, accentColor) : '';
  const linkHtml = renderEmailArticleLink(article.url, accentColor);

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid #e2e8f0;">
  <tr>
    <td style="padding: 16px 0; vertical-align: top; width: 120px;">
      ${thumbnailHtml}
    </td>
    <td style="padding: 16px 0 16px 16px; vertical-align: top; font-family: Arial, Helvetica, sans-serif;">
      <a href="${escapeHtml(article.url)}" style="text-decoration: none; color: ${accentColor}; font-weight: 600; font-size: 16px; line-height: 1.4;">${escapeHtml(headline)}</a>
      <p style="margin: 4px 0 0; font-size: 14px; color: #4a5568; line-height: 1.5;">${escapeHtml(summary)}</p>
      ${article.source_name ? `<p style="margin: 4px 0 0; font-size: 12px; color: #718096;">${escapeHtml(article.source_name)}</p>` : ''}
      ${wimHtml}
      ${linkHtml}
    </td>
  </tr>
</table>`;
}

export { getHeadline, getSummary };
