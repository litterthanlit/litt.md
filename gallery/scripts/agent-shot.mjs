#!/usr/bin/env node
/**
 * Screenshots for an agent's self-critique in the agent test (workflows/build.md, step 5: "take Playwright
 * screenshots in light and dark at 1440 and 390, and look at them"). Run it in the host app after `npm run build`:
 *
 *   node <repo>/gallery/scripts/agent-shot.mjs [--path /settings] [--out .litt-shots]
 *
 * It serves the production build (Vite's dist through a static server, Next through `next start`), opens it in
 * Chromium in light and dark at 1440 and 390 wide (390 with touch), and writes full-page PNGs to .litt-shots/
 * for the agent to open with Read. It prints each file, any console error, and any horizontal overflow at 390.
 *
 * The agent test allows this one command (unless --no-self-shots), because the agent cannot start a preview
 * server or Playwright on its own. It reuses the install test's build server and Chromium launcher, so it sees
 * the page the grader will see. .litt-shots/ is left out of the file diff the grader reads.
 */
import fs from "node:fs";
import path from "node:path";
import { serveBuild } from "./test-registry.mjs";
import { launchChromium } from "./test-registry.smoke.mjs";

const args = process.argv.slice(2);
const get = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const dir = process.cwd();
const route = "/" + get("path", "/").replace(/^\/+/, "");
const out = path.resolve(dir, get("out", ".litt-shots"));

const has = (...names) => names.some((n) => fs.existsSync(path.join(dir, n)));
const app = has("next.config.ts", "next.config.js", "next.config.mjs") ? "next" : has("vite.config.ts", "vite.config.js", "vite.config.mjs") ? "vite" : null;
if (!app) {
  console.error("agent-shot: run this in the app folder (no next.config or vite.config here).");
  process.exit(1);
}
if (app === "vite" ? !has("dist/index.html") : !has(".next/BUILD_ID")) {
  console.error("agent-shot: no production build yet. Run npm run build first, then run this again.");
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const served = await serveBuild(app, dir);
const browser = await launchChromium();
const lines = [];
let failed = false;
try {
  for (const [width, height, label] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
    for (const theme of ["light", "dark"]) {
      const touch = label === "phone";
      const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme, hasTouch: touch, isMobile: touch });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e.message ?? e)));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await page.goto(new URL(route, served.url).href, { waitUntil: "networkidle", timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(700); // let the entrances settle
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const file = path.join(out, `${label}-${width}-${theme}.png`);
      await page.screenshot({ path: file, fullPage: true });
      lines.push(`${path.relative(dir, file)}${touch && overflow > 0 ? `  (overflows by ${overflow}px at 390)` : ""}`);
      for (const e of errors) lines.push(`  console error: ${e.split("\n")[0]}`);
      failed ||= errors.length > 0;
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  await served.stop();
}
console.log(`Screenshots of ${route}, light and dark, 1440 and 390 wide. Open them with Read:`);
for (const l of lines) console.log(l);
process.exit(failed ? 1 : 0);
