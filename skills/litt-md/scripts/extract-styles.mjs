#!/usr/bin/env node
/**
 * litt.md: extract-styles
 *
 * Measure a site's real design tokens, or capture a moodboard for visual
 * reading. Used by workflows/audit.md.
 *
 *   node extract-styles.mjs site  <url> [--out dir] [--width 1440] [--wait 2500]
 *   node extract-styles.mjs board <url> [--out dir] [--shots 6] [--wait 2500]
 *
 * Site mode prints a compact JSON summary (frequency-ranked fonts, type sizes,
 * colors, radii, shadows, transitions, root custom properties) and saves
 * viewport and full-page screenshots. Board mode scrolls the page, saves one
 * screenshot per step, and prints the paths plus image alt texts.
 *
 * Needs Node 18+ and Playwright, either a local dependency or a global
 * install (npm i -g playwright). Respects HTTPS_PROXY when set.
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [mode, url, ...rest] = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i !== -1 && rest[i + 1] ? rest[i + 1] : fallback;
};

if (!["site", "board"].includes(mode) || !url) {
  console.error("usage: extract-styles.mjs <site|board> <url> [--out dir] [--width 1440] [--shots 6] [--wait 2500]");
  process.exit(2);
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    // ESM ignores global modules; resolve from the global npm root instead.
    try {
      const root = execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
      return createRequire(path.join(root, "_"))("playwright");
    } catch {
      console.error("Playwright not found. Install it (npm i -g playwright) or audit from screenshots instead.");
      process.exit(3);
    }
  }
}

const slug = new URL(url).hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-") +
  (new URL(url).pathname.replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "") || "");
const outDir = path.resolve(flag("out", path.join("captures", slug)));
fs.mkdirSync(outDir, { recursive: true });

const { chromium } = await loadPlaywright();
const launch = {};
if (process.env.HTTPS_PROXY) launch.proxy = { server: process.env.HTTPS_PROXY };
const browser = await chromium.launch(launch);
const width = Number(flag("width", 1440));
const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();

async function open() {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  } catch {
    await page.goto(url, { waitUntil: "load", timeout: 45000 }).catch(() => {});
  }
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  // Let entrance animations (Framer appear effects, fade-ins) settle.
  await page.waitForTimeout(Number(flag("wait", 2500)));
}

async function scrollThrough() {
  // Scroll one viewport at a time so lazy content and scroll reveals trigger.
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => window.innerHeight);
  for (let y = vh * 0.8; y < h; y += vh * 0.8) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(600);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
}

const result = { mode, url, out: outDir };

try {
  await open();
  result.title = await page.title();

  if (mode === "site") {
    await page.screenshot({ path: path.join(outDir, "viewport.png") });
    await scrollThrough();
    const fullH = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.screenshot({
      path: path.join(outDir, "full.png"),
      fullPage: fullH <= 8000,
      clip: fullH > 8000 ? { x: 0, y: 0, width, height: 8000 } : undefined,
    });
    result.screenshots = ["viewport.png", fullH > 8000 ? "full.png (first 8000px)" : "full.png"];

    Object.assign(result, await page.evaluate(() => {
      const hex = (c) => {
        const m = c && c.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const [r, g, b, a = "1"] = m[1].split(/[ ,/]+/).filter(Boolean);
        if (Number(a) === 0) return null;
        const h = "#" + [r, g, b].map((v) => Math.round(Number(v)).toString(16).padStart(2, "0")).join("");
        return Number(a) < 1 ? `${h}@${Number(a).toFixed(2)}` : h;
      };
      const tally = () => new Map();
      const add = (map, key, w = 1) => { if (key) map.set(key, (map.get(key) || 0) + w); };
      const top = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, v]);
      const t = { fonts: tally(), sizes: tally(), weights: tally(), tracking: tally(), fg: tally(), bg: tally(),
        radii: tally(), shadows: tally(), durations: tally(), easings: tally(), blur: tally(), gradients: 0 };

      const els = [...document.body.querySelectorAll("*")].slice(0, 5000);
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const s = getComputedStyle(el);
        if (s.visibility === "hidden" || s.display === "none") continue;
        const ownText = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
        if (ownText) {
          const w = Math.min(ownText.length, 200);
          add(t.fonts, s.fontFamily.split(",")[0].replace(/["']/g, "").trim(), w);
          add(t.sizes, `${parseFloat(s.fontSize)}px/${s.lineHeight === "normal" ? "normal" : (parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2)}`, w);
          add(t.weights, s.fontWeight, w);
          if (parseFloat(s.fontSize) >= 28) add(t.tracking, `${parseFloat(s.fontSize)}px:${s.letterSpacing}`, 1);
          add(t.fg, hex(s.color), w);
        }
        add(t.bg, hex(s.backgroundColor), Math.round((r.width * r.height) / 1000));
        if (s.borderRadius && s.borderRadius !== "0px") add(t.radii, s.borderRadius);
        if (s.boxShadow && s.boxShadow !== "none") add(t.shadows, s.boxShadow.slice(0, 140));
        if (s.transitionDuration && s.transitionDuration !== "0s") {
          add(t.durations, s.transitionDuration.split(",")[0].trim());
          add(t.easings, s.transitionTimingFunction.split(",")[0].trim());
        }
        const bf = s.backdropFilter || s.webkitBackdropFilter;
        if (bf && bf !== "none") add(t.blur, bf);
        if (s.backgroundImage && s.backgroundImage.includes("gradient")) t.gradients++;
      }

      const rootVars = {};
      for (const sheet of [...document.styleSheets]) {
        let rules;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const rule of [...rules]) {
          if (!rule.style || !/(^|,)\s*(:root|html|body)\b/.test(rule.selectorText || "")) continue;
          for (const prop of [...rule.style]) {
            if (prop.startsWith("--") && Object.keys(rootVars).length < 60) rootVars[prop] = rule.style.getPropertyValue(prop).trim().slice(0, 80);
          }
        }
      }

      const meta = (n) => document.querySelector(`meta[name="${n}"]`)?.content || null;
      return {
        meta: { themeColor: meta("theme-color"), colorScheme: getComputedStyle(document.documentElement).colorScheme, generator: meta("generator") },
        fonts: top(t.fonts, 6), typeSizes: top(t.sizes, 12), weights: top(t.weights, 6), displayTracking: top(t.tracking, 6),
        textColors: top(t.fg, 8), backgrounds: top(t.bg, 8), radii: top(t.radii, 8), shadows: top(t.shadows, 6),
        transitionDurations: top(t.durations, 6), easings: top(t.easings, 4), backdropFilters: top(t.blur, 4),
        gradientElements: t.gradients, rootCustomProperties: rootVars,
      };
    }));
  } else {
    const shots = Number(flag("shots", 6));
    result.screenshots = [];
    for (let i = 0; i < shots; i++) {
      const file = `board-${String(i + 1).padStart(2, "0")}.png`;
      await page.screenshot({ path: path.join(outDir, file) });
      result.screenshots.push(file);
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.9));
      await page.waitForTimeout(1200);
    }
    Object.assign(result, await page.evaluate(() => {
      const imgs = [...document.images].filter((i) => i.naturalWidth > 120);
      const text = document.body.innerText.slice(0, 4000).toLowerCase();
      return {
        imageCount: imgs.length,
        alts: [...new Set(imgs.map((i) => i.alt.trim()).filter(Boolean))].slice(0, 40).map((a) => a.slice(0, 90)),
        // A visible password field or a "log in to…" prompt usually means a login modal covers the board.
        possibleLoginWall: [...document.querySelectorAll('input[type="password"]')].some((i) => i.getBoundingClientRect().width > 0) ||
          /log in to (see|continue|discover)|sign up to see|welcome to pinterest/.test(text),
      };
    }));
  }
} catch (err) {
  result.error = String(err && err.message || err).slice(0, 300);
} finally {
  await browser.close();
}

let json = JSON.stringify(result, null, 1);
if (json.length > 8000) {
  delete result.rootCustomProperties;
  json = JSON.stringify(result, null, 1).slice(0, 8000);
}
console.log(json);
