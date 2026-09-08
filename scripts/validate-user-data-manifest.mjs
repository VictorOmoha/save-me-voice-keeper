#!/usr/bin/env node
/**
 * SAVE-001 — user-data manifest validator.
 *
 * Fails (exit 1) when the source references a user-owned Firestore collection
 * or Storage path that is NOT present in docs/hardening/user-data-manifest.json.
 *
 * Static source scan only — appropriate for M0. It does not execute code and
 * does not verify production state.
 *
 * Usage:
 *   node scripts/validate-user-data-manifest.mjs
 *
 * Exit codes:
 *   0 — manifest covers every source-referenced user-owned location
 *   1 — one or more source-referenced locations are missing from the manifest
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(REPO_ROOT, "docs", "hardening", "user-data-manifest.json");

// Collections that are intentionally not user-owned and may be absent from the
// manifest without failing validation. (They are still listed in the manifest
// for completeness, but a missing entry here is not an error.)
const NON_USER_OWNED = new Set([
  "public_demo_videos",
  "demo_videos",
  "waiting_list",
]);

// File extensions we scan for source references.
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

// Directories that contain application source (not build output, not deps).
const SOURCE_DIRS = ["src", "functions/src", "browser-extension"];

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`ERROR: manifest not found at ${MANIFEST_PATH}`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  } catch (err) {
    console.error(`ERROR: manifest is not valid JSON: ${err.message}`);
    process.exit(1);
  }
}

function collectSourceFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "lib" || entry.name === "dist") continue;
      out.push(...collectSourceFiles(full));
    } else if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

// Extract candidate collection names from a source file's text.
// Matches: collection("name"), collection(db, "name"), doc(db, "name", ...)
// and the admin-side equivalents db.collection("name") / .doc("name").
function extractCollectionReferences(text) {
  const found = new Set();
  const patterns = [
    /collection\(\s*["'`]([a-zA-Z0-9_/-]+)["'`]/g,
    /collection\(\s*db\s*,\s*["'`]([a-zA-Z0-9_/-]+)["'`]/g,
    /doc\(\s*db\s*,\s*["'`]([a-zA-Z0-9_/-]+)["'`]/g,
    /\.collection\(\s*["'`]([a-zA-Z0-9_/-]+)["'`]/g,
    /\.doc\(\s*["'`]([a-zA-Z0-9_/-]+)["'`]/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      // Take the first path segment as the collection name.
      const first = m[1].split("/")[0];
      if (first) found.add(first);
    }
  }
  return found;
}

// Extract candidate Storage path prefixes from source.
// Matches template literals like `images/${user.uid}/...` or string literals
// starting with a known top-level prefix.
function extractStorageReferences(text) {
  const found = new Set();
  const patterns = [
    /["'`]((?:images|documents|demo-videos)\/[^"'`]*)["'`]/g,
    /ref\(\s*storage\s*,\s*["'`]([^"'`]+)["'`]/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      // Capture a leading literal segment before any template placeholder, e.g.
      // `images/${user.uid}/...` → "images". Skip if there is no literal prefix.
      const literalMatch = m[1].match(/^([a-zA-Z0-9_-]+)\//);
      if (!literalMatch) continue;
      found.add(literalMatch[1]);
    }
  }
  return found;
}

function main() {
  const manifest = readManifest();
  const manifestLocations = new Set(manifest.entries.map((e) => e.location));

  const referencedCollections = new Set();
  const referencedStorage = new Set();

  for (const dir of SOURCE_DIRS) {
    const abs = path.join(REPO_ROOT, dir);
    for (const file of collectSourceFiles(abs)) {
      const text = fs.readFileSync(file, "utf8");
      for (const c of extractCollectionReferences(text)) referencedCollections.add(c);
      for (const s of extractStorageReferences(text)) referencedStorage.add(s);
    }
  }

  const missing = [];

  for (const col of referencedCollections) {
    if (NON_USER_OWNED.has(col)) continue;
    if (!manifestLocations.has(col)) {
      missing.push({ type: "firestoreCollection", location: col });
    }
  }

  for (const prefix of referencedStorage) {
    // Storage prefixes are represented in the manifest as "<prefix>/..." entries.
    const covered = [...manifestLocations].some(
      (loc) => loc === prefix || loc.startsWith(prefix + "/")
    );
    if (!covered && !NON_USER_OWNED.has(prefix)) {
      missing.push({ type: "storagePrefix", location: prefix });
    }
  }

  if (missing.length > 0) {
    console.error("FAIL — source references user-owned locations not present in the manifest:");
    for (const m of missing) {
      console.error(`  - [${m.type}] ${m.location}`);
    }
    console.error(`\nAdd entries to ${path.relative(REPO_ROOT, MANIFEST_PATH)} or mark them non-user-owned.`);
    process.exit(1);
  }

  console.log(
    `OK — manifest covers ${referencedCollections.size} source-referenced collections and ${referencedStorage.size} storage prefixes.`
  );
  process.exit(0);
}

main();
