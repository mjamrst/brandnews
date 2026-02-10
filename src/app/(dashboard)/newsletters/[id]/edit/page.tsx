"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TopBar } from "@/components/layout/top-bar";
import { BuilderStagingArea } from "@/components/newsletters/builder-staging-area";
import type { StagedArticle } from "@/components/newsletters/builder-staging-area";
import { BuilderPreview } from "@/components/newsletters/builder-preview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Globe, Mail, Send, Save, Search, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getNewsletter, createNewsletter, getNewsletterWithArticles, updateNewsletter } from "@/lib/api/newsletters";
import { replaceNewsletterArticles } from "@/lib/api/newsletter-articles";
import { listArticlesWithTags } from "@/lib/api/articles";
import { listBrandTemplates } from "@/lib/api/brand-templates";
import { applyBrandConfig } from "@/lib/templates/brand";
import type { BrandConfig } from "@/lib/templates/types";
import type { ArticleWithTags, BrandTemplate } from "@/types";
import type { Newsletter } from "@/lib/supabase/database.types";

export default function NewsletterEditPage() {
  const params = useParams();
  const router = useRouter();
  const newsletterId = params.id as string;

  const buildDataConsumed = useRef(false);
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [templateOverride, setTemplateOverride] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Brand state
  const [brandTemplates, setBrandTemplates] = useState<BrandTemplate[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("none");
  const [headerImageOverride, setHeaderImageOverride] = useState("");
  const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);
  const [brandName, setBrandName] = useState("");

  const [stagedArticles, setStagedArticles] = useState<StagedArticle[]>([]);
  const [allArticles, setAllArticles] = useState<ArticleWithTags[]>([]);

  const [previewMode, setPreviewMode] = useState<"web" | "email">("web");
  const [articleSearch, setArticleSearch] = useState("");

  // Load data on mount
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        // Load brand templates and articles in parallel
        const [brands, { articles: fetchedArticles }] = await Promise.all([
          listBrandTemplates(),
          listArticlesWithTags({ limit: 100 }),
        ]);

        if (cancelled) return;

        // Map article_tags to flat tags for component compatibility
        const mappedArticles: ArticleWithTags[] = fetchedArticles.map((a: ArticleWithTags & { article_tags?: { tags: { id: string; name: string; category: string | null } }[] }) => ({
          ...a,
          tags: a.article_tags?.map((at) => at.tags).filter(Boolean) ?? [],
        }));

        setBrandTemplates(brands as unknown as BrandTemplate[]);
        setAllArticles(mappedArticles);

        // Load newsletter if not "new-draft"
        if (newsletterId !== "new-draft") {
          const nlWithArticles = await getNewsletterWithArticles(newsletterId);
          if (cancelled) return;
          setNewsletter(nlWithArticles);

          // Map existing newsletter articles to staged articles
          if (nlWithArticles.newsletter_articles) {
            type NewsletterArticleJoin = {
              article_id: string;
              position: number;
              section: string | null;
              custom_headline: string | null;
              custom_summary: string | null;
              articles: {
                id: string;
                url: string;
                title: string;
                headline: string | null;
                summary: string | null;
                thumbnail_url: string | null;
                source_name: string | null;
                source_favicon: string | null;
                author: string | null;
                published_at: string | null;
              };
            };
            const sorted = [...nlWithArticles.newsletter_articles].sort(
              (a: NewsletterArticleJoin, b: NewsletterArticleJoin) => a.position - b.position
            );
            const staged: StagedArticle[] = sorted.map((na: NewsletterArticleJoin, i: number) => ({
              article: {
                ...na.articles,
                ingested_at: "",
                ingested_by: null,
                raw_content: null,
                status: "active",
                search_vector: null,
                created_at: "",
                updated_at: "",
                tags: [],
              } as ArticleWithTags,
              customHeadline: na.custom_headline || "",
              customSummary: na.custom_summary || "",
              whyItMatters: "",
              position: i,
            }));
            setStagedArticles(staged);
          }
        }
      } catch (err) {
        console.error("Failed to load editor data:", err);
        toast.error("Failed to load editor data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [newsletterId]);

  // Consume sessionStorage build-newsletter data once after data loads
  useEffect(() => {
    if (loading || buildDataConsumed.current || allArticles.length === 0) return;
    buildDataConsumed.current = true;

    try {
      const raw = sessionStorage.getItem("build-newsletter");
      if (!raw) return;
      sessionStorage.removeItem("build-newsletter");

      const { title, templateId, articleIds, brandTemplateId } = JSON.parse(raw) as {
        title: string;
        templateId: string;
        articleIds: string[];
        brandTemplateId?: string;
      };

      if (title) setTitleOverride(title);
      if (templateId) setTemplateOverride(templateId);

      if (brandTemplateId && brandTemplateId !== "none") {
        setSelectedBrandId(brandTemplateId);
        const brand = brandTemplates.find((b) => b.id === brandTemplateId);
        if (brand) {
          setBrandName(brand.name);
          setBrandConfig(applyBrandConfig({
            logo_url: brand.logo_url,
            header_image_url: brand.header_image_url,
            partner_logos: brand.partner_logos,
            primary_color: brand.primary_color,
            secondary_color: brand.secondary_color,
            accent_color: brand.accent_color,
            heading_font: brand.heading_font,
            body_font: brand.body_font,
            subtitle: brand.subtitle,
            footer_text: brand.footer_text || "Powered by The Brief",
            show_why_it_matters: brand.show_why_it_matters,
          }));
          if (templateId === undefined && brand.default_template_id) {
            setTemplateOverride(brand.default_template_id);
          }
        }
      }

      if (articleIds && articleIds.length > 0) {
        const idSet = new Set(articleIds);
        const matched = allArticles.filter((a) => idSet.has(a.id));
        if (matched.length > 0) {
          setStagedArticles(
            matched.map((article, i) => ({
              article,
              customHeadline: "",
              customSummary: "",
              whyItMatters: "",
              position: i,
            }))
          );
        }
      }
    } catch {
      // Ignore malformed sessionStorage data
    }
  }, [loading, allArticles, brandTemplates]);

  // Update brand config when brand selection changes
  const handleBrandChange = useCallback((brandId: string) => {
    setSelectedBrandId(brandId);
    if (brandId === "none") {
      setBrandConfig(null);
      setBrandName("");
      return;
    }
    const brand = brandTemplates.find((b) => b.id === brandId);
    if (!brand) return;
    setBrandName(brand.name);
    setBrandConfig(applyBrandConfig({
      logo_url: brand.logo_url,
      header_image_url: brand.header_image_url,
      partner_logos: brand.partner_logos,
      primary_color: brand.primary_color,
      secondary_color: brand.secondary_color,
      accent_color: brand.accent_color,
      heading_font: brand.heading_font,
      body_font: brand.body_font,
      subtitle: brand.subtitle,
      footer_text: brand.footer_text || "Powered by The Brief",
      show_why_it_matters: brand.show_why_it_matters,
    }));
  }, [brandTemplates]);

  // Merge header image override into brand config
  const effectiveBrandConfig = brandConfig
    ? {
        ...brandConfig,
        header_image_url: headerImageOverride || brandConfig.header_image_url,
      }
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setStagedArticles((items) => {
      const oldIndex = items.findIndex((item) => item.article.id === active.id);
      const newIndex = items.findIndex((item) => item.article.id === over.id);
      return arrayMove(items, oldIndex, newIndex).map((item, i) => ({
        ...item,
        position: i,
      }));
    });
  }, []);

  const addArticle = useCallback((article: ArticleWithTags) => {
    setStagedArticles((prev) => {
      if (prev.some((s) => s.article.id === article.id)) {
        toast.error("Article already added");
        return prev;
      }
      toast.success("Article added");
      return [
        ...prev,
        {
          article,
          customHeadline: "",
          customSummary: "",
          whyItMatters: "",
          position: prev.length,
        },
      ];
    });
  }, []);

  const removeArticle = useCallback((articleId: string) => {
    setStagedArticles((prev) =>
      prev
        .filter((s) => s.article.id !== articleId)
        .map((item, i) => ({ ...item, position: i }))
    );
  }, []);

  const updateArticleOverride = useCallback(
    (articleId: string, field: "customHeadline" | "customSummary" | "whyItMatters", value: string) => {
      setStagedArticles((prev) =>
        prev.map((s) =>
          s.article.id === articleId ? { ...s, [field]: value } : s
        )
      );
    },
    []
  );

  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      let nlId = newsletter?.id;

      if (!nlId || newsletterId === "new-draft") {
        // Create the newsletter in the DB first (new-draft flow)
        const created = await createNewsletter({
          title: titleOverride || "Untitled Newsletter",
          template_id: templateOverride || "the-rundown",
          status: "draft",
        });
        nlId = created.id;
        setNewsletter(created);
      } else {
        // Update existing newsletter metadata
        await updateNewsletter(nlId, {
          title: titleOverride || newsletter!.title,
          template_id: templateOverride || newsletter!.template_id,
          updated_at: new Date().toISOString(),
        });
      }

      // Replace all newsletter articles with current staged set
      await replaceNewsletterArticles(
        nlId,
        stagedArticles.map((s, i) => ({
          article_id: s.article.id,
          position: i,
          custom_headline: s.customHeadline || null,
          custom_summary: s.customSummary || null,
        }))
      );

      toast.success("Newsletter saved");

      // Redirect from new-draft to the real URL so future saves work
      if (newsletterId === "new-draft") {
        router.replace(`/newsletters/${nlId}/edit`);
      }
    } catch (err) {
      console.error("Failed to save newsletter:", err);
      toast.error("Failed to save newsletter");
    } finally {
      setSaving(false);
    }
  }, [newsletter, newsletterId, titleOverride, templateOverride, stagedArticles, router]);

  const handlePublish = () => {
    toast.success("Newsletter published! Shareable link has been generated.");
  };

  // Available articles for adding (not already staged)
  const stagedIds = new Set(stagedArticles.map((s) => s.article.id));
  const availableArticles = allArticles.filter((a) => {
    if (stagedIds.has(a.id)) return false;
    if (!articleSearch) return true;
    const q = articleSearch.toLowerCase();
    return (
      (a.headline || "").toLowerCase().includes(q) ||
      (a.title || "").toLowerCase().includes(q)
    );
  });

  const displayTitle = titleOverride || newsletter?.title || "Newsletter Builder";
  const displayTemplateId = templateOverride || newsletter?.template_id || "the-rundown";
  const selectedBrand = brandTemplates.find((b) => b.id === selectedBrandId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title={displayTitle}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {stagedArticles.length} articles
            </Badge>
            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "web" | "email")}>
              <TabsList className="h-8">
                <TabsTrigger value="web" className="h-6 text-xs">
                  <Globe className="mr-1 h-3 w-3" />
                  Web
                </TabsTrigger>
                <TabsTrigger value="email" className="h-6 text-xs">
                  <Mail className="mr-1 h-3 w-3" />
                  Email
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" onClick={handlePublish}>
              <Send className="mr-1 h-4 w-4" />
              Publish
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Staging area */}
        <div className="flex w-96 flex-col border-r">
          {/* Brand picker */}
          <div className="border-b p-3 space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Brand Template</Label>
              <Select value={selectedBrandId} onValueChange={handleBrandChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="No brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No brand</SelectItem>
                  {brandTemplates.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBrandId !== "none" && (
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  Header Image Override
                </Label>
                <Input
                  value={headerImageOverride}
                  onChange={(e) => setHeaderImageOverride(e.target.value)}
                  placeholder="Leave blank for brand default"
                  className="h-7 text-xs"
                />
              </div>
            )}
          </div>

          <div className="border-b p-3">
            <h2 className="text-sm font-semibold">Articles</h2>
            <p className="text-xs text-muted-foreground">
              Drag to reorder. Click to edit overrides.
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stagedArticles.map((s) => s.article.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <BuilderStagingArea
                    stagedArticles={stagedArticles}
                    onRemove={removeArticle}
                    onUpdateOverride={updateArticleOverride}
                    brandName={brandName}
                    brandDescription={selectedBrand?.brand_description || ""}
                    showWhyItMatters={effectiveBrandConfig?.show_why_it_matters || false}
                  />
                </SortableContext>
              </DndContext>
            </div>

            {/* Add more articles */}
            <div className="border-t p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Add Articles
              </h3>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  placeholder="Search library..."
                  className="h-8 pl-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                {availableArticles.slice(0, 5).map((article) => (
                  <button
                    key={article.id}
                    onClick={() => addArticle(article)}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-left text-xs transition-colors hover:bg-muted"
                  >
                    {article.thumbnail_url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={article.thumbnail_url}
                        alt=""
                        className="h-8 w-12 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium">
                        {article.headline || article.title}
                      </p>
                      <p className="text-muted-foreground">{article.source_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-hidden bg-muted/30">
          <ScrollArea className="h-full">
            <div className="p-6">
              <div className="mx-auto max-w-3xl rounded-lg border bg-background shadow-sm">
                <div className="flex items-center gap-2 border-b px-4 py-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {previewMode === "web" ? "Web Preview" : "Email Preview"}
                  </span>
                </div>
                <BuilderPreview
                  stagedArticles={stagedArticles}
                  templateId={displayTemplateId}
                  previewMode={previewMode}
                  brandConfig={effectiveBrandConfig}
                  brandName={brandName}
                />
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
