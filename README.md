# DC McFarlane Action Figure Catalogue

Personal catalogue and collection tracker for **DC Multiverse McFarlane Toys** figures — 7″ figures, megafigs, multipacks/2-packs, and vehicles.

## Features

- **Master catalogue** of DC McFarlane products (official names, scales, lines, package accessories)
- **Official product photos** from McFarlane product pages (full-size viewer)
- **Personal collection overlay** — mark owned / wishlist, condition, purchase info, notes
- **Add your own photos** per figure
- **Cloud sync** — sign in (Google or X) to keep your vault across devices
- Search, category filters, sort, grid/list views
- Import / export your collection as JSON

## Stack

- React 19 + TypeScript
- TanStack Start / Router
- Vite + Nitro (Vercel preset)
- Tailwind CSS v4
- Zustand (local cache) + Postgres (Neon / PGLite) for cloud vault
- Better Auth (Google / X via Grok broker)

## Develop

```bash
npm install
npm run dev
```

App serves on port **8080**.

```bash
npm run typecheck
npm run build
```

## Cloud sync

1. Click **Sign in to sync** in the header.
2. Continue with Google or X.
3. Local collection merges with the cloud (last write wins per figure).
4. Further edits auto-save while signed in.

On Vercel, ensure `DATABASE_URL` (Neon) is set so vault rows persist. The live preview uses embedded PGLite automatically.

## Notes

- Product names, photos, and accessory text are sourced from public McFarlane Toys product pages for personal cataloguing.
- McFarlane / DC trademarks belong to their respective owners.

## License

Personal project — not affiliated with McFarlane Toys or DC.
