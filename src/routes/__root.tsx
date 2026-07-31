import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { TwoFactorGate } from "@/components/auth/two-factor-gate";
import { ThemeProvider, THEME_BOOT_SCRIPT } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "MyAFVault — Multi-franchise action figure vaults",
      },
      {
        name: "description",
        content:
          "MyAFVault catalogues and tracks your figure collections. DC McFarlane Multiverse is live — more franchises coming.",
      },
      { name: "theme-color", content: "#0a0b0e" },
      { name: "color-scheme", content: "dark light" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://mcfarlane.com" },
      { rel: "dns-prefetch", href: "https://mcfarlane.com" },
    ],
    scripts: [
      {
        children: THEME_BOOT_SCRIPT,
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="antialiased dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-bg text-fg">
        <ThemeProvider>
          <AuthProvider>
            <TwoFactorGate>
              <Outlet />
            </TwoFactorGate>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
