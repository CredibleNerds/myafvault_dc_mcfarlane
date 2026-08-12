import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ProductCategory,
  UserCollection,
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
export type ScopeFilter = "all" | "owned" | "wishlist" | "unowned" | "custom";

export type AppSection = "catalogue" | "collections";

interface CatalogueState {
  entries: Record<string, UserEntry>;
  collections: Record<string, UserCollection>;
  search: string;
  categoryFilter: ProductCategory | "all";
  lineFilter: string;
  scopeFilter: ScopeFilter;
  sort: SortKey;
  view: ViewMode;
  section: AppSection;

  setSearch: (q: string) => void;
  setCategoryFilter: (c: ProductCategory | "all") => void;
  setLineFilter: (l: string) => void;
  setScopeFilter: (s: ScopeFilter) => void;
  setSort: (s: SortKey) => void;
  setView: (v: ViewMode) => void;
  setSection: (s: AppSection) => void;

  markOwned: (productId: string, owned?: boolean) => void;
  toggleWishlist: (productId: string) => void;
  bulkMarkOwned: (productIds: string[], owned: boolean) => void;
  bulkSetWishlist: (productIds: string[], wishlist: boolean) => void;
  updateEntry: (productId: string, patch: Partial<UserEntry>) => void;
  addPersonalPhoto: (productId: string, dataUrl: string) => void;
  removePersonalPhoto: (productId: string, index: number) => void;
  /** Set which personal photo is THIS user's cover only */
  setPersonalCover: (productId: string, index: number) => void;
  /** Stop using personal cover; fall back to system/catalog */
  clearPersonalCover: (productId: string) => void;
  addCustomEntry: (entry: UserEntry) => void;
  removeEntry: (productId: string) => void;
  importEntries: (entries: Record<string, UserEntry>) => void;
  replaceEntries: (entries: Record<string, UserEntry>) => void;
  clearCollection: () => void;

  upsertCollection: (collection: UserCollection) => void;
  updateCollection: (
    id: string,
    patch: Partial<UserCollection>,
  ) => void;
  removeCollection: (id: string) => void;
  addCollectionPhoto: (id: string, dataUrl: string) => void;
  removeCollectionPhoto: (id: string, index: number) => void;
  setCollectionProducts: (id: string, productIds: string[]) => void;
  replaceCollections: (collections: Record<string, UserCollection>) => void;
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

function touchCollection(
  col: UserCollection,
  patch: Partial<UserCollection>,
): UserCollection {
  return { ...col, ...patch, updatedAt: new Date().toISOString() };
}

const storage =
  typeof window !== "undefined"
    ? createJSONStorage(() => localStorage)
    : undefined;

export const useCatalogue = create<CatalogueState>()(
  persist(
    (set, get) => ({
      entries: {},
      collections: {},
      search: "",
      categoryFilter: "all",
      lineFilter: "all",
      scopeFilter: "all",
      sort: "year-desc",
      view: "grid",
      section: "catalogue",

      setSearch: (search) => set({ search }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setLineFilter: (lineFilter) => set({ lineFilter }),
      setScopeFilter: (scopeFilter) => set({ scopeFilter }),
      setSort: (sort) => set({ sort }),
      setView: (view) => set({ view }),
      setSection: (section) => set({ section }),

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
        const newIndex = photos.length - 1;
        set({
          entries: {
            ...get().entries,
            [productId]: touch(cur, {
              personalPhotos: photos,
              usePersonalPhoto: true,
              personalCoverIndex: newIndex,
              owned: true,
            }),
          },
        });
      },

      removePersonalPhoto: (productId, index) => {
        const cur = get().entries[productId];
        if (!cur) return;
        const photos = cur.personalPhotos.filter((_, i) => i !== index);
        let coverIdx = cur.personalCoverIndex ?? 0;
        if (photos.length === 0) {
          coverIdx = 0;
        } else if (index < coverIdx) {
          coverIdx = coverIdx - 1;
        } else if (index === coverIdx) {
          coverIdx = Math.min(coverIdx, photos.length - 1);
        }
        set({
          entries: {
            ...get().entries,
            [productId]: touch(cur, {
              personalPhotos: photos,
              usePersonalPhoto: photos.length > 0 ? cur.usePersonalPhoto : false,
              personalCoverIndex: photos.length > 0 ? coverIdx : 0,
            }),
          },
        });
      },

      setPersonalCover: (productId, index) => {
        const cur = get().entries[productId] ?? emptyEntry(productId);
        if (cur.personalPhotos.length === 0) return;
        const safe = Math.max(0, Math.min(index, cur.personalPhotos.length - 1));
        set({
          entries: {
            ...get().entries,
            [productId]: touch(cur, {
              usePersonalPhoto: true,
              personalCoverIndex: safe,
            }),
          },
        });
      },

      clearPersonalCover: (productId) => {
        const cur = get().entries[productId];
        if (!cur) return;
        set({
          entries: {
            ...get().entries,
            [productId]: touch(cur, {
              usePersonalPhoto: false,
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

      clearCollection: () => set({ entries: {}, collections: {} }),

      upsertCollection: (collection) => {
        set({
          collections: {
            ...get().collections,
            [collection.id]: collection,
          },
        });
      },

      updateCollection: (id, patch) => {
        const cur = get().collections[id];
        if (!cur) return;
        set({
          collections: {
            ...get().collections,
            [id]: touchCollection(cur, patch),
          },
        });
      },

      removeCollection: (id) => {
        const next = { ...get().collections };
        delete next[id];
        set({ collections: next });
      },

      addCollectionPhoto: (id, dataUrl) => {
        const cur = get().collections[id];
        if (!cur) return;
        const photos = [...cur.photos, dataUrl].slice(0, 24);
        set({
          collections: {
            ...get().collections,
            [id]: touchCollection(cur, {
              photos,
              coverPhotoIndex:
                cur.photos.length === 0 ? 0 : cur.coverPhotoIndex,
            }),
          },
        });
      },

      removeCollectionPhoto: (id, index) => {
        const cur = get().collections[id];
        if (!cur) return;
        const photos = cur.photos.filter((_, i) => i !== index);
        let cover = cur.coverPhotoIndex;
        if (photos.length === 0) cover = 0;
        else if (index === cover) cover = 0;
        else if (index < cover) cover = Math.max(0, cover - 1);
        set({
          collections: {
            ...get().collections,
            [id]: touchCollection(cur, {
              photos,
              coverPhotoIndex: cover,
            }),
          },
        });
      },

      setCollectionProducts: (id, productIds) => {
        const cur = get().collections[id];
        if (!cur) return;
        set({
          collections: {
            ...get().collections,
            [id]: touchCollection(cur, { productIds }),
          },
        });
      },

      replaceCollections: (collections) => {
        set({ collections });
      },
    }),
    {
      name: "dc-mcfarlane-catalogue-v3",
      storage,
      skipHydration: true,
      partialize: (s) => ({
        entries: s.entries,
        collections: s.collections,
        view: s.view,
        sort: s.sort,
        section: s.section,
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

export function newCollectionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `col-${crypto.randomUUID()}`;
  }
  return `col-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
