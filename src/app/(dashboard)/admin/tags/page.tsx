"use client";

import { useState, useMemo, useEffect } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listTags, createTag, updateTag, deleteTag } from "@/lib/api/tags";
import type { Tag } from "@/types";

const categoryColors: Record<string, string> = {
  topic: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  industry: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  technology: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default function TagsAdminPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("topic");

  useEffect(() => {
    listTags()
      .then(setTags)
      .catch((err) => {
        console.error("Failed to load tags:", err);
        toast.error("Failed to load tags");
      })
      .finally(() => setLoading(false));
  }, []);

  const tagsByCategory = useMemo(() => {
    const grouped: Record<string, Tag[]> = {};
    for (const tag of tags) {
      const cat = tag.category || "other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(tag);
    }
    return grouped;
  }, [tags]);

  const openNew = () => {
    setEditingTag(null);
    setFormName("");
    setFormCategory("topic");
    setDialogOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormCategory(tag.category || "topic");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    const normalized = formName.trim().toLowerCase().replace(/\s+/g, "-");
    try {
      if (editingTag) {
        const updated = await updateTag(editingTag.id, { name: normalized, category: formCategory });
        setTags((prev) => prev.map((t) => (t.id === editingTag.id ? updated : t)));
        toast.success("Tag updated");
      } else {
        const created = await createTag({ name: normalized, category: formCategory });
        setTags((prev) => [...prev, created]);
        toast.success("Tag created");
      }
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to save tag:", err);
      toast.error("Failed to save tag");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tag deleted");
    } catch (err) {
      console.error("Failed to delete tag:", err);
      toast.error("Failed to delete tag");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title="Tag Management"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew}>
                <Plus className="mr-1 h-4 w-4" />
                Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTag ? "Edit Tag" : "Create Tag"}</DialogTitle>
                <DialogDescription>
                  Tags are used to categorize articles and group newsletter sections.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tag Name</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., sports-sponsorship"
                  />
                  <p className="text-xs text-muted-foreground">
                    Will be lowercased and hyphenated automatically.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="topic">Topic</SelectItem>
                      <SelectItem value="industry">Industry</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!formName.trim()}>
                  {editingTag ? "Save Changes" : "Create Tag"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading tags...</span>
            </div>
          ) : Object.keys(tagsByCategory).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No tags yet. Create one to get started.</p>
            </div>
          ) : (
            Object.entries(tagsByCategory)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, categoryTags]) => (
                <div key={category}>
                  <h2 className="mb-3 text-sm font-semibold capitalize">{category}</h2>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((tag) => (
                        <div
                          key={tag.id}
                          className="group flex items-center gap-1"
                        >
                          <Badge
                            className={`${categoryColors[category] || ""} text-xs`}
                          >
                            {tag.name}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100"
                            onClick={() => openEdit(tag)}
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100"
                            onClick={() => handleDelete(tag.id)}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
