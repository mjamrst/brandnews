"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { ArticleGrid } from "@/components/articles/article-grid";
import { ArticleListView } from "@/components/articles/article-list-view";
import { ArticleFiltersPanel } from "@/components/articles/article-filters";
import { ArticleDetail } from "@/components/articles/article-detail";
import { BuildNewsletterDialog } from "@/components/articles/build-newsletter-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Archive, List, LayoutGrid, Newspaper, Tags, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listArticlesWithTags } from "@/lib/api/articles";
import { listTags } from "@/lib/api/tags";
import { bulkArchiveArticles } from "@/lib/api/articles";
import type { ArticleWithTags, ArticleFilters } from "@/types";
import type { Tag } from "@/lib/supabase/database.types";

const defaultFilters: ArticleFilters = {
  search: "",
  tags: [],
  dateFrom: null,
  dateTo: null,
  sources: [],
  status: "active",
  sort: "recent",
};

export default function LibraryPage() {
  const [filters, setFilters] = useState<ArticleFilters>(defaultFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailArticle, setDetailArticle] = useState<ArticleWithTags | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [buildDialogOpen, setBuildDialogOpen] = useState(false);

  // Live data state
  const [articles, setArticles] = useState<ArticleWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch tags once on mount
  useEffect(() => {
    listTags().then(setTags).catch((err) => {
      console.error("Failed to load tags:", err);
      toast.error("Failed to load tags");
    });
  }, []);

  // Fetch articles when filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listArticlesWithTags({
      query: filters.search || undefined,
      status: filters.status,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      limit: 100,
    })
      .then(({ articles: fetched, count }) => {
        if (cancelled) return;
        // Map article_tags to flat tags array for component compatibility
        const mapped: ArticleWithTags[] = fetched.map((a) => ({
          ...a,
          tags: a.article_tags?.map((at: { tags: { id: string; name: string; category: string | null } }) => at.tags).filter(Boolean) ?? [],
        }));
        setArticles(mapped);
        setTotalCount(count);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load articles:", err);
        toast.error("Failed to load articles");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [filters.search, filters.status, filters.dateFrom, filters.dateTo]);

  // Derive available sources from fetched articles
  const availableSources = useMemo(() => {
    const sources = new Set(articles.map((a) => a.source_name).filter(Boolean));
    return Array.from(sources).sort() as string[];
  }, [articles]);

  // Client-side filter/sort for tag and source filters (already fetched)
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Tags (client-side since we already have them)
    if (filters.tags.length > 0) {
      result = result.filter((a) =>
        a.tags?.some((t) => filters.tags.includes(t.id))
      );
    }

    // Sources
    if (filters.sources.length > 0) {
      result = result.filter((a) => filters.sources.includes(a.source_name || ""));
    }

    // Sort
    switch (filters.sort) {
      case "recent":
        result.sort(
          (a, b) =>
            new Date(b.published_at || 0).getTime() -
            new Date(a.published_at || 0).getTime()
        );
        break;
      case "alphabetical":
        result.sort((a, b) =>
          (a.headline || a.title).localeCompare(b.headline || b.title)
        );
        break;
    }

    return result;
  }, [articles, filters.tags, filters.sources, filters.sort]);

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(filteredArticles.map((a) => a.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [filteredArticles]
  );

  const handleAddToNewsletter = useCallback((article: ArticleWithTags) => {
    toast.success(`"${article.headline || article.title}" added to newsletter staging`);
  }, []);

  const handleTagClick = useCallback(
    (tagId: string) => {
      setFilters((prev) => ({
        ...prev,
        tags: prev.tags.includes(tagId) ? prev.tags : [...prev.tags, tagId],
      }));
    },
    []
  );

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds);
    try {
      await bulkArchiveArticles(ids);
      setArticles((prev) => prev.filter((a) => !selectedIds.has(a.id)));
      toast.success(`${ids.length} article(s) archived`);
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to archive:", err);
      toast.error("Failed to archive articles");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title="Article Library"
        searchValue={filters.search}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
        searchPlaceholder="Search articles..."
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 border-b bg-muted/50 px-6 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button
            size="sm"
            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setBuildDialogOpen(true)}
          >
            <Newspaper className="mr-1 h-3 w-3" />
            Build Newsletter
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleBulkArchive}>
            <Archive className="mr-1 h-3 w-3" />
            Archive
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Tags className="mr-1 h-3 w-3" />
            Re-tag
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Filter sidebar */}
        <ArticleFiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          tags={tags}
          sources={availableSources}
        />

        {/* Article list / grid */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading articles...</span>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""}
                  {totalCount > filteredArticles.length && ` (of ${totalCount} total)`}
                </div>
                {viewMode === "list" ? (
                  <ArticleListView
                    articles={filteredArticles}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onSelectAll={handleSelectAll}
                    onAddToNewsletter={handleAddToNewsletter}
                    onTagClick={handleTagClick}
                    onArticleClick={setDetailArticle}
                  />
                ) : (
                  <ArticleGrid
                    articles={filteredArticles}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onAddToNewsletter={handleAddToNewsletter}
                    onTagClick={handleTagClick}
                    onArticleClick={setDetailArticle}
                  />
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Article detail sheet */}
      <ArticleDetail
        article={detailArticle}
        open={!!detailArticle}
        onClose={() => setDetailArticle(null)}
        onSave={(id, updates) => {
          toast.success("Article updated");
          setDetailArticle(null);
        }}
      />

      {/* Build newsletter dialog */}
      <BuildNewsletterDialog
        open={buildDialogOpen}
        onOpenChange={setBuildDialogOpen}
        articleIds={Array.from(selectedIds)}
      />
    </div>
  );
}
