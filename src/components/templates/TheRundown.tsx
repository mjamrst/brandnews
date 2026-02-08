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

function WhyItMattersSection({ article, brandName, accentColor }: { article: TemplateArticle; brandName: string; accentColor: string }) {
  const text = getWhyItMatters(article);
  if (!text) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-bold uppercase mb-1" style={{ color: accentColor }}>
        Why it matters to {brandName}
      </p>
      <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}

function ArticleRow({ article, accentColor, showWhyItMatters, brandName }: { article: TemplateArticle; accentColor: string; showWhyItMatters: boolean; brandName: string }) {
  const headline = getHeadline(article);
  const summary = getSummary(article);

  return (
    <div className="flex gap-4 py-4 border-b border-gray-200 last:border-b-0">
      {article.thumbnail_url ? (
        <img
          src={article.thumbnail_url}
          alt=""
          className="w-[120px] h-[80px] object-cover rounded-md flex-shrink-0"
        />
      ) : (
        <div className="w-[120px] h-[80px] bg-gray-200 rounded-md flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-base leading-snug block hover:underline"
          style={{ color: accentColor }}
        >
          {headline}
        </a>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">{summary}</p>
        {article.source_name && (
          <span className="text-xs text-gray-500 mt-1 inline-block">{article.source_name}</span>
        )}
        {showWhyItMatters && (
          <WhyItMattersSection article={article} brandName={brandName} accentColor={accentColor} />
        )}
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs font-medium italic inline-block" style={{ color: accentColor }}>
          Article Link
        </a>
      </div>
    </div>
  );
}

export default function TheRundown({ newsletter }: TemplateProps) {
  const { articles, brand_config } = newsletter;
  const [hero, ...rest] = articles;
  const showWim = brand_config.show_why_it_matters;
  // Extract brand name from title (first word or "this brand")
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

      {/* Hero Article */}
      {hero && (
        <div className="p-6 border-b-2 border-gray-200">
          {hero.thumbnail_url ? (
            <img src={hero.thumbnail_url} alt="" className="w-full max-h-[360px] object-cover rounded-lg" />
          ) : (
            <div className="w-full h-60 bg-gray-200 rounded-lg" />
          )}
          <h2 className="mt-4 text-xl font-bold leading-snug" style={{ fontFamily: brand_config.heading_font + ', sans-serif' }}>
            <a href={hero.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-gray-900">
              {getHeadline(hero)}
            </a>
          </h2>
          <p className="mt-2 text-[15px] text-gray-600 leading-relaxed">{getSummary(hero)}</p>
          {hero.source_name && (
            <span className="text-xs text-gray-500 mt-2 inline-block">{hero.source_name}</span>
          )}
          {showWim && (
            <WhyItMattersSection article={hero} brandName={brandName} accentColor={brand_config.accent_color} />
          )}
          <a href={hero.url} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs font-medium italic block" style={{ color: brand_config.accent_color }}>
            Article Link
          </a>
        </div>
      )}

      {/* Article Grid */}
      <div className="px-6 py-2 pb-6">
        {rest.map((article) => (
          <ArticleRow
            key={article.id}
            article={article}
            accentColor={brand_config.accent_color}
            showWhyItMatters={showWim}
            brandName={brandName}
          />
        ))}
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
