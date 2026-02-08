import type { NewsletterData, TemplateArticle } from './types';
import { getHeadline, getSummary } from './types';
import {
  escapeHtml,
  emailPageWrapper,
  renderEmailHeader,
  renderEmailFooter,
  renderEmailArticleRow,
} from './html-helpers';

const STYLES = `
  .section-link { text-decoration: none; }
`;

function groupBySections(articles: TemplateArticle[]): Map<string, TemplateArticle[]> {
  const groups = new Map<string, TemplateArticle[]>();
  for (const article of articles) {
    const section = article.section || 'General';
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section)!.push(article);
  }
  return groups;
}

export function renderDeepDiveEmailHtml(data: NewsletterData): string {
  const { articles, brand_config } = data;
  const sections = groupBySections(articles);
  const showWim = brand_config.show_why_it_matters;
  const brandName = data.title.split(/\s*[—–-]\s*/)[0] || '';

  // Table-of-contents as an inline list (sidebar not viable in email)
  const tocItems = Array.from(sections.keys())
    .map((section) => `<span style="display: inline; font-family: Arial, Helvetica, sans-serif; font-size: 13px;"><a href="#section-${section.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" class="section-link" style="text-decoration: none; color: ${brand_config.accent_color};">${escapeHtml(section)}</a></span>`)
    .join(' &nbsp;&bull;&nbsp; ');

  const tocHtml = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
  <tr>
    <td style="padding: 16px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #718096; font-weight: 700;">
      In This Issue:
    </td>
  </tr>
  <tr>
    <td style="padding: 0 20px 16px;">
      ${tocItems}
    </td>
  </tr>
</table>`;

  // Sections
  const sectionsHtml = Array.from(sections.entries())
    .map(([section, sectionArticles]) => {
      const articlesHtml = sectionArticles
        .map((article) => renderEmailArticleRow(article, brand_config.accent_color, showWim, brandName))
        .join('\n');

      return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" id="section-${section.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">
  <tr>
    <td style="padding: 24px 20px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-family: Arial, Helvetica, sans-serif; font-size: 18px; font-weight: 700; color: #1a202c; padding-bottom: 8px; border-bottom: 2px solid ${brand_config.accent_color};">
            ${escapeHtml(section)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 20px 16px;">
      ${articlesHtml}
    </td>
  </tr>
</table>`;
    })
    .join('\n');

  const bodyHtml = `${renderEmailHeader(data)}
${tocHtml}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff;">
  <tr>
    <td>
${sectionsHtml}
    </td>
  </tr>
</table>
${renderEmailFooter(brand_config)}`;

  return emailPageWrapper(data.title, bodyHtml, STYLES);
}
