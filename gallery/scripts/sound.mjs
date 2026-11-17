#!/usr/bin/env node
/**
 * Device's voice (plans/021, phase 1), from a build, with AudioContext stubbed in the page so every source a voice
 * starts is recorded (when, and of what kind) beside every trusted pointerdown and keydown.
 *
 *   npm run build && npm run test:sound
 *   node scripts/sound.mjs --self-test     breaks each rule in the page and fails if the check misses one
 *
 * It fails when:
 * - load:    anything starts on load, with no hand: #device/sound, #device/button, #device/switch, #device/slider and the
 *            player (#device), each left alone for 1.5s;
 * - gesture: anything starts more than 300ms after the last trusted pointerdown or keydown, anywhere below; or a voice
 *            key on #device/sound plays for a script's own events (a dispatched pointerdown, keydown or click), before
 *            a hand or 500ms after one;
 * - outside: anything starts outside Device: a hand on the buttons and switches of #flat/button and #press/switch,
 *            and on #device/sound's Key once <html> says flat;
 * - mute:    anything starts while muted: the top row's Mute (aria-pressed), a reload (it is kept under
 *            litt-gallery:sound), and M turning it back on;
 * - hears:   a hand on #device/sound's keys plays nothing, unmuted, so a check that can no longer hear passes nothing.
 *
 * Needs Playwright, found as the other page checks find it (A11Y_TOOLS, then here, then the cloud container's copy).
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
const HAND_MS = 300;

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
  if (!p.startsWith(dist) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}/index.html`;

/** In the page before anything else: the recording AudioContext, and the hands. */
function stub() {
  const log = (window.__sound = { starts: [], hands: [] });
  const hand = (e) => { if (e.isTrusted) log.hands.push(performance.now()); };
  addEventListener("pointerdown", hand, true);
  addEventListener("keydown", hand, true);
  const param = () => new Proxy({ value: 0 }, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => ((t[k] = v), true) });
  const node = (kind) => {
    const n = {
      kind, onended: null, buffer: null, type: "",
      connect: (d) => d ?? n, disconnect() {}, stop() {},
      start() { log.starts.push({ t: performance.now(), kind, at: location.hash, material: document.documentElement.dataset.material ?? "" }); },
    };
    for (const p of ["gain", "frequency", "Q", "detune", "threshold", "knee", "ratio", "attack", "release"]) n[p] = param();
    return n;
  };
  class Stub {
    constructor() { this.state = "suspended"; this.sampleRate = 48000; this.destination = node("destination"); }
    get currentTime() { return performance.now() / 1000; }
    resume() { this.state = "running"; return Promise.resolve(); }
    suspend() { this.state = "suspended"; return Promise.resolve(); }
    close() { this.state = "closed"; return Promise.resolve(); }
    createGain() { return node("gain"); }
    createOscillator() { return node("oscillator"); }
    createBufferSource() { return node("buffer"); }
    createBiquadFilter() { return node("filter"); }
    createDynamicsCompressor() { return node("compressor"); }
    createBuffer(c, len, rate) {
      const data = Array.from({ length: c }, () => new Float32Array(len));
      return { duration: len / rate, length: len, sampleRate: rate, numberOfChannels: c, getChannelData: (i) => data[i] };
    }
  }
  window.AudioContext = Stub;
  window.webkitAudioContext = Stub;
}

/** The self-test's breaks, each run in the page after the stub: a regression of one rule. */
const BREAKS = {
  load: () => addEventListener("load", () => setTimeout(() => new AudioContext().createOscillator().start(), 300)),
  gesture: () => addEventListener("pointerdown", (e) => e.isTrusted && setTimeout(() => new AudioContext().createOscillator().start(), 500), true),
  outside: () => addEventListener("pointerdown", () => document.documentElement.dataset.material !== "device" && new AudioContext().createOscillator().start(), true),
  mute: () => addEventListener("pointerdown", () => localStorage.getItem("litt-gallery:sound") === "off" && new AudioContext().createOscillator().start(), true),
};

const browser = await chromium.launch();

/** Runs one scenario in a fresh context: returns its failures as [rule, what]. */
async function run(name, body, broken) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(stub);
  if (broken) await ctx.addInitScript(BREAKS[broken]);
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e)));
  const out = [];
  const starts = () => pg.evaluate(() => window.__sound.starts.length);
  const open = async (route) => {
    await pg.goto(`${base}#${route}`, { waitUntil: "networkidle" });
    await pg.evaluate(() => document.fonts.ready);
  };
  try {
    await body({ pg, open, starts, fail: (rule, what) => out.push([rule, what]) });
    /* Every start, anywhere: within 300ms after a trusted hand. */
    const late = await pg.evaluate((ms) => {
      const { starts, hands } = window.__sound;
      return starts.filter((s) => !hands.some((h) => h <= s.t && s.t - h <= ms)).map((s) => `${s.kind} at ${s.at} ${Math.round(s.t)}ms`);
    }, HAND_MS);
    if (late.length && name !== "load") out.push(["gesture", `${late.length} source(s) started with no hand in the last ${HAND_MS}ms: ${late.slice(0, 3).join(", ")}`]);
  } finally {
    await ctx.close();
  }
  return [...out, ...errors.map((e) => ["error", e])];
}

const voiceKey = (pg, name) => pg.locator("main section[data-arrive=stage]").getByRole("button", { name, exact: true });
const VOICE_KEYS = ["Key", "Switch", "Notch", "Digit"];

const SCENARIOS = {
  async load({ pg, open, starts, fail }) {
    for (const route of ["device/sound", "device/button", "device/switch", "device/slider", "device"]) {
      await open(route);
      await pg.waitForTimeout(1500);
      const n = await starts();
      if (n) fail("load", `${n} source(s) started on loading #${route}, with no hand`);
    }
  },
  async gesture({ pg, open, starts, fail }) {
    await open("device/sound");
    const fake = async () => {
      for (const name of VOICE_KEYS)
        await voiceKey(pg, name).evaluate((b) => {
          b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true }));
          b.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, isPrimary: true }));
          b.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
          b.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
          b.click();
        });
      await pg.waitForTimeout(200);
    };
    await fake();
    if (await starts()) fail("gesture", `a script's own events on the voice keys played ${await starts()} source(s), before any hand`);
    await voiceKey(pg, "Key").click();
    await pg.waitForTimeout(200);
    const heard = await starts();
    if (!heard) fail("hears", "a hand on Key played nothing");
    await pg.waitForTimeout(500);
    await fake();
    if ((await starts()) > heard) fail("gesture", `a script's own events played ${(await starts()) - heard} source(s), 700ms after the last hand`);
  },
  async outside({ pg, open, starts, fail }) {
    for (const route of ["flat/button", "press/switch"]) {
      await open(route);
      const targets = pg.locator("main button:visible:not([disabled]), main [role=switch]:visible");
      const count = Math.min(await targets.count(), 8);
      for (let i = 0; i < count; i++) {
        await targets.nth(i).click({ timeout: 1500 }).catch(() => {});
        await pg.keyboard.press("Escape");
      }
      const n = await starts();
      if (n) fail("outside", `a hand on #${route} started ${n} source(s); only Device sounds`);
    }
    await open("device/sound");
    await pg.evaluate(() => (document.documentElement.dataset.material = "flat"));
    await pg.waitForTimeout(100);
    const before = await starts();
    for (const name of VOICE_KEYS) await voiceKey(pg, name).click();
    await pg.waitForTimeout(200);
    if ((await starts()) > before) fail("outside", `#device/sound's keys played ${(await starts()) - before} source(s) with <html> in Flat`);
  },
  async mute({ pg, open, starts, fail }) {
    await open("device/sound");
    const mute = pg.locator("header").getByRole("button", { name: "Mute" });
    if ((await mute.getAttribute("aria-pressed")) !== "false") fail("mute", `Device does not start with sound on: Mute is aria-pressed=${await mute.getAttribute("aria-pressed")}`);
    await mute.click();
    if ((await mute.getAttribute("aria-pressed")) !== "true") fail("mute", "Mute does not say aria-pressed=true once pressed");
    for (const name of VOICE_KEYS) await voiceKey(pg, name).click();
    await pg.waitForTimeout(200);
    if (await starts()) fail("mute", `muted by the key, the voices played ${await starts()} source(s)`);
    if ((await pg.evaluate(() => localStorage.getItem("litt-gallery:sound"))) !== "off") fail("mute", "the mute is not kept under litt-gallery:sound");
    await pg.reload({ waitUntil: "networkidle" });
    if ((await mute.getAttribute("aria-pressed")) !== "true") fail("mute", "the mute is not there after a reload");
    for (const name of VOICE_KEYS) await voiceKey(pg, name).click();
    await pg.waitForTimeout(200);
    if (await starts()) fail("mute", `muted after a reload, the voices played ${await starts()} source(s)`);
    await pg.locator("main h1").click();
    await pg.keyboard.press("m");
    if ((await mute.getAttribute("aria-pressed")) !== "false") fail("mute", "M does not turn the sound back on");
    await voiceKey(pg, "Key").click();
    await pg.waitForTimeout(200);
    if (!(await starts())) fail("hears", "unmuted by M, a hand on Key played nothing");
  },
};

if (selfTest) {
  const clean = (await Promise.all(Object.entries(SCENARIOS).map(([n, s]) => run(n, s)))).flat();
  if (clean.length) {
    console.error(`sound --self-test: not clean to start with:\n  ${clean.map((f) => f.join(" · ")).join("\n  ")}`);
    process.exit(1);
  }
  let missed = 0;
  for (const rule of Object.keys(BREAKS)) {
    const found = (await Promise.all(Object.entries(SCENARIOS).map(([n, s]) => run(n, s, rule)))).flat();
    const hit = found.find(([r]) => r === rule);
    if (!hit) missed++;
    console.log(`${hit ? "✓" : "✗"} self-test: a break of ${rule} ${hit ? `is caught: ${hit[1]}` : "is MISSED"}`);
  }
  await browser.close();
  server.close();
  if (missed) { console.error(`\nsound --self-test: ${missed} break${missed === 1 ? "" : "s"} went unseen.`); process.exit(1); }
  console.log(`\nsound --self-test: all ${Object.keys(BREAKS).length} breaks are caught.`);
  process.exit(0);
}

const found = [];
for (const [name, scenario] of Object.entries(SCENARIOS)) {
  const f = await run(name, scenario);
  console.log(`${f.length ? "✗" : "✓"} ${name}`);
  for (const [rule, what] of f) console.log(`    ${rule} · ${what}`);
  found.push(...f);
}
await browser.close();
server.close();
if (found.length) { console.error(`\nsound: ${found.length} break${found.length === 1 ? "" : "s"}.`); process.exit(1); }
console.log("\nsound: nothing on load, nothing without a hand, nothing outside Device, nothing while muted, and a hand is heard.");
