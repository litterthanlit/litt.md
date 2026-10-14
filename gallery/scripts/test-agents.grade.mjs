/**
 * Grader for the litt.md agent test (gallery/scripts/test-agents.mjs): takes what an agent left in a host
 * app and scores it with litt's own checks. Importing this file runs nothing.
 *
 *   import { CHECKS, grade } from "./test-agents.grade.mjs";
 *   const results = await grade({ app, dir, task, transcript, diff, ctx });
 *   // -> [{ check, status: "pass" | "fail" | "warn" | "skip", detail }, ...] one per CHECKS item, in order
 *
 * The checks, in order (a `fail` on a required check fails the run; `warn` and `skip` do not):
 *   skill     the litt-md skill was loaded (a Skill call). Skipped in the --no-skill arm.
 *   registry  every expected registry item ended up installed (components/litt/*.tsx, lib/litt/motion, lib/litt/glide).
 *             A warn when the agent also added shadcn's own components to components/ui/.
 *   composed  the agent composed the installed components: it imports them, imports every expected item, declares no
 *             function, const or class named like one of their components or hooks (a wrapper that imports the original
 *             under another name is fine), and never edited components/litt/** or lib/litt/**.
 *   tokens    lint-litt.mjs --host on the agent's own files: no off-system radius, weight, shadow, color or type size.
 *   motion    the same lint, rule "motion": durations and eases through the tiers; and no <motion.*> with
 *             initial/animate/exit unless useTransition/useExit/useStagger come from lib/litt/motion.
 *   tsc       the host's own typecheck.
 *   build     the host's production build. When it fails, `page` and `look` are skipped.
 *   page      the built page in Chromium, light and dark at 1440 and 390 px: no console or page errors, no failed requests,
 *             no horizontal overflow at either width, full-page screenshots; then each extra task shot (a click or a key
 *             chord, then a viewport screenshot) at 1440 in both themes. A click target that is missing fails.
 *   look      optional (ctx.judge): a Claude judge reads the screenshots against the task's rubric.
 *
 * "Agent files" are the .ts/.tsx/.js/.jsx/.css files the agent added or changed, minus the litt files the install wrote
 * (components/litt, lib/litt), shadcn's own files (components/ui, lib/utils.ts: unless the transcript shows the agent
 * wrote them), the host's global stylesheet and lockfiles. The global stylesheet is mostly shadcn's and litt's, so
 * only what the agent wrote into it is linted: the new text of each Edit, without the lines it kept from the old text.
 *
 * Every check catches its own errors and turns them into a `fail` with the message, so one check never stops the rest.
 * Everything long (tsc, build, lint) appends its output to ctx.logFile.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { buildApp, errorExcerpt, npx, serveBuild, snapshot } from "./test-registry.mjs";

export const CHECKS = ["skill", "registry", "composed", "tokens", "motion", "tsc", "build", "page", "look"];

/* ------------------------------------------------------------------ small helpers */

const pass = (detail) => ({ status: "pass", detail });
const fail = (detail) => ({ status: "fail", detail });
const warn = (detail) => ({ status: "warn", detail });
const skip = (detail) => ({ status: "skip", detail });

const unique = (list) => [...new Set(list)];
const slash = (p) => String(p).split(path.sep).join("/");
const oneLine = (s, n = 200) => {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};
const cap = (lines, n = 12) => (lines.length > n ? [...lines.slice(0, n), `… and ${lines.length - n} more`] : lines);
const money = (n) => (typeof n === "number" ? `$${n.toFixed(2)}` : "?");
const safeName = (s) => String(s).replace(/[^\w.-]+/g, "_");

/** A path as the transcript or the diff wrote it, made relative to the host dir with / separators. */
function hostRelative(p, dir) {
  let s = String(p ?? "").replace(/\\/g, "/");
  if (path.isAbsolute(s)) {
    const r = slash(path.relative(dir, s));
    s = r;
  }
  return s.replace(/^\.\//, "");
}

/** What counts as a component or hook of litt's: PascalCase (Button, ProjectList) or useX. Not formatDate or CASCADE_CAP. */
const COMPONENT_NAME = /^(?:(?=.*[a-z])[A-Z][\w$]*|use[A-Z][\w$]*)$/;
const LITT_COMPONENT = /(^|\/)components\/litt\/([^/]+)\.tsx$/;
const LITT_FILE = /(^|\/)(components|lib)\/litt\//;
const SHADCN_OWN = /(^|\/)components\/ui\/|(^|\/)lib\/utils\.tsx?$/;
const CODE_FILE = /\.(tsx?|jsx?|css)$/;
const LOCKFILE = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|npm-shrinkwrap\.json)$/;

/** Source with comments blanked out (same length, same lines), so a commented-out import or class is ignored. */
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .split("\n")
    .map((line) => (/^\s*\/\//.test(line) ? blank(line) : line))
    .join("\n");
}

const lineOf = (src, index) => src.slice(0, index).split("\n").length;

/** The useful lines of a failed command: no colors, no stack frames, errors first. */
function excerpt(out, n = 16) {
  const clean = String(out)
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, "")
    .split("\n")
    .filter((l) => !/^\s+at\s/.test(l))
    .join("\n");
  return errorExcerpt(clean, n);
}

/**
 * Every import in a module: { spec, line, typeOnly, names: [{ imported, local }], ns, def }.
 * Handles multi-line braces, `import type`, side-effect imports, re-exports, import() and require().
 */
function parseImports(src) {
  const out = [];
  const q = `["'\`]([^"'\`]+)["'\`]`;
  for (const m of src.matchAll(new RegExp(String.raw`\bimport\s+(type\s+)?([\w$]*\s*,?\s*(?:\*\s*as\s+[\w$]+|\{[^}]*\})?)\s*from\s*${q}`, "g"))) {
    const clause = m[2];
    const names = [];
    const brace = clause.match(/\{([^}]*)\}/);
    if (brace)
      for (const part of brace[1].split(",")) {
        const t = part.trim().replace(/^type\s+/, "");
        if (!t) continue;
        const [imported, local] = t.split(/\s+as\s+/);
        names.push({ imported: imported.trim(), local: (local ?? imported).trim() });
      }
    out.push({
      spec: m[3],
      line: lineOf(src, m.index),
      typeOnly: !!m[1],
      names,
      ns: /\*\s*as\s+[\w$]+/.test(clause),
      def: /^[\w$]+/.test(clause.trim()),
    });
  }
  for (const m of src.matchAll(new RegExp(String.raw`\bimport\s*${q}`, "g")))
    out.push({ spec: m[1], line: lineOf(src, m.index), typeOnly: false, names: [], ns: false, def: false });
  for (const m of src.matchAll(new RegExp(String.raw`\b(?:import|require)\s*\(\s*${q}\s*\)`, "g")))
    out.push({ spec: m[1], line: lineOf(src, m.index), typeOnly: false, names: [], ns: true, def: false });
  for (const m of src.matchAll(new RegExp(String.raw`\bexport\s+(?:\*|\{[^}]*\})\s*from\s*${q}`, "g")))
    out.push({ spec: m[1], line: lineOf(src, m.index), typeOnly: false, names: [], ns: true, def: false });
  return out;
}

/** Value exports of an installed litt module (types are ignored): functions, consts, classes, `export { … }`. */
function valueExports(src) {
  const s = stripComments(src);
  const names = new Set();
  for (const m of s.matchAll(/\bexport\s+(?:default\s+)?(?:async\s+)?function\s*\*?\s*([\w$]+)/g)) names.add(m[1]);
  for (const m of s.matchAll(/\bexport\s+(?:const|let|var|class)\s+([\w$]+)/g)) names.add(m[1]);
  for (const m of s.matchAll(/\bexport\s*\{([^}]*)\}/g))
    for (const part of m[1].split(",")) {
      const t = part.trim();
      if (!t || /^type\s/.test(t)) continue;
      names.add(t.split(/\s+as\s+/).pop().trim());
    }
  names.delete("default");
  return [...names];
}

/** Names a module declares at any depth with function, const/let/var or class: { name, line }. */
function declaredNames(src) {
  const s = stripComments(src);
  const out = [];
  const add = (re) => {
    for (const m of s.matchAll(re)) out.push({ name: m[1], line: lineOf(s, m.index) });
  };
  add(/(?:^|[\s;{}(])function\s*\*?\s*([\w$]+)\s*[(<]/g);
  add(/(?:^|[\s;{}(])(?:const|let|var)\s+([\w$]+)\s*(?::[^=\n]+)?=/g);
  add(/(?:^|[\s;{}(])class\s+([\w$]+)/g);
  return out;
}

/** The text of every <motion.x …> opening tag: { text, line }. */
function motionTags(src) {
  const out = [];
  for (const m of src.matchAll(/<motion\.[\w$]+/g)) {
    let i = m.index + m[0].length;
    let depth = 0;
    let quote = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (quote) {
        if (c === "\\") i++;
        else if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth <= 0) break;
    }
    out.push({ text: src.slice(m.index, i + 1), line: lineOf(src, m.index) });
  }
  return out;
}

/** Run a node script with stdout and stderr kept apart. Resolves { code, stdout, stderr, timedOut }, never rejects. */
function runNode(args, { cwd, timeout = 120000, logFile } = {}) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let child;
    try {
      child = spawn(process.execPath, args, { cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" } });
    } catch (e) {
      return resolve({ code: 127, stdout: "", stderr: String(e), timedOut: false });
    }
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeout);
    const done = (code) => {
      clearTimeout(timer);
      if (logFile) {
        try {
          fs.mkdirSync(path.dirname(logFile), { recursive: true });
          fs.appendFileSync(logFile, `$ node ${args.map((a) => (a.length > 160 ? a.slice(0, 160) + "…" : a)).join(" ")}\n${stdout.slice(0, 20000)}${stderr}\n[exit ${timedOut ? "timeout" : code}]\n\n`);
        } catch {
          /* the log is a courtesy */
        }
      }
      resolve({ code: timedOut ? 124 : (code ?? 1), stdout, stderr, timedOut });
    };
    child.on("error", (e) => {
      stderr += String(e);
      done(127);
    });
    child.on("close", (code) => done(code));
  });
}

/** The last JSON object in a judge's answer that has a boolean `pass`. Tolerates prose and code fences around it. */
export function parseJudgeAnswer(text) {
  const s = String(text ?? "");
  const closers = [];
  for (let i = s.length - 1; i >= 0; i--) if (s[i] === "}") closers.push(i);
  for (let i = s.lastIndexOf("{"); i >= 0; i = s.lastIndexOf("{", i - 1)) {
    for (const j of closers) {
      if (j < i) break;
      let obj;
      try {
        obj = JSON.parse(s.slice(i, j + 1));
      } catch {
        continue;
      }
      if (obj && typeof obj === "object" && typeof obj.pass === "boolean") {
        const reasons = Array.isArray(obj.reasons) ? obj.reasons.map((r) => String(r)) : obj.reasons ? [String(obj.reasons)] : [];
        return { pass: obj.pass, reasons };
      }
    }
    if (i === 0) break;
  }
  return null;
}

/* ------------------------------------------------------------------ what the agent left behind */

/** Everything the checks share: files on disk, which litt items are installed, which files are the agent's. */
function inspect({ app, dir, task, transcript, diff, ctx }) {
  const files = [...snapshot(dir).keys()];
  const cssGlobal = ctx.appSpec?.cssGlobal ?? null;
  const writes = (transcript?.writes ?? []).map((w) => ({ tool: w.tool, path: hostRelative(w.path, dir) }));
  const written = new Set(writes.map((w) => w.path));

  // Installed litt items: the component files, the motion and glide libs, and the style items (from the global CSS).
  const littComponents = new Map(); // stem -> relative file
  for (const f of files) {
    const m = f.match(LITT_COMPONENT);
    if (m) littComponents.set(m[2], f);
  }
  const installed = new Set(littComponents.keys());
  if (files.some((f) => /(^|\/)lib\/litt\/motion\/[^/]+\.tsx?$/.test(f))) installed.add("motion");
  if (files.some((f) => /(^|\/)lib\/litt\/glide\.tsx?$/.test(f))) installed.add("glide");
  let css = "";
  try {
    if (cssGlobal) css = fs.readFileSync(path.join(dir, cssGlobal), "utf8");
  } catch {
    /* no global stylesheet */
  }
  if (/--color-litt-canvas|--litt-canvas/.test(css)) installed.add("litt");
  if (/hanken-grotesk/.test(css)) installed.add("base-styles");

  const changed = unique([...(diff?.added ?? []), ...(diff?.modified ?? [])].map((f) => hostRelative(f, dir)));
  const agentFiles = changed.filter((f) => {
    if (!CODE_FILE.test(f) || LOCKFILE.test(f)) return false;
    if (LITT_FILE.test(f)) return false;
    if (f === cssGlobal) return false;
    if (SHADCN_OWN.test(f) && !written.has(f)) return false;
    return fs.existsSync(path.join(dir, f));
  });
  const sources = new Map(agentFiles.map((f) => [f, fs.readFileSync(path.join(dir, f), "utf8")]));

  // What the agent wrote into the global stylesheet: each Edit's new text minus the anchor lines it kept.
  const cssEdits = [];
  let cssRewritten = false;
  for (const c of transcript?.toolCalls ?? []) {
    if (!cssGlobal || hostRelative(c.input?.file_path ?? "", dir) !== cssGlobal) continue;
    if (c.name === "Write") cssRewritten = true;
    const edits = c.name === "Edit" ? [c.input] : c.name === "MultiEdit" ? (c.input?.edits ?? []) : [];
    for (const e of edits) {
      const kept = new Set(String(e?.old_string ?? "").split("\n").map((l) => l.trim()).filter(Boolean));
      const text = String(e?.new_string ?? "")
        .split("\n")
        .map((l) => (kept.has(l.trim()) ? "" : l))
        .join("\n");
      if (text.trim()) cssEdits.push(text);
    }
  }
  return { app, dir, task, transcript, diff, ctx, files, cssGlobal, writes, written, littComponents, installed, changed, agentFiles, sources, cssEdits, cssRewritten };
}

const expectEntries = (task) => (task?.expect?.items ?? []).map((e) => (Array.isArray(e) ? e : [e]));
const importMarker = (item) => (item === "motion" ? "lib/litt/motion" : item === "glide" ? "lib/litt/glide" : `components/litt/${item}`);
const isImportable = (item) => item !== "litt" && item !== "base-styles";

/* ------------------------------------------------------------------ checks */

function checkSkill(s) {
  const { transcript, ctx } = s;
  if (ctx.noSkill) return skip("the no-skill arm: the plugin is not loaded on purpose");
  if (!transcript) return fail("no transcript");
  const calls = transcript.skills ?? (transcript.toolCalls ?? []).filter((c) => c.name === "Skill").map((c) => c.input?.skill);
  const hit = calls.find((n) => /(^|:)litt-md$/.test(String(n ?? "")));
  const plugins = transcript.init?.plugins ?? [];
  const loaded = plugins.some((p) => /litt/.test(String(p)));
  if (hit) return pass(`Skill ${hit} was called${transcript.init ? `; plugin ${loaded ? "loaded" : "not listed in init"}` : ""}`);
  const readIt = (transcript.toolCalls ?? []).find((c) => c.name === "Read" && /skills\/litt-md\//.test(String(c.input?.file_path ?? "")));
  return fail(
    `the litt-md skill was never called. Skill calls: ${calls.length ? calls.join(", ") : "none"}. ` +
      `Plugin ${transcript.init ? (loaded ? "was loaded" : `was NOT loaded (init plugins: ${plugins.join(", ") || "none"})`) : "state unknown (no init event)"}.` +
      (readIt ? ` It did Read ${readIt.input.file_path} directly, which is not a skill load.` : ""),
  );
}

function checkRegistry(s) {
  const { task, installed, transcript, diff, dir } = s;
  const groups = expectEntries(task);
  const missing = groups.filter((g) => !g.some((i) => installed.has(i)));
  const lines = [];
  const littItems = [...installed].sort();
  lines.push(`installed: ${littItems.length ? littItems.join(", ") : "nothing from litt"}`);
  if (groups.length) lines.push(`expected: ${groups.map((g) => (g.length > 1 ? `one of ${g.join("|")}` : g[0])).join(", ")}`);
  const adds = (transcript?.bash ?? []).filter((c) => /\bshadcn(@[\w.-]+)?\s+add\b/.test(c)).map((c) => oneLine(c, 180));
  lines.push(adds.length ? `add commands (${adds.length}): ${cap(adds, 3).join(" ; ")}` : "add commands: none");
  const hostAdded = (diff?.added ?? [])
    .map((f) => hostRelative(f, dir))
    .filter((f) => /(^|\/)components\/ui\/[^/]+\.tsx?$/.test(f));

  const noComponents = ![...s.littComponents.keys()].length && !installed.has("motion") && !installed.has("glide");
  if (missing.length || (noComponents && !groups.length)) {
    const what = missing.map((g) => (g.length > 1 ? `one of ${g.join("|")}` : g[0]));
    return fail((missing.length ? `missing: ${what.join(", ")}\n` : "no litt component was installed\n") + lines.join("\n"));
  }
  if (hostAdded.length) {
    lines.push(`also added shadcn's own component(s) to components/ui: ${hostAdded.map((f) => path.basename(f)).join(", ")}`);
    return warn(lines.join("\n"));
  }
  return pass(lines.join("\n"));
}

function checkComposed(s) {
  const { installed, littComponents, agentFiles, sources, dir, writes, task } = s;
  const problems = [];

  if (!agentFiles.length) return fail("the agent wrote no UI code, so nothing was composed");
  if (!littComponents.size) problems.push("no litt component is installed, so there is nothing to compose");

  // imports of installed litt components, per agent file
  const imported = new Map(); // module marker -> files
  const parsed = new Map(agentFiles.map((f) => [f, parseImports(stripComments(sources.get(f)))]));
  for (const [f, imports] of parsed)
    for (const im of imports) {
      if (im.typeOnly) continue;
      for (const item of installed) {
        if (!isImportable(item)) continue;
        if (im.spec.includes(importMarker(item))) imported.set(item, [...(imported.get(item) ?? []), f]);
      }
    }
  const importsLittComponent = [...parsed.values()].some((imports) => imports.some((im) => !im.typeOnly && im.spec.includes("components/litt/")));
  if (littComponents.size && !importsLittComponent) problems.push("no agent file imports from components/litt/ (the litt components are installed but unused)");

  // every installed expected item must be used
  for (const group of expectEntries(task)) {
    const here = group.filter((i) => installed.has(i) && isImportable(i));
    if (here.length && !here.some((i) => imported.has(i)))
      problems.push(`${here.join(" | ")} is installed but no agent file imports it${here.includes("button") ? " (a different Button, such as the host's components/ui/button or one it wrote?)" : ""}`);
  }

  // hand-rolled copies: the same name as an export of an installed litt component
  const exportsByName = new Map(); // export name -> stem
  for (const [stem, file] of littComponents) {
    let names = [];
    try {
      names = valueExports(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch {
      /* unreadable: skip it */
    }
    for (const n of names) if (COMPONENT_NAME.test(n) && !exportsByName.has(n)) exportsByName.set(n, stem);
  }
  for (const f of agentFiles) {
    if (!/\.(tsx?|jsx?)$/.test(f)) continue;
    const src = sources.get(f);
    const imports = parsed.get(f);
    const seen = new Set();
    for (const d of declaredNames(src)) {
      const stem = exportsByName.get(d.name);
      if (!stem || seen.has(d.name)) continue;
      // A wrapper is fine: the same module imported under another name (or as a namespace) is being composed.
      const wraps = imports.some((im) => im.spec.includes(`components/litt/${stem}`) && (im.ns || im.names.some((n) => n.imported === d.name && n.local !== d.name)));
      if (wraps) continue;
      seen.add(d.name);
      problems.push(`${f}:${d.line} hand-rolled ${d.name} instead of importing it from components/litt/${stem}`);
    }
  }

  // edits to installed litt files
  const edited = unique(writes.filter((w) => LITT_FILE.test(w.path)).map((w) => `${w.tool} ${w.path}`));
  for (const e of edited) problems.push(`edited an installed litt file: ${e}`);

  if (problems.length) return fail(cap(problems, 14).join("\n"));
  const used = [...imported.keys()].sort();
  return pass(`${agentFiles.length} agent file(s) compose ${used.join(", ")}; no hand-rolled copy, no installed litt file edited`);
}

/** One lint run per grade(): both `tokens` and `motion` read it. */
function lintOnce(s) {
  if (s.lint) return s.lint;
  s.lint = (async () => {
    const script = path.join(s.ctx.galleryDir, "scripts", "lint-litt.mjs");
    const files = s.agentFiles.map((f) => path.join(s.dir, f));
    const labels = new Map(); // a fragment's path as the lint prints it -> what a person reads
    if (s.cssEdits.length) {
      const fragDir = path.join(path.dirname(s.ctx.logFile ?? path.join(s.dir, "..", "logs", "x")), "global-css-edits");
      fs.mkdirSync(fragDir, { recursive: true });
      s.cssEdits.forEach((text, i) => {
        const abs = path.join(fragDir, `edit-${i + 1}.css`);
        fs.writeFileSync(abs, text);
        files.push(abs);
        labels.set(slash(path.relative(s.dir, abs)), `${s.cssGlobal} (agent edit ${i + 1})`);
      });
    }
    if (!files.length) return { fails: [], warns: [] };
    const r = await runNode([script, "--host", "--json", "--root", s.dir, ...files], { cwd: s.dir, logFile: s.ctx.logFile });
    let json = null;
    const text = r.stdout.trim();
    try {
      json = JSON.parse(text);
    } catch {
      const a = text.indexOf("{");
      const b = text.lastIndexOf("}");
      if (a >= 0 && b > a) {
        try {
          json = JSON.parse(text.slice(a, b + 1));
        } catch {
          /* handled below */
        }
      }
    }
    if (!json || !Array.isArray(json.fails) || r.code === 2) {
      const why = r.timedOut ? "timed out" : `exited ${r.code}`;
      throw new Error(`lint-litt.mjs --host --json ${why} and printed no result:\n${excerpt(`${r.stderr}\n${r.stdout}`, 8) || "(no output)"}`);
    }
    for (const f of [...json.fails, ...(json.warns ?? [])]) if (labels.has(slash(f.file))) f.file = labels.get(slash(f.file));
    return json;
  })();
  s.lint.catch(() => {}); // the checks that await it report the error; this only prevents an unhandled rejection
  return s.lint;
}

const lintLine = (f) => `${f.file}:${f.line}  [${f.rule}] ${f.message}`;

async function checkTokens(s) {
  if (!s.agentFiles.length) return fail("the agent wrote no UI code, so there is nothing to check");
  const lint = await lintOnce(s);
  const fails = lint.fails.filter((f) => f.rule !== "motion");
  const warns = (lint.warns ?? []).filter((f) => f.rule !== "motion");
  const notes = [];
  const allowed = s.agentFiles.flatMap((f) =>
    s.sources
      .get(f)
      .split("\n")
      .map((l, i) => (l.includes("litt-allow") ? `${f}:${i + 1}` : null))
      .filter(Boolean),
  );
  if (allowed.length) notes.push(`litt-allow exempts ${allowed.length} line(s) from the lint: ${cap(allowed, 4).join(", ")}`);
  if (s.cssRewritten) notes.push(`the agent rewrote ${s.cssGlobal} whole with Write, so what it added there is not linted`);
  const warnText = warns.length ? `${warns.length} warning(s): ${cap(warns.map(lintLine), 4).join(" ; ")}` : "";
  if (fails.length)
    return fail([`${fails.length} off-system value(s) in ${s.agentFiles.length} file(s):`, ...cap(fails.map(lintLine), 12), warnText, ...notes].filter(Boolean).join("\n"));
  const cssNote = s.cssEdits.length ? ` and ${s.cssEdits.length} edit(s) to ${s.cssGlobal}` : "";
  const detail = [`${s.agentFiles.length} file(s)${cssNote} clean: ${cap(s.agentFiles, 6).join(", ")}`, warnText, ...notes].filter(Boolean).join("\n");
  return notes.length ? warn(detail) : pass(detail);
}

async function checkMotion(s) {
  if (!s.agentFiles.length) return skip("no agent files to check");
  const lint = await lintOnce(s);
  const problems = lint.fails.filter((f) => f.rule === "motion").map(lintLine);
  const warns = (lint.warns ?? []).filter((f) => f.rule === "motion").map(lintLine);

  const hooks = new Set();
  let motionEls = 0;
  let tokenClasses = 0;
  let other = 0;
  for (const f of s.agentFiles) {
    if (!/\.(tsx?|jsx?)$/.test(f)) continue;
    const src = stripComments(s.sources.get(f));
    const mine = new Set();
    for (const im of parseImports(src))
      if (/lib\/litt\/motion/.test(im.spec) && !im.typeOnly) for (const n of im.names) mine.add(n.imported);
    for (const h of mine) hooks.add(h);
    const tiered = ["useTransition", "useExit", "useStagger"].some((h) => mine.has(h));
    const tags = motionTags(src);
    motionEls += tags.length;
    for (const t of tags)
      if (/\s(initial|animate|exit)\s*=/.test(t.text) && !tiered)
        problems.push(`${f}:${t.line}  motion outside the tiers: ${oneLine(t.text.split(/\s/)[0])} sets initial/animate/exit but ${f} imports none of useTransition, useExit or useStagger from lib/litt/motion`);
    tokenClasses += (src.match(/--litt-dur-[\w-]+/g) ?? []).length;
    other += (src.match(/\bAnimatePresence\b|\banimate-[\w[\]-]+|\bwhile(?:Hover|Tap|InView)=/g) ?? []).length;
  }
  if (problems.length) return fail(cap(problems, 12).join("\n"));
  const parts = [];
  if (hooks.size) parts.push(`hooks from lib/litt/motion: ${[...hooks].sort().join(", ")}`);
  if (tokenClasses) parts.push(`${tokenClasses} --litt-dur-* token use(s), paired by the lint`);
  if (motionEls) parts.push(`${motionEls} <motion.*> element(s)`);
  if (other && !motionEls) parts.push(`${other} other animation use(s) passed the lint`);
  if (warns.length) parts.push(`${warns.length} warning(s): ${cap(warns, 3).join(" ; ")}`);
  return pass(parts.length ? parts.join("; ") : "no motion of its own; the installed components carry the tiers");
}

async function checkTsc(s) {
  const r = await npx(s.ctx.appSpec.tsc, { cwd: s.dir, timeout: 300000, logFile: s.ctx.logFile });
  if (r.code !== 0) return fail(`${s.ctx.appSpec.tsc.join(" ")} exited ${r.code}${r.timedOut ? " (timeout)" : ""}\n${excerpt(r.out, 20)}`);
  return pass(`${s.ctx.appSpec.tsc.join(" ")} (${(r.ms / 1000).toFixed(1)}s)`);
}

async function checkBuild(s) {
  const r = await buildApp(s.app, s.dir, s.ctx.logFile);
  s.built = r.code === 0;
  if (!s.built) return fail(`${s.ctx.appSpec.build.join(" ")} exited ${r.code}${r.timedOut ? " (timeout)" : ""}\n${excerpt(r.out, 20)}`);
  return pass(`${s.ctx.appSpec.build.join(" ")} (${(r.ms / 1000).toFixed(1)}s)`);
}

const THEMES = ["light", "dark"];
const WIDTHS = [1440, 390];

/** Runs before the page's own scripts: litt's dark mode follows the .dark class and [data-theme]. */
const DARK_INIT = `(() => {
  const apply = () => {
    const h = document.documentElement;
    if (!h) return false;
    h.classList.add("dark");
    h.setAttribute("data-theme", "dark");
    return true;
  };
  if (!apply()) {
    const mo = new MutationObserver(() => { if (apply()) mo.disconnect(); });
    mo.observe(document, { childList: true });
  }
})();`;

/** A fresh browser context on the built page. Console errors, page errors and failed requests go to `errors`. */
async function openContext(browser, url, { theme, width, height }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme, deviceScaleFactor: 1 });
  const errors = [];
  try {
    if (theme === "dark") await context.addInitScript(DARK_INIT);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on("pageerror", (e) => errors.push(`pageerror: ${oneLine(String(e.message ?? e).split("\n")[0], 220)}`));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const where = m.location()?.url ?? "";
      if (/favicon/.test(where) || /favicon/.test(m.text())) return;
      errors.push(`console.error: ${oneLine(m.text().split("\n")[0], 220)}${where ? ` (${where})` : ""}`);
    });
    page.on("requestfailed", (r) => {
      if (!/favicon/.test(r.url())) errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ""}`);
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(700); // entrances settle before the picture
    return { context, page, errors };
  } catch (e) {
    await context.close().catch(() => {});
    throw Object.assign(e, { errors });
  }
}

async function checkPage(s) {
  if (!s.built) return skip("the build failed");
  const { ctx, task } = s;
  const shots = task?.shots?.length ? task.shots : [{ name: "page" }];
  // The same message from several loads is reported once, with the loads it came from.
  const found = new Map();
  const add = (tag, message) => {
    const msg = message.replace(/https?:\/\/127\.0\.0\.1:\d+/g, "");
    const tags = found.get(msg) ?? [];
    if (!tags.includes(tag)) tags.push(tag);
    found.set(msg, tags);
  };
  const files = [];
  s.shotFiles = files;
  fs.mkdirSync(ctx.shotsDir, { recursive: true });
  const served = await serveBuild(s.app, s.dir, ctx.logFile);
  try {
    const browser = await ctx.getBrowser();
    const first = safeName(shots[0].name || "page");

    for (const theme of THEMES)
      for (const width of WIDTHS) {
        const tag = `${theme} ${width}px`;
        let opened;
        try {
          opened = await openContext(browser, served.url, { theme, width, height: width === 390 ? 844 : 900 });
        } catch (e) {
          add(tag, `the page did not load: ${oneLine(e.message ?? e, 200)}`);
          for (const m of e.errors ?? []) add(tag, `${m}`);
          continue;
        }
        const { context, page, errors } = opened;
        try {
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          if (overflow > 0) add(tag, `horizontal overflow of ${overflow}px`);
          const file = `${first}-${theme}-${width}.png`;
          await page.screenshot({ path: path.join(ctx.shotsDir, file), fullPage: true });
          files.push({ file, abs: path.join(ctx.shotsDir, file), label: `${first === "page" ? "the page as loaded" : `shot "${first}"`}, ${theme} theme, ${width}px wide`, theme, width });
        } catch (e) {
          add(tag, `${oneLine(e.message ?? e, 200)}`);
        } finally {
          for (const m of unique(errors)) add(tag, `${m}`);
          await context.close().catch(() => {});
        }
      }

    for (const shot of shots.slice(1)) {
      const name = safeName(shot.name);
      for (const theme of THEMES) {
        const tag = `${theme} 1440px, shot "${shot.name}"`;
        let opened;
        try {
          opened = await openContext(browser, served.url, { theme, width: 1440, height: 900 });
        } catch (e) {
          add(tag, `the page did not load: ${oneLine(e.message ?? e, 200)}`);
          continue;
        }
        const { context, page, errors } = opened;
        try {
          let did = "";
          if (shot.click) {
            did = `after clicking ${shot.click}`;
            const target = page.locator(shot.click).first();
            try {
              await target.waitFor({ state: "visible", timeout: 5000 });
            } catch (e) {
              add(tag, `the click target ${shot.click} is missing or hidden (${oneLine(String(e.message ?? e).split("\n")[0], 120)})`);
              continue;
            }
            await target.click({ timeout: 5000 });
          }
          if (shot.press) {
            did = `${did ? did + ", then " : "after "}pressing ${shot.press}`;
            await page.keyboard.press(shot.press);
          }
          await page.waitForTimeout(Number.isFinite(shot.wait) ? shot.wait : 500);
          const file = `${name}-${theme}-1440.png`;
          await page.screenshot({ path: path.join(ctx.shotsDir, file) });
          files.push({ file, abs: path.join(ctx.shotsDir, file), label: `shot "${shot.name}" ${did}, ${theme} theme, 1440px wide`, theme, width: 1440 });
        } catch (e) {
          add(tag, `${oneLine(e.message ?? e, 200)}`);
        } finally {
          for (const m of unique(errors)) add(tag, `${m}`);
          await context.close().catch(() => {});
        }
      }
    }
  } finally {
    await served.stop();
  }
  const names = files.map((f) => f.file);
  const where = `${files.length} screenshot(s) in ${ctx.shotsDir}: ${names.join(", ") || "none"}`;
  if (found.size) {
    const lines = [...found].map(([msg, tags]) =>
      tags.length === 1 ? `${tags[0]}: ${msg}` : `${msg}  [${tags.length} loads: ${tags.slice(0, 3).join("; ")}${tags.length > 3 ? "; …" : ""}]`,
    );
    return fail(`${cap(lines, 14).join("\n")}\n${where}`);
  }
  return pass(`no console errors, no horizontal overflow, light and dark at ${WIDTHS.join(" and ")}px; ${where}`);
}

function judgePrompt(s) {
  const { task } = s;
  const list = s.shotFiles.map((f) => `- ${f.abs}  (${f.label})`).join("\n");
  return [
    "You are judging screenshots of a web page that an AI coding agent built for the task below.",
    "",
    "The task the agent was given:",
    '"""',
    String(task.prompt ?? "").trim(),
    '"""',
    "",
    "Open every screenshot with the Read tool before you answer:",
    list,
    "",
    "The rubric. Each line is a claim; check each one against what you can see:",
    '"""',
    String(task.look).trim(),
    '"""',
    "",
    "Judge only what is visible in the screenshots, never what the code might do. Set pass to true only when every claim holds.",
    "In reasons, give one short sentence per claim that fails (what you saw instead), or one sentence on what held when everything passes.",
    'Your final message must be ONLY a JSON object, no prose and no code fence: {"pass": boolean, "reasons": ["…"]}',
  ].join("\n");
}

async function checkLook(s) {
  const { ctx, task } = s;
  if (!ctx.judge) return skip("no --judge");
  if (!s.built) return skip("the build failed");
  if (!task?.look) return skip("the task has no look rubric");
  if (!s.shotFiles?.length) return skip("the page check took no screenshots");
  if (typeof ctx.runClaude !== "function") return fail("ctx.runClaude is missing, so the judge cannot run");
  const t = await ctx.runClaude({
    cwd: ctx.shotsDir,
    prompt: judgePrompt(s),
    model: ctx.judge.model,
    allowedTools: ["Read"],
    maxTurns: 12,
    timeoutMs: 300000,
    budgetUsd: 1,
    plugin: false,
    appendSystemPrompt: "You are a strict visual reviewer. Look at every screenshot you are given, then answer with exactly one JSON object and nothing else.",
  });
  const cost = t?.result?.costUsd;
  const tag = `judge ${ctx.judge.model ?? ""}, ${money(cost)}`.replace(/\s+,/, ",");
  const text = t?.result?.text ?? "";
  const answer = parseJudgeAnswer(text);
  if (!answer) {
    const why = !t?.result ? "the judge produced no result" : t.result.isError ? `the judge run errored (${t.result.subtype ?? "error"})` : "the judge's last message has no JSON object with a boolean pass";
    return fail(`${why} (${tag}). Last message: ${oneLine(text, 300) || "(empty)"}`);
  }
  const reasons = answer.reasons.map((r) => `- ${oneLine(r, 260)}`);
  return (answer.pass ? pass : fail)([`${answer.pass ? "the screenshots match the rubric" : "the screenshots do not match the rubric"} (${tag})`, ...cap(reasons, 8)].join("\n"));
}

const IMPLEMENTATION = {
  skill: checkSkill,
  registry: checkRegistry,
  composed: checkComposed,
  tokens: checkTokens,
  motion: checkMotion,
  tsc: checkTsc,
  build: checkBuild,
  page: checkPage,
  look: checkLook,
};

/* ------------------------------------------------------------------ entry */

/**
 * Grade one agent run. Returns one { check, status, detail } per CHECKS item, in order.
 * A check that throws becomes a `fail` carrying the message; the rest still run.
 */
export async function grade({ app, dir, task, transcript, diff, ctx }) {
  let state = null;
  let stateError = null;
  try {
    state = inspect({ app, dir, task, transcript, diff, ctx });
  } catch (e) {
    stateError = e;
  }
  const results = [];
  for (const check of CHECKS) {
    let r;
    try {
      if (!state) throw stateError ?? new Error("could not read the host app");
      r = await IMPLEMENTATION[check](state);
    } catch (e) {
      const lines = String(e?.message ?? e).split("\n").map((l) => l.trimEnd()).filter(Boolean);
      r = fail(`the ${check} check could not run: ${cap(lines, 10).join("\n")}`);
    }
    results.push({ check, status: r.status, detail: r.detail });
  }
  return results;
}
