import type { NewsletterData, TemplateArticle } from './types';
import { getHeadline, getSummary, getWhyItMatters } from './types';
import {
  escapeHtml,
  emailPageWrapper,
  renderEmailHeader,
  renderEmailFooter,
  renderEmailArticleLink,
} from './html-helpers';

const STYLES = `
  .card-link { text-decoration: none; }
`;

function renderCardCell(article: TemplateArticle, accentColor: string, showWim: boolean, brandName: string): string {
  const headline = getHeadline(article);
  const summary = getSummary(article);
  const oneSentence = summary.split(/\.\s/)[0] + (summary.includes('.') ? '.' : '');
  const imgHtml = article.thumbnail_url
    ? `<img src="${escapeHtml(article.thumbnail_url)}" alt="" width="180" style="width: 100%; height: 120px; object-fit: cover; display: block;">`
    : `<div style="width: 100%; height: 120px; background-color: #e2e8f0;"></div>`;

  const wimText = getWhyItMatters(article);
  const wimHtml = showWim && wimText
    ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #edf2f7;">
  <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${accentColor}; margin: 0 0 2px; font-family: Arial, Helvetica, sans-serif;">WHY IT MATTERS TO ${escapeHtml(brandName.toUpperCase())}</p>
  <p style="font-size: 11px; color: #4a5568; line-height: 1.4; margin: 0; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(wimText)}</p>
</div>`
    : '';
  const linkHtml = renderEmailArticleLink(article.url, accentColor);

  return `<td style="width: 33.33%; vertical-align: top; padding: 8px;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <tr>
      <td>${imgHtml}</td>
    </tr>
    <tr>
      <td style="padding: 12px; font-family: Arial, Helvetica, sans-serif;">
        <a href="${escapeHtml(article.url)}" class="card-link" style="text-decoration: none; color: ${accentColor}; font-size: 14px; font-weight: 600; line-height: 1.3;">${escapeHtml(headline)}</a>
        <p style="margin: 6px 0 0; font-size: 12px; color: #4a5568; line-height: 1.4;">${escapeHtml(oneSentence)}</p>
        ${article.source_name ? `<p style="margin: 8px 0 0; padding-top: 8px; border-top: 1px solid #edf2f7; font-size: 11px; color: #718096;">${escapeHtml(article.source_name)}</p>` : ''}
        ${wimHtml}
        ${linkHtml}
      </td>
    </tr>
  </table>
</td>`;
}

export function renderQuickHitsEmailHtml(data: NewsletterData): string {
  const { articles, brand_config } = data;
  const showWim = brand_config.show_why_it_matters;
  const brandName = data.title.split(/\s*[—–-]\s*/)[0] || '';

  // Build rows of 3 cards each
  const rows: string[] = [];
  for (let i = 0; i < articles.length; i += 3) {
    const cells = articles.slice(i, i + 3);
    const cellsHtml = cells
      .map((article) => renderCardCell(article, brand_config.accent_color, showWim, brandName))
      .join('\n');
    // Pad with empty cells if fewer than 3
    const emptyCount = 3 - cells.length;
    const emptyCells = emptyCount > 0
      ? Array(emptyCount).fill('<td style="width: 33.33%;"></td>').join('\n')
      : '';

    rows.push(`<tr>\n${cellsHtml}\n${emptyCells}\n</tr>`);
  }

  const bodyHtml = `${renderEmailHeader(data)}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff;">
  <tr>
    <td style="padding: 16px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${rows.join('\n')}
      </table>
    </td>
  </tr>
</table>
${renderEmailFooter(brand_config)}`;

  return emailPageWrapper(data.title, bodyHtml, STYLES);
}
