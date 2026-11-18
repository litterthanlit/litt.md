/**
 * Shards weighted by what each page costs, for the page checks that take --shard k/n (a11y.mjs, reduced-motion.mjs).
 *
 * Dealing pages round-robin left a few heavy pages (Device's recorder, the overlays, the mosaics) stacked in one shard,
 * so one job ran twice as long as the rest. Each page now weighs what it took last time it was measured
 * (page-costs.json, seconds a page takes in one of the check's tabs, summed over its themes and viewports), and the
 * pages are dealt longest first, each to the shard with the least so far (LPT). A page the file does not know yet
 * weighs the median, so a new page never breaks a run; re-measure when the shards drift (--record-costs).
 *
 * The split is a pure function of the page list and the file: every shard computes the same one, so each page lands
 * in exactly one shard. Ties break on the page's place in routes(), then on the lowest shard.
 *
 *   import { shardOf, costsOf, recordCosts } from "./shard.mjs";
 *   const { shard, shards } = parseShard("2/6");
 *   shardOf(routes(), { shard, shards, costs: costsOf("a11y") })   the pages of shard 2, longest first
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const COSTS_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "page-costs.json");

/** "k/n" to { shard: k, shards: n }, refusing anything that would skip or repeat a page. */
export function parseShard(arg = "1/1") {
  const [shard, shards] = String(arg).split("/").map(Number);
  if (!Number.isInteger(shard) || !Number.isInteger(shards) || shards < 1 || shard < 1 || shard > shards) {
    throw new Error(`--shard ${arg}: expected k/n with 1 <= k <= n.`);
  }
  return { shard, shards };
}

/** The measured seconds per page for one check ("a11y", "motion"), or {} when it has never been measured. */
export function costsOf(check) {
  if (!fs.existsSync(COSTS_FILE)) return {};
  return JSON.parse(fs.readFileSync(COSTS_FILE, "utf8"))[check] ?? {};
}

/** Every page's weight: its measured cost, or the median of the measured pages when it has none (1 with none at all). */
export function weigh(pages, costs) {
  const known = pages.map((p) => costs[p]).filter((c) => typeof c === "number" && c > 0).sort((a, b) => a - b);
  const median = known.length ? known[Math.floor(known.length / 2)] : 1;
  return pages.map((p) => (typeof costs[p] === "number" && costs[p] > 0 ? costs[p] : median));
}

/** Deals every page to one of `shards` bins, longest first, each to the lightest bin. Returns the bins, each longest first. */
export function deal(pages, { shards, costs }) {
  const weights = weigh(pages, costs);
  const order = pages.map((_, i) => i).sort((a, b) => weights[b] - weights[a] || a - b);
  const bins = Array.from({ length: shards }, () => ({ load: 0, pages: [] }));
  for (const i of order) {
    let best = 0;
    for (let b = 1; b < shards; b++) if (bins[b].load < bins[best].load) best = b;
    bins[best].load += weights[i];
    bins[best].pages.push(pages[i]);
  }
  return bins;
}

/** The pages of shard k of n, longest first, so a shard's queue ends on its quickest pages and no tab idles long. */
export function shardOf(pages, { shard, shards, costs }) {
  return deal(pages, { shards, costs })[shard - 1].pages;
}

/** Merges measured seconds per page into page-costs.json under `check`, rounded to a tenth, keys sorted. */
export function recordCosts(check, measured) {
  const all = fs.existsSync(COSTS_FILE) ? JSON.parse(fs.readFileSync(COSTS_FILE, "utf8")) : {};
  const merged = { ...(all[check] ?? {}) };
  for (const [page, s] of Object.entries(measured)) merged[page] = Math.round(s * 10) / 10;
  all[check] = Object.fromEntries(Object.keys(merged).sort().map((k) => [k, merged[k]]));
  const out = Object.fromEntries(Object.keys(all).sort().map((k) => [k, all[k]]));
  fs.writeFileSync(COSTS_FILE, JSON.stringify(out, null, 2) + "\n");
}
