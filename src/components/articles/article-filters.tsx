"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import type { Tag } from "@/types";
import type { ArticleFilters } from "@/types";

interface ArticleFiltersPanelProps {
  filters: ArticleFilters;
  onFiltersChange: (filters: ArticleFilters) => void;
  tags: Tag[];
  sources: string[];
}

export function ArticleFiltersPanel({
  filters,
  onFiltersChange,
  tags,
  sources,
}: ArticleFiltersPanelProps) {
  const tagsByCategory = tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    const cat = tag.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tag);
    return acc;
  }, {});

  const toggleTag = (tagId: string) => {
    const next = filters.tags.includes(tagId)
      ? filters.tags.filter((id) => id !== tagId)
      : [...filters.tags, tagId];
    onFiltersChange({ ...filters, tags: next });
  };

  const toggleSource = (source: string) => {
    const next = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    onFiltersChange({ ...filters, sources: next });
  };

  const hasActiveFilters =
    filters.tags.length > 0 ||
    filters.sources.length > 0 ||
    filters.status !== "active" ||
    filters.dateFrom ||
    filters.dateTo;

  const clearFilters = () => {
    onFiltersChange({
      search: filters.search,
      tags: [],
      dateFrom: null,
      dateTo: null,
      sources: [],
      status: "active",
      sort: "recent",
    });
  };

  return (
    <div className="w-56 shrink-0 border-r">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold">Filters</span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
      <Separator />

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-4 p-4">
          {/* Status filter */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">Status</Label>
            <div className="mt-2 flex flex-wrap gap-1">
              {["active", "archived"].map((status) => (
                <Badge
                  key={status}
                  variant={filters.status === status ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => onFiltersChange({ ...filters, status })}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags by category */}
          {Object.entries(tagsByCategory)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryTags]) => (
              <div key={category}>
                <Label className="text-xs font-medium uppercase text-muted-foreground">
                  {category}
                </Label>
                <div className="mt-2 space-y-1.5">
                  {categoryTags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.tags.includes(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

          {/* Source filter */}
          {sources.length > 0 && (
            <div>
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Sources
              </Label>
              <div className="mt-2 space-y-1.5">
                {sources.map((source) => (
                  <label
                    key={source}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.sources.includes(source)}
                      onCheckedChange={() => toggleSource(source)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs">{source}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">Sort By</Label>
            <div className="mt-2 flex flex-col gap-1">
              {[
                { value: "recent" as const, label: "Most Recent" },
                { value: "alphabetical" as const, label: "Alphabetical" },
              ].map((option) => (
                <Badge
                  key={option.value}
                  variant={filters.sort === option.value ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => onFiltersChange({ ...filters, sort: option.value })}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
