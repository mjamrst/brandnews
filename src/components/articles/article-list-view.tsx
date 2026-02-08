"use client";

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
          <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="hidden md:table-cell">
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-7 w-7" /></TableCell>
        </TableRow>
      ))}
    </>
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
          <TableHead className="w-14" />
          <TableHead>Headline</TableHead>
          <TableHead className="w-32">Source</TableHead>
          <TableHead className="hidden w-28 md:table-cell">Date</TableHead>
          <TableHead className="hidden w-48 md:table-cell">Tags</TableHead>
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
              : "—";
            const tags = article.tags || [];
            const visibleTags = tags.slice(0, 3);
            const overflowCount = tags.length - 3;

            return (
              <TableRow
                key={article.id}
                data-state={isSelected ? "selected" : undefined}
                className="cursor-pointer"
                onClick={() => onArticleClick?.(article)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {onSelect && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelect(article.id, !!checked)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {article.thumbnail_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={article.thumbnail_url}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted" />
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium line-clamp-1">
                    {article.headline || article.title}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {article.source_name || "—"}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {displayDate}
                </TableCell>
                <TableCell className="hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-wrap gap-1">
                    {visibleTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="cursor-pointer text-[10px] hover:bg-secondary/80"
                        onClick={() => onTagClick?.(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {overflowCount > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{overflowCount}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
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
