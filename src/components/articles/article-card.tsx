"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Plus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArticleWithTags } from "@/types";

interface ArticleCardProps {
  article: ArticleWithTags;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onAddToNewsletter?: (article: ArticleWithTags) => void;
  onTagClick?: (tagId: string) => void;
  onClick?: (article: ArticleWithTags) => void;
}

export function ArticleCard({
  article,
  selected = false,
  onSelect,
  onAddToNewsletter,
  onTagClick,
  onClick,
}: ArticleCardProps) {
  const [expanded, setExpanded] = useState(false);

  const displayDate = article.published_at
    ? format(new Date(article.published_at), "MMM d, yyyy")
    : "Unknown date";

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-shadow hover:shadow-md",
        selected && "ring-2 ring-primary"
      )}
    >
      {/* Thumbnail */}
      {article.thumbnail_url && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.thumbnail_url}
            alt={article.headline || article.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          {onSelect && (
            <div className="absolute left-3 top-3" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelect(article.id, !!checked)}
                className="border-white bg-white/80"
              />
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4" onClick={() => onClick?.(article)}>
        {/* Source + date */}
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{article.source_name}</span>
          <span>·</span>
          <span>{displayDate}</span>
        </div>

        {/* Headline */}
        <h3 className="mb-2 text-sm font-semibold leading-snug">
          {article.headline || article.title}
        </h3>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {article.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="cursor-pointer text-[10px] hover:bg-secondary/80"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag.id);
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Expandable summary */}
        {article.summary && (
          <div>
            <p
              className={cn(
                "text-xs leading-relaxed text-muted-foreground",
                !expanded && "line-clamp-2"
              )}
            >
              {article.summary}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {onAddToNewsletter && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onAddToNewsletter(article);
              }}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add to Newsletter
            </Button>
          )}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
