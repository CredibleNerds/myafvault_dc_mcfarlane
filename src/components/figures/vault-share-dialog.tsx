import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Link2,
  Loader2,
  RefreshCw,
  Share2,
  Trash2,
} from "lucide-react";
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
import { OWNERSHIP } from "@/lib/ownership-copy";
import {
  getMyVaultShare,
  publishVaultShare,
  revokeVaultShare,
  type MyVaultShare,
} from "@/lib/vault-share";
import { absoluteShareUrl, copyText } from "@/lib/share-utils";

type VaultShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VaultShareDialog({
  open,
  onOpenChange,
}: VaultShareDialogProps) {
  const entries = useCatalogue((s) => s.entries);
  const [share, setShare] = useState<MyVaultShare>(null);
  const [title, setTitle] = useState("My Vault");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const ownedIds = useMemo(
    () =>
      Object.values(entries)
        .filter((e) => e.owned)
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
    for (const id of ownedIds) {
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
  }, [entries, ownedIds]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getMyVaultShare()
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
    if (ownedIds.length === 0) {
      toast.error(`Mark figures ${OWNERSHIP.status} first`);
      return;
    }
    setBusy(true);
    try {
      const next = await publishVaultShare({
        data: {
          productIds: ownedIds,
          customs,
          title: title.trim() || "My Vault",
        },
      });
      if (!next) throw new Error("Could not create share link");
      setShare(next);
      const url = absoluteShareUrl(next.path);
      const ok = await copyText(url);
      setCopied(ok);
      toast.success(
        ok
          ? "Vault link copied — share it with anyone"
          : "Vault link ready",
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
      await revokeVaultShare();
      setShare(null);
      setCopied(false);
      toast.message("Vault link revoked");
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
            <Share2 className="h-5 w-5 text-primary" />
            Share My Vault
          </DialogTitle>
          <DialogDescription>
            Create a public link of figures marked {OWNERSHIP.status} — no
            notes, prices, or personal photos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="rounded-[var(--radius-md)] border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-fg">
            <span className="font-semibold text-primary tabular-nums">
              {ownedIds.length}
            </span>{" "}
            figure{ownedIds.length === 1 ? "" : "s"} currently{" "}
            {OWNERSHIP.status}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vault-share-title">Link title</Label>
            <Input
              id="vault-share-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="My Vault"
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
                    <Check className="h-4 w-4 text-primary" />
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
              No active vault link yet. Create one to copy a URL friends can
              open without signing in.
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              disabled={busy || ownedIds.length === 0}
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
