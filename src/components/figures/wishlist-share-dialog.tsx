import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Loader2, RefreshCw, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCatalogue } from "@/lib/store";
import { resolveProduct } from "@/lib/product";
import {
  getMyWishlistShare,
  publishWishlistShare,
  revokeWishlistShare,
  type MyWishlistShare,
} from "@/lib/wishlist-share";

type WishlistShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function absoluteShareUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

export function WishlistShareDialog({
  open,
  onOpenChange,
}: WishlistShareDialogProps) {
  const entries = useCatalogue((s) => s.entries);
  const [share, setShare] = useState<MyWishlistShare>(null);
  const [title, setTitle] = useState("My Wishlist");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const wishlistIds = useMemo(
    () =>
      Object.values(entries)
        .filter((e) => e.wishlist)
        .map((e) => e.productId),
    [entries],
  );

  const customs = useMemo(() => {
    const map: Record<
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
    for (const id of wishlistIds) {
      const entry = entries[id];
      if (!entry?.isCustom) continue;
      const product = resolveProduct(id, entry);
      if (!product) continue;
      map[id] = {
        name: product.name,
        character: product.character,
        imageUrl: product.imageUrl,
        category: product.category,
        line: product.line,
        scale: product.scale,
      };
    }
    return map;
  }, [entries, wishlistIds]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getMyWishlistShare()
      .then((res) => {
        if (cancelled) return;
        setShare(res);
        if (res?.title) setTitle(res.title);
      })
      .catch(() => {
        if (!cancelled) setShare(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const shareUrl = share ? absoluteShareUrl(share.path) : "";

  async function handlePublish() {
    if (wishlistIds.length === 0) {
      toast.error("Add figures to your wishlist first");
      return;
    }
    setBusy(true);
    try {
      const next = await publishWishlistShare({
        data: {
          productIds: wishlistIds,
          customs,
          title: title.trim() || "My Wishlist",
        },
      });
      if (!next) {
        throw new Error("Could not create share link");
      }
      setShare(next);
      const url = absoluteShareUrl(next.path);
      const ok = await copyText(url);
      setCopied(ok);
      toast.success(
        ok
          ? "Wishlist link copied — share it with anyone"
          : "Wishlist link ready",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not create share link",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    const ok = await copyText(shareUrl);
    setCopied(ok);
    if (ok) toast.success("Link copied");
    else toast.error("Could not copy link");
  }

  async function handleRevoke() {
    setBusy(true);
    try {
      await revokeWishlistShare();
      setShare(null);
      setCopied(false);
      toast.message("Wishlist link revoked");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not revoke link",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-wishlist" />
            Share wishlist
          </DialogTitle>
          <DialogDescription>
            Create a public link with your wishlist figures only — no notes,
            prices, or personal photos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="rounded-[var(--radius-md)] border border-wishlist/30 bg-wishlist/10 px-3 py-2.5 text-sm text-fg">
            <span className="font-semibold text-wishlist tabular-nums">
              {wishlistIds.length}
            </span>{" "}
            figure{wishlistIds.length === 1 ? "" : "s"} currently on your
            wishlist
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wishlist-share-title">Link title</Label>
            <Input
              id="wishlist-share-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="My Wishlist"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking existing link…
            </div>
          ) : share ? (
            <div className="space-y-2">
              <Label>Your share link</Label>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={handleCopy}
                  aria-label="Copy link"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-wishlist" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted">
                {share.itemCount} item{share.itemCount === 1 ? "" : "s"} on the
                public page
                {share.updatedAt
                  ? ` · last updated ${new Date(share.updatedAt).toLocaleString()}`
                  : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">
              No active share link yet. Create one to copy a URL friends can
              open without signing in.
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              className="bg-wishlist text-wishlist-fg hover:bg-wishlist-hover"
              disabled={busy || wishlistIds.length === 0}
              onClick={handlePublish}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : share ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {share ? "Update & copy link" : "Create & copy link"}
            </Button>
            {share && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={handleRevoke}
              >
                <Trash2 className="h-4 w-4" />
                Revoke link
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
