import type { NewsletterData } from './types';
import { getHeadline, getSummary } from './types';
import {
  escapeHtml,
  emailPageWrapper,
  renderEmailHeader,
  renderEmailFooter,
  renderEmailArticleRow,
  renderEmailWhyItMatters,
  renderEmailArticleLink,
} from './html-helpers';

const STYLES = `
  .hero-headline a { text-decoration: none; }
`;

export function renderTheRundownEmailHtml(data: NewsletterData): string {
  const { articles, brand_config } = data;
  const [hero, ...rest] = articles;
  const showWim = brand_config.show_why_it_matters;
  const brandName = data.title.split(/\s*[—–-]\s*/)[0] || '';

  let heroHtml = '';
  if (hero) {
    const heroHeadline = getHeadline(hero);
    const heroSummary = getSummary(hero);
    const heroImg = hero.thumbnail_url
      ? `<img src="${escapeHtml(hero.thumbnail_url)}" alt="" width="560" style="width: 100%; max-width: 560px; height: auto; border-radius: 8px; display: block;">`
      : `<div style="width: 100%; height: 200px; background-color: #e2e8f0; border-radius: 8px;"></div>`;
    const wimHtml = showWim ? renderEmailWhyItMatters(hero, brandName, brand_config.accent_color) : '';
    const linkHtml = renderEmailArticleLink(hero.url, brand_config.accent_color);

    heroHtml = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 2px solid #e2e8f0;">
  <tr>
    <td style="padding: 24px 20px;">
      ${heroImg}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td class="hero-headline" style="padding-top: 16px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 700; line-height: 1.3; color: #1a202c;">
            <a href="${escapeHtml(hero.url)}" style="text-decoration: none; color: #1a202c;">${escapeHtml(heroHeadline)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 8px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #4a5568; line-height: 1.6;">
            ${escapeHtml(heroSummary)}
          </td>
        </tr>
        ${hero.source_name ? `<tr><td style="padding-top: 8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #718096;">${escapeHtml(hero.source_name)}</td></tr>` : ''}
        <tr><td>${wimHtml}${linkHtml}</td></tr>
      </table>
    </td>
  </tr>
</table>`;
  }

  const articlesHtml = rest
    .map((article) => renderEmailArticleRow(article, brand_config.accent_color, showWim, brandName))
    .join('\n');

  const bodyHtml = `${renderEmailHeader(data)}
${heroHtml}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff;">
  <tr>
    <td style="padding: 8px 20px 24px;">
${articlesHtml}
    </td>
  </tr>
</table>
${renderEmailFooter(brand_config)}`;

  return emailPageWrapper(data.title, bodyHtml, STYLES);
}
