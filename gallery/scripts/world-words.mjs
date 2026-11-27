#!/usr/bin/env node
/**
 * World words: a world's pages say only what is true of that world (plans/audits/heat.md, finding 2; shared-fixes.md,
 * Track 1). Each part has shared lines, first written for Press; a world gives its own in meta (`ledeByWorld`,
 * `summaryByWorld`, `movesByWorld`), in docs (`useByWorld`, `skipByWorld`, `a11yByWorld`) and in a study
 * (`partsByWorld`), all in kit.tsx. This reads the words a visitor meets in a world and fails on another world's
 * material words, or on another world named ("In Flat…").
 *
 *   npm run build && npm run test:words
 *   node scripts/world-words.mjs --worlds flat,rack        some worlds only
 *   node scripts/world-words.mjs --pages heat/menu,heat     exact addresses, or a part's id in the world
 *   node scripts/world-words.mjs --shard 1/2                every other page
 *   node scripts/world-words.mjs --json found.json          also writes every hit, for working through them
 *   node scripts/world-words.mjs --self-test                puts a sentence of Press's materials back on every world's
 *                                                           Button page (Plain's Select) and player's Home; fails unless
 *                                                           each world's expected word and another world named are
 *                                                           caught there, and not held by KNOWN
 *
 * Every world (WORDS): every page under #<world> and the player's Home, at 1440 by 1000, with Variants closed (it reads what
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

/* The words, each with its plain endings, matched whole and in any case. */
const W = {
  glass: /\bglass(?:es|y)?\b/i,
  cast: /\bcast(?:s|ing)?\b/i,
  glow: /\bglow(?:s|ed|ing)?\b/i,
  /* Not "raised to 25,000 USD" or "raised by", a number going up, nor Tag's "raised prop", a name in code. */
  raised: /\braised\b(?!\s+(?:to|by|prop)\b)/i,
  sinks: /\b(?:sinks?|sinking|sunk(?:en)?)\b/i,
  pill: /\bpills?\b/i,
  plate: /\bplates?\b/i,
  tray: /\btrays?\b/i,
  bezel: /\bbezels?\b/i,
  stone: /\bstone\b/i,
  /* A round cap you hold, not a keyboard's "key cap", "caps lock", "a cap on the list" (a limit) or a stroke's "round caps and joins". */
  cap: /(?<!\bkey\s)\bcaps?\b(?!\s+(?:lock|on|and\s+joins)\b)/i,
  /* Not "as well", "well-made" or "well known". */
  glides: /\bglid(?:e|es|ed|ing)\b/i,
  /* A part that springs back, not a spring as the subject (the Spring editor's, a motion token's). */
  springs: /\bspring(?:s|ing)\s+back\b|\bspringing\b/i,
  /* Thrown along a tray, not an error a call throws. */
  thrown: /\bthrown\b/i,
  floats: /\bfloat(?:s|ing)\b/i,
  leans: /\blean(?:s|ing)?\b/i,
  "half a pixel": /\bhalf a pixel\b/i,
  /* Device's hardware, which Flat's studies dropped (taste v1.22): a figure stands on the paper, it is not read off a
     panel. A readout and an LCD are a device's; a reel turns tape ("reels of film" is a thing a post is about); a needle
     swings on a meter ("a needle in a haystack" is an idiom); letters scramble on a display ("scrambled eggs" are food). */
  readout: /\breadouts?\b/i,
  LCD: /\bLCDs?\b/,
  reel: /\breels?\b(?!\s+of\s+film\b)/i,
  needle: /\bneedles?\b(?!\s+in\s+a\s+haystack\b)/i,
  scramble: /\bscrambl(?:e|es|ed|ing)\b(?!\s+eggs?\b)/i,
};
const pick = (...names) => Object.fromEntries(names.map((n) => [n, W[n]]));
/* Another world named on a page in this one ("In Flat there is no block…"): a world's page shows itself only. */
const NAMES = { press: "Press", flat: "Flat", device: "Device", plain: "Plain", rack: "Rack", heat: "Heat" };
const others = (self) => ({
  "another world": new RegExp(`\\b(?:[Ii]n|[Uu]nder|[Oo]n)\\s+(?:${Object.keys(NAMES).filter((w) => w !== self).map((w) => NAMES[w]).join("|")})\\b`),
});

/**
 * Each world checked, and the words that belong to the other worlds' materials, never to it (litt-principles.md, each
 * world's own; plans/audits, each world's finding on its words).
 * - Heat is black and flat: nothing is glass, casts, glows, stands raised, sinks or is a pill (proposals/heat.md).
 * - Flat has no edges, lines or depth: paper on grey, pills and circles, nothing cast but what floats (flat.md, 1), and
 *   no hardware: no readout, LCD, reel, needle or scramble (the studies, taste v1.22).
 * - Rack follows Live: values in boxes, nothing travels, eases or sinks (rack.md, 2).
 * - Device is plates, wells, keys and glass, so those are its own; Press's tray, cast and pill are not (device.md, 3).
 * - Plain has no UI and nothing moves (plain.md, 2).
 * - Press is its own; its pages must not go on to describe another world's body (press.md, 8).
 */
const WORDS = {
  press: others("press"),
  flat: { ...pick("glass", "cast", "raised", "sinks", "plate", "tray", "bezel", "glow", "stone", "readout", "LCD", "reel", "needle", "scramble"), ...others("flat") },
  device: { ...pick("cast", "raised", "tray", "thrown", "glides", "leans", "half a pixel", "pill", "stone"), ...others("device") },
  plain: {
    ...pick("glass", "cast", "raised", "sinks", "cap", "plate", "tray", "glides"),
    ...others("plain"),
    slides: /\bslid(?:es|ing)\b/i,
    fades: /\bfad(?:es|ing)\b/i,
    rises: /\b(?:rises|rising)\b/i,
    settles: /\bsettl(?:es|ing)\b/i,
    expressive: /\bexpressive\b/i,
  },
  rack: { ...pick("glass", "cast", "raised", "sinks", "cap", "plate", "tray", "glides", "springs", "thrown", "floats", "leans", "pill"), ...others("rack") },
  heat: { ...pick("glass", "cast", "glow", "raised", "sinks", "pill"), ...others("heat") },
};

/**
 * A clause that says a material is absent is true of the world: Heat's About says "nothing casts or glows". From a
 * word of absence to the clause's end is dropped before the words are read.
 */
const ABSENT = /\b(?:no|not|none|nothing|never)\b[^.;:,]*/gi;

/** What is content, not copy: code, and the Props tables (gen-docs reads them from the component's types and JSDoc). */
const CONTENT = 'pre, code, section[aria-labelledby="props"]';

/*
 * Pages whose words are not yet the world's: the page, the words and why. Each prints; one that stops happening fails,
 * so take it out when the words are fixed. What is left waits on Nick or on another plan's step.
 */
const NAME =
  "the part is called Glass header, and its page says what glass does: whether a world without glass renames it, or says the bar is its own, is Nick's call";
const TUNE = "the demo names litt's radius scale, whose last step is the pill";
const k = (page, words, why) => ({ page, words, why });
const KNOWN = [
  ...["rack", "heat", "plain"].flatMap((w) => [
    k(`${w}/header`, ["glass"], NAME),
    k(`${w}/breadcrumb`, ["glass"], NAME),
    k(`${w}/components`, ["glass"], NAME + "; the gallery view lists it by name" + (w === "rack" ? ", and the clip launcher's preset Glass Pad is a name in Rack's demo (rack-fixes.md, step 8)" : "")),
  ]),
  ...["device", "rack", "heat"].map((w) => k(`${w}/tune`, ["pill"], TUNE)),
  /* Plain's words are Nick's (litt-principles.md, Plain: nothing changes without asking): each page below waits on its
     row in the draft, plans/audits/plain-words.md, and names only the words that row replaces, so a new word on a Plain
     page, or another world named on one the draft does not cover, fails. When a row lands, its entry goes. */
  ...Object.entries({
    plain: ["expressive"],
    "plain/about": ["slides", "cast"],
    "plain/accordion": ["fades"],
    "plain/action-bar": ["rises"],
    "plain/app-shell": ["rises", "expressive"],
    "plain/button": ["cast", "sinks", "fades", "another world"],
    "plain/carousel": ["slides"],
    "plain/case-study": ["expressive"],
    "plain/code-input": ["fades"],
    "plain/date-picker": ["slides"],
    "plain/dialog": ["fades", "expressive", "rises", "settles"],
    "plain/file-changes": ["settles", "fades"],
    "plain/form": ["expressive"],
    "plain/inspector": ["settles"],
    "plain/lightbox": ["rises", "settles", "expressive"],
    "plain/list": ["expressive"],
    "plain/media": ["fades"],
    "plain/message": ["fades", "rises"],
    "plain/pad": ["fades"],
    "plain/plan": ["fades"],
    "plain/range-chart": ["rises"],
    "plain/rolling-number": ["fades", "rises"],
    "plain/rule-builder": ["settles"],
    "plain/settings": ["expressive"],
    "plain/shopify": ["settles"],
    "plain/slide-confirm": ["slides"],
    "plain/slider": ["plate", "cap", "cast", "raised", "sinks", "glides", "another world"],
    "plain/spring-editor": ["settles", "expressive"],
    "plain/switch": ["tray", "cast", "sinks", "another world"],
    "plain/table": ["expressive"],
    "plain/tabs": ["slides"],
    "plain/thinking": ["fades"],
    "plain/time-scrubber": ["settles"],
    "plain/tune": ["settles"],
  }).map(([page, words]) => k(page, words, "Plain's lines are Nick's: this page's row in plans/audits/plain-words.md, not landed")),
  k("plain/inspector", ["fades"], "the shared About says a group fades open; plans/audits/plain-words.md has no line for it yet, so it waits with the draft"),
];
const inEntry = (k, id) => k.page === id || (k.page.endsWith("/*") && id.split("/")[0] === k.page.slice(0, -2));
const knownFor = (f) => KNOWN.find((k) => inEntry(k, f.id) && k.words.includes(f.word));

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
const worlds = (get("worlds", "") || Object.keys(WORDS).join(",")).split(",").filter((w) => WORDS[w]);
/* The self-test reads each world's Button page and its player's Home; for Plain, Select in place of Button, whose
   shared lines wait on Nick in KNOWN (sinks, another world), so the words it expects can only be caught fresh there. A
   KNOWN entry that held the planted words on Plain's Select, as a "plain/*" entry did, would be seen. */
const selfPages = (w) => [w === "plain" ? "plain/select" : `${w}/button`, w];
const only = (get("pages", selfTest ? worlds.flatMap(selfPages).join(",") : "") || "").split(",").filter(Boolean);
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
/* What the self-test puts back: each world's list catches some of it (glass, raised, the tray, the cast, a readout for Flat, or another world named). */
const INJECTED = "A glass dropdown whose raised block sinks into its tray and tightens its cast under a readout, as in Flat and in Device.";
/* One sentence trips several lists at once, so a page counts as caught only when its world's own list finds the word
   named here, and another world named: a list that lost most of its words would otherwise still catch something. */
const EXPECT = { press: "another world", flat: ["glass", "readout"], device: "tray", plain: "sinks", rack: "cast", heat: "raised" };
if (selfTest) {
  await ctx.addInitScript((injected) => {
    new MutationObserver((_, obs) => {
      const main = document.querySelector('main h1, main [data-play-take="home"]') && document.querySelector("main");
      if (!main) return;
      obs.disconnect();
      const p = document.createElement("p");
      p.setAttribute("data-words-self-test", "");
      p.textContent = injected;
      main.append(p);
    }).observe(document, { childList: true, subtree: true });
  }, INJECTED);
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
if (get("json")) fs.writeFileSync(get("json"), JSON.stringify(found, null, 1));

if (selfTest) {
  /* Caught means caught as a fresh hit (one a KNOWN entry holds would pass the real run unseen), by the world's expected
     word and by another world named. */
  const fresh = found.filter((f) => f.injected && !knownFor(f));
  const wanted = (id) => [...new Set([EXPECT[id.split("/")[0]], "another world"].flat())];
  const lacks = (id) => wanted(id).filter((w) => !fresh.some((f) => f.id === id && f.word === w));
  const caught = new Set(pages.filter((id) => !lacks(id).length));
  const missed = pages.filter((id) => !caught.has(id)).map((id) => `${id} (no fresh ${lacks(id).join(", ")})`);
  const broken = found.filter((f) => !f.word);
  console.log(`words self-test: "${INJECTED}" was caught on ${caught.size} of ${pages.length} pages in ${worlds.join(", ")} (${took}).`);
  for (const f of broken) console.log(`✗ ${f.id}: ${f.what}`);
  if (missed.length) console.log(`✗ not caught on ${missed.join(", ")}: the check has gone blind.`);
  process.exit(missed.length || broken.length ? 1 : 0);
}

const known = found.filter(knownFor);
const fresh = found.filter((f) => !knownFor(f));
for (const k of KNOWN.filter((k) => pages.some((id) => inEntry(k, id)))) {
  const hits = known.filter((f) => knownFor(f) === k);
  const gone = k.words.filter((w) => !hits.some((f) => f.word === w));
  const said = k.words.filter((w) => !gone.includes(w));
  const where = k.page.endsWith("/*") ? ` on ${new Set(hits.map((f) => f.id)).size} pages` : "";
  if (hits.length) console.log(`· known, ${k.page} says ${said.join(", ")}${where} (${hits.length}): ${k.why}.`);
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
