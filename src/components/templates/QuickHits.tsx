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

function Card({ article, accentColor, showWhyItMatters, brandName }: { article: TemplateArticle; accentColor: string; showWhyItMatters: boolean; brandName: string }) {
  const headline = getHeadline(article);
  const summary = getSummary(article);
  const oneSentence = summary.split(/\.\s/)[0] + (summary.includes('.') ? '.' : '');
  const wimText = getWhyItMatters(article);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      {article.thumbnail_url ? (
        <img src={article.thumbnail_url} alt="" className="w-full h-[140px] object-cover" />
      ) : (
        <div className="w-full h-[140px] bg-gray-200" />
      )}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-[15px] leading-snug font-semibold">
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: accentColor }}>
            {headline}
          </a>
        </h3>
        <p className="mt-1.5 text-[13px] text-gray-600 leading-relaxed flex-1">{oneSentence}</p>
        {article.source_name && (
          <div className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100">{article.source_name}</div>
        )}
        {showWhyItMatters && wimText && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase mb-0.5" style={{ color: accentColor }}>
              Why it matters to {brandName}
            </p>
            <p className="text-[11px] text-gray-600 leading-relaxed">{wimText}</p>
          </div>
        )}
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="mt-2 text-[11px] font-medium italic" style={{ color: accentColor }}>
          Article Link
        </a>
      </div>
    </div>
  );
}

export default function QuickHits({ newsletter }: TemplateProps) {
  const { articles, brand_config } = newsletter;
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

      {/* Card Grid */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <Card key={article.id} article={article} accentColor={brand_config.accent_color} showWhyItMatters={showWim} brandName={brandName} />
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
