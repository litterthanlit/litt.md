#!/usr/bin/env node
/**
 * The overview's hero and the gallery's search, driven from a build the way a visitor uses them.
 *
 *   npm run build && npm run test:home
 *   node scripts/home.mjs --dist dist
 *
 * It fails when:
 * - a control on the deck does not change the gallery: Fun mode (the wall then offers its Fun filter), the theme (and
 *   the header's switch says the same), the accent (the gallery opens in Flat's own, the ink, and Blue 4 and pink each fill Get
 *   started in their color), the material (the gallery opens in Flat, data-material on <html>, and Press takes it
 *   off) or the shape (the control radius on <body>),
 * - the deck's Material does not change the home hero under it (Device names Device and shows the Agent block, Flat the
 *   Case study, data-material on <html> follows), or a material switch starts a transition in the page outside the deck,
 * - the Customize panel still offers a Material control (it moved to the deck and to the world pages),
 * - Reset does not put the gallery's defaults back (the locked shape, Flat and its own accent),
 * - a look from a link (?look=pink-fun) does not paint before the app runs, writes storage, drops out of the address on
 *   the next page, or loses the Table's filters; or an accent change during it does not keep the link's look and save,
 * - the notice under the header does not offer the link's look (Keep this look saves it, Back to mine goes back to
 *   yours, both take it out of the address), or shows for a link to the look you already have,
 * - Your look in the Customize panel, the Install note or Copy prompt does not give the edits for the look on screen,
 *   or Copy link does not give this page in it,
 * - Get started does not take focus to the steps,
 * - ⌘K or Ctrl+K does not open one search menu, or picking a page there does not open it, or a Customize action
 *   there does nothing,
 * - a page opens a second menu for one ⌘K: the Command menu's demo on the wall, or on its own page, where the demo
 *   keeps the shortcut,
 * - the phone's search button does not open the menu,
 * - the page throws.
 *
 * Needs Playwright, found as wall.mjs finds it.
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

async function open(hash, { phone = false, query = "" } = {}) {
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e)));
  await pg.goto(`http://localhost:${port}/index.html${query}#${hash}`, { waitUntil: "networkidle" });
  await pg.evaluate(() => document.fonts.ready);
  return { ctx, pg, errors };
}

const deck = (pg) => pg.locator("section[aria-labelledby=deck-title]");
/* The inset layers an element shows: a top highlight is one; a transparent or zero-alpha layer is not. */
const litInsets = (loc) =>
  loc.evaluate((el) =>
    getComputedStyle(el).boxShadow.split(/,(?![^(]*\))/).filter((l) => /inset/.test(l) && !/transparent|rgba\([^)]*,\s*0\)|\/\s*0\)/.test(l)).length,
  );
/* A segment is a native radio under its label, out of sight; a hand presses the label. */
const pick = (scope, name) => scope.locator("label").filter({ hasText: new RegExp(`^${name}$`) }).click();
const dialogs = (pg) => pg.locator("[role=dialog]").count();
/* The accent the tokens give a fresh element, for comparing a fill against. */
const accentNow = (pg) => pg.evaluate(() => {
  const probe = document.createElement("div");
  probe.style.background = "var(--accent)";
  document.body.append(probe);
  const c = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return c;
});

/* ---------- the deck ---------- */
{
  const { ctx, pg, errors } = await open("overview");
  const d = deck(pg);
  check((await d.count()) === 1, "the overview has the deck");

  await d.getByRole("switch", { name: "Fun mode" }).click();
  check((await d.getByRole("switch", { name: "Fun mode" }).getAttribute("aria-checked")) === "true", "Fun mode switches on");
  check((await pg.locator("input[type=radio][value=fun]").count()) === 1, "with Fun mode on, the wall offers its Fun filter");
  await d.getByRole("switch", { name: "Fun mode" }).click();
  check((await pg.locator("input[type=radio][value=fun]").count()) === 0, "with Fun mode off again, the Fun filter goes");

  /* A theme switch is instant (foundations.md, Motion): no hover fade on the page runs because the theme changed. */
  await pg.evaluate(() => { window.__before = new Set(document.getAnimations()); });
  await pick(d, "Dark");
  check((await pg.evaluate(() => document.documentElement.dataset.theme)) === "dark", "the deck's Dark sets data-theme=dark on <html>");
  const fades = await pg.evaluate(() => document.getAnimations().filter((a) => !window.__before.has(a) && a instanceof CSSTransition && a.effect?.target?.closest?.("main") && !a.effect.target.closest("[aria-labelledby=deck-title]")).length);
  check(fades === 0, `switching to Dark starts no transition in the page outside the deck (${fades} started)`);
  const header = pg.locator("header fieldset", { has: pg.locator("legend", { hasText: "Theme" }) }).first();
  check(await header.getByRole("radio", { name: "Dark" }).isChecked(), "the header's theme switch says Dark too");
  await pick(header, "Light");
  check(await d.getByRole("radio", { name: "Light" }).isChecked(), "the header's Light moves the deck to Light");

  const start = pg.getByRole("button", { name: "Get started" });
  const fill = () => start.evaluate((el) => getComputedStyle(el).backgroundColor);
  check((await pg.evaluate(() => document.body.dataset.accent)) === undefined, "the gallery opens in Flat's own accent, the ink (no data-accent on <body>)");
  await pg.waitForTimeout(300); // the ink changed with the theme above, and the fill fades to it on the instant tier
  const ink = await accentNow(pg);
  check((await fill()) === ink, "Get started is filled with the accent, the ink");
  await pick(d, "Blue 4");
  check((await pg.evaluate(() => document.body.dataset.accent)) === "blue", "Blue 4 on Flat sets data-accent=blue on <body>");
  await pg.waitForTimeout(300); // the fill fades on the instant tier
  const blue = await accentNow(pg);
  check(blue !== ink && (await fill()) === blue, "in Blue 4, Get started is Blue 4");
  await pick(d, "Pink");
  check((await pg.evaluate(() => document.body.dataset.accent)) === "pink", "Pink sets data-accent=pink on <body>");
  await pg.waitForTimeout(300);
  const pink = await accentNow(pg);
  check(pink !== blue && pink !== ink && (await fill()) === pink, "in Pink, Get started is pink");

  const material = () => pg.evaluate(() => document.documentElement.dataset.material);
  const lift = () => pg.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--block-lift").trim());
  check((await material()) === "flat", "the gallery opens in Flat (data-material=flat on <html>)");
  const flatLift = await lift();
  await pick(d, "Press");
  check((await material()) === undefined && (await lift()) !== flatLift, "the deck's Press takes data-material off <html>, and the block casts again");
  await pick(d, "Flat");
  check((await material()) === "flat" && (await lift()) === flatLift, "the deck's Flat puts data-material=flat back");
  /* The home hero under the deck is the current world's block, live (proposals/worlds.md, decision 2). */
  const hero = pg.locator("section[data-home-hero]");
  const heroName = () => hero.getByRole("heading", { level: 2 }).first().textContent();
  check((await heroName())?.trim() === "Flat" && (await hero.getByRole("region", { name: "Case study, desktop" }).count()) === 1, "in Flat, the home hero names Flat and shows the Case study");
  await pg.evaluate(() => { window.__before = new Set(document.getAnimations()); });
  await pick(d, "Device");
  await hero.getByRole("group", { name: "Halo build chat" }).waitFor();
  check((await heroName())?.trim() === "Device" && (await hero.getByRole("textbox", { name: "Message Litt" }).count()) === 1 && (await hero.getByRole("region", { name: "Case study, desktop" }).count()) === 0, "the deck's Device makes the home hero name Device and show the Agent block (Halo build chat, Message Litt) in place of the Case study");
  check((await material()) === "device", "the deck's Device sets data-material=device on <html>");
  check((await hero.getByRole("heading", { level: 2 }).first().getByRole("link").getAttribute("href")) === "#device", "the home hero's heading links to the Device world page");
  const slides = await pg.evaluate(() => document.getAnimations().filter((a) => !window.__before.has(a) && a instanceof CSSTransition && a.effect?.target?.closest?.("main") && !a.effect.target.closest("[aria-labelledby=deck-title]")).map((a) => a.transitionProperty + " on " + (a.effect.target.tagName + "." + String(a.effect.target.className).slice(0, 40))));
  check(slides.length === 0, `switching to Device starts no transition in the page outside the deck (${slides.length} started${slides.length ? ": " + slides.slice(0, 3).join("; ") : ""})`);
  await pick(d, "Flat");
  await hero.getByRole("region", { name: "Case study, desktop" }).waitFor();
  check((await heroName())?.trim() === "Flat" && (await material()) === "flat" && (await hero.getByRole("group", { name: "Halo build chat" }).count()) === 0, "the deck's Flat brings the Case study back and data-material=flat");
  const getStarted = pg.getByRole("button", { name: "Get started" });
  check((await litInsets(getStarted)) === 0, "under Flat, Get started catches no top highlight (R2: Flat has no light)");
  await pick(d, "Press");
  check((await litInsets(getStarted)) === 1, "under Press, Get started catches its top highlight");

  const radius = () => pg.evaluate(() => document.body.style.getPropertyValue("--radius-control"));
  const before = await radius();
  await d.getByRole("slider", { name: "Shape" }).focus();
  await pg.keyboard.press("End");
  const pill = await radius();
  check(before === "" && pill !== "" && pill !== before, `the shape slider's end sets the control radius on <body> (${before || "locked"} to ${pill})`);

  await d.getByRole("button", { name: "Reset" }).click();
  check(
    (await radius()) === "" && (await pg.evaluate(() => document.body.dataset.accent)) === undefined && (await material()) === "flat",
    "Reset takes the shape back to the locked tokens, the material back to Flat and the accent back to its own",
  );

  await start.click();
  check((await pg.evaluate(() => document.activeElement?.id)) === "start-title", "Get started takes focus to the steps");
  check(await pg.locator("#start-title").isVisible(), "the steps are on screen after Get started");

  for (const e of errors) problems.push(`deck: ${e}`);
  await ctx.close();
}

/* ---------- the header's Customize panel ---------- */
{
  const { ctx, pg, errors } = await open("button");
  await pg.locator("header").getByRole("button", { name: "Customize" }).click();
  const panel = pg.getByRole("dialog", { name: "Customize" });
  await panel.waitFor();
  const accentTiles = panel.locator("fieldset", { has: pg.locator("legend", { hasText: /^Accent$/ }) });
  check(await accentTiles.getByRole("radio", { name: "Mono" }).isChecked(), "the panel opens with Mono picked");
  /* The material is a world now (proposals/worlds.md): chosen on the deck and by arriving on a world's page, never here. */
  check(
    (await panel.getByRole("radiogroup", { name: /material/i }).count()) === 0 && (await panel.locator("fieldset", { has: pg.locator("legend", { hasText: /material/i }) }).count()) === 0 && (await panel.getByRole("radio", { name: /^(Press|Flat|Device)$/ }).count()) === 0,
    "the Customize panel offers no Material control: no radio group or fieldset named Material, no Press, Flat or Device radio",
  );
  await accentTiles.locator("label", { has: pg.getByRole("radio", { name: "Pink" }) }).click();
  check((await pg.evaluate(() => document.body.dataset.accent)) === "pink", "the panel's Pink tile sets data-accent=pink on <body>");
  await accentTiles.locator("label", { has: pg.getByRole("radio", { name: "Blue 4" }) }).click();
  const look = () => pg.evaluate(() => [document.body.dataset.accent, document.body.style.getPropertyValue("--radius-control"), document.documentElement.style.getPropertyValue("--font-choice")].join("|"));
  const before = await look();
  await panel.getByRole("button", { name: "Surprise me" }).click();
  const said = (await panel.locator("#customize-said").textContent())?.trim() ?? "";
  check((await look()) !== before && said.endsWith("motion."), `Surprise me changes the accent, the shape and the face, and says so ("${said}")`);
  await panel.getByRole("button", { name: "Reset to defaults" }).click();
  check((await look()) === "||", "the panel's Reset goes back to Flat's own accent, the locked shape and the world's own face");
  for (const e of errors) problems.push(`customize: ${e}`);
  await ctx.close();
}

/* ---------- a look from a link ---------- */
const saved = (pg) => pg.evaluate(() => localStorage.getItem("litt-gallery:customize"));
const bodyAccent = (pg) => pg.evaluate(() => document.body.dataset.accent);
const says = async (scope, ...parts) => {
  const text = (await scope.textContent()) ?? "";
  return parts.every((p) => text.includes(p));
};
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route("**/*.js", (r) => r.abort());
  const pg = await ctx.newPage();
  await pg.goto(`http://localhost:${port}/index.html?look=pink-fun#overview`);
  check((await bodyAccent(pg)) === "pink" && (await pg.locator("#root").innerHTML()) === "", "with the app's script blocked, ?look=pink-fun paints Pink before anything runs");
  await ctx.close();
}
{
  const { ctx, pg, errors } = await open("button", { query: "?look=pink-fun" });
  check((await bodyAccent(pg)) === "pink" && (await saved(pg)) === null, "?look=pink-fun shows Pink and writes nothing to storage");
  check((await pg.locator("nav[aria-label=Components] [aria-labelledby=nav-Fun]").count()) === 1, "?look=pink-fun turns fun mode on (the sidebar leads with its Fun group)");
  await pg.locator('nav[aria-label=Components] a[href="#slider"]').first().click();
  await pg.waitForFunction(() => location.hash === "#slider");
  check((await pg.evaluate(() => location.search)) === "?look=pink-fun" && (await bodyAccent(pg)) === "pink", "a link to another page keeps ?look=pink-fun in the address, and Pink");
  for (const e of errors) problems.push(`link: ${e}`);
  await ctx.close();
}
{
  const { ctx, pg, errors } = await open("overview", { query: "?look=pink-fun" });
  await pick(deck(pg), "Blue 4");
  await pg.waitForFunction(() => localStorage.getItem("litt-gallery:customize") !== null, null, { timeout: 2000 }).catch(() => {});
  check(
    (await saved(pg)) === JSON.stringify({ material: "press", fun: true }) && (await pg.evaluate(() => location.search)) === "" && (await bodyAccent(pg)) === undefined,
    "Blue 4, Press's own, during the preview keeps the link's press and fun mode, saves them with the world's own accent, and takes the look out of the address",
  );
  for (const e of errors) problems.push(`link change: ${e}`);
  await ctx.close();
}
{
  const { ctx, pg, errors } = await open("table", { query: "?status=ready&look=pink" });
  const count = (await pg.getByText(/^[\d,]+ of [\d,]+ deploys$/).first().textContent()) ?? "";
  check(count !== "" && (await bodyAccent(pg)) === "pink", `?status=ready&look=pink filters the Table (${count}) and shows Pink`);
  for (const e of errors) problems.push(`link table: ${e}`);
  await ctx.close();
}
const notice = (pg) => pg.getByRole("region", { name: "Look from a link" });
const funGroup = (pg) => pg.locator("nav[aria-label=Components] [aria-labelledby=nav-Fun]").count();
const waitSaved = (pg, value) => pg.waitForFunction((v) => localStorage.getItem("litt-gallery:customize") === v, value, { timeout: 2000 }).catch(() => {});
{
  const { ctx, pg, errors } = await open("button", { query: "?look=pink-fun" });
  check(await says(notice(pg), "From a link: Pink, press material, fun motion."), "the notice under the header says From a link: Pink, press material, fun motion.");
  await notice(pg).getByRole("button", { name: "Keep this look" }).click();
  const kept = JSON.stringify({ accent: "pink", material: "press", fun: true });
  await waitSaved(pg, kept);
  check(
    (await saved(pg)) === kept && (await pg.evaluate(() => location.search)) === "" && (await notice(pg).count()) === 0 && (await bodyAccent(pg)) === "pink",
    "Keep this look saves Pink, press and fun mode, takes the look out of the address, and the notice goes",
  );
  check(
    (await pg.evaluate(() => document.activeElement?.id)) === "customize-trigger" && (await pg.getByRole("status").filter({ hasText: "Kept Pink, press material, fun motion." }).count()) === 1,
    "after Keep, focus is on Customize and a status says Kept Pink, press material, fun motion.",
  );
  await pg.reload({ waitUntil: "networkidle" });
  check((await bodyAccent(pg)) === "pink" && (await funGroup(pg)) === 1 && (await notice(pg).count()) === 0, "after a reload the kept look is yours, with no notice");
  for (const e of errors) problems.push(`keep: ${e}`);
  await ctx.close();
}
{
  const { ctx, pg, errors } = await open("button");
  const mine = JSON.stringify({ accent: "blue4", material: "press" });
  await pg.evaluate((v) => localStorage.setItem("litt-gallery:customize", v), mine);
  await pg.goto(`http://localhost:${port}/index.html?look=pink-fun#button`, { waitUntil: "networkidle" });
  check((await bodyAccent(pg)) === "pink" && (await notice(pg).count()) === 1, "with Blue 4 saved, ?look=pink-fun still shows Pink and the notice");
  await notice(pg).getByRole("button", { name: "Back to mine" }).click();
  check(
    (await bodyAccent(pg)) === undefined && (await funGroup(pg)) === 0 && (await pg.evaluate(() => location.search)) === "" && (await saved(pg)) === mine && (await notice(pg).count()) === 0,
    "Back to mine shows your Blue 4, press and calm motion again, takes the look out of the address and leaves what you saved",
  );
  await pg.goto(`http://localhost:${port}/index.html?look=blue4#button`, { waitUntil: "networkidle" });
  check((await notice(pg).count()) === 0 && (await bodyAccent(pg)) === undefined, "a link to the look you already have shows no notice");
  for (const e of errors) problems.push(`back: ${e}`);
  await ctx.close();
}
{
  const { ctx, pg, errors } = await open("button");
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: `http://localhost:${port}` });
  const clipboard = () => pg.evaluate(() => navigator.clipboard.readText());
  /* The write lands after the click returns, so the read waits for the clipboard to change. */
  const copied = async (scope, name) => {
    const before = await clipboard();
    await scope.getByRole("button", { name }).click();
    await pg.waitForFunction((b) => navigator.clipboard.readText().then((t) => t !== b), before, { timeout: 2000 }).catch(() => {});
    return clipboard();
  };
  const install = pg.locator("section[aria-labelledby=install]");
  check(await says(install, "This page shows Monochrome, flat material, calm motion. The registry installs Blue 4 and press material."), "in Monochrome and Flat, the Install section says the registry installs Blue 4 and press");
  const prompt = await copied(pg.locator("main"), "Copy prompt");
  check(prompt.includes("2. Match the look\n") && prompt.includes('data-material="flat"') && !prompt.includes("data-accent=") && prompt.includes("3. Usage\n"), "in Flat's own look, Copy prompt adds Match the look as step 2, with data-material=\"flat\" and no data-accent");

  await pg.locator("header").getByRole("button", { name: "Customize" }).click();
  const panel = pg.getByRole("dialog", { name: "Customize" });
  const group = panel.getByRole("group", { name: "Your look" });
  await group.waitFor();
  check(await says(group, "Monochrome, flat material, calm motion"), "the panel's Your look says Monochrome, flat material, calm motion");
  const setup = await copied(group, "Copy setup");
  check(setup.startsWith('Set up the litt.md look "Monochrome, flat material, calm motion"') && !setup.includes("data-accent=") && setup.includes('<html lang="en" data-material="flat">') && !setup.includes("<FunMode>"), "Copy setup gives the Flat edit alone (its own accent is the ink) and no fun mode");
  check((await group.getByRole("status").filter({ hasText: /^Copied$/ }).count()) >= 1, "Copy setup says Copied");
  check((await copied(group, "Copy link")) === `http://localhost:${port}/index.html?look=flat#button`, "Copy link gives this page with ?look=flat");

  await panel.locator("fieldset", { has: pg.locator("legend", { hasText: /^Accent$/ }) }).locator("label", { has: pg.getByRole("radio", { name: "Blue 4" }) }).click();
  await pg.keyboard.press("Escape");
  await pg.evaluate(() => { location.hash = "#press"; });
  await pg.waitForFunction(() => document.documentElement.dataset.material === undefined);
  await pg.evaluate(() => { location.hash = "#button"; });
  await pg.locator("header").getByRole("button", { name: "Customize" }).click();
  check(await says(group, "Blue 4, press material, calm motion"), "in Blue 4, press and calm motion, Your look says so");
  check((await install.getByText("This page shows").count()) === 0, "in Blue 4 and calm motion, the Install note goes");
  await pg.keyboard.press("Escape");
  const plain = await copied(pg.locator("main"), "Copy prompt");
  check(!plain.includes("Match the look") && plain.includes("2. Usage\n"), "in Blue 4 and calm motion, Copy prompt has no Match the look step");
  for (const e of errors) problems.push(`your look: ${e}`);
  await ctx.close();
}

/* ---------- a hovered Select's placeholder keeps 4.5:1 (R3, --block-hover) ---------- */
for (const look of ["mono", "mono-flat"]) {
  const { ctx, pg, errors } = await open("select", { query: `?look=${look}` });
  const trigger = pg.locator("main").getByRole("combobox").filter({ hasText: "Choose a region" }).first();
  await trigger.hover();
  await pg.waitForTimeout(300); // the fill fades on the instant tier
  const r = await trigger.evaluate((el) => {
    const words = [...el.querySelectorAll("*")].find((n) => n.childElementCount === 0 && n.textContent.trim() === "Choose a region") ?? el;
    const probe = document.createElement("canvas").getContext("2d");
    const rgb = (c) => { probe.fillStyle = "#000"; probe.fillStyle = c; probe.fillRect(0, 0, 1, 1); return [...probe.getImageData(0, 0, 1, 1).data].slice(0, 3); };
    const lum = (c) => { const [r, g, b] = rgb(c).map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const [a, b] = [lum(getComputedStyle(words).color), lum(getComputedStyle(el).backgroundColor)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  });
  check(r >= 4.5, `?look=${look}: a hovered Select's placeholder is ${r.toFixed(2)}:1 on its fill (needs 4.5:1)`);
  for (const e of errors) problems.push(`select hover ${look}: ${e}`);
  await ctx.close();
}

/* ---------- Flat has no light: a checked box's highlight ---------- */
for (const [look, want] of [["mono", 1], ["mono-flat", 0]]) {
  const { ctx, pg, errors } = await open("checkbox", { query: `?look=${look}` });
  const box = pg.locator("main input[type=checkbox]:checked:not(:disabled)").first();
  check((await litInsets(box)) === want, `?look=${look}: a checked checkbox ${want ? "catches its top highlight" : "catches no top highlight (Flat)"}`);
  for (const e of errors) problems.push(`checkbox ${look}: ${e}`);
  await ctx.close();
}

/* ---------- search ---------- */
{
  const { ctx, pg, errors } = await open("overview");
  await pg.keyboard.press("Control+k");
  await pg.getByRole("dialog").waitFor();
  check((await dialogs(pg)) === 1, "Ctrl+K opens one search menu");
  await pg.keyboard.type("slider");
  await pg.keyboard.press("Enter");
  await pg.waitForFunction(() => location.hash === "#slider");
  check(true, "typing slider and Enter opens the Slider page");
  await pg.getByRole("dialog").waitFor({ state: "detached" });
  check((await dialogs(pg)) === 0, "the menu closes when a page is picked");

  await pg.getByRole("button", { name: "Search" }).first().click();
  await pg.getByRole("dialog").waitFor();
  await pg.keyboard.type("dark theme");
  await pg.keyboard.press("Enter");
  await pg.waitForFunction(() => document.documentElement.dataset.theme === "dark");
  check(true, "the header's Search button opens the menu, and Dark theme there sets it");

  await pg.goto(`http://localhost:${port}/index.html#overview`, { waitUntil: "networkidle" });
  await pg.locator("[data-tile=command-menu]").scrollIntoViewIfNeeded();
  await pg.locator("[data-tile=command-menu] button", { hasText: "Search" }).waitFor();
  await pg.keyboard.press("Control+k");
  await pg.getByRole("dialog").first().waitFor();
  await pg.waitForTimeout(400);
  check((await dialogs(pg)) === 1, "with the Command menu's tile on screen, ⌘K still opens one menu");
  await pg.keyboard.press("Escape");

  await pg.goto(`http://localhost:${port}/index.html#command-menu`, { waitUntil: "networkidle" });
  await pg.getByRole("heading", { level: 1, name: "Command menu" }).waitFor();
  await pg.keyboard.press("Control+k");
  await pg.getByRole("dialog").first().waitFor();
  await pg.waitForTimeout(400);
  check((await dialogs(pg)) === 1, "on the Command menu's page, ⌘K opens one menu (the page's demo)");

  for (const e of errors) problems.push(`search: ${e}`);
  await ctx.close();
}

/* ---------- search on a phone ---------- */
{
  const { ctx, pg, errors } = await open("button", { phone: true });
  await pg.locator("header").getByRole("button", { name: "Search" }).tap();
  await pg.getByRole("dialog").waitFor();
  await pg.keyboard.type("toast");
  await pg.keyboard.press("Enter");
  await pg.waitForFunction(() => location.hash === "#toast");
  check(true, "on a phone, the header's search icon opens the menu and a pick opens the page");
  for (const e of errors) problems.push(`phone: ${e}`);
  await ctx.close();
}

await browser.close();
server.close();

for (const p of passed) console.log(`✓ ${p}`);
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nhome: ${problems.length} problem${problems.length === 1 ? "" : "s"}.`);
  process.exit(1);
}
console.log(`\nhome: ${passed.length} claims hold.`);
