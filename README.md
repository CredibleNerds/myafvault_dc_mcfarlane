# DC McFarlane Action Figure Catalogue

Personal catalogue and collection tracker for **DC Multiverse McFarlane Toys** figures — 7″ figures, megafigs, multipacks/2-packs, and vehicles.

## Features

- **Master catalogue** of DC McFarlane products (official names, scales, lines, package accessories)
- **Official product photos** from McFarlane product pages (full-size viewer)
- **Personal collection overlay** — mark owned / wishlist, condition, purchase info, notes
- **Add your own photos** per figure (stored locally in the browser)
- Search, category filters, sort, grid/list views
- Import / export your collection as JSON

## Stack

- React 19 + TypeScript
- TanStack Start / Router
- Vite
- Tailwind CSS v4
- Zustand (persisted collection state)

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

## Notes

- Product names, photos, and accessory text are sourced from public McFarlane Toys product pages for personal cataloguing.
- Your ownership data and personal photos stay in **local browser storage** unless you export them.
- McFarlane / DC trademarks belong to their respective owners.

## License

Personal project — not affiliated with McFarlane Toys or DC.
