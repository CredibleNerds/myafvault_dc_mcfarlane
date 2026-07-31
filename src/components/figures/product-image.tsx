import { useState } from "react";
import { cn } from "@/lib/utils";
import { figurePlaceholder } from "@/lib/image";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Hint for responsive loading (CSS width of the slot). */
  sizes?: string;
  priority?: boolean;
  onClick?: () => void;
  /** Intrinsic size hint — McFarlane product shots are typically square ~2200. */
  width?: number;
  height?: number;
};

/**
 * Renders official / personal product photos with crisp downscaling
 * and a high-quality source hint for retina displays.
 */
export function ProductImage({
  src,
  alt,
  className,
  imgClassName,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px",
  priority = false,
  onClick,
  width = 2200,
  height = 2200,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const displaySrc = failed ? figurePlaceholder(alt || "Figure") : src;

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
          if (!failed) setFailed(true);
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
