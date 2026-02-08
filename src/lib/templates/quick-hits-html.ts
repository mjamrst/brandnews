import type { NewsletterData } from './types';
import { getHeadline, getSummary, getWhyItMatters } from './types';
import {
  escapeHtml,
  htmlPageWrapper,
  renderHtmlHeader,
  renderHtmlFooter,
  renderHtmlArticleLink,
} from './html-helpers';

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; color: #1a202c; }
  .container { max-width: 720px; margin: 0 auto; background-color: #ffffff; }
  .cards { padding: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  @media (max-width: 640px) { .cards { grid-template-columns: 1fr; } }
  .card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
  .card-img { width: 100%; height: 140px; object-fit: cover; }
  .card-placeholder { width: 100%; height: 140px; background-color: #e2e8f0; }
  .card-body { padding: 12px; flex: 1; display: flex; flex-direction: column; }
  .card-body h3 { font-size: 15px; line-height: 1.3; font-weight: 600; }
  .card-body h3 a { text-decoration: none; color: inherit; }
  .card-body p { margin-top: 6px; font-size: 13px; color: #4a5568; line-height: 1.5; flex: 1; }
  .card-source { font-size: 11px; color: #718096; margin-top: 8px; padding-top: 8px; border-top: 1px solid #edf2f7; }
`;

export function renderQuickHitsHtml(data: NewsletterData): string {
  const { articles, brand_config } = data;
  const showWim = brand_config.show_why_it_matters;
  const brandName = data.title.split(/\s*[—–-]\s*/)[0] || '';

  const cardsHtml = articles
    .map((article) => {
      const headline = getHeadline(article);
      const summary = getSummary(article);
      const oneSentence = summary.split(/\.\s/)[0] + (summary.includes('.') ? '.' : '');
      const imgHtml = article.thumbnail_url
        ? `<img src="${escapeHtml(article.thumbnail_url)}" alt="" class="card-img">`
        : '<div class="card-placeholder"></div>';

      const wimText = getWhyItMatters(article);
      const wimHtml = showWim && wimText
        ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #edf2f7;">
  <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${brand_config.accent_color}; margin: 0 0 2px;">WHY IT MATTERS TO ${escapeHtml(brandName.toUpperCase())}</p>
  <p style="font-size: 11px; color: #4a5568; line-height: 1.4; margin: 0;">${escapeHtml(wimText)}</p>
</div>`
        : '';
      const linkHtml = renderHtmlArticleLink(article.url, brand_config.accent_color);

      return `<div class="card">
  ${imgHtml}
  <div class="card-body">
    <h3><a href="${escapeHtml(article.url)}">${escapeHtml(headline)}</a></h3>
    <p>${escapeHtml(oneSentence)}</p>
    ${article.source_name ? `<div class="card-source">${escapeHtml(article.source_name)}</div>` : ''}
    ${wimHtml}
    ${linkHtml}
  </div>
</div>`;
    })
    .join('\n');

  const bodyHtml = `<div class="container">
${renderHtmlHeader(data)}
<div class="cards">
${cardsHtml}
</div>
${renderHtmlFooter(brand_config)}
</div>`;

  return htmlPageWrapper(data.title, bodyHtml, STYLES);
}
