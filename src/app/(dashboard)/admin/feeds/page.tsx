"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  listFeedSources,
  createFeedSource,
  updateFeedSource,
  deleteFeedSource,
  toggleFeedSource,
} from "@/lib/api/feed-sources";
import type { FeedSource } from "@/types";

export default function FeedsAdminPage() {
  const [feeds, setFeeds] = useState<FeedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<FeedSource | null>(null);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formType, setFormType] = useState<string>("rss");
  const [formInterval, setFormInterval] = useState("120");

  useEffect(() => {
    listFeedSources()
      .then(setFeeds)
      .catch((err) => {
        console.error("Failed to load feed sources:", err);
        toast.error("Failed to load feed sources");
      })
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => {
    setEditingFeed(null);
    setFormName("");
    setFormUrl("");
    setFormType("rss");
    setFormInterval("120");
    setDialogOpen(true);
  };

  const openEdit = (feed: FeedSource) => {
    setEditingFeed(feed);
    setFormName(feed.name);
    setFormUrl(feed.url);
    setFormType(feed.feed_type);
    setFormInterval(String(feed.fetch_interval_minutes));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formUrl.trim()) return;
    try {
      if (editingFeed) {
        const updated = await updateFeedSource(editingFeed.id, {
          name: formName,
          url: formUrl,
          feed_type: formType,
          fetch_interval_minutes: parseInt(formInterval),
        });
        setFeeds((prev) => prev.map((f) => (f.id === editingFeed.id ? updated : f)));
        toast.success("Feed source updated");
      } else {
        const created = await createFeedSource({
          name: formName,
          url: formUrl,
          feed_type: formType,
          fetch_interval_minutes: parseInt(formInterval),
        });
        setFeeds((prev) => [...prev, created]);
        toast.success("Feed source added");
      }
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to save feed source:", err);
      toast.error("Failed to save feed source");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const updated = await toggleFeedSource(id, !currentActive);
      setFeeds((prev) => prev.map((f) => (f.id === id ? updated : f)));
    } catch (err) {
      console.error("Failed to toggle feed:", err);
      toast.error("Failed to toggle feed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFeedSource(id);
      setFeeds((prev) => prev.filter((f) => f.id !== id));
      toast.success("Feed source deleted");
    } catch (err) {
      console.error("Failed to delete feed:", err);
      toast.error("Failed to delete feed source");
    }
  };

  const handlePollAll = async () => {
    setPolling(true);
    try {
      const res = await fetch("/api/feeds/poll", { method: "POST" });
      if (!res.ok) throw new Error("Poll failed");
      const result = await res.json();
      toast.success(`Polled feeds: ${result.polled ?? 0} feeds processed`);
      // Refresh feeds to update last_fetched_at
      const refreshed = await listFeedSources();
      setFeeds(refreshed);
    } catch (err) {
      console.error("Failed to poll feeds:", err);
      toast.error("Failed to poll feeds");
    } finally {
      setPolling(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title="Feed Sources"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePollAll} disabled={polling}>
              <RefreshCw className={`mr-1 h-4 w-4 ${polling ? "animate-spin" : ""}`} />
              {polling ? "Polling..." : "Poll All"}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openNew}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Feed
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingFeed ? "Edit Feed Source" : "Add Feed Source"}</DialogTitle>
                  <DialogDescription>
                    {editingFeed
                      ? "Update the RSS feed details."
                      : "Add a new RSS feed to automatically ingest articles."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., TechCrunch" />
                  </div>
                  <div className="space-y-2">
                    <Label>Feed URL</Label>
                    <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://example.com/feed/" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Feed Type</Label>
                      <Select value={formType} onValueChange={setFormType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rss">RSS</SelectItem>
                          <SelectItem value="atom">Atom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Poll Interval (min)</Label>
                      <Input type="number" value={formInterval} onChange={(e) => setFormInterval(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={!formName.trim() || !formUrl.trim()}>
                    {editingFeed ? "Save Changes" : "Add Feed"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <ScrollArea className="flex-1">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading feed sources...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Last Fetched</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeds.map((feed) => (
                  <TableRow key={feed.id}>
                    <TableCell className="font-medium">{feed.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {feed.url}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{feed.feed_type.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{feed.fetch_interval_minutes}m</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {feed.last_fetched_at
                        ? format(new Date(feed.last_fetched_at), "MMM d, h:mm a")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={feed.active} onCheckedChange={() => handleToggleActive(feed.id, feed.active)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(feed)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(feed.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
