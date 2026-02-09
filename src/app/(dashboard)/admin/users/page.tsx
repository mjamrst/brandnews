"use client";

import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { listProfiles, updateProfile } from "@/lib/api/profiles";
import type { Profile } from "@/types";

export default function UsersAdminPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formTeam, setFormTeam] = useState("");
  const [formRole, setFormRole] = useState("editor");

  useEffect(() => {
    listProfiles()
      .then(setUsers)
      .catch((err) => {
        console.error("Failed to load users:", err);
        toast.error("Failed to load users");
      })
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => {
    setEditingUser(null);
    setFormDisplayName("");
    setFormEmail("");
    setFormPassword("");
    setFormTeam("");
    setFormRole("editor");
    setDialogOpen(true);
  };

  const openEdit = (user: Profile) => {
    setEditingUser(user);
    setFormDisplayName(user.display_name);
    setFormEmail("");
    setFormPassword("");
    setFormTeam(user.team || "");
    setFormRole(user.role);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formDisplayName.trim()) return;
    try {
      if (editingUser) {
        const updated = await updateProfile(editingUser.id, {
          display_name: formDisplayName,
          team: formTeam || null,
          role: formRole,
        });
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
        toast.success("User updated");
      } else {
        // For creating new users, we'd need to call Supabase Auth admin API
        // For now, show a message that user creation requires the admin API
        if (!formEmail.trim() || !formPassword.trim()) return;
        toast.info("User creation via admin API coming soon. Please use Supabase Dashboard.");
        setDialogOpen(false);
        return;
      }
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to save user:", err);
      toast.error("Failed to save user");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title="User Management"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew}>
                <Plus className="mr-1 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Update user details."
                    : "Create a new user account. They will use these credentials to log in."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} placeholder="e.g., Sarah Chen" />
                </div>
                {!editingUser && (
                  <>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="user@agency.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Set a password" />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Input value={formTeam} onChange={(e) => setFormTeam(e.target.value)} placeholder="e.g., Sports & Entertainment" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formRole} onValueChange={setFormRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!formDisplayName.trim()}>
                  {editingUser ? "Save Changes" : "Create User"}
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
              <span className="ml-2 text-sm text-muted-foreground">Loading users...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.display_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.team || "\u2014"}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}>
                          <Pencil className="h-3.5 w-3.5" />
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
