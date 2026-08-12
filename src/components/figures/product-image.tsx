import { useState } from "react";
import { cn } from "@/lib/utils";
import { figurePlaceholder } from "@/lib/image";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Extra official shots to try if the cover URL fails. */
  fallbacks?: string[];
  sizes?: string;
  priority?: boolean;
  onClick?: () => void;
  width?: number;
  height?: number;
};

export function ProductImage({
  src,
  alt,
  className,
  imgClassName,
  fallbacks = [],
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px",
  priority = false,
  onClick,
  width = 2200,
  height = 2200,
}: ProductImageProps) {
  const [failIndex, setFailIndex] = useState(0);
  const candidates = [src, ...fallbacks.filter((u) => u && u !== src)];
  const current = candidates[Math.min(failIndex, candidates.length)] ?? src;
  const exhausted = failIndex >= candidates.length;
  const displaySrc = exhausted ? figurePlaceholder(alt || "Figure") : current;

  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)}>
      <img
        src={displaySrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        referrerPolicy="no-referrer"
        draggable={false}
        onClick={onClick}
        onError={() => {
          if (!exhausted) setFailIndex((i) => i + 1);
        }}
        className={cn(
          "figure-img h-full w-full object-contain",
          onClick && "cursor-zoom-in",
          imgClassName,
        )}
      />
    </div>
  );
}
