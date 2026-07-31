/**
 * Collector-facing language for "I have this figure".
 * Internal state still uses `owned` — only UI labels live here.
 */
export const OWNERSHIP = {
  /** Status chip next to checkmark */
  status: "In My Vault",
  /** CTA when not yet owned */
  add: "Add to vault",
  /** CTA when already owned */
  remove: "Remove from vault",
  /** Short toast */
  toastAdded: "Added to your vault",
  toastRemoved: "Removed from vault",
  /** Filters / sorts */
  filterOnly: "In my vault only",
  filterNot: "Not in vault",
  sortFirst: "In vault first",
  /** Bulk actions */
  bulkMark: "Mark in vault",
  bulkUnmark: "Mark not in vault",
  bulkHint: "Bulk add to vault, remove, or wishlist",
  /** Stats strip */
  countLabel: "In My Vault",
  /** a11y */
  ariaYes: "In my vault",
  titleYes: "In my vault",
} as const;
