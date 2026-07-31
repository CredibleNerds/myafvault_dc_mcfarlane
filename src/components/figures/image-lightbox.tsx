import { useEffect } from "react";
import { X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageLightboxProps = {
  src: string | null;
  alt: string;
  open: boolean;
  onClose: () => void;
};

/** Full-resolution viewer so pack shots stay sharp at native size. */
export function ImageLightbox({
  src,
  alt,
  open,
  onClose,
}: ImageLightboxProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Full resolution photo"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-fg">
        <p className="flex items-center gap-2 text-sm text-muted min-w-0">
          <ZoomIn className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{alt}</span>
          <span className="hidden sm:inline text-subtle">· full resolution</span>
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-4 w-4" />
          Close
        </Button>
      </div>
      <div
        className="flex flex-1 items-center justify-center overflow-auto p-3 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          width={2200}
          height={2200}
          decoding="sync"
          fetchPriority="high"
          referrerPolicy="no-referrer"
          className="max-h-[min(92dvh,2200px)] max-w-full object-contain select-none"
          style={{ imageRendering: "auto" }}
        />
      </div>
    </div>
  );
}
