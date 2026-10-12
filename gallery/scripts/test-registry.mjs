#!/usr/bin/env node
/**
 * Install test for the litt.md shadcn registry: proves a stranger can add litt components to
 * their own project with one command, and that nothing else in their app changes.
 *
 *   node gallery/scripts/test-registry.mjs [--app vite|next|both] [--items a,b] [--keep] [--registry <dir>]
 *
 *   --app        which host to test (default both, run side by side)
 *   --items      only these items, by registry name (default every component item in registry.json)
 *   --registry   a built registry directory (default gallery/public/r); a deployed registry URL such as
 *                https://littmd.vercel.app/r (no local server, no snapshot: the post-deploy check); or
 *                "shadcn" to run the same steps against shadcn's own registry (badge, input, card), which proves the harness
 *   --scenarios  comma list of: each, seq, all, bare, ns, base   (default all)
 *                  each  every item alone, in a fresh app: add, tsc, production build
 *                  seq   items added one command at a time into one app; CSS must not duplicate, and adding an
 *                        item that is already there must leave the global CSS byte for byte the same
 *                  all   every item in ONE add command, then the browser smoke test
 *                  bare  the documented one-liner exactly: `shadcn add <url>` with no --yes and no --overwrite,
 *                        stdin closed, so any prompt is a failure
 *                  ns    `@litt/<item>` through a `registries` entry in components.json
 *                  base  the opt-in base-styles item, if the registry has one: it builds, logs no error, and
 *                        (unlike every other item) does change the host's font, weights and focus ring
 *   --base       the component library `shadcn init` sets the host up with: base (default, what
 *                `init -d` picks: Base UI, where the CLI rewrites a written asChild into a render prop) or radix
 *   --keep       keep the temp apps (failed scenarios are always kept)
 *   --fresh      rebuild the cached host templates
 *   --serial     run vite and next one after the other
 *   --jobs <n>   scenarios run at once per app (default 2; each is its own copy of the host)
 *   --work <dir> temp root (default: <os tmpdir>/litt-registry-test)
 *   --shots <dir> screenshots (default: <work>/shots)
 *   --report <file> prepend a section for this run to a markdown report
 *   --prod-origin <url> origin to rewrite to the local server inside the served JSON
 *                  (default https://littmd.vercel.app, so absolute registryDependencies stay local)
 *
 * Needs the network (npm registry, ui.shadcn.com) and Playwright with Chromium (set PLAYWRIGHT_BROWSERS_PATH, or
 * PLAYWRIGHT_MODULE to the playwright package; nothing is ever downloaded here). Nothing here is part of
 * `verify`: a full run takes about nine minutes, plus three the first time while the host templates are built
 * and cached under <work>/cache. It builds no registry; run the generator first (node scripts/gen-registry.mjs).
 * Every `shadcn add` is told to stay non-interactive and has a hard timeout.
 *
 * What one scenario proves, per host app (Vite 8 + React 19 + TS + Tailwind 4.3, and Next 16 App Router):
 *   add    `npx shadcn@4.21.0 add <url>... --yes --overwrite` exits 0 without a prompt (every child has a timeout)
 *   css    the global stylesheet has no litt block twice after any add
 *   files  no existing host file changed except the global CSS, package.json and the lockfile, and no
 *          host dependency changed version (so litt cannot overwrite shadcn's own Button)
 *   page   the smoke page imports every installed component by the exports the install wrote
 *   tsc    `tsc --noEmit` passes under the host's own strict tsconfig
 *   build  the production build passes
 *   rsc    (next) each component module can be imported from a Server Component, so "use client" is there
 *   smoke  (all) in Chromium, light and `.dark`: no console errors; the primary litt Button is litt's accent;
 *          Tooltip, Tabs, Menu (glass panel), CommandMenu, Dialog, Toast and ProjectList work; dark mode
 *          follows .dark, .light, [data-theme] and the system setting as documented; and the host shadcn
 *          Button, body, headings, native controls, Tailwind utilities and every root CSS variable
 *          compute exactly as they did before litt was installed.
 *
 * Exit code 1 on any failure, with an app x scenario x step table.
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findDuplicateLittBlocks } from "./test-registry.css.mjs";
import {
  buildHostOnlyPage,
  buildRscPage,
  buildSmokePage,
  compareTheme,
  indexExports,
  knownRecipeNames,
  launchChromium,
  measureBaseStyles,
  measureHost,
  readExpectedAccent,
  recipeNeedsFor,
  runSmoke,
} from "./test-registry.smoke.mjs";

/* ------------------------------------------------------------------ pins */

/**
 * Versions the hosts are built from. Checked with `npm view <pkg> time` on 2026-10-12: each is at
 * least two weeks old (the newest allowed publish date was 2026-09-28). Anything not listed here
 * (eslint, the Next template's own dependencies) is whatever the scaffolder resolves; the exact
 * result of every template is printed and written to versions.json beside it.
 */
const PINS = {
  shadcn: "4.21.0", //             2026-09-04, the CLI the registry is built for
  createVite: "9.2.1", //          2026-09-10
  vite: "8.3.1", //                2026-09-24
  viteReact: "6.1.1", //           2026-08-28
  typescript: "6.0.3", //          2026-04-16
  react: "19.3.0", //              2026-09-09
  typesReact: "19.3.0", //         2026-09-09
  typesReactDom: "19.3.0", //      2026-09-09
  typesNode: "24.13.6", //         2026-09-19
  tailwind: "4.3.3", //            2026-07-16 (tailwindcss, @tailwindcss/vite, @tailwindcss/postcss)
  createNextApp: "16.3.6", //      2026-09-22 (scaffolds next@16.3.6)
};
const TEMPLATE_VERSION = 2; // bump when the template steps below change
const MEASURE_VERSION = 2; // bump when what the smoke module measures changes (the baseline is re-measured)

/* ------------------------------------------------------------------ paths and args */

const here = path.dirname(fileURLToPath(import.meta.url));
const galleryDir = path.resolve(here, "..");
const repoDir = path.resolve(galleryDir, "..");
const tokensCss = path.join(repoDir, "skills", "litt-md", "assets", "tokens.css");

function parseArgs(argv) {
  const o = {
    app: "both",
    items: null,
    keep: false,
    fresh: false,
    serial: false,
    registry: path.join(galleryDir, "public", "r"),
    scenarios: "each,seq,all,bare,ns,base",
    work: null,
    shots: null,
    report: null,
    prodOrigin: "https://littmd.vercel.app",
    help: false,
    noBrowser: false,
    base: "base",
    jobs: 2,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      if (i + 1 >= argv.length) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    if (a === "--app") o.app = val();
    else if (a === "--items")
      o.items = val()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a === "--registry") {
      const v = val();
      o.registry = v === "shadcn" ? v : /^https?:\/\//.test(v) ? v.replace(/\/+$/, "").replace(/(?<!\/r)$/, "/r") : path.resolve(v);
    } else if (a === "--scenarios") o.scenarios = val();
    else if (a === "--work") o.work = path.resolve(val());
    else if (a === "--shots") o.shots = path.resolve(val());
    else if (a === "--report") o.report = path.resolve(val());
    else if (a === "--base") o.base = val();
    else if (a === "--jobs") o.jobs = Math.max(1, Number(val()) || 1);
    else if (a === "--prod-origin") o.prodOrigin = val().replace(/\/$/, "");
    else if (a === "--keep") o.keep = true;
    else if (a === "--fresh") o.fresh = true;
    else if (a === "--serial") o.serial = true;
    else if (a === "--no-browser") o.noBrowser = true;
    else if (a === "-h" || a === "--help") o.help = true;
    else throw new Error(`unknown argument ${a} (try --help)`);
  }
  if (!["vite", "next", "both"].includes(o.app)) throw new Error(`--app must be vite, next or both`);
  if (!["base", "radix"].includes(o.base)) throw new Error(`--base must be base or radix`);
  o.work ??= path.join(os.tmpdir(), "litt-registry-test");
  o.shots ??= path.join(o.work, "shots");
  o.scenarioSet = new Set(o.scenarios.split(",").map((s) => s.trim()));
  return o;
}

/* ------------------------------------------------------------------ child processes */

const children = new Set();
const killTree = (child) => {
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    try {
      child.kill("SIGKILL");
    } catch {
      /* already gone */
    }
  }
};
const killAll = () => children.forEach(killTree);
process.on("SIGINT", () => {
  killAll();
  process.exit(130);
});
process.on("SIGTERM", () => {
  killAll();
  process.exit(143);
});

const BASE_ENV = {
  ...process.env,
  CI: "1",
  FORCE_COLOR: "0",
  NO_COLOR: "1",
  NEXT_TELEMETRY_DISABLED: "1",
  npm_config_audit: "false",
  npm_config_fund: "false",
  npm_config_update_notifier: "false",
  npm_config_yes: "true",
  DISABLE_OPENCOLLECTIVE: "1",
  ADBLOCK: "1",
};

/** TEST_REGISTRY_TIMEOUT_SCALE=0.01 shrinks every timeout, to prove that a hung child is killed. */
const TIMEOUT_SCALE = Number(process.env.TEST_REGISTRY_TIMEOUT_SCALE) || 1;

/** Run a command with stdin closed and a hard timeout. Resolves, never rejects: {code, out, ms, timedOut}. */
function run(cmd, args, { cwd, timeout = 300000, env = {}, logFile } = {}) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let out = "";
    let timedOut = false;
    let child;
    try {
      child = spawn(cmd, args, { cwd, env: { ...BASE_ENV, ...env }, stdio: ["ignore", "pipe", "pipe"], detached: true });
    } catch (e) {
      return resolve({ code: 127, out: String(e), ms: 0, timedOut: false });
    }
    children.add(child);
    const take = (d) => {
      out += d;
      if (out.length > 3e6) out = out.slice(-1.5e6);
    };
    child.stdout.on("data", take);
    child.stderr.on("data", take);
    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child);
    }, timeout * TIMEOUT_SCALE);
    const done = (code) => {
      clearTimeout(timer);
      children.delete(child);
      const ms = Date.now() - t0;
      if (timedOut) out += `\n[test-registry] killed after ${Math.round((timeout * TIMEOUT_SCALE) / 1000)}s timeout`;
      if (logFile) {
        fs.mkdirSync(path.dirname(logFile), { recursive: true });
        fs.appendFileSync(logFile, `$ ${cmd} ${args.join(" ")}\n${out}\n[exit ${timedOut ? "timeout" : code}, ${(ms / 1000).toFixed(1)}s]\n\n`);
      }
      resolve({ code: timedOut ? 124 : (code ?? 1), out, ms, timedOut });
    };
    child.on("error", (e) => {
      out += String(e);
      done(127);
    });
    child.on("close", (code) => done(code));
  });
}

const npx = (args, o) => run("npx", ["--yes", ...args], o);
const shadcn = (args, o) => npx([`shadcn@${PINS.shadcn}`, ...args], o);

/** Network blips between the CLI and npm, not anything about the registry. */
const NETWORK_FLAKE = /ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|ENOTFOUND registry\.npmjs|network request failed|503 Service Unavailable/i;

/** `shadcn add`, tried once more when the failure is only a network blip (a registry failure is never retried). */
async function shadcnAdd(args, o) {
  let r = await shadcn(["add", ...args], o);
  if (r.code !== 0 && !r.timedOut && NETWORK_FLAKE.test(r.out)) {
    console.log(`      (network error while adding, trying once more: ${(r.out.match(NETWORK_FLAKE) ?? [""])[0]})`);
    const again = await shadcn(["add", ...args], o);
    again.retried = true;
    r = again;
  }
  return r;
}

/**
 * Lets many holders run together ("shared": installs, tsc, builds) but gives the browser smoke
 * the machine to itself ("exclusive"), so a busy CPU cannot turn into a timeout in Chromium.
 */
class Gate {
  constructor() {
    this.shared = 0;
    this.exclusive = false;
    this.queue = [];
  }
  run(kind, fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        kind,
        go: () =>
          fn()
            .then(resolve, reject)
            .finally(() => this.release(kind)),
      });
      this.pump();
    });
  }
  release(kind) {
    if (kind === "shared") this.shared--;
    else this.exclusive = false;
    this.pump();
  }
  pump() {
    while (this.queue.length) {
      const head = this.queue[0];
      if (head.kind === "shared" && !this.exclusive) this.shared++;
      else if (head.kind === "exclusive" && !this.exclusive && this.shared === 0) this.exclusive = true;
      else break;
      this.queue.shift();
      head.go();
    }
  }
}

/* ------------------------------------------------------------------ small helpers */

const sec = (ms) => (ms / 1000).toFixed(1) + "s";
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex");
const ensureDir = (d) => fs.mkdirSync(d, { recursive: true });
const rmrf = (d) => fs.rmSync(d, { recursive: true, force: true });
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + "\n");
const firstLines = (text, n = 14) => {
  const lines = text
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim());
  return lines.slice(0, n).join("\n");
};
/** The most useful lines of a failed command: errors first, else the tail. */
function errorExcerpt(out, n = 14) {
  const lines = out
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim());
  const hot = lines.map((l, i) => [l, i]).filter(([l]) => /error|failed|cannot|not found|ERR!|TS\d{4}|✗|×|timeout/i.test(l));
  if (hot.length) {
    const from = Math.max(0, hot[0][1] - 1);
    return lines.slice(from, from + n).join("\n");
  }
  return lines.slice(-n).join("\n");
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on("error", reject);
  });
}

async function waitForUrl(url, ms = 60000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

/* ------------------------------------------------------------------ registry server */

function startRegistryServer(dir, prodOrigin) {
  const requests = [];
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    const rel = url.replace(/^\/r\//, "/").replace(/^\/+/, "");
    const file = path.join(dir, rel);
    const origin = `http://localhost:${server.address().port}`;
    const record = (status) => requests.push({ path: url, status });
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      record(404);
      res.writeHead(404, { "content-type": "application/json", "access-control-allow-origin": "*", connection: "close" });
      return res.end(JSON.stringify({ error: `not found: ${url}` }));
    }
    let body = fs.readFileSync(file, "utf8");
    if (file.endsWith(".json")) body = body.split(prodOrigin).join(origin);
    record(200);
    // connection: close, so no client reuses a socket the server is about to time out (that shows up as ECONNRESET).
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "no-store", connection: "close" });
    res.end(body);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests })));
}

/* ------------------------------------------------------------------ registry description */

const COMPONENT_TYPES = new Set(["registry:ui", "registry:component", "registry:block"]);

/** A deployed registry: read its index over HTTP and check every item answers as JSON. */
async function describeRemoteRegistry(opts, componentRecipeNames) {
  const base = opts.registry;
  const get = async (name) => {
    const res = await fetch(`${base}/${name}.json`, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`${base}/${name}.json answered ${res.status}`);
    return { text: await res.text(), type: res.headers.get("content-type") ?? "", cors: res.headers.get("access-control-allow-origin") };
  };
  const index = await get("registry");
  const items = (JSON.parse(index.text).items ?? []).map((i) => ({ name: i.name, type: i.type }));
  const problems = [];
  const bodies = [];
  for (const i of items) {
    const r = await get(i.name);
    bodies.push(r.text);
    if (!/json/.test(r.type)) problems.push(`${i.name}.json is served as "${r.type}", not application/json`);
    if (r.cors !== "*") problems.push(`${i.name}.json has Access-Control-Allow-Origin "${r.cors}", not *`);
  }
  if (problems.length) throw new Error(`the deployed registry's responses are wrong:\n${problems.slice(0, 8).join("\n")}`);
  return describeItems(opts, items, componentRecipeNames, { dir: null, hash: sha(bodies.join("\n")).slice(0, 8) });
}

/** What to install: item names, how to address them, and which of them are components. */
async function describeRegistry(opts, componentRecipeNames) {
  if (opts.registry === "shadcn") {
    const all = ["badge", "input", "card"];
    return {
      kind: "shadcn",
      dir: null,
      all,
      components: opts.items ?? all,
      baseStyles: null,
      fingerprint: "shadcn default registry",
      count: all.length,
    };
  }
  if (/^https?:\/\//.test(opts.registry)) return describeRemoteRegistry(opts, componentRecipeNames);
  const indexFile = path.join(opts.registry, "registry.json");
  if (!fs.existsSync(indexFile)) {
    throw new Error(
      `no registry at ${opts.registry} (registry.json is missing).\n  Run the generator first (node gallery/scripts/gen-registry.mjs), pass --registry <dir>,\n  or use --registry shadcn to prove the harness against shadcn's own registry.`,
    );
  }
  const index = readJson(indexFile);
  const items = (index.items ?? []).map((i) => ({ name: i.name, type: i.type }));
  const missing = items.filter((i) => !fs.existsSync(path.join(opts.registry, `${i.name}.json`)));
  if (missing.length)
    throw new Error(`registry.json lists items that have no ${missing.map((m) => m.name + ".json").join(", ")} in ${opts.registry}`);
  const hash = sha(items.map((i) => fs.readFileSync(path.join(opts.registry, `${i.name}.json`), "utf8")).join("\n")).slice(0, 8);
  return describeItems(opts, items, componentRecipeNames, { dir: opts.registry, hash });
}

function describeItems(opts, items, componentRecipeNames, { dir, hash }) {
  const byName = new Map(items.map((i) => [i.name, i]));
  if (opts.items)
    for (const n of opts.items) if (!byName.has(n)) throw new Error(`--items ${n}: not in registry.json (${items.map((i) => i.name).join(", ")})`);
  const isComponent = (i) => componentRecipeNames.includes(i.name) || COMPONENT_TYPES.has(i.type);
  const baseStyles = items.find((i) => /base-?styles/.test(i.name))?.name ?? null;
  const components = opts.items ?? items.filter((i) => isComponent(i) && i.name !== baseStyles).map((i) => i.name);
  return { kind: "litt", dir, all: items.map((i) => i.name), components, baseStyles, fingerprint: hash, count: items.length };
}

/* ------------------------------------------------------------------ host templates */

const VITE_CONFIG = `import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
})
`;

const stripJsonComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const APPS = {
  vite: {
    name: "host-vite",
    page: "src/App.tsx",
    cssGlobal: "src/index.css",
    tsc: ["tsc", "--noEmit", "-p", "tsconfig.app.json"],
    build: ["vite", "build"],
  },
  next: {
    name: "host-next",
    page: "app/page.tsx",
    cssGlobal: "app/globals.css",
    tsc: ["tsc", "--noEmit"],
    build: ["next", "build"],
  },
};

const templateKey = (base) => sha(JSON.stringify({ PINS, TEMPLATE_VERSION, base, node: process.versions.node.split(".")[0] })).slice(0, 10);

/** Build (or reuse) the pristine host for an app, then its baseline. Returns {dir, baseline, versions}. */
async function ensureTemplate(app, ctx) {
  const cache = path.join(ctx.opts.work, "cache", templateKey(ctx.opts.base));
  const dir = path.join(cache, APPS[app].name);
  const ready = path.join(cache, `${app}.ready`);
  const log = (m) => console.log(`[${app.padEnd(4)} template] ${m}`);
  const logFile = path.join(ctx.runDir, "logs", `${app}-template.log`);
  let versions;
  if (!ctx.opts.fresh && fs.existsSync(ready)) {
    log(`reusing ${dir}`);
    versions = readJson(ready);
  } else {
    versions = await buildTemplate(app, ctx, { cache, dir, ready, log, logFile });
  }
  const baseline = await ensureBaseline(app, ctx, { cache, dir, log, logFile });
  return { dir, versions, baseline };
}

async function buildTemplate(app, ctx, { cache, dir, ready, log, logFile }) {
  rmrf(dir);
  rmrf(ready);
  ensureDir(cache);
  const must = async (what, p, show = true) => {
    const r = await p;
    if (r.code !== 0) throw new Error(`template ${app}: ${what} failed (exit ${r.code})\n${errorExcerpt(r.out)}`);
    if (show) log(`${what} ${sec(r.ms)}`);
    return r;
  };
  const o = (cwd, timeout = 420000) => ({ cwd, timeout, logFile });

  if (app === "vite") {
    await must(
      "scaffold (create-vite)",
      npx([`create-vite@${PINS.createVite}`, APPS.vite.name, "--template", "react-ts", "--no-interactive"], o(cache)),
    );
    const pin = (list, dev) => ["install", "--save-exact", ...(dev ? ["-D"] : []), "--no-audit", "--no-fund", ...list];
    await must(
      "pin runtime deps",
      run(
        "npm",
        pin([`react@${PINS.react}`, `react-dom@${PINS.react}`, `tailwindcss@${PINS.tailwind}`, `@tailwindcss/vite@${PINS.tailwind}`], false),
        o(dir),
      ),
    );
    await must(
      "pin dev deps",
      run(
        "npm",
        pin(
          [
            `vite@${PINS.vite}`,
            `@vitejs/plugin-react@${PINS.viteReact}`,
            `typescript@${PINS.typescript}`,
            `@types/react@${PINS.typesReact}`,
            `@types/react-dom@${PINS.typesReactDom}`,
            `@types/node@${PINS.typesNode}`,
          ],
          true,
        ),
        o(dir),
      ),
    );
    // Tailwind v4 and the "@" alias, as shadcn's Vite guide asks.
    fs.writeFileSync(path.join(dir, "src/index.css"), '@import "tailwindcss";\n');
    fs.writeFileSync(path.join(dir, "vite.config.ts"), VITE_CONFIG);
    // TypeScript 6 deprecates baseUrl, and `paths` works without it.
    const rootTs = {
      files: [],
      references: [{ path: "./tsconfig.app.json" }, { path: "./tsconfig.node.json" }],
      compilerOptions: { paths: { "@/*": ["./src/*"] } },
    };
    writeJson(path.join(dir, "tsconfig.json"), rootTs);
    const appTs = JSON.parse(stripJsonComments(fs.readFileSync(path.join(dir, "tsconfig.app.json"), "utf8")));
    appTs.compilerOptions.paths = { "@/*": ["./src/*"] };
    writeJson(path.join(dir, "tsconfig.app.json"), appTs);
  } else {
    await must(
      "scaffold (create-next-app)",
      npx(
        [
          `create-next-app@${PINS.createNextApp}`,
          APPS.next.name,
          "--ts",
          "--tailwind",
          "--eslint",
          "--app",
          "--no-src-dir",
          "--import-alias",
          "@/*",
          "--use-npm",
          "--disable-git",
          "--yes",
          "--no-react-compiler",
        ],
        o(cache),
      ),
    );
    await must(
      "pin tailwind",
      run(
        "npm",
        ["install", "--save-exact", "-D", "--no-audit", "--no-fund", `tailwindcss@${PINS.tailwind}`, `@tailwindcss/postcss@${PINS.tailwind}`],
        o(dir),
      ),
    );
  }

  await must(
    `shadcn init (${ctx.opts.base})`,
    shadcn(["init", "-d", "-y", "-t", app, ...(ctx.opts.base === "radix" ? ["-b", "radix"] : [])], o(dir)),
  );
  await must("pin shadcn package", run("npm", ["install", "--save-exact", "--no-audit", "--no-fund", `shadcn@${PINS.shadcn}`], o(dir)));
  await must("shadcn add button (the host's own)", shadcn(["add", "button", "--yes"], o(dir)));
  if (!fs.existsSync(path.join(dir, "components.json"))) throw new Error(`template ${app}: components.json missing after init`);
  const buttonFile = ["src/components/ui/button.tsx", "components/ui/button.tsx"].find((f) => fs.existsSync(path.join(dir, f)));
  if (!buttonFile) throw new Error(`template ${app}: the host has no components/ui/button.tsx after shadcn add button`);

  const versions = await installedVersions(dir);
  writeJson(ready, versions);
  log(`ready (${versions.summary})`);
  return versions;
}

/** How the untouched host renders, measured from a scratch copy and cached per MEASURE_VERSION. Measured twice: it must be stable. */
async function ensureBaseline(app, ctx, { cache, dir, log, logFile }) {
  const file = path.join(cache, `${app}.baseline.v${MEASURE_VERSION}.json`);
  if (!ctx.opts.fresh && fs.existsSync(file)) return readJson(file);
  log("measuring the baseline (host Button, body, headings, utilities, CSS variables)");
  const scratch = path.join(ctx.runDir, `${app}-baseline`);
  await copyDir(dir, scratch);
  fs.writeFileSync(path.join(scratch, APPS[app].page), buildHostOnlyPage({ app }));
  const built = await buildApp(app, scratch, logFile);
  if (built.code !== 0) throw new Error(`template ${app}: the baseline page failed to build\n${errorExcerpt(built.out)}`);
  const served = await serveBuild(app, scratch, logFile);
  let first;
  let second;
  try {
    const browser = await ctx.getBrowser();
    first = await measureHost(browser, served.url);
    second = await measureHost(browser, served.url);
  } finally {
    await served.stop();
  }
  rmrf(scratch);
  if (first.errors.length) throw new Error(`template ${app}: the baseline page logged errors:\n${first.errors.join("\n")}`);
  const unstable = [...compareTheme(first.light, second.light), ...compareTheme(first.dark, second.dark)];
  if (unstable.length)
    throw new Error(`template ${app}: the baseline is not stable between two loads (a harness problem):\n${unstable.slice(0, 8).join("\n")}`);
  writeJson(file, first);
  log(`baseline: ${Object.keys(first.light).length} probes, ${Object.keys(first.light.vars).length} root variables`);
  return first;
}

async function installedVersions(dir) {
  const r = await run("npm", ["ls", "--json", "--depth=0"], { cwd: dir, timeout: 60000 });
  let deps = {};
  try {
    deps = JSON.parse(r.out).dependencies ?? {};
  } catch {
    /* leave empty */
  }
  const pick = ["next", "vite", "react", "react-dom", "typescript", "tailwindcss", "shadcn", "@base-ui/react", "lucide-react", "tw-animate-css"];
  const list = Object.fromEntries(Object.entries(deps).map(([n, d]) => [n, d.version]));
  return {
    all: list,
    summary: pick
      .filter((n) => list[n])
      .map((n) => `${n} ${list[n]}`)
      .join(", "),
  };
}

async function copyDir(from, to) {
  rmrf(to);
  ensureDir(path.dirname(to));
  const r = await run("cp", ["-a", from, to], { timeout: 300000 });
  if (r.code !== 0) throw new Error(`cp -a ${from} ${to} failed: ${r.out}`);
}

/* ------------------------------------------------------------------ build and serve */

function buildApp(app, dir, logFile) {
  return npx(APPS[app].build, { cwd: dir, timeout: 420000, logFile });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".map": "application/json",
  ".txt": "text/plain",
};

/** Serve the production build: Vite's dist through a static server, Next through `next start`. Returns {url, stop}. */
async function serveBuild(app, dir, logFile) {
  if (app === "vite") {
    const dist = path.join(dir, "dist");
    const server = http.createServer((req, res) => {
      const p = path.join(dist, decodeURIComponent((req.url ?? "/").split("?")[0]).replace(/\/$/, "/index.html"));
      if (!p.startsWith(dist) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": MIME[path.extname(p)] ?? "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    return { url: `http://127.0.0.1:${server.address().port}/`, stop: async () => void server.close() };
  }
  const port = await freePort();
  const child = spawn("npx", ["--yes", "next", "start", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: dir,
    env: BASE_ENV,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  children.add(child);
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.stderr.on("data", (d) => (out += d));
  const stop = async () => {
    killTree(child);
    children.delete(child);
    if (logFile) fs.appendFileSync(logFile, `$ next start -p ${port}\n${out}\n\n`);
  };
  const up = await waitForUrl(`http://127.0.0.1:${port}/`, 60000);
  if (!up) {
    await stop();
    throw new Error(`next start did not come up on :${port}\n${firstLines(out)}`);
  }
  return { url: `http://127.0.0.1:${port}/`, stop };
}

/* ------------------------------------------------------------------ snapshots */

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", ".git", ".turbo", ".vite"]);

/** Map of relative path -> sha1 for every project file. */
function snapshot(dir) {
  const out = new Map();
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (SKIP_DIRS.has(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && !/\.tsbuildinfo$/.test(e.name) && e.name !== "next-env.d.ts")
        out.set(path.relative(dir, p).split(path.sep).join("/"), sha(fs.readFileSync(p)));
    }
  };
  walk(dir);
  return out;
}

function diffSnapshots(before, after) {
  const added = [...after.keys()].filter((k) => !before.has(k));
  const modified = [...after.keys()].filter((k) => before.has(k) && before.get(k) !== after.get(k));
  const removed = [...before.keys()].filter((k) => !after.has(k));
  return { added, modified, removed };
}

const depsOf = (dir) => {
  const pkg = readJson(path.join(dir, "package.json"));
  return { ...pkg.devDependencies, ...pkg.dependencies };
};

/* ------------------------------------------------------------------ results */

const STEPS = ["add", "css", "files", "page", "tsc", "build", "rsc", "smoke"];

class Scenario {
  constructor(app, id) {
    this.app = app;
    this.id = id;
    this.steps = new Map(); // name -> {status, ms, detail}
    this.notes = [];
  }
  set(name, status, ms, detail = "") {
    this.steps.set(name, { status, ms, detail });
  }
  get failed() {
    return [...this.steps.entries()].filter(([, s]) => s.status === "fail");
  }
}

/** Run one step: fn returns undefined, {detail}, or {status:"warn"|"skip", detail}; a throw is a failure. Returns true unless it failed. */
async function step(sc, name, fn) {
  const t0 = Date.now();
  const tag = `[${sc.app.padEnd(4)} ${sc.id}]`;
  try {
    const r = (await fn()) ?? {};
    const status = r.status ?? "ok";
    sc.set(name, status, Date.now() - t0, r.detail ?? "");
    const label = status === "ok" ? "ok  " : status === "warn" ? "warn" : "skip";
    console.log(
      `${tag} ${name.padEnd(5)} ${label} ${sec(Date.now() - t0)}${r.detail && status !== "skip" ? "  " + r.detail.split("\n")[0].slice(0, 110) : ""}`,
    );
    return true;
  } catch (e) {
    const detail = String(e.message ?? e);
    sc.set(name, "fail", Date.now() - t0, detail);
    console.log(
      `${tag} ${name.padEnd(5)} FAIL ${sec(Date.now() - t0)}\n${detail
        .split("\n")
        .slice(0, 8)
        .map((l) => "      " + l)
        .join("\n")}`,
    );
    return false;
  }
}

const skipRest = (sc, from) => {
  const at = STEPS.indexOf(from);
  for (const s of STEPS.slice(at)) if (!sc.steps.has(s)) sc.set(s, "skip", 0, `skipped because an earlier step failed`);
};

/* ------------------------------------------------------------------ scenarios */

/** Plan the scenarios for one app. Each has `adds`: groups of items, one `shadcn add` command per group. */
function planScenarios(app, reg, opts) {
  const want = opts.scenarioSet;
  const plan = [];
  const comps = reg.components;
  if (want.has("each")) for (const c of comps) plan.push({ id: `each:${c}`, adds: [[c]], items: [c], browser: false });
  if (want.has("seq") && comps.length > 1) plan.push({ id: "seq", adds: comps.map((c) => [c]), items: comps, browser: false, cssEach: true });
  if (want.has("all")) plan.push({ id: "all", adds: [comps], items: comps, browser: !opts.noBrowser, rsc: app === "next" });
  if (want.has("bare")) {
    const pick = comps.includes("menu") ? "menu" : comps[0];
    if (pick) plan.push({ id: "bare", adds: [[pick]], items: [pick], browser: false, bare: true });
  }
  if (want.has("ns") && reg.kind === "litt") {
    const pick = ["button", "menu"].filter((c) => comps.includes(c));
    const ns = (pick.length ? pick : comps.slice(0, 2)).slice(0, 2);
    if (ns.length) plan.push({ id: "ns", adds: [ns.map((c) => `@litt/${c}`)], items: ns, namespace: true, browser: false });
  }
  if (want.has("base") && reg.baseStyles)
    plan.push({ id: "base-styles", adds: [[reg.baseStyles]], items: [], baseStyles: true, browser: !opts.noBrowser });
  return plan;
}

async function runScenario(app, sc, plan, ctx) {
  const { opts, reg, runDir } = ctx;
  const tpl = ctx.templates[app];
  const cfg = APPS[app];
  const dir = path.join(runDir, app, plan.id.replace(/[^\w.-]/g, "_"));
  const logFile = path.join(runDir, "logs", `${app}-${plan.id.replace(/[^\w.-]/g, "_")}.log`);
  const L = (m) => console.log(`[${app.padEnd(4)} ${plan.id}] ${m}`);
  await copyDir(tpl.dir, dir);

  if (plan.namespace) {
    const cj = readJson(path.join(dir, "components.json"));
    cj.registries = { ...cj.registries, "@litt": `${ctx.registryBase}/{name}.json` };
    writeJson(path.join(dir, "components.json"), cj);
  }
  const cssFile = readJson(path.join(dir, "components.json")).tailwind.css;
  const before = snapshot(dir);
  const depsBefore = depsOf(dir);
  const addUrl = (item) => (item.startsWith("@") || reg.kind === "shadcn" ? item : `${ctx.registryBase}/${item}.json`);

  // add (+ css after each command)
  const cssProblems = [];
  let littDecls = null;
  const added = await step(sc, "add", async () => {
    const notes = [];
    for (const group of plan.adds) {
      const urls = group.map(addUrl);
      const r = await ctx.gate.run("shared", () =>
        shadcnAdd(plan.bare ? urls : [...urls, "--yes", "--overwrite"], { cwd: dir, timeout: 420000, logFile }),
      );
      if (r.code !== 0)
        throw new Error(
          `shadcn add ${urls.join(" ")} exited ${r.code}${r.timedOut ? " (timeout: it is waiting on something interactive?)" : ""}\n${errorExcerpt(r.out)}${ctx.notFound()}`,
        );
      for (const l of r.out.split("\n")) if (/skipp|conflict|already exist|overwrit|warn/i.test(l)) notes.push(l.trim());
      if (r.retried) notes.push("retried once after a network error");
      const css = fs.readFileSync(path.join(dir, cssFile), "utf8");
      const { problems, stats } = findDuplicateLittBlocks(css);
      if (problems.length) cssProblems.push(`after adding ${group.join(", ")}: ${problems.join("; ")}`);
      littDecls = stats.littDecls;
    }
    if (plan.cssEach) {
      // Adding an item that is already there must leave the global CSS exactly as it was.
      const cssBefore = fs.readFileSync(path.join(dir, cssFile), "utf8");
      const again = plan.adds[0].map(addUrl);
      const r = await ctx.gate.run("shared", () => shadcnAdd([...again, "--yes", "--overwrite"], { cwd: dir, timeout: 420000, logFile }));
      if (r.code !== 0) throw new Error(`re-adding ${again.join(" ")} exited ${r.code}\n${errorExcerpt(r.out)}`);
      const cssAfter = fs.readFileSync(path.join(dir, cssFile), "utf8");
      if (cssAfter !== cssBefore)
        cssProblems.push(
          `re-adding ${plan.adds[0].join(", ")} changed ${cssFile} (${cssBefore.length} -> ${cssAfter.length} bytes): adding is not idempotent`,
        );
    }
    return { detail: notes.length ? `output notes: ${[...new Set(notes)].slice(0, 3).join(" | ")}` : `${plan.adds.flat().length} item(s)` };
  });
  if (!added) {
    skipRest(sc, "css");
    return finish();
  }
  await step(sc, "css", async () => {
    if (cssProblems.length) throw new Error(`duplicated litt CSS in ${cssFile}:\n${cssProblems.join("\n")}`);
    return { detail: reg.kind === "litt" ? `${littDecls} --litt-* declarations, none repeated` : "no duplicate blocks" };
  });

  // files
  const after = snapshot(dir);
  const diff = diffSnapshots(before, after);
  const files = [...after.keys()].filter((k) => diff.added.includes(k) || diff.modified.includes(k));
  await step(sc, "files", async () => {
    const allowed = new Set([
      "package.json",
      "package-lock.json",
      cssFile,
      ...(plan.baseStyles ? ["app/layout.tsx", "index.html", "src/main.tsx"] : []),
    ]);
    const hostChanged = [...diff.modified, ...diff.removed].filter((f) => !allowed.has(f));
    const depsAfter = depsOf(dir);
    const changedDeps = Object.entries(depsBefore)
      .filter(([n, v]) => depsAfter[n] !== v)
      .map(([n, v]) => `${n}: ${v} -> ${depsAfter[n] ?? "(removed)"}`);
    const problems = [];
    if (hostChanged.length) problems.push(`existing host file(s) changed or removed: ${hostChanged.join(", ")}`);
    if (changedDeps.length) problems.push(`host dependencies changed: ${changedDeps.join(", ")}`);
    const written = diff.added.filter((f) => /\.(tsx?|css)$/.test(f));
    if (!diff.added.length && !plan.baseStyles) problems.push("the add exited 0 but wrote no new file");
    if (problems.length) throw new Error(problems.join("\n"));
    const newDeps = Object.keys(depsAfter).filter((n) => !(n in depsBefore));
    return {
      detail: `${written.length} files written (${diff.added.filter((f) => !/\.(tsx?|css)$/.test(f)).length} other); +deps ${newDeps.join(", ") || "none"}`,
    };
  });

  // page: the smoke page, from the exports the install wrote
  const fileObjs = files.map((rel) => ({ rel, content: fs.readFileSync(path.join(dir, rel), "utf8") }));
  let rendered = [];
  let pageBuilt = false;
  let smokeBlocked = false;
  const itemNames = plan.items.map((i) => i.replace(/^@litt\//, ""));
  await step(sc, "page", async () => {
    const built = buildSmokePage({ app, pageRel: cfg.page, items: itemNames, files: fileObjs, shadcnRegistry: reg.kind === "shadcn" });
    if (built.missing.length) {
      // Still type-check and build the host-only page, so the installed files are checked either way.
      fs.writeFileSync(path.join(dir, cfg.page), buildHostOnlyPage({ app }));
      pageBuilt = true;
      smokeBlocked = true;
    }
    if (built.missing.length)
      throw new Error(
        `the install did not provide: ${built.missing.map((m) => `${m.name} (item ${m.item})`).join(", ")}.\nExports found in new files: ${[...indexExports(fileObjs).keys()].join(", ") || "none"}`,
      );
    fs.writeFileSync(path.join(dir, cfg.page), built.source);
    rendered = built.rendered;
    pageBuilt = true;
    if (app === "next" && (plan.rsc || plan.id.startsWith("each:"))) {
      const index = indexExports(fileObjs);
      const recipeFiles = new Set();
      for (const item of built.rendered) for (const name of recipeNeeds(item, reg.kind)) if (index.has(name)) recipeFiles.add(index.get(name));
      if (recipeFiles.size) {
        ensureDir(path.join(dir, "app/rsc"));
        fs.writeFileSync(
          path.join(dir, "app/rsc/page.tsx"),
          buildRscPage({ pageRel: "app/rsc/page.tsx", moduleRels: [...recipeFiles].filter((f) => !f.startsWith("app/")) }),
        );
      }
    }
    return { detail: built.rendered.length ? `renders ${built.rendered.join(", ")}` : "host only (no recipe for these items)" };
  });

  // tsc
  await step(sc, "tsc", async () => {
    if (!pageBuilt) return { status: "skip", detail: "no smoke page" };
    const r = await ctx.gate.run("shared", () => npx(cfg.tsc, { cwd: dir, timeout: 300000, logFile }));
    if (r.code !== 0) throw new Error(`${cfg.tsc.join(" ")} exited ${r.code}\n${errorExcerpt(r.out, 20)}`);
  });

  // build (+ rsc attribution on next)
  const hasRsc = fs.existsSync(path.join(dir, "app/rsc/page.tsx"));
  let built = false;
  await step(sc, "build", async () => {
    let r = await ctx.gate.run("shared", () => buildApp(app, dir, logFile));
    if (r.code !== 0 && hasRsc && /React Server Component|only works in a Client Component|importing a component that needs/i.test(r.out)) {
      sc.rscFailure = errorExcerpt(r.out, 16);
      rmrf(path.join(dir, "app/rsc"));
      r = await ctx.gate.run("shared", () => buildApp(app, dir, logFile));
    }
    if (r.code !== 0) throw new Error(`${cfg.build.join(" ")} exited ${r.code}${r.timedOut ? " (timeout)" : ""}\n${errorExcerpt(r.out, 20)}`);
    built = true;
  });
  await step(sc, "rsc", async () => {
    if (app !== "next") return { status: "skip", detail: "next only" };
    if (!hasRsc) return { status: "skip", detail: "no component modules to import" };
    if (sc.rscFailure) throw new Error(`a component module cannot be imported from a Server Component (missing "use client"?):\n${sc.rscFailure}`);
    return { detail: "every component module imports from a Server Component" };
  });

  // smoke
  await step(sc, "smoke", async () => {
    if (!plan.browser) return { status: "skip", detail: "browser run is part of the `all` scenario" };
    if (!built || smokeBlocked) return { status: "skip", detail: "no build or no smoke page" };
    return ctx.gate.run("exclusive", async () => {
      const served = await serveBuild(app, dir, logFile);
      try {
        const browser = await ctx.getBrowser();
        if (plan.baseStyles) {
          // Opt-in: the host is SUPPOSED to change here. Show that it does, and that nothing logs an error.
          const res = await measureBaseStyles(browser, served.url, tpl.baseline);
          if (res.errors.length) throw new Error(`console errors with base-styles installed: ${res.errors.slice(0, 3).join(" | ")}`);
          const keys = [
            ...new Set(
              res.diffs.map((d) =>
                d
                  .replace(/^(light|dark) /, "")
                  .split(" ")
                  .slice(0, 2)
                  .join(" "),
              ),
            ),
          ];
          const fontMoved = res.diffs.some((d) => /^(light|dark) (body|html) font-family/.test(d));
          if (!fontMoved) return { status: "warn", detail: "base-styles installed but body/html font-family did not change" };
          return { detail: `opt-in changes the host as documented (${res.diffs.length} computed values, e.g. ${keys.slice(0, 6).join(", ")})` };
        }
        const res = await runSmoke({
          browser,
          url: served.url,
          shotsDir: path.join(opts.shots, app),
          tag: plan.id.replace(/[^\w.-]/g, "_"),
          rendered,
          litt: reg.kind === "litt",
          accent: ctx.accent,
          baseline: tpl.baseline,
        });
        const bad = res.checks.filter((c) => !c.ok);
        if (bad.length) throw new Error(bad.map((c) => `${c.name}: ${c.detail}`).join("\n"));
        return {
          detail: `${res.checks.length} checks passed (${res.checks
            .map((c) => c.name.replace(/^\w+: /, ""))
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(", ")})`,
        };
      } finally {
        await served.stop();
      }
    });
  });

  return finish();

  function finish() {
    for (const s of STEPS) if (!sc.steps.has(s)) sc.set(s, "skip", 0);
    sc.dir = dir;
    if (sc.failed.length === 0 && !opts.keep) rmrf(dir);
    else L(`kept ${dir}`);
    return sc;
  }
}

/** Export names a recipe needs, for choosing which modules the RSC page imports. */
const recipeNeeds = (item, kind) => recipeNeedsFor(item, kind === "shadcn");

/* ------------------------------------------------------------------ report */

function tableMarkdown(results) {
  const mark = (s) => (!s ? "-" : s.status === "ok" ? "ok" : s.status === "warn" ? "warn" : s.status === "fail" ? "FAIL" : "-");
  const rows = [
    ["app", "scenario", ...STEPS],
    ["---", "---", ...STEPS.map(() => "---")],
  ];
  for (const app of [...new Set(results.map((r) => r.app))]) {
    const mine = results.filter((r) => r.app === app);
    const each = mine.filter((r) => r.id.startsWith("each:"));
    const eachClean = each.length > 0 && each.every((r) => [...r.steps.values()].every((st) => st.status !== "fail"));
    let collapsed = false;
    for (const r of mine) {
      if (eachClean && r.id.startsWith("each:")) {
        if (!collapsed) {
          const merged = STEPS.map((st) => (each.some((e) => e.steps.get(st)?.status === "ok") ? "ok" : "-"));
          rows.push([app, `each:* (${each.length} items, all pass)`, ...merged]);
          collapsed = true;
        }
        continue;
      }
      rows.push([app, r.id, ...STEPS.map((st) => mark(r.steps.get(st)))]);
    }
  }
  return rows.map((r) => "| " + r.join(" | ") + " |").join("\n");
}

function tableText(results) {
  const mark = (s) => (!s ? "-" : s.status === "ok" ? "ok" : s.status === "warn" ? "warn" : s.status === "fail" ? "FAIL" : "-");
  const head = ["app", "scenario", ...STEPS];
  const rows = results.map((r) => [r.app, r.id, ...STEPS.map((s) => mark(r.steps.get(s)))]);
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const fmt = (r) => r.map((c, i) => c.padEnd(widths[i])).join("  ");
  return [fmt(head), fmt(widths.map((w) => "-".repeat(w))), ...rows.map(fmt)].join("\n");
}

function failureList(results) {
  return results.flatMap((r) => r.failed.map(([name, s]) => ({ app: r.app, scenario: r.id, step: name, detail: s.detail })));
}

function writeReport(file, { results, reg, opts, versions, totalMs, shots, setupError }) {
  const failures = failureList(results);
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const lines = [];
  const verdict = setupError ? "SETUP FAILED" : failures.length ? `FAIL (${failures.length} failing step${failures.length > 1 ? "s" : ""})` : "PASS";
  lines.push(`## ${stamp} - ${verdict}`);
  lines.push("");
  lines.push(
    `Registry: ${reg.kind === "shadcn" ? "shadcn default registry (harness self-test)" : `${opts.registrySource} (${reg.count} items, fingerprint ${reg.fingerprint}: ${reg.all.join(", ")})`}`,
  );
  lines.push(`Components tested: ${reg.components.join(", ")}. Scenarios: ${[...opts.scenarioSet].join(", ")}. Runtime ${sec(totalMs)}.`);
  lines.push(
    `Host init base: ${opts.base}. Hosts: ${Object.entries(versions)
      .map(([a, v]) => `${a}: ${v.summary}`)
      .join(" | ")}`,
  );
  lines.push(`Screenshots: ${shots}`);
  lines.push("");
  if (setupError)
    lines.push(
      "",
      "Setup error (the harness or the environment, before any item was installed):",
      "```",
      ...setupError.split("\n").slice(0, 16),
      "```",
    );
  lines.push("");
  if (results.length) lines.push(tableMarkdown(results));
  lines.push("");
  if (failures.length) {
    lines.push("### Failures");
    for (const f of failures) {
      lines.push("");
      lines.push(`- **${f.app} / ${f.scenario} / ${f.step}**`);
      lines.push("  ```");
      lines.push(
        ...f.detail
          .split("\n")
          .slice(0, 16)
          .map((l) => "  " + l),
      );
      lines.push("  ```");
      lines.push("  Diagnosis: (add)");
    }
    lines.push("");
  }
  const section = lines.join("\n");
  const title = "# litt registry install test: findings, newest first\n\n";
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const body = existing.startsWith("# ") ? existing.replace(/^# [^\n]*\n\n?/, "") : existing;
  fs.writeFileSync(file, title + section + "\n\n" + body);
}

/* ------------------------------------------------------------------ main */

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(
      fs
        .readFileSync(fileURLToPath(import.meta.url), "utf8")
        .split("*/")[0]
        .replace(/^#!.*\n/, "")
        .replace(/^\/\*\*\n/, "")
        .replace(/^ \* ?/gm, ""),
    );
    return 0;
  }
  const t0 = Date.now();
  const apps = opts.app === "both" ? ["vite", "next"] : [opts.app];
  const runDir = path.join(opts.work, `run-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  ensureDir(path.join(runDir, "logs"));
  ensureDir(opts.shots);
  // Test a snapshot, so a generator run during the test cannot change the registry halfway through.
  opts.registrySource = opts.registry;
  const remote = /^https?:\/\//.test(opts.registry);
  if (opts.registry !== "shadcn" && !remote && fs.existsSync(path.join(opts.registry, "registry.json"))) {
    const copy = path.join(runDir, "registry");
    fs.cpSync(opts.registry, copy, { recursive: true });
    opts.registry = copy;
  }
  const reg = await describeRegistry(opts, knownRecipeNames());

  console.log(`litt registry install test`);
  console.log(
    `  registry   ${reg.kind === "shadcn" ? "shadcn default (self-test)" : `${opts.registrySource} (${reg.count} items; fingerprint ${reg.fingerprint}${remote ? ", deployed" : ", snapshot taken"})`}`,
  );
  console.log(`  components ${reg.components.join(", ") || "(none)"}${reg.baseStyles ? `   base-styles item: ${reg.baseStyles}` : ""}`);
  console.log(`  work dir   ${runDir}`);
  console.log(`  shadcn     ${PINS.shadcn}   hosts: ${apps.join(", ")} (init base: ${opts.base})   scenarios: ${[...opts.scenarioSet].join(", ")}\n`);

  let regServer = null;
  let registryPort = 0;
  let requests = [];
  if (reg.kind === "litt" && !remote) {
    regServer = await startRegistryServer(reg.dir, opts.prodOrigin);
    registryPort = regServer.port;
    requests = regServer.requests;
  }
  let browser = null;
  const ctx = {
    opts,
    reg,
    runDir,
    registryBase: remote ? opts.registry : `http://localhost:${registryPort}/r`,
    templates: {},
    gate: new Gate(),
    accent: reg.kind === "litt" ? readExpectedAccent(tokensCss) : null,
    getBrowser: async () => (browser ??= await launchChromium()),
    notFound: () => {
      const bad = requests.filter((r) => r.status === 404).map((r) => r.path);
      return bad.length ? `\n  registry server 404s: ${[...new Set(bad)].join(", ")}` : "";
    },
  };

  const results = [];
  let exit = 0;
  let setupError = null;
  try {
    if (!reg.components.length) throw new Error(`the registry has no component items to install (items: ${reg.all.join(", ") || "none"})`);
    // Templates first (sequential: they share the npm cache and one browser).
    for (const app of apps) ctx.templates[app] = await ensureTemplate(app, ctx);

    // Per app, a small pool. The browser scenario goes first so the important result arrives early.
    const priority = (id) => ({ all: 0, bare: 1, ns: 2, "base-styles": 3, seq: 4 })[id] ?? 5;
    const chain = async (app) => {
      const plans = planScenarios(app, reg, opts);
      const scs = plans.map((p) => new Scenario(app, p.id));
      results.push(...scs);
      const queue = plans.map((p, i) => i).sort((a, b) => priority(plans[a].id) - priority(plans[b].id));
      const worker = async () => {
        for (let i = queue.shift(); i !== undefined; i = queue.shift()) {
          const [plan, sc] = [plans[i], scs[i]];
          try {
            await runScenario(app, sc, plan, ctx);
          } catch (e) {
            sc.set("add", sc.steps.get("add")?.status === "ok" ? "ok" : "fail", 0, String(e.stack ?? e));
            console.log(`[${app} ${plan.id}] harness error: ${e.stack ?? e}`);
            for (const st of STEPS) if (!sc.steps.has(st)) sc.set(st, "skip", 0);
          }
        }
      };
      await Promise.all(Array.from({ length: opts.jobs }, worker));
    };
    if (opts.serial) for (const app of apps) await chain(app);
    else await Promise.all(apps.map(chain));
  } catch (e) {
    console.error(`\nharness setup failed: ${e.message}`);
    setupError = e.message;
    exit = 2;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (regServer) regServer.server.close();
    killAll();
  }

  results.sort((a, b) => apps.indexOf(a.app) - apps.indexOf(b.app));
  const failures = failureList(results);
  console.log(`\n${tableText(results)}\n`);
  if (failures.length) {
    console.log(`${failures.length} failing step(s):`);
    for (const f of failures) console.log(`  - ${f.app} / ${f.scenario} / ${f.step}: ${f.detail.split("\n")[0].slice(0, 160)}`);
  } else if (exit === 0) {
    console.log("all steps passed");
  }
  console.log(`\nruntime ${sec(Date.now() - t0)}   logs ${path.join(runDir, "logs")}   screenshots ${opts.shots}`);

  if (opts.report) {
    const versions = Object.fromEntries(Object.entries(ctx.templates).map(([a, t]) => [a, t.versions]));
    writeReport(opts.report, { results, reg, opts, versions, runDir, totalMs: Date.now() - t0, shots: opts.shots, setupError });
    console.log(`report ${opts.report}`);
  }
  const allPassed = exit === 0 && failures.length === 0;
  if (allPassed && !opts.keep) rmrf(runDir);
  return allPassed ? 0 : exit || 1;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    killAll();
    console.error(e.message ?? e);
    process.exit(2);
  },
);
