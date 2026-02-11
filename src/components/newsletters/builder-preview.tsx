"use client";

import { useState, useRef, useEffect, type CSSProperties, type ReactNode } from "react";
import { format } from "date-fns";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ArticleWithTags } from "@/types";
import type { BrandConfig } from "@/lib/templates/types";

export interface StagedArticle {
  article: ArticleWithTags;
  customHeadline: string;
  customSummary: string;
  whyItMatters: string;
  customImageUrl?: string;
  position: number;
}

interface BuilderPreviewProps {
  stagedArticles: StagedArticle[];
  templateId: string;
  previewMode: "web" | "email";
  brandConfig?: BrandConfig | null;
  brandName?: string;
  onUpdateOverride?: (articleId: string, field: "customHeadline" | "customSummary" | "whyItMatters" | "customImageUrl", value: string) => void;
}

function getHeadline(staged: StagedArticle): string {
  return staged.customHeadline || staged.article.headline || staged.article.title;
}

function getSummary(staged: StagedArticle): string {
  return staged.customSummary || staged.article.summary || "";
}

function getImageUrl(staged: StagedArticle): string | null {
  return staged.customImageUrl || staged.article.thumbnail_url || null;
}

// ─── Inline Editable Components ──────────────────────────────────────

interface EditableTextProps {
  value: string;
  onUpdate: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  as?: "h2" | "h3" | "p" | "span";
  multiline?: boolean;
  children?: ReactNode;
}

function EditableText({ value, onUpdate, className = "", style, as: Tag = "p", multiline }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Sync draft when value changes externally
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onUpdate(trimmed);
    } else {
      setDraft(value);
    }
  };

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
          if (e.key === "Enter" && !multiline) {
            e.preventDefault();
            commit();
          }
        }}
        className={`${className} w-full resize-none rounded border border-primary/40 bg-primary/5 px-1 py-0.5 outline-none ring-1 ring-primary/20`}
        style={style}
        rows={multiline ? 4 : 2}
      />
    );
  }

  return (
    <Tag
      onClick={() => setEditing(true)}
      className={`${className} cursor-text rounded px-0.5 transition-colors hover:bg-primary/5 hover:outline hover:outline-1 hover:outline-primary/20`}
      style={style}
      title="Click to edit"
    >
      {value}
    </Tag>
  );
}

interface EditableImageProps {
  src: string | null;
  onUpdate: (url: string) => void;
  className?: string;
  style?: CSSProperties;
}

function EditableImage({ src, onUpdate, className = "", style }: EditableImageProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", "article-images");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Upload failed");
      }
      const { url } = await res.json();
      onUpdate(url);
      toast.success("Image replaced");
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="group relative">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className={className} style={style} />
          <div
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
          >
            {uploading ? (
              <div className="flex items-center gap-2 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium">
                <Camera className="h-3.5 w-3.5" />
                Replace Image
              </div>
            )}
          </div>
        </>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className={`flex cursor-pointer items-center justify-center gap-1.5 border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-xs text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/50 ${className}`}
          style={{ ...style, minHeight: 80 }}
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="h-3.5 w-3.5" />
              Add Image
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── BuilderPreview ──────────────────────────────────────────────────

export function BuilderPreview({
  stagedArticles,
  templateId,
  previewMode,
  brandConfig,
  brandName,
  onUpdateOverride,
}: BuilderPreviewProps) {
  if (stagedArticles.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          Add articles to see a live preview
        </p>
      </div>
    );
  }

  const props = {
    articles: stagedArticles,
    isEmail: previewMode === "email",
    brandConfig: brandConfig || null,
    brandName: brandName || "",
    onUpdateOverride,
  };

  switch (templateId) {
    case "the-rundown":
      return <RundownPreview {...props} />;
    case "quick-hits":
      return <QuickHitsPreview {...props} />;
    case "deep-dive":
      return <DeepDivePreview {...props} />;
    default:
      return <RundownPreview {...props} />;
  }
}

// ─── Shared Sub-Components ───────────────────────────────────────────

interface TemplatePreviewProps {
  articles: StagedArticle[];
  isEmail: boolean;
  brandConfig: BrandConfig | null;
  brandName: string;
  onUpdateOverride?: (articleId: string, field: "customHeadline" | "customSummary" | "whyItMatters" | "customImageUrl", value: string) => void;
}

function PartnerLogosBar({ brandConfig }: { brandConfig: BrandConfig | null }) {
  if (!brandConfig?.partner_logos?.length) return null;
  return (
    <div className="flex items-center justify-between px-6 py-2 border-b">
      <span className="text-xs text-muted-foreground">{format(new Date(), "MMMM d / yyyy").toUpperCase()}</span>
      <div className="flex items-center gap-3">
        {brandConfig.partner_logos.map((logo, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={i} src={logo.url} alt={logo.alt} className="h-6 max-w-[80px] object-contain" />
        ))}
      </div>
    </div>
  );
}

function BrandedHeader({ brandConfig, brandName }: { brandConfig: BrandConfig | null; brandName: string }) {
  const bg = brandConfig?.primary_color || "#1a1a2e";
  const headingFont = brandConfig?.heading_font || "Inter";

  return (
    <>
      {brandConfig?.header_image_url ? (
        <div style={{ backgroundColor: bg }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandConfig.header_image_url} alt="" className="w-full object-cover" style={{ maxHeight: 200 }} />
        </div>
      ) : (
        <div className="px-8 py-8 text-center text-white" style={{ backgroundColor: bg, fontFamily: headingFont }}>
          {brandConfig?.logo_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={brandConfig.logo_url} alt="Logo" className="max-h-10 mx-auto mb-2" />
          )}
          <h1 className="text-2xl font-bold">{brandName || "Newsletter"}</h1>
          <p className="text-sm opacity-80 mt-2">{format(new Date(), "MMMM d, yyyy")}</p>
        </div>
      )}
      {brandConfig?.subtitle && (
        <div className="px-6 py-3 text-center text-sm italic text-muted-foreground" style={{ backgroundColor: bg, color: "rgba(255,255,255,0.9)" }}>
          {brandConfig.subtitle}
        </div>
      )}
    </>
  );
}

function WhyItMattersBlock({ staged, brandConfig, brandName }: { staged: StagedArticle; brandConfig: BrandConfig | null; brandName: string }) {
  if (!brandConfig?.show_why_it_matters || !staged.whyItMatters) return null;
  const accentColor = brandConfig?.accent_color || "#0f3460";
  return (
    <div className="mt-3">
      <p className="text-xs font-bold uppercase mb-1" style={{ color: accentColor }}>
        Why it matters to {brandName}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">{staged.whyItMatters}</p>
    </div>
  );
}

function ArticleLinkBlock({ url, brandConfig }: { url: string; brandConfig: BrandConfig | null }) {
  const accentColor = brandConfig?.accent_color || "#0f3460";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 text-xs font-medium italic inline-block"
      style={{ color: accentColor }}
    >
      Article Link
    </a>
  );
}

// ─── Template Previews ───────────────────────────────────────────────

function RundownPreview({ articles, isEmail, brandConfig, brandName, onUpdateOverride }: TemplatePreviewProps) {
  const [hero, ...rest] = articles;
  const bodyFont = brandConfig?.body_font || "Inter";
  const headingFont = brandConfig?.heading_font || "Inter";
  const accentColor = brandConfig?.accent_color || "#0f3460";
  const footerBg = brandConfig?.secondary_color || "#16213e";
  const footerText = brandConfig?.footer_text || "Powered by The Brief";

  return (
    <div style={{ fontFamily: bodyFont }}>
      <PartnerLogosBar brandConfig={brandConfig} />
      <BrandedHeader brandConfig={brandConfig} brandName={brandName} />

      {/* Hero article */}
      {hero && (
        <div className="p-6 border-b">
          <EditableImage
            src={getImageUrl(hero)}
            onUpdate={(url) => onUpdateOverride?.(hero.article.id, "customImageUrl", url)}
            className="mb-4 w-full rounded-lg object-cover"
            style={{ maxHeight: 300 }}
          />
          <EditableText
            value={getHeadline(hero)}
            onUpdate={(v) => onUpdateOverride?.(hero.article.id, "customHeadline", v)}
            className="text-xl font-bold"
            style={{ fontFamily: headingFont }}
            as="h2"
          />
          <p className="mt-1 text-xs text-muted-foreground">{hero.article.source_name}</p>
          <EditableText
            value={getSummary(hero)}
            onUpdate={(v) => onUpdateOverride?.(hero.article.id, "customSummary", v)}
            className="mt-2 text-sm leading-relaxed"
            multiline
          />
          <WhyItMattersBlock staged={hero} brandConfig={brandConfig} brandName={brandName} />
          <ArticleLinkBlock url={hero.article.url} brandConfig={brandConfig} />
        </div>
      )}

      {/* Grid articles */}
      <div className={`px-6 py-4 grid gap-4 ${isEmail ? "grid-cols-1" : "grid-cols-1"}`}>
        {rest.map((staged) => (
          <div key={staged.article.id} className="flex gap-3 py-3 border-b last:border-b-0">
            <EditableImage
              src={getImageUrl(staged)}
              onUpdate={(url) => onUpdateOverride?.(staged.article.id, "customImageUrl", url)}
              className="h-20 w-28 rounded object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <EditableText
                value={getHeadline(staged)}
                onUpdate={(v) => onUpdateOverride?.(staged.article.id, "customHeadline", v)}
                className="text-sm font-semibold leading-snug"
                style={{ fontFamily: headingFont, color: accentColor }}
                as="h3"
              />
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {staged.article.source_name}
              </p>
              <EditableText
                value={getSummary(staged)}
                onUpdate={(v) => onUpdateOverride?.(staged.article.id, "customSummary", v)}
                className="mt-1 text-xs text-muted-foreground"
                multiline
              />
              <WhyItMattersBlock staged={staged} brandConfig={brandConfig} brandName={brandName} />
              <ArticleLinkBlock url={staged.article.url} brandConfig={brandConfig} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center text-xs text-white opacity-90" style={{ backgroundColor: footerBg }}>
        {footerText}
      </div>
    </div>
  );
}

function QuickHitsPreview({ articles, isEmail, brandConfig, brandName, onUpdateOverride }: TemplatePreviewProps) {
  const bodyFont = brandConfig?.body_font || "Inter";
  const headingFont = brandConfig?.heading_font || "Inter";
  const footerBg = brandConfig?.secondary_color || "#16213e";
  const footerText = brandConfig?.footer_text || "Powered by The Brief";

  return (
    <div style={{ fontFamily: bodyFont }}>
      <PartnerLogosBar brandConfig={brandConfig} />
      <BrandedHeader brandConfig={brandConfig} brandName={brandName} />

      <div className={`p-6 grid gap-4 ${isEmail ? "grid-cols-1" : "grid-cols-3"}`}>
        {articles.map((staged) => (
          <div key={staged.article.id} className="rounded-lg border p-3">
            <EditableImage
              src={getImageUrl(staged)}
              onUpdate={(url) => onUpdateOverride?.(staged.article.id, "customImageUrl", url)}
              className="mb-2 w-full rounded object-cover"
              style={{ maxHeight: 120 }}
            />
            <EditableText
              value={getHeadline(staged)}
              onUpdate={(v) => onUpdateOverride?.(staged.article.id, "customHeadline", v)}
              className="text-xs font-semibold leading-snug"
              style={{ fontFamily: headingFont }}
              as="h3"
            />
            <EditableText
              value={getSummary(staged)}
              onUpdate={(v) => onUpdateOverride?.(staged.article.id, "customSummary", v)}
              className="mt-1 text-[10px] text-muted-foreground"
              multiline
            />
            <p className="mt-1 text-[10px] font-medium text-muted-foreground">
              {staged.article.source_name}
            </p>
            <WhyItMattersBlock staged={staged} brandConfig={brandConfig} brandName={brandName} />
            <ArticleLinkBlock url={staged.article.url} brandConfig={brandConfig} />
          </div>
        ))}
      </div>

      <div className="px-6 py-4 text-center text-xs text-white opacity-90" style={{ backgroundColor: footerBg }}>
        {footerText}
      </div>
    </div>
  );
}

function DeepDivePreview({ articles, isEmail, brandConfig, brandName, onUpdateOverride }: TemplatePreviewProps) {
  const bodyFont = brandConfig?.body_font || "Inter";
  const headingFont = brandConfig?.heading_font || "Inter";
  const accentColor = brandConfig?.accent_color || "#0f3460";
  const footerBg = brandConfig?.secondary_color || "#16213e";
  const footerText = brandConfig?.footer_text || "Powered by The Brief";

  // Group by first tag category for sectioning
  const sections: Record<string, StagedArticle[]> = {};
  for (const staged of articles) {
    const firstTag = staged.article.tags?.[0];
    const section = firstTag?.category || "General";
    if (!sections[section]) sections[section] = [];
    sections[section].push(staged);
  }

  return (
    <div style={{ fontFamily: bodyFont }}>
      <PartnerLogosBar brandConfig={brandConfig} />
      <BrandedHeader brandConfig={brandConfig} brandName={brandName} />

      <div className="p-6">
        {/* Quick links */}
        {!isEmail && (
          <div className="mb-6 rounded-lg bg-muted/50 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Quick Links
            </h4>
            <ul className="space-y-1">
              {articles.map((staged) => (
                <li key={staged.article.id} className="text-xs cursor-pointer hover:underline" style={{ color: accentColor }}>
                  {getHeadline(staged)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sections */}
        {Object.entries(sections).map(([sectionName, sectionArticles]) => (
          <div key={sectionName} className="mb-6">
            <h2 className="mb-3 text-lg font-bold capitalize border-b pb-2" style={{ fontFamily: headingFont }}>{sectionName}</h2>
            <div className="space-y-4">
              {sectionArticles.map((staged) => (
                <div key={staged.article.id} className="flex gap-3">
                  <EditableImage
                    src={getImageUrl(staged)}
                    onUpdate={(url) => onUpdateOverride?.(staged.article.id, "customImageUrl", url)}
                    className="h-20 w-28 rounded object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <EditableText
                      value={getHeadline(staged)}
                      onUpdate={(v) => onUpdateOverride?.(staged.article.id, "customHeadline", v)}
                      className="text-sm font-semibold leading-snug"
                      style={{ fontFamily: headingFont }}
                      as="h3"
                    />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {staged.article.source_name}
                    </p>
                    <EditableText
                      value={getSummary(staged)}
                      onUpdate={(v) => onUpdateOverride?.(staged.article.id, "customSummary", v)}
                      className="mt-1 text-xs leading-relaxed"
                      multiline
                    />
                    <WhyItMattersBlock staged={staged} brandConfig={brandConfig} brandName={brandName} />
                    <ArticleLinkBlock url={staged.article.url} brandConfig={brandConfig} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 text-center text-xs text-white opacity-90" style={{ backgroundColor: footerBg }}>
        {footerText}
      </div>
    </div>
  );
}
