#!/usr/bin/env node
/**
 * Every page in exactly one shard: for each weighted check the CI workflow shards (test:a11y, test:motion), read its
 * --shard k/n jobs from .github/workflows/gallery.yml, deal routes() as each job would (shard.mjs, page-costs.json) and
 * fail if a job is missing or doubled, or a page lands in no shard or in two. It prints each shard's measured load, so
 * a drift shows before CI does. Part of verify; needs no build and no browser.
 *
 *   npm run test:shards
 *   npm run test:shards -- --self-test     drops a job, doubles a job, loses a page and doubles a page; fails on a miss
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routes } from "./routes.mjs";
import { costsOf, deal, parseShard, weigh } from "./shard.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const WORKFLOW = fs.readFileSync(path.join(here, "..", "..", ".github", "workflows", "gallery.yml"), "utf8");
const CHECKS = { "test:a11y": "a11y", "test:motion": "motion" };
const ALL = routes();

/** The problems with the workflow's shards of every weighted check, printing each shard's load unless quiet. */
function problems(workflow, { dealer = deal, quiet = false } = {}) {
  const all = ALL;
  const out = [];
  const fail = (msg) => out.push(msg);
  for (const [script, check] of Object.entries(CHECKS)) {
    const jobs = [...workflow.matchAll(new RegExp(`npm run ${script} --prefix gallery -- --shard (\\d+/\\d+)`, "g"))].map((m) => parseShard(m[1]));
    if (!jobs.length) { fail(`${script}: no --shard k/n job in gallery.yml`); continue; }
    const n = jobs[0].shards;
    if (jobs.some((j) => j.shards !== n)) { fail(`${script}: jobs disagree on n (${jobs.map((j) => `${j.shard}/${j.shards}`).join(", ")})`); continue; }
    const ks = jobs.map((j) => j.shard).sort((a, b) => a - b);
    if (ks.join() !== Array.from({ length: n }, (_, i) => i + 1).join()) fail(`${script}: shards ${ks.join(", ")} of ${n}, want each of 1 to ${n} once`);

    const costs = costsOf(check);
    const bins = dealer(all, { shards: n, costs });
    const seen = new Map();
    bins.forEach((b, i) => b.pages.forEach((p) => seen.set(p, [...(seen.get(p) ?? []), i + 1])));
    for (const p of all) if ((seen.get(p) ?? []).length !== 1) fail(`${script}: ${p} is in shard(s) ${(seen.get(p) ?? []).join(", ") || "none"}`);
    if (seen.size !== new Set(all).size) fail(`${script}: the shards hold ${seen.size} pages, routes() has ${new Set(all).size}`);

    const unmeasured = all.filter((p) => !(costs[p] > 0));
    const total = weigh(all, costs).reduce((a, b) => a + b, 0);
    const loads = bins.map((b) => b.load);
    if (!quiet) console.log(`${script}: ${all.length} pages in ${n} shards, each once; tab-seconds per shard ${loads.map((l) => Math.round(l)).join(", ")} (ideal ${Math.round(total / n)})${unmeasured.length ? `; ${unmeasured.length} pages not measured yet, weighed at the median` : ""}.`);
  }

  return out;
}

if (process.argv.includes("--self-test")) {
  const breaks = {
    "a job dropped": WORKFLOW.replace(/^.*test:a11y --prefix gallery -- --shard 3\/\d+.*\n/m, ""),
    "a job doubled": WORKFLOW.replace("test:motion --prefix gallery -- --shard 2/", "test:motion --prefix gallery -- --shard 1/"),
    "a page lost": [WORKFLOW, { dealer: (pages, o) => deal(pages.slice(1), o) }],
    "a page in two shards": [WORKFLOW, { dealer: (pages, o) => { const bins = deal(pages, o); bins[1].pages.push(bins[0].pages[0]); return bins; } }],
  };
  let missed = 0;
  for (const [name, b] of Object.entries(breaks)) {
    const [workflow, opts] = Array.isArray(b) ? b : [b, {}];
    if (workflow === WORKFLOW && !Array.isArray(b)) { console.log(`✗ self-test: could not inject "${name}" (the workflow changed shape)`); missed++; continue; }
    const found = problems(workflow, { ...opts, quiet: true });
    if (found.length) console.log(`✓ self-test: ${name} is caught: ${found[0]}`);
    else { console.log(`✗ self-test: ${name} is missed`); missed++; }
  }
  process.exit(missed ? 1 : 0);
}

const found = problems(WORKFLOW);
for (const f of found) console.log(`✗ ${f}`);
process.exit(found.length ? 1 : 0);
