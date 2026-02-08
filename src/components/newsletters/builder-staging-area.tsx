"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GripVertical, Pencil, Trash2, Check, X, Sparkles, Loader2 } from "lucide-react";
import type { ArticleWithTags } from "@/types";

export interface StagedArticle {
  article: ArticleWithTags;
  customHeadline: string;
  customSummary: string;
  whyItMatters: string;
  position: number;
}

interface BuilderStagingAreaProps {
  stagedArticles: StagedArticle[];
  onRemove: (articleId: string) => void;
  onUpdateOverride: (
    articleId: string,
    field: "customHeadline" | "customSummary" | "whyItMatters",
    value: string
  ) => void;
  brandName?: string;
  brandDescription?: string;
  showWhyItMatters?: boolean;
}

export function BuilderStagingArea({
  stagedArticles,
  onRemove,
  onUpdateOverride,
  brandName,
  brandDescription,
  showWhyItMatters = false,
}: BuilderStagingAreaProps) {
  if (stagedArticles.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No articles added yet. Search the library below to add articles.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {stagedArticles.map((staged) => (
        <SortableArticleItem
          key={staged.article.id}
          staged={staged}
          onRemove={onRemove}
          onUpdateOverride={onUpdateOverride}
          brandName={brandName}
          brandDescription={brandDescription}
          showWhyItMatters={showWhyItMatters}
        />
      ))}
    </div>
  );
}

function SortableArticleItem({
  staged,
  onRemove,
  onUpdateOverride,
  brandName,
  brandDescription,
  showWhyItMatters,
}: {
  staged: StagedArticle;
  onRemove: (id: string) => void;
  onUpdateOverride: (
    articleId: string,
    field: "customHeadline" | "customSummary" | "whyItMatters",
    value: string
  ) => void;
  brandName?: string;
  brandDescription?: string;
  showWhyItMatters?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [headline, setHeadline] = useState(
    staged.customHeadline || staged.article.headline || staged.article.title
  );
  const [summary, setSummary] = useState(
    staged.customSummary || staged.article.summary || ""
  );
  const [whyItMatters, setWhyItMatters] = useState(staged.whyItMatters || "");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: staged.article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdateOverride(staged.article.id, "customHeadline", headline);
    onUpdateOverride(staged.article.id, "customSummary", summary);
    onUpdateOverride(staged.article.id, "whyItMatters", whyItMatters);
    setEditing(false);
  };

  const handleGenerate = async () => {
    if (!brandName) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/why-it-matters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: staged.article.headline || staged.article.title,
          summary: staged.article.summary || "",
          brandName,
          brandDescription: brandDescription || "",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWhyItMatters(data.text);
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-md border bg-card p-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="h-7 text-xs"
              placeholder="Custom headline..."
            />
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="text-xs min-h-[60px]"
              placeholder="Custom summary..."
            />
            {showWhyItMatters && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase text-muted-foreground">
                    Why it matters{brandName ? ` to ${brandName}` : ""}
                  </Label>
                  {brandName && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-1.5"
                      onClick={handleGenerate}
                      disabled={generating}
                    >
                      {generating ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1 h-3 w-3" />
                      )}
                      {generating ? "Generating..." : "Generate"}
                    </Button>
                  )}
                </div>
                <Textarea
                  value={whyItMatters}
                  onChange={(e) => setWhyItMatters(e.target.value)}
                  className="text-xs min-h-[60px]"
                  placeholder="Why this article matters to the brand..."
                />
              </div>
            )}
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={handleSave}>
                <Check className="mr-1 h-3 w-3" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => setEditing(false)}
              >
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            {staged.article.thumbnail_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={staged.article.thumbnail_url}
                alt=""
                className="h-10 w-14 rounded object-cover shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium leading-snug truncate">
                {staged.customHeadline || staged.article.headline || staged.article.title}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {staged.article.source_name}
              </p>
              {staged.whyItMatters && showWhyItMatters && (
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic">
                  WIM: {staged.whyItMatters}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {!editing && (
        <div className="flex shrink-0 gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => onRemove(staged.article.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
