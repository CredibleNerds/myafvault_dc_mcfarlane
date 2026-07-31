import type { UserCollection, UserEntry } from "@/lib/types";

/**
 * Last-write-wins merge by `updatedAt` (ISO strings). Missing sides keep the
 * other. Equal timestamps prefer cloud to reduce thrash on concurrent clients.
 */
export function mergeEntries(
  local: Record<string, UserEntry>,
  cloud: Record<string, UserEntry>,
): Record<string, UserEntry> {
  const ids = new Set([...Object.keys(local), ...Object.keys(cloud)]);
  const out: Record<string, UserEntry> = {};
  for (const id of ids) {
    const a = local[id];
    const b = cloud[id];
    if (!a) {
      out[id] = b!;
      continue;
    }
    if (!b) {
      out[id] = a;
      continue;
    }
    out[id] = (a.updatedAt || "") >= (b.updatedAt || "") ? a : b;
  }
  return out;
}

export function mergeCollections(
  local: Record<string, UserCollection>,
  cloud: Record<string, UserCollection>,
): Record<string, UserCollection> {
  const ids = new Set([...Object.keys(local), ...Object.keys(cloud)]);
  const out: Record<string, UserCollection> = {};
  for (const id of ids) {
    const a = local[id];
    const b = cloud[id];
    if (!a) {
      out[id] = b!;
      continue;
    }
    if (!b) {
      out[id] = a;
      continue;
    }
    out[id] = (a.updatedAt || "") >= (b.updatedAt || "") ? a : b;
  }
  return out;
}

export function entriesFingerprint(
  entries: Record<string, UserEntry>,
  collections: Record<string, UserCollection> = {},
): string {
  let hash = 0;
  const keys = Object.keys(entries).sort();
  for (const k of keys) {
    const e = entries[k]!;
    const part = `|${k}:${e.updatedAt}:${e.owned ? 1 : 0}${e.wishlist ? 1 : 0}:${e.personalPhotos.length}`;
    for (let i = 0; i < part.length; i++) {
      hash = (hash * 31 + part.charCodeAt(i)) | 0;
    }
  }
  const ckeys = Object.keys(collections).sort();
  for (const k of ckeys) {
    const c = collections[k]!;
    const part = `#${k}:${c.updatedAt}:${c.photos.length}:${c.productIds.length}:${c.name}`;
    for (let i = 0; i < part.length; i++) {
      hash = (hash * 31 + part.charCodeAt(i)) | 0;
    }
  }
  return String(hash);
}
