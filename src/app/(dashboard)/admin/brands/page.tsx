"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { mockBrandTemplates } from "@/lib/mock-data";
import { TEMPLATE_OPTIONS } from "@/lib/constants";
import type { BrandTemplate, PartnerLogo } from "@/types";

const FONT_OPTIONS = ["Inter", "Georgia", "Roboto", "Merriweather", "Arial"];

export default function BrandsAdminPage() {
  const [brands, setBrands] = useState<BrandTemplate[]>(mockBrandTemplates);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandTemplate | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formLogoUrl, setFormLogoUrl] = useState("");
  const [formHeaderImageUrl, setFormHeaderImageUrl] = useState("");
  const [formPartnerLogos, setFormPartnerLogos] = useState<PartnerLogo[]>([]);
  const [formPrimary, setFormPrimary] = useState("#000000");
  const [formSecondary, setFormSecondary] = useState("#333333");
  const [formAccent, setFormAccent] = useState("#0066FF");
  const [formHeadingFont, setFormHeadingFont] = useState("Inter");
  const [formBodyFont, setFormBodyFont] = useState("Inter");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formFooter, setFormFooter] = useState("");
  const [formBrandDescription, setFormBrandDescription] = useState("");
  const [formDefaultTemplate, setFormDefaultTemplate] = useState("the-rundown");
  const [formShowWhyItMatters, setFormShowWhyItMatters] = useState(false);

  const resetForm = () => {
    setFormName("");
    setFormLogoUrl("");
    setFormHeaderImageUrl("");
    setFormPartnerLogos([]);
    setFormPrimary("#000000");
    setFormSecondary("#333333");
    setFormAccent("#0066FF");
    setFormHeadingFont("Inter");
    setFormBodyFont("Inter");
    setFormSubtitle("");
    setFormFooter("");
    setFormBrandDescription("");
    setFormDefaultTemplate("the-rundown");
    setFormShowWhyItMatters(false);
  };

  const openNew = () => {
    setEditingBrand(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (brand: BrandTemplate) => {
    setEditingBrand(brand);
    setFormName(brand.name);
    setFormLogoUrl(brand.logo_url || "");
    setFormHeaderImageUrl(brand.header_image_url || "");
    setFormPartnerLogos([...brand.partner_logos]);
    setFormPrimary(brand.primary_color);
    setFormSecondary(brand.secondary_color);
    setFormAccent(brand.accent_color);
    setFormHeadingFont(brand.heading_font);
    setFormBodyFont(brand.body_font);
    setFormSubtitle(brand.subtitle || "");
    setFormFooter(brand.footer_text || "");
    setFormBrandDescription(brand.brand_description || "");
    setFormDefaultTemplate(brand.default_template_id);
    setFormShowWhyItMatters(brand.show_why_it_matters);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    const brandData: Omit<BrandTemplate, "id" | "created_at"> = {
      name: formName,
      logo_url: formLogoUrl || null,
      header_image_url: formHeaderImageUrl || null,
      partner_logos: formPartnerLogos.filter((l) => l.url.trim()),
      primary_color: formPrimary,
      secondary_color: formSecondary,
      accent_color: formAccent,
      heading_font: formHeadingFont,
      body_font: formBodyFont,
      subtitle: formSubtitle || null,
      footer_text: formFooter || null,
      brand_description: formBrandDescription || null,
      default_template_id: formDefaultTemplate,
      show_why_it_matters: formShowWhyItMatters,
    };

    if (editingBrand) {
      setBrands((prev) =>
        prev.map((b) =>
          b.id === editingBrand.id ? { ...b, ...brandData } : b
        )
      );
      toast.success("Brand template updated");
    } else {
      setBrands((prev) => [
        ...prev,
        { ...brandData, id: `b${Date.now()}`, created_at: new Date().toISOString() },
      ]);
      toast.success("Brand template created");
    }
    setDialogOpen(false);
  };

  const deleteBrand = (id: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== id));
    toast.success("Brand template deleted");
  };

  const addPartnerLogo = () => {
    setFormPartnerLogos((prev) => [...prev, { url: "", alt: "" }]);
  };

  const updatePartnerLogo = (index: number, field: "url" | "alt", value: string) => {
    setFormPartnerLogos((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const removePartnerLogo = (index: number) => {
    setFormPartnerLogos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title="Brand Templates"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew}>
                <Plus className="mr-1 h-4 w-4" />
                New Brand
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBrand ? "Edit Brand Template" : "Create Brand Template"}</DialogTitle>
                <DialogDescription>
                  Configure the brand identity, colors, typography, and layout preferences.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Identity */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identity</h3>
                  <div className="space-y-2">
                    <Label>Brand Name</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Google" />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input value={formLogoUrl} onChange={(e) => setFormLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                  </div>
                  <div className="space-y-2">
                    <Label>Header Banner Image URL</Label>
                    <p className="text-xs text-muted-foreground">Recommended: 1200 × 400px (3:1 ratio). PNG for graphics, JPEG for photos.</p>
                    <Input value={formHeaderImageUrl} onChange={(e) => setFormHeaderImageUrl(e.target.value)} placeholder="https://example.com/banner.png" />
                    {formHeaderImageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={formHeaderImageUrl} alt="Banner preview" className="mt-1 h-16 w-full rounded object-cover border" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Partner / Agency Logos</Label>
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addPartnerLogo}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add Logo
                      </Button>
                    </div>
                    {formPartnerLogos.map((logo, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={logo.url}
                          onChange={(e) => updatePartnerLogo(i, "url", e.target.value)}
                          placeholder="Logo URL"
                          className="flex-1"
                        />
                        <Input
                          value={logo.alt}
                          onChange={(e) => updatePartnerLogo(i, "alt", e.target.value)}
                          placeholder="Alt text"
                          className="w-32"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removePartnerLogo(i)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Colors</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Primary</Label>
                      <div className="flex gap-2">
                        <input type="color" value={formPrimary} onChange={(e) => setFormPrimary(e.target.value)} className="h-9 w-9 cursor-pointer rounded border" />
                        <Input value={formPrimary} onChange={(e) => setFormPrimary(e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary</Label>
                      <div className="flex gap-2">
                        <input type="color" value={formSecondary} onChange={(e) => setFormSecondary(e.target.value)} className="h-9 w-9 cursor-pointer rounded border" />
                        <Input value={formSecondary} onChange={(e) => setFormSecondary(e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Accent</Label>
                      <div className="flex gap-2">
                        <input type="color" value={formAccent} onChange={(e) => setFormAccent(e.target.value)} className="h-9 w-9 cursor-pointer rounded border" />
                        <Input value={formAccent} onChange={(e) => setFormAccent(e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Typography</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Heading Font</Label>
                      <Select value={formHeadingFont} onValueChange={setFormHeadingFont}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((f) => (
                            <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Body Font</Label>
                      <Select value={formBodyFont} onValueChange={setFormBodyFont}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((f) => (
                            <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Content</h3>
                  <div className="space-y-2">
                    <Label>Subtitle / Tagline</Label>
                    <Input value={formSubtitle} onChange={(e) => setFormSubtitle(e.target.value)} placeholder="Monthly newsletter outlining..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Footer Text</Label>
                    <Textarea value={formFooter} onChange={(e) => setFormFooter(e.target.value)} placeholder="Custom footer text for this brand..." rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand Description</Label>
                    <p className="text-xs text-muted-foreground">Used by AI to generate &ldquo;Why it matters to [Brand]&rdquo; paragraphs.</p>
                    <Textarea value={formBrandDescription} onChange={(e) => setFormBrandDescription(e.target.value)} placeholder="Describe the brand's industry, focus areas, and sports marketing strategy..." rows={3} />
                  </div>
                </div>

                {/* Layout Defaults */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Layout Defaults</h3>
                  <div className="space-y-2">
                    <Label>Default Template</Label>
                    <div className="grid gap-2">
                      {TEMPLATE_OPTIONS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormDefaultTemplate(t.id)}
                          className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                            formDefaultTemplate === t.id
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
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">Show &ldquo;Why it matters&rdquo; section</p>
                      <p className="text-xs text-muted-foreground">AI-generated brand relevance paragraph per article</p>
                    </div>
                    <Switch checked={formShowWhyItMatters} onCheckedChange={setFormShowWhyItMatters} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!formName.trim()}>
                  {editingBrand ? "Save Changes" : "Create Brand"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <ScrollArea className="flex-1">
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardContent className="p-4">
                {brand.header_image_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={brand.header_image_url}
                    alt={`${brand.name} banner`}
                    className="mb-3 h-16 w-full rounded object-cover"
                  />
                )}
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">{brand.name}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(brand)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBrand(brand.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded" style={{ backgroundColor: brand.primary_color }} title="Primary" />
                  <div className="h-8 w-8 rounded" style={{ backgroundColor: brand.secondary_color }} title="Secondary" />
                  <div className="h-8 w-8 rounded border" style={{ backgroundColor: brand.accent_color }} title="Accent" />
                </div>
                {brand.subtitle && (
                  <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">{brand.subtitle}</p>
                )}
                {brand.footer_text && !brand.subtitle && (
                  <p className="mt-2 text-xs text-muted-foreground">{brand.footer_text}</p>
                )}
                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{brand.heading_font}</span>
                  <span>·</span>
                  <span>{TEMPLATE_OPTIONS.find((t) => t.id === brand.default_template_id)?.name}</span>
                  {brand.show_why_it_matters && (
                    <>
                      <span>·</span>
                      <span>WIM</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
