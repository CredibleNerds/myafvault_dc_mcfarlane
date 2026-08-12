/**
 * Multi-franchise vault registry.
 * DC McFarlane is live; others are placeholders for future catalogues.
 */

export type FranchiseStatus = "live" | "coming-soon";

export type FranchiseVault = {
  id: string;
  name: string;
  shortLabel: string;
  tagline: string;
  status: FranchiseStatus;
  /** In-app path when status is live */
  path?: "/vault/dc-mcfarlane";
  /** High-level product lines shown on marketing cards */
  highlights: string[];
  /** Approximate catalog scope for marketing (not a hard limit) */
  scopeNote: string;
};

/** Primary live vault for this product surface. */
export const PRIMARY_VAULT_ID = "dc-mcfarlane" as const;
export const PRIMARY_VAULT_PATH = "/vault/dc-mcfarlane" as const;

export const FRANCHISES: FranchiseVault[] = [
  {
    id: "dc-mcfarlane",
    name: "DC McFarlane Multiverse",
    shortLabel: "DC McFarlane",
    tagline:
      "7\" figures, Megafigs, statues, multipacks, and vehicles — full accessories and collection tracking.",
    status: "live",
    path: PRIMARY_VAULT_PATH,
    highlights: ['7" Figures', "Megafigs", "Statues", "Multipacks", "Vehicles"],
    scopeNote: "600+ catalog entries",
  },
  {
    id: "marvel",
    name: "Marvel",
    shortLabel: "Marvel",
    tagline:
      "Legends, Mega, and multi-packs — planned vault for Marvel-scale collecting.",
    status: "coming-soon",
    highlights: ["Legends", "Mega", "Multipacks"],
    scopeNote: "Coming soon",
  },
  {
    id: "star-wars",
    name: "Star Wars",
    shortLabel: "Star Wars",
    tagline:
      "Black Series, Vintage Collection, and more — tracked the same way as your DC vault.",
    status: "coming-soon",
    highlights: ["Black Series", "Vintage", "Vehicles"],
    scopeNote: "Coming soon",
  },
  {
    id: "fallout",
    name: "Fallout",
    shortLabel: "Fallout",
    tagline:
      "Wasteland figures and mega-scale builds in one vault when this franchise goes live.",
    status: "coming-soon",
    highlights: ["Figures", "Mega", "Sets"],
    scopeNote: "Coming soon",
  },
];

export function getFranchise(id: string): FranchiseVault | undefined {
  return FRANCHISES.find((f) => f.id === id);
}

export function getLiveFranchises(): FranchiseVault[] {
  return FRANCHISES.filter((f) => f.status === "live");
}

/** Stripe product meta — wire Checkout Session later. */
export const VAULT_ACCESS = {
  priceUsd: 4.99,
  priceLabel: "$4.99",
  billing: "one-time" as const,
  productName: "MyAFVault Lifetime Access",
  description:
    "One-time unlock for the DC McFarlane vault, cloud sync, and multi-device access.",
  /** Checkout is live when STRIPE_SECRET_KEY is set on the server */
  stripeReady: true,
} as const;

