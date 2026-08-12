import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPublicShare,
  type SharedItemPayload,
} from "@/lib/public-share";
import { ProductImage } from "@/components/figures/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/product";
import { figurePlaceholder } from "@/lib/image";
import type { ProductCategory } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { hydrateCatalogue, useCatalogue } from "@/lib/store";

import { listingFromSharedItem } from "@/lib/import-shared-listing";
import { PRIMARY_VAULT_PATH } from "@/lib/franchises";

export const Route = createFileRoute("/share/item/$token")({
  component: PublicItemSharePage,
  head: () => ({
    meta: [
      { title: "Shared figure · MyAFVault" },
      { name: "description", content: "A figure shared from MyAFVault." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function PublicItemSharePage() {
  const { token } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const signedIn = !isPending && !!user && !user.isDevFallback;
  const addCustom = useCatalogue((s) => s.addCustomEntry);
  const [item, setItem] = useState<SharedItemPayload | null>(null);
  const [title, setTitle] = useState("Shared figure");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicShare({ data: { token, kind: "item" } })
      .then((res) => {
        if (cancelled) return;
        setTitle(res.title);
        setItem(res.payload as SharedItemPayload);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "This share link is unavailable.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function addToMyVault() {
    if (!item) return;
    setImporting(true);
    try {
      await hydrateCatalogue(user?.id ?? null);

      const entry = listingFromSharedItem(item);
      addCustom(entry);
      setImported(true);
      toast.success("Added to your vault — only you can see this copy");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not add listing",
      );
    } finally {
      setImporting(false);
    }
  }

  const canImport = !!item?.isCustom;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="font-semibold tracking-tight text-fg">
            MyAFVault
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {signedIn ? (
              <Button size="sm" variant="outline" asChild>
                <Link to={PRIMARY_VAULT_PATH}>Open vault</Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-24 text-muted">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading shared figure…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-md rounded-[var(--radius-xl)] border border-border bg-surface px-6 py-12 text-center">
            <Share2 className="mx-auto mb-3 h-8 w-8 text-subtle" />
            <h1 className="text-lg font-semibold">Link unavailable</h1>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <Button className="mt-6" asChild>
              <Link to="/">Back to MyAFVault</Link>
            </Button>
          </div>
        )}

        {!loading && item && (
          <article className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface">
            <div className="grid gap-0 sm:grid-cols-[minmax(0,280px)_1fr]">
              <div className="relative aspect-square bg-surface-2 sm:aspect-auto sm:min-h-[320px]">
                <ProductImage
                  src={item.imageUrl || figurePlaceholder(item.name)}
                  alt={item.name}
                  className="absolute inset-0 h-full w-full"
                  imgClassName="p-3"
                  sizes="(max-width: 640px) 100vw, 320px"
                />
              </div>
              <div className="flex flex-col gap-3 p-5 sm:p-6">
                <div className="flex flex-wrap gap-2">
                  <Badge>
                    {categoryLabel(item.category as ProductCategory)}
                  </Badge>
                  {item.line ? (
                    <Badge variant="secondary">{item.line}</Badge>
                  ) : null}
                  {item.scale ? (
                    <Badge variant="outline">{item.scale}</Badge>
                  ) : null}
                  {item.isCustom ? (
                    <Badge variant="outline">Shared listing</Badge>
                  ) : null}
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-fg">
                  {title || item.name}
                </h1>
                <p className="text-sm text-muted">{item.character}</p>
                {item.description ? (
                  <p className="text-sm leading-relaxed text-fg/90">
                    {item.description}
                  </p>
                ) : null}
                {item.accessories && item.accessories.length > 0 ? (
                  <div>
                    <h2 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-subtle">
                      Accessories
                    </h2>
                    <ul className="space-y-1">
                      {item.accessories.map((a, i) => (
                        <li key={i} className="text-sm text-muted">
                          · {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  {canImport && signedIn && !imported && (
                    <Button
                      size="sm"
                      disabled={importing}
                      onClick={() => void addToMyVault()}
                    >
                      {importing ? "Adding…" : "Add to my vault"}
                    </Button>
                  )}
                  {canImport && signedIn && imported && (
                    <Button size="sm" asChild>
                      <Link to={PRIMARY_VAULT_PATH}>Open in my vault</Link>
                    </Button>
                  )}
                  {canImport && !signedIn && (
                    <Button size="sm" asChild>
                      <Link to="/login">Sign in to add this listing</Link>
                    </Button>
                  )}
                  {item.productUrl ? (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        McFarlane page
                      </a>
                    </Button>
                  ) : null}
                  {!canImport && (
                    <Button size="sm" asChild>
                      <Link to="/login">Start your vault</Link>
                    </Button>
                  )}
                </div>
                {canImport && (
                  <p className="text-xs text-subtle">
                    Adding creates a private copy in your account. It does not
                    change the original listing.
                  </p>
                )}
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
