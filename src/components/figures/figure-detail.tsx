import { OWNERSHIP } from "@/lib/ownership-copy";
import { useRef, useState } from "react";
import {
  Check,
  ExternalLink,
  Heart,
  ImagePlus,
  Shield,
  Star,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import type { CatalogProduct, FigureCondition, UserEntry } from "@/lib/types";
import { CONDITIONS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  categoryLabel,
  displayImageFor,
  formatAccessories,
  officialImagesFor,
} from "@/lib/product";
import { compressImage } from "@/lib/image";
import { ProductImage } from "@/components/figures/product-image";
import { ImageLightbox } from "@/components/figures/image-lightbox";

interface FigureDetailProps {
  product: CatalogProduct | null;
  entry: UserEntry | null;
  /** Shared admin default cover for all users */
  systemCover?: string | null;
  isAdmin?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkOwned: (owned: boolean) => void;
  onToggleWishlist: () => void;
  onUpdate: (patch: Partial<UserEntry>) => void;
  onAddPhoto: (dataUrl: string) => void;
  onRemovePhoto: (index: number) => void;
  onSetPersonalCover?: (index: number) => void;
  onClearPersonalCover?: () => void;
  onSetSystemCover?: (imageUrl: string) => void | Promise<void>;
  onClearSystemCover?: () => void | Promise<void>;
}

export function FigureDetail({
  product,
  entry,
  systemCover = null,
  isAdmin = false,
  open,
  onOpenChange,
  onMarkOwned,
  onToggleWishlist,
  onUpdate,
  onAddPhoto,
  onRemovePhoto,
  onSetPersonalCover,
  onClearPersonalCover,
  onSetSystemCover,
  onClearSystemCover,
}: FigureDetailProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const adminFileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!product) return null;

  const accessories = formatAccessories(product);
  const officialGallery = officialImagesFor(product, systemCover);
  const personal = entry?.personalPhotos ?? [];
  const cover = displayImageFor(product, entry, systemCover);
  const personalCoverIdx = entry?.personalCoverIndex ?? 0;
  const usingMyCover = !!(entry?.usePersonalPhoto && personal.length > 0);

  const showImages =
    personal.length > 0 && entry?.usePersonalPhoto
      ? [...personal, ...officialGallery]
      : [...officialGallery, ...personal];
  const activeImage = showImages[galleryIndex] ?? cover;

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setBusy(true);
    try {
      const data = await compressImage(file);
      onAddPhoto(data);
      toast.success("Your photo added");
    } catch {
      toast.error("Could not process image");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onAdminFile(files: FileList | null) {
    const file = files?.[0];
    if (!file || !onSetSystemCover) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setAdminBusy(true);
    try {
      const data = await compressImage(file);
      await onSetSystemCover(data);
      toast.success("System cover updated for all users");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not set system cover");
    } finally {
      setAdminBusy(false);
      if (adminFileRef.current) adminFileRef.current.value = "";
    }
  }

  async function setSystemFromActive() {
    if (!onSetSystemCover || !activeImage) return;
    setAdminBusy(true);
    try {
      await onSetSystemCover(activeImage);
      toast.success("System cover set for all users");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not set system cover");
    } finally {
      setAdminBusy(false);
    }
  }

  function handleRemovePhoto(index: number) {
    const src = personal[index];
    onRemovePhoto(index);
    toast.success("Photo deleted");
    if (src && showImages[galleryIndex] === src) {
      setGalleryIndex(0);
      setLightboxOpen(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          onOpenChange(o);
          if (!o) {
            setGalleryIndex(0);
            setLightboxOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
          <div className="flex max-h-[min(94dvh,980px)] flex-col overflow-y-auto">
            <div className="relative border-b border-border bg-surface-2">
              {/* Square pack shots (~2200px) shown large for clarity */}
              <div className="mx-auto flex h-[min(68dvh,760px)] w-full max-w-[760px] items-center justify-center">
                <ProductImage
                  src={activeImage}
                  alt={product.name}
                  priority
                  sizes="(max-width: 768px) 100vw, 760px"
                  className="h-full w-full bg-transparent"
                  imgClassName="p-2 sm:p-3"
                  onClick={() => setLightboxOpen(true)}
                />
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-border bg-bg/85 px-3 py-1.5 text-xs font-medium text-fg backdrop-blur-sm hover:bg-surface-2"
              >
                <ZoomIn className="h-3.5 w-3.5" />
                View full size
              </button>
              {showImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto px-3 pb-3 pt-1">
                  {showImages.map((src, i) => (
                    <button
                      key={`${src.slice(0, 40)}-${i}`}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      className={`gallery-thumb h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border bg-surface transition-opacity sm:h-[4.5rem] sm:w-[4.5rem] ${
                        i === galleryIndex
                          ? "border-primary ring-1 ring-primary"
                          : "border-border/80 opacity-85 hover:opacity-100"
                      }`}
                    >
                      <ProductImage
                        src={src}
                        alt=""
                        sizes="72px"
                        className="h-full w-full"
                        imgClassName="p-0.5"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col p-5 sm:p-6">
              <DialogHeader className="mb-3">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge>{categoryLabel(product.category)}</Badge>
                  <Badge variant="secondary">{product.line}</Badge>
                  {product.scale && (
                    <Badge variant="outline">{product.scale}</Badge>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 pr-6">
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-xl sm:text-2xl flex items-start gap-2">
                      <span className="min-w-0">{product.name}</span>
                      {entry?.owned && (
                        <span
                          className="mt-1 inline-flex shrink-0 items-center gap-1.5"
                          title={OWNERSHIP.titleYes}
                          aria-label={OWNERSHIP.ariaYes}
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-fg">
                            <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
                          </span>
                          <span className="owned-badge inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold tracking-tight text-primary-fg">
                            {OWNERSHIP.status}
                          </span>
                        </span>
                      )}
                      {entry?.wishlist && !entry?.owned && (
                        <span
                          className="mt-1 inline-flex shrink-0 items-center gap-1.5"
                          title="On wishlist"
                          aria-label="On wishlist"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wishlist text-wishlist-fg">
                            <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
                          </span>
                          <span className="wishlist-badge inline-flex items-center rounded-full bg-wishlist px-2.5 py-0.5 text-[11px] font-semibold tracking-tight text-wishlist-fg">
                            Wishlist
                          </span>
                        </span>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted mt-1">
                      {product.character}
                      {product.releaseYear ? ` · ${product.releaseYear}` : ""}
                      {product.sku ? ` · SKU ${product.sku}` : ""}
                    </DialogDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    disabled={busy}
                    className="shrink-0 w-full sm:w-auto self-stretch sm:self-start"
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    {busy ? "Processing…" : "Add my photo"}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files)}
                  />
                </div>
              </DialogHeader>

              {product.description && (
                <p className="text-sm text-muted leading-relaxed mb-4">
                  {product.description}
                </p>
              )}

              <div className="mb-4 rounded-[var(--radius-lg)] border border-border bg-surface-2/60 p-3.5">
                <h4 className="text-[11px] font-medium uppercase tracking-wide text-subtle mb-2">
                  Package contents & accessories
                </h4>
                {accessories.length > 0 ? (
                  <ul className="space-y-1.5">
                    {accessories.map((a, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-fg leading-snug"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">
                    Accessory list not listed on the product page. Check the
                    official McFarlane listing for packaging details.
                  </p>
                )}
              </div>

              {product.features.length > 0 && (
                <details className="mb-4 group">
                  <summary className="cursor-pointer text-xs font-medium text-muted hover:text-fg">
                    Full product features ({product.features.length})
                  </summary>
                  <ul className="mt-2 space-y-1 pl-1">
                    {product.features.map((f, i) => (
                      <li key={i} className="text-xs text-subtle leading-snug">
                        {f}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  size="sm"
                  variant={entry?.owned ? "secondary" : "default"}
                  onClick={() => onMarkOwned(!entry?.owned)}
                >
                  <Check className="h-4 w-4" />
                  {entry?.owned ? OWNERSHIP.status : OWNERSHIP.add}
                </Button>
                <Button size="sm" variant="outline" onClick={onToggleWishlist}>
                  <Heart
                    className={`h-4 w-4 ${entry?.wishlist ? "fill-current text-primary" : ""}`}
                  />
                  {entry?.wishlist ? "On wishlist" : "Wishlist"}
                </Button>
                {product.productUrl && (
                  <Button size="sm" variant="ghost" asChild>
                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      McFarlane
                    </a>
                  </Button>
                )}
              </div>

              {/* Cover status */}
              <div className="mb-4 rounded-[var(--radius-md)] border border-border bg-surface-2/40 p-3 space-y-2">
                <h4 className="text-[11px] font-medium uppercase tracking-wide text-subtle">
                  Listing photo
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {usingMyCover ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 font-medium text-primary">
                      <Star className="h-3 w-3 fill-current" />
                      Your cover (only you see this)
                    </span>
                  ) : systemCover ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 font-medium text-muted">
                      <Shield className="h-3 w-3" />
                      Vault default cover
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 font-medium text-muted">
                      Official pack shot
                    </span>
                  )}
                  {usingMyCover && onClearPersonalCover && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        onClearPersonalCover();
                        toast.message("Using vault default photo again");
                      }}
                    >
                      Use vault default instead
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-subtle leading-relaxed">
                  Your personal cover only changes what you see. Other collectors
                  still get the vault default (or official pack shot).
                </p>
              </div>

              {personal.length > 0 && (
                <div className="mb-4 rounded-[var(--radius-md)] border border-border bg-surface-2/40 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <h4 className="text-[11px] font-medium uppercase tracking-wide text-subtle">
                      Your photos ({personal.length})
                    </h4>
                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={!!entry?.usePersonalPhoto}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onUpdate({
                              usePersonalPhoto: true,
                              personalCoverIndex: personalCoverIdx,
                            });
                          } else if (onClearPersonalCover) {
                            onClearPersonalCover();
                          } else {
                            onUpdate({ usePersonalPhoto: false });
                          }
                        }}
                        className="rounded border-border"
                      />
                      Prefer my photos as cover
                    </label>
                  </div>
                  <div className="flex gap-2.5 flex-wrap">
                    {personal.map((src, i) => {
                      const isMyCover =
                        !!entry?.usePersonalPhoto && personalCoverIdx === i;
                      return (
                        <div
                          key={`personal-${i}`}
                          className="relative gallery-thumb"
                        >
                          <button
                            type="button"
                            className={`block overflow-hidden rounded border bg-bg ${
                              isMyCover
                                ? "border-primary ring-2 ring-primary"
                                : "border-border"
                            }`}
                            onClick={() => {
                              const idx = showImages.indexOf(src);
                              setGalleryIndex(idx >= 0 ? idx : 0);
                              setLightboxOpen(true);
                            }}
                            aria-label={`View your photo ${i + 1}`}
                          >
                            <ProductImage
                              src={src}
                              alt=""
                              sizes="96px"
                              className="h-20 w-20"
                              imgClassName="p-0.5 object-contain"
                            />
                          </button>
                          {isMyCover && (
                            <span className="absolute left-1 bottom-1 z-[1] rounded bg-primary px-1 py-0.5 text-[9px] font-semibold text-primary-fg">
                              My cover
                            </span>
                          )}
                          <div className="absolute -right-1.5 -top-1.5 z-[2] flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(i);
                              }}
                              className="flex h-7 min-w-7 items-center justify-center rounded-full bg-danger px-1.5 text-primary-fg shadow-md ring-2 ring-bg hover:brightness-110 active:scale-95 transition"
                              aria-label={`Delete photo ${i + 1}`}
                              title="Delete photo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetPersonalCover?.(i);
                              toast.success("Set as your cover photo");
                            }}
                            className="mt-1 w-full rounded border border-border bg-surface px-1.5 py-1 text-[10px] font-medium text-fg hover:border-primary hover:text-primary"
                          >
                            {isMyCover ? "Your cover" : "Use as my cover"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-subtle">
                    “Use as my cover” only affects your account. Delete with the
                    red trash button.
                  </p>
                </div>
              )}

              {isAdmin && (
                <div className="mb-4 rounded-[var(--radius-md)] border border-primary/30 bg-primary/[0.06] p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <h4 className="text-[11px] font-medium uppercase tracking-wide text-primary">
                      Admin · vault default photo
                    </h4>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Set the main photo every user sees for this listing (unless
                    they choose their own cover). This is a system setting — not
                    tied to your personal vault.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={adminBusy || !activeImage}
                      onClick={() => void setSystemFromActive()}
                    >
                      <Star className="h-3.5 w-3.5" />
                      {adminBusy ? "Saving…" : "Set current photo as vault default"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={adminBusy}
                      onClick={() => adminFileRef.current?.click()}
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      Upload vault default
                    </Button>
                    {systemCover && onClearSystemCover && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={adminBusy}
                        onClick={() => {
                          void (async () => {
                            setAdminBusy(true);
                            try {
                              await onClearSystemCover();
                              toast.message("Vault default cleared — using pack shot");
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : "Could not clear system cover",
                              );
                            } finally {
                              setAdminBusy(false);
                            }
                          })();
                        }}
                      >
                        Clear vault default
                      </Button>
                    )}
                    <input
                      ref={adminFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void onAdminFile(e.target.files)}
                    />
                  </div>
                </div>
              )}

              {entry?.owned && (
                <div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-4">
                  <div className="grid gap-1.5">
                    <Label>Condition</Label>
                    <Select
                      value={entry.condition ?? "none"}
                      onValueChange={(v) =>
                        onUpdate({
                          condition:
                            v === "none" ? null : (v as FigureCondition),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not set</SelectItem>
                        {CONDITIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Purchase date</Label>
                    <Input
                      type="date"
                      value={entry.purchaseDate ?? ""}
                      onChange={(e) =>
                        onUpdate({ purchaseDate: e.target.value || null })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Paid ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={entry.purchasePrice ?? ""}
                      onChange={(e) =>
                        onUpdate({
                          purchasePrice: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Est. value ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={entry.estimatedValue ?? ""}
                      onChange={(e) =>
                        onUpdate({
                          estimatedValue: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label>Personal notes</Label>
                    <Textarea
                      value={entry.notes}
                      onChange={(e) => onUpdate({ notes: e.target.value })}
                      placeholder="Shelf location, box condition, trade notes…"
                      rows={2}
                    />
                  </div>
                  {(entry.purchasePrice != null ||
                    entry.estimatedValue != null ||
                    entry.purchaseDate) && (
                    <p className="sm:col-span-2 text-xs text-subtle">
                      Paid {formatCurrency(entry.purchasePrice)}
                      {entry.purchaseDate
                        ? ` on ${formatDate(entry.purchaseDate)}`
                        : ""}
                      {entry.estimatedValue != null
                        ? ` · Est. ${formatCurrency(entry.estimatedValue)}`
                        : ""}
                    </p>
                  )}
                </div>
              )}

              {entry?.owned && (
                <div className="mt-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    onClick={() => {
                      onMarkOwned(false);
                      toast.message(OWNERSHIP.toastRemoved);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {OWNERSHIP.remove}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImageLightbox
        src={activeImage}
        alt={product.name}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
