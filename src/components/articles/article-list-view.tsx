"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import type { ArticleWithTags } from "@/types";

interface ArticleListViewProps {
  articles: ArticleWithTags[];
  loading?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onAddToNewsletter?: (article: ArticleWithTags) => void;
  onTagClick?: (tagId: string) => void;
  onArticleClick?: (article: ArticleWithTags) => void;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-14 shrink-0 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-7 w-7" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function ArticleImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="h-10 w-14 shrink-0 rounded bg-muted flex items-center justify-center text-muted-foreground text-[8px]">
        No img
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      className="h-10 w-14 shrink-0 rounded object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function ArticleListView({
  articles,
  loading = false,
  selectedIds = new Set(),
  onSelect,
  onSelectAll,
  onAddToNewsletter,
  onTagClick,
  onArticleClick,
}: ArticleListViewProps) {
  if (!loading && articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">No articles found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  const allSelected = articles.length > 0 && articles.every((a) => selectedIds.has(a.id));
  const someSelected = articles.some((a) => selectedIds.has(a.id)) && !allSelected;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            {onSelectAll && (
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            )}
          </TableHead>
          <TableHead>Article</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <SkeletonRows />
        ) : (
          articles.map((article) => {
            const isSelected = selectedIds.has(article.id);
            const displayDate = article.published_at
              ? format(new Date(article.published_at), "MMM d, yyyy")
              : null;
            const tags = article.tags || [];

            return (
              <TableRow
                key={article.id}
                data-state={isSelected ? "selected" : undefined}
                className="cursor-pointer"
                onClick={() => onArticleClick?.(article)}
              >
                <TableCell className="align-top pt-4" onClick={(e) => e.stopPropagation()}>
                  {onSelect && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelect(article.id, !!checked)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-3 py-1">
                    <ArticleImage
                      src={article.thumbnail_url}
                      alt={article.headline || article.title}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug line-clamp-2">
                        {article.headline || article.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{article.source_name || "Unknown"}</span>
                        {displayDate && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span>{displayDate}</span>
                          </>
                        )}
                      </div>
                      {tags.length > 0 && (
                        <div
                          className="mt-1.5 flex flex-wrap gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="cursor-pointer text-[10px] px-1.5 py-0 hover:bg-secondary/80"
                              onClick={() => onTagClick?.(tag.id)}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="align-top pt-4" onClick={(e) => e.stopPropagation()}>
                  {onAddToNewsletter && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onAddToNewsletter(article)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
