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
        title: "MyAFVault — DC McFarlane action figure vault",
      },
      {
        name: "description",
        content:
          "MyAFVault catalogues and tracks your DC McFarlane Multiverse collection.",
      },
      { name: "theme-color", content: "#0a0b0e" },
      { name: "color-scheme", content: "dark light" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "MyAFVault" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
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
