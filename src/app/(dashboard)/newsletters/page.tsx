"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  MoreHorizontal,
  Copy,
  Download,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { listNewsletters, createNewsletter, deleteNewsletter } from "@/lib/api/newsletters";
import { listProfiles } from "@/lib/api/profiles";
import { TEMPLATE_OPTIONS } from "@/lib/constants";
import type { Newsletter, Profile } from "@/lib/supabase/database.types";

const templateOptions = TEMPLATE_OPTIONS;

export default function NewslettersPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("the-rundown");

  // Live data
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listNewsletters(), listProfiles()])
      .then(([nl, pr]) => {
        setNewsletters(nl);
        setProfiles(pr);
      })
      .catch((err) => {
        console.error("Failed to load newsletters:", err);
        toast.error("Failed to load newsletters");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const created = await createNewsletter({
        title: newTitle,
        template_id: selectedTemplate,
        status: "draft",
      });
      toast.success(`Newsletter "${newTitle}" created`);
      setDialogOpen(false);
      setNewTitle("");
      router.push(`/newsletters/${created.id}/edit`);
    } catch (err) {
      console.error("Failed to create newsletter:", err);
      toast.error("Failed to create newsletter");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNewsletter(id);
      setNewsletters((prev) => prev.filter((n) => n.id !== id));
      toast.success("Newsletter deleted");
    } catch (err) {
      console.error("Failed to delete newsletter:", err);
      toast.error("Failed to delete newsletter");
    }
  };

  const getCreatorName = (createdBy: string | null) => {
    const profile = profiles.find((p) => p.id === createdBy);
    return profile?.display_name || "Unknown";
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title="Newsletters"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                New Newsletter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Newsletter</DialogTitle>
                <DialogDescription>
                  Name your newsletter and choose a template to get started.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Newsletter Title</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., AI in Sports — Week of Jan 15"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Template</Label>
                  <div className="grid gap-2">
                    {templateOptions.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                          selectedTemplate === t.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <t.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newTitle.trim()}>
                  Create Newsletter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <ScrollArea className="flex-1">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading newsletters...</span>
            </div>
          ) : newsletters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No newsletters yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {newsletters.map((newsletter) => (
                <Card
                  key={newsletter.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => router.push(`/newsletters/${newsletter.id}/edit`)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">
                          {newsletter.title}
                        </h3>
                        <Badge
                          variant={newsletter.status === "published" ? "default" : "secondary"}
                          className="text-[10px] shrink-0"
                        >
                          {newsletter.status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {templateOptions.find((t) => t.id === newsletter.template_id)?.name}
                        </span>
                        <span>·</span>
                        <span>by {getCreatorName(newsletter.created_by)}</span>
                        <span>·</span>
                        <span>
                          Updated {format(new Date(newsletter.updated_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/newsletters/${newsletter.id}/edit`);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {newsletter.published_url && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(
                                window.location.origin + newsletter.published_url
                              );
                              toast.success("Link copied to clipboard");
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success("HTML email downloaded");
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download HTML
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(newsletter.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
