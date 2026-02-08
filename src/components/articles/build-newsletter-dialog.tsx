"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEMPLATE_OPTIONS } from "@/lib/constants";
import { mockBrandTemplates } from "@/lib/mock-data";

interface BuildNewsletterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleIds: string[];
}

export function BuildNewsletterDialog({
  open,
  onOpenChange,
  articleIds,
}: BuildNewsletterDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState<string>("the-rundown");
  const [brandTemplateId, setBrandTemplateId] = useState<string>("none");

  const handleSubmit = () => {
    if (!title.trim()) return;
    sessionStorage.setItem(
      "build-newsletter",
      JSON.stringify({ title, templateId, articleIds, brandTemplateId: brandTemplateId === "none" ? undefined : brandTemplateId })
    );
    onOpenChange(false);
    setTitle("");
    router.push("/newsletters/new-draft/edit");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Build Newsletter</DialogTitle>
          <DialogDescription>
            Create a newsletter from {articleIds.length} selected article
            {articleIds.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Newsletter Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AI in Sports — Week of Jan 15"
            />
          </div>
          <div className="space-y-2">
            <Label>Brand Template</Label>
            <Select value={brandTemplateId} onValueChange={setBrandTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="No brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No brand</SelectItem>
                {mockBrandTemplates.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <div className="grid gap-2">
              {TEMPLATE_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                    templateId === t.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <t.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Create Newsletter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
