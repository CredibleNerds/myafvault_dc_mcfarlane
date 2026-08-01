import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Loader2, Share2 } from "lucide-react";
import {
  fetchPublicWishlist,
  type PublicWishlist,
} from "@/lib/wishlist-share";
import { ProductImage } from "@/components/figures/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/product";
import { figurePlaceholder } from "@/lib/image";
import type { ProductCategory } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/share/wishlist/$token")({
  component: PublicWishlistPage,
  head: ({ params }) => ({
    meta: [
      { title: "Shared Wishlist · MyAFVault" },
      {
        name: "description",
        content: "A collector wishlist shared from MyAFVault.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function PublicWishlistPage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<PublicWishlist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPublicWishlist({ data: { token } })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(
            err instanceof Error
              ? err.message
              : "This wishlist link is unavailable.",
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

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="font-semibold tracking-tight text-fg">
            MyAFVault
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
            <Loader2 className="h-8 w-8 animate-spin text-wishlist" />
            <p className="text-sm">Loading shared wishlist…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-md rounded-[var(--radius-xl)] border border-border bg-surface px-6 py-12 text-center">
            <Share2 className="mx-auto mb-3 h-8 w-8 text-subtle" />
            <h1 className="text-lg font-semibold text-fg">Link unavailable</h1>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <Button className="mt-6" asChild>
              <Link to="/">Back to MyAFVault</Link>
            </Button>
          </div>
        )}

        {!loading && data && (
          <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-wishlist/40 bg-wishlist/10 px-3 py-1 text-xs font-semibold text-wishlist">
                  <Heart className="h-3.5 w-3.5 fill-current" />
                  Shared wishlist
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                  {data.title}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {data.itemCount.toLocaleString()} figure
                  {data.itemCount === 1 ? "" : "s"}
                  {data.updatedAt
                    ? ` · updated ${new Date(data.updatedAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <Button variant="secondary" asChild>
                <Link to="/login">Start your own vault</Link>
              </Button>
            </div>

            {data.items.length === 0 ? (
              <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface px-4 py-12 text-center text-sm text-muted">
                This wishlist is empty.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {data.items.map((item) => (
                  <li
                    key={item.id}
                    className="overflow-hidden rounded-[var(--radius-xl)] border border-wishlist/35 bg-surface shadow-[0_0_0_1px_rgba(43,111,255,0.08)]"
                  >
                    <div className="relative aspect-square bg-surface-2">
                      <ProductImage
                        src={
                          item.imageUrl ||
                          figurePlaceholder(item.name)
                        }
                        alt={item.name}
                        className="absolute inset-0 h-full w-full"
                        imgClassName="p-1.5"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                      <div className="absolute left-2 top-2">
                        <Badge
                          variant="secondary"
                          className="bg-bg/85 text-[10px] backdrop-blur-sm"
                        >
                          {categoryLabel(item.category as ProductCategory)}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 p-3">
                      <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-fg">
                        {item.name}
                      </h2>
                      <p className="truncate text-xs text-muted">
                        {item.character}
                        {item.line ? ` · ${item.line}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
