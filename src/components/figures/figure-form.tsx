import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductCategory, UserEntry } from "@/lib/types";
import { compressImage, figurePlaceholder } from "@/lib/image";
import { cn } from "@/lib/utils";

export interface CustomFigureDraft {
  name: string;
  character: string;
  category: ProductCategory;
  line: string;
  scale: string;
  releaseYear: number | null;
  description: string;
  accessoriesText: string;
  notes: string;
  photo: string | null;
}

const empty: CustomFigureDraft = {
  name: "",
  character: "",
  category: "7-inch",
  line: "Custom",
  scale: '7"',
  releaseYear: new Date().getFullYear(),
  description: "",
  accessoriesText: "",
  notes: "",
  photo: null,
};

interface FigureFormProps {
  onSubmit: (entry: UserEntry) => void;
  onCancel: () => void;
}

export function FigureForm({ onSubmit, onCancel }: FigureFormProps) {
  const [form, setForm] = useState<CustomFigureDraft>({ ...empty });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof CustomFigureDraft>(
    key: K,
    value: CustomFigureDraft[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setBusy(true);
    try {
      setField("photo", await compressImage(file));
      toast.success("Photo added");
    } catch {
      toast.error("Could not process image");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.character.trim()) {
      toast.error("Name and character are required");
      return;
    }
    const accessories = form.accessoriesText
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
    const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const photo = form.photo ?? figurePlaceholder(form.name.trim());
    const entry: UserEntry = {
      productId: id,
      owned: true,
      wishlist: false,
      condition: "mint",
      purchasePrice: null,
      estimatedValue: null,
      purchaseDate: null,
      notes: form.notes.trim(),
      personalPhotos: form.photo ? [form.photo] : [],
      usePersonalPhoto: !!form.photo,
      isCustom: true,
      customProduct: {
        name: form.name.trim(),
        character: form.character.trim(),
        category: form.category,
        line: form.line.trim() || "Custom",
        scale: form.scale.trim() || '7"',
        releaseYear: form.releaseYear,
        description: form.description.trim(),
        accessories,
        features: accessories,
        imageUrl: photo,
        gallery: [photo],
        brand: "Custom",
      },
      createdAt: now,
      updatedAt: now,
    };
    onSubmit(entry);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        For figures not yet in the McFarlane master list — add your own entry
        with photos and accessories.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className={cn(
            "mx-auto sm:mx-0 flex h-40 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-2",
            form.photo && "border-solid",
          )}
        >
          {form.photo ? (
            <img src={form.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 p-2 text-center">
              <ImagePlus className="h-5 w-5 text-subtle" />
              <span className="text-[11px] text-muted">Photo</span>
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onFile(e.target.files)}
        />
        <div className="flex flex-1 flex-col gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Figure name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="character">Character *</Label>
            <Input
              id="character"
              value={form.character}
              onChange={(e) => setField("character", e.target.value)}
              required
            />
          </div>
          {form.photo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={() => setField("photo", null)}
            >
              <X className="h-3.5 w-3.5" />
              Remove photo
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setField("category", v as ProductCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7-inch">7" Figure</SelectItem>
              <SelectItem value="megafig">Megafig</SelectItem>
              <SelectItem value="multipack">2-Pack / Multipack</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="scale">Scale</Label>
          <Input
            id="scale"
            value={form.scale}
            onChange={(e) => setField("scale", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="line">Line</Label>
          <Input
            id="line"
            value={form.line}
            onChange={(e) => setField("line", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="year">Release year</Label>
          <Input
            id="year"
            type="number"
            value={form.releaseYear ?? ""}
            onChange={(e) =>
              setField(
                "releaseYear",
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="desc">Description</Label>
        <Textarea
          id="desc"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={2}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="acc">Accessories (one per line)</Label>
        <Textarea
          id="acc"
          value={form.accessoriesText}
          onChange={(e) => setField("accessoriesText", e.target.value)}
          placeholder={"Extra hands\nBatarangs\nDisplay base\nCollectible art card"}
          rows={4}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          Add to collection
        </Button>
      </div>
    </form>
  );
}
