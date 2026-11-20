#!/usr/bin/env node
/**
 * World words: a world's pages say only what is true of that world (plans/audits/heat.md, finding 2). Each part has a
 * shared lede and How it moves, first written for Press; a world gives its own in meta (`ledeByWorld`, `movesByWorld`,
 * kit.tsx). This reads the words a visitor meets in a world and fails on another world's material words.
 *
 *   npm run build && npm run test:words
 *   node scripts/world-words.mjs --pages heat/menu,heat     exact addresses, or a part's id in the world
 *   node scripts/world-words.mjs --shard 1/2                every other page
 *   node scripts/world-words.mjs --self-test                puts "a glass dropdown" back in #heat/button and on the
 *                                                           player's Home; fails if either is missed
 *
 * Heat for now (WORDS): every #heat/* page and the player's Home, at 1440 by 1000, with Variants closed (it reads what
 * a visitor sees first, so `openVariants` is not called). It reads the text of `main` that is rendered (shown, or said to
 * a screen reader), and leaves out content, which is not copy: code (`pre`, `code`) and the Props tables, whose words
 * are the component's own types and JSDoc. A word counts whole, with its plain endings (glass and glassy, cast and
 * casts): "broadcast" is not "cast".
 *
 * A page not yet rewritten sits in KNOWN with the word it still says and why: it prints, and it fails the run when it
 * stops happening, so the entry goes when the words are fixed.
 *
 * Needs Playwright, found as a11y.mjs finds it (A11Y_TOOLS, then here, then the cloud container's global copy).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { routes } from "./routes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const dist = path.resolve(get("dist", "dist"));
const selfTest = args.includes("--self-test");
const [shard, shards] = get("shard", "1/1").split("/").map(Number);
const CONCURRENCY = Number(get("concurrency", "4"));

/**
 * Each world checked, and the words that belong to the other worlds' materials, never to it. Heat is black and flat:
 * nothing is glass, casts, glows, stands raised, sinks or is a pill (proposals/heat.md, the values; litt-principles.md,
 * Heat). Each word with its plain endings, matched whole and in any case.
 */
const WORDS = {
  heat: {
    glass: /\bglass(?:es|y)?\b/i,
    cast: /\bcast(?:s|ing)?\b/i,
    glow: /\bglow(?:s|ed|ing)?\b/i,
    /* Not "raised to 25,000 USD" or "raised by", which is a number going up, not a block standing proud. */
    raised: /\braised\b(?!\s+(?:to|by)\b)/i,
    sinks: /\b(?:sinks?|sinking|sunk(?:en)?)\b/i,
    pill: /\bpills?\b/i,
  },
};

/**
 * A clause that says a material is absent is true of the world: Heat's About says "nothing casts or glows". From a
 * word of absence to the clause's end is dropped before the words are read.
 */
const ABSENT = /\b(?:no|not|none|nothing|never)\b[^.;:,]*/gi;

/** What is content, not copy: code, and the Props tables (gen-docs reads them from the component's types and JSDoc). */
const CONTENT = 'pre, code, section[aria-labelledby="props"]';

/*
 * Pages whose words are not yet the world's: the page, the word and why. Each prints; one that stops happening fails,
 * so take it out when the words are fixed.
 */
const ABOUT = "About is the shared summary, written for Press, with no summaryByWorld for Heat";
const DOCS = "the docs (Use when, Skip when, Accessibility) are shared and written for Press";
const STUDY = "the study's How it moves or Anatomy is shared, with no movesByWorld for Heat";
const NAME = "the part is called Glass header";
const k = (page, words, ...why) => ({ page: `heat/${page}`, words, why: why.join("; ") });
const KNOWN = [
  k("action-bar", ["glass"], ABOUT),
  k("app-shell", ["glass"], ABOUT),
  k("avatar", ["pill"], DOCS),
  k("breadcrumb", ["glass"], NAME),
  k("button", ["cast", "sinks"], DOCS),
  k("callout", ["raised"], ABOUT, DOCS),
  k("card", ["glass", "raised"], ABOUT, DOCS),
  k("card-picker", ["raised"], DOCS),
  k("code-input", ["glass", "pill", "raised"], STUDY),
  k("combobox", ["glass", "raised"], ABOUT, DOCS),
  k("components", ["glass"], NAME),
  k("context-menu", ["glass"], ABOUT),
  k("dialog", ["glass"], DOCS),
  k("file-changes", ["raised"], ABOUT),
  k("header", ["glass", "raised"], NAME, ABOUT, DOCS),
  k("inspector", ["glass"], ABOUT),
  k("kbd", ["cast", "raised"], ABOUT, DOCS),
  k("list", ["raised"], ABOUT),
  k("message", ["raised"], ABOUT),
  k("number-field", ["raised", "sinks"], ABOUT),
  k("option-picker", ["pill", "raised"], ABOUT),
  k("pad", ["sinks"], ABOUT),
  k("pagination", ["pill", "raised"], ABOUT, DOCS),
  k("plan", ["raised"], DOCS),
  k("popover", ["glass"], ABOUT, DOCS),
  k("price", ["raised"], DOCS),
  k("range-chart", ["raised"], ABOUT, "its Anatomy names the raised segment"),
  k("rule-builder", ["raised"], ABOUT),
  k("run-card", ["raised"], ABOUT),
  k("run-list", ["raised"], ABOUT, DOCS),
  k("segmented", ["raised"], DOCS),
  k("select", ["glass"], DOCS),
  k("slide-confirm", ["pill", "raised"], STUDY),
  k("switch", ["cast", "pill", "raised", "sinks"], ABOUT, STUDY),
  k("tag", ["pill", "raised"], ABOUT, DOCS),
  k("token-input", ["pill"], ABOUT),
  k("tune", ["pill"], "the demo names litt's radius scale, whose last step is the pill"),
];
const knownFor = (f) => KNOWN.find((k) => k.page === f.id && k.words.includes(f.word));

const roots = [process.env.A11Y_TOOLS, path.join(here, ".."), "/opt/node22/lib"].filter(Boolean);
function resolveTool(id) {
  for (const root of roots) {
    try { return createRequire(path.join(root, "noop.js")).resolve(id); } catch { /* next root */ }
  }
  throw new Error(`${id} not found. Install it next to the gallery (npm i --no-save ${id}) or point A11Y_TOOLS at a folder that has it.`);
}
const { chromium } = createRequire(import.meta.url)(resolveTool("playwright"));

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error(`No build at ${path.relative(process.cwd(), dist) || "."}. Run npm run build first.`);
  process.exit(1);
}

/* Every address in a checked world: its player, About, gallery view, own pages and every part in it. */
const worlds = Object.keys(WORDS);
const only = (get("pages", selfTest ? "heat/button,heat" : "") || "").split(",").filter(Boolean);
const inWorlds = routes().filter((r) => worlds.includes(r.split("/")[0]));
const chosen = only.length ? inWorlds.filter((r) => only.includes(r) || only.some((o) => !o.includes("/") && r.endsWith(`/${o}`))) : inWorlds;
const pages = chosen.filter((_, i) => i % shards === shard - 1);
if (!pages.length) { console.error("No pages matched."); process.exit(1); }

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

/* Read in the page: every rendered run of copy in main, as [text, whether the self-test put it there]. */
function read(content) {
  const main = document.querySelector("main");
  if (!main) return [];
  const out = [];
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    const text = n.textContent.replace(/\s+/g, " ").trim();
    if (!el || !text || el.closest(content)) continue;
    if (!el.checkVisibility({ visibilityProperty: true })) continue;
    /* Where it is said: the section's heading (About, Use when, Accessibility…), or the stage above them. */
    const heading = el.closest("section:has(> h2)")?.querySelector(":scope > h2")?.textContent.trim();
    out.push([text, !!el.closest("[data-words-self-test]"), heading || "the stage"]);
  }
  return out;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark", reducedMotion: "reduce" });
if (selfTest) {
  await ctx.addInitScript(() => {
    new MutationObserver((_, obs) => {
      const main = document.querySelector('main h1, main [data-play-take="home"]') && document.querySelector("main");
      if (!main) return;
      obs.disconnect();
      const p = document.createElement("p");
      p.setAttribute("data-words-self-test", "");
      p.textContent = "A glass dropdown with one gliding highlight.";
      main.append(p);
    }).observe(document, { childList: true, subtree: true });
  });
}

const found = [];
async function checkPage(id) {
  const world = id.split("/")[0];
  const pg = await ctx.newPage();
  try {
    await pg.goto(`http://localhost:${port}/index.html#${id}`, { waitUntil: "domcontentloaded" });
    /* The player has no h1 in main: it opens on Home, inside its screen. */
    await pg.waitForSelector(id === world ? 'main [data-play-take="home"]' : "main h1", { timeout: 15_000 });
    await pg.waitForLoadState("networkidle");
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(300);
    for (const [text, injected, where] of await pg.evaluate(read, CONTENT)) {
      const said = text.replace(ABSENT, " ");
      for (const [word, re] of Object.entries(WORDS[world])) {
        const m = re.exec(said);
        if (m) found.push({ id, word, injected, what: `"${m[0]}" under ${where}: "${text.length > 90 ? text.slice(0, 87) + "…" : text}"` });
      }
    }
  } catch (e) {
    found.push({ id, word: "", injected: false, what: `running the check: ${String(e.message || e).split("\n")[0]}` });
  }
  await pg.close();
}

const started = Date.now();
const queue = [...pages];
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
  while (queue.length) await checkPage(queue.shift());
}));
await browser.close();
server.close();
const took = `${Math.round((Date.now() - started) / 1000)}s`;

if (selfTest) {
  const caught = new Set(found.filter((f) => f.injected && f.word === "glass").map((f) => f.id));
  const missed = pages.filter((id) => !caught.has(id));
  const broken = found.filter((f) => !f.word);
  console.log(`words self-test: "a glass dropdown" was caught on ${caught.size} of ${pages.length} pages (${took}).`);
  for (const f of broken) console.log(`✗ ${f.id}: ${f.what}`);
  if (missed.length) console.log(`✗ not caught on ${missed.join(", ")}: the check has gone blind.`);
  process.exit(missed.length || broken.length ? 1 : 0);
}

const known = found.filter(knownFor);
const fresh = found.filter((f) => !knownFor(f));
for (const k of KNOWN.filter((k) => pages.includes(k.page))) {
  const hits = known.filter((f) => knownFor(f) === k);
  const gone = k.words.filter((w) => !hits.some((f) => f.word === w));
  if (hits.length) console.log(`· known, ${k.page} says ${k.words.filter((w) => !gone.includes(w)).join(", ")} (${hits.length}): ${k.why}.`);
  for (const w of gone) fresh.push({ id: k.page, word: w, what: `the known word "${w}" no longer shows (${k.why}): take it out of KNOWN` });
}
const scope = `${pages.length} pages in ${worlds.join(", ")}${shards > 1 ? ` (shard ${shard}/${shards})` : ""}`;
if (!fresh.length) {
  console.log(`words: ${scope}, no other world's material words${known.length ? " but the known ones" : ""} (${took}).`);
  process.exit(0);
}
for (const f of fresh) console.log(`✗ ${f.id}: ${f.what}`);
console.log(`\nwords: ${new Set(fresh.map((f) => f.id)).size} of ${pages.length} pages say another world's material words.`);
process.exit(1);
