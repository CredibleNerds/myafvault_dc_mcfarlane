import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, Loader2, Share2 } from "lucide-react";
import {
  fetchPublicShare,
  type SharedCollectionPayload,
} from "@/lib/public-share";
import { ProductImage } from "@/components/figures/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/product";
import { figurePlaceholder } from "@/lib/image";
import type { ProductCategory } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/share/collection/$token")({
  component: PublicCollectionSharePage,
  head: () => ({
    meta: [
      { title: "Shared collection · MyAFVault" },
      {
        name: "description",
        content: "A display collection shared from MyAFVault.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function PublicCollectionSharePage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<SharedCollectionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicShare({ data: { token, kind: "collection" } })
      .then((res) => {
        if (cancelled) return;
        setData(res.payload as SharedCollectionPayload);
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

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-md">
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
          <div className="flex flex-col items-center gap-3 py-24 text-muted">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading shared collection…</p>
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

        {!loading && data && (
          <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Shared collection
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {data.name}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {data.theme ? (
                    <Badge variant="secondary" className="mr-2">
                      {data.theme}
                    </Badge>
                  ) : null}
                  {data.description || "Group display from MyAFVault"}
                </p>
              </div>
              <Button variant="secondary" asChild>
                <Link to="/login">Start your own vault</Link>
              </Button>
            </div>

            {data.photos?.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-subtle">
                  Group photos
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.photos.map((src, i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-2"
                    >
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.figures?.length > 0 && (
              <section>
                <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-subtle">
                  Linked figures ({data.figures.length})
                </h2>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {data.figures.map((item) => (
                    <li
                      key={item.id}
                      className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface"
                    >
                      <div className="relative aspect-square bg-surface-2">
                        <ProductImage
                          src={
                            item.imageUrl || figurePlaceholder(item.name)
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
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                          {item.name}
                        </h3>
                        <p className="truncate text-xs text-muted">
                          {item.character}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!data.photos?.length && !data.figures?.length && (
              <p className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-12 text-center text-sm text-muted">
                This collection share has no photos or figures yet.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
