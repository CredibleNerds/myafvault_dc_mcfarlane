import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, Loader2, PackageOpen } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { authEnabled } from "@/lib/auth/client";
import { getAccessStatus } from "@/lib/billing";


import { toast } from "sonner";
import {
  hydrateCatalogue,
  selectCollectionStats,
  useCatalogue,
} from "@/lib/store";
import type { UserEntry } from "@/lib/types";
import { CATALOG, catalogStats } from "@/data/catalog";


import { resolveProduct, releaseSortValue } from "@/lib/product";

import { StatsBar } from "@/components/figures/stats-bar";
import { Toolbar } from "@/components/figures/toolbar";
import { FigureCard, FigureListRow } from "@/components/figures/figure-card";
import { FigureDetail } from "@/components/figures/figure-detail";
import { FigureForm } from "@/components/figures/figure-form";
import { AuthSyncBar } from "@/components/figures/auth-sync-bar";
import { BulkActionBar } from "@/components/figures/bulk-action-bar";
import { CollectionsPanel } from "@/components/figures/collections-panel";
import { WishlistShareDialog } from "@/components/figures/wishlist-share-dialog";
import { VaultShareDialog } from "@/components/figures/vault-share-dialog";
import { Button } from "@/components/ui/button";
import { OWNERSHIP } from "@/lib/ownership-copy";
import { useSystemImages } from "@/lib/system-image-store";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
  fetchSystemImages,
  getAdminStatus,
  setSystemProductImage,
  clearSystemProductImage,
} from "@/lib/system-images";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/vault/dc-mcfarlane")({
  component: CataloguePage,
});

const PAGE_SIZE = 48;

/** Lower index = earlier in master catalog (newest waves are listed first). */
const CATALOG_INDEX: Record<string, number> = Object.fromEntries(
  CATALOG.map((p, i) => [p.id, i]),
);


/** Always appear last within a category filter (stable pin). */
const PIN_BOTTOM_BY_CATEGORY: Record<string, Set<string>> = {
  vehicle: new Set(["mcf-lobo-s-spacehog-supergirl-movie"]),
  megafig: new Set(["mcf-kaiju-superman-movie-mega-figure"]),
};


function CataloguePage() {
  const { user, isPending: authPending } = useCurrentUserState();
  const signedIn = !!user && !user.isDevFallback;
  const [ready, setReady] = useState(false);
  const [accessPending, setAccessPending] = useState(true);
  const [hasPaidAccess, setHasPaidAccess] = useState(false);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [vaultShareOpen, setVaultShareOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const importRef = useRef<HTMLInputElement>(null);

  const entries = useCatalogue((s) => s.entries);
  const search = useCatalogue((s) => s.search);
  const categoryFilter = useCatalogue((s) => s.categoryFilter);
  const lineFilter = useCatalogue((s) => s.lineFilter);
  const scopeFilter = useCatalogue((s) => s.scopeFilter);
  const sort = useCatalogue((s) => s.sort);
  const view = useCatalogue((s) => s.view);
  const section = useCatalogue((s) => s.section);

  const setSearch = useCatalogue((s) => s.setSearch);
  const setCategoryFilter = useCatalogue((s) => s.setCategoryFilter);
  const setLineFilter = useCatalogue((s) => s.setLineFilter);
  const setScopeFilter = useCatalogue((s) => s.setScopeFilter);
  const setSort = useCatalogue((s) => s.setSort);
  const setView = useCatalogue((s) => s.setView);
  const setSection = useCatalogue((s) => s.setSection);
  const markOwned = useCatalogue((s) => s.markOwned);
  const toggleWishlist = useCatalogue((s) => s.toggleWishlist);
  const bulkMarkOwned = useCatalogue((s) => s.bulkMarkOwned);
  const bulkSetWishlist = useCatalogue((s) => s.bulkSetWishlist);
  const updateEntry = useCatalogue((s) => s.updateEntry);
  const addPersonalPhoto = useCatalogue((s) => s.addPersonalPhoto);
  const removePersonalPhoto = useCatalogue((s) => s.removePersonalPhoto);
  const setPersonalCover = useCatalogue((s) => s.setPersonalCover);
  const clearPersonalCover = useCatalogue((s) => s.clearPersonalCover);
  const addCustomEntry = useCatalogue((s) => s.addCustomEntry);
  const removeEntry = useCatalogue((s) => s.removeEntry);

  const systemOverrides = useSystemImages((s) => s.overrides);
  const setSystemAll = useSystemImages((s) => s.setAll);
  const setSystemOne = useSystemImages((s) => s.setOne);
  const clearSystemOne = useSystemImages((s) => s.clearOne);
  const [isAdmin, setIsAdmin] = useState(false);
  const importEntries = useCatalogue((s) => s.importEntries);

  useEffect(() => {
    let cancelled = false;
    void hydrateCatalogue().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authEnabled) {
      setHasPaidAccess(true);
      setAccessPending(false);
      return;
    }
    if (authPending) return;
    if (!signedIn) {
      setAccessPending(false);
      setHasPaidAccess(false);
      return;
    }
    let cancelled = false;
    setAccessPending(true);
    void getAccessStatus()
      .then((s) => {
        if (!cancelled) setHasPaidAccess(s.paid);
      })
      .catch(() => {
        if (!cancelled) setHasPaidAccess(false);
      })
      .finally(() => {
        if (!cancelled) setAccessPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authPending, signedIn]);

  // Load shared admin system covers (once signed in / vault ready)
  useEffect(() => {
    if (!ready) return;
    if (authEnabled && !signedIn) return;
    let cancelled = false;
    void fetchSystemImages()
      .then((map) => {
        if (!cancelled) setSystemAll(map);
      })
      .catch(() => {
        /* non-fatal — catalogue still works with pack shots */
      });
    void getAdminStatus()
      .then((s) => {
        if (!cancelled) setIsAdmin(!!s.isAdmin);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, signedIn, setSystemAll]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, categoryFilter, lineFilter, scopeFilter, sort]);

  // Drop selection for figures no longer in the filtered set (optional cleanup)
  useEffect(() => {
    if (!selectMode) return;
    // keep selection across filter changes — user may intentionally select across filters
  }, [selectMode]);

  const masterStats = useMemo(() => catalogStats(), []);
  const collectionStats = useMemo(
    () => selectCollectionStats(entries),
    [entries],
  );

  const allProducts = useMemo(() => {
    const customs = Object.values(entries)
      .filter((e) => e.isCustom)
      .map((e) => resolveProduct(e.productId, e))
      .filter(Boolean);
    return [...CATALOG, ...customs] as NonNullable<
      ReturnType<typeof resolveProduct>
    >[];
  }, [entries]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allProducts.length,
      "7-inch": 0,
      megafig: 0,
      statue: 0,
      multipack: 0,
      vehicle: 0,
    };
    for (const p of allProducts) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, [allProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allProducts.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter)
        return false;
      if (lineFilter !== "all" && p.line !== lineFilter) return false;

      const entry = entries[p.id];
      if (scopeFilter === "owned" && !entry?.owned) return false;
      if (scopeFilter === "wishlist" && !entry?.wishlist) return false;
      if (scopeFilter === "unowned" && entry?.owned) return false;
      if (scopeFilter === "custom" && !entry?.isCustom) return false;


      if (!q) return true;
      const hay = [
        p.name,
        p.character,
        p.line,
        p.sku,
        p.description,
        p.scale,
        ...p.accessories,
        ...p.features,
        entry?.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    const ownedOf = (id: string) => (entries[id]?.owned ? 1 : 0);

    list = [...list].sort((a, b) => {
      // Category pins: keep selected items at the bottom regardless of sort
      const pinSet = PIN_BOTTOM_BY_CATEGORY[categoryFilter];
      if (pinSet) {
        const aPin = pinSet.has(a.id) ? 1 : 0;
        const bPin = pinSet.has(b.id) ? 1 : 0;
        if (aPin !== bPin) return aPin - bPin;
      }
      switch (sort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "year-asc": {
          const ay = releaseSortValue(a, false);
          const by = releaseSortValue(b, false);
          if (ay !== by) return ay - by;
          return (
            (CATALOG_INDEX[b.id] ?? 99999) - (CATALOG_INDEX[a.id] ?? 99999) ||
            a.name.localeCompare(b.name)
          );
        }
        case "year-desc": {
          const ay = releaseSortValue(a, true);
          const by = releaseSortValue(b, true);
          if (ay !== by) return by - ay;
          return (
            (CATALOG_INDEX[a.id] ?? 99999) - (CATALOG_INDEX[b.id] ?? 99999) ||
            a.name.localeCompare(b.name)
          );
        }
        case "character-asc":
          return a.character.localeCompare(b.character);
        case "owned-first":
          return ownedOf(b.id) - ownedOf(a.id) || a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    return list;
  }, [
    allProducts,
    entries,
    search,
    categoryFilter,
    lineFilter,
    scopeFilter,
    sort,
  ]);

  const visible = filtered.slice(0, visibleCount);
  const selectedProduct = selectedId
    ? resolveProduct(selectedId, entries[selectedId])
    : null;
  const selectedEntry = selectedId ? (entries[selectedId] ?? null) : null;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function handleExport() {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      entries,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dc-mcfarlane-collection-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Collection exported");
  }

  function handleImportFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          entries?: Record<string, UserEntry>;
        };
        if (!parsed.entries || typeof parsed.entries !== "object") {
          toast.error("Invalid collection file");
          return;
        }
        importEntries(parsed.entries);
        toast.success("Collection imported — will sync if signed in");
      } catch {
        toast.error("Invalid collection file");
      }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = "";
  }

  const selectedList = useMemo(() => [...selectedIds], [selectedIds]);

  // Vault requires an account — no free browse
  if (authEnabled && (authPending || (signedIn && accessPending))) {
    return (
      <div className="min-h-dvh grid place-items-center bg-bg text-muted">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Checking access…
        </div>
      </div>
    );
  }
  if (authEnabled && !signedIn) {
    return (
      <div className="min-h-dvh grid place-items-center bg-bg p-6">
        <div className="max-w-sm text-center space-y-3">
          <p className="text-sm text-muted">Vault access requires an account.</p>
          <a
            href="/login?mode=signup&next=/pay"
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-sm font-medium text-primary-fg"
          >
            Sign up for access
          </a>
        </div>
      </div>
    );
  }
  if (authEnabled && signedIn && !hasPaidAccess) {
    if (typeof window !== "undefined") {
      window.location.replace("/pay");
    }
    return (
      <div className="min-h-dvh grid place-items-center bg-bg text-muted">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Redirecting to checkout…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
          <div className="min-w-0 flex items-start justify-between gap-3 sm:block">
            <div className="min-w-0">
              <Link
                to="/"
                className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary hover:underline sm:text-[11px]"
              >
                <span className="sm:hidden">MyAFVault</span>
                <span className="hidden sm:inline">MyAFVault · DC McFarlane</span>
              </Link>
              <h1 className="text-base font-semibold tracking-tight sm:text-xl">
                <span className="sm:hidden">DC McFarlane</span>
                <span className="hidden sm:inline">Figure Catalogue</span>
              </h1>
            </div>
          </div>
          <AuthSyncBar />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div
            role="tablist"
            aria-label="Main sections"
            className="inline-flex w-full sm:w-auto rounded-[var(--radius-md)] border border-border bg-surface p-1 gap-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={section === "catalogue"}
              onClick={() => setSection("catalogue")}
              className={
                section === "catalogue"
                  ? "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-medium text-primary-fg"
                  : "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-muted hover:text-fg"
              }
            >
              <PackageOpen className="h-4 w-4" />
              Catalogue
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={section === "collections"}
              onClick={() => setSection("collections")}
              className={
                section === "collections"
                  ? "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-medium text-primary-fg"
                  : "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-muted hover:text-fg"
              }
            >
              <Layers className="h-4 w-4" />
              Collections
            </button>
          </div>

          {section === "collections" ? (
            <CollectionsPanel />
          ) : (
            <>
          <StatsBar
            catalogTotal={masterStats.total}
            owned={ready ? collectionStats.owned : 0}
            wishlist={ready ? collectionStats.wishlist : 0}
            withPhotos={ready ? collectionStats.withPhotos : 0}
            spent={ready ? collectionStats.spent : 0}
          />

          <Toolbar
            search={search}
            onSearch={setSearch}
            categoryFilter={categoryFilter}
            onCategory={setCategoryFilter}
            lineFilter={lineFilter}
            onLine={setLineFilter}
            scopeFilter={scopeFilter}
            onScope={setScopeFilter}
            sort={sort}
            onSort={setSort}
            view={view}
            onView={setView}
            categoryCounts={categoryCounts}
            wishlistCount={ready ? collectionStats.wishlist : 0}
            ownedCount={ready ? collectionStats.owned : 0}
            onShareWishlist={() => setShareOpen(true)}
            onShareVault={() => setVaultShareOpen(true)}
            onAddCustom={() => setFormOpen(true)}
            onExport={handleExport}
            onImport={() => importRef.current?.click()}
          />

          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleImportFile(e.target.files)}
          />

          <BulkActionBar
            selectMode={selectMode}
            selectedCount={selectedIds.size}
            visibleCount={visible.length}
            filteredCount={filtered.length}
            onToggleSelectMode={() => {
              if (selectMode) exitSelectMode();
              else setSelectMode(true);
            }}
            onSelectVisible={() => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                for (const p of visible) next.add(p.id);
                return next;
              });
              toast.message(`Selected ${visible.length} shown figures`);
            }}
            onSelectFiltered={() => {
              setSelectedIds(new Set(filtered.map((p) => p.id)));
              toast.message(
                `Selected all ${filtered.length.toLocaleString()} matches`,
              );
            }}
            onClearSelection={() => setSelectedIds(new Set())}
            onMarkOwned={() => {
              bulkMarkOwned(selectedList, true);
              toast.success(`Marked ${selectedList.length} as in vault`);
              setSelectedIds(new Set());
            }}
            onMarkUnowned={() => {
              bulkMarkOwned(selectedList, false);
              toast.success(`Removed ${selectedList.length} from vault`);
              setSelectedIds(new Set());
            }}
            onAddWishlist={() => {
              bulkSetWishlist(selectedList, true);
              toast.success(`Added ${selectedList.length} to wishlist`);
              setSelectedIds(new Set());
            }}
            onRemoveWishlist={() => {
              bulkSetWishlist(selectedList, false);
              toast.success(`Removed ${selectedList.length} from wishlist`);
              setSelectedIds(new Set());
            }}
          />

          <div className="flex items-center justify-between text-sm text-muted">
            <p className="tabular-nums">
              {ready
                ? `${filtered.length.toLocaleString()} product${filtered.length === 1 ? "" : "s"}`
                : "Loading catalog…"}
              {filtered.length > visible.length
                ? ` · showing ${visible.length}`
                : ""}
              {selectMode && selectedIds.size > 0
                ? ` · ${selectedIds.size} selected`
                : ""}
            </p>
            <p className="hidden sm:block text-xs text-subtle">
              {selectMode
                ? "Tap figures to select · use bulk actions below"
                : "Sign in to keep your vault across devices"}
            </p>
          </div>

          {!ready ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-[var(--radius-xl)] bg-surface-2"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onAdd={() => setFormOpen(true)} />
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {visible.map((p) => (
                <FigureCard
                  key={p.id}
                  product={p}
                  entry={entries[p.id]}
                  systemCover={systemOverrides[p.id] ?? null}
                  selectMode={selectMode}
                  selected={selectedIds.has(p.id)}
                  onToggleSelect={() => toggleSelect(p.id)}
                  onClick={() => setSelectedId(p.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visible.map((p) => (
                <FigureListRow
                  key={p.id}
                  product={p}
                  entry={entries[p.id]}
                  systemCover={systemOverrides[p.id] ?? null}
                  selectMode={selectMode}
                  selected={selectedIds.has(p.id)}
                  onToggleSelect={() => toggleSelect(p.id)}
                  onClick={() => setSelectedId(p.id)}
                />
              ))}
            </div>
          )}

          {ready && visible.length < filtered.length && (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setVisibleCount((n) =>
                    Math.min(n + PAGE_SIZE, filtered.length),
                  )
                }
              >
                Load more ({filtered.length - visible.length} remaining)
              </Button>
            </div>
          )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-border mt-8">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-1">
          <p className="text-center text-xs text-subtle">
            Master list sourced from McFarlane Toys product pages (
            {masterStats.byCategory["7-inch"]} 7" ·{" "}
            {masterStats.byCategory.megafig} megafigs ·{" "}
            {masterStats.byCategory.statue ?? 0} statues ·{" "}
            {masterStats.byCategory.multipack} multipacks ·{" "}
            {masterStats.byCategory.vehicle} vehicles).
          </p>
          <p className="text-center text-xs text-subtle">
            Sign in for cloud sync. Export JSON anytime as a backup.
          </p>
        </div>
      </footer>

      <ScrollToTop />

      <WishlistShareDialog open={shareOpen} onOpenChange={setShareOpen} />
      <VaultShareDialog open={vaultShareOpen} onOpenChange={setVaultShareOpen} />

      <FigureDetail
        product={selectedProduct}
        entry={selectedEntry}
        systemCover={
          selectedId ? (systemOverrides[selectedId] ?? null) : null
        }
        isAdmin={isAdmin}
        open={!!selectedProduct && !selectMode}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        onMarkOwned={(owned) => {
          if (selectedId) markOwned(selectedId, owned);
        }}
        onToggleWishlist={() => {
          if (selectedId) toggleWishlist(selectedId);
        }}
        onUpdate={(patch) => {
          if (selectedId) updateEntry(selectedId, patch);
        }}
        onAddPhoto={(dataUrl) => {
          if (selectedId) addPersonalPhoto(selectedId, dataUrl);
        }}
        onRemovePhoto={(index) => {
          if (selectedId) removePersonalPhoto(selectedId, index);
        }}
        onSetPersonalCover={(index) => {
          if (selectedId) setPersonalCover(selectedId, index);
        }}
        onClearPersonalCover={() => {
          if (selectedId) clearPersonalCover(selectedId);
        }}
        onSetSystemCover={async (imageUrl) => {
          if (!selectedId) return;
          await setSystemProductImage({
            data: { productId: selectedId, imageUrl },
          });
          setSystemOne(selectedId, imageUrl);
        }}
        onClearSystemCover={async () => {
          if (!selectedId) return;
          await clearSystemProductImage({ data: { productId: selectedId } });
          clearSystemOne(selectedId);
        }}
        onDeleteListing={() => {
          if (!selectedId) return;
          removeEntry(selectedId);
          setSelectedId(null);
          toast.message("Listing removed from your vault");
        }}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create my listing</DialogTitle>
            <DialogDescription>
              Private to your account. Share it later if you want others to add
              a copy to their vault.
            </DialogDescription>
          </DialogHeader>
          <FigureForm
            onSubmit={(entry) => {
              addCustomEntry(entry);
              setFormOpen(false);
              toast.success("Listing added to your vault");
              setSelectedId(entry.productId);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-primary">
        <PackageOpen className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">No matches</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Try another search or category. You can also add a custom figure with
        your own photo and accessory list.
      </p>
      <Button className="mt-5" onClick={onAdd}>
        Add custom figure
      </Button>
    </div>
  );
}
