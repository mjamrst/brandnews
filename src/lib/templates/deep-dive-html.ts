import type { NewsletterData, TemplateArticle } from './types';
import { getHeadline, getSummary } from './types';
import {
  escapeHtml,
  htmlPageWrapper,
  renderHtmlHeader,
  renderHtmlFooter,
  renderHtmlArticleRow,
} from './html-helpers';

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; color: #1a202c; }
  .container { max-width: 720px; margin: 0 auto; background-color: #ffffff; }
  .layout { display: flex; }
  .sidebar { width: 200px; flex-shrink: 0; padding: 24px 16px; border-right: 1px solid #e2e8f0; position: sticky; top: 0; align-self: flex-start; }
  .sidebar h4 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #718096; margin-bottom: 12px; }
  .sidebar ul { list-style: none; }
  .sidebar li { margin-bottom: 8px; }
  .sidebar a { font-size: 13px; color: #4a5568; text-decoration: none; line-height: 1.4; display: block; }
  .sidebar a:hover { color: #1a202c; }
  .main { flex: 1; min-width: 0; }
  .section { padding: 24px; border-bottom: 1px solid #e2e8f0; }
  .section:last-child { border-bottom: none; }
  .section-header { font-size: 18px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px; }
  @media (max-width: 640px) {
    .layout { flex-direction: column; }
    .sidebar { width: 100%; border-right: none; border-bottom: 1px solid #e2e8f0; position: static; }
  }
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

function sectionAnchor(section: string): string {
  return section.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function renderDeepDiveHtml(data: NewsletterData): string {
  const { articles, brand_config } = data;
  const sections = groupBySections(articles);
  const showWim = brand_config.show_why_it_matters;
  const brandName = data.title.split(/\s*[—–-]\s*/)[0] || '';

  // Sidebar quick links
  const sidebarLinks = Array.from(sections.entries())
    .map(([section]) => {
      return `<li><a href="#${sectionAnchor(section)}">${escapeHtml(section)}</a></li>`;
    })
    .join('\n');

  // Also add individual article links
  const articleLinks = articles
    .map((a) => `<li><a href="#article-${a.id}">${escapeHtml(getHeadline(a))}</a></li>`)
    .join('\n');

  const sidebarHtml = `<aside class="sidebar">
  <h4>Sections</h4>
  <ul>${sidebarLinks}</ul>
  <h4 style="margin-top: 20px;">Quick Links</h4>
  <ul>${articleLinks}</ul>
</aside>`;

  // Main content sections
  const sectionsHtml = Array.from(sections.entries())
    .map(([section, sectionArticles]) => {
      const articlesHtml = sectionArticles
        .map((article) => {
          return `<div id="article-${article.id}">${renderHtmlArticleRow(article, brand_config.accent_color, showWim, brandName)}</div>`;
        })
        .join('\n');

      return `<div class="section" id="${sectionAnchor(section)}">
  <h3 class="section-header" style="border-bottom: 2px solid ${brand_config.accent_color};">${escapeHtml(section)}</h3>
  ${articlesHtml}
</div>`;
    })
    .join('\n');

  const bodyHtml = `<div class="container">
${renderHtmlHeader(data)}
<div class="layout">
  ${sidebarHtml}
  <div class="main">
    ${sectionsHtml}
  </div>
</div>
${renderHtmlFooter(brand_config)}
</div>`;

  return htmlPageWrapper(data.title, bodyHtml, STYLES);
}
