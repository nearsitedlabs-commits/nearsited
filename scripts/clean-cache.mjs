#!/usr/bin/env node

/**
 * clean-cache.mjs
 *
 * Clears Next.js build/dev caches that can grow unboundedly (especially
 * Turbopack's persistent cache, which once reached 927 MB in this project).
 *
 * Usage:
 *   node scripts/clean-cache.mjs       # removes .next only
 *   node scripts/clean-cache.mjs --all # also removes node_modules/.cache
 */

import { existsSync, statSync, readdirSync } from "fs";
import { rm } from "fs/promises";
import { resolve, join } from "path";

const ROOT = resolve(import.meta.dirname, "..");

async function getDirSize(dir) {
  let size = 0;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        size += await getDirSize(fullPath);
      } else if (entry.isFile()) {
        size += statSync(fullPath).size;
      }
    }
  } catch {
    // Directory might not exist or be inaccessible
  }
  return size;
}

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  const args = process.argv.slice(2);
  const cleanAll = args.includes("--all");

  // ── .next ──────────────────────────────────────────────────────────────
  const nextDir = join(ROOT, ".next");
  if (existsSync(nextDir)) {
    const size = await getDirSize(nextDir);
    console.log(`📁 .next cache: ${formatMB(size)}`);
    await rm(nextDir, { recursive: true, force: true });
    console.log("   ✅ Removed .next/");
  } else {
    console.log("📁 .next cache: not found");
  }

  // ── node_modules/.cache (--all only) ────────────────────────────────────
  if (cleanAll) {
    const nmCacheDir = join(ROOT, "node_modules", ".cache");
    if (existsSync(nmCacheDir)) {
      const size = await getDirSize(nmCacheDir);
      console.log(`📁 node_modules/.cache: ${formatMB(size)}`);
      await rm(nmCacheDir, { recursive: true, force: true });
      console.log("   ✅ Removed node_modules/.cache/");
    } else {
      console.log("📁 node_modules/.cache: not found");
    }
  }

  console.log("\n✨ Cache cleaned. Run `npm run dev` to start fresh.");
}

main().catch((err) => {
  console.error("Clean failed:", err);
  process.exit(1);
});
