import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getInstallGuideStatus,
  markInstallGuideSeen,
} from "@/lib/install-guide";
import { InstallSteps } from "@/components/install/install-steps";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InstallPrompt() {
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isPending || !user || user.isDevFallback) return;
    let cancelled = false;
    void getInstallGuideStatus()
      .then((s) => {
        if (!cancelled && !s.seen) setOpen(true);
      })
      .catch(() => {
        /* ignore — don't block the vault */
      });
    return () => {
      cancelled = true;
    };
  }, [isPending, user?.id]);

  async function dismiss() {
    setOpen(false);
    try {
      await markInstallGuideSeen();
    } catch {
      /* still close locally */
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) void dismiss();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Put the vault on your Home Screen
          </DialogTitle>
          <DialogDescription>
            Install MyAFVault as an app on your phone or computer. Same vault,
            one tap away — no App Store required.
          </DialogDescription>
        </DialogHeader>
        <InstallSteps compact />
        <DialogFooter>
          <Button asChild variant="outline" onClick={() => void dismiss()}>
            <Link to="/install">Full instructions</Link>
          </Button>
          <Button type="button" onClick={() => void dismiss()}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
