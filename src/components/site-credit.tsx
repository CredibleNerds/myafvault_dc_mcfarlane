import { cn } from "@/lib/utils";

export function SiteCredit({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-subtle", className)}>
      ©️The Credible Nerds, LLC, 2026
    </p>
  );
}
