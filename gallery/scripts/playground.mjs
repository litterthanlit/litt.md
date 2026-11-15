#!/usr/bin/env node
/**
 * Each world's player (#press, #flat, #device, #plain, #rack, #heat; plans/018 and 019), checked from a build at 1440x1000.
 *
 *   npm run build && npm run test:playground
 *   node scripts/playground.mjs --dist dist
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
 * - the screen does not open on Home, an index of every component in at least six groups,
 * - Right and Left do not step within a group (wrapping inside it), Down and Up do not move a group, End and Home do
 *   not go to the last part and to Home, with aria-valuenow and the readout's count following,
 * - a take (every component in the world, a group at a time) draws nothing inside the screen's box, or anything in the
 *   body (the object outside its screen) is filled with the accent (R6),
 * - Menu does not go back to Home, or its index does not open the component picked,
 * - what the Dialog, Menu, Popover, Select, Context menu, Toast or Tooltip take opens (from its first button, by a click
 *   or, for the tooltip, a held pointer) is not inside the screen's box, under the screen's world (1px tolerance),
 * - the take changes within 6s with no hand on it (nothing plays on load), Play does not move it within 5s, or a press
 *   on the screen does not stop it.
 *
 * --self-test moves the Dialog take's open dialog out to <body>, as a portal that missed the screen's OverlayRoot would,
 * so it leaves the screen and its world, and keeps the recorder's body from loading, so Device draws bare; it fails if the check
 * misses either.
 *
 * Needs Playwright, found as worlds.mjs finds it.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const dist = path.resolve(get("dist", "dist"));
const selfTest = args.includes("--self-test");
const greyscale = get("greyscale", null);
/* The worlds that have an object of their own: one more per object drawn (plans/018, phase 2). */
const OBJECTS = ["device"];
/* A string only the recorder's body ships, so --self-test can keep that chunk from loading. */
const RECORDER_MARK = "recorder-dial";

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
const SLIDER = "[data-play-object] [role=slider]";
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

/** Picks a take by name, as a person would: Menu, back to Home, then its row in the index. False when it is not in the world. */
async function find(pg, title) {
  await pg.locator("[data-play-object]").getByRole("button", { name: "Menu", exact: true }).click();
  await pg.waitForTimeout(400);
  const row = pg.locator(`${FRAME} [data-play-index] button`).filter({ hasText: new RegExp(`^${title}$`) });
  if (!(await row.count())) return false;
  await row.first().click();
  await pg.waitForTimeout(500);
  return true;
}

/** The index on Home: each group and how many parts it holds, in order. */
const shelvesOn = (pg) => pg.evaluate((F) => [...document.querySelectorAll(`${F} [data-play-index] [data-shelf]`)].map((s) => ({ group: s.dataset.shelf, count: s.querySelectorAll("button").length })), FRAME);

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

for (const [world, id, attribute] of WORLDS) {
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

  /* Home: the world opens on its index, every component on its shelf. */
  const home = await showing(pg);
  const shelves = await shelvesOn(pg);
  const total = shelves.reduce((t, s) => t + s.count, 0);
  claim(
    "the screen opens on Home, an index of every component in its groups",
    home.id === "home" && (await readout(pg))?.includes("Home") && shelves.length >= 6 && total === n ? null : `${world}: showing ${home.id}, ${shelves.length} groups holding ${total} of ${n}`,
  );

  /* Two levels: Right and Left step within a group and wrap there, Down and Up move a group, End and Home. */
  const firstShelf = shelves[0]?.count ?? 1;
  await pg.locator(SLIDER).focus();
  for (const [key, to] of [["ArrowRight", 1], ["ArrowLeft", firstShelf], ["ArrowRight", 1], ["ArrowDown", firstShelf + 1], ["ArrowUp", 1], ["End", n], ["Home", 0]]) {
    await pg.keyboard.press(key);
    await pg.waitForTimeout(150);
    const v = await now(pg);
    const text = await readout(pg);
    const count = `${pad(to, n)} / ${pad(n, n)}`;
    claim("Right and Left step within a group, Down and Up move a group, End and Home go to the ends, and the readout follows", v === to && text?.includes(count) ? null : `${world} · ${key}: at ${v}, readout "${text}", wants ${to} and "${count}"`);
  }

  /* Every take draws, and the body is never filled with the accent: a group at a time, as a person goes. */
  claim("every take draws something inside the screen's box", n > 0 ? null : `${world}: no takes`);
  claim("nothing in the object's body is filled with the accent", null);
  for (const shelf of shelves) {
    for (let j = 0; j < shelf.count; j++) {
      await pg.keyboard.press(j === 0 ? "ArrowDown" : "ArrowRight");
      await pg.waitForTimeout(120);
      let s = await showing(pg);
      if (!s.draws) {
        await pg.waitForTimeout(800);
        s = await showing(pg);
      }
      claim("every take draws something inside the screen's box", s.draws ? null : `${world} · ${shelf.group} ${j + 1}: ${s.id ?? "nothing showing"} draws nothing inside the screen`);
      const fills = await bodyFills(pg);
      claim("nothing in the object's body is filled with the accent", fills.length === 0 ? null : `${world} · ${shelf.group} ${j + 1}: ${fills.join(", ")}`);
    }
  }

  /* Menu: back to Home, and the index takes you where you pick. */
  await inView(pg);
  const went = await find(pg, "Dialog");
  const picked = await readout(pg);
  claim("Menu goes back to Home, and its index opens what you pick", went && picked?.includes("Dialog") ? null : `${world}: after picking Dialog from the index the readout says "${picked}"`);

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
  }

  /* Play, only when pressed, and a hand on the screen stops it. */
  await inView(pg);
  const before = await now(pg);
  await pg.locator("[data-play-object]").getByRole("button", { name: "Play" }).click();
  await pg.waitForTimeout(5000);
  const after = await now(pg);
  const pressed = await pg.locator("[data-play-object]").getByRole("button", { name: "Play" }).getAttribute("aria-pressed");
  claim("Play steps through the takes, and a press on the screen stops it", after !== before && pressed === "true" ? null : `${world}: after Play the take went ${before} to ${after}, Play pressed ${pressed}`);
  const sb = await pg.locator(FRAME).boundingBox();
  await pg.mouse.click(sb.x + 8, sb.y + 8);
  const held = await now(pg);
  await pg.waitForTimeout(5000);
  const still = await now(pg);
  claim("Play steps through the takes, and a press on the screen stops it", still === held ? null : `${world}: after a press on the screen the take went ${held} to ${still}`);

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
  if (!caught || !bareCaught) process.exit(1);
  console.log("playground --self-test: a dialog escaped to <body> leaves the screen, and with the recorder kept from loading Device draws bare; the check catches both.");
  process.exit(0);
}
if (bad) {
  console.error(`\nplayground: ${bad} of ${claims.size} claims fail.`);
  process.exit(1);
}
console.log(`\nplayground: ${claims.size} claims hold, on the objects of ${WORLDS.map(([n]) => n).join(", ")}, at 1440x1000.`);
