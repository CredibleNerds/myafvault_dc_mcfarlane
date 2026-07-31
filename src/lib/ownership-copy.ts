/**
 * Collector-facing language for "I have this figure".
 * Internal state still uses `owned` — only UI labels live here.
 *
 * Brand fit: MyAFVault → "Vaulted"
 */
export const OWNERSHIP = {
  /** Past-tense status: "Vaulted" */
  status: "Vaulted",
  /** CTA when not yet owned */
  add: "Add to vault",
  /** CTA when already owned */
  remove: "Remove from vault",
  /** Short toast */
  toastAdded: "Added to your vault",
  toastRemoved: "Removed from vault",
  /** Filters / sorts */
  filterOnly: "Vaulted only",
  filterNot: "Not vaulted",
  sortFirst: "Vaulted first",
  /** Bulk actions */
  bulkMark: "Mark vaulted",
  bulkUnmark: "Mark not vaulted",
  bulkHint: "Bulk vault, unvault, or wishlist",
  /** Stats strip */
  countLabel: "Vaulted",
  /** a11y */
  ariaYes: "Vaulted — in your collection",
  titleYes: "In your vault",
} as const;
