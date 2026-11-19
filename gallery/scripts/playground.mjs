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
 * - from Source, Tab does not reach the selector (a slider), then Play, then the screen,
 * - a world's set in play-object/takes.ts is not twelve parts, each a component page in that world, or a page's id is
 *   components or about, which would hide behind the world's own addresses,
 * - the screen does not open on Home, the world's set (a row each, as many as the slider runs to and takes.ts lists),
 * - Right and Down do not go to the next take, Left and Up to the previous, wrapping through Home, or End and Home do
 *   not go to the last take and to Home, with aria-valuenow and the readout's count following,
 * - a take (each in the set) draws nothing inside the screen's box, or anything in the body (the object outside its
 *   screen) is filled with the accent (R6),
 * - on a world in OBJECTS, a rail shows inside the screen beside a take (the screen holds the take alone, plans/024), or,
 *   on a bare object, the rail beside a take does not list the set in order with the take showing marked, and a link to
 *   #<world>/components at its foot,
 * - Index does not go back to Home, or Home does not open the take picked,
 * - what the Dialog, Menu, Popover, Select, Context menu, Toast or Tooltip take opens, where the set holds it, (from its first button, by a click
 *   or, for the tooltip, a held pointer) is not inside the screen's box, under the screen's world (1px tolerance),
 * - the take changes within 6s with no hand on it (nothing plays on load), Play does not move it within 5s, or a press
 *   on the screen does not stop it,
 * - Home's Every component link does not open #<world>/components, or that page does not hold a tile for every
 *   component in the world (read from src/gallery/pages), or a tile's name does not link to #<world>/<id>.
 *
 * --self-test moves the Dialog take's open dialog out to <body>, as a portal that missed the screen's OverlayRoot would,
 * so it leaves the screen and its world, keeps the recorder's body from loading, so Device draws bare, and takes a tile
 * out of Device's gallery view, and adds a part Heat does not have to Heat's set; it fails if the check misses any.
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
const SLIDER = "[data-play-object] [role=slider][aria-label=Components]";
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

/** Scrolls the page so the object is whole in the window, under the header. */
const inView = (pg) => pg.evaluate(() => window.scrollBy(0, document.querySelector("[data-play-object]").getBoundingClientRect().top - 80));

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

const readout = (pg) => pg.evaluate(() => document.querySelector("[data-play-readout]")?.textContent?.replace(/\s+/g, " ").trim() ?? null);
const now = (pg) => pg.locator(SLIDER).getAttribute("aria-valuenow").then(Number);
const pad = (i, n) => String(i).padStart(Math.max(2, String(n).length), "0");

/** Picks a take by name, as a person would: Index, back to Home, then its row in the set. False when it is not in the set. */
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
const shadowed = pageMetas().filter((p) => ["components", "about"].includes(p.id)).map((p) => p.id);
claim("no page id is components or about, the world's own addresses", shadowed.length ? `pages named ${shadowed.join(", ")}` : null);
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
   in (Device's bare object and missing tile, and a world whose set holds the Dialog take), since the set claim above
   reads every world without a browser. */
const [shard, shards] = get("shard", "1/1").split("/").map(Number);
const dialogWorld = WORLDS.find(([, id]) => id === "device" && SETS.device?.includes("dialog")) ?? WORLDS.find(([, id]) => SETS[id]?.includes("dialog"));
const RUN = selfTest
  ? WORLDS.filter((w) => w[1] === "device" || w === dialogWorld)
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

  /* The keyboard: Source, then the selector, Play and the screen. */
  await pg.locator("[data-play-object]").getByRole("link", { name: "Source", exact: true }).focus();
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
  claim("from Source, Tab reaches the selector, then Play, then the screen", stops.join(",") === "slider,play,screen" ? null : `${world}: ${stops.join(", ")}`);

  const n = Number(await pg.locator(SLIDER).getAttribute("aria-valuemax"));

  /* Home: the world opens on its set, a flat list to pick from, and a way to every component. */
  const home = await showing(pg);
  const set = await setOn(pg);
  claim(
    "the screen opens on Home, the world's set to pick from",
    home.id === "home" && (await readout(pg))?.includes("Home") && set.length === n && n === (SETS[id] ?? []).length ? null : `${world}: showing ${home.id}, ${set.length} in the set on Home, the slider runs to ${n}`,
  );

  /* One level: Right and Down go on, Left and Up go back, wrapping through Home; End and Home go to the ends. */
  await pg.locator(SLIDER).focus();
  for (const [key, to] of [["ArrowRight", 1], ["ArrowDown", 2], ["ArrowUp", 1], ["ArrowLeft", 0], ["ArrowLeft", n], ["ArrowRight", 0], ["End", n], ["Home", 0]]) {
    await pg.keyboard.press(key);
    await pg.waitForTimeout(150);
    const v = await now(pg);
    const text = await readout(pg);
    const count = `${pad(to, n)} / ${pad(n, n)}`;
    claim("Right and Down go on, Left and Up go back, wrapping through Home, End and Home go to the ends, and the readout follows", v === to && text?.includes(count) ? null : `${world} · ${key}: at ${v}, readout "${text}", wants ${to} and "${count}"`);
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
  /* A world with an object of its own holds the take alone on its screen (plans/024, breach 17): no rail there, and the
     set stays on Home, behind Index (claimed below). A bare object keeps the rail. */
  if (OBJECTS.includes(id)) claim("an object's screen holds the take alone, with no rail inside it", rail === null ? null : `${world}: a rail of ${rail.rows.length} rows inside the screen`);
  else claim(
    "the rail lists the set, marks the take showing, and links to every component",
    rail && rail.rows.join("|") === set.join("|") && rail.current.length === 1 && title?.includes(rail.current[0]) && rail.foot.join() === `#${id}/components` ? null : `${world}: rail ${JSON.stringify(rail)}, set ${JSON.stringify(set)}, readout "${title}"`,
  );

  /* Index: back to Home, and Home takes you where you pick. */
  await inView(pg);
  const last = set[set.length - 1];
  const went = await find(pg, last);
  const picked = await readout(pg);
  claim("Index goes back to Home, and Home opens what you pick", went && picked?.includes(last) ? null : `${world}: after picking ${last} from Home the readout says "${picked}"`);

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
  await pg.locator("[data-play-object]").getByRole("button", { name: "Play", exact: true }).click();
  await pg.waitForTimeout(5000);
  const after = await now(pg);
  const pressed = await pg.locator("[data-play-object]").getByRole("button", { name: "Play", exact: true }).getAttribute("aria-pressed");
  claim("Play steps through the takes, and a press on the screen stops it", after !== before && pressed === "true" ? null : `${world}: after Play the take went ${before} to ${after}, Play pressed ${pressed}`);
  const sb = await pg.locator(FRAME).boundingBox();
  await pg.mouse.click(sb.x + 8, sb.y + 8);
  const held = await now(pg);
  await pg.waitForTimeout(5000);
  const still = await now(pg);
  claim("Play steps through the takes, and a press on the screen stops it", still === held ? null : `${world}: after a press on the screen the take went ${held} to ${still}`);

  /* Home's way to every component: the world's gallery view, a tile for every component in the world, each named by a
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
    "Home's Every component opens the world's gallery view: a tile for every component in the world, each naming a link to its page there",
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
  const tileCaught = (claims.get("Home's Every component opens the world's gallery view: a tile for every component in the world, each naming a link to its page there") ?? []).some((f) => f.startsWith("Device:"));
  if (!tileCaught) console.error("playground --self-test: a tile went missing from Device's gallery view, and the check missed it.");
  if (!caught || !bareCaught || !tileCaught || !setCaught) process.exit(1);
  console.log("playground --self-test: a dialog escaped to <body> leaves the screen, with the recorder kept from loading Device draws bare, a tile missing from Device's gallery view is seen, and a set naming a part outside its world is seen; the check catches all four.");
  process.exit(0);
}
if (bad) {
  console.error(`\nplayground: ${bad} of ${claims.size} claims fail.`);
  process.exit(1);
}
console.log(`\nplayground${shards > 1 ? ` (shard ${shard}/${shards})` : ""}: ${claims.size} claims hold, on the objects of ${RUN.map(([n]) => n).join(", ")}, at 1440x1000.`);
