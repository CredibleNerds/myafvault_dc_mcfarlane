export type ProductCategory = "7-inch" | "megafig" | "multipack" | "vehicle";

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
    { value: "multipack", label: "2-Packs / Multipacks" },
    { value: "vehicle", label: "Vehicles" },
  ];

export const LINES = [
  "DC Multiverse",
  "Megafig",
  "Gold Label",
  "Platinum Edition",
  "Collector Edition",
  "Vault Collection",
  "Page Punchers",
  "Multipack",
  "Vehicle",
  "Other",
] as const;
