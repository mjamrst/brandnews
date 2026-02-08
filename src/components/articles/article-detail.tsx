"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Save, X } from "lucide-react";
import type { ArticleWithTags } from "@/types";

interface ArticleDetailProps {
  article: ArticleWithTags | null;
  open: boolean;
  onClose: () => void;
  onSave?: (id: string, updates: { headline: string; summary: string }) => void;
}

export function ArticleDetail({ article, open, onClose, onSave }: ArticleDetailProps) {
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");

  const startEditing = () => {
    if (!article) return;
    setHeadline(article.headline || article.title);
    setSummary(article.summary || "");
    setEditing(true);
  };

  const handleSave = () => {
    if (!article || !onSave) return;
    onSave(article.id, { headline, summary });
    setEditing(false);
  };

  if (!article) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Article Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Thumbnail */}
          {article.thumbnail_url && (
            <div className="overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.thumbnail_url}
                alt={article.headline || article.title}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Source info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{article.source_name}</span>
            <span>·</span>
            <span>
              {article.published_at
                ? format(new Date(article.published_at), "MMM d, yyyy")
                : "Unknown date"}
            </span>
            {article.author && (
              <>
                <span>·</span>
                <span>{article.author}</span>
              </>
            )}
          </div>

          {/* Headline */}
          {editing ? (
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
            </div>
          ) : (
            <h2 className="text-xl font-semibold leading-tight">
              {article.headline || article.title}
            </h2>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          {/* Summary */}
          {editing ? (
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={6}
              />
            </div>
          ) : (
            <div>
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                AI Summary
              </Label>
              <p className="mt-2 text-sm leading-relaxed">{article.summary}</p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave}>
                  <Save className="mr-1 h-3.5 w-3.5" />
                  Save Changes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={startEditing}>
                Edit
              </Button>
            )}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto"
            >
              <Button variant="ghost" size="sm">
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                View Original
              </Button>
            </a>
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground">
            <p>Status: {article.status}</p>
            <p>
              Ingested:{" "}
              {format(new Date(article.ingested_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
            {article.ingested_by && <p>Ingested by: {article.ingested_by}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
