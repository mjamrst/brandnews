"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Newspaper,
  Library,
  FileText,
  Rss,
  Palette,
  Users,
  Tags,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const mainNavItems = [
  { label: "Library", href: "/library", icon: Library },
  { label: "Newsletters", href: "/newsletters", icon: FileText },
];

const adminNavItems = [
  { label: "Feed Sources", href: "/admin/feeds", icon: Rss },
  { label: "Brand Templates", href: "/admin/brands", icon: Palette },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Tags", href: "/admin/tags", icon: Tags },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const initials = profile?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "U";

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed && (
          <Link href="/library" className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            <span className="text-lg font-semibold tracking-tight">The Brief</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      {/* Main nav */}
      <nav className="flex-1 space-y-1 p-2">
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {profile?.role === "admin" && (
          <>
            <Separator className="my-3" />
            {!collapsed && (
              <span className="px-3 text-xs font-medium uppercase text-muted-foreground">
                Admin
              </span>
            )}
            {adminNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t p-2">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{profile?.display_name}</p>
                <p className="truncate text-xs text-muted-foreground">{profile?.role}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
