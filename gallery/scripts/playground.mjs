#!/usr/bin/env node
/**
 * Each world's player (#press, #flat, #device, #plain, #rack, #heat; plans/018 and 019), checked from a build at 1440x1000.
 *
 *   npm run build && npm run test:playground
 *   node scripts/playground.mjs --dist dist
 *   node scripts/playground.mjs --shard 1/2         every other world's player, from the first (CI runs two shards at once)
 *   node scripts/playground.mjs --self-test         breaks the screen and the object on purpose; fails if the check misses either
 *   node scripts/playground.mjs --greyscale <dir>   writes each world's object in colour and in greyscale in one font,
 *                                                   light and dark, and a sheet of each; judges nothing (the test of an object)
 *
 * It fails when the Playground's old addresses (#playground/device, #playground) do not open the players, and, on each
 * world's player, when:
 * - the screen (data-play-frame) does not wear the world (data-material, none for Press), or the page's <html> material
 *   changed,
 * - the object's root (data-play-object) is not the world's id for a world in OBJECTS, or not "bare" for one that is not,
 * - from Page, Tab does not reach the selector (a slider), then Play, then the screen, or, on Heat's, Press's and Rack's
 *   players, a tab stop sits above the one before it and not to its right (focus runs with the eye; plans/audits/rack.md,
 *   finding 7),
 * - more than one control on the page is named Home (the top row's way out of the world; inside the object the list is
 *   Index everywhere), or a link named Source points inside the gallery (the top row's link to a part's page is Page),
 * - on Index or on a take, two controls of the player share a name but go to different places (not the same href or
 *   the same data-play-to): the selector is Take, never Components, the top row's link beside it,
 * - a world's set in play-object/takes.ts is not twelve parts, each a component page in that world, or a page's id is
 *   components, about or take, which would hide behind the world's own addresses,
 * - the screen does not open on Index, the world's set (a row each, as many as the slider runs to and takes.ts lists),
 *   or a name in a row of Index's grid sits above or below another name in that row (rows hold to their tops), or, on
 *   any world whose body draws its own Index (body.Home, data-play-home="body"; Heat's today), Index does not show the
 *   current row's part live on the screen with exactly one row current, Down and the pointer on a row moving both
 *   (a world that keeps the contract's Index passes),
 * - Right and Down do not go to the next take, Left and Up to the previous, wrapping through Index, or End and Home do
 *   not go to the last take and to Index, with aria-valuenow and the readout's count following,
 * - a take (each in the set) draws nothing inside the screen's box, or anything in the body (the object outside its
 *   screen) is filled with the accent (R6),
 * - on a world in OBJECTS, a rail shows inside the screen beside a take (the screen holds the take alone, plans/024), or,
 *   on a bare object, the rail beside a take does not list the set in order with the take showing marked, and a link to
 *   #<world>/components at its foot,
 * - Index does not go back to the list, or the list does not open the take picked,
 * - two steps along the selector do not write #<world>/take/<id> in place (with no new history entry), or Back from the
 *   take's page (the top row's Page) does not return the player to that take,
 * - on Heat's player, the pursuit meter's drawn box covers less than TAKE_FLOOR of the screen's area,
 * - what the Dialog, Menu, Popover, Select, Context menu, Toast or Tooltip take opens, where the set holds it, (from its first button, by a click
 *   or, for the tooltip, a held pointer) is not inside the screen's box, under the screen's world (1px tolerance),
 * - the take changes within 6s with no hand on it (nothing plays on load), Play does not move it within 5s, or a press
 *   on the screen does not stop it,
 * - following the world's name in the top row (#<world>, outside the screen) while Play runs does not stop Play, open
 *   Index and say so in the live region, or, on a body's own Index, does not make the take just left the current row,
 * - Home's Every component link does not open #<world>/components, or that page does not hold a tile for every
 *   component in the world (read from src/gallery/pages), or a tile's name does not link to #<world>/<id>.
 *
 * --self-test moves the Dialog take's open dialog out to <body>, as a portal that missed the screen's OverlayRoot would,
 * so it leaves the screen and its world, keeps the recorder's body from loading, so Device draws bare, and takes a tile
 * out of Device's gallery view, adds a part Heat does not have to Heat's set, and on Device puts back a second control
 * named Home and a Source link into the gallery, centres Index's rows again with one line wrapping, draws Heat's
 * menu strip, Press's deck and Rack's clip lane under their screens again, takes Heat's live part off its Index and marks a second row current, and sets
 * Heat's screen to the other worlds' height, puts Device's address back to the bare player after a step, and names
 * Device's selector Components again, and presses Play again on Heat just after its world's name opened Index; it fails
 * if the check misses any.
 *
 * Needs Playwright, found as worlds.mjs finds it.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { pageMetas } from "./routes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const dist = path.resolve(get("dist", "dist"));
const selfTest = args.includes("--self-test");
const greyscale = get("greyscale", null);
/* Every world has an object of its own (plans/018, phase 2 & 4). */
const OBJECTS = ["press", "flat", "device", "plain", "rack", "heat"];
/* A string only the recorder's body ships, so --self-test can keep that chunk from loading. */
const RECORDER_MARK = "data-recorder-dial";
/* How much of Heat's screen the pursuit meter covers, at least (plans/audits/heat-fixes.md, finding 7): 13.8% at
   1440x1000 on Heat's 38rem screen, against 13.0% on the 648px screen it had. The plan asked for a quarter. That needs a
   screen under 21rem, and a take sits in the middle of its screen, so Heat's Menu take needs 37rem to keep its open list
   on the screen: the floor sits at the best honest value. */
const TAKE_FLOOR = 0.13;
/* The players whose strip is held above the screen, so focus runs with the eye, and the strip the self-test moves under
   the screen to break it: Heat's (plans/audits/heat-fixes.md, finding 4) and Press's (plans/audits/press.md, finding 6). */
const ORDERED = { heat: "[data-heat-strip]", press: "[data-press-deck]", rack: "[data-rack-lane]" };
const ORDER_CLAIM = "on Heat's, Press's and Rack's players each tab stop is at or below the one before it, or to its right";

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

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".md": "text/markdown", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}/index.html`;

const claims = new Map();
const claim = (name, bad) => {
  if (!claims.has(name)) claims.set(name, []);
  if (bad) claims.get(name).push(bad);
};

const WORLDS = [["Press", "press", undefined], ["Flat", "flat", "flat"], ["Device", "device", "device"], ["Plain", "plain", "plain"], ["Rack", "rack", "rack"], ["Heat", "heat", "heat"]];
const FRAME = "[data-play-frame]";
const SLIDER = "[data-play-object] [role=slider][aria-label=Take]";
/* The takes that open something, and what they open. */
const OPENERS = ["Dialog", "Menu", "Popover", "Select", "Context menu", "Toast", "Tooltip"];
const OVERLAYS = "[role=dialog], [role=alertdialog], [role=menu], [role=listbox], [role=tooltip], [data-toast-id]";
const browser = await chromium.launch();

async function open(hash, { theme, scale = 1 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: scale, reducedMotion: "reduce" });
  await ctx.addInitScript(() => localStorage.setItem("litt-gallery:customize", JSON.stringify({ accent: "blue4" })));
  if (theme) await ctx.addInitScript((t) => localStorage.setItem("litt-gallery:theme", t), theme);
  if (selfTest)
    await ctx.route(/\.js$/, async (route) => {
      /* A request still in flight when its context closes is let go. */
      try {
        const res = await route.fetch();
        const body = await res.text();
        if (body.includes(RECORDER_MARK)) return await route.abort();
        await route.fulfill({ response: res, body });
      } catch {
        await route.abort().catch(() => {});
      }
    });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(e.message));
  await pg.goto(`${base}#${hash}`, { waitUntil: "networkidle" });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(300);
  return { ctx, pg, errors };
}

/** The object's own Play key: never a part on its screen that is also named Play (Rack's transport on its Index). */
const PLAY = '[data-play-object] button[aria-label="Play"]:not([data-play-take] *)';

/** Scrolls the page so the object is whole in the window, under the header. */
const inView = async (pg) => {
  /* The object's body loads on demand, so after a reload it may not be in the page yet. */
  await pg.waitForSelector("[data-play-object]", { state: "attached", timeout: 10000 });
  await pg.evaluate(() => window.scrollBy(0, document.querySelector("[data-play-object]").getBoundingClientRect().top - 80));
};

/** Where every visible element matching the selector sits against the screen, in the box and in the DOM. */
function place(pg, selector) {
  return pg.evaluate(([F, selector]) => {
    const frame = document.querySelector(F);
    const f = frame.getBoundingClientRect();
    return [...document.querySelectorAll(selector)]
      .filter((el) => el.getClientRects().length > 0 && el.getBoundingClientRect().height > 0 && !el.closest("[aria-hidden=true]"))
      .map((el) => {
        const b = el.getBoundingClientRect();
        const bottom = b.bottom + Math.min(0, parseFloat(getComputedStyle(el).marginBottom) || 0);
        const inside = b.left >= f.left - 1 && b.top >= f.top - 1 && b.right <= f.right + 1 && bottom <= f.bottom + 1;
        const world = el.closest("[data-material], [data-theme]");
        return {
          ok: inside && world === frame,
          what: `${el.getAttribute("role") ?? "toast"} at ${Math.round(b.left)},${Math.round(b.top)} to ${Math.round(b.right)},${Math.round(bottom)} on a screen at ${Math.round(f.left)},${Math.round(f.top)} to ${Math.round(f.right)},${Math.round(f.bottom)}${world === frame ? "" : ", under another world's element"}`,
        };
      });
  }, [FRAME, selector]);
}

/** Elements in the object but outside its screen filled with the accent (at least 24 by 16, as wall.mjs counts). */
function bodyFills(pg) {
  return pg.evaluate(([F]) => {
    const object = document.querySelector("[data-play-object]");
    if (!object) return ["no [data-play-object]"];
    const probe = document.createElement("div");
    probe.style.background = "var(--accent)";
    object.append(probe);
    const accent = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const out = [];
    for (const el of object.querySelectorAll("*")) {
      if (el.closest(F) || getComputedStyle(el).backgroundColor !== accent) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 24 || b.height < 16) continue;
      out.push(el.tagName.toLowerCase() + (el.getAttribute("aria-label") ? ` "${el.getAttribute("aria-label")}"` : ""));
    }
    return out;
  }, [FRAME]);
}

/** The take showing: its id, and whether it draws something with a box inside the screen's. */
function showing(pg) {
  return pg.evaluate((F) => {
    const frame = document.querySelector(F);
    const f = frame.getBoundingClientRect();
    const take = frame.querySelector("[data-play-take]");
    if (!take) return { id: null, draws: false };
    const draws = [...take.querySelectorAll("*")].some((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && b.right > f.left && b.left < f.right && b.bottom > f.top && b.top < f.bottom;
    });
    return { id: take.dataset.playTake, draws };
  }, FRAME);
}

/* No two controls on a player share a name unless they go to the same place: the same href, or the same
   data-play-to (the contract's two Index controls). What a take or Index's live part draws is the part's, not the
   player's, so it is left out. */
const OWN_INDEX_CLAIM = "on a body's own Index a live part is on the screen and exactly one row is current, and Down or the pointer moves both";
const NAMES_CLAIM = "no two controls on a player share a name unless they go to the same place";
function sharedNames(pg) {
  return pg.evaluate(() => {
    const name = (el) => (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim();
    const shown = (el) => el.getClientRects().length > 0 && !el.closest("[aria-hidden=true], [inert]");
    const part = (el) => el.closest("[data-play-live]") || el.closest("[data-play-take]:not([data-play-take=home])");
    const controls = [...document.querySelectorAll("a[href], button, [role=button], [role=link], [role=slider], [role=tab], [role=menuitem], [role=option]")].filter((el) => shown(el) && !part(el) && name(el));
    const byName = new Map();
    for (const el of controls) byName.set(name(el), [...(byName.get(name(el)) ?? []), el]);
    const to = (el) => (el.getAttribute("href") ? new URL(el.href, location.href).href : el.dataset.playTo ? `to:${el.dataset.playTo}` : null);
    return [...byName].filter(([, els]) => els.length > 1 && (els.some((el) => !to(el)) || new Set(els.map(to)).size > 1)).map(([n, els]) => `"${n}" on ${els.map((el) => el.getAttribute("role") ?? el.tagName.toLowerCase()).join(", ")}`);
  });
}

const readout = (pg) => pg.evaluate(() => document.querySelector("[data-play-readout]")?.textContent?.replace(/\s+/g, " ").trim() ?? null);
const now = (pg) => pg.locator(SLIDER).getAttribute("aria-valuenow").then(Number);
const pad = (i, n) => String(i).padStart(Math.max(2, String(n).length), "0");

/** Picks a take by name, as a person would: Index, back to the list, then its row in the set. False when it is not in the set. */
async function find(pg, title) {
  await pg.locator("[data-play-object]").getByRole("button", { name: "Index", exact: true }).first().click();
  await pg.waitForTimeout(400);
  const row = pg.locator(`${FRAME} [data-play-index]`).getByRole("button", { name: title, exact: true });
  if (!(await row.count())) return false;
  await row.first().click();
  await pg.waitForTimeout(500);
  return true;
}

/** The set on Home: each take's title, in order. */
const setOn = (pg) => pg.evaluate((F) => [...document.querySelectorAll(`${F} [data-play-index] button`)].map((b) => (b.querySelector("span") ?? b).textContent.trim()), FRAME);

/** The component pages in a world, as the world's gallery view holds them (read from src/gallery/pages). */
const PARTS = pageMetas().filter((p) => p.group && p.group !== "Blocks" && p.group !== "Worlds" && !p.world);
const partsIn = (world) => PARTS.filter((p) => !p.worlds || p.worlds.includes(world)).map((p) => p.id);

/* Each world's set, read from play-object/takes.ts, so the list lives once. --self-test adds a part Heat does not have. */
const SETS = Object.fromEntries(
  [...fs.readFileSync(path.join(here, "..", "src", "gallery", "play-object", "takes.ts"), "utf8").matchAll(/^\s+(\w+): \[([^\]]*)\],$/gm)].map((m) => [m[1], [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1])]),
);
const shadowed = pageMetas().filter((p) => ["components", "about", "take"].includes(p.id)).map((p) => p.id);
claim("no page id is components, about or take, the world's own addresses", shadowed.length ? `pages named ${shadowed.join(", ")}` : null);
if (selfTest) SETS.heat =[...(SETS.heat ?? []), "seven-segment"];
for (const [, id] of WORLDS) {
  const set = SETS[id] ?? [];
  const missing = set.filter((p) => !partsIn(id).includes(p));
  claim("every part in a world's set (takes.ts) is in that world, twelve to a set", set.length === 12 && !missing.length ? null : `${id}: ${set.length} in the set${missing.length ? `, not in the world: ${missing.join(", ")}` : ""}`);
}

/**
 * --greyscale: each world's object at rest on its first take, in colour, then in greyscale with every word in one
 * font, light and dark, and a sheet of each set side by side. The test of an object (plans/018): with the colour and
 * the face gone, does the structure alone name the world? It judges nothing; a person reads the sheet.
 */
async function pictures(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const shots = { color: { light: [], dark: [] }, grey: { light: [], dark: [] } };
  for (const theme of ["light", "dark"]) {
    for (const [world, id] of WORLDS) {
      const { ctx, pg } = await open(id, { theme, scale: 2 });
      await pg.waitForTimeout(500);
      await inView(pg);
      await pg.mouse.move(0, 0);
      const object = pg.locator("[data-play-object]");
      for (const kind of ["color", "grey"]) {
        if (kind === "grey")
          await pg.addStyleTag({ content: "[data-play-object]{filter:grayscale(1)}[data-play-object],[data-play-object] *{font-family:sans-serif!important}" });
        await pg.waitForTimeout(200);
        const file = path.join(dir, `${kind}-${id}-${theme}.png`);
        await object.screenshot({ path: file });
        shots[kind][theme].push([world, file]);
      }
      await ctx.close();
    }
  }
  for (const kind of ["color", "grey"])
    for (const theme of ["light", "dark"]) {
      const cells = shots[kind][theme].map(([w, f]) => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}"><figcaption>${w}</figcaption></figure>`).join("");
      const pg = await browser.newPage({ viewport: { width: 2400, height: 1000 }, deviceScaleFactor: 1 });
      await pg.setContent(`<style>body{margin:0;padding:32px;background:${theme === "dark" ? "#111" : "#eee"};color:${theme === "dark" ? "#ccc" : "#333"};font:14px sans-serif}main{display:grid;grid-template-columns:repeat(3,1fr);gap:32px}figure{margin:0}img{display:block;width:100%}figcaption{margin-top:8px}</style><main>${cells}</main>`); // litt-allow: the sheet's own page, never shipped
      await pg.locator("main").screenshot({ path: path.join(dir, `sheet-${kind}-${theme}.png`) });
      await pg.close();
    }
  console.log(`playground --greyscale: the six objects, in colour and in greyscale in one font, light and dark, in ${dir}`);
  await browser.close();
  server.close();
  process.exit(0);
}

if (greyscale) await pictures(greyscale);

/* The Playground's old addresses open the players (plans/019): #playground/device opens #device, #playground the gallery's. */
for (const [from, to] of [["playground/device", "#device"], ["playground", "#flat"]]) {
  const { ctx, pg } = await open(from);
  const hash = await pg.evaluate(() => location.hash);
  claim("the Playground's old addresses open the players", hash === to ? null : `#${from} stays on ${hash}, wants ${to}`);
  await ctx.close();
}

/* The players this run opens. --shard deals the worlds round-robin. --self-test opens only the worlds its breaks land
   in (Device's bare object and missing tile, Heat's and Rack's strips under their screens, and a world whose set holds
   the Dialog take), since the set claim above
   reads every world without a browser. */
const [shard, shards] = get("shard", "1/1").split("/").map(Number);
const dialogWorld = WORLDS.find(([, id]) => id === "device" && SETS.device?.includes("dialog")) ?? WORLDS.find(([, id]) => SETS[id]?.includes("dialog"));
const RUN = selfTest
  ? WORLDS.filter((w) => w[1] === "device" || w[1] === "heat" || w[1] === "press" || w[1] === "rack" || w === dialogWorld)
  : WORLDS.filter((_, i) => i % shards === shard - 1);
for (const [world, id, attribute] of RUN) {
  const { ctx, pg, errors } = await open(id);
  const htmlBefore = await pg.evaluate(() => document.documentElement.dataset.material ?? null);
  await inView(pg);
  const worn = await pg.evaluate((F) => ({ frame: document.querySelector(F)?.dataset.material ?? null, html: document.documentElement.dataset.material ?? null }), FRAME);
  claim("the screen wears the world", worn.frame === (attribute ?? null) ? null : `${world}: data-material is ${worn.frame}`);
  claim("the page around the object keeps its own world", worn.html === htmlBefore ? null : `${world}: <html> went from ${htmlBefore} to ${worn.html}`);

  const drawn = await pg.evaluate(() => document.querySelector("[data-play-object]")?.dataset.playObject ?? null);
  const want = OBJECTS.includes(id) ? id : "bare";
  claim("the object is the world's own, or bare for a world not drawn yet", drawn === want ? null : `${world}: data-play-object is ${drawn}, wants ${want}`);

  /* Nothing plays on load. */
  const first = await now(pg);
  await pg.waitForTimeout(6000);
  claim("nothing plays on load", (await now(pg)) === first ? null : `${world}: the take moved from ${first} with no hand on it`);

  /* One name per place (plans/audits/heat-fixes.md, finding 3 and 10): Home is the way out of the world alone, and the
     top row's link to a part's page is Page. The break: a second Home and a Source link into the gallery, on Device. */
  if (selfTest && id === "device")
    await pg.evaluate(() => {
      const object = document.querySelector("[data-play-object]");
      const home = Object.assign(document.createElement("button"), { type: "button", textContent: "Home" });
      const source = Object.assign(document.createElement("a"), { href: "#device/button", textContent: "Source" });
      home.dataset.selfTest = source.dataset.selfTest = "";
      object.prepend(home, source);
    });
  const names = await pg.evaluate(() => {
    const name = (el) => (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim();
    const shown = (el) => el.getClientRects().length > 0 && !el.closest("[aria-hidden=true], [inert]");
    const controls = [...document.querySelectorAll("a[href], button, [role=button], [role=link], [role=tab], [role=menuitem], [role=option]")].filter(shown);
    return {
      home: controls.filter((el) => name(el) === "Home").map((el) => `${el.tagName.toLowerCase()}${el.getAttribute("href") ? ` → ${el.getAttribute("href")}` : ""}`),
      source: [...document.querySelectorAll("a[href]")].filter((a) => shown(a) && name(a) === "Source" && new URL(a.href, location.href).origin === location.origin).map((a) => a.getAttribute("href")),
    };
  });
  claim("on every player exactly one control is named Home, the way out", names.home.length === 1 ? null : `${world}: ${names.home.length} controls named Home${names.home.length ? `: ${names.home.join(", ")}` : ""}`);
  claim("no link named Source points inside the gallery", names.source.length === 0 ? null : `${world}: Source links to ${names.source.join(", ")}`);
  if (selfTest) await pg.evaluate(() => document.querySelectorAll("[data-self-test]").forEach((el) => el.remove()));

  /* One name, one place (plans/audits/shared-fixes.md, Track 2 step 3): the selector is Take, not Components, the top
     row's link beside it that goes to the gallery view. The break, on Device: the selector named Components again. */
  if (selfTest && id === "device") await pg.evaluate(() => document.querySelector("[data-play-object] [role=slider]")?.setAttribute("aria-label", "Components"));
  const twins = await sharedNames(pg);
  claim(NAMES_CLAIM, twins.length ? `${world} on Index: ${twins.join("; ")}` : null);
  if (selfTest && id === "device") await pg.evaluate(() => document.querySelector("[data-play-object] [role=slider]")?.setAttribute("aria-label", "Take"));

  /* The keyboard: Page, then the selector, Play and the screen. */
  await pg.locator("[data-play-object]").getByRole("link", { name: "Page", exact: true }).focus();
  const stops = [];
  for (let i = 0; i < 3; i++) {
    await pg.keyboard.press("Tab");
    stops.push(
      await pg.evaluate((F) => {
        const a = document.activeElement;
        return a?.matches(F) ? "screen" : a?.getAttribute("role") === "slider" ? "slider" : a?.getAttribute("aria-label") === "Play" ? "play" : a?.tagName.toLowerCase();
      }, FRAME),
    );
  }
  claim("from Page, Tab reaches the selector, then Play, then the screen", stops.join(",") === "slider,play,screen" ? null : `${world}: ${stops.join(", ")}`);

  /* Heat's, Press's and Rack's order (plans/audits/heat-fixes.md, finding 4; press.md, finding 6; rack.md, finding 7):
     focus runs with the eye. From the object's first stop to its last, each tab stop is at or below the one before it,
     or to its right. The break: the strip (Heat's menu strip, Press's deck, Rack's clip lane) drawn under the screen
     again, as it was. */
  if (ORDERED[id]) {
    if (selfTest)
      await pg.evaluate((S) => {
        const strip = document.querySelector(S);
        if (strip) strip.style.order = "3";
      }, ORDERED[id]);
    await pg.locator("[data-play-object] a[href], [data-play-object] button").first().focus();
    const path = [];
    for (let i = 0; i < 48; i++) {
      const at = await pg.evaluate(() => {
        const a = document.activeElement;
        if (!a || !a.closest("[data-play-object]")) return null;
        const b = a.getBoundingClientRect();
        const name = (a.getAttribute("aria-label") ?? a.textContent ?? a.tagName).replace(/\s+/g, " ").trim().slice(0, 24);
        return { name, top: Math.round(b.top + scrollY), left: Math.round(b.left + scrollX), right: Math.round(b.right + scrollX) };
      });
      if (!at) break;
      path.push(at);
      await pg.keyboard.press("Tab");
    }
    const against = path.flatMap((b, k) => {
      const a = path[k - 1];
      return a && b.top < a.top - 1 && b.left <= a.left + 1 ? [`${a.name} (${a.left},${a.top}) then ${b.name} (${b.left},${b.top})`] : [];
    });
    claim(ORDER_CLAIM, path.length > 3 && !against.length ? null : `${world}: ${against.length ? against.join("; ") : `${path.length} stops`}`);
    if (selfTest)
      await pg.evaluate((S) => {
        const strip = document.querySelector(S);
        if (strip) strip.style.order = "";
      }, ORDERED[id]);
  }

  const n = Number(await pg.locator(SLIDER).getAttribute("aria-valuemax"));

  /* Index: the world opens on its set, a flat list to pick from, and a way to every component. */
  const home = await showing(pg);
  const set = await setOn(pg);
  claim(
    "the screen opens on Index, the world's set to pick from",
    home.id === "home" && (await readout(pg))?.includes("Index") && set.length === n && n === (SETS[id] ?? []).length ? null : `${world}: showing ${home.id}, readout "${await readout(pg)}", ${set.length} in the set on Index, the slider runs to ${n}`,
  );

  /* A body's own Index (body.Home, plans/audits/shared-fixes.md, Track 3; Heat's first, finding 1): the current row's
     part is live on the screen, and exactly one row is current. Down makes the next row current and brings its part,
     and the pointer on a row does the same. A body that keeps the contract's Index has nothing to show here and
     passes. The break, on Heat: the live part taken away and a second row marked current. */
  const ownIndex = await pg.locator(`${FRAME} [data-play-take=home][data-play-home=body]`).count();
  claim(OWN_INDEX_CLAIM, null);
  if (ownIndex) {
    if (selfTest && id === "heat")
      await pg.evaluate((F) => {
        document.querySelector(`${F} [data-play-live]`)?.remove();
        document.querySelectorAll(`${F} [data-play-index] button`)[3]?.setAttribute("data-current", "");
      }, FRAME);
    const menu = () =>
      pg.evaluate((F) => {
        const f = document.querySelector(F).getBoundingClientRect();
        const live = document.querySelector(`${F} [data-play-take=home] [data-play-live]`);
        const draws = !!live && [...live.querySelectorAll("*")].some((el) => {
          const b = el.getBoundingClientRect();
          return b.width > 0 && b.height > 0 && b.left >= f.left - 1 && b.right <= f.right + 1 && b.top >= f.top - 1 && b.bottom <= f.bottom + 1;
        });
        const current = [...document.querySelectorAll(`${F} [data-play-index] button[data-current]`)].map((b) => b.textContent.trim());
        return { live: live?.dataset.playLive ?? null, draws, current };
      }, FRAME);
    const ids = SETS[id] ?? [];
    const ok = (m, k) => m.draws && m.current.length === 1 && m.live === ids[k];
    /* The live part is a lazy chunk, so it can take longer than a fixed wait to draw on a slow runner (CI read Heat's
       Tune menu 300ms after the pointer reached its row, before it had drawn): read until row k's part is drawn. */
    const settled = async (k) => {
      const end = Date.now() + 5000;
      let m = await menu();
      while (!ok(m, k) && Date.now() < end) {
        await pg.waitForTimeout(100);
        m = await menu();
      }
      return m;
    };
    const atRest = selfTest ? await menu() : await settled(0);
    let moved = null, pointed = null;
    if (!selfTest) {
      await pg.locator(`${FRAME} [data-play-index] button[data-current]`).focus();
      await pg.keyboard.press("ArrowDown");
      moved = await settled(1);
      await pg.keyboard.press("ArrowUp");
      await pg.waitForTimeout(200);
      const third = await pg.locator(`${FRAME} [data-play-index] button`).nth(2).boundingBox();
      if (third) {
        await pg.mouse.move(third.x + third.width / 2, third.y + third.height / 2);
        pointed = await settled(2);
        await pg.mouse.move(0, 0);
      }
      await pg.locator(`${FRAME} [data-play-index] button`).first().focus();
      await pg.waitForTimeout(200);
    }
    claim(
      OWN_INDEX_CLAIM,
      ok(atRest, 0) && (!moved || ok(moved, 1)) && (!pointed || ok(pointed, 2))
        ? null
        : `${world}: at rest ${JSON.stringify(atRest)}${moved ? `, after Down ${JSON.stringify(moved)}` : ""}${pointed ? `, with the pointer on the third row ${JSON.stringify(pointed)}` : ""}`,
    );
    if (selfTest) await pg.reload({ waitUntil: "networkidle" }).then(() => pg.waitForTimeout(300)).then(() => inView(pg));
  }

  /* Index's rows hold to their tops (finding 6): every name in a row of the grid shares a top, so a line that wraps
     never lifts its name above its neighbours'. The break, on Device: the rows centred again, as they were, and the
     first row's line made long enough to wrap. */
  if (selfTest && id === "device")
    await pg.evaluate((F) => {
      const rows = [...document.querySelectorAll(`${F} [data-play-index] li > button`)];
      for (const b of rows) b.style.alignContent = "center";
      const line = rows[0]?.querySelector("[aria-hidden=true]");
      if (line) (line.dataset.was = line.textContent), (line.textContent = `${line.textContent} ${line.textContent} ${line.textContent}`);
    }, FRAME);
  const tops = await pg.evaluate((F) => {
    const rows = new Map();
    for (const li of document.querySelectorAll(`${F} [data-play-index] li`)) {
      const name = li.querySelector("button > span");
      if (!name) continue;
      const y = Math.round(li.getBoundingClientRect().top);
      rows.set(y, [...(rows.get(y) ?? []), [name.textContent.trim(), Math.round(name.getBoundingClientRect().top)]]);
    }
    return [...rows.values()].filter((r) => new Set(r.map(([, t]) => t)).size > 1).map((r) => r.map(([n, t]) => `${n} at ${t}`).join(", "));
  }, FRAME);
  claim("every name in a row of Index's grid shares a top", tops.length === 0 ? null : `${world}: ${tops.join("; ")}`);
  if (selfTest && id === "device")
    await pg.evaluate((F) => {
      for (const b of document.querySelectorAll(`${F} [data-play-index] li > button`)) b.style.alignContent = "";
      for (const l of document.querySelectorAll(`${F} [data-was]`)) (l.textContent = l.dataset.was), delete l.dataset.was;
    }, FRAME);

  /* One level: Right and Down go on, Left and Up go back, wrapping through Index; End and Home go to the ends. */
  await pg.locator(SLIDER).focus();
  for (const [key, to] of [["ArrowRight", 1], ["ArrowDown", 2], ["ArrowUp", 1], ["ArrowLeft", 0], ["ArrowLeft", n], ["ArrowRight", 0], ["End", n], ["Home", 0]]) {
    await pg.keyboard.press(key);
    await pg.waitForTimeout(150);
    const v = await now(pg);
    const text = await readout(pg);
    const count = `${pad(to, n)} / ${pad(n, n)}`;
    claim("Right and Down go on, Left and Up go back, wrapping through Index, End and Home go to the ends, and the readout follows", v === to && text?.includes(count) ? null : `${world} · ${key}: at ${v}, readout "${text}", wants ${to} and "${count}"`);
  }

  /* Every take draws, and the body is never filled with the accent: through the set, as a person goes. */
  claim("every take draws something inside the screen's box", n > 0 ? null : `${world}: no takes`);
  claim("nothing in the object's body is filled with the accent", null);
  for (let j = 0; j < n; j++) {
    await pg.keyboard.press("ArrowRight");
    await pg.waitForTimeout(120);
    let s = await showing(pg);
    if (!s.draws) {
      await pg.waitForTimeout(800);
      s = await showing(pg);
    }
    claim("every take draws something inside the screen's box", s.draws ? null : `${world} · ${set[j]}: ${s.id ?? "nothing showing"} draws nothing inside the screen`);
    const fills = await bodyFills(pg);
    claim("nothing in the object's body is filled with the accent", fills.length === 0 ? null : `${world} · ${set[j]}: ${fills.join(", ")}`);
  }

  /* The rail, while a take shows: the set in order, the one showing marked, and the way to every component at its foot. */
  const rail = await pg.evaluate(() => {
    const r = document.querySelector("[data-play-rail]");
    return r && {
      rows: [...r.querySelectorAll("button")].map((b) => b.textContent.trim()),
      current: [...r.querySelectorAll("button[aria-current=page]")].map((b) => b.textContent.trim()),
      foot: [...r.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")),
    };
  });
  const title = await readout(pg);
  const takeTwins = await sharedNames(pg);
  claim(NAMES_CLAIM, takeTwins.length ? `${world} on ${title}: ${takeTwins.join("; ")}` : null);
  /* A world with an object of its own holds the take alone on its screen (plans/024, breach 17): no rail there, and the
     set stays on Index, behind its key (claimed below). A bare object keeps the rail. */
  if (OBJECTS.includes(id)) claim("an object's screen holds the take alone, with no rail inside it", rail === null ? null : `${world}: a rail of ${rail.rows.length} rows inside the screen`);
  else claim(
    "the rail lists the set, marks the take showing, and links to every component",
    rail && rail.rows.join("|") === set.join("|") && rail.current.length === 1 && title?.includes(rail.current[0]) && rail.foot.join() === `#${id}/components` ? null : `${world}: rail ${JSON.stringify(rail)}, set ${JSON.stringify(set)}, readout "${title}"`,
  );

  /* Index: back to the list, and the list takes you where you pick. */
  await inView(pg);
  const last = set[set.length - 1];
  const went = await find(pg, last);
  const picked = await readout(pg);
  claim("Index goes back to the list, and the list opens what you pick", went && picked?.includes(last) ? null : `${world}: after picking ${last} from Index the readout says "${picked}"`);

  /* The take is in the address (plans/audits/shared-fixes.md, S2): stepping writes #<world>/take/<id> in place, never a
     new history entry, and Back from the take's page returns the player to that take. The break, on Device: the
     address put back to the bare player after the step, as a player that keeps its take to itself would leave it. */
  {
    await inView(pg);
    await pg.locator(SLIDER).focus();
    await pg.keyboard.press("Home");
    const entries = await pg.evaluate(() => history.length);
    await pg.keyboard.press("ArrowRight");
    await pg.keyboard.press("ArrowRight");
    await pg.waitForTimeout(200);
    const second = SETS[id]?.[1];
    if (selfTest && id === "device") await pg.evaluate((w) => history.replaceState(history.state, "", `#${w}`), id);
    const written = await pg.evaluate(() => ({ hash: location.hash, entries: history.length }));
    await pg.locator("[data-play-object]").getByRole("link", { name: "Page", exact: true }).click();
    await pg.waitForFunction((h) => location.hash === h, `#${id}/${second}`, { timeout: 3000 }).catch(() => {});
    await pg.waitForTimeout(300);
    const paged = await pg.evaluate(() => location.hash);
    await pg.goBack();
    await pg.waitForSelector(SLIDER, { timeout: 5000 }).catch(() => {});
    await pg.waitForTimeout(500);
    const back = await pg.evaluate(() => location.hash);
    const value = await pg.locator(SLIDER).getAttribute("aria-valuenow").catch(() => null);
    const said = await readout(pg);
    claim(
      "the take is in the address, written in place as you step, and Back from its page returns to it",
      written.hash === `#${id}/take/${second}` && written.entries === entries && paged === `#${id}/${second}` && back === `#${id}/take/${second}` && value === "2" && said?.includes(set[1])
        ? null
        : `${world}: after two steps the address is ${written.hash} (wants #${id}/take/${second}) with ${written.entries - entries} new entries; Page went to ${paged}; Back came to ${back}, the slider at ${value}, readout "${said}" (wants ${set[1]})`,
    );
  }

  /* A take's size (finding 7): on Heat's shorter screen the pursuit meter's drawn box (every element in the take that
     paints: text, a fill, an edge, an image) covers at least TAKE_FLOOR of the screen's area. A quarter is not reachable
     without scaling the part or moving the take off the screen's middle (see TAKE_FLOOR). The break: the screen at the
     other worlds' height on a tall window again (46rem). */
  if (id === "heat" && (await find(pg, "Pursuit meter"))) {
    await inView(pg);
    if (selfTest) await pg.evaluate((F) => (document.querySelector(F).style.height = "46rem"), FRAME);
    const cover = await pg.evaluate((F) => {
      const frame = document.querySelector(F);
      const f = frame.getBoundingClientRect();
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      for (const el of frame.querySelectorAll("[data-play-take] *")) {
        const x = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (!x.width || !x.height || cs.visibility === "hidden") continue;
        const paints =
          [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) ||
          cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.backgroundImage !== "none" ||
          parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0 ||
          ["svg", "img", "canvas", "input"].includes(el.tagName.toLowerCase());
        if (!paints) continue;
        l = Math.min(l, x.left); t = Math.min(t, x.top); r = Math.max(r, x.right); b = Math.max(b, x.bottom);
      }
      return { share: r > l ? ((r - l) * (b - t)) / (f.width * f.height) : 0, take: `${Math.round(r - l)} by ${Math.round(b - t)}`, screen: `${Math.round(f.width)} by ${Math.round(f.height)}` };
    }, FRAME);
    claim(`on Heat's player the pursuit meter covers at least ${TAKE_FLOOR * 100}% of its screen`, cover.share >= TAKE_FLOOR ? null : `${world}: ${cover.take} on a screen ${cover.screen}, ${(cover.share * 100).toFixed(1)}%`);
    if (selfTest) await pg.evaluate((F) => (document.querySelector(F).style.height = ""), FRAME);
  }

  /* What a take opens stays on the screen, in its world. */
  for (const title of OPENERS) {
    if (!(await find(pg, title))) continue; // not in this world
    await inView(pg);
    const button = pg.locator(`${FRAME} [data-play-take] button:visible, ${FRAME} [data-play-take] [role=combobox]:visible`).first();
    if (!(await button.count())) {
      claim("what a take opens stays on the screen, in its world", `${world} · ${title}: no button to open it with`);
      continue;
    }
    if (title === "Tooltip") {
      const b = await button.boundingBox();
      await pg.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await pg.waitForTimeout(1000);
    } else if (title === "Context menu") {
      await pg.locator(`${FRAME} [data-play-take] *:visible`).first().click({ button: "right" }).catch(() => {});
      await pg.waitForTimeout(700);
    } else {
      await button.click();
      await pg.waitForTimeout(900);
    }
    /* The break, once open: the dialog escapes to <body>, as a portal that missed the screen's OverlayRoot would. */
    if (selfTest && title === "Dialog")
      await pg.evaluate((F) => {
        const d = document.querySelector(`${F} [role=dialog]`);
        if (d) Object.assign(document.body.appendChild(d).style, { position: "fixed", left: "0", top: "0" });
      }, FRAME);
    const opened = await place(pg, OVERLAYS);
    claim("what a take opens stays on the screen, in its world", opened.length ? null : `${world} · ${title}: nothing opened from its first button`);
    for (const b of opened) claim("what a take opens stays on the screen, in its world", b.ok ? null : `${world} · ${title}: ${b.what}`);
    await pg.mouse.move(0, 0);
    await pg.keyboard.press("Escape");
    await pg.keyboard.press("Escape");
    await pg.waitForTimeout(400);
    /* The escaped dialog, once read, is taken away, so it cannot stand over the claims that follow. */
    if (selfTest) await pg.evaluate(() => document.querySelectorAll("body > [role=dialog]").forEach((d) => d.remove()));
  }

  /* Play, only when pressed, and a hand on the screen stops it. */
  await inView(pg);
  const before = await now(pg);
  await pg.locator(PLAY).click();
  await pg.waitForTimeout(5000);
  const after = await now(pg);
  const pressed = await pg.locator(PLAY).getAttribute("aria-pressed");
  claim("Play steps through the takes, and a press on the screen stops it", after !== before && pressed === "true" ? null : `${world}: after Play the take went ${before} to ${after}, Play pressed ${pressed}`);
  const sb = await pg.locator(FRAME).boundingBox();
  await pg.mouse.click(sb.x + 8, sb.y + 8);
  const held = await now(pg);
  await pg.waitForTimeout(5000);
  const still = await now(pg);
  claim("Play steps through the takes, and a press on the screen stops it", still === held ? null : `${world}: after a press on the screen the take went ${held} to ${still}`);

  /* The world's name in the top row (#<world>) sits outside the screen, so no hand on the screen stops Play there.
     Followed while Play runs, it still stops Play and brings Index, with the take just left as Index's current row
     where the body draws its own Index, and says so in the live region. The break, on Heat: Play pressed again just
     after, as a reader of the address that skips the hand's path leaves it running. */
  {
    await inView(pg);
    const play = pg.locator(PLAY);
    await play.click();
    await pg.waitForFunction((S) => Number(document.querySelector(S)?.getAttribute("aria-valuenow")) >= 2, SLIDER, { timeout: 6000 }).catch(() => {});
    /* By the keys, with the pointer off the page, so a row the page scrolls under a still pointer is not made current.
       The take just left is read from the address it moves off: Play may step once more between any
       earlier read and the key. */
    await pg.mouse.move(0, 0);
    await pg.evaluate(() => {
      window.__left = null;
      window.addEventListener("hashchange", (e) => (window.__left ??= new URL(e.oldURL).hash.split("/take/")[1] ?? ""), { once: true });
    });
    await pg.locator(`a[href="#${id}"]`).first().focus();
    await pg.keyboard.press("Enter");
    await pg.waitForFunction(() => window.__left !== null, null, { timeout: 2000 }).catch(() => {});
    const left = (SETS[id] ?? []).indexOf(await pg.evaluate(() => window.__left)) + 1;
    if (selfTest && id === "heat") await play.click();
    await pg.waitForTimeout(300);
    const named = await pg.evaluate((F) => ({
      said: document.querySelector("[data-play-object] > [role=status]")?.textContent ?? "",
      current: [...document.querySelectorAll(`${F} [data-play-take=home][data-play-home=body] [data-play-index] button[data-current]`)].map((b) => b.textContent.trim()),
      own: !!document.querySelector(`${F} [data-play-take=home][data-play-home=body]`),
    }), FRAME);
    const stopped = await play.getAttribute("aria-pressed");
    const atIndex = await now(pg);
    await pg.waitForTimeout(5000);
    const stays = await now(pg);
    const title = set[left - 1];
    claim(
      "the world's name in the top row stops Play, opens Index on the take just left, and says so",
      left >= 1 && stopped === "false" && atIndex === 0 && stays === 0 && named.said.startsWith("Index") && (!named.own || (named.current.length === 1 && named.current[0].includes(title)))
        ? null
        : `${world}: left take ${left} (${title}) by the world's name; Play pressed ${stopped}, the slider at ${atIndex}, then ${stays} 5s on; said "${named.said}"${named.own ? `, current row ${JSON.stringify(named.current)}` : ""}`,
    );
    if (selfTest && id === "heat" && (await play.getAttribute("aria-pressed")) === "true") await play.click();
  }

  /* Index's way to every component: the world's gallery view, a tile for every component in the world, each named by a
     link to its page in the world. */
  await find(pg, set[0]);
  await pg.locator("[data-play-object]").getByRole("button", { name: "Index", exact: true }).first().click();
  await pg.waitForTimeout(300);
  await pg.locator(`${FRAME} [data-play-everything]`).click({ timeout: 3000 }).catch(() => {});
  await pg.waitForFunction(() => document.querySelector("[data-tile]"), null, { timeout: 5000 }).catch(() => {});
  /* The break: a tile goes missing from the gallery view. */
  if (selfTest && id === "device") await pg.evaluate(() => document.querySelector("[data-tile]")?.remove());
  const gallery = await pg.evaluate(() => ({
    hash: location.hash,
    tiles: [...document.querySelectorAll("main [data-tile]")].map((t) => ({ id: t.dataset.tile, href: t.querySelector(":scope > :is(h2, h3) a")?.getAttribute("href") ?? null })),
  }));
  const parts = partsIn(id);
  const tileIds = gallery.tiles.map((t) => t.id);
  const wrongHref = gallery.tiles.filter((t) => t.href !== `#${id}/${t.id}`).map((t) => `${t.id} → ${t.href}`);
  claim(
    "Index's Every component opens the world's gallery view: a tile for every component in the world, each naming a link to its page there",
    gallery.hash === `#${id}/components` && tileIds.length === parts.length && parts.every((w) => tileIds.includes(w)) && !wrongHref.length
      ? null
      : `${world}: at ${gallery.hash}, ${tileIds.length} tiles of ${parts.length}${parts.filter((w) => !tileIds.includes(w)).length ? `, missing ${parts.filter((w) => !tileIds.includes(w)).slice(0, 8).join(", ")}` : ""}${wrongHref.length ? `, names linking elsewhere: ${wrongHref.slice(0, 4).join(", ")}` : ""}`,
  );

  for (const e of errors) claim("the page throws nothing", `${world}: ${e}`);
  await ctx.close();
}

await browser.close();
server.close();

let bad = 0;
for (const [name, fails] of claims) {
  if (!fails.length) { if (!selfTest) console.log(`✓ ${name}`); continue; }
  bad++;
  if (!selfTest) {
    console.error(`✗ ${name}`);
    for (const f of [...new Set(fails)].slice(0, 8)) console.error(`    ${f}`);
  }
}
if (selfTest) {
  const caught = (claims.get("what a take opens stays on the screen, in its world") ?? []).some((f) => / · Dialog: /.test(f));
  const bareCaught = (claims.get("the object is the world's own, or bare for a world not drawn yet") ?? []).some((f) => f.startsWith("Device:"));
  if (!caught) console.error("playground --self-test: the Dialog take's dialog escaped to <body>, and the check missed it.");
  if (!bareCaught) console.error("playground --self-test: Device drew bare with the recorder kept from loading, and the check missed it.");
  const setCaught = (claims.get("every part in a world's set (takes.ts) is in that world, twelve to a set") ?? []).some((f) => f.startsWith("heat:"));
  if (!setCaught) console.error("playground --self-test: Heat's set named a part Heat does not have, and the check missed it.");
  const tileCaught = (claims.get("Index's Every component opens the world's gallery view: a tile for every component in the world, each naming a link to its page there") ?? []).some((f) => f.startsWith("Device:"));
  if (!tileCaught) console.error("playground --self-test: a tile went missing from Device's gallery view, and the check missed it.");
  const homeCaught = (claims.get("on every player exactly one control is named Home, the way out") ?? []).some((f) => f.startsWith("Device:"));
  if (!homeCaught) console.error("playground --self-test: a second control named Home on Device's player, and the check missed it.");
  const sourceCaught = (claims.get("no link named Source points inside the gallery") ?? []).some((f) => f.startsWith("Device:"));
  if (!sourceCaught) console.error("playground --self-test: a Source link to #device/button on Device's player, and the check missed it.");
  const topsCaught = (claims.get("every name in a row of Index's grid shares a top") ?? []).some((f) => f.startsWith("Device:"));
  if (!topsCaught) console.error("playground --self-test: Index's rows centred with a wrapping line on Device, and the check missed it.");
  const orderCaught = (claims.get(ORDER_CLAIM) ?? []).some((f) => f.startsWith("Heat:"));
  if (!orderCaught) console.error("playground --self-test: Heat's menu strip drawn under its screen again, and the check missed it.");
  const pressOrderCaught = (claims.get(ORDER_CLAIM) ?? []).some((f) => f.startsWith("Press:"));
  if (!pressOrderCaught) console.error("playground --self-test: Press's deck drawn under its screen again, and the check missed it.");
  const rackOrderCaught = (claims.get(ORDER_CLAIM) ?? []).some((f) => f.startsWith("Rack:"));
  if (!rackOrderCaught) console.error("playground --self-test: Rack's clip lane drawn under its screen again, and the check missed it.");
  const menuCaught = (claims.get(OWN_INDEX_CLAIM) ?? []).some((f) => f.startsWith("Heat:"));
  if (!menuCaught) console.error("playground --self-test: Heat's Index lost its live part and gained a second current row, and the check missed it.");
  const sizeCaught = [...claims].some(([name, fails]) => name.startsWith("on Heat's player the pursuit meter covers") && fails.some((f) => f.startsWith("Heat:")));
  if (!sizeCaught) console.error("playground --self-test: Heat's screen at the other worlds' height, and the check missed the take's size.");
  const addressCaught = (claims.get("the take is in the address, written in place as you step, and Back from its page returns to it") ?? []).some((f) => f.startsWith("Device:"));
  if (!addressCaught) console.error("playground --self-test: Device's player kept its take out of the address, and the check missed it.");
  const namesCaught = (claims.get(NAMES_CLAIM) ?? []).some((f) => f.startsWith("Device"));
  if (!namesCaught) console.error("playground --self-test: Device's selector named Components, like the link beside it, and the check missed it.");
  const nameCaught = (claims.get("the world's name in the top row stops Play, opens Index on the take just left, and says so") ?? []).some((f) => f.startsWith("Heat:"));
  if (!nameCaught) console.error("playground --self-test: Play left running on Heat after the world's name opened Index, and the check missed it.");
  if (!nameCaught || !namesCaught || !addressCaught || !caught || !bareCaught || !tileCaught || !setCaught || !homeCaught || !sourceCaught || !topsCaught || !orderCaught || !pressOrderCaught || !rackOrderCaught || !sizeCaught || !menuCaught) process.exit(1);
  console.log("playground --self-test: a dialog escaped to <body> leaves the screen, with the recorder kept from loading Device draws bare, a tile missing from Device's gallery view is seen, a set naming a part outside its world is seen, a second Home and a Source link into the gallery are seen, Index's rows centred off their tops are seen, Heat's strip, Press's deck and Rack's lane under their screens are seen, a small take on Heat's screen is seen, Heat's Index with no live part and two current rows is seen, a take kept out of the address is seen, a selector sharing the Components link's name is seen, and Play left running after the world's name opened Index is seen; the check catches all fifteen.");
  process.exit(0);
}
if (bad) {
  console.error(`\nplayground: ${bad} of ${claims.size} claims fail.`);
  process.exit(1);
}
console.log(`\nplayground${shards > 1 ? ` (shard ${shard}/${shards})` : ""}: ${claims.size} claims hold, on the objects of ${RUN.map(([n]) => n).join(", ")}, at 1440x1000.`);
