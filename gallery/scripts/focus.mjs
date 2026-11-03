#!/usr/bin/env node
/**
 * Focus and layout shift check (WCAG 2.4.3, 3.2.1): focus never falls to the page when something you pressed goes
 * away, and pages do not jump while they load. From a build.
 *
 *   npm run build && npm run test:focus
 *   node scripts/focus.mjs --dist dist --only tile,cls-button
 *   node scripts/focus.mjs --self-test        each scenario, broken on purpose, must fail
 *
 * At 1440 by 900:
 * - tile: Enter on the overview's Button tile goes to #button, and focus lands on that page's h1, not the body.
 * - sign-in: Enter on #sign-in's submit with the fields filled; 150ms later, while it is busy, the submit still has
 *   focus (a disabled button drops it; the busy button is aria-disabled).
 * - type-to-confirm: on #settings, "Or type to confirm", the studio's name typed, Enter; focus is not on the body.
 * - slide-confirm: Enter on #slide-confirm's thumb; focus is not on the body (the confirmed thumb is aria-disabled).
 * And on a 412 by 823 phone with the CPU slowed 4x:
 * - cls-button, cls-table: the layout shift score of #button and #table over their first 5s, shifts after input
 *   left out, is at most 0.1, Google's good.
 *
 * The self-test breaks each one in the page, as it used to be or as a regression would: a blur after the route
 * focuses its h1, a submit that disables its button, a blur after Enter, and a 300px block put on top of main
 * 800ms in. It fails if any scenario still passes.
 *
 * Needs Playwright, found as a11y.mjs finds it (A11Y_TOOLS, then here, then the cloud container's global copy).
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
const only = (get("only", "") || "").split(",").filter(Boolean);
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

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}/index.html`;

const DESKTOP = { viewport: { width: 1440, height: 900 } };
const PHONE = { viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true };
const CLS_LIMIT = 0.1;
const scores = [];

const active = (pg) => pg.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return "the body";
  return `<${a.tagName.toLowerCase()}${a.id ? "#" + a.id : ""}> "${(a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 32)}"`;
});
const confirmed = (pg) => pg.locator('main button[aria-label^="Slide to"][aria-disabled="true"]').count();
async function open(pg, id) {
  await pg.goto(`${base}#${id}`, { waitUntil: "networkidle" });
  await pg.waitForSelector("main h1", { timeout: 15_000 });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(300);
}
const blurAfterEnter = () => document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") setTimeout(() => document.activeElement?.blur(), 100);
}, true);
const cls = (route) => ({
  context: PHONE,
  cpu: 4,
  async run(pg) {
    await pg.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => list.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: "layout-shift", buffered: true });
    });
    await pg.goto(`${base}#${route}`, { waitUntil: "load" });
    await pg.waitForTimeout(5000);
    const score = await pg.evaluate(() => window.__cls);
    scores.push(`#${route} ${score.toFixed(3)}`);
    return score > CLS_LIMIT ? `#${route} shifts ${score.toFixed(3)} on a slow phone, over ${CLS_LIMIT}` : "";
  },
  broken: () => {
    const wait = setInterval(() => {
      if (!document.querySelector("main h1")) return;
      clearInterval(wait);
      setTimeout(() => {
        const block = document.createElement("div");
        block.style.height = "300px";
        document.querySelector("main").prepend(block);
      }, 800);
    }, 50);
  },
});

/* Each scenario returns what went wrong, or "" when focus and layout held. broken runs in the page in the self-test. */
const SCENARIOS = {
  tile: {
    context: DESKTOP,
    async run(pg) {
      await open(pg, "overview");
      await pg.locator('main a[href="#button"]').first().focus();
      await pg.keyboard.press("Enter");
      await pg.waitForSelector("main h1#page-button", { timeout: 10_000 });
      await pg.waitForTimeout(500);
      const ok = await pg.evaluate(() => document.activeElement === document.querySelector("main h1"));
      return ok ? "" : `after Enter on the Button tile, focus is on ${await active(pg)}, not the new page's h1`;
    },
    broken: () => addEventListener("hashchange", () => document.addEventListener("focusin", (e) => {
      if (e.target.tagName === "H1") e.target.blur();
    }, { once: true })),
  },
  "sign-in": {
    context: DESKTOP,
    async run(pg) {
      await open(pg, "sign-in");
      await pg.locator("main input[type=email]").first().fill("nick@litt.md");
      await pg.locator("main input[type=password]").first().fill("correct horse battery");
      const submit = pg.locator("main button[type=submit]").first();
      await submit.focus();
      await pg.keyboard.press("Enter");
      await pg.waitForTimeout(150);
      const ok = await pg.evaluate(() => document.activeElement === document.querySelector("main button[type=submit]"));
      return ok ? "" : `150ms after Enter on Sign in, focus is on ${await active(pg)}, not the busy submit`;
    },
    broken: () => document.addEventListener("submit", (e) => {
      const button = e.target.querySelector("button[type=submit]");
      setTimeout(() => { button.disabled = true; }, 30);
    }, true),
  },
  "type-to-confirm": {
    context: DESKTOP,
    async run(pg) {
      await open(pg, "settings");
      await pg.getByRole("button", { name: "Or type to confirm" }).first().focus();
      await pg.keyboard.press("Enter");
      const field = pg.getByLabel(/^Type ".+" to confirm$/).first();
      await field.waitFor({ timeout: 5000 });
      const name = /^Type "(.+)" to confirm$/.exec(await field.evaluate((el) => el.labels?.[0]?.textContent?.trim() || el.getAttribute("aria-label") || ""))?.[1];
      if (!name) return "could not read the words to type from the field's label";
      await field.focus();
      await pg.keyboard.type(name);
      await pg.keyboard.press("Enter");
      await pg.waitForTimeout(600);
      if (!(await confirmed(pg))) return "typing the studio's name and Enter did not confirm";
      const where = await active(pg);
      return where === "the body" ? "after typing the studio's name and Enter, focus fell to the body" : "";
    },
    broken: blurAfterEnter,
  },
  "slide-confirm": {
    context: DESKTOP,
    async run(pg) {
      await open(pg, "slide-confirm");
      await pg.locator('main button[aria-label^="Slide to"]').first().focus();
      await pg.keyboard.press("Enter");
      await pg.waitForTimeout(600);
      if (!(await confirmed(pg))) return "Enter on the thumb did not confirm";
      const where = await active(pg);
      return where === "the body" ? "after Enter on the thumb, focus fell to the body" : "";
    },
    broken: blurAfterEnter,
  },
  "cls-button": cls("button"),
  "cls-table": cls("table"),
};
const names = Object.keys(SCENARIOS).filter((n) => !only.length || only.includes(n));
if (!names.length) { console.error("No scenarios matched."); process.exit(1); }

const browser = await chromium.launch();
const found = [];
const started = Date.now();
for (const name of names) {
  const s = SCENARIOS[name];
  const ctx = await browser.newContext({ ...s.context, reducedMotion: "reduce" });
  if (selfTest) await ctx.addInitScript(s.broken);
  const pg = await ctx.newPage();
  if (s.cpu) await (await ctx.newCDPSession(pg)).send("Emulation.setCPUThrottlingRate", { rate: s.cpu });
  try {
    const what = await s.run(pg);
    if (what) found.push({ name, what });
  } catch (e) {
    found.push({ name, what: `running the check: ${String(e.message || e).split("\n")[0]}`, broke: true });
  }
  await ctx.close();
}
await browser.close();
server.close();
const took = `${Math.round((Date.now() - started) / 1000)}s`;

if (selfTest) {
  const broke = found.filter((f) => f.broke);
  const missed = names.filter((n) => !found.some((f) => f.name === n && !f.broke));
  console.log(`focus self-test: ${names.length - missed.length} of ${names.length} broken scenarios caught${scores.length ? `, layout shift ${scores.join(", ")}` : ""} (${took}).`);
  for (const f of broke) console.log(`✗ ${f.name}: ${f.what}`);
  if (missed.length) console.log(`✗ not caught: ${missed.join(", ")}. The check has gone blind.`);
  process.exit(missed.length || broke.length ? 1 : 0);
}

if (!found.length) {
  console.log(`focus: ${names.join(", ")} hold${scores.length ? `, layout shift ${scores.join(", ")}` : ""} (${took}).`);
  process.exit(0);
}
for (const f of found) console.log(`✗ ${f.name}: ${f.what}`);
console.log(`\nfocus: ${found.length} of ${names.length} scenarios failed.`);
process.exit(1);
