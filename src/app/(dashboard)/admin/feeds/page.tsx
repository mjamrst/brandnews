"use client";

import { useState } from "react";
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
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { mockFeedSources } from "@/lib/mock-data";
import type { FeedSource } from "@/types";

export default function FeedsAdminPage() {
  const [feeds, setFeeds] = useState<FeedSource[]>(mockFeedSources);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<FeedSource | null>(null);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formType, setFormType] = useState<string>("rss");
  const [formInterval, setFormInterval] = useState("120");

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

  const handleSave = () => {
    if (!formName.trim() || !formUrl.trim()) return;
    if (editingFeed) {
      setFeeds((prev) =>
        prev.map((f) =>
          f.id === editingFeed.id
            ? { ...f, name: formName, url: formUrl, feed_type: formType, fetch_interval_minutes: parseInt(formInterval) }
            : f
        )
      );
      toast.success("Feed source updated");
    } else {
      const newFeed: FeedSource = {
        id: `f${Date.now()}`,
        name: formName,
        url: formUrl,
        feed_type: formType,
        active: true,
        last_fetched_at: null,
        fetch_interval_minutes: parseInt(formInterval),
        created_at: new Date().toISOString(),
      };
      setFeeds((prev) => [...prev, newFeed]);
      toast.success("Feed source added");
    }
    setDialogOpen(false);
  };

  const toggleActive = (id: string) => {
    setFeeds((prev) =>
      prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f))
    );
  };

  const deleteFeed = (id: string) => {
    setFeeds((prev) => prev.filter((f) => f.id !== id));
    toast.success("Feed source deleted");
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title="Feed Sources"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("All feeds polled")}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Poll All
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
                    <Switch checked={feed.active} onCheckedChange={() => toggleActive(feed.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(feed)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteFeed(feed.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
