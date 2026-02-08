import type { NewsletterData } from './types';
import { getHeadline, getSummary } from './types';
import {
  escapeHtml,
  htmlPageWrapper,
  renderHtmlHeader,
  renderHtmlFooter,
  renderHtmlArticleRow,
  renderHtmlWhyItMatters,
  renderHtmlArticleLink,
} from './html-helpers';

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; color: #1a202c; }
  .container { max-width: 720px; margin: 0 auto; background-color: #ffffff; }
  .hero { padding: 24px; border-bottom: 2px solid #e2e8f0; }
  .hero-img { width: 100%; max-height: 360px; object-fit: cover; border-radius: 8px; }
  .hero-placeholder { width: 100%; height: 240px; background-color: #e2e8f0; border-radius: 8px; }
  .hero h2 { margin-top: 16px; font-size: 22px; line-height: 1.3; }
  .hero h2 a { text-decoration: none; color: inherit; }
  .hero p { margin-top: 8px; font-size: 15px; color: #4a5568; line-height: 1.6; }
  .hero .source { font-size: 12px; color: #718096; margin-top: 8px; }
  .articles { padding: 8px 24px 24px; }
`;

export function renderTheRundownHtml(data: NewsletterData): string {
  const { articles, brand_config } = data;
  const [hero, ...rest] = articles;
  const showWim = brand_config.show_why_it_matters;
  const brandName = data.title.split(/\s*[—–-]\s*/)[0] || '';

  let heroHtml = '';
  if (hero) {
    const heroHeadline = getHeadline(hero);
    const heroSummary = getSummary(hero);
    const heroImg = hero.thumbnail_url
      ? `<img src="${escapeHtml(hero.thumbnail_url)}" alt="" class="hero-img">`
      : '<div class="hero-placeholder"></div>';
    const wimHtml = showWim ? renderHtmlWhyItMatters(hero, brandName, brand_config.accent_color) : '';
    const linkHtml = renderHtmlArticleLink(hero.url, brand_config.accent_color);

    heroHtml = `<div class="hero">
  ${heroImg}
  <h2><a href="${escapeHtml(hero.url)}">${escapeHtml(heroHeadline)}</a></h2>
  <p>${escapeHtml(heroSummary)}</p>
  ${hero.source_name ? `<span class="source">${escapeHtml(hero.source_name)}</span>` : ''}
  ${wimHtml}
  ${linkHtml}
</div>`;
  }

  const articlesHtml = rest
    .map((article) => renderHtmlArticleRow(article, brand_config.accent_color, showWim, brandName))
    .join('\n');

  const bodyHtml = `<div class="container">
${renderHtmlHeader(data)}
${heroHtml}
<div class="articles">
${articlesHtml}
</div>
${renderHtmlFooter(brand_config)}
</div>`;

  return htmlPageWrapper(data.title, bodyHtml, STYLES);
}
