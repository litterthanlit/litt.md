/**
 * Helper for test-registry.mjs: the smoke page that is written into a host app, and the
 * Chromium checks that run against its production build.
 *
 * Nothing here knows how a registry lays out files. The page imports each litt component
 * from wherever the install put it, found by export name in the files `shadcn add` wrote.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { parseCss } from "./test-registry.css.mjs";

/* ------------------------------------------------------------------ host probes */

/** The same markup goes into the baseline page and the page after litt is installed. */
const HOST_PROBE = `
      <section data-testid="host-probe" className="grid gap-3">
        <h1>Host heading one</h1>
        <h2>Host heading two</h2>
        <p data-probe="paragraph">Host paragraph</p>
        <div className="flex flex-wrap items-center gap-3">
          <HostButton data-probe="host-button">Host button</HostButton>
          <HostButton variant="outline" data-probe="host-button-outline">Outline</HostButton>
          <HostButton variant="secondary" data-probe="host-button-secondary">Secondary</HostButton>
          <button type="button" data-probe="native-button">Native button</button>
          <a href="#probe" data-probe="link">Link</a>
          <input data-probe="input" defaultValue="Input" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div data-probe="u-sm" className="rounded-md bg-accent p-2 text-sm font-medium text-foreground shadow-sm">sm</div>
          <div data-probe="u-base" className="rounded-lg border bg-card p-2 text-base text-card-foreground">base</div>
          <div data-probe="u-lg" className="rounded-xl bg-primary p-2 text-lg font-semibold text-primary-foreground shadow-md">lg</div>
          <div data-probe="u-full" className="rounded-full bg-muted p-2 text-xs font-bold text-muted-foreground">full</div>
          <div data-probe="u-sans" className="font-sans">sans</div>
          <div data-probe="u-mono" className="font-mono">mono</div>
        </div>
      </section>`;

/** A page with only the host's own components: measured once per template as the baseline. */
export function buildHostOnlyPage({ app }) {
  return `${app === "next" ? '"use client";\n' : ""}import { Button as HostButton } from "@/components/ui/button";

export default function Smoke() {
  return (
    <main className="grid gap-8 p-6" data-testid="smoke">${HOST_PROBE}
    </main>
  );
}
`;
}

/* ------------------------------------------------------------------ recipes */

/**
 * One recipe per component item, keyed by the item name (the gallery's file stem).
 *   needs   exports the install must provide; a missing one is a failure, not a skip
 *   types   type-only exports to import
 *   wrap    a provider component that must wrap the page
 *   state   lines for the top of the component
 *   top     module-level lines
 *   jsx     what to render. `@Btn` is litt's Button when the install wrote one, else a plain <button>,
 *           so a component's recipe never depends on the button item being installed
 * Props come from the gallery's pages and docs.json; the components are the same files.
 */
const RECIPES = {
  button: {
    needs: ["Button"],
    jsx: `<div className="flex flex-wrap items-center gap-3" data-testid="litt-buttons">
          <Button variant="primary" data-testid="litt-primary">Primary</Button>
          <Button data-testid="litt-secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>`,
  },
  kbd: { needs: ["Kbd"], jsx: `<Kbd>⌘K</Kbd>` },
  icons: { needs: ["SearchIcon", "SettingsIcon"], jsx: `<div className="flex gap-3"><SearchIcon /><SettingsIcon /></div>` },
  tooltip: {
    needs: ["Tooltip", "TooltipProvider"],
    wrap: "TooltipProvider",
    jsx: `<Tooltip content="Litt tooltip"><@Btn type="button" data-testid="tooltip-trigger">Hover me</@Btn></Tooltip>`,
  },
  tabs: {
    needs: ["Tabs", "TabsList", "TabsTrigger", "TabsPanels", "TabsPanel"],
    jsx: `<Tabs defaultValue="one" className="w-full max-w-md">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsPanels>
            <TabsPanel value="one">Panel one</TabsPanel>
            <TabsPanel value="two">Panel two</TabsPanel>
          </TabsPanels>
        </Tabs>`,
  },
  menu: {
    needs: ["Menu", "MenuItem", "MenuSeparator"],
    jsx: `<Menu trigger={<@Btn type="button" data-testid="menu-trigger">Actions</@Btn>} label="Project actions">
          <MenuItem>Duplicate</MenuItem>
          <MenuItem>Rename</MenuItem>
          <MenuSeparator />
          <MenuItem destructive>Delete</MenuItem>
        </Menu>`,
  },
  "command-menu": {
    needs: ["CommandMenu"],
    state: [`const [cmdOpen, setCmdOpen] = useState(false);`],
    top: [
      `const cmdGroups = [{ id: "pages", heading: "Pages", items: [{ id: "home", label: "Home page" }, { id: "settings", label: "Settings page" }] }];`,
    ],
    jsx: `<>
          <@Btn type="button" data-testid="cmd-trigger" onClick={() => setCmdOpen(true)}>Search</@Btn>
          <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} groups={cmdGroups} onSelect={() => setCmdOpen(false)} />
        </>`,
  },
  dialog: {
    needs: ["Dialog", "DialogTrigger", "DialogContent"],
    jsx: `<Dialog>
          <DialogTrigger asChild><@Btn type="button" data-testid="dialog-trigger">Open dialog</@Btn></DialogTrigger>
          <DialogContent title="Litt dialog" description="Dialog description">
            <p>Dialog body</p>
          </DialogContent>
        </Dialog>`,
  },
  "dialog-fields": {
    needs: ["TextField", "SegmentedRadio"],
    state: [`const [vis, setVis] = useState("a");`],
    jsx: `<div className="grid w-full max-w-sm gap-4">
          <TextField label="Project name" defaultValue="litt.design" />
          <SegmentedRadio legend="Visibility" name="vis" value={vis} onChange={setVis} options={[{ value: "a", label: "Public" }, { value: "b", label: "Private" }]} />
        </div>`,
  },
  toast: {
    needs: ["Toaster", "toast"],
    wrap: "Toaster",
    jsx: `<@Btn type="button" data-testid="toast-trigger" onClick={() => toast({ title: "Litt toast", description: "Saved from the smoke page" })}>Show toast</@Btn>`,
  },
  "list-cover": { needs: ["ProjectCover"], jsx: `<div className="relative h-28 w-48 overflow-hidden"><ProjectCover name={"@cover0"} /></div>` },
  list: {
    needs: ["ProjectList"],
    types: ["Project"],
    top: [
      `const projects: Project[] = [`,
      `  { id: "p1", name: "Northwind site", client: "Northwind", deploy: "Deployed 2 days ago", status: "live", updated: "2026-10-10", description: "The studio site.", tags: ["Site"], cover: "@cover0" },`,
      `  { id: "p2", name: "Atlas portfolio", client: "Atlas", deploy: "No deploy yet", status: "review", updated: "2026-10-09", description: "Wordmark and grid.", tags: ["Identity"], cover: "@cover1" },`,
      `];`,
    ],
    jsx: `<div className="w-full max-w-xl"><ProjectList projects={projects} /></div>`,
  },
};

/** Recipes for shadcn's own registry, used by `--registry shadcn` to prove the harness itself. */
const SHADCN_RECIPES = {
  badge: { needs: ["Badge"], jsx: `<Badge data-testid="shadcn-badge">Badge</Badge>` },
  input: { needs: ["Input"], jsx: `<Input data-testid="shadcn-input" placeholder="Input" />` },
  card: {
    needs: ["Card", "CardHeader", "CardTitle"],
    jsx: `<div className="w-64"><Card data-testid="shadcn-card"><CardHeader><CardTitle>Card</CardTitle></CardHeader></Card></div>`,
  },
};

export const knownRecipeNames = () => Object.keys(RECIPES);
/** Export names an item's recipe renders: the modules a user would import from a Server Component. */
export const recipeNeedsFor = (item, shadcnRegistry) => (shadcnRegistry ? SHADCN_RECIPES : RECIPES)[item]?.needs ?? [];

/**
 * Index the exports of the files an install wrote.
 * files: [{rel, content}] -> Map<exportName, rel>
 */
export function indexExports(files) {
  const index = new Map();
  const add = (name, rel) => {
    if (!index.has(name)) index.set(name, rel);
  };
  for (const { rel, content } of files) {
    if (!/\.(tsx?|mts)$/.test(rel)) continue;
    for (const m of content.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g))
      add(m[1], rel);
    for (const m of content.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)/g)) {
      for (const part of m[1].split(",")) {
        const name = part
          .trim()
          .split(/\s+as\s+/)
          .pop()
          .trim();
        if (/^[A-Za-z_$][\w$]*$/.test(name)) add(name, rel);
      }
    }
  }
  return index;
}

const posix = (p) => p.split(path.sep).join("/");
function importPath(fromRel, toRel) {
  let r = posix(path.relative(path.dirname(fromRel), toRel)).replace(/\.(tsx?|mts)$/, "");
  if (!r.startsWith(".")) r = "./" + r;
  return r;
}

/**
 * The smoke page: the host probes, then every installed litt component.
 * items: item names installed this scenario. files: the files the install wrote.
 * Returns {source, rendered: item names drawn, missing: [{item, name}]}.
 */
export function buildSmokePage({ app, pageRel, items, files, shadcnRegistry = false }) {
  const index = indexExports(files);
  const recipes = shadcnRegistry ? SHADCN_RECIPES : RECIPES;
  const rendered = [];
  const missing = [];
  const imports = new Map(); // rel -> {values:Set, types:Set}
  const need = (rel, name, kind) => {
    if (!imports.has(rel)) imports.set(rel, { values: new Set(), types: new Set() });
    imports.get(rel)[kind].add(name);
  };

  // Cover names are read from the installed list-cover file, so the page follows the component.
  const coverFile = files.find((f) => /export\s+type\s+CoverName\s*=/.test(f.content));
  const covers = coverFile
    ? [...(/export\s+type\s+CoverName\s*=([^;]+);/.exec(coverFile.content)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];
  const cover = (n) => covers[n] ?? covers[0] ?? "system";

  const btn = index.has("Button") && !shadcnRegistry ? "Button" : "button";
  const sections = [];
  const top = [];
  const state = [];
  const wraps = [];
  for (const item of items) {
    const r = recipes[item];
    if (!r) continue;
    const absent = r.needs.filter((n) => !index.has(n));
    if (absent.length) {
      for (const name of absent) missing.push({ item, name });
      continue;
    }
    for (const n of r.needs) need(index.get(n), n, "values");
    for (const t of r.types ?? []) {
      if (index.has(t)) need(index.get(t), t, "types");
      else missing.push({ item, name: t });
    }
    if (r.wrap) wraps.push(r.wrap);
    for (const l of r.state ?? []) state.push(l);
    for (const l of r.top ?? []) top.push(l.replaceAll("@cover0", cover(0)).replaceAll("@cover1", cover(1)));
    sections.push({ item, jsx: r.jsx.replaceAll("@cover0", cover(0)).replaceAll("@cover1", cover(1)) });
    rendered.push(item);
  }

  if (btn === "Button" && sections.some((x) => x.jsx.includes("@Btn"))) need(index.get("Button"), "Button", "values");
  for (const x of sections) x.jsx = x.jsx.replaceAll("@Btn", btn);
  const lines = [];
  if (app === "next") lines.push('"use client";');
  if (state.length) lines.push('import { useState } from "react";');
  lines.push('import { Button as HostButton } from "@/components/ui/button";');
  for (const [rel, { values, types }] of imports) {
    if (values.size) lines.push(`import { ${[...values].join(", ")} } from "${importPath(pageRel, rel)}";`);
    if (types.size) lines.push(`import type { ${[...types].join(", ")} } from "${importPath(pageRel, rel)}";`);
  }
  lines.push("");
  lines.push(...top, top.length ? "" : null);
  lines.push("export default function Smoke() {");
  for (const s of state) lines.push("  " + s);
  const body = [
    `<main className="grid gap-8 p-6" data-testid="smoke">${HOST_PROBE}`,
    `      <section data-testid="litt-section" className="grid gap-6">`,
    ...sections.map((s) => `        <div data-item="${s.item}" className="flex flex-wrap items-center gap-3">\n        ${s.jsx}\n        </div>`),
    `      </section>`,
    `    </main>`,
  ].join("\n");
  const wrapped = [...new Set(wraps)].reduceRight((inner, w) => `<${w}>\n${inner}\n    </${w}>`, body);
  lines.push("  return (", "    " + wrapped, "  );", "}", "");
  return { source: lines.filter((l) => l !== null).join("\n"), rendered, missing };
}

/** A Server Component page that imports every installed module, so a missing "use client" fails the build. */
export function buildRscPage({ pageRel, moduleRels }) {
  const names = moduleRels.map((_, i) => `m${i}`);
  return `// Server Component: no "use client". Importing a hook-using module here fails the build unless it is a client module.
${moduleRels.map((rel, i) => `import * as ${names[i]} from "${importPath(pageRel, rel)}";`).join("\n")}

const modules: Record<string, unknown>[] = [${names.join(", ")}];

export default function Page() {
  return <pre>{modules.map((m) => Object.keys(m).length).join(",")}</pre>;
}
`;
}

/* ------------------------------------------------------------------ expected colors */

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

/** litt's accent in light and dark, read from the `--accent` declarations in tokens.css. Returns {light:[r,g,b], dark:[r,g,b]}. */
export function readExpectedAccent(tokensCssPath) {
  const nodes = parseCss(fs.readFileSync(tokensCssPath, "utf8"));
  const pick = (test) => {
    const block = nodes.find((n) => n.kind === "block" && test(n.prelude) && n.children.some((c) => c.kind === "decl" && c.prop === "--accent"));
    const hex = block?.children.find((c) => c.kind === "decl" && c.prop === "--accent")?.value;
    if (!hex || !/^#[0-9a-f]{3,6}\b/i.test(hex)) throw new Error(`${tokensCssPath}: cannot read --accent for ${test}`);
    return hexToRgb(hex.match(/^#[0-9a-f]{3,6}/i)[0]);
  };
  return {
    light: pick((p) => p.includes(":root") && p.includes('[data-theme="light"]')),
    dark: pick((p) => p === '[data-theme="dark"]'),
  };
}

/* ------------------------------------------------------------------ browser */

let playwrightCache;
export function loadPlaywright() {
  if (playwrightCache) return playwrightCache;
  const require = createRequire(import.meta.url);
  const tries = [process.env.PLAYWRIGHT_MODULE, "playwright", "/opt/node22/lib/node_modules/playwright"].filter(Boolean);
  for (const t of tries) {
    try {
      playwrightCache = require(t);
      return playwrightCache;
    } catch {
      /* try the next */
    }
  }
  throw new Error(`playwright not found (tried ${tries.join(", ")}); set PLAYWRIGHT_MODULE to its path`);
}

export async function launchChromium() {
  const { chromium } = loadPlaywright();
  try {
    return await chromium.launch();
  } catch (e) {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
    const dirs = fs.existsSync(base)
      ? fs
          .readdirSync(base)
          .filter((d) => /^chromium-\d+$/.test(d))
          .sort()
          .reverse()
      : [];
    for (const d of dirs) {
      const exe = path.join(base, d, "chrome-linux", "chrome");
      if (fs.existsSync(exe)) return chromium.launch({ executablePath: exe });
    }
    throw e;
  }
}

const MEASURED = [
  "color",
  "background-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "box-shadow",
  "border-top-color",
  "border-top-width",
  "border-top-style",
  "padding-top",
  "padding-left",
  "height",
  "outline-style",
  "outline-width",
  "outline-color",
  "text-decoration-line",
];

/** Runs in the page: computed styles of every [data-probe], body, html, and every custom property the stylesheets declare. */
function measureInPage(props) {
  const pick = (el, list = props) => {
    const cs = getComputedStyle(el);
    return Object.fromEntries(list.map((p) => [p, cs.getPropertyValue(p)]));
  };
  const noHeight = props.filter((p) => p !== "height"); // the page grows when litt components are added
  const out = {};
  for (const el of document.querySelectorAll("[data-probe]")) out[el.getAttribute("data-probe")] = pick(el);
  out["h1"] = pick(document.querySelector("[data-testid=host-probe] h1"));
  out["h2"] = pick(document.querySelector("[data-testid=host-probe] h2"));
  out["body"] = pick(document.body, noHeight);
  out["html"] = pick(document.documentElement, noHeight);
  const names = new Set();
  const walk = (rules) => {
    for (const r of rules) {
      if (r.style) for (const p of r.style) if (p.startsWith("--")) names.add(p);
      if (r.cssRules) walk(r.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules);
    } catch {
      /* cross-origin sheet */
    }
  }
  const root = getComputedStyle(document.documentElement);
  out["vars"] = Object.fromEntries(
    [...names]
      .filter((n) => !n.startsWith("--tw-"))
      .sort()
      .map((n) => [n, root.getPropertyValue(n).trim()]),
  );
  return out;
}

async function measureTheme(page, theme) {
  await page.evaluate((t) => document.documentElement.classList.toggle("dark", t === "dark"), theme);
  // Hosts transition colors (shadcn's Button does), so wait until nothing is mid-flight.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
  await page.waitForTimeout(250);
  const plain = await page.evaluate(measureInPage, MEASURED);
  // Keyboard modality first, so the programmatic focus shows :focus-visible like a Tab would.
  await page.keyboard.press("Tab");
  await page.focus("[data-probe=native-button]");
  const focus = await page.evaluate(
    (props) => {
      const cs = getComputedStyle(document.querySelector("[data-probe=native-button]"));
      return Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
    },
    ["outline-style", "outline-width", "outline-color", "outline-offset", "border-top-left-radius"],
  );
  await page.evaluate(() => document.activeElement?.blur());
  return { ...plain, "native-button:focus": focus };
}

const COLOR_TO_RGB = `(value) => {
  const c = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  c.clearRect(0, 0, 1, 1); c.fillStyle = "black"; c.fillStyle = value; c.fillRect(0, 0, 1, 1);
  return Array.from(c.getImageData(0, 0, 1, 1).data);
}`;

const near = (a, b, tol = 1) => a.length >= 3 && b.length >= 3 && [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) <= tol);

/** Open the page, wait for it to settle, and record console errors for the whole visit. */
async function openPage(browser, url, theme) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 }, colorScheme: "light", deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${String(e.message || e).split("\n")[0]}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (/favicon/.test(m.location()?.url ?? "") || /favicon/.test(m.text())) return;
    errors.push(`console.error: ${m.text().split("\n")[0]}${m.location()?.url ? ` (${m.location().url})` : ""}`);
  });
  page.on("requestfailed", (r) => {
    if (!/favicon/.test(r.url())) errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ""}`);
  });
  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector("[data-testid=smoke]", { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  if (theme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(400);
  return { context, page, errors };
}

/** Measure the host probes only, in light and dark. Used for the baseline. */
export async function measureHost(browser, url) {
  const { context, page, errors } = await openPage(browser, url, "light");
  try {
    const light = await measureTheme(page, "light");
    const dark = await measureTheme(page, "dark");
    return { light, dark, errors };
  } finally {
    await context.close();
  }
}

/** Differences between a baseline measurement and a later one, for one theme. Variables absent from the baseline are new and allowed. */
export function compareTheme(baselineTheme, nowTheme) {
  const diffs = [];
  for (const [key, props] of Object.entries(baselineTheme)) {
    const cur = nowTheme[key];
    if (!cur) {
      diffs.push(`${key}: missing after install`);
      continue;
    }
    for (const [prop, value] of Object.entries(props))
      if (cur[prop] !== value) diffs.push(`${key} ${prop}: ${JSON.stringify(value)} -> ${JSON.stringify(cur[prop])}`);
  }
  return diffs;
}

/** Group compareTheme lines by probe: "host-button: border-top-left-radius 10px -> 0px (+2) | vars: --accent oklch(...) -> red". */
export function summarizeDiffs(diffs, max = 8) {
  const groups = new Map();
  for (const d of diffs) {
    const m = /^(\S+) (\S+): "?(.*?)"? -> "?(.*?)"?$/.exec(d);
    const [key, text] = m ? [m[1], `${m[2]} ${m[3]} -> ${m[4]}`] : ["other", d];
    groups.set(key, [...(groups.get(key) ?? []), text]);
  }
  // Custom properties first: a leaked variable is the cause, the restyled elements are the effect.
  const ordered = [...groups].sort(([a], [b]) => (a === "vars" ? -1 : b === "vars" ? 1 : 0));
  return ordered
    .slice(0, max)
    .map(([key, list]) => `${key}: ${list.slice(0, 3).join(", ")}${list.length > 3 ? ` (+${list.length - 3} more)` : ""}`)
    .join(" | ");
}

/**
 * What `base-styles` (the opt-in item) changes in the host: the diff of the host probes against the
 * baseline. Returns {diffs, errors}. Used to show the opt-in does what it says while `litt` alone does not.
 */
export async function measureBaseStyles(browser, url, baseline) {
  const now = await measureHost(browser, url);
  const tag = (theme) => compareTheme(baseline[theme], now[theme]).map((d) => `${theme} ${d}`);
  return { diffs: [...tag("light"), ...tag("dark")], errors: now.errors };
}

/**
 * The full smoke run against a served production build.
 * opts: {browser, url, shotsDir, tag, rendered (item names), litt (bool), accent ({light,dark}), baseline}
 * Returns {checks: [{name, ok, detail}], errors: string[]}.
 */
export async function runSmoke({ browser, url, shotsDir, tag, rendered, litt, accent, baseline }) {
  fs.mkdirSync(shotsDir, { recursive: true });
  const checks = [];
  const record = (name, ok, detail = "") => checks.push({ name, ok, detail });
  const has = (item) => rendered.includes(item);
  const allErrors = [];

  for (const theme of ["light", "dark"]) {
    const { context, page, errors } = await openPage(browser, url, theme);
    const t = (name) => `${theme}: ${name}`;
    const attempt = async (name, fn) => {
      try {
        // A failed step may have left a menu or dialog open; start each one from a clean page.
        if (await page.evaluate(() => document.querySelectorAll("[role=menu],[role=dialog]").length)) {
          await page.keyboard.press("Escape");
          await page.waitForTimeout(500);
        }
        const detail = await fn();
        record(t(name), true, detail ?? "");
      } catch (e) {
        // Playwright puts the useful part (what intercepts the click) after the first line.
        const text = String(e.message || e).replace(/\x1b\[[0-9;]*m/g, "");
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const why = lines.find((l) => /intercepts pointer events|not visible|not enabled|detached/.test(l));
        record(t(name), false, [lines[0], why].filter(Boolean).join(" / "));
      }
    };
    try {
      await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-page.png`), fullPage: true });

      // The host first: nothing litt installed may change it.
      await attempt("host unchanged", async () => {
        const now = await measureTheme(page, theme);
        const diffs = compareTheme(baseline[theme], now);
        if (diffs.length) throw new Error(`${diffs.length} host style(s) changed. ${summarizeDiffs(diffs)}`);
        return `${Object.keys(baseline[theme]).length} probes, ${Object.keys(baseline[theme].vars).length} root variables`;
      });
      if (theme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"));

      if (litt) {
        await attempt("litt tokens defined", async () => {
          const v = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--litt-accent").trim());
          if (!v) throw new Error("--litt-accent is empty on <html>");
          return `--litt-accent = ${v}`;
        });
      }

      if (litt && has("button")) {
        await attempt("primary button = litt accent", async () => {
          const got = await page.evaluate(
            `(${COLOR_TO_RGB})(getComputedStyle(document.querySelector("[data-testid=litt-primary]")).backgroundColor)`,
          );
          const want = accent[theme];
          if (!near(got, want)) throw new Error(`background is rgb(${got.slice(0, 3)}), litt accent is rgb(${want})`);
          return `rgb(${want})`;
        });
      }

      if (has("tooltip")) {
        await attempt("tooltip opens", async () => {
          await page.hover("[data-testid=tooltip-trigger]");
          await page.getByText("Litt tooltip").last().waitFor({ state: "visible", timeout: 5000 });
          await page.mouse.move(5, 5);
        });
      }
      if (has("tabs")) {
        await attempt("tabs switch", async () => {
          await page.getByRole("tab", { name: "Two" }).click();
          await page.getByText("Panel two").waitFor({ state: "visible", timeout: 4000 });
        });
      }
      if (has("list")) {
        await attempt("project list rows", async () => {
          await page.getByText("Northwind site").first().waitFor({ state: "visible", timeout: 4000 });
          const n = await page.locator("ul[aria-label=Projects] li").count();
          if (n < 2) throw new Error(`expected 2 rows, found ${n}`);
          return `${n} rows`;
        });
      }
      if (has("menu")) {
        await attempt("menu opens with glass panel", async () => {
          await page.click("[data-testid=menu-trigger]");
          const menu = page.getByRole("menu");
          await menu.waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(700);
          const info = await menu.evaluate((el) => {
            const host = el.closest(".litt-glass") ?? el.querySelector(".litt-glass");
            const before = host ? getComputedStyle(host, "::before") : null;
            return {
              glass: !!host,
              blur: before ? before.backdropFilter || before.webkitBackdropFilter || "" : "",
              content: before ? before.content : "",
            };
          });
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-menu.png`) });
          await page.keyboard.press("Escape");
          await menu.waitFor({ state: "hidden", timeout: 4000 }).catch(() => {});
          if (!info.glass) throw new Error('the menu panel has no ".litt-glass" class');
          if (!info.blur || info.blur === "none")
            throw new Error(`.litt-glass has no backdrop-filter (the material CSS is missing): ${JSON.stringify(info)}`);
          return `backdrop-filter: ${info.blur}`;
        });
      }
      if (has("dialog")) {
        await attempt("dialog opens", async () => {
          await page.click("[data-testid=dialog-trigger]");
          const dlg = page.getByRole("dialog");
          await dlg.waitFor({ state: "visible", timeout: 5000 });
          await page.getByText("Dialog body").waitFor({ state: "visible", timeout: 3000 });
          await page.waitForTimeout(600);
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-dialog.png`) });
          await page.keyboard.press("Escape");
          await dlg.waitFor({ state: "hidden", timeout: 4000 }).catch(() => {});
        });
      }
      if (has("command-menu")) {
        await attempt("command menu opens", async () => {
          await page.click("[data-testid=cmd-trigger]");
          await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
          await page.getByText("Settings page").first().waitFor({ state: "visible", timeout: 3000 });
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-command.png`) });
          await page.keyboard.press("Escape");
          await page
            .getByRole("dialog")
            .waitFor({ state: "hidden", timeout: 4000 })
            .catch(() => {});
        });
      }
      if (has("toast")) {
        await attempt("toast shows", async () => {
          await page.click("[data-testid=toast-trigger]");
          await page.getByText("Saved from the smoke page").waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-toast.png`) });
        });
      }

      await page.waitForTimeout(300);
      record(t("no console errors"), errors.length === 0, errors.slice(0, 5).join(" | "));
      allErrors.push(...errors.map((e) => `${theme}: ${e}`));
    } finally {
      await context.close();
    }
  }

  if (litt && has("button")) await darkModeContract(browser, url, accent, record);
  return { checks, errors: allErrors };
}

/**
 * litt's dark mode model in a host: [data-theme] and the shadcn/next-themes classes (.dark, .light) beat the
 * system setting, and with none of them set the system setting decides. Read from the primary Button's fill.
 */
async function darkModeContract(browser, url, accent, record) {
  const { context, page } = await openPage(browser, url, "light");
  try {
    const fill = () => page.evaluate(`(${COLOR_TO_RGB})(getComputedStyle(document.querySelector("[data-testid=litt-primary]")).backgroundColor)`);
    const cases = [
      { name: "nothing set, system light", scheme: "light", want: "light" },
      { name: "nothing set, system dark", scheme: "dark", want: "dark" },
      { name: ".dark beats system light", scheme: "light", cls: "dark", want: "dark" },
      { name: ".light beats system dark", scheme: "dark", cls: "light", want: "light" },
      { name: '[data-theme="dark"] beats system light', scheme: "light", attr: "dark", want: "dark" },
      { name: '[data-theme="light"] beats system dark', scheme: "dark", attr: "light", want: "light" },
    ];
    for (const c of cases) {
      try {
        await page.emulateMedia({ colorScheme: c.scheme });
        await page.evaluate(
          ({ cls, attr }) => {
            const el = document.documentElement;
            el.classList.remove("dark", "light");
            el.removeAttribute("data-theme");
            if (cls) el.classList.add(cls);
            if (attr) el.setAttribute("data-theme", attr);
          },
          { cls: c.cls ?? null, attr: c.attr ?? null },
        );
        await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
        await page.waitForTimeout(250);
        const got = await fill();
        const want = accent[c.want];
        record(
          `dark mode: ${c.name}`,
          near(got, want),
          near(got, want) ? `rgb(${want})` : `primary Button is rgb(${got.slice(0, 3)}), expected the ${c.want} accent rgb(${want})`,
        );
      } catch (e) {
        record(`dark mode: ${c.name}`, false, String(e.message || e).split("\n")[0]);
      }
    }
  } finally {
    await context.close();
  }
}
