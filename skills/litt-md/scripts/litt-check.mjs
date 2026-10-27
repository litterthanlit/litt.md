#!/usr/bin/env node
/**
 * litt check: how litt is an app? One score out of 100, by category, with every finding and its fix.
 *
 *   node litt-check.mjs [dir...]          score the app's code (default: the current folder)
 *   node litt-check.mjs --json [dir...]   print one JSON object and nothing else
 *   node litt-check.mjs --min 75 [dir...] exit 1 when the score is under 75 (a gate for CI)
 *   node litt-check.mjs --all [dir...]    list every file and finding, not the worst 8 files
 *   node litt-check.mjs --self-test       check the scorer against the lint fixtures (needs the litt.md repo)
 *
 * What it reads: lint-litt.mjs in host mode (beside this file) over the app's .ts, .tsx, .js, .jsx and .css files,
 * skipping node_modules, build output and the installed litt components themselves. So the score says how far the
 * app's own code is from litt's rules: an app that never installed litt scores low on color and shape on purpose.
 * Plus one thing the lint cannot see file by file: whether the app's own motion stops under reduced motion.
 *
 * The score: five categories and their mean. Each styled file (a stylesheet, or code with a class list or a style;
 * helpers do not count) starts at 1 in a category and keeps 0.8 of it per finding there, so the first findings in a
 * file cost the most; a category is the mean over the styled files. So a score reads as how much of the app follows
 * that rule, a big app with a few bad files still scores high, and fixing any file moves it.
 *   motion          tiers, eases, literal timings, transition-all, layout animation, loops
 *   color           raw hex and color functions, palette and shadcn colors instead of litt tokens
 *   shape           radii off the scale, shadows with an offset
 *   type            sizes off the scale, weights off the roles
 *   reduced motion  0 or 100: the app moves, and nothing stops it under prefers-reduced-motion
 * Warnings (uppercase, a bare <b>, onMouseEnter) are listed but cost nothing.
 *
 * No network, no AI, no account: it reads files and prints. Exit codes: 0 at or over --min (or no --min),
 * 1 under it, 2 on a usage error.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const LINT = path.join(here, "lint-litt.mjs");

/** The lint's rules, in the score's categories. "other" is warnings only. */
const CATEGORY = { motion: "motion", color: "color", radius: "shape", shadow: "shape", type: "type", weight: "type" };
const CATEGORIES = ["motion", "color", "shape", "type", "reduced motion"];
const COST = 0.8;
const SHOWN_FILES = 8;
const SHOWN_PER_FILE = 6;

/**
 * A file named for a part litt ships is often a hand-rolled one: point at the item that does it already. Each value
 * is a registry item name (the self-test checks them against gallery/registry.lock.json).
 */
const PARTS = [
  [/dialog|modal|sheet|drawer/, "dialog"],
  [/tooltip/, "tooltip"],
  [/toast|snackbar|notification/, "toast"],
  [/context-?menu/, "context-menu"],
  [/command|palette|spotlight/, "command-menu"],
  [/dropdown|menu/, "menu"],
  [/popover/, "popover"],
  [/combobox|autocomplete/, "combobox"],
  [/date-?picker|calendar/, "date-picker"],
  [/color-?picker|swatch/, "color-picker"],
  [/select|picker/, "select"],
  [/tabs?\b|tab-?bar/, "tabs"],
  [/switch|toggle/, "switch"],
  [/slider|range/, "slider"],
  [/accordion|collapse|disclosure/, "accordion"],
  [/carousel|slideshow/, "carousel"],
  [/table|data-?grid/, "table"],
  [/checkbox|radio/, "checkbox"],
  [/avatar/, "avatar"],
  [/badge|tag|chip|pill/, "tag"],
  [/breadcrumb/, "breadcrumb"],
  [/pagination|pager/, "pagination"],
  [/progress/, "progress"],
  [/skeleton|empty-?state|loading/, "states"],
  [/button|btn/, "button"],
  [/input|text-?field/, "input"],
  [/card/, "card"],
];

class UsageError extends Error {}

function parseArgs(argv) {
  const o = { json: false, all: false, min: null, selfTest: false, help: false, dirs: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") o.json = true;
    else if (a === "--all") o.all = true;
    else if (a === "--self-test") o.selfTest = true;
    else if (a === "--help" || a === "-h") o.help = true;
    else if (a === "--min" || a.startsWith("--min=")) {
      const v = Number(a === "--min" ? argv[++i] : a.slice("--min=".length));
      if (!Number.isFinite(v) || v < 0 || v > 100) throw new UsageError("--min needs a score from 0 to 100");
      o.min = v;
    } else if (a.startsWith("--")) throw new UsageError(`unknown option ${a}`);
    else o.dirs.push(a);
  }
  if (!o.dirs.length) o.dirs.push(".");
  return o;
}

/* ------------------------------------------------------------------ reading the app */

const SKIP = new Set(["node_modules", ".next", ".git", "dist", "build", "out", ".turbo", ".vercel", "coverage"]);
const CODE = /\.(tsx?|jsx?|css)$/;
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return SKIP.has(d.name) ? [] : walk(p);
    return CODE.test(d.name) ? [p] : [];
  });

/** litt's own installed files (components/litt, lib/litt and the blocks in components/litt-blocks): they are litt,
    so they say nothing about the app. */
const isLitt = (f) => /[\\/](?:components[\\/]litt(?:-blocks)?|lib[\\/]litt)[\\/]/.test(f);

/**
 * Does the app move, and does it stop under reduced motion? It moves when its own code has a transition, an
 * animation, keyframes or a motion library. It stops when anything honours the preference: a prefers-reduced-motion
 * query, Tailwind's motion-reduce: or motion-safe:, useReducedMotion, MotionConfig's reducedMotion, or litt's tokens
 * (they zero every duration under reduced motion, so motion on them stops).
 */
function reducedMotion(files) {
  let moves = null;
  let guard = null;
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    if (!guard) {
      if (/prefers-reduced-motion|motion-(?:reduce|safe):|useReducedMotion|reducedMotion\s*=|--litt-dur-/.test(text)) guard = f;
    }
    if (!moves && !isLitt(f)) {
      const css = /\.css$/.test(f);
      const m = css
        ? /(?:^|[\s;{])(?:transition(?:-property|-duration)?\s*:\s*(?!none)|animation(?:-name)?\s*:\s*(?!none)|@keyframes\s)/m.exec(text)
        : /from\s+["'](?:motion\/react|framer-motion|motion)["']|\banimate-(?!none)[a-z]|(?<![\w-])transition(?:-(?:all|colors|opacity|transform|shadow))?(?=[\s"'`])/.exec(text);
      if (m) moves = { file: f, line: text.slice(0, m.index).split("\n").length };
    }
    if (guard && moves) break;
  }
  return { moves, guard };
}

/* ------------------------------------------------------------------ scoring */

function partFor(file) {
  const name = path.basename(file).replace(/\.[^.]+$/, "").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  return PARTS.find(([re]) => re.test(name))?.[1] ?? null;
}

function score(dirs) {
  const roots = dirs.map((d) => {
    const p = path.resolve(d);
    if (!fs.existsSync(p)) throw new UsageError(`no such folder: ${d}`);
    return p;
  });
  const root = roots.length === 1 && fs.statSync(roots[0]).isDirectory() ? roots[0] : process.cwd();
  const files = [...new Set(roots.flatMap((p) => (fs.statSync(p).isDirectory() ? walk(p) : [p])))];
  const own = files.filter((f) => !isLitt(f));
  const rel = (f) => path.relative(root, f).split(path.sep).join("/");
  /* The files that style anything: a stylesheet, or code with a class list or a style. A file of helpers has no
     say in how litt the app looks, so it neither helps nor hurts the score. */
  const styled = own.filter((f) => /\.css$/.test(f) || /\bclass(?:Name)?\s*=|\bstyle\s*=\s*\{|\bcn\(|\bclsx\(|\bcva\(/.test(fs.readFileSync(f, "utf8"))).map(rel);

  let fails = [];
  let warns = [];
  if (own.length) {
    const r = spawnSync(process.execPath, [LINT, "--host", "--json", "--root", root, ...own], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (r.status === 2 || !r.stdout.trim()) throw new Error(`lint-litt.mjs did not run: ${(r.stderr || r.stdout).trim().split("\n")[0]}`);
    ({ fails, warns } = JSON.parse(r.stdout));
  }

  const findings = fails.map((f) => {
    const cut = f.message.indexOf(": ");
    return {
      category: CATEGORY[f.rule] ?? "motion",
      file: f.file,
      line: f.line,
      what: cut > 0 ? f.message.slice(0, cut) : f.message,
      fix: cut > 0 ? f.message.slice(cut + 2) : "",
      part: partFor(f.file),
    };
  });
  const rm = reducedMotion(files);
  if (rm.moves && !rm.guard) {
    findings.push({
      category: "reduced motion",
      file: rel(rm.moves.file),
      line: rm.moves.line,
      what: "the app moves, and nothing stops it under reduced motion",
      fix: "add @media (prefers-reduced-motion: reduce) for your own transitions, or move them onto litt's tokens (var(--litt-dur-…)), which stop by themselves",
      part: null,
    });
  }

  /* Each styled file starts at 1 in every category and keeps COST of it per finding there; a category is the mean
     over the styled files. So it reads as how much of the app follows that rule, and fixing any file moves it. */
  const units = new Set([...styled, ...findings.filter((f) => f.category !== "reduced motion").map((f) => f.file)]);
  const categories = Object.fromEntries(
    CATEGORIES.map((c) => {
      const here = findings.filter((f) => f.category === c);
      if (c === "reduced motion") return [c, { score: here.length ? 0 : 100, findings: here.length, files: here.length }];
      const per = new Map();
      for (const f of here) per.set(f.file, (per.get(f.file) ?? 0) + 1);
      const sum = [...units].reduce((t, file) => t + COST ** (per.get(file) ?? 0), 0);
      return [c, { score: units.size ? Math.round((100 * sum) / units.size) : 100, findings: here.length, files: per.size }];
    }),
  );
  const total = Math.round(CATEGORIES.reduce((t, c) => t + categories[c].score, 0) / CATEGORIES.length);

  /* The files that cost the most, worst first, and the problems that come up most, to fix in bulk. */
  const byFile = new Map();
  for (const f of findings) byFile.set(f.file, [...(byFile.get(f.file) ?? []), f]);
  const worst = [...byFile.entries()]
    .map(([file, list]) => ({ file, part: partFor(file), findings: list.sort((a, b) => a.line - b.line) }))
    .sort((a, b) => b.findings.length - a.findings.length || a.file.localeCompare(b.file));
  const counts = new Map();
  for (const f of findings) {
    const key = `${f.category}\u0000${f.what}`;
    counts.set(key, { category: f.category, what: f.what, fix: f.fix, count: (counts.get(key)?.count ?? 0) + 1 });
  }
  const common = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8);

  return {
    root,
    files: files.length,
    ownFiles: own.length,
    styledFiles: units.size,
    score: total,
    verdict: verdictFor(total),
    categories,
    common,
    worst,
    findings: worst.flatMap((w) => w.findings),
    warnings: warns,
  };
}

const verdictFor = (s) => (s >= 90 ? "litt" : s >= 75 ? "close" : s >= 50 ? "needs work" : "far from litt");

/* ------------------------------------------------------------------ output */

function print(r, all) {
  const bar = (s) => "█".repeat(Math.round(s / 10)) + "░".repeat(10 - Math.round(s / 10));
  const near = path.relative(process.cwd(), r.root);
  const where = !near ? "." : near.startsWith("..") ? r.root : near; // a folder elsewhere reads better as its own path
  console.log(`litt check · ${r.styledFiles} styled files of ${r.ownFiles} in ${where}${r.files > r.ownFiles ? ` (litt's own ${r.files - r.ownFiles} skipped)` : ""}`);
  console.log(`\nScore ${r.score} / 100 (${r.verdict})\n`);
  for (const c of CATEGORIES) {
    const { score: s, findings: n, files } = r.categories[c];
    const note = c === "reduced motion" ? (n ? "no guard" : "guarded, or nothing moves") : n ? `${n} finding${n === 1 ? "" : "s"} in ${files} file${files === 1 ? "" : "s"}` : "clean";
    console.log(`  ${c.padEnd(15)} ${String(s).padStart(3)}  ${bar(s)}  ${note}`);
  }
  if (!r.findings.length) {
    console.log("\nNothing to fix: this is litt.");
    return;
  }
  console.log("\nMost common, fix these in bulk:");
  for (const c of r.common) console.log(`  ${String(c.count).padStart(4)} × [${c.category}] ${c.what}${c.fix ? `\n         ${c.fix}` : ""}`);

  const files = all ? r.worst : r.worst.slice(0, SHOWN_FILES);
  console.log(`\nWorst files first:`);
  for (const w of files) {
    console.log(`\n  ${w.file}  (${w.findings.length})${w.part ? `  or install @litt/${w.part}: npx shadcn@latest add @litt/${w.part}` : ""}`);
    const list = all ? w.findings : w.findings.slice(0, SHOWN_PER_FILE);
    for (const f of list) console.log(`    ✗ ${String(f.line).padStart(4)}  [${f.category}] ${f.what}`);
    if (list.length < w.findings.length) console.log(`    … ${w.findings.length - list.length} more here`);
  }
  if (files.length < r.worst.length) console.log(`\n  … and ${r.worst.length - files.length} more files (--all lists everything)`);
  if (r.warnings.length) console.log(`\n${r.warnings.length} warning${r.warnings.length === 1 ? "" : "s"} (no cost): ${[...new Set(r.warnings.map((w) => w.message.split(":")[0]))].join(", ")}`);
  console.log(`\n${r.findings.length} finding${r.findings.length === 1 ? "" : "s"}. Start with the most common ones: fixed everywhere at once, they move the score the most.`);
}

/* ------------------------------------------------------------------ self-test */

function selfTest() {
  const repo = path.resolve(here, "../../..");
  const fixtures = path.join(repo, "gallery", "scripts", "lint-fixtures");
  const lock = path.join(repo, "gallery", "registry.lock.json");
  if (!fs.existsSync(fixtures) || !fs.existsSync(lock)) throw new UsageError("--self-test needs the litt.md repo around the skill");
  const problems = [];
  const expect = (ok, what) => {
    console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
    if (!ok) problems.push(what);
  };

  const clean = score([path.join(fixtures, "host-clean.tsx")]);
  expect(["motion", "color", "shape", "type"].every((c) => clean.categories[c].score === 100), "host-clean.tsx scores 100 on motion, color, shape and type");
  const dirty = score([path.join(fixtures, "host-dirty.tsx"), path.join(fixtures, "host-dirty.css")]);
  expect(dirty.score < 50 && CATEGORIES.slice(0, 4).every((c) => dirty.categories[c].findings > 0), `host-dirty scores under 50 with findings in every lint category (got ${dirty.score})`);
  expect(dirty.findings.every((f) => f.what && f.file && f.line > 0), "every finding has a file, a line and what is wrong");
  expect(JSON.stringify(dirty).length > 0 && typeof JSON.parse(JSON.stringify(dirty)).score === "number", "the result is plain JSON");

  const items = new Set(Object.keys(JSON.parse(fs.readFileSync(lock, "utf8")).items));
  const missing = PARTS.map(([, n]) => n).filter((n) => !items.has(n));
  expect(!missing.length, `every suggested part is a registry item${missing.length ? ` (missing: ${missing.join(", ")})` : ""}`);
  const named = [["src/components/Modal.tsx", "dialog"], ["NavDropdown.tsx", "menu"], ["DatePicker.tsx", "date-picker"], ["ColorPicker.tsx", "color-picker"], ["FontPicker.tsx", "select"], ["utils.ts", null]];
  const wrong = named.filter(([file, want]) => partFor(file) !== want);
  expect(!wrong.length, `file names map to parts: ${named.map(([f, w]) => `${path.basename(f, path.extname(f))} → ${w ?? "none"}`).join(", ")}${wrong.length ? ` (wrong: ${wrong.map(([f]) => `${f} gave ${partFor(f)}`).join(", ")})` : ""}`);

  /* Reduced motion, on throwaway apps. */
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || "/tmp"), "litt-check-"));
  try {
    fs.writeFileSync(path.join(tmp, "app.css"), ".card { transition: transform var(--litt-dur-instant) var(--litt-ease-out); }\n");
    expect(score([tmp]).categories["reduced motion"].score === 100, "motion on litt's tokens counts as guarded");
    fs.writeFileSync(path.join(tmp, "app.css"), ".card { transition: transform 200ms ease-out; }\n");
    const bare = score([tmp]);
    expect(bare.categories["reduced motion"].score === 0, "a bare transition with no guard costs the reduced motion category");
    fs.writeFileSync(path.join(tmp, "guard.css"), "@media (prefers-reduced-motion: reduce) { * { transition: none; } }\n");
    expect(score([tmp]).categories["reduced motion"].score === 100, "a prefers-reduced-motion query guards it");
    fs.rmSync(path.join(tmp, "app.css"));
    fs.rmSync(path.join(tmp, "guard.css"));
    fs.writeFileSync(path.join(tmp, "page.tsx"), "export const Page = () => <p className=\"text-litt-body text-litt-fg\">Hello</p>;\n");
    const still = score([tmp]);
    expect(still.score === 100 && still.verdict === "litt", "an app that does not move and follows the rules scores 100");
    for (const dir of ["components/litt", "components/litt-blocks", "lib/litt"]) {
      fs.mkdirSync(path.join(tmp, dir), { recursive: true });
      fs.writeFileSync(path.join(tmp, dir, "part.tsx"), "export const P = () => <p className=\"text-sm rounded-md bg-zinc-900\">x</p>;\n");
    }
    const skipped = score([tmp]);
    expect(skipped.score === 100 && skipped.ownFiles === 1, "litt's own installed files (components/litt, components/litt-blocks, lib/litt) are skipped");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  /* The gate. */
  const gate = (min) => spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--json", "--min", String(min), path.join(fixtures, "host-dirty.tsx")], { encoding: "utf8" }).status;
  expect(gate(0) === 0 && gate(99) === 1, "--min exits 0 at or over the score and 1 under it");

  console.log(problems.length ? `\nlitt check self-test: ${problems.length} problem(s).` : "\nlitt check self-test: the scorer agrees with the lint fixtures.");
  return problems.length ? 1 : 0;
}

/* ------------------------------------------------------------------ main */

try {
  const o = parseArgs(process.argv.slice(2));
  if (o.help) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0].replace(/^#!.*\n/, "").replace(/^\/\*\*\n|^ \* ?/gm, ""));
  } else if (o.selfTest) {
    process.exitCode = selfTest();
  } else {
    const r = score(o.dirs);
    if (o.json) console.log(JSON.stringify(r));
    else print(r, o.all);
    process.exitCode = o.min !== null && r.score < o.min ? 1 : 0;
  }
} catch (e) {
  console.error(e instanceof UsageError ? `litt-check: ${e.message}\nusage: node litt-check.mjs [--json] [--min N] [--all] [dir...] | --self-test` : e.stack ?? String(e));
  process.exitCode = 2;
}
