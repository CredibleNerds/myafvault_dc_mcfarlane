import { create } from "zustand";
import type { SystemImageMap } from "@/lib/system-images";

interface SystemImageState {
  overrides: SystemImageMap;
  loaded: boolean;
  loading: boolean;
  setAll: (map: SystemImageMap) => void;
  setOne: (productId: string, imageUrl: string) => void;
  clearOne: (productId: string) => void;
  setLoading: (loading: boolean) => void;
}

/** Client cache of admin-set system covers — not per-user vault data. */
export const useSystemImages = create<SystemImageState>((set) => ({
  overrides: {},
  loaded: false,
  loading: false,
  setAll: (map) => set({ overrides: map, loaded: true, loading: false }),
  setOne: (productId, imageUrl) =>
    set((s) => ({
      overrides: { ...s.overrides, [productId]: imageUrl },
    })),
  clearOne: (productId) =>
    set((s) => {
      const next = { ...s.overrides };
      delete next[productId];
      return { overrides: next };
    }),
  setLoading: (loading) => set({ loading }),
}));

export function systemCoverFor(
  productId: string,
  overrides: SystemImageMap,
): string | null {
  return overrides[productId] ?? null;
}
