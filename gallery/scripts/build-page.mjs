#!/usr/bin/env node
/**
 * The Build page (#build), driven from a build the way a visitor uses it: pick a look, look at a screen, copy it out.
 *
 *   npm run build && npm run test:build-page
 *   node scripts/build-page.mjs --dist dist
 *
 * It fails when:
 * - #build has no h1 "Build", or the sidebar does not list it right after Overview,
 * - the page's Material or Accent control does not change the gallery (data-material on <html>, data-accent on <body>),
 * - a screen pick does not show that screen in the frame or does not keep ?screen= in the address, or a link with a look
 *   and a screen does not open on both, or Copy link does not give the address back,
 * - Phone does not draw the screen phone wide and phone shaped (the shell's menu button),
 * - Light beside dark leaves the dark copy reachable: it must be inert, hidden from assistive tech and never focused,
 * - a link inside a screen moves the gallery off #build,
 * - Copy install, Copy setup or Copy prompt copy the wrong text,
 * - outside the frame, main holds anything but one accent fill, Copy install (the frame is its own view, R6),
 * - a screen change does not arrive in soft focus (a blur above 0 and never above 4px, cleared to none), blurs under
 *   reduced motion, or anything blurs on the first paint (R4, SoftSwap),
 * - the page throws.
 *
 * Needs Playwright, found as home.mjs finds it.
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

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const problems = [];
const passed = [];
const check = (ok, claim) => (ok ? passed : problems).push(claim);

const browser = await chromium.launch();

async function open(hash, { phone = false, query = "", reduce = false } = {}) {
  const ctx = await browser.newContext({
    ...(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1440, height: 900 } }),
    reducedMotion: reduce ? "reduce" : "no-preference",
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e)));
  await pg.goto(`http://localhost:${port}/index.html${query}#${hash}`, { waitUntil: "networkidle" });
  await pg.evaluate(() => document.fonts.ready);
  return { ctx, pg, errors };
}

const frame = (pg) => pg.locator("[data-build-frame]");
const pick = (pg, legend, name) =>
  pg.locator("main fieldset", { has: pg.locator("legend", { hasText: new RegExp(`^${legend}$`) }) }).locator("label").filter({ hasText: new RegExp(`^${name}$`) }).first().click();
const settle = (pg) => pg.waitForTimeout(400);
const clipboard = (pg) => pg.evaluate(() => navigator.clipboard.readText());
const copied = async (pg, name) => {
  const before = await clipboard(pg);
  await pg.locator("main").getByRole("button", { name, exact: true }).click();
  await pg.waitForFunction((b) => navigator.clipboard.readText().then((t) => t !== b), before, { timeout: 2000 }).catch(() => {});
  return clipboard(pg);
};
/* The accent fills in main outside the frame, as wall.mjs counts them: a box of at least 24 by 16 in var(--accent). */
const fillsOutsideFrame = (pg) =>
  pg.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.background = "var(--accent)";
    document.body.append(probe);
    const accent = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return [...document.querySelectorAll("main *")]
      .filter((el) => !el.closest("[data-build-frame], [aria-hidden=true], .sr-only") && getComputedStyle(el).backgroundColor === accent)
      .filter((el) => { const b = el.getBoundingClientRect(); return b.width >= 24 && b.height >= 16; })
      .map((el) => el.textContent.trim());
  });

/* ---------- the page and its place ---------- */
{
  const { ctx, pg, errors } = await open("build");
  check((await pg.locator("main h1").first().textContent())?.trim().startsWith("Build"), "#build has the h1 Build");
  const order = await pg.locator("nav[aria-label=Components] a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  check(order.indexOf("#build") === order.indexOf("#overview") + 1, `the sidebar lists Build right after Overview (${order.slice(0, 4).join(", ")})`);

  await pick(pg, "Material", "Press");
  check((await pg.evaluate(() => document.documentElement.dataset.material)) === undefined, "the page's Press takes data-material off <html>");
  await pick(pg, "Material", "Flat");
  check((await pg.evaluate(() => document.documentElement.dataset.material)) === "flat", "the page's Flat puts data-material=flat back");
  await pick(pg, "Accent", "Pink");
  check((await pg.evaluate(() => document.body.dataset.accent)) === "pink", "the page's Pink sets data-accent=pink on <body>");

  check((await frame(pg).locator("[data-screen=settings]").count()) >= 1, "the frame opens on Settings");
  await pick(pg, "Screen", "Dashboard");
  await settle(pg);
  check(
    (await frame(pg).locator("[data-screen=dashboard]").first().getByText("Active projects").count()) >= 1 && (await frame(pg).locator("[data-screen=settings]").count()) === 0,
    "picking Dashboard shows the Dashboard in the frame",
  );
  await pg.waitForFunction(() => new URLSearchParams(location.search).get("screen") === "dashboard", null, { timeout: 2000 }).catch(() => {});
  check(new URLSearchParams(await pg.evaluate(() => location.search)).get("screen") === "dashboard", "the address keeps ?screen=dashboard");

  await frame(pg).locator("[data-build-copy] a[href]").first().click();
  check((await pg.evaluate(() => location.hash)) === "#build", "a link inside a screen leaves the gallery on #build");
  for (const e of errors) problems.push(`page: ${e}`);
  await ctx.close();
}

/* ---------- a link carries the look and the screen; the copies ---------- */
{
  const { ctx, pg, errors } = await open("build", { query: "?look=pink-flat&screen=dashboard" });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: `http://localhost:${port}` });
  check(
    (await pg.evaluate(() => [document.body.dataset.accent, document.documentElement.dataset.material].join("/"))) === "pink/flat" &&
      (await frame(pg).locator("[data-screen=dashboard]").count()) >= 1,
    "?look=pink-flat&screen=dashboard#build opens on Pink, Flat and the Dashboard",
  );
  check((await copied(pg, "Copy link")) === (await pg.evaluate(() => location.href)), "Copy link gives the address back, look and screen in it");
  check((await copied(pg, "Copy install")) === "npx shadcn@latest add https://littmd.vercel.app/r/dashboard.json", "Copy install installs the Dashboard block");
  check((await copied(pg, "Copy setup")).startsWith('Set up the litt.md look "Pink, flat material, calm motion"'), "Copy setup gives the look's setup");
  check((await copied(pg, "Copy prompt")).startsWith("Build the Dashboard screen in this project with litt.md."), "Copy prompt builds the Dashboard screen");
  for (const e of errors) problems.push(`link: ${e}`);
  await ctx.close();
}

/* ---------- Copy link follows a pick, and the install says which look it brings ---------- */
{
  const { ctx, pg, errors } = await open("build");
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: `http://localhost:${port}` });
  await pick(pg, "Screen", "Dashboard");
  check((await copied(pg, "Copy link")).includes("screen=dashboard"), "Copy link right after picking Dashboard carries screen=dashboard");
  await pg.waitForTimeout(400);
  await pick(pg, "Screen", "Projects");
  await pg.waitForTimeout(400);
  check((await copied(pg, "Copy link")).includes("screen=projects"), "Copy link after the address has settled carries the screen picked last");
  for (const e of errors) problems.push(`copy link: ${e}`);
  await ctx.close();
}
for (const [query, want] of [
  ["?look=pink-flat", "This page shows Pink, flat material, calm motion. The registry installs Blue 4 and press material."],
  ["?look=blue4", null],
]) {
  const { ctx, pg, errors } = await open("build", { query });
  const note = await pg.locator("main").getByText("This page shows", { exact: false }).allTextContents();
  check(want ? note.some((n) => n.trim().startsWith(want)) : note.length === 0, `${query}: ${want ? "beside Copy install the page says the registry installs another look" : "the registry's own look needs no note"} (${JSON.stringify(note)})`);
  for (const e of errors) problems.push(`look note ${query}: ${e}`);
  await ctx.close();
}

/* ---------- phone, and light beside dark ---------- */
{
  const { ctx, pg, errors } = await open("build");
  await pick(pg, "Width", "Phone");
  await settle(pg);
  const width = await frame(pg).locator("[data-screen]").first().evaluate((el) => el.getBoundingClientRect().width);
  check(width > 0 && width <= 384, `Phone draws the screen at most 384px wide (${Math.round(width)}px)`);
  check((await frame(pg).getByRole("button", { name: "Open navigation" }).count()) >= 1, "on Phone the shell is phone shaped (its menu button shows)");

  await pick(pg, "Width", "Desktop");
  await pg.locator("main").getByRole("switch", { name: /Light beside dark/ }).click();
  await settle(pg);
  const copies = frame(pg).locator("[data-build-copy]");
  check((await copies.count()) === 2, "Light beside dark draws two copies");
  const dark = await copies.nth(1).evaluate((el) => ({
    theme: el.getAttribute("data-theme"), material: el.getAttribute("data-material"), inert: el.inert, hidden: el.getAttribute("aria-hidden"),
    page: document.documentElement.dataset.material ?? null,
  }));
  check(dark.theme === "dark" && dark.material === dark.page && dark.inert && dark.hidden === "true", `the dark copy is dark, in the page's material, inert and aria-hidden (${JSON.stringify(dark)})`);
  await frame(pg).focus();
  let strayed = false;
  for (let i = 0; i < 20; i++) {
    await pg.keyboard.press("Tab");
    if (await pg.evaluate(() => !!document.activeElement?.closest("[data-build-copy][inert]"))) strayed = true;
  }
  check(!strayed, "twenty Tabs from the frame never focus inside the dark copy");
  /* Split is a picture of both themes: a hand on the right half must not reach the hidden light copy under it. */
  await frame(pg).evaluate((el) => { el.scrollTop = 0; });
  await pg.evaluate(() => window.scrollTo(0, 0));
  const values = () => frame(pg).locator("[data-build-copy]").first().locator("input").evaluateAll((is) => is.map((i) => i.value));
  const before = await values();
  const target = await frame(pg).locator("[data-build-copy]").first().locator("input").evaluateAll((is, mid) => {
    const i = is.find((el) => { const b = el.getBoundingClientRect(); return b.left > mid && b.width > 0; });
    if (!i) return null;
    const b = i.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  }, await frame(pg).evaluate((el) => { const b = el.getBoundingClientRect(); return b.left + b.width / 2; }));
  if (target) {
    await pg.mouse.click(target.x, target.y);
    await pg.keyboard.type("typed");
  }
  check(!!target && JSON.stringify(await values()) === JSON.stringify(before), "in Light beside dark, a click and typing on the right half change nothing");
  check((await pg.locator("main").getByText("Turn off Light beside dark to use the screen.", { exact: false }).count()) === 1, "in Light beside dark the page says to turn it off to use the screen");
  for (const e of errors) problems.push(`views: ${e}`);
  await ctx.close();
}

/* ---------- on a phone, the screen strip scrolls instead of crushing its words ---------- */
{
  const { ctx, pg, errors } = await open("build", { phone: true });
  const boxes = await pg
    .locator("main fieldset", { has: pg.locator("legend", { hasText: /^Screen$/ }) })
    .locator("label")
    .evaluateAll((ls) => ls.map((l) => { const b = l.getBoundingClientRect(); return { left: b.left, right: b.right, fits: l.scrollWidth <= l.clientWidth + 1, oneLine: b.height < 48 }; }));
  const overlap = boxes.some((b, i) => i > 0 && b.left < boxes[i - 1].right - 0.5);
  check(boxes.length === 6 && !overlap && boxes.every((b) => b.fits && b.oneLine), `on a phone each of the six screen names keeps its width and one line (${JSON.stringify(boxes.map((b) => [Math.round(b.right - b.left), b.fits, b.oneLine]))})`);
  for (const e of errors) problems.push(`phone strip: ${e}`);
  await ctx.close();
}

/* ---------- soft focus (R4, SoftSwap) ---------- */
/* Every animation frame for `ms`: the frame's content filter and which screen it holds. Started before the click, so
   the first frames of the swap are in it. */
const sample = (pg, ms = 600) =>
  pg.evaluate(
    (ms) =>
      new Promise((done) => {
        const out = [];
        const t0 = performance.now();
        const tick = () => {
          const el = document.querySelector("[data-build-frame] [data-soft-swap]");
          out.push({ t: performance.now() - t0, filter: el ? getComputedStyle(el).filter : "missing", opacity: el ? Number(getComputedStyle(el).opacity) : 0, screen: el?.querySelector("[data-screen]")?.getAttribute("data-screen") ?? null });
          if (performance.now() - t0 < ms) requestAnimationFrame(tick);
          else done(out);
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );
const blurPx = (f) => Number(/blur\(([\d.]+)px\)/.exec(f)?.[1] ?? 0);
{
  const { ctx, pg, errors } = await open("build");
  const first = await sample(pg);
  check(first.every((s) => blurPx(s.filter) === 0), "nothing blurs on the first paint of #build");
  const during = sample(pg, 1000);
  await pick(pg, "Screen", "Product");
  const swap = await during;
  const peak = Math.max(...swap.map((s) => blurPx(s.filter)));
  check(peak > 0 && peak <= 4, `a screen change arrives in soft focus, its blur peaking at ${peak}px (above 0, at most 4)`);
  check(swap.at(-1).filter === "none" && swap.at(-1).screen === "product", `the blur clears to none on the new screen (${swap.at(-1).filter}, ${swap.at(-1).screen})`);
  for (const e of errors) problems.push(`soft focus: ${e}`);
  await ctx.close();
}
{
  const { ctx, pg, errors } = await open("build", { reduce: true });
  const during = sample(pg, 400);
  await pick(pg, "Screen", "Agent");
  const swap = await during;
  check(swap.every((s) => blurPx(s.filter) === 0), "under reduced motion a screen change never blurs");
  check(swap.at(-1).screen === "agent" && swap.every((s) => s.opacity === 1), `under reduced motion the new screen comes in with no fade (lowest opacity ${Math.min(...swap.map((s) => s.opacity))})`);
  for (const e of errors) problems.push(`soft focus reduced: ${e}`);
  await ctx.close();
}

/* ---------- one accent fill outside the frame ---------- */
for (const look of ["blue4", "pink"]) {
  const { ctx, pg, errors } = await open("build", { query: `?look=${look}` });
  const fills = await fillsOutsideFrame(pg);
  check(fills.length === 1 && fills[0].startsWith("Copy install"), `in ${look}, main outside the frame has one accent fill, Copy install (${JSON.stringify(fills)})`);
  for (const e of errors) problems.push(`fills ${look}: ${e}`);
  await ctx.close();
}

await browser.close();
server.close();

for (const p of passed) console.log(`✓ ${p}`);
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nbuild page: ${problems.length} problem${problems.length === 1 ? "" : "s"}.`);
  process.exit(1);
}
console.log(`\nbuild page: ${passed.length} claims hold.`);
