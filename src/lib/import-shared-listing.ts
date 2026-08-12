import type { ProductCategory, UserEntry } from "@/lib/types";
import type { SharedItemPayload } from "@/lib/public-share";

const CATEGORIES: ProductCategory[] = [
  "7-inch",
  "megafig",
  "multipack",
  "vehicle",
  "statue",
];

function asCategory(value: string | undefined): ProductCategory {
  return CATEGORIES.includes(value as ProductCategory)
    ? (value as ProductCategory)
    : "7-inch";
}

/** Copy a shared custom listing into THIS user's vault only. */
export function listingFromSharedItem(item: SharedItemPayload): UserEntry {
  const now = new Date().toISOString();
  const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const imageUrl = item.imageUrl ?? null;
  const photos =
    imageUrl && imageUrl.startsWith("data:") ? [imageUrl] : [];
  return {
    productId: id,
    owned: true,
    wishlist: false,
    condition: "mint",
    purchasePrice: null,
    estimatedValue: null,
    purchaseDate: null,
    notes: "",
    personalPhotos: photos,
    usePersonalPhoto: photos.length > 0,
    isCustom: true,
    customProduct: {
      name: item.name.slice(0, 200),
      character: item.character.slice(0, 200),
      category: asCategory(item.category),
      line: item.line || "Custom",
      scale: item.scale || '7"',
      description: item.description ?? "",
      accessories: item.accessories ?? [],
      features: item.accessories ?? [],
      imageUrl,
      gallery: imageUrl ? [imageUrl] : [],
      brand: "Custom",
    },
    createdAt: now,
    updatedAt: now,
  };
}
