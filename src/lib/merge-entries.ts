import type { UserEntry } from "@/lib/types";

/** Last-write-wins merge by `updatedAt` per productId. */
export function mergeEntries(
  local: Record<string, UserEntry>,
  remote: Record<string, UserEntry>,
): Record<string, UserEntry> {
  const ids = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const out: Record<string, UserEntry> = {};
  for (const id of ids) {
    const a = local[id];
    const b = remote[id];
    if (a && b) {
      const aT = Date.parse(a.updatedAt || a.createdAt || "") || 0;
      const bT = Date.parse(b.updatedAt || b.createdAt || "") || 0;
      out[id] = aT >= bT ? a : b;
    } else if (a) {
      out[id] = a;
    } else if (b) {
      out[id] = b;
    }
  }
  return out;
}

export function entriesFingerprint(entries: Record<string, UserEntry>): string {
  // Stable-ish fingerprint for change detection without full deep compare.
  const keys = Object.keys(entries).sort();
  let hash = `${keys.length}`;
  for (const k of keys) {
    const e = entries[k];
    hash += `|${k}:${e.updatedAt}:${e.owned ? 1 : 0}${e.wishlist ? 1 : 0}:${e.personalPhotos.length}`;
  }
  return hash;
}
