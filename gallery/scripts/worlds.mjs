#!/usr/bin/env node
/**
 * The three world pages (Press, Flat, Device), checked from a build: desktop 1440x900 and phone 390x844, light and dark.
 *
 *   npm run build && npm run test:worlds
 *   node scripts/worlds.mjs --dist dist
 *   node scripts/worlds.mjs --self-test       breaks a claim on purpose and fails if the check misses it
 *
 * A world is a material and the page you arrive on for it (proposals/worlds.md). It fails when:
 * - a world page does not load with one main and one h1, or the page throws,
 * - after arriving, data-material on <html> is not the world's (none for Press), or the saved look (localStorage
 *   litt-gallery:customize) does not hold the world as its material: arriving writes your look (decision 1). Flat is the
 *   gallery's own look, which storage keeps as no choice, so Flat's is the saved material gone. Each page starts from a
 *   saved look in a different material, so a page that wrote nothing is caught,
 * - a link's look for the world (?look=pink-device#device) does not paint Device before the app runs (with scripts
 *   blocked, so the pre-paint script alone decides), or ?look=pink#device does not end up on Device with its page working,
 * - the hero block is not live: section[data-world-hero] has no framed block, nothing in it takes focus, or two worlds
 *   open on the same block,
 * - the first screen does not hold exactly one accent fill (R6; the Install button), or a second sits less than one
 *   screen below it (the accent is set to Blue 4 before the page loads, since in monochrome it is the ink that
 *   checkboxes and switches fill with too),
 * - Foundations is not five cards labelled Color, Type, Light, Shape and Motion, or a card's text is not the world's
 *   line in src/gallery/look.ts (read from that file, so the prose lives once),
 * - the sidebar does not mark the gallery's world on a component page (aria-current="true" on its row under Worlds),
 *   or does not mark the world page you are on (aria-current="page"),
 * - the phone's menu does not list Worlds with its three rows before the first component group,
 * - a world page scrolls sideways at 390 or at 320,
 * - a world page has no Only here section (section#only-here[data-only-here]), or its abilities are not the world's
 *   abilities from look.ts, in order, or its parts are not exactly the pages whose meta.worlds is this world and fewer
 *   than all three (read from src/gallery/pages, so no list is written here): a part missing, or a part of another world,
 * - the sidebar on a component page, under each material, does not list every world-only page of that material, or lists
 *   one that is another world's alone (zero world-only pages is a pass: it asserts what the sidebar and the sources hold),
 * - the Systems page (#systems) is not three cards linking #press, #flat and #device in order, each named by the
 *   system and its line from look.ts, beside its cover scene, inert and hidden, the link the card's one stop, or it
 *   scrolls sideways,
 * - public/llms.txt lacks a Worlds section with Press, Flat and Device, or lists a world page as a component's docs.
 *
 * Not here: nothing moving under reduced motion on a world page. reduced-motion.mjs (test:motion) opens every file in
 * src/gallery/pages, the three worlds included, so a second copy of its frame-by-frame watcher would only repeat it.
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
/** The pages that belong to fewer than all three worlds, from each page's `export const meta` (as wall.mjs reads it). */
const PAGES_DIR = path.join(here, "..", "src", "gallery", "pages");
const WORLD_ONLY = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith(".tsx")).flatMap((f) => {
  const meta = /export\s+const\s+meta\b[\s\S]*?\n\};?/.exec(fs.readFileSync(path.join(PAGES_DIR, f), "utf8"))?.[0] ?? "";
  const id = /\bid:\s*"([^"]+)"/.exec(meta)?.[1];
  const worlds = /\bworlds:\s*\[([^\]]*)\]/.exec(meta)?.[1];
  const list = worlds ? [...worlds.matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
  return id && list.length > 0 && list.length < WORLDS.length ? [{ id, worlds: list }] : [];
});
const ownParts = (world) => WORLD_ONLY.filter((p) => p.worlds.includes(world.id)).map((p) => p.id);
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
const STORE = "litt-gallery:customize";

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

async function open(hash, { width, height, scheme = "light", query = "", saved = { accent: "blue4" }, phone = width < 640 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, hasTouch: phone, isMobile: phone && width >= 390 });
  if (saved) await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), [STORE, JSON.stringify(saved)]);
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
  const other = world.id === "press" ? "device" : "press";
  const { ctx, pg, errors } = await open(world.id, { ...size, scheme, saved: { accent: "blue4", material: other } });
  await pg.locator("section[data-world-hero] :is(button, a[href])").first().waitFor();
  await pg.waitForLoadState("networkidle");
  const attr = world.attribute ?? undefined;
  const settled = await pg.waitForFunction(([a, k, id]) => document.documentElement.dataset.material === (a ?? undefined) && JSON.parse(localStorage.getItem(k) || "{}").material === (id === "flat" ? undefined : id), [attr ?? null, STORE, world.id], { timeout: 3000 }).then(() => true, () => false);
  if (mutate) await pg.evaluate(mutate);
  const r = await pg.evaluate(inspect);
  const saved = await pg.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}").material, STORE);

  claim("a world page has one main and one h1", r.mains === 1 && r.h1s === 1 ? null : `${where}: ${r.mains} mains, ${r.h1s} h1s`);
  claim("arriving on a world page puts its data-material on <html> (none for Press) and saves it as your look's material", settled && r.material === attr && saved === (world.id === "flat" ? undefined : world.id) ? null : `${where}: data-material is ${r.material ?? "absent"} (want ${attr ?? "absent"}), saved material is ${saved ?? "unset"} (want ${world.id === "flat" ? "unset: Flat is the gallery's own look and is stored as no choice" : world.id})`);
  claim("the hero block is framed and live: a labelled frame, and a named button or link in it takes focus", r.frames.length > 0 && r.reachable > 0 && r.focusable ? null : `${where}: ${r.frames.length} frames, ${r.reachable} named controls, focus ${r.focusable ? "took" : "did not take"}`);
  claim("the first screen holds exactly one accent fill (the Install button)", r.first.length === 1 ? null : `${where}: ${r.first.length} accent fills on the first screen: ${r.first.join(", ") || "none"}`);
  claim("a second accent fill on the page sits at least a screen below the first", r.close.length === 0 ? null : `${where}: accent fills within one screen of another: ${r.close.join(", ")}`);
  const want = FOUNDATIONS.map(([key, label]) => ({ label, text: world.foundations[key] }));
  const same = r.cards.length === 5 && want.every((w, i) => r.cards[i].label === w.label && r.cards[i].text === w.text);
  claim("Foundations is five cards, Color, Type, Light, Shape, Motion, each with the world's line from look.ts", same ? null : `${where}: cards ${JSON.stringify(r.cards.map((c) => c.label))} (want ${want.map((w) => w.label).join(", ")}), text ${r.cards.every((c, i) => c.text === want[i]?.text) ? "matches" : "differs from look.ts"}`);
  const parts = ownParts(world).map((id) => `#${id}`);
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
     line on a card, a page wider than the screen. The world is Press at 1440. */
  const press = WORLDS.find((w) => w.id === "press");
  const breaks = [
    ["the first screen holds exactly one accent fill (the Install button)", () => { const d = document.createElement("div"); d.style.cssText = "position:absolute;top:80px;left:8px;width:120px;height:40px;background:var(--accent)"; document.querySelector("main").append(d); }],
    ["Foundations is five cards, Color, Type, Light, Shape, Motion, each with the world's line from look.ts", () => document.querySelector("section#foundations li").remove()],
    ["Foundations is five cards, Color, Type, Light, Shape, Motion, each with the world's line from look.ts", () => { document.querySelector("section#foundations li p").textContent = "Made up."; }],
    ["a world page has an Only here section listing the world's abilities from look.ts and exactly its own parts", () => document.querySelector("[data-only-here-abilities] li").remove()],
    ["a world page has an Only here section listing the world's abilities from look.ts and exactly its own parts", () => { const a = document.createElement("a"); a.href = "#not-mine"; const li = document.createElement("li"); li.append(a); const ul = document.createElement("ul"); ul.setAttribute("data-only-here-parts", ""); ul.append(li); document.querySelector("section#only-here").append(ul); }],
    ["a world page does not scroll sideways at 1440 or 390", () => { const d = document.createElement("div"); d.style.cssText = "width:3000px;height:4px"; document.querySelector("main").append(d); }],
    ["the hero block is framed and live: a labelled frame, and a named button or link in it takes focus", () => document.querySelectorAll("section[data-world-hero] :is(button, a[href])").forEach((el) => el.remove())],
  ];
  let missed = 0;
  for (const [name, mutate] of breaks) {
    claims.clear();
    await audit(press, SIZES[0], "light", mutate);
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
claim("each world opens on its own block (three different hero frames)", new Set(seen.values()).size === WORLDS.length ? null : `hero frames per world: ${JSON.stringify([...seen])}`);

/* ---------- 320 wide ---------- */
for (const world of WORLDS) for (const scheme of ["light", "dark"]) {
  const { ctx, pg } = await open(world.id, { width: 320, height: 640, scheme, phone: true });
  await pg.locator("section[data-world-hero] :is(button, a[href])").first().waitFor();
  await pg.waitForLoadState("networkidle");
  const wide = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  claim("a world page does not scroll sideways at 1440 or 390", wide > 0 ? `${world.id} · ${scheme} · 320: the page is ${wide}px wider than the screen` : null);
  await ctx.close();
}

/* ---------- a link's look ---------- */
{
  const device = WORLDS.find((w) => w.id === "device");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route("**/*.js", (r) => r.abort());
  const pg = await ctx.newPage();
  await pg.goto(`${base}?look=pink-device#device`, { waitUntil: "load" });
  const painted = await pg.evaluate(() => [document.documentElement.dataset.material, document.body.dataset.accent]);
  claim("?look=pink-device#device paints Device and pink before the app runs (scripts blocked)", painted[0] === device.attribute && painted[1] === "pink" ? null : `painted ${JSON.stringify(painted)}`);
  await ctx.close();

  const { ctx: c2, pg: p2, errors } = await open("device", { width: 1440, height: 900, query: "?look=pink", saved: null });
  await p2.locator("section[data-world-hero] :is(button, a[href])").first().waitFor();
  const end = await p2.evaluate(() => ({ m: document.documentElement.dataset.material, h1: document.querySelectorAll("h1").length, name: document.querySelector("h1")?.textContent }));
  claim("?look=pink#device ends on Device with its page working (one h1, named Device)", end.m === "device" && end.h1 === 1 && end.name === "Device" && errors.length === 0 ? null : `ended ${JSON.stringify(end)}${errors.length ? ", " + errors[0] : ""}`);
  await c2.close();
}

/* ---------- the sidebar, on a component page after a world ---------- */
{
  const { ctx, pg } = await open("device", { width: 1440, height: 900 });
  await pg.waitForFunction(([k]) => JSON.parse(localStorage.getItem(k) || "{}").material === "device", [STORE]);
  const rows = () => pg.locator("[role=group][aria-labelledby=nav-worlds] a").evaluateAll((as) => as.map((a) => [a.textContent.trim().split(/[.\n]/)[0].replace(/(Press|Flat|Device).*/, "$1"), a.getAttribute("aria-current")]));
  const on = Object.fromEntries(await rows());
  claim("on a world's own page, the sidebar marks its row aria-current=page", on.Device === "page" ? null : `rows on #device: ${JSON.stringify(on)}`);
  await pg.evaluate(() => { location.hash = "#button"; });
  await pg.locator("main h1").filter({ hasText: "Button" }).waitFor();
  const off = Object.fromEntries(await rows());
  claim("on a component page, the sidebar marks the gallery's world (Device) aria-current=true and no other row", off.Device === "true" && off.Press == null && off.Flat == null ? null : `rows on #button: ${JSON.stringify(off)}`);
  await ctx.close();
}

/* ---------- the sidebar lists a world-only page in its world and in no other ---------- */
for (const world of WORLDS) {
  const { ctx, pg } = await open("button", { width: 1440, height: 900, saved: { accent: "blue4", material: world.id } });
  await pg.locator("main h1").filter({ hasText: "Button" }).waitFor();
  const listed = await pg.evaluate(() => [...document.querySelectorAll("[role=group][aria-labelledby^=nav-]:not([aria-labelledby=nav-worlds]) a[href^='#']")].map((a) => a.getAttribute("href").slice(1)));
  const missing = WORLD_ONLY.filter((p) => p.worlds.includes(world.id) && !listed.includes(p.id)).map((p) => p.id);
  const foreign = WORLD_ONLY.filter((p) => !p.worlds.includes(world.id) && listed.includes(p.id)).map((p) => p.id);
  claim("on a component page the sidebar lists the world-only pages of the gallery's world and none of another's", missing.length === 0 && foreign.length === 0 && listed.includes("button") ? null : `${world.id}: missing ${JSON.stringify(missing)}, from other worlds ${JSON.stringify(foreign)}, Button listed ${listed.includes("button")}`);
  await ctx.close();
}

/* ---------- the phone's menu ---------- */
{
  const { ctx, pg } = await open("button", { width: 390, height: 844 });
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
  claim("the phone menu lists Worlds with three rows (#press, #flat, #device) before any component group", menu.hrefs.join(",") === "#press,#flat,#device" && menu.before && menu.groupsAbove === 0 ? null : `menu: ${JSON.stringify(menu)}`);
  await ctx.close();
}

/* ---------- the Systems page ---------- */
for (const size of SIZES) {
  const { ctx, pg, errors } = await open("systems", { ...size });
  await pg.locator("main ul[aria-label=Systems] > li").first().waitFor();
  await pg.waitForLoadState("networkidle");
  await pg.waitForFunction(() => [...document.querySelectorAll("main ul[aria-label=Systems] [inert]")].filter((c) => c.querySelector("button, input, [role]")).length === 3, null, { timeout: 5000 }).catch(() => {});
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
  claim("the Systems page is three cards, Press, Flat and Device, each a link to its page named by the system and its line, over its cover scene out of reach", ok ? null : `${size.label}: ${JSON.stringify(r.cards)}`);
  claim("the Systems page does not scroll sideways", r.wide ? `${size.label}: the page scrolls sideways` : null);
  for (const e of errors) claim("the Systems page throws nothing", `${size.label}: ${e}`);
  await ctx.close();
}

/* ---------- llms.txt ---------- */
{
  const text = fs.readFileSync(path.join(dist, "llms.txt"), "utf8");
  const worlds = /^## Worlds\n([\s\S]*?)(?=^## )/m.exec(text)?.[1] ?? "";
  const names = [...worlds.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
  claim("llms.txt has a Worlds section with Press, Flat and Device", names.join(",") === WORLDS.map((w) => w.name).join(",") ? null : `Worlds section headings: ${JSON.stringify(names)}`);
  const full = fs.existsSync(path.join(dist, "llms-full.txt")) ? fs.readFileSync(path.join(dist, "llms-full.txt"), "utf8") : "";
  const listed = [...(text + full).matchAll(/\/docs\/(press|flat|device)\.md/g)].map((m) => m[0]);
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
