import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ProductCategory,
  UserEntry,
} from "@/lib/types";

export type SortKey =
  | "name-asc"
  | "name-desc"
  | "year-desc"
  | "year-asc"
  | "character-asc"
  | "owned-first";

export type ViewMode = "grid" | "list";
export type ScopeFilter = "all" | "owned" | "wishlist" | "unowned";

interface CatalogueState {
  entries: Record<string, UserEntry>;
  search: string;
  categoryFilter: ProductCategory | "all";
  lineFilter: string;
  scopeFilter: ScopeFilter;
  sort: SortKey;
  view: ViewMode;

  setSearch: (q: string) => void;
  setCategoryFilter: (c: ProductCategory | "all") => void;
  setLineFilter: (l: string) => void;
  setScopeFilter: (s: ScopeFilter) => void;
  setSort: (s: SortKey) => void;
  setView: (v: ViewMode) => void;

  markOwned: (productId: string, owned?: boolean) => void;
  toggleWishlist: (productId: string) => void;
  bulkMarkOwned: (productIds: string[], owned: boolean) => void;
  bulkSetWishlist: (productIds: string[], wishlist: boolean) => void;
  updateEntry: (productId: string, patch: Partial<UserEntry>) => void;
  addPersonalPhoto: (productId: string, dataUrl: string) => void;
  removePersonalPhoto: (productId: string, index: number) => void;
  addCustomEntry: (entry: UserEntry) => void;
  removeEntry: (productId: string) => void;
  importEntries: (entries: Record<string, UserEntry>) => void;
  replaceEntries: (entries: Record<string, UserEntry>) => void;
  clearCollection: () => void;
}

function emptyEntry(productId: string): UserEntry {
  const now = new Date().toISOString();
  return {
    productId,
    owned: false,
    wishlist: false,
    condition: null,
    purchasePrice: null,
    estimatedValue: null,
    purchaseDate: null,
    notes: "",
    personalPhotos: [],
    usePersonalPhoto: false,
    createdAt: now,
    updatedAt: now,
  };
}

function touch(
  entry: UserEntry,
  patch: Partial<UserEntry>,
): UserEntry {
  return { ...entry, ...patch, updatedAt: new Date().toISOString() };
}

const storage =
  typeof window !== "undefined"
    ? createJSONStorage(() => localStorage)
    : undefined;

export const useCatalogue = create<CatalogueState>()(
  persist(
    (set, get) => ({
      entries: {},
      search: "",
      categoryFilter: "all",
      lineFilter: "all",
      scopeFilter: "all",
      sort: "year-desc",
      view: "grid",

      setSearch: (search) => set({ search }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setLineFilter: (lineFilter) => set({ lineFilter }),
      setScopeFilter: (scopeFilter) => set({ scopeFilter }),
      setSort: (sort) => set({ sort }),
      setView: (view) => set({ view }),

      markOwned: (productId, owned = true) => {
        const cur = get().entries[productId] ?? emptyEntry(productId);
        set({
          entries: {
            ...get().entries,
            [productId]: touch(cur, {
              owned,
              wishlist: owned ? false : cur.wishlist,
            }),
          },
        });
      },

      toggleWishlist: (productId) => {
        const cur = get().entries[productId] ?? emptyEntry(productId);
        set({
          entries: {
            ...get().entries,
            [productId]: touch(cur, {
              wishlist: !cur.wishlist,
              owned: !cur.wishlist ? false : cur.owned,
            }),
          },
        });
      },

      bulkMarkOwned: (productIds, owned) => {
        if (productIds.length === 0) return;
        const next = { ...get().entries };
        const now = new Date().toISOString();
        for (const id of productIds) {
          const cur = next[id] ?? emptyEntry(id);
          next[id] = {
            ...cur,
            owned,
            wishlist: owned ? false : cur.wishlist,
            updatedAt: now,
          };
        }
        set({ entries: next });
      },

      bulkSetWishlist: (productIds, wishlist) => {
        if (productIds.length === 0) return;
        const next = { ...get().entries };
        const now = new Date().toISOString();
        for (const id of productIds) {
          const cur = next[id] ?? emptyEntry(id);
          next[id] = {
            ...cur,
            wishlist,
            // Wishlist and owned are mutually exclusive when adding to wishlist
            owned: wishlist ? false : cur.owned,
            updatedAt: now,
          };
        }
        set({ entries: next });
      },

      updateEntry: (productId, patch) => {
        const cur = get().entries[productId] ?? emptyEntry(productId);
        set({
          entries: {
            ...get().entries,
            [productId]: touch(cur, patch),
          },
        });
      },

      addPersonalPhoto: (productId, dataUrl) => {
        const cur = get().entries[productId] ?? emptyEntry(productId);
        const photos = [...cur.personalPhotos, dataUrl].slice(0, 8);
        set({
          entries: {
            ...get().entries,
            [productId]: touch(cur, {
              personalPhotos: photos,
              usePersonalPhoto: true,
              owned: true,
            }),
          },
        });
      },

      removePersonalPhoto: (productId, index) => {
        const cur = get().entries[productId];
        if (!cur) return;
        const photos = cur.personalPhotos.filter((_, i) => i !== index);
        set({
          entries: {
            ...get().entries,
            [productId]: touch(cur, {
              personalPhotos: photos,
              usePersonalPhoto: photos.length > 0 ? cur.usePersonalPhoto : false,
            }),
          },
        });
      },

      addCustomEntry: (entry) => {
        set({
          entries: {
            ...get().entries,
            [entry.productId]: entry,
          },
        });
      },

      removeEntry: (productId) => {
        const next = { ...get().entries };
        delete next[productId];
        set({ entries: next });
      },

      importEntries: (entries) => {
        set({ entries: { ...get().entries, ...entries } });
      },

      replaceEntries: (entries) => {
        set({ entries });
      },

      clearCollection: () => set({ entries: {} }),
    }),
    {
      name: "dc-mcfarlane-catalogue-v2",
      storage,
      skipHydration: true,
      partialize: (s) => ({
        entries: s.entries,
        view: s.view,
        sort: s.sort,
      }),
    },
  ),
);

export async function hydrateCatalogue(): Promise<void> {
  if (typeof window === "undefined") return;
  await useCatalogue.persist.rehydrate();
}

export function selectCollectionStats(entries: Record<string, UserEntry>) {
  const list = Object.values(entries);
  const owned = list.filter((e) => e.owned);
  const wishlist = list.filter((e) => e.wishlist);
  const spent = owned.reduce((s, e) => s + (e.purchasePrice ?? 0), 0);
  const estValue = owned.reduce((s, e) => s + (e.estimatedValue ?? 0), 0);
  const mint = owned.filter(
    (e) => e.condition === "mint" || e.condition === "near-mint",
  ).length;
  const withPhotos = owned.filter((e) => e.personalPhotos.length > 0).length;
  return {
    owned: owned.length,
    wishlist: wishlist.length,
    spent,
    estValue,
    mint,
    withPhotos,
  };
}
