import { FileText, LayoutGrid, Columns3 } from "lucide-react";

export const TEMPLATE_OPTIONS = [
  { id: "the-rundown", name: "The Rundown", description: "News grid with hero article", icon: FileText },
  { id: "quick-hits", name: "Quick Hits", description: "Compact 3-column card grid", icon: LayoutGrid },
  { id: "deep-dive", name: "Deep Dive", description: "Sectioned layout with sidebar", icon: Columns3 },
] as const;

export type TemplateId = (typeof TEMPLATE_OPTIONS)[number]["id"];
