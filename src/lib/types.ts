export type ProductCategory =
  | "7-inch"
  | "megafig"
  | "multipack"
  | "vehicle"
  | "statue";

export type FigureCondition =
  | "mint"
  | "near-mint"
  | "excellent"
  | "good"
  | "fair"
  | "opened"
  | "loose";

export interface CatalogProduct {
  id: string;
  name: string;
  character: string;
  brand: string;
  category: ProductCategory;
  line: string;
  scale: string;
  productType: string;
  genre: string;
  series: string;
  releaseYear: number | null;
  sku: string;
  description: string;
  features: string[];
  accessories: string[];
  imageUrl: string | null;
  gallery: string[];
  productUrl: string;
  source: string;
}

/** User-owned / tracked entry for a catalog product (or custom figure). */
export interface UserEntry {
  productId: string;
  owned: boolean;
  wishlist: boolean;
  condition: FigureCondition | null;
  purchasePrice: number | null;
  estimatedValue: number | null;
  purchaseDate: string | null;
  notes: string;
  /** User-uploaded photos as data URLs */
  personalPhotos: string[];
  /** Prefer personal photo as card cover when available */
  usePersonalPhoto: boolean;
  /** True if this is a user-created product not in master catalog */
  isCustom?: boolean;
  customProduct?: Partial<CatalogProduct> & {
    name: string;
    character: string;
    category: ProductCategory;
  };
  updatedAt: string;
  createdAt: string;
}

/**
 * User-built display / group — e.g. Justice League shelf, Dark Knight cast,
 * Teen Titans row. Multiple photos of the group; optional links to catalog IDs.
 */
export interface UserCollection {
  id: string;
  name: string;
  description: string;
  /** Free-text theme: team, movie, continuity, shelf, etc. */
  theme: string;
  /** Group photos (data URLs), max managed in store */
  photos: string[];
  /** Catalog / custom product ids staged in this group */
  productIds: string[];
  coverPhotoIndex: number;
  createdAt: string;
  updatedAt: string;
}

export const CONDITIONS: { value: FigureCondition; label: string }[] = [
  { value: "mint", label: "Mint (MISB)" },
  { value: "near-mint", label: "Near Mint" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "opened", label: "Opened / Complete" },
  { value: "loose", label: "Loose" },
];

export const CATEGORIES: { value: ProductCategory | "all"; label: string }[] =
  [
    { value: "all", label: "All" },
    { value: "7-inch", label: '7" Figures' },
    { value: "megafig", label: "Megafigs" },
    { value: "statue", label: "Statues" },
    { value: "multipack", label: "2-Packs / Multipacks" },
    { value: "vehicle", label: "Vehicles" },
  ];

export const LINES = [
  "DC Multiverse",
  "Megafig",
  "Gold Label",
  "Platinum Edition",
  "Page Punchers",
  "The Dark Knight Trilogy",
  "Batman 85th Anniversary",
  "Superman",
  "The Batman",
  "Aquaman",
  "Wonder Woman",
  "Custom",
];

/** Suggested themes when creating a user collection / display. */
export const COLLECTION_THEME_SUGGESTIONS = [
  "Justice League",
  "Teen Titans",
  "Bat-Family",
  "The Dark Knight",
  "The Batman",
  "Superman movies",
  "Suicide Squad",
  "Crisis on Infinite Earths",
  "Villains",
  "Gold Label shelf",
  "Custom shelf",
] as const;
