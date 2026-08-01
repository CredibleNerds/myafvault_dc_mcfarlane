import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type ScrollToTopProps = {
  /** Pixels scrolled before the control appears */
  threshold?: number;
  className?: string;
};

export function ScrollToTop({
  threshold = 480,
  className,
}: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Scroll back to top"
      title="Back to top"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={cn(
        "fixed z-40 bottom-5 right-4 sm:bottom-6 sm:right-6",
        "inline-flex h-12 w-12 items-center justify-center rounded-full",
        "border border-border bg-surface text-fg shadow-lg",
        "transition hover:bg-primary hover:text-primary-fg hover:border-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95",
        className,
      )}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.25} />
    </button>
  );
}
