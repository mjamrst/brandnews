'use client';

import type { TemplateProps, TemplateArticle } from '@/lib/templates/types';
import { getHeadline, getSummary, getWhyItMatters } from '@/lib/templates/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function sectionAnchor(section: string): string {
  return section.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function groupBySections(articles: TemplateArticle[]): Map<string, TemplateArticle[]> {
  const groups = new Map<string, TemplateArticle[]>();
  for (const article of articles) {
    const section = article.section || 'General';
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section)!.push(article);
  }
  return groups;
}

function ArticleRow({ article, accentColor, showWhyItMatters, brandName, headingFont }: { article: TemplateArticle; accentColor: string; showWhyItMatters: boolean; brandName: string; headingFont: string }) {
  const headline = getHeadline(article);
  const summary = getSummary(article);
  const wimText = getWhyItMatters(article);

  return (
    <div id={`article-${article.id}`} className="flex gap-4 py-4 border-b border-gray-200 last:border-b-0">
      {article.thumbnail_url ? (
        <img src={article.thumbnail_url} alt="" className="w-[120px] h-[80px] object-cover rounded-md flex-shrink-0" />
      ) : (
        <div className="w-[120px] h-[80px] bg-gray-200 rounded-md flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-base leading-snug block hover:underline" style={{ color: accentColor, fontFamily: headingFont + ', sans-serif' }}>
          {headline}
        </a>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">{summary}</p>
        {article.source_name && (
          <span className="text-xs text-gray-500 mt-1 inline-block">{article.source_name}</span>
        )}
        {showWhyItMatters && wimText && (
          <div className="mt-2">
            <p className="text-xs font-bold uppercase mb-0.5" style={{ color: accentColor }}>
              Why it matters to {brandName}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">{wimText}</p>
          </div>
        )}
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs font-medium italic inline-block" style={{ color: accentColor }}>
          Article Link
        </a>
      </div>
    </div>
  );
}

export default function DeepDive({ newsletter }: TemplateProps) {
  const { articles, brand_config } = newsletter;
  const sections = groupBySections(articles);
  const showWim = brand_config.show_why_it_matters;
  const brandName = newsletter.title.split(/\s*[—–-]\s*/)[0] || 'this brand';

  return (
    <div className="max-w-[720px] mx-auto bg-white shadow-sm" style={{ fontFamily: brand_config.body_font + ', sans-serif' }}>
      {/* Partner logos bar */}
      {brand_config.partner_logos.length > 0 && (
        <div className="flex items-center justify-between px-6 py-2 border-b">
          <span className="text-xs text-gray-500">{formatDate(newsletter.created_at).toUpperCase()}</span>
          <div className="flex items-center gap-3">
            {brand_config.partner_logos.map((logo, i) => (
              <img key={i} src={logo.url} alt={logo.alt} className="h-6 max-w-[80px] object-contain" />
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      {brand_config.header_image_url ? (
        <div style={{ backgroundColor: brand_config.primary_color }}>
          <img src={brand_config.header_image_url} alt="" className="w-full object-cover" style={{ maxHeight: 200 }} />
        </div>
      ) : (
        <header
          className="text-white px-8 py-8 text-center"
          style={{ backgroundColor: brand_config.primary_color, fontFamily: brand_config.heading_font + ', sans-serif' }}
        >
          {brand_config.logo_url && (
            <img src={brand_config.logo_url} alt="Logo" className="max-h-10 mx-auto mb-2" />
          )}
          <h1 className="text-2xl font-bold leading-tight">{newsletter.title}</h1>
          {brand_config.partner_logos.length === 0 && (
            <p className="text-sm opacity-80 mt-2">{formatDate(newsletter.created_at)}</p>
          )}
        </header>
      )}

      {/* Subtitle */}
      {brand_config.subtitle && (
        <div className="px-6 py-3 text-center text-sm italic" style={{ backgroundColor: brand_config.primary_color, color: 'rgba(255,255,255,0.9)' }}>
          {brand_config.subtitle}
        </div>
      )}

      {/* Layout: Sidebar + Main */}
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-[200px] flex-shrink-0 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-200 md:sticky md:top-0 md:self-start">
          <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-bold">Sections</h4>
          <ul className="space-y-2">
            {Array.from(sections.keys()).map((section) => (
              <li key={section}>
                <a href={`#${sectionAnchor(section)}`} className="text-sm text-gray-600 hover:text-gray-900">
                  {section}
                </a>
              </li>
            ))}
          </ul>

          <h4 className="text-xs uppercase tracking-wide text-gray-500 mt-5 mb-3 font-bold">Quick Links</h4>
          <ul className="space-y-2">
            {articles.map((article) => (
              <li key={article.id}>
                <a href={`#article-${article.id}`} className="text-[13px] text-gray-600 hover:text-gray-900 leading-snug block">
                  {getHeadline(article)}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {Array.from(sections.entries()).map(([section, sectionArticles]) => (
            <div key={section} id={sectionAnchor(section)} className="p-6 border-b border-gray-200 last:border-b-0">
              <h3
                className="text-lg font-bold mb-4 pb-2"
                style={{ borderBottom: `2px solid ${brand_config.accent_color}`, fontFamily: brand_config.heading_font + ', sans-serif' }}
              >
                {section}
              </h3>
              {sectionArticles.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  accentColor={brand_config.accent_color}
                  showWhyItMatters={showWim}
                  brandName={brandName}
                  headingFont={brand_config.heading_font}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer
        className="text-white px-6 py-6 text-center text-sm opacity-90"
        style={{ backgroundColor: brand_config.secondary_color }}
      >
        <p>{brand_config.footer_text}</p>
      </footer>
    </div>
  );
}
