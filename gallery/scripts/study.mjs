#!/usr/bin/env node
/**
 * The study pages (proposals/worlds.md, unit 2), checked from a build in each world (plans/019: a page is in a world,
 * #<world>/<id>): in Flat and Device at desktop 1440x900 and phone 390x844, light and dark, and in Press, Plain, Rack
 * and Heat at 1440, light. *
 *   npm run build && npm run test:study
 *   node scripts/study.mjs --dist dist
 *   node scripts/study.mjs --only slide-confirm   one study page
 *   node scripts/study.mjs --shard 1/3        every third study page, from the first (CI runs three shards at once)
 *   node scripts/study.mjs --self-test        breaks claims on purpose and fails if the check misses them
 *
 * A study page is a page file in src/gallery/pages that exports `study`. The list is read from those sources (the
 * page's id from its `meta`), so a ninth study is tested without editing this file. It fails when:
 * - a study page lacks its sections as h2s in order (Anatomy, How it moves, States, Replay, Source; How it moves, States and Replay only when the page's source has a mechanism, states or a replay), or has
 *   not exactly one main and one h1, or throws,
 * - an anatomy part does not resolve: the callout lines on a desktop (the numbered badges on a phone) are not as many
 *   as the items in the parts list, or the console warns about a selector,
 * - anything opens on its own: after load and 1.5s, a dialog is open outside main, anything has aria-modal, or the
 *   Replay stage shows a dialog instead of the object at rest. Pressing Replay on the Command menu and Dialog pages
 *   must open an overlay, and Esc must close it,
 * - a part with bodies (data-body on its root, proposals/worlds.md, Bodies) does not draw, on a world's page, that
 *   world's own body in its Anatomy, where src/worlds/<world>/<part>.tsx exists, and Press's body where it
 *   does not (byWorld's fallback),
 * - Show source is not aria-expanded=false at load, or after a press shows no code with `export function`, or the
 *   Source heading does not name the file and a yyyy.mm.dd version,
 * - public/docs/<id>.md lacks `## How it moves` with the page's mechanism, or llms.txt does not mark the page
 *   "(a study)",
 * - a study page scrolls sideways at 390 or at 320.
 *
 * Not here: nothing moving under reduced motion. reduced-motion.mjs (test:motion) opens every file in src/gallery/pages,
 * the studies included.
 *
 * Needs Playwright, found as wall.mjs finds it.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
/* Every world, in the order look.ts's MATERIALS lists them. */
const WORLDS = ["press", "flat", "device", "plain", "rack", "heat"];
const WORLDS_DIR = path.join(here, "..", "src", "worlds");
/** The body a part draws under a world: its own where the file exists, else Press's (byWorld). A frame may also show
    its own world's body when it comes from a part inside (a Dialog's Buttons). */
const bodyFor = (part, world) => (world === "press" || fs.existsSync(path.join(WORLDS_DIR, world, `${part}.tsx`)) ? world : "press");
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const dist = path.resolve(get("dist", "dist"));
const selfTest = args.includes("--self-test");

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

/** The pages: every file in src/gallery/pages with its id, and whether it is a study and what its source promises. */
const pagesDir = path.join(here, "..", "src", "gallery", "pages");
const PAGES = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".tsx")).map((f) => {
  const src = fs.readFileSync(path.join(pagesDir, f), "utf8");
  const at = src.search(/export const study\b/);
  const rest = at >= 0 ? src.slice(at) : "";
  return {
    id: /\bid:\s*"([^"]+)"/.exec(src)?.[1],
    study: at >= 0,
    mechanism: /\bmechanism\s*:/.test(src),
    states: /\bstates\s*:\s*\{\s*[a-z]/i.test(rest),
    replay: /\breplay\s*:/.test(rest),
    /* The worlds a part is in, when fewer than all (meta.worlds); null is every world. */
    worlds: (() => { const w = /\bworlds:\s*\[([^\]]*)\]/.exec(src)?.[1]; return w ? [...w.matchAll(/"([^"]+)"/g)].map((m) => m[1]) : null; })(),
  };
}).filter((p) => p.id);
const only = get("only");
const [shard, shards] = get("shard", "1/1").split("/").map(Number);
const STUDIES = PAGES.filter((p) => p.study && (!only || p.id === only)).filter((_, i) => i % shards === shard - 1);
if (!STUDIES.length) { console.error("No page exports `study` in src/gallery/pages."); process.exit(1); }
const OVERLAYS = ["command-menu", "dialog"];

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".md": "text/markdown", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;
const origin = `http://localhost:${port}`;
const base = `${origin}/index.html`;

/** Every claim and what broke it: a claim holds when nothing broke it anywhere. */
const claims = new Map();
const claim = (name, bad) => {
  if (!claims.has(name)) claims.set(name, []);
  if (bad) claims.get(name).push(bad);
};

const C = {
  sections: "a study page has its sections as h2s in order, one main and one h1, and throws nothing",
  parts: "every anatomy part resolves: as many callout lines (badges on a phone) as items in the parts list, and no selector warning",
  rest: "nothing opens on its own: no open dialog or aria-modal after load, and the Replay stage holds the object at rest",
  replay: "pressing Replay on the Command menu and Dialog pages opens an overlay, and Esc closes it",
  bodies: "on each world's page, a part with bodies draws that world's own body in its Anatomy, and Press's where the world has none (proposals/worlds.md, Bodies)",
  source: "Show source starts collapsed, and a press shows code with `export function` under a heading naming the file and a version",
  docs: "public/docs/<id>.md has `## How it moves` with the page's mechanism, and llms.txt marks the page \"(a study)\"",
  wide: "a study page does not scroll sideways at 390 or 320",
};

const browser = await chromium.launch();

async function open(page, { width, height, scheme, world, phone = width < 640 }) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, hasTouch: phone, isMobile: phone && width >= 390 });
  const pg = await ctx.newPage();
  const errors = [];
  const warns = [];
  pg.on("pageerror", (e) => errors.push(String(e)));
  pg.on("console", (m) => { if (m.type() === "warning" || m.type() === "error") warns.push(m.text()); });
  await pg.goto(`${base}#${world}/${page.id}`, { waitUntil: "networkidle" });
  await pg.locator(`section[aria-labelledby="study-anatomy-${page.id}"]`).waitFor();
  await pg.waitForLoadState("networkidle");
  await pg.evaluate(() => document.fonts.ready);
  return { ctx, pg, errors, warns };
}

const SECTION_NAMES = { anatomy: "Anatomy", mechanism: "How it moves", states: "States", replay: "Replay", source: "Source" };

/** Read in the page: the sections, the anatomy marks, what is open, the frames and the width. */
function inspect(id) {
  const shown = (el) => el.checkVisibility({ visibilityProperty: true });
  const sections = [...document.querySelectorAll("main section[aria-labelledby^=study-]")].map((s) => ({
    key: s.getAttribute("aria-labelledby").replace(/^study-/, "").replace(`-${id}`, ""),
    h2: s.querySelector("h2")?.textContent.trim().split("\n")[0] ?? null,
  }));
  const anatomy = document.querySelector(`section[aria-labelledby="study-anatomy-${id}"]`);
  const svg = anatomy.querySelector("svg.pointer-events-none.absolute");
  const replay = document.querySelector(`section[aria-labelledby="study-replay-${id}"]`);
  return {
    sections,
    mains: [...document.querySelectorAll("main, [role=main]")].filter(shown).length,
    h1s: [...document.querySelectorAll("h1")].filter(shown).length,
    lines: [...svg.querySelectorAll("line")].filter((l) => getComputedStyle(l.parentElement).display !== "none").length,
    badges: [...svg.querySelectorAll("text")].filter((t) => getComputedStyle(t.parentElement).display !== "none").length,
    items: anatomy.querySelectorAll("ol > li").length,
    openDialogs: [...document.querySelectorAll("[role=dialog][data-state=open]")].filter((d) => !d.closest("main")).length,
    modal: document.querySelectorAll("[aria-modal=true]").length,
    replayDialog: replay ? replay.querySelectorAll("[role=dialog]").length : 0,
    body: anatomy.querySelector("[data-body]")?.dataset.body ?? null,
    mechanism: document.querySelector(`section[aria-labelledby="study-mechanism-${id}"] p`)?.textContent?.trim() ?? "",
    wide: document.documentElement.scrollWidth - innerWidth,
  };
}

/** One study page at one size and theme, in one world. `mutate(pg)` runs before it is read, for --self-test. */
async function audit(page, size, scheme, world, mutate) {
  const where = `${world}/${page.id} · ${scheme} · ${size.label}`;
  const { ctx, pg, errors, warns } = await open(page, { ...size, scheme, world });
  if (mutate) await mutate(pg);
  await pg.waitForTimeout(1500);
  const r = await pg.evaluate(inspect, page.id);

  const want = Object.keys(SECTION_NAMES).filter((k) => k === "anatomy" || k === "source" || (k === "mechanism" && page.mechanism) || (k === "states" && page.states) || (k === "replay" && page.replay));
  const got = r.sections.map((s) => s.key);
  const named = r.sections.every((s) => s.h2 === SECTION_NAMES[s.key]);
  claim(C.sections, got.join() === want.join() && named && r.mains === 1 && r.h1s === 1 && errors.length === 0 ? null : `${where}: sections ${got.join(", ")} (want ${want.join(", ")})${named ? "" : ", a heading is not an h2 with its name"}, ${r.mains} mains, ${r.h1s} h1s${errors.length ? ", " + errors[0] : ""}`);

  const marks = size.width < 640 ? r.badges : r.lines;
  const selectorWarn = warns.find((w) => /selector|Anatomy/i.test(w));
  claim(C.parts, marks === r.items && r.items > 0 && !selectorWarn ? null : `${where}: ${marks} ${size.width < 640 ? "badges" : "lines"} for ${r.items} parts${selectorWarn ? `, warning: ${selectorWarn}` : ""}`);

  claim(C.rest, r.openDialogs === 0 && r.modal === 0 && r.replayDialog === 0 ? null : `${where}: ${r.openDialogs} open dialogs outside main, ${r.modal} aria-modal, ${r.replayDialog} dialogs in the Replay stage`);

  /* A part without bodies has no data-body; one with bodies must draw this world's own, or Press's where it has none. */
  if (r.body) claim(C.bodies, r.body === world || r.body === bodyFor(page.id, world) ? null : `${where}: the Anatomy object is the ${r.body} body (want ${world} or ${bodyFor(page.id, world)})`);

  claim(C.wide, size.width > 640 || r.wide <= 0 ? null : `${where}: ${r.wide}px wider than the screen`);

  /* Source. */
  const source = pg.locator(`section[aria-labelledby="study-source-${page.id}"]`);
  const toggle = source.getByRole("button", { name: /show source/i });
  const before = await toggle.getAttribute("aria-expanded");
  const pressed = await toggle.click({ timeout: 3000 }).then(() => true, () => false);
  const code = await source.locator("pre, code").filter({ hasText: "export function" }).first().waitFor({ timeout: 4000 }).then(() => true, () => false);
  const head = (await source.locator("h2").innerText()) + " " + (await source.locator("h2 + p").first().innerText().catch(() => ""));
  claim(C.source, before === "false" && pressed && code && /\.tsx/.test(head) && /\d{4}\.\d{2}\.\d{2}/.test(head) ? null : `${where}: aria-expanded at load ${before}, ${pressed ? "pressed" : "the button could not be pressed"}, ${code ? "code shown" : "no code with export function"}, heading "${head.replace(/\s+/g, " ")}"`);

  /* Replay on the overlays. */
  if (OVERLAYS.includes(page.id) && page.replay) {
    const sec = pg.locator(`section[aria-labelledby="study-replay-${page.id}"]`);
    await sec.getByRole("button").last().click({ timeout: 3000 }).catch(() => {});
    const open = "[role=dialog][data-state=open], [aria-modal=true]";
    const opened = await pg.locator(open).first().waitFor({ timeout: 4000 }).then(() => true, () => false);
    await pg.keyboard.press("Escape");
    const closed = opened && await pg.locator(open).first().waitFor({ state: "detached", timeout: 4000 }).then(() => true, () => false);
    claim(C.replay, opened && closed ? null : `${where}: Replay ${opened ? "opened an overlay, but Esc left it open" : "opened nothing"}`);
  }
  await ctx.close();
  return r;
}

/** The docs file and llms.txt, once per page. `docId` is the file read, so --self-test can point it at the wrong page. */
async function docs(page, mechanism, docId = page.id) {
  const md = await fetch(`${origin}/docs/${docId}.md`).then((r) => (r.ok ? r.text() : ""));
  const txt = await fetch(`${origin}/llms.txt`).then((r) => r.text());
  const flat = (s) => s.replace(/\s+/g, " ");
  const lead = flat(mechanism).slice(0, 60);
  const has = !page.mechanism || (flat(md).includes("## How it moves") && lead.length > 0 && flat(md).includes(lead));
  const marked = new RegExp(`\\[[^\\]]*\\]\\([^)]*/docs/${page.id}\\.md\\) \\(a study\\)`).test(txt);
  claim(C.docs, has && marked ? null : `${page.id}: docs ${has ? "have" : "lack"} the mechanism, llms.txt ${marked ? "marks" : "does not mark"} it a study`);
}

const SIZES = [{ width: 1440, height: 900, label: "1440" }, { width: 390, height: 844, label: "390" }];

if (selfTest) {
  /* Each break is a defect one claim must name. The page is Button at 1440 (390 for the sideways bar), in the gallery's look. */
  const button = STUDIES.find((p) => p.id === "button") ?? STUDIES[0];
  const bare = PAGES.find((p) => !p.mechanism);
  const run1 = (size, mutate, world = "flat") => audit(button, size, "light", world, mutate);
  const breaks = [
    [C.parts, "hide one callout line", () => run1(SIZES[0], (pg) => pg.evaluate(() => document.querySelector("section[aria-labelledby^=study-anatomy] svg.pointer-events-none line").remove()))],
    [C.rest, "a dialog is open at load", () => run1(SIZES[0], (pg) => pg.evaluate(() => { const d = document.createElement("div"); d.setAttribute("role", "dialog"); d.dataset.state = "open"; d.setAttribute("aria-modal", "true"); document.body.append(d); }))],
    [C.docs, "the docs file read is a page with no mechanism", async () => { const m = (await run1(SIZES[0])).mechanism; await docs(button, m, bare?.id ?? "no-such-page"); }],
    [C.sections, "the Source section moves above Anatomy", () => run1(SIZES[0], (pg) => pg.evaluate(() => { const s = document.querySelector("section[aria-labelledby^=study-source]"); s.parentElement.prepend(s); }))],
    [C.bodies, "on Device's page, the body says it is Press's", () => run1(SIZES[0], (pg) => pg.evaluate(() => {
      /* The Anatomy object may mount after this runs, so keep forcing the attribute as bodies appear. */
      const force = () => { for (const el of document.querySelectorAll("section[aria-labelledby^=study-anatomy] [data-body]")) if (el.dataset.body !== "press") el.dataset.body = "press"; };
      force();
      new MutationObserver(force).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-body"] });
    }), "device")],
    [C.source, "Show source is expanded at load", () => run1(SIZES[0], (pg) => pg.evaluate(() => document.querySelector("section[aria-labelledby^=study-source] button").setAttribute("aria-expanded", "true")))],
    [C.wide, "a 3000px bar on a phone", () => run1(SIZES[1], (pg) => pg.evaluate(() => { const d = document.createElement("div"); d.style.cssText = "width:3000px;height:4px"; document.querySelector("main").append(d); }))],
  ];
  let missed = 0;
  for (const [name, what, run] of breaks) {
    claims.clear();
    await run();
    const caught = (claims.get(name) ?? []).length > 0;
    if (!caught) missed++;
    console.log(`${caught ? "✓" : "✗"} self-test: ${what}, "${name.slice(0, 50)}…" ${caught ? "is caught" : "is MISSED"}`);
  }
  await browser.close();
  server.close();
  if (missed) { console.error(`\nstudy --self-test: ${missed} injected break${missed === 1 ? "" : "s"} went unseen.`); process.exit(1); }
  console.log(`\nstudy --self-test: all ${breaks.length} injected breaks are caught.`);
  process.exit(0);
}

/* ---------- every study, in every world: Flat and Device at both sizes and themes, the rest at 1440 light ---------- */
for (const page of STUDIES) {
  let mechanism = "";
  /* The page's home: Flat, the gallery's world, or the first world a world-only part is in. */
  const home = !page.worlds || page.worlds.includes("flat") ? "flat" : page.worlds[0];
  for (const world of WORLDS) {
    if (page.worlds && !page.worlds.includes(world)) continue;
    const full = world === "flat" || world === "device";
    for (const size of full ? SIZES : SIZES.slice(0, 1)) for (const scheme of full ? ["light", "dark"] : ["light"]) {
      const r = await audit(page, size, scheme, world);
      if (world === home && size.label === "1440" && scheme === "light") mechanism = r.mechanism;
    }
  }
  await docs(page, mechanism);

  /* 320 wide */
  for (const scheme of ["light", "dark"]) {
    const { ctx, pg } = await open(page, { width: 320, height: 640, scheme, world: home, phone: true });
    const wide = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    claim(C.wide, wide > 0 ? `${page.id} · ${scheme} · 320: the page is ${wide}px wider than the screen` : null);
    await ctx.close();
  }
}

await browser.close();
server.close();

let bad = 0;
for (const [name, fails] of claims) {
  if (!fails.length) { console.log(`✓ ${name}`); continue; }
  bad++;
  console.error(`✗ ${name}`);
  for (const f of [...new Set(fails)].slice(0, args.includes("--all") ? Infinity : 6)) console.error(`    ${f}`);
}
if (bad) {
  console.error(`\nstudy: ${bad} of ${claims.size} claims fail.`);
  process.exit(1);
}
console.log(`\nstudy${shards > 1 ? ` (shard ${shard}/${shards})` : ""}: ${claims.size} claims hold, on ${STUDIES.length} study pages in every world, at 1440, 390 and 320, light and dark.`);
