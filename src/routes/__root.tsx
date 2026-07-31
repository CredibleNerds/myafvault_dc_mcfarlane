import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
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
        title:
          "DC McFarlane Catalogue — Multiverse 7\", Megafigs, Multipacks & Vehicles",
      },
      {
        name: "description",
        content:
          "Complete catalogue of DC McFarlane Multiverse figures with official photos, package accessories, and personal collection tracking.",
      },
      { name: "theme-color", content: "#0a0b0e" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://mcfarlane.com" },
      { rel: "dns-prefetch", href: "https://mcfarlane.com" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-bg text-fg">
        <AuthProvider>
          <Outlet />
          <Toaster />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
