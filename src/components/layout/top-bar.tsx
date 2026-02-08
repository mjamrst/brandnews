"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type ReactNode } from "react";

interface TopBarProps {
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
}

export function TopBar({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  actions,
}: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        {onSearchChange !== undefined && (
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        )}
        {actions}
      </div>
    </header>
  );
}
