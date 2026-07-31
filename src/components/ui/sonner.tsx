import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/lib/theme";

function Toaster() {
  const { resolved } = useTheme();
  return (
    <Sonner
      theme={resolved}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "bg-surface-2 border border-border text-fg shadow-lg rounded-[var(--radius-md)]",
          description: "text-muted",
          actionButton: "bg-primary text-primary-fg",
          cancelButton: "bg-surface-3 text-muted",
        },
      }}
    />
  );
}

export { Toaster };
