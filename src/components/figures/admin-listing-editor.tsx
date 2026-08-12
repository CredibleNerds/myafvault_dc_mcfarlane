import { useEffect, useState } from "react";
import { Loader2, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CatalogProduct, ProductCategory } from "@/lib/types";
import { CATEGORIES, LINES } from "@/lib/types";
import type { CatalogOverridePatch } from "@/lib/catalog-overrides";

const MONTHS = [
  { value: "none", label: "Unknown" },

  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function formFromProduct(product: CatalogProduct) {
  return {
    name: product.name,
    character: product.character,
    category: product.category,
    line: product.line,
    sku: product.sku ?? "",
    releaseYear: product.releaseYear ? String(product.releaseYear) : "",
    releaseMonth: product.releaseMonth ? String(product.releaseMonth) : "none",

    description: product.description ?? "",
    accessories: (product.accessories ?? []).join("\n"),
    hidden: false,
  };
}

export function AdminListingEditor({
  product,
  hidden,
  onSave,
  onRevert,
}: {
  product: CatalogProduct;
  hidden: boolean;
  onSave: (
    patch: CatalogOverridePatch,
    hidden: boolean,
  ) => Promise<void>;
  onRevert: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => formFromProduct(product));

  useEffect(() => {
    setForm({ ...formFromProduct(product), hidden });
  }, [product.id, product.name, product.category, hidden]);

  async function save() {
    const year = form.releaseYear.trim()
      ? Number(form.releaseYear.trim())
      : null;
    const month =
      form.releaseMonth && form.releaseMonth !== "none"
        ? Number(form.releaseMonth)
        : null;

    setSaving(true);
    try {
      await onSave(
        {
          name: form.name,
          character: form.character,
          category: form.category,
          line: form.line,
          sku: form.sku,
          releaseYear: year,
          releaseMonth: month,
          description: form.description,
          accessories: form.accessories
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        form.hidden,
      );
      toast.success("Listing saved for everyone");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save listing");
    } finally {
      setSaving(false);
    }
  }

  async function revert() {
    setSaving(true);
    try {
      await onRevert();
      toast.message("Reverted to original catalogue listing");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not revert");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2.5 border-t border-primary/20 pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
          Admin · edit listing
        </p>
        <Button
          type="button"
          size="sm"
          variant={open ? "secondary" : "outline"}
          onClick={() => setOpen((v) => !v)}
        >
          <Pencil className="h-3.5 w-3.5" />
          {open ? "Close editor" : "Edit this listing"}
        </Button>
      </div>
      <p className="text-[11px] text-muted leading-relaxed">
        Change the name, category, date, or accessories. Saves to the shared
        vault database — every collector sees the update.
      </p>
      {open && (
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="admin-name">Name</Label>
            <Input
              id="admin-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-character">Character</Label>
            <Input
              id="admin-character"
              value={form.character}
              onChange={(e) =>
                setForm((f) => ({ ...f, character: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, category: v as ProductCategory }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Line</Label>
              <Select
                value={form.line}
                onValueChange={(v) => setForm((f) => ({ ...f, line: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINES.filter((l) => l !== "Custom").map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                  {form.line && !LINES.includes(form.line) && (
                    <SelectItem value={form.line}>{form.line}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="admin-sku">SKU</Label>
              <Input
                id="admin-sku"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-year">Year</Label>
              <Input
                id="admin-year"
                inputMode="numeric"
                value={form.releaseYear}
                onChange={(e) =>
                  setForm((f) => ({ ...f, releaseYear: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Month</Label>
              <Select
                value={form.releaseMonth}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, releaseMonth: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>

                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-desc">Description</Label>
            <Textarea
              id="admin-desc"
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-acc">Accessories (one per line)</Label>
            <Textarea
              id="admin-acc"
              rows={5}
              value={form.accessories}
              onChange={(e) =>
                setForm((f) => ({ ...f, accessories: e.target.value }))
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.hidden}
              onChange={(e) =>
                setForm((f) => ({ ...f, hidden: e.target.checked }))
              }
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Hide this listing from collectors
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save for everyone
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => void revert()}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Revert to original
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
