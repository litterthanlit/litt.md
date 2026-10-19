#!/usr/bin/env node
/**
 * Copy litt.md's tokens into the gallery. litt.md stays the single source of
 * truth: never edit src/styles/tokens.css or src/styles/litt.css by hand.
 * Both files are generated and gitignored. predev, prebuild and verify run
 * this script, so the gallery can never ship stale tokens.
 *
 *   node scripts/sync-tokens.mjs            copy from the repo root (or $LITT_MD)
 *   node scripts/sync-tokens.mjs --check    fail if the copies have drifted
 *
 * litt.css is litt.md's tailwind.css with strict mode switched on, so
 * off-system utilities (rounded-lg, font-semibold, text-sm, bg-blue-500,
 * shadow-md) do not exist in the gallery at all.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// gallery/ sits at the root of the litt.md repo, so the skill is one level up.
const littMd = path.resolve(process.env.LITT_MD || path.join(root, ".."));
const assets = path.join(littMd, "skills", "litt-md", "assets");
const check = process.argv.includes("--check");

const banner = (src) => `/* Synced from litt.md (${src}) by scripts/sync-tokens.mjs. Do not edit here. */\n`;

const tokens = banner("skills/litt-md/assets/tokens.css") + fs.readFileSync(path.join(assets, "tokens.css"), "utf8");

let tw = fs.readFileSync(path.join(assets, "tailwind.css"), "utf8");
const strictOff = /\/\* Opt-in strict mode[\s\S]*?\n@theme \{([\s\S]*?)\}\n\*\//;
const m = tw.match(strictOff);
if (!m) throw new Error("tailwind.css: strict-mode block not found; update sync-tokens.mjs");
tw = tw.replace(strictOff, `/* Strict mode (on in the gallery): off-system utilities do not exist. */\n@theme {${m[1].replace("--font-weight-*: initial;", "--text-*: initial;\n  --font-weight-*: initial;")}}`);
const litt = banner("skills/litt-md/assets/tailwind.css, strict mode on") + tw;

const out = [["src/styles/tokens.css", tokens], ["src/styles/litt.css", litt]];
let drift = 0;
for (const [rel, text] of out) {
  const dest = path.join(root, rel);
  if (check) {
    const cur = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : "";
    if (cur !== text) { drift++; console.log(`✗ ${rel} differs from litt.md`); } else console.log(`✓ ${rel}`);
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, text);
    console.log(`synced ${rel}`);
  }
}
process.exit(drift ? 1 : 0);
