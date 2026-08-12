import { Check, Star } from "lucide-react";
import {
  AVATAR_BG,
  AVATAR_FRAMES,
  DEFAULT_AVATAR,
  initialsFrom,
  type AvatarConfig,
} from "@/lib/avatar";
import { CATALOG_BY_ID } from "@/data/catalog";
import { cn } from "@/lib/utils";

export function CollectorAvatar({
  config,
  uploadSrc,
  name,
  size = 96,
  className,
}: {
  config?: AvatarConfig | null;
  uploadSrc?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const cfg = config ?? DEFAULT_AVATAR;
  const bg = AVATAR_BG.find((b) => b.value === cfg.bg)?.className ?? "bg-primary";
  const frame =
    AVATAR_FRAMES.find((f) => f.value === cfg.frame)?.className ??
    "border-transparent";
  const figureSrc =
    cfg.source === "figure" && cfg.productId
      ? (CATALOG_BY_ID[cfg.productId]?.imageUrl ?? null)
      : null;
  const photoSrc = cfg.source === "upload" ? uploadSrc : figureSrc;
  const initials = initialsFrom(name);
  const rounded = cfg.shape === "circle" ? "rounded-full" : "rounded-2xl";
  const hasPhoto = !!photoSrc;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden",
        rounded,
        bg,
        frame,
        className,
      )}
      style={{
        width: size,
        height: size,
        borderWidth: size < 40 ? 2 : 4,
      }}

      aria-hidden
    >
      {hasPhoto ? (
        <img
          src={photoSrc!}
          alt=""
          referrerPolicy="no-referrer"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            transform: `translate(${cfg.offsetX}%, ${cfg.offsetY}%) scale(${cfg.zoom})`,
            transformOrigin: "center",
          }}
        />
      ) : (
        <span
          className={cn(
            "grid h-full w-full place-items-center font-semibold tracking-wide",
            cfg.bg === "gold" || cfg.bg === "stone" ? "text-bg" : "text-primary-fg",
          )}
          style={{ fontSize: Math.round(size * 0.36) }}
        >
          {initials}
        </span>
      )}

      {cfg.badge !== "none" && (
        <span
          className={cn(
            "absolute grid place-items-center rounded-full border border-bg font-bold",
            cfg.badge === "star"
              ? "bg-wishlist text-wishlist-fg"
              : "bg-primary text-primary-fg",
            cfg.badge === "initials" ? "px-1" : "",
          )}
          style={{
            width: Math.max(16, Math.round(size * 0.28)),
            height: Math.max(16, Math.round(size * 0.28)),
            right: Math.round(size * 0.02),
            bottom: Math.round(size * 0.02),
            fontSize: Math.max(8, Math.round(size * 0.12)),
          }}
        >
          {cfg.badge === "vault" ? (
            <Check style={{ width: "65%", height: "65%" }} />
          ) : cfg.badge === "star" ? (
            <Star style={{ width: "65%", height: "65%" }} />
          ) : (
            initials.slice(0, 1)
          )}
        </span>
      )}
    </div>
  );
}
