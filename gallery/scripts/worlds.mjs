#!/usr/bin/env node
/**
 * The world pages (#<world>/about for Press, Flat, Device, Plain, Rack and Heat: MATERIALS in look.ts), checked from a build: desktop 1440x900 and phone 390x844, light and dark.
 *
 *   npm run build && npm run test:worlds
 *   node scripts/worlds.mjs --dist dist
 *   node scripts/worlds.mjs --self-test       breaks a claim on purpose and fails if the check misses it
 *
 * A world is a material and the page you arrive on for it (proposals/worlds.md). It fails when:
 * - a world page does not load with one main and one h1, or the page throws,
 * - a world's page (#<world>/about) does not wear the world: data-material on <html> is not the world's (none for
 *   Press), whatever was once saved (plans/019: each world is closed),
 * - the hero block is not live: section[data-world-hero] has no framed block, nothing in it takes focus, or two worlds
 *   open on the same block,
 * - the first screen does not hold exactly one accent fill (R6; the Install button; none on Device, whose Install is
 *   the ink key, or on Plain, whose Install is
 *   link-blue words), or a second sits less than one
 *   screen below it (the accent is set to Blue 4 before the page loads, since in monochrome it is the ink that
 *   checkboxes and switches fill with too),
 * - Foundations is not five cards labelled Color, Type, Light, Shape and Motion, or a card's text is not the world's
 *   line in src/gallery/look.ts (read from that file, so the prose lives once),
 * - a page in a world (#<world>, #<world>/about, #<world>/components, #<world>/button) links to another world, has no
 *   Home link (litt.design/systems/), draws the gallery's sidebar, or wears another world,
 * - the phone's menu does not list Worlds with a row per world before the first component group,
 * - a world page scrolls sideways at 390 or at 320,
 * - a world page has no Only here section (section#only-here[data-only-here]), or its abilities are not the world's
 *   abilities from look.ts, in order, or its parts are not exactly the pages whose meta.worlds is this world and fewer
 *   than all of them (read from src/gallery/pages, so no list is written here): a part missing, or a part of another world,
 * - the Systems page (#systems) is not a card per world linking #press, #flat, #device, #plain, #rack and #heat in order, each named by the
 *   system and its line from look.ts, beside its cover scene, inert and hidden, the link the card's one stop, or it
 *   scrolls sideways,
 * - public/llms.txt lacks a Worlds section with Press, Flat and Device, or lists a world page as a component's docs,
 * - a world's page (its main, at every size and theme) or its Copy prompt (read back from the clipboard at 1440, where
 *   the rail shows) says a thing that world may not claim (NOT_CLAIMS below: Device is not "orange as its own accent",
 *   not "As Press" in shape, and has no "dark LCD screens for panels and overlays", plans/audits/device.md, finding 2).
 *
 * Not here: nothing moving under reduced motion on a world page. reduced-motion.mjs (test:motion) opens every file in
 * src/gallery/pages, every world included, so a second copy of its frame-by-frame watcher would only repeat it.
 *
 * Needs Playwright, found as wall.mjs finds it, and the TypeScript that the gallery already has (to read look.ts).
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));
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

/** look.ts imports nothing, so a plain transpile runs it under Node, as gen-llms.mjs does. */
async function loadLook() {
  const src = fs.readFileSync(path.join(here, "..", "src", "gallery", "look.ts"), "utf8");
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "litt-worlds-")), "look.mjs");
  fs.writeFileSync(tmp, js);
  try {
    return await import(pathToFileURL(tmp).href);
  } finally {
    fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  }
}
const WORLDS = (await loadLook()).MATERIALS;
/** The pages that belong to fewer than every world, from each page's `export const meta` (as wall.mjs reads it). */
const PAGES_DIR = path.join(here, "..", "src", "gallery", "pages");
const WORLD_ONLY = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith(".tsx")).flatMap((f) => {
  const meta = /export\s+const\s+meta\b[\s\S]*?\n\};?/.exec(fs.readFileSync(path.join(PAGES_DIR, f), "utf8"))?.[0] ?? "";
  const id = /\bid:\s*"([^"]+)"/.exec(meta)?.[1];
  const worlds = /\bworlds:\s*\[([^\]]*)\]/.exec(meta)?.[1];
  const list = worlds ? [...worlds.matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
  return id && list.length > 0 && list.length < WORLDS.length ? [{ id, worlds: list }] : [];
});
const ownParts = (world) => WORLD_ONLY.filter((p) => p.worlds.includes(world.id)).map((p) => p.id);
/**
 * What a world may not say of itself, on its page or in its prompt, matched without regard to case. Each line was once
 * true of an older draft and is false of what is built: add one when an audit finds a world describing another.
 */
const NOT_CLAIMS = {
  device: ["orange as its own accent", "As Press", "dark LCD screens for panels and overlays"],
};
const FOUNDATIONS = [["color", "Color"], ["type", "Type"], ["light", "Light"], ["shape", "Shape"], ["motion", "Motion"]];

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".md": "text/markdown", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;
const base = `http://localhost:${port}/index.html`;

/** Every claim and what broke it: a claim holds when nothing broke it anywhere. */
const claims = new Map();
const claim = (name, bad) => {
  if (!claims.has(name)) claims.set(name, []);
  if (bad) claims.get(name).push(bad);
};

const browser = await chromium.launch();

/* Read in the page: the accent fills (as wall.mjs reads them), how wide the page is, and the hero's way in. */
function inspect() {
  const probe = document.createElement("div");
  probe.style.background = "var(--accent)";
  document.body.append(probe);
  const accent = getComputedStyle(probe).backgroundColor;
  probe.remove();
  const marks = [];
  for (const el of document.querySelectorAll("main *")) {
    if (el.closest("[aria-hidden=true], .sr-only") || getComputedStyle(el).backgroundColor !== accent) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 24 || box.height < 16) continue;
    marks.push({ what: `"${(el.textContent || "").trim().slice(0, 24)}"`, y: box.top + scrollY });
  }
  marks.sort((a, b) => a.y - b.y);
  const first = marks.filter((m) => m.y < innerHeight);
  const rest = marks.filter((m) => m.y >= innerHeight);
  const close = marks.slice(1).filter((m, i) => m.y - marks[i].y < innerHeight).map((m) => m.what);

  const shown = (el) => !el.closest("[aria-hidden=true],[inert]") && el.getClientRects().length > 0;
  const hero = document.querySelector("section[data-world-hero]");
  const frames = hero ? [...hero.querySelectorAll("[role=region][aria-label], [role=group][aria-label]")].filter(shown).map((f) => f.getAttribute("aria-label")) : [];
  const name = (el) => el.getAttribute("aria-label") || (el.textContent || "").trim() || el.getAttribute("title") || "";
  const reach = hero ? [...hero.querySelectorAll("button, a[href]")].filter((el) => shown(el) && name(el)) : [];
  const target = reach[0];
  target?.focus({ preventScroll: true });
  const cards = [...document.querySelectorAll("section#foundations li")].map((li) => ({ label: li.querySelector("h3")?.textContent?.trim() ?? "", text: li.querySelector("p")?.textContent?.trim() ?? "" }));
  const only = document.querySelector("section#only-here[data-only-here]");
  const onlyHere = only
    ? { abilities: [...only.querySelectorAll("[data-only-here-abilities] li")].map((li) => li.textContent.trim()), parts: [...only.querySelectorAll("[data-only-here-parts] a")].map((a) => a.getAttribute("href")) }
    : null;
  return {
    onlyHere,
    first: first.map((m) => m.what),
    rest: rest.length,
    close,
    frames,
    reachable: reach.length,
    focusable: !!target && document.activeElement === target,
    cards,
    mains: [...document.querySelectorAll("main, [role=main]")].filter(shown).length,
    h1s: [...document.querySelectorAll("h1")].filter(shown).length,
    pageWide: document.documentElement.scrollWidth > innerWidth,
    material: document.documentElement.dataset.material,
  };
}

async function open(hash, { width, height, scheme = "light", query = "", phone = width < 640 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, hasTouch: phone, isMobile: phone && width >= 390 });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: `http://localhost:${port}` });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e)));
  await pg.goto(`${base}${query}#${hash}`, { waitUntil: "networkidle" });
  await pg.evaluate(() => document.fonts.ready);
  return { ctx, pg, errors };
}

/** One world page at one size and theme. `mutate` runs in the page before it is read, for --self-test. */
async function audit(world, size, scheme, mutate) {
  const where = `${world.id} · ${scheme} · ${size.label}`;
  const { ctx, pg, errors } = await open(`${world.id}/about`, { ...size, scheme });
  await pg.locator("section[data-world-hero] :is(button, a[href])").first().waitFor();
  await pg.waitForLoadState("networkidle");
  const attr = world.attribute ?? undefined;
  if (mutate) await pg.evaluate(mutate);
  const r = await pg.evaluate(inspect);
  /* What the world says of itself: the page's words, and the prompt an agent is handed (the rail shows from 1280 up). */
  const said = [{ what: "its page", text: await pg.locator("main").innerText() }];
  const copy = pg.getByRole("button", { name: "Copy prompt" });
  if (size.width >= 1280 && (await copy.isVisible())) {
    await copy.click();
    said.push({ what: "its Copy prompt", text: await pg.evaluate(() => navigator.clipboard.readText()) });
  }
  for (const { what, text } of said) {
    const hits = (NOT_CLAIMS[world.id] ?? []).filter((w) => text.toLowerCase().includes(w.toLowerCase()));
    claim("a world's page and its Copy prompt claim nothing that world may not (NOT_CLAIMS)", hits.length ? `${where}: ${what} says ${hits.map((h) => `"${h}"`).join(", ")}` : null);
  }
  if (size.width >= 1280) claim("a world's Copy prompt can be read back from the clipboard", said.length === 2 ? null : `${where}: no Copy prompt in the rail`);

  claim("a world page has one main and one h1", r.mains === 1 && r.h1s === 1 ? null : `${where}: ${r.mains} mains, ${r.h1s} h1s`);
  claim("a world's page wears the world: its data-material on <html> (none for Press)", r.material === attr ? null : `${where}: data-material is ${r.material ?? "absent"} (want ${attr ?? "absent"})`);
  claim("the hero block is framed and live: a labelled frame, and a named button or link in it takes focus", r.frames.length > 0 && r.reachable > 0 && r.focusable ? null : `${where}: ${r.frames.length} frames, ${r.reachable} named controls, focus ${r.focusable ? "took" : "did not take"}`);
  /* Plain's Install is link-blue words, and Device's the ink key (its color rule, plans/024: orange is a hand on it, never
     a key's fill): neither has an accent fill to spend. */
  const fills = world.id === "plain" || world.id === "device" ? 0 : 1;
  claim("the first screen holds exactly one accent fill (the Install button)", r.first.length === fills ? null : `${where}: ${r.first.length} accent fills on the first screen: ${r.first.join(", ") || "none"} (want ${fills})`);
  claim("a second accent fill on the page sits at least a screen below the first", r.close.length === 0 ? null : `${where}: accent fills within one screen of another: ${r.close.join(", ")}`);
  const want = FOUNDATIONS.map(([key, label]) => ({ label, text: world.foundations[key] }));
  const same = r.cards.length === 5 && want.every((w, i) => r.cards[i].label === w.label && r.cards[i].text === w.text);
  claim("Foundations is five cards, Color, Type, Light, Shape, Motion, each with the world's line from look.ts", same ? null : `${where}: cards ${JSON.stringify(r.cards.map((c) => c.label))} (want ${want.map((w) => w.label).join(", ")}), text ${r.cards.every((c, i) => c.text === want[i]?.text) ? "matches" : "differs from look.ts"}`);
  const parts = ownParts(world).map((id) => `#${world.id}/${id}`);
  const got = r.onlyHere;
  const sameSet = got && got.parts.length === parts.length && parts.every((h) => got.parts.includes(h));
  claim("a world page has an Only here section listing the world's abilities from look.ts and exactly its own parts", got && got.abilities.join("|") === world.abilities.join("|") && sameSet ? null : `${where}: ${got ? `abilities ${got.abilities.length} (want ${world.abilities.length}, ${got.abilities.join("|") === world.abilities.join("|") ? "same text" : "text differs from look.ts"}), parts ${JSON.stringify(got.parts)} (want ${JSON.stringify(parts)})` : "no section#only-here[data-only-here]"}`);
  claim("a world page does not scroll sideways at 1440 or 390", r.pageWide ? `${where}: the page scrolls sideways` : null);
  for (const e of errors) claim("a world page throws nothing", `${where}: ${e}`);
  await ctx.close();
  return r;
}

const SIZES = [{ width: 1440, height: 900, label: "1440" }, { width: 390, height: 844, label: "390" }];

if (selfTest) {
  /* Each break is a defect one claim must name: a second fill on the first screen, a missing Foundations card, a wrong
     line on a card, a page wider than the screen, an old claim back on Device's page or in its prompt. The world is
     Press at 1440 unless the break names another. */
  const NOT = "a world's page and its Copy prompt claim nothing that world may not (NOT_CLAIMS)";
  const breaks = [
    ["the first screen holds exactly one accent fill (the Install button)", () => { const d = document.createElement("div"); d.style.cssText = "position:absolute;top:80px;left:8px;width:120px;height:40px;background:var(--accent)"; document.querySelector("main").append(d); }],
    ["Foundations is five cards, Color, Type, Light, Shape, Motion, each with the world's line from look.ts", () => document.querySelector("section#foundations li").remove()],
    ["Foundations is five cards, Color, Type, Light, Shape, Motion, each with the world's line from look.ts", () => { document.querySelector("section#foundations li p").textContent = "Made up."; }],
    ["a world page has an Only here section listing the world's abilities from look.ts and exactly its own parts", () => document.querySelector("[data-only-here-abilities] li").remove()],
    ["a world page has an Only here section listing the world's abilities from look.ts and exactly its own parts", () => { const a = document.createElement("a"); a.href = "#not-mine"; const li = document.createElement("li"); li.append(a); const ul = document.createElement("ul"); ul.setAttribute("data-only-here-parts", ""); ul.append(li); document.querySelector("section#only-here").append(ul); }],
    ["a world page does not scroll sideways at 1440 or 390", () => { const d = document.createElement("div"); d.style.cssText = "width:3000px;height:4px"; document.querySelector("main").append(d); }],
    ["the hero block is framed and live: a labelled frame, and a named button or link in it takes focus", () => document.querySelectorAll("section[data-world-hero] :is(button, a[href])").forEach((el) => el.remove())],
    [NOT, () => { document.querySelector("section#foundations li p").textContent = "A cool aluminium body, orange as its own accent."; }, "device"],
    [NOT, () => { const write = navigator.clipboard.writeText.bind(navigator.clipboard); navigator.clipboard.writeText = (t) => write(`${t} Dark LCD screens for panels and overlays.`); }, "device"],
  ];
  let missed = 0;
  for (const [name, mutate, id = "press"] of breaks) {
    claims.clear();
    await audit(WORLDS.find((w) => w.id === id), SIZES[0], "light", mutate);
    const caught = (claims.get(name) ?? []).length > 0;
    if (!caught) missed++;
    console.log(`${caught ? "✓" : "✗"} self-test: "${name.slice(0, 60)}…" ${caught ? "is caught" : "is MISSED"}`);
  }
  await browser.close();
  server.close();
  if (missed) { console.error(`\nworlds --self-test: ${missed} injected break${missed === 1 ? "" : "s"} went unseen.`); process.exit(1); }
  console.log(`\nworlds --self-test: all ${breaks.length} injected breaks are caught.`);
  process.exit(0);
}

/* ---------- every world, every size, both themes ---------- */
const seen = new Map();
for (const world of WORLDS) for (const size of SIZES) for (const scheme of ["light", "dark"]) {
  const r = await audit(world, size, scheme);
  if (size.label === "1440" && scheme === "light") seen.set(world.id, r.frames.join("|"));
}
claim("each world opens on its own block (a different hero frame each)", new Set(seen.values()).size === WORLDS.length ? null : `hero frames per world: ${JSON.stringify([...seen])}`);

/* ---------- 320 wide ---------- */
for (const world of WORLDS) for (const scheme of ["light", "dark"]) {
  const { ctx, pg } = await open(`${world.id}/about`, { width: 320, height: 640, scheme, phone: true });
  await pg.locator("section[data-world-hero] :is(button, a[href])").first().waitFor();
  await pg.waitForLoadState("networkidle");
  const wide = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  claim("a world page does not scroll sideways at 1440 or 390", wide > 0 ? `${world.id} · ${scheme} · 320: the page is ${wide}px wider than the screen` : null);
  await ctx.close();
}

/* ---------- a world is closed: no link from its pages to another world's ---------- */
for (const world of WORLDS) {
  for (const sub of ["", "/about", "/components", "/button"]) {
    const { ctx, pg, errors } = await open(`${world.id}${sub}`, { width: 1440, height: 900 });
    await pg.locator("main h1").first().waitFor({ state: "attached" });
    await pg.waitForLoadState("networkidle");
    const r = await pg.evaluate((id) => {
      const others = ["press", "flat", "device", "plain", "rack", "heat"].filter((w) => w !== id);
      const hrefs = [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
      return {
        foreign: hrefs.filter((h) => h.startsWith("#") && others.some((w) => h === `#${w}` || h.startsWith(`#${w}/`))),
        home: hrefs.includes("https://www.litt.design/systems/"),
        header: !!document.querySelector("header nav[aria-label=Components], [role=group][aria-labelledby=nav-worlds]"),
        material: document.documentElement.dataset.material ?? "press",
      };
    }, world.id);
    const where = `#${world.id}${sub}`;
    claim("a world's pages link to no other world, and Home is the way out", r.foreign.length === 0 && r.home ? null : `${where}: links to ${JSON.stringify(r.foreign)}, Home ${r.home ? "present" : "missing"}`);
    claim("a world's pages draw no gallery sidebar, and wear only their world", !r.header && r.material === world.id ? null : `${where}: gallery nav ${r.header}, material ${r.material}`);
    for (const e of errors) claim("a world page throws nothing", `${where}: ${e}`);
    await ctx.close();
  }
}

/* ---------- the phone's menu ---------- */
{
  const { ctx, pg } = await open("overview", { width: 390, height: 844 });
  await pg.locator("header").getByRole("button", { name: "Menu" }).tap();
  const panel = pg.locator("#gallery-menu");
  await panel.waitFor();
  const menu = await panel.evaluate((el) => {
    const worlds = el.querySelector("section[aria-labelledby=menu-worlds]");
    const parts = el.querySelector("section[aria-labelledby=menu-components]");
    return {
      hrefs: worlds ? [...worlds.querySelectorAll("a")].map((a) => a.getAttribute("href")) : [],
      before: !!worlds && !!parts && !!(worlds.compareDocumentPosition(parts) & Node.DOCUMENT_POSITION_FOLLOWING),
      groupsAbove: [...el.querySelectorAll("button[id^=menu-group-]")].filter((b) => worlds && b.compareDocumentPosition(worlds) & Node.DOCUMENT_POSITION_FOLLOWING).length,
    };
  });
  claim("the phone menu lists Worlds with a row per world (#press, #flat, #device, #plain, #rack, #heat) before any component group", menu.hrefs.join(",") === WORLDS.map((w) => `#${w.id}`).join(",") && menu.before && menu.groupsAbove === 0 ? null : `menu: ${JSON.stringify(menu)}`);
  await ctx.close();
}

/* ---------- the Systems page ---------- */
for (const size of SIZES) {
  const { ctx, pg, errors } = await open("systems", { ...size });
  await pg.locator("main ul[aria-label=Systems] > li").first().waitFor();
  await pg.waitForLoadState("networkidle");
  await pg.waitForFunction((n) => [...document.querySelectorAll("main ul[aria-label=Systems] [inert]")].filter((c) => c.querySelector("button, input, [role]")).length === n, WORLDS.length, { timeout: 5000 }).catch(() => {});
  const r = await pg.evaluate(() => ({
    cards: [...document.querySelectorAll("main ul[aria-label=Systems] > li")].map((li) => ({
      href: li.querySelector(":scope > a")?.getAttribute("href"),
      name: li.querySelector(":scope > a")?.textContent.trim(),
      cover: !!li.querySelector(":scope > [inert][aria-hidden=true] :is(button, input, [role])"),
      focusables: [...li.querySelectorAll("button, input, select, textarea, a[href], [tabindex]")].filter((e) => !e.closest("[inert]")).length,
    })),
    wide: document.documentElement.scrollWidth > innerWidth,
  }));
  const want = WORLDS.map((w) => `#${w.id}`);
  const ok = r.cards.map((c) => c.href).join(",") === want.join(",") && r.cards.every((c, i) => c.name.startsWith(WORLDS[i].name) && c.name.includes(WORLDS[i].line) && c.cover && c.focusables === 1);
  claim("the Systems page is a card per world, in order, each a link to its page named by the system and its line, over its cover scene out of reach", ok ? null : `${size.label}: ${JSON.stringify(r.cards)}`);
  claim("the Systems page does not scroll sideways", r.wide ? `${size.label}: the page scrolls sideways` : null);
  for (const e of errors) claim("the Systems page throws nothing", `${size.label}: ${e}`);
  await ctx.close();
}

/* ---------- llms.txt ---------- */
{
  const text = fs.readFileSync(path.join(dist, "llms.txt"), "utf8");
  const worlds = /^## Worlds\n([\s\S]*?)(?=^## )/m.exec(text)?.[1] ?? "";
  const names = [...worlds.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
  claim("llms.txt has a Worlds section with every world", names.join(",") === WORLDS.map((w) => w.name).join(",") ? null : `Worlds section headings: ${JSON.stringify(names)}`);
  const full = fs.existsSync(path.join(dist, "llms-full.txt")) ? fs.readFileSync(path.join(dist, "llms-full.txt"), "utf8") : "";
  const listed = [...(text + full).matchAll(new RegExp(`/docs/(${WORLDS.map((w) => w.id).join("|")})\\.md`, "g"))].map((m) => m[0]);
  claim("no world page is listed as a component's docs in llms.txt or llms-full.txt", listed.length === 0 ? null : `listed: ${listed.join(", ")}`);
}

await browser.close();
server.close();

let bad = 0;
for (const [name, fails] of claims) {
  if (!fails.length) { console.log(`✓ ${name}`); continue; }
  bad++;
  console.error(`✗ ${name}`);
  for (const f of [...new Set(fails)].slice(0, 6)) console.error(`    ${f}`);
}
if (bad) {
  console.error(`\nworlds: ${bad} of ${claims.size} claims fail.`);
  process.exit(1);
}
console.log(`\nworlds: ${claims.size} claims hold, on ${WORLDS.length} world pages at 1440, 390 and 320, light and dark.`);
