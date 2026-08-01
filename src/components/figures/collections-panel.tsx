import { useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  Layers,
  Pencil,
  Plus,
  Share2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { UserCollection, UserEntry } from "@/lib/types";
import { COLLECTION_THEME_SUGGESTIONS } from "@/lib/types";
import { newCollectionId, useCatalogue } from "@/lib/store";
import { compressImage } from "@/lib/image";
import { resolveProduct } from "@/lib/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductImage } from "@/components/figures/product-image";
import { cn } from "@/lib/utils";
import { publishCollectionShare } from "@/lib/public-share";
import { absoluteShareUrl, copyText } from "@/lib/share-utils";

export function CollectionsPanel() {
  const collections = useCatalogue((s) => s.collections);
  const entries = useCatalogue((s) => s.entries);
  const upsertCollection = useCatalogue((s) => s.upsertCollection);
  const updateCollection = useCatalogue((s) => s.updateCollection);
  const removeCollection = useCatalogue((s) => s.removeCollection);
  const addCollectionPhoto = useCatalogue((s) => s.addCollectionPhoto);
  const removeCollectionPhoto = useCatalogue((s) => s.removeCollectionPhoto);
  const setCollectionProducts = useCatalogue((s) => s.setCollectionProducts);

  const list = useMemo(
    () =>
      Object.values(collections).sort((a, b) =>
        (b.updatedAt || "").localeCompare(a.updatedAt || ""),
      ),
    [collections],
  );

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<UserCollection | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const detail = detailId ? collections[detailId] ?? null : null;

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(col: UserCollection) {
    setEditing(col);
    setEditorOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            My Displays & Collections
          </h2>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Group shelf photos of multiple figures — Justice League, Teen Titans,
            The Dark Knight, or any team / movie / custom display.
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          New collection
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
          <Users className="mx-auto h-10 w-10 text-subtle mb-3" />
          <p className="font-medium text-fg">No collections yet</p>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">
            Create one for a team photo, movie lineup, or shelf section. Add as
            many group photos as you like and tag figures from the catalogue.
          </p>
          <Button type="button" className="mt-5" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Create your first collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((col) => {
            const cover =
              col.photos[col.coverPhotoIndex] ?? col.photos[0] ?? null;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setDetailId(col.id)}
                className="group flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative aspect-[4/3] bg-surface-2">
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-subtle">
                      <ImagePlus className="h-8 w-8 opacity-50" />
                      <span className="text-xs">Add group photos</span>
                    </div>
                  )}
                  {col.photos.length > 1 && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-bg/90 px-2 py-0.5 text-[10px] font-medium text-fg backdrop-blur-sm">
                      {col.photos.length} photos
                    </span>
                  )}
                </div>
                <div className="p-3.5 flex flex-col gap-1.5">
                  <h3 className="font-semibold text-sm sm:text-[15px] line-clamp-2">
                    {col.name}
                  </h3>
                  {col.theme && (
                    <Badge variant="secondary" className="w-fit text-[10px]">
                      {col.theme}
                    </Badge>
                  )}
                  <p className="text-xs text-muted line-clamp-2">
                    {col.description ||
                      `${col.productIds.length} figure${col.productIds.length === 1 ? "" : "s"} linked`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CollectionEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initial={editing}
        onSave={(col) => {
          upsertCollection(col);
          setEditorOpen(false);
          setDetailId(col.id);
          toast.success(editing ? "Collection updated" : "Collection created");
        }}
      />

      <CollectionDetail
        collection={detail}
        open={!!detail}
        onOpenChange={(o) => {
          if (!o) setDetailId(null);
        }}
        entries={entries}
        onEdit={() => {
          if (detail) {
            setDetailId(null);
            openEdit(detail);
          }
        }}
        onDelete={() => {
          if (!detail) return;
          removeCollection(detail.id);
          setDetailId(null);
          toast.message("Collection deleted");
        }}
        onAddPhoto={(dataUrl) => {
          if (detail) addCollectionPhoto(detail.id, dataUrl);
        }}
        onRemovePhoto={(index) => {
          if (detail) removeCollectionPhoto(detail.id, index);
        }}
        onSetCover={(index) => {
          if (detail) updateCollection(detail.id, { coverPhotoIndex: index });
        }}
        onSetProducts={(ids) => {
          if (detail) setCollectionProducts(detail.id, ids);
        }}
      />
    </div>
  );
}

function CollectionEditor({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: UserCollection | null;
  onSave: (col: UserCollection) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [theme, setTheme] = useState(initial?.theme ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [seedId, setSeedId] = useState(initial?.id ?? "new");

  if (open) {
    const nextSeed = initial?.id ?? "new";
    if (nextSeed !== seedId) {
      setSeedId(nextSeed);
      setName(initial?.name ?? "");
      setTheme(initial?.theme ?? "");
      setDescription(initial?.description ?? "");
    }
  }

  function submit() {
    const n = name.trim();
    if (!n) {
      toast.error("Give your collection a name");
      return;
    }
    const now = new Date().toISOString();
    onSave({
      id: initial?.id ?? newCollectionId(),
      name: n,
      theme: theme.trim(),
      description: description.trim(),
      photos: initial?.photos ?? [],
      productIds: initial?.productIds ?? [],
      coverPhotoIndex: initial?.coverPhotoIndex ?? 0,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit collection" : "New collection"}
          </DialogTitle>
          <DialogDescription>
            Name a group display — team, movie, or custom shelf photo set.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          <div className="grid gap-1.5">
            <Label htmlFor="col-name">Name</Label>
            <Input
              id="col-name"
              placeholder="e.g. Justice League shelf"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="col-theme">Theme / group</Label>
            <Input
              id="col-theme"
              list="collection-themes"
              placeholder="Teen Titans, The Dark Knight, Villains…"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
            <datalist id="collection-themes">
              {COLLECTION_THEME_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {COLLECTION_THEME_SUGGESTIONS.slice(0, 6).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                    theme === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted hover:text-fg",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="col-desc">Notes</Label>
            <Textarea
              id="col-desc"
              rows={3}
              placeholder="Shelf lighting, which wave, display notes…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submit}>
              {initial ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CollectionDetail({
  collection,
  open,
  onOpenChange,
  entries,
  onEdit,
  onDelete,
  onAddPhoto,
  onRemovePhoto,
  onSetCover,
  onSetProducts,
}: {
  collection: UserCollection | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entries: Record<string, UserEntry>;
  onEdit: () => void;
  onDelete: () => void;
  onAddPhoto: (dataUrl: string) => void;
  onRemovePhoto: (index: number) => void;
  onSetCover: (index: number) => void;
  onSetProducts: (ids: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");

  const productIds = collection?.productIds ?? [];

  const ownedCandidates = useMemo(() => {
    const q = linkQuery.trim().toLowerCase();
    return Object.values(entries)
      .filter((e) => e.owned)
      .map((e) => {
        const p = resolveProduct(e.productId, e);
        return p ? { entry: e, product: p } : null;
      })
      .filter(
        (
          row,
        ): row is {
          entry: UserEntry;
          product: NonNullable<ReturnType<typeof resolveProduct>>;
        } => !!row,
      )
      .filter((row) => {
        if (!q) return true;
        const p = row.product;
        return (
          p.name.toLowerCase().includes(q) ||
          p.character.toLowerCase().includes(q)
        );
      })
      .slice(0, 40);
  }, [entries, linkQuery]);

  const linked = useMemo(() => {
    return productIds
      .map((id) => {
        const e = entries[id];
        const p = resolveProduct(id, e);
        return p ? { id, product: p } : null;
      })
      .filter(
        (
          row,
        ): row is {
          id: string;
          product: NonNullable<ReturnType<typeof resolveProduct>>;
        } => !!row,
      );
  }, [productIds, entries]);

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image");
      return;
    }
    setBusy(true);
    try {
      const data = await compressImage(file, 1920, 0.88);
      onAddPhoto(data);
      toast.success("Photo added to collection");
    } catch {
      toast.error("Could not process image");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function toggleProduct(id: string) {
    if (!collection) return;
    const set = new Set(collection.productIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onSetProducts([...set]);
  }

  async function handleShareCollection() {
    if (!collection) return;
    setShareBusy(true);
    try {
      const customs: Record<
        string,
        {
          name: string;
          character?: string;
          imageUrl?: string | null;
          category?: string;
          line?: string;
          scale?: string;
        }
      > = {};
      for (const id of collection.productIds) {
        const e = entries[id];
        if (!e?.isCustom) continue;
        const p = resolveProduct(id, e);
        if (!p) continue;
        customs[id] = {
          name: p.name,
          character: p.character,
          imageUrl: p.imageUrl,
          category: p.category,
          line: p.line,
          scale: p.scale,
        };
      }
      const result = await publishCollectionShare({
        data: {
          collectionId: collection.id,
          name: collection.name,
          description: collection.description,
          theme: collection.theme,
          photos: collection.photos,
          productIds: collection.productIds,
          customs,
        },
      });
      const url = absoluteShareUrl(result.path);
      const ok = await copyText(url);
      toast.success(
        ok
          ? "Collection link copied — share it with anyone"
          : "Collection link ready",
      );
      if (!ok) window.prompt("Copy this share link:", url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not create share link",
      );
    } finally {
      setShareBusy(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[min(92dvh,900px)] overflow-y-auto">
          {collection && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
                  <div className="min-w-0">
                    <DialogTitle className="text-xl">
                      {collection.name}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      {collection.theme ? (
                        <Badge variant="secondary" className="mr-2">
                          {collection.theme}
                        </Badge>
                      ) : null}
                      {collection.description || "Group display photos"}
                    </DialogDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={shareBusy}
                      onClick={() => void handleShareCollection()}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      {shareBusy ? "Sharing…" : "Share"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onEdit}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-danger"
                      onClick={onDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 pt-1">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-[11px] font-medium uppercase tracking-wide text-subtle">
                      Group photos ({collection.photos.length})
                    </h4>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => fileRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                      {busy ? "Processing…" : "Add photo"}
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void onFile(e.target.files)}
                    />
                  </div>
                  {collection.photos.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-2/50 py-12 text-muted hover:text-fg hover:border-border-strong transition-colors"
                    >
                      <ImagePlus className="h-8 w-8 opacity-60" />
                      <span className="text-sm">
                        Add a shelf / team / multi-figure photo
                      </span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {collection.photos.map((src, i) => {
                        const isCover = i === collection.coverPhotoIndex;
                        return (
                          <div
                            key={`${i}-${src.slice(0, 20)}`}
                            className={cn(
                              "relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border bg-surface-2",
                              isCover
                                ? "border-primary ring-1 ring-primary"
                                : "border-border",
                            )}
                          >
                            <img
                              src={src}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1.5 bg-gradient-to-t from-bg/90 to-transparent">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={() => onSetCover(i)}
                                  className="rounded bg-surface/95 px-1.5 py-0.5 text-[10px] font-medium text-fg"
                                >
                                  Set cover
                                </button>
                              )}
                              {isCover && (
                                <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-fg">
                                  Cover
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  onRemovePhoto(i);
                                  toast.success("Photo deleted");
                                }}
                                className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-danger text-primary-fg"
                                aria-label="Delete photo"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-[11px] font-medium uppercase tracking-wide text-subtle">
                      Figures in this display ({linked.length})
                    </h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setLinkOpen(true)}
                    >
                      <Users className="h-3.5 w-3.5" />
                      Link figures
                    </Button>
                  </div>
                  {linked.length === 0 ? (
                    <p className="text-sm text-muted">
                      Optionally link vaulted figures so this collection ties
                      back to the catalogue.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {linked.map(({ id, product }) => (
                        <div
                          key={id}
                          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-2 pr-2"
                        >
                          <ProductImage
                            src={product.imageUrl ?? ""}
                            alt=""
                            className="h-10 w-10 rounded-l-[var(--radius-md)]"
                            imgClassName="object-contain p-0.5"
                            sizes="40px"
                          />
                          <span className="text-xs font-medium max-w-[140px] truncate">
                            {product.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleProduct(id)}
                            className="text-subtle hover:text-danger"
                            aria-label="Unlink"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md max-h-[80dvh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Link figures</DialogTitle>
            <DialogDescription>
              Pick from figures marked In My Vault.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Search your vault…"
            value={linkQuery}
            onChange={(e) => setLinkQuery(e.target.value)}
            className="mb-2"
          />
          <div className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1">
            {ownedCandidates.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">
                No vaulted figures match. Mark figures In My Vault first.
              </p>
            ) : (
              ownedCandidates.map(({ product }) => {
                const on = productIds.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-[var(--radius-md)] border px-2 py-1.5 text-left text-sm transition-colors",
                      on
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-surface-2",
                    )}
                  >
                    <ProductImage
                      src={product.imageUrl ?? ""}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded"
                      imgClassName="object-contain p-0.5"
                      sizes="40px"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {product.name}
                    </span>
                    {on && (
                      <Badge variant="default" className="text-[10px]">
                        Linked
                      </Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>
          <Button
            type="button"
            className="mt-2"
            onClick={() => setLinkOpen(false)}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
