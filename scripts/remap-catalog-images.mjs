#!/usr/bin/env node
/**
 * Remap broken mcfarlane.com image hosts in src/data/catalog.json.
 *
 * 1) Prefer official McFarlane Toys Store (BigCommerce CDN) images when a
 *    confident MPN + name match exists.
 * 2) Otherwise rewrite https://mcfarlane.com/wp-content/... to WordPress.com
 *    Photon (https://i0.wp.com/mcfarlane.com/...) which serves the same files
 *    over a valid TLS certificate.
 *
 * Usage:
 *   node scripts/remap-catalog-images.mjs [--store /tmp/mcf-remap/store-products.json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const catalogPath = path.join(root, "src/data/catalog.json");

const args = process.argv.slice(2);
const storeIdx = args.indexOf("--store");
const storePath =
  storeIdx >= 0
    ? args[storeIdx + 1]
    : "/tmp/mcf-remap/store-products.json";

const MCF_HOST_RE = /^https?:\/\/(www\.)?mcfarlane\.com\//i;
const BC_HOST = "cdn11.bigcommerce.com";

function normName(s) {
  return String(s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(
      /\b(7|inch|in|figure|action|megafig|mega|preorder|pre|order|ships|shipping|gold|label|edition|exclusive)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) {
  const stop = new Set([
    "the",
    "and",
    "with",
    "vs",
    "dc",
    "mcfarlane",
    "toys",
    "multiverse",
    "collector",
    "classic",
    "deluxe",
    "theatrical",
    "red",
    "platinum",
    "build",
    "a",
    "pack",
    "movie",
    "comics",
  ]);
  return new Set(
    normName(s)
      .split(" ")
      .filter((t) => t.length > 1 && !stop.has(t)),
  );
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function seqRatio(a, b) {
  // Simple similarity: longest common subsequence ratio (cheap enough for names)
  const s = normName(a);
  const t = normName(b);
  if (!s || !t) return 0;
  if (s === t) return 1;
  const n = s.length;
  const m = t.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] =
        s[i - 1] === t[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return (2 * dp[n][m]) / (n + m);
}

function imgSku(url) {
  const m = String(url || "").match(/\/(\d{4,6})_\d{2}/);
  return m ? m[1] : null;
}

function toPhoton(url) {
  if (!MCF_HOST_RE.test(url)) return url;
  const rest = url.replace(/^https?:\/\//i, "");
  return `https://i0.wp.com/${rest}`;
}

function toBcStencil(url) {
  // Normalize GraphQL urls to the 1280x1280 form used by existing catalog entries.
  return String(url)
    .replace("/images/stencil/original/", "/images/stencil/1280x1280/")
    .replace("/images/stencil/1280w/", "/images/stencil/1280x1280/")
    .replace(/\?.*$/, "") + "?c=1";
}

function extractStoreImages(product) {
  const edges = product?.images?.edges || [];
  const nodes = edges.map((e) => e.node).filter(Boolean);
  nodes.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  const urls = [];
  const seen = new Set();
  for (const n of nodes) {
    const raw = n.urlOriginal || n.url;
    if (!raw || !raw.includes(BC_HOST)) continue;
    const u = toBcStencil(raw);
    if (seen.has(u)) continue;
    seen.add(u);
    urls.push(u);
  }
  return urls;
}

function scoreNames(catalogName, storeName) {
  const jr = jaccard(tokens(catalogName), tokens(storeName));
  const sr = seqRatio(catalogName, storeName);
  return { jr, sr, score: Math.max(jr, sr) };
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  if (!Array.isArray(catalog)) throw new Error("catalog.json must be an array");

  let store = [];
  if (fs.existsSync(storePath)) {
    store = JSON.parse(fs.readFileSync(storePath, "utf8"));
  } else {
    console.warn(`Store cache missing at ${storePath}; Photon-only remap.`);
  }

  const byMpn = new Map();
  for (const p of store) {
    const mpn = String(p.mpn || "").trim();
    if (!mpn) continue;
    if (!byMpn.has(mpn)) byMpn.set(mpn, []);
    byMpn.get(mpn).push(p);
  }

  // First pass: find confident unique MPN matches (avoid attaching wrong photos).
  /** @type {Map<string, {store: any, score: number, method: string}>} */
  const provisional = new Map();
  for (const p of catalog) {
    const imageUrl = p.imageUrl || "";
    if (imageUrl.includes(BC_HOST)) continue;
    if (!MCF_HOST_RE.test(imageUrl) && !(p.gallery || []).some((u) => MCF_HOST_RE.test(u))) {
      continue;
    }

    // Catalog `sku` is often missing/duplicated/wrong. Prefer the MPN embedded
    // in the official image filename; only fall back to sku when no img MPN.
    const fromImg = imgSku(imageUrl);
    const sku = String(p.sku || "").trim();
    const keys = [];
    if (fromImg) {
      keys.push({ key: fromImg, source: "img_mpn" });
    } else if (sku && /^\d{4,6}$/.test(sku)) {
      keys.push({ key: sku, source: "sku" });
    }

    let best = null;
    for (const { key, source } of keys) {
      for (const sp of byMpn.get(key) || []) {
        const { score, jr, sr } = scoreNames(p.name, sp.name);
        // Require real name overlap so reused/wrong MPNs don't attach photos.
        // sku-only matches need to be stricter than filename-MPN matches.
        const minScore = source === "sku" ? 0.72 : 0.5;
        const minJr = source === "sku" ? 0.45 : 0.3;
        if (score < minScore && jr < minJr) continue;
        if (jr < 0.2 && sr < 0.6) continue;
        if (!best || score > best.score) {
          best = { store: sp, score, jr, sr, method: `${source}:${key}` };
        }
      }
    }
    if (best) provisional.set(p.id, best);
  }

  // Resolve collisions: one store product -> best catalog product only.
  const byStoreId = new Map();
  for (const [id, match] of provisional) {
    const sid = match.store.entityId;
    if (!byStoreId.has(sid)) byStoreId.set(sid, []);
    byStoreId.get(sid).push({ id, ...match });
  }
  const assigned = new Map();
  for (const [, list] of byStoreId) {
    list.sort((a, b) => b.score - a.score);
    const winner = list[0];
    assigned.set(winner.id, winner);
  }

  const report = {
    total: catalog.length,
    alreadyBigcommerce: 0,
    remappedBigcommerce: 0,
    remappedPhoton: 0,
    stillBroken: [],
    unchangedOther: 0,
    examples: { bigcommerce: [], photon: [] },
    bigcommerceMatches: [],
  };

  for (const p of catalog) {
    const beforeImage = p.imageUrl || "";
    const beforeGallery = Array.isArray(p.gallery) ? [...p.gallery] : [];

    if (beforeImage.includes(BC_HOST)) {
      report.alreadyBigcommerce++;
      continue;
    }

    const match = assigned.get(p.id);
    if (match) {
      const imgs = extractStoreImages(match.store);
      if (imgs.length) {
        p.imageUrl = imgs[0];
        p.gallery = imgs;
        report.remappedBigcommerce++;
        report.bigcommerceMatches.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          method: match.method,
          score: Number(match.score.toFixed(3)),
          storeName: match.store.name,
          storeMpn: match.store.mpn,
          storePath: match.store.path,
          beforeHost: "mcfarlane.com",
          afterHost: BC_HOST,
          imageCount: imgs.length,
        });
        if (report.examples.bigcommerce.length < 5) {
          report.examples.bigcommerce.push({
            name: p.name,
            before: beforeImage,
            after: p.imageUrl,
          });
        }
        continue;
      }
    }

    // Photon fallback for mcfarlane.com hosts
    let changed = false;
    if (MCF_HOST_RE.test(beforeImage)) {
      p.imageUrl = toPhoton(beforeImage);
      changed = true;
    }
    if (beforeGallery.length) {
      const next = beforeGallery.map((u) => {
        if (MCF_HOST_RE.test(u)) {
          changed = true;
          return toPhoton(u);
        }
        return u;
      });
      p.gallery = next;
    }

    if (changed) {
      report.remappedPhoton++;
      if (report.examples.photon.length < 5) {
        report.examples.photon.push({
          name: p.name,
          before: beforeImage,
          after: p.imageUrl,
        });
      }
    } else if (/mcfarlane\.com/i.test(beforeImage)) {
      report.stillBroken.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        imageUrl: beforeImage,
      });
    } else {
      report.unchangedOther++;
    }
  }

  // Residual direct mcfarlane.com hosts (no store match and not Photon-rewritten).
  // These are left unchanged when origin files themselves are missing/broken.
  for (const p of catalog) {
    const urls = [p.imageUrl, ...(p.gallery || [])].filter(Boolean);
    for (const u of urls) {
      if (MCF_HOST_RE.test(u)) {
        if (!report.stillBroken.some((x) => x.id === p.id && x.imageUrl === u)) {
          report.stillBroken.push({
            id: p.id,
            name: p.name,
            sku: p.sku,
            imageUrl: u,
            note: "residual mcfarlane.com host after remap",
          });
        }
      }
    }
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog));
  const outDir = path.join(root, "scripts");
  const reportPath = path.join(outDir, "remap-catalog-images-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        total: report.total,
        alreadyBigcommerce: report.alreadyBigcommerce,
        remappedBigcommerce: report.remappedBigcommerce,
        remappedPhoton: report.remappedPhoton,
        stillBroken: report.stillBroken.length,
        reportPath,
      },
      null,
      2,
    ),
  );
}

main();
