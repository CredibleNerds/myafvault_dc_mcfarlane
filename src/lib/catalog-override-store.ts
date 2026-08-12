import { create } from "zustand";
import type {
  CatalogOverrideMap,
  CatalogOverrideRecord,
} from "@/lib/catalog-overrides";

interface CatalogOverrideState {
  overrides: CatalogOverrideMap;
  loaded: boolean;
  setAll: (map: CatalogOverrideMap) => void;
  setOne: (record: CatalogOverrideRecord) => void;
  clearOne: (productId: string) => void;
}

export const useCatalogOverrides = create<CatalogOverrideState>((set) => ({
  overrides: {},
  loaded: false,
  setAll: (map) => set({ overrides: map, loaded: true }),
  setOne: (record) =>
    set((s) => ({
      overrides: { ...s.overrides, [record.productId]: record },
    })),
  clearOne: (productId) =>
    set((s) => {
      const next = { ...s.overrides };
      delete next[productId];
      return { overrides: next };
    }),
}));
