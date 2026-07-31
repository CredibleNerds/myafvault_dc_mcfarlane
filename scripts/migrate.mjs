#!/usr/bin/env node
/**
 * Deploy-time database migrator (node-postgres, `pg`).
 *
 * Runs during `npm run build` — on every Vercel deploy — applying pending files
 * in ../migrations to the Postgres URL. Each file is applied in one transaction
 * and recorded in a `_migrations` table, so it runs once and is safe to re-run.
 *
 * Accepts (first non-empty wins):
 *   DATABASE_URL | POSTGRES_URL | POSTGRES_PRISMA_URL | POSTGRES_URL_NON_POOLING
 * (Vercel Supabase integration sets the POSTGRES_* names.)
 *
 * No URL (local / preview builds) -> skip; the PGLite fallback applies the same
 * files at startup instead (see src/lib/db.ts).
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

function resolveDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (value) return value;
  }
  return undefined;
}

/**
 * Supabase connection strings often include sslmode=require, which node-pg
 * currently treats as verify-full → SELF_SIGNED_CERT_IN_CHAIN on Vercel.
 * Strip sslmode and set ssl.rejectUnauthorized=false instead.
 */
function poolConfig(connectionString) {
  let url = connectionString;
  try {
    const u = new URL(connectionString);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("ssl");
    url = u.toString();
  } catch {
    /* keep raw */
  }
  return {
    connectionString: url,
    max: 1,
    ssl: { rejectUnauthorized: false },
  };
}

const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
  console.log(
    "[migrate] No DATABASE_URL / POSTGRES_URL — skipping (PGLite migrates itself in preview).",
  );
  process.exit(0);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function main() {
  const pool = new pg.Pool(poolConfig(databaseUrl));
  const client = await pool.connect();
  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const applied = new Set(
      (await client.query("SELECT name FROM _migrations")).rows.map((r) => r.name),
    );

    let files;
    try {
      files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
        console.log("[migrate] No migrations/ directory — nothing to apply.");
        return;
      }
      throw err;
    }

    for (const name of files) {
      if (applied.has(name)) {
        console.log(`[migrate] skip ${name} (already applied)`);
        continue;
      }
      const sql = await readFile(join(migrationsDir, name), "utf8");
      console.log(`[migrate] apply ${name}…`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
        console.log(`[migrate] applied ${name}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
    console.log("[migrate] done");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
