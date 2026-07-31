import { Toaster as Sonner } from "sonner";

function Toaster() {
  return (
    <Sonner
      theme="dark"
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
