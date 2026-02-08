"use client";

import { ArticleCard } from "./article-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArticleWithTags } from "@/types";

interface ArticleGridProps {
  articles: ArticleWithTags[];
  loading?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string, selected: boolean) => void;
  onAddToNewsletter?: (article: ArticleWithTags) => void;
  onTagClick?: (tagId: string) => void;
  onArticleClick?: (article: ArticleWithTags) => void;
}

function ArticleCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <Skeleton className="aspect-[16/9] rounded-t-lg" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function ArticleGrid({
  articles,
  loading = false,
  selectedIds = new Set(),
  onSelect,
  onAddToNewsletter,
  onTagClick,
  onArticleClick,
}: ArticleGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">No articles found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          selected={selectedIds.has(article.id)}
          onSelect={onSelect}
          onAddToNewsletter={onAddToNewsletter}
          onTagClick={onTagClick}
          onClick={onArticleClick}
        />
      ))}
    </div>
  );
}
