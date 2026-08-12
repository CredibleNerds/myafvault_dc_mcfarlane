export type AvatarSource = "figure" | "upload" | "initials";
export type AvatarBg = "crimson" | "ink" | "gold" | "blue" | "stone";
export type AvatarShape = "circle" | "rounded";
export type AvatarFrame = "none" | "crimson" | "gold" | "wishlist" | "platinum";
export type AvatarBadge = "none" | "vault" | "star" | "initials";

export type AvatarConfig = {
  source: AvatarSource;
  productId: string | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
  bg: AvatarBg;
  shape: AvatarShape;
  frame: AvatarFrame;
  badge: AvatarBadge;
};

export const DEFAULT_AVATAR: AvatarConfig = {
  source: "initials",
  productId: null,
  zoom: 1.15,
  offsetX: 0,
  offsetY: 0,
  bg: "crimson",
  shape: "circle",
  frame: "none",
  badge: "none",
};

export const AVATAR_BG: { value: AvatarBg; label: string; className: string }[] =
  [
    { value: "crimson", label: "Crimson", className: "bg-primary" },
    { value: "ink", label: "Ink", className: "bg-bg" },
    { value: "gold", label: "Gold", className: "bg-warning" },
    { value: "blue", label: "Wishlist", className: "bg-wishlist" },
    { value: "stone", label: "Stone", className: "bg-surface-3" },
  ];

export const AVATAR_FRAMES: {
  value: AvatarFrame;
  label: string;
  className: string;
}[] = [
  { value: "none", label: "None", className: "border-transparent" },
  { value: "crimson", label: "Vault", className: "border-primary" },
  { value: "gold", label: "Gold Label", className: "border-warning" },
  { value: "wishlist", label: "Wishlist", className: "border-wishlist" },
  { value: "platinum", label: "Platinum", className: "border-muted" },
];

function num(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function parseAvatarConfig(value: unknown): AvatarConfig {
  if (!value || typeof value !== "object") return { ...DEFAULT_AVATAR };
  const raw = value as Record<string, unknown>;
  const source: AvatarSource =
    raw.source === "figure" || raw.source === "upload" || raw.source === "initials"
      ? raw.source
      : "initials";
  const bg = AVATAR_BG.some((b) => b.value === raw.bg)
    ? (raw.bg as AvatarBg)
    : "crimson";
  const shape: AvatarShape = raw.shape === "rounded" ? "rounded" : "circle";
  const frame = AVATAR_FRAMES.some((f) => f.value === raw.frame)
    ? (raw.frame as AvatarFrame)
    : "none";
  const badge: AvatarBadge =
    raw.badge === "vault" || raw.badge === "star" || raw.badge === "initials"
      ? raw.badge
      : "none";
  return {
    source,
    productId: typeof raw.productId === "string" ? raw.productId : null,
    zoom: num(raw.zoom, 1.15, 1, 2.6),
    offsetX: num(raw.offsetX, 0, -40, 40),
    offsetY: num(raw.offsetY, 0, -40, 40),
    bg,
    shape,
    frame,
    badge,
  };
}

export function initialsFrom(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "V";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
