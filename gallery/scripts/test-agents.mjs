#!/usr/bin/env node
/**
 * Agent test for litt.md: gives Claude a fresh app and a task, then grades the result with litt's own checks.
 * It proves the skill and the registry work together: that Claude, asked for real UI in a real project, loads
 * the litt-md skill, installs litt's components instead of hand-making copies, stays on litt's tokens and
 * motion tiers, and ships a page that builds, loads and looks right.
 *
 *   node gallery/scripts/test-agents.mjs [--tasks a,b] [--app vite|next] [--model sonnet] [--runs 1]
 *     [--registry <dir>|<url>] [--no-skill] [--judge [model]] [--max-budget-usd N]
 *     [--work <dir>] [--out <dir>] [--keep] [--report <file>] [--json <file>] [--fake-agent <script>] [--help]
 *
 *   --tasks      only these tasks, by name (default every evals/agents/<name>/task.json)
 *   --app        run every task in this host (vite or next) instead of the app its task.json names
 *   --model      the model Claude runs as (default sonnet)
 *   --runs       how many times to run each task, one after the other (default 1; agents vary)
 *   --registry   where the agent installs from. A built registry directory (default gallery/public/r): it is
 *                copied into the run folder, served on localhost, and the host's components.json gets
 *                "registries": { "@litt": "http://localhost:<port>/r/{name}.json" } (everything else in it is
 *                kept). Or a deployed registry URL such as https://littmd.vercel.app/r: nothing is served and
 *                components.json is left alone, which is what a stranger's project looks like.
 *   --no-skill   the baseline arm: the same task without the litt-md plugin, to see what the skill changes.
 *                The skill check is skipped; the rest still run.
 *   --judge      also have a second Claude read the screenshots against the task's rubric (the `look` check).
 *                An optional model follows (default opus, so the judge is not the model it grades). Without it
 *                `look` is skipped.
 *   --max-budget-usd  cap on one agent run, over the task's own max_budget_usd
 *   --work       the root of the host template cache (default <os tmpdir>/litt-registry-test, shared with
 *                test-registry.mjs, so the templates are built once)
 *   --out        where run folders go (default <os tmpdir>/litt-agent-test)
 *   --keep       keep each run's app/node_modules (it is removed otherwise; everything else is always kept)
 *   --report     prepend a section for this run to a markdown report ("litt agent test: findings, newest first")
 *   --json       write everything about the run (checks, files, cost, versions) to this file
 *   --fake-agent run `node <script> <task>` in the host dir instead of Claude, with env LITT_AGENT_PROMPT,
 *                LITT_AGENT_REGISTRY (the registry base URL) and LITT_AGENT_LITT (@litt in local mode, else the
 *                base URL). Its stdout is read as Claude's stream-json, and the environment passes through (for
 *                evals/agents/fake-agent.mjs, LITT_FAKE_BAD=1 asks for the bad variant). This is how the harness
 *                is tested for free.
 *
 * Environment: LITT_AGENT_TASKS_DIR (another tasks folder), LITT_AGENT_GRADER (another grader module),
 * LITT_AGENT_CLAUDE (another claude binary). Intended for testing the harness itself.
 *
 * Each run, in <out>/run-<time>/<task>-<app>-<n>/:
 *   app/               a copy of the cached host template (Vite 8 or Next 16, Tailwind 4, shadcn init), cwd of the agent
 *   transcript.jsonl   Claude's stream-json, written as it arrives
 *   shots/             the screenshots the grader takes
 *   grade.json         the checks and their detail
 *   logs/              the agent's stderr, the command it was run with, the grader's command logs
 * The agent is `claude -p` with the plugin directory (this repo), project and local settings only, no MCP, no
 * session saved, a read/write/edit tool set and a short list of allowed commands (shadcn add, npm install,
 * tsc, the build, the lint, ls, cat, the skill's check script). Anything else is denied without asking, recorded as a
 * permission denial, and the agent works around it.
 *
 * The checks (see test-agents.grade.mjs): skill, registry, composed, tokens, motion, tsc, build, page, look.
 * A table shows ok / FAIL / warn / - per check, with cost, turns and time. A run also fails when the agent
 * itself did not finish (it timed out, ran out of turns or budget, or errored).
 *
 * Cost and time: this spends money. In the first Sonnet runs one task cost $0.26 to $0.38 and one to one and a
 * half minutes of agent time, plus about 30 seconds to grade; --judge (Opus) added $0.11 to $0.23. Each task is
 * capped by its max_budget_usd and timeout_seconds.
 * --fake-agent costs nothing. The first run builds the host templates if the install test has not (3 minutes).
 * Runs go one after the other. Nothing here is part of `verify`.
 *
 * Container notes: needs the network (npm registry, ui.shadcn.com) and Chromium through Playwright
 * (PLAYWRIGHT_MODULE=/opt/node22/lib/node_modules/playwright, browsers in /opt/pw-browsers; nothing is
 * downloaded). The agent's environment loses CLAUDECODE, CLAUDE_CODE_SESSION_ID, CLAUDE_CODE_REMOTE_SESSION_ID,
 * CLAUDE_CODE_ENTRYPOINT and CLAUDE_CODE_CHILD_SESSION, or a nested claude would reuse the parent's session, and
 * CLAUDE_ADDITIONAL_DIRECTORIES and CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD, so it sees only the host app.
 *
 * Exit code 0 when every run passes every required check, 1 when any fails, 2 on a harness error (no claude,
 * no registry, a bad task file, a grader that throws, the first call refused for login or credit).
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { APPS, BASE_ENV, copyDir, diffSnapshots, ensureTemplate, killAll, run, snapshot, startRegistryServer } from "./test-registry.mjs";
import { launchChromium } from "./test-registry.smoke.mjs";

/* ------------------------------------------------------------------ paths and args */

const here = path.dirname(fileURLToPath(import.meta.url));
const galleryDir = path.resolve(here, "..");
const repoDir = path.resolve(galleryDir, "..");
const PROD_ORIGIN = "https://littmd.vercel.app";
const DEFAULT_CHECKS = ["skill", "registry", "composed", "tokens", "motion", "tsc", "build", "page", "look"];

const NONINTERACTIVE = "You are running non-interactively. Nobody can answer questions, so make reasonable assumptions and finish the task in this project.";
const DISALLOWED_TOOLS = ["Agent", "WebFetch", "WebSearch"];
/**
 * Variables that tie a nested claude to the session that started it: the first five make it reuse the parent's
 * session, the last two hand it the parent's extra directories and their CLAUDE.md (a cloud container sets them).
 */
const PARENT_SESSION_VARS = [
  "CLAUDECODE",
  "CLAUDE_CODE_SESSION_ID",
  "CLAUDE_CODE_REMOTE_SESSION_ID",
  "CLAUDE_CODE_ENTRYPOINT",
  "CLAUDE_CODE_CHILD_SESSION",
  "CLAUDE_ADDITIONAL_DIRECTORIES",
  "CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD",
];

const defaultAllowedTools = () => [
  "Read",
  "Write",
  "Edit",
  "MultiEdit",
  "Glob",
  "Grep",
  "Skill",
  "TodoWrite",
  "Bash(npx shadcn@latest add:*)",
  "Bash(npx shadcn add:*)",
  "Bash(npx --yes shadcn@latest add:*)",
  "Bash(npm run build:*)",
  "Bash(npm run lint:*)",
  "Bash(npm install:*)",
  "Bash(npx tsc:*)",
  "Bash(ls:*)",
  "Bash(cat:*)",
  `Bash(node ${repoDir}/skills/litt-md/scripts/check.mjs:*)`,
];

function parseArgs(argv) {
  const o = {
    tasks: null,
    app: null,
    model: "sonnet",
    runs: 1,
    registry: path.join(galleryDir, "public", "r"),
    noSkill: false,
    judge: null,
    maxBudget: null,
    work: null,
    out: null,
    keep: false,
    report: null,
    json: null,
    fakeAgent: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      if (i + 1 >= argv.length) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    if (a === "--tasks")
      o.tasks = val()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a === "--app") o.app = val();
    else if (a === "--model") o.model = val();
    else if (a === "--runs") o.runs = Number.parseInt(val(), 10);
    else if (a === "--registry") {
      const v = val();
      o.registry = /^https?:\/\//.test(v) ? v.replace(/\/+$/, "").replace(/(?<!\/r)$/, "/r") : path.resolve(v);
    } else if (a === "--no-skill") o.noSkill = true;
    else if (a === "--judge") o.judge = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "opus";
    else if (a === "--max-budget-usd") o.maxBudget = Number(val());
    else if (a === "--work") o.work = path.resolve(val());
    else if (a === "--out") o.out = path.resolve(val());
    else if (a === "--keep") o.keep = true;
    else if (a === "--report") o.report = path.resolve(val());
    else if (a === "--json") o.json = path.resolve(val());
    else if (a === "--fake-agent") o.fakeAgent = path.resolve(val());
    else if (a === "-h" || a === "--help") o.help = true;
    else throw new Error(`unknown argument ${a} (try --help)`);
  }
  if (o.app && !APPS[o.app]) throw new Error(`--app must be ${Object.keys(APPS).join(" or ")}`);
  if (!Number.isInteger(o.runs) || o.runs < 1) throw new Error("--runs must be a whole number of 1 or more");
  if (o.maxBudget !== null && !(o.maxBudget > 0)) throw new Error("--max-budget-usd must be a number above 0");
  if (o.fakeAgent && !fs.existsSync(o.fakeAgent)) throw new Error(`--fake-agent ${o.fakeAgent}: no such file`);
  o.work ??= path.join(os.tmpdir(), "litt-registry-test");
  o.out ??= path.join(os.tmpdir(), "litt-agent-test");
  return o;
}

/* ------------------------------------------------------------------ small helpers */

const sha = (s) => crypto.createHash("sha1").update(s).digest("hex");
const ensureDir = (d) => fs.mkdirSync(d, { recursive: true });
const rmrf = (d) => fs.rmSync(d, { recursive: true, force: true });
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + "\n");
const usd = (n) => (typeof n === "number" ? "$" + n.toFixed(2) : "-");
const slash = (p) => p.split(path.sep).join("/");
const oneLine = (s, n = 110) => {
  const t = String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};
function fmtDur(ms) {
  if (typeof ms !== "number") return "-";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}s`;
}
/** A path for people: relative to the cwd when that is shorter and stays inside it, else absolute. */
const shortPath = (p) => {
  const rel = path.relative(process.cwd(), p);
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel) ? rel : p;
};

/* ------------------------------------------------------------------ child processes */

/** Agent processes (claude or the fake agent). test-registry.mjs tracks its own children and kills them itself. */
const agentChildren = new Set();
function killTree(child) {
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    try {
      child.kill("SIGKILL");
    } catch {
      /* already gone */
    }
  }
}
const killAgents = () => agentChildren.forEach(killTree);
// test-registry.mjs (imported above) turns SIGINT and SIGTERM into process.exit, which always runs this.
process.on("exit", () => {
  killAgents();
  killAll();
});

/**
 * Run a command with stdin closed, its stdout streamed into `file` as it arrives, and a hard timeout that
 * kills the whole process group. Resolves, never rejects: {exitCode, timedOut, spawnError}.
 */
function spawnStreaming({ cmd, args, cwd, env, timeoutMs, file, errFile, onLine }) {
  return new Promise((resolve) => {
    ensureDir(path.dirname(file));
    const outStream = fs.createWriteStream(file);
    const errStream = errFile ? fs.createWriteStream(errFile) : null;
    let child;
    let timedOut = false;
    let spawnError = null;
    let buf = "";
    try {
      child = spawn(cmd, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
    } catch (e) {
      outStream.end();
      errStream?.end();
      return resolve({ exitCode: 127, timedOut: false, spawnError: String(e.message ?? e) });
    }
    agentChildren.add(child);
    child.stdout.on("data", (d) => {
      outStream.write(d);
      if (!onLine) return;
      buf += d;
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        try {
          onLine(line);
        } catch {
          /* progress output must never break a run */
        }
      }
      if (buf.length > 5e6) buf = "";
    });
    child.stderr.on("data", (d) => errStream?.write(d));
    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child);
    }, timeoutMs);
    let finished = false;
    const done = (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      agentChildren.delete(child);
      killTree(child); // anything the agent left running in its group
      let pending = errStream ? 2 : 1;
      const fin = () => --pending === 0 && resolve({ exitCode: timedOut ? 124 : (code ?? 1), timedOut, spawnError });
      outStream.end(fin);
      errStream?.end(fin);
    };
    child.on("error", (e) => {
      spawnError = String(e.message ?? e);
      done(127);
    });
    child.on("close", (code) => done(code));
    // A background process the agent left running can hold the pipes open after the agent itself is gone.
    child.on("exit", (code) => setTimeout(() => done(code), 3000).unref());
  });
}

/* ------------------------------------------------------------------ transcripts (C2) */

const toText = (content) => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return content == null ? "" : JSON.stringify(content);
  return content.map((c) => (typeof c === "string" ? c : c?.type === "text" ? c.text : c?.type === "image" ? "[image]" : JSON.stringify(c))).join("\n");
};
const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

function relToHost(hostDir, p) {
  if (typeof p !== "string" || !p) return "";
  if (!path.isAbsolute(p)) return slash(path.normalize(p)).replace(/^\.\//, "");
  const tries = [hostDir];
  try {
    tries.push(fs.realpathSync(hostDir));
  } catch {
    /* host dir is gone */
  }
  for (const base of tries) {
    const rel = path.relative(base, p);
    if (!rel.startsWith("..") && !path.isAbsolute(rel)) return slash(rel);
  }
  return slash(path.relative(hostDir, p));
}

/** Stream-json text -> the parts of the transcript object that come from the events. */
function parseStream(text, hostDir) {
  const events = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t[0] !== "{") continue;
    try {
      events.push(JSON.parse(t));
    } catch {
      /* a partial line from a killed process */
    }
  }
  let init = null;
  let result = null;
  const calls = [];
  const byId = new Map();
  const names = (list) => (Array.isArray(list) ? list.map((x) => (typeof x === "string" ? x : x?.name)).filter(Boolean) : []);
  for (const ev of events) {
    if (ev.type === "system" && ev.subtype === "init" && !init) {
      init = { model: ev.model ?? null, version: ev.claude_code_version ?? ev.version ?? null, plugins: names(ev.plugins), skills: names(ev.skills) };
    } else if (ev.type === "assistant" && Array.isArray(ev.message?.content)) {
      for (const b of ev.message.content) {
        if (b?.type !== "tool_use" || byId.has(b.id)) continue;
        const call = { id: b.id, name: b.name, input: b.input ?? {}, isError: false, output: "" };
        byId.set(b.id, call);
        calls.push(call);
      }
    } else if (ev.type === "user" && Array.isArray(ev.message?.content)) {
      for (const b of ev.message.content) {
        if (b?.type !== "tool_result") continue;
        const call = byId.get(b.tool_use_id);
        if (!call) continue;
        call.isError = b.is_error === true;
        call.output = toText(b.content).slice(0, 2000);
      }
    } else if (ev.type === "result") {
      result = {
        text: typeof ev.result === "string" ? ev.result : "",
        costUsd: typeof ev.total_cost_usd === "number" ? ev.total_cost_usd : 0,
        turns: ev.num_turns ?? 0,
        durationMs: ev.duration_ms ?? 0,
        isError: ev.is_error === true,
        subtype: ev.subtype ?? null,
        permissionDenials: (ev.permission_denials ?? []).map((d) => ({ tool_name: d.tool_name, tool_input: d.tool_input })),
      };
    }
  }
  return {
    init,
    result,
    toolCalls: calls,
    skills: calls.filter((c) => c.name === "Skill" && typeof c.input?.skill === "string").map((c) => c.input.skill),
    bash: calls.filter((c) => c.name === "Bash" && typeof c.input?.command === "string").map((c) => c.input.command),
    writes: calls
      .filter((c) => WRITE_TOOLS.has(c.name))
      .map((c) => ({ tool: c.name, path: relToHost(hostDir, c.input?.file_path ?? c.input?.notebook_path ?? c.input?.path) }))
      .filter((w) => w.path),
  };
}

/** One line for a tool call, for the progress output. */
function describeCall(hostDir, name, input = {}) {
  if (name === "Bash") return `Bash ${oneLine(input.command, 90)}`;
  if (name === "Skill") return `Skill ${input.skill ?? ""}`;
  const p = input.file_path ?? input.notebook_path ?? input.path;
  if (p) return `${name} ${relToHost(hostDir, p)}`;
  return name;
}

/* ------------------------------------------------------------------ the agent */

/**
 * Run `claude -p` (or the fake agent) in `cwd` and return the transcript object (C2). The stream-json goes to
 * `file` as it arrives. Throws only when the process cannot be started at all.
 */
async function runAgentProcess(o, spec) {
  const {
    cwd,
    prompt,
    file,
    errFile,
    model = o.model,
    allowedTools = defaultAllowedTools(),
    maxTurns = 60,
    timeoutMs = 1500000,
    budgetUsd = 5,
    plugin = true,
    appendSystemPrompt = NONINTERACTIVE,
    log,
    fake,
    commandFile,
  } = spec;

  let cmd;
  let args;
  let env;
  if (fake) {
    cmd = process.execPath;
    args = [fake.script, fake.task];
    env = { ...BASE_ENV, LITT_AGENT_PROMPT: prompt, LITT_AGENT_REGISTRY: fake.registryBase, LITT_AGENT_LITT: fake.litt };
  } else {
    cmd = process.env.LITT_AGENT_CLAUDE || "claude";
    args = [
      "-p",
      prompt,
      "--model",
      model,
      "--max-turns",
      String(maxTurns),
      "--max-budget-usd",
      String(budgetUsd),
      "--setting-sources",
      "project,local",
      "--strict-mcp-config",
      "--no-session-persistence",
      ...(plugin ? ["--plugin-dir", repoDir] : []),
      "--output-format",
      "stream-json",
      "--verbose",
      "--allowedTools",
      ...allowedTools,
      "--disallowedTools",
      ...DISALLOWED_TOOLS,
      "--append-system-prompt",
      appendSystemPrompt,
    ];
    env = { ...BASE_ENV };
    delete env.CI; // BASE_ENV keeps installs quiet; CI itself is not wanted in the agent's shell
    for (const v of PARENT_SESSION_VARS) delete env[v];
  }
  if (commandFile) {
    ensureDir(path.dirname(commandFile));
    const shown = args.map((a) => (/[\s"'$`()*]/.test(a) ? JSON.stringify(a.length > 400 ? a.slice(0, 400) + "…" : a) : a));
    fs.appendFileSync(commandFile, `cwd ${cwd}\n${cmd} ${shown.join(" ")}\n\n`);
  }

  // progress while it runs: the skill and install commands as they happen, a heartbeat for the rest
  const state = { tools: 0, last: "", started: Date.now() };
  const onLine = (line) => {
    if (line[0] !== "{") return;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      return;
    }
    if (ev.type !== "assistant" || !Array.isArray(ev.message?.content)) return;
    for (const b of ev.message.content) {
      if (b?.type !== "tool_use") continue;
      state.tools++;
      state.last = describeCall(cwd, b.name, b.input);
      if (log && (b.name === "Skill" || (b.name === "Bash" && /shadcn/.test(b.input?.command ?? "")))) log(`  ${state.last}`);
    }
  };
  const beat = log
    ? setInterval(() => log(`  … ${fmtDur(Date.now() - state.started)}, ${state.tools} tool calls, last: ${state.last || "(none yet)"}`), 30000)
    : null;
  beat?.unref();
  let r;
  try {
    r = await spawnStreaming({ cmd, args, cwd, env, timeoutMs, file, errFile, onLine });
  } finally {
    if (beat) clearInterval(beat);
  }
  if (r.spawnError) throw new Error(`could not start ${fake ? "the fake agent" : `"${cmd}"`}: ${r.spawnError}`);
  const parsed = parseStream(fs.readFileSync(file, "utf8"), cwd);
  const ok = r.exitCode === 0 && !r.timedOut && !!parsed.result && !parsed.result.isError && !/^error/.test(parsed.result.subtype ?? "");
  return { ok, exitCode: r.exitCode, timedOut: r.timedOut, ...parsed, file };
}

/** Why a finished agent did not finish its job, or null. */
function agentProblem(t, timeoutMs) {
  if (t.ok) return null;
  if (t.timedOut) return `the agent timed out after ${fmtDur(timeoutMs)} and was killed`;
  if (!t.result) return `the agent exited ${t.exitCode} without a result event (see logs/agent.stderr.log)`;
  const why = t.result.subtype && t.result.subtype !== "success" ? t.result.subtype : "error";
  return `the agent did not finish (${why}${t.exitCode ? `, exit ${t.exitCode}` : ""}): ${oneLine(t.result.text, 200) || "no message"}`;
}

/** The first call being refused (login, credit, quota) is the same for every run: stop instead of repeating it. */
const REFUSED = /not logged in|\/login|invalid api key|authenticat|credit balance|usage limit|rate.?limit|quota|billing|overloaded/i;
function refusedByClaude(t) {
  return !t.ok && t.result?.isError && (t.result.turns ?? 0) <= 1 && (t.result.costUsd ?? 0) < 0.01 && REFUSED.test(t.result.text ?? "");
}

/* ------------------------------------------------------------------ tasks (C1) */

function loadTasks(opts) {
  const dir = process.env.LITT_AGENT_TASKS_DIR ? path.resolve(process.env.LITT_AGENT_TASKS_DIR) : path.join(repoDir, "evals", "agents");
  if (!fs.existsSync(dir)) throw new Error(`no tasks folder at ${dir}`);
  const all = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, e.name, "task.json");
    if (!e.isDirectory() || !fs.existsSync(file)) continue;
    let t;
    try {
      t = readJson(file);
    } catch (err) {
      throw new Error(`${file}: not valid JSON (${err.message})`);
    }
    const bad = (m) => new Error(`${file}: ${m}`);
    if (typeof t.prompt !== "string" || !t.prompt.trim()) throw bad("prompt is missing");
    const app = t.app ?? "vite";
    if (!APPS[app]) throw bad(`app must be ${Object.keys(APPS).join(" or ")}, not ${JSON.stringify(t.app)}`);
    const items = t.expect?.items ?? [];
    if (!Array.isArray(items) || items.some((i) => typeof i !== "string" && !(Array.isArray(i) && i.every((x) => typeof x === "string"))))
      throw bad("expect.items must be item names, or arrays of names for 'any one of these'");
    const shots = Array.isArray(t.shots) && t.shots.length ? t.shots : [{ name: "page" }];
    all.push({
      ...t,
      name: t.name ?? e.name,
      description: t.description ?? "",
      app,
      expect: { ...t.expect, items },
      shots,
      look: t.look ?? "",
      max_turns: t.max_turns ?? 60,
      timeout_seconds: t.timeout_seconds ?? 1500,
      max_budget_usd: t.max_budget_usd ?? 5,
      dir: path.join(dir, e.name),
    });
  }
  if (!all.length) throw new Error(`no tasks in ${dir} (expected <name>/task.json)`);
  const names = new Set();
  for (const t of all) {
    if (names.has(t.name)) throw new Error(`two tasks are named "${t.name}"`);
    names.add(t.name);
  }
  if (!opts.tasks) return all;
  const missing = opts.tasks.filter((n) => !names.has(n));
  if (missing.length) throw new Error(`--tasks: no task named ${missing.join(", ")} (have: ${[...names].join(", ")})`);
  return all.filter((t) => opts.tasks.includes(t.name));
}

/* ------------------------------------------------------------------ registry */

/** Local: a snapshot of a built registry, served on localhost. Remote: a deployed registry, read to fingerprint it. */
async function setupRegistry(opts, runDir) {
  if (/^https?:\/\//.test(opts.registry)) {
    const base = opts.registry;
    const get = async (name) => {
      let res;
      try {
        res = await fetch(`${base}/${name}.json`, { headers: { accept: "application/json" } });
      } catch (e) {
        throw new Error(`cannot reach ${base}/${name}.json (${e.cause?.code ?? e.message})`);
      }
      if (!res.ok) throw new Error(`${base}/${name}.json answered ${res.status}`);
      return res.text();
    };
    const index = JSON.parse(await get("registry"));
    const names = (index.items ?? []).map((i) => i.name);
    const bodies = [];
    for (const n of names) bodies.push(await get(n));
    return { mode: "remote", base, source: base, fingerprint: sha(bodies.join("\n")).slice(0, 8), items: names, server: null };
  }
  if (!fs.existsSync(path.join(opts.registry, "registry.json")))
    throw new Error(
      `no registry at ${opts.registry} (registry.json is missing).\n  Run: npm run gen:registry --prefix gallery\n  or pass --registry <built dir> or --registry https://littmd.vercel.app/r`,
    );
  // A snapshot, so a generator run during the test cannot change the registry halfway through.
  const copy = path.join(runDir, "registry");
  fs.cpSync(opts.registry, copy, { recursive: true });
  const index = readJson(path.join(copy, "registry.json"));
  const names = (index.items ?? []).map((i) => i.name);
  const missing = names.filter((n) => !fs.existsSync(path.join(copy, `${n}.json`)));
  if (missing.length) throw new Error(`registry.json lists items that have no file in ${opts.registry}: ${missing.map((m) => m + ".json").join(", ")}`);
  const fingerprint = sha(names.map((n) => fs.readFileSync(path.join(copy, `${n}.json`), "utf8")).join("\n")).slice(0, 8);
  const served = await startRegistryServer(copy, PROD_ORIGIN);
  return { mode: "local", base: `http://localhost:${served.port}/r`, source: opts.registry, fingerprint, items: names, server: served.server, requests: served.requests };
}

/** The litt items a host has installed, read from its files (the same rule the grader uses). */
function installedItems(files) {
  const out = new Set();
  for (const f of files) {
    const m = /(?:^|\/)components\/litt\/([^/]+)\.tsx?$/.exec(f);
    if (m) out.add(m[1]);
    else if (/(?:^|\/)lib\/litt\/motion\//.test(f)) out.add("motion");
    else if (/(?:^|\/)lib\/litt\/glide\.tsx?$/.test(f)) out.add("glide");
  }
  return [...out].sort();
}

/* ------------------------------------------------------------------ one run */

async function loadGrader() {
  const file = process.env.LITT_AGENT_GRADER ? path.resolve(process.env.LITT_AGENT_GRADER) : path.join(here, "test-agents.grade.mjs");
  if (!fs.existsSync(file)) throw new Error(`the grader module is missing: ${file}`);
  const mod = await import(pathToFileURL(file).href);
  if (typeof mod.grade !== "function") throw new Error(`${file} does not export grade()`);
  return { grade: mod.grade, CHECKS: Array.isArray(mod.CHECKS) ? mod.CHECKS : DEFAULT_CHECKS, file };
}

async function runOne({ opts, task, app, n, runDir, tpl, registry, grader, getBrowser }) {
  const name = `${task.name}-${app}-${n}`;
  const runPath = path.join(runDir, name);
  const appDir = path.join(runPath, "app");
  const shotsDir = path.join(runPath, "shots");
  const logsDir = path.join(runPath, "logs");
  const transcriptFile = path.join(runPath, "transcript.jsonl");
  const L = (m) => console.log(`[${task.name} ${app} #${n}] ${m}`);
  const rec = {
    task: task.name,
    app,
    run: n,
    name,
    dir: runPath,
    verdict: "error",
    arm: opts.noSkill ? "without the litt-md skill" : "with the litt-md skill",
    agent: null,
    installedItems: [],
    files: { added: [], modified: [], removed: [] },
    checks: [],
    judgeCostUsd: 0,
    problems: [],
    error: null,
  };
  const t0 = Date.now();
  try {
    ensureDir(shotsDir);
    ensureDir(logsDir);
    L(`copying the ${app} template`);
    await copyDir(tpl.dir, appDir);
    if (registry.mode === "local") {
      const cjFile = path.join(appDir, "components.json");
      const cj = readJson(cjFile);
      cj.registries = { ...cj.registries, "@litt": `${registry.base}/{name}.json` };
      writeJson(cjFile, cj);
    }
    const before = snapshot(appDir);

    const timeoutMs = task.timeout_seconds * 1000;
    const budget = opts.maxBudget ?? task.max_budget_usd;
    L(
      opts.fakeAgent
        ? `fake agent ${shortPath(opts.fakeAgent)}`
        : `agent: claude -p, model ${opts.model}, ${opts.noSkill ? "no skill" : "with the litt-md plugin"}, up to ${task.max_turns} turns, ${fmtDur(timeoutMs)}, $${budget}`,
    );
    const agentStart = Date.now();
    const transcript = await runAgentProcess(opts, {
      cwd: appDir,
      prompt: task.prompt,
      file: transcriptFile,
      errFile: path.join(logsDir, "agent.stderr.log"),
      commandFile: path.join(logsDir, "agent.command.txt"),
      maxTurns: task.max_turns,
      timeoutMs,
      budgetUsd: budget,
      plugin: !opts.noSkill,
      log: (m) => L(m),
      fake: opts.fakeAgent ? { script: opts.fakeAgent, task: task.name, registryBase: registry.base, litt: registry.mode === "local" ? "@litt" : registry.base } : null,
    });
    const stderrText = (() => {
      try {
        return fs.readFileSync(path.join(logsDir, "agent.stderr.log"), "utf8").trim();
      } catch {
        return "";
      }
    })();
    let problem = agentProblem(transcript, timeoutMs);
    if (problem && !transcript.result && stderrText) problem += `: ${oneLine(stderrText.split("\n").slice(-3).join(" "), 240)}`;
    const r = transcript.result;
    L(
      `agent done: ${transcript.ok ? "finished" : "NOT finished"}, ${r?.turns ?? "?"} turns, ${usd(r?.costUsd)}, ${fmtDur(r?.durationMs ?? Date.now() - agentStart)}, ${transcript.toolCalls.length} tool calls, skills ${JSON.stringify(transcript.skills)}`,
    );
    if (problem) {
      rec.problems.push(problem);
      L(`  ${problem}`);
    }
    if (!opts.fakeAgent && !opts.noSkill && transcript.init && !transcript.init.plugins.some((p) => /litt-md/.test(p))) {
      const m = `the litt-md plugin did not load (plugins: ${transcript.init.plugins.join(", ") || "none"})`;
      rec.problems.push(m);
      L(`  ${m}`);
    }
    if (r?.permissionDenials.length) L(`  ${r.permissionDenials.length} permission denial(s): ${[...new Set(r.permissionDenials.map((d) => d.tool_name))].join(", ")}`);
    if (!opts.fakeAgent && (refusedByClaude(transcript) || (!transcript.result && !transcript.toolCalls.length && REFUSED.test(stderrText)))) {
      const e = new Error(`claude refused the first call: ${oneLine(r?.text || stderrText, 240)}`);
      e.fatal = true;
      throw e;
    }

    if (!transcript.init && !transcript.result && !transcript.timedOut) {
      const e = new Error(
        `${opts.fakeAgent ? "the fake agent" : "claude"} printed no stream-json (exit ${transcript.exitCode})${stderrText ? `: ${oneLine(stderrText.split("\n").slice(-3).join(" "), 240)}` : ""}`,
      );
      e.fatal = true;
      throw e;
    }

    rec.agent = {
      ok: transcript.ok,
      exitCode: transcript.exitCode,
      timedOut: transcript.timedOut,
      subtype: r?.subtype ?? null,
      isError: r?.isError ?? null,
      costUsd: r?.costUsd ?? 0,
      turns: r?.turns ?? null,
      durationMs: r?.durationMs ?? Date.now() - agentStart,
      wallMs: Date.now() - agentStart,
      model: transcript.init?.model ?? null,
      version: transcript.init?.version ?? null,
      plugins: transcript.init?.plugins ?? [],
      litMdLoaded: !!transcript.init?.plugins.some((p) => /litt-md/.test(p)),
      skillsUsed: transcript.skills,
      toolCalls: transcript.toolCalls.length,
      addCommands: transcript.bash.filter((b) => /shadcn/.test(b)),
      permissionDenials: r?.permissionDenials ?? [],
      writes: transcript.writes,
      finalText: r?.text ?? "",
    };

    const after = snapshot(appDir);
    const diff = diffSnapshots(before, after);
    rec.files = diff;
    rec.installedItems = installedItems(after.keys());
    L(`files: +${diff.added.length} added, ~${diff.modified.length} modified, -${diff.removed.length} removed; litt items installed: ${rec.installedItems.join(", ") || "none"}`);

    // the grader's view of the world (C3)
    let judgeSeq = 0;
    const judge = opts.judge ? { model: opts.judge } : null;
    const ctx = {
      repoDir,
      galleryDir,
      appSpec: APPS[app],
      registry: { mode: registry.mode, base: registry.base },
      shotsDir,
      logFile: path.join(logsDir, "grade.log"),
      getBrowser,
      noSkill: opts.noSkill,
      judge,
      runClaude: async (o = {}) => {
        const seq = ++judgeSeq;
        const t = await runAgentProcess(opts, {
          ...o,
          cwd: o.cwd ?? shotsDir,
          file: path.join(runPath, `judge-${seq}.jsonl`),
          errFile: path.join(logsDir, `judge-${seq}.stderr.log`),
          commandFile: path.join(logsDir, "judge.command.txt"),
          plugin: o.plugin === true,
          model: o.model ?? opts.model,
        });
        rec.judgeCostUsd += t.result?.costUsd ?? 0;
        return t;
      },
    };
    L("grading");
    const checks = await grader.grade({ app, dir: appDir, task, transcript, diff, ctx });
    rec.checks = Array.isArray(checks) ? checks : [];
    for (const c of rec.checks) L(`  ${c.check.padEnd(8)} ${String(c.status).padEnd(5)} ${oneLine(String(c.detail ?? "").split("\n")[0], 130)}`);

    const failing = rec.checks.filter((c) => c.status === "fail");
    rec.verdict = failing.length || problem ? "fail" : "pass";
  } catch (e) {
    rec.verdict = "error";
    rec.error = String(e.message ?? e);
    rec.errorStack = String(e.stack ?? e);
    L(`harness error: ${e.message ?? e}`);
    if (e.fatal) {
      rec.fatal = true;
      rec.problems = [];
    }
  } finally {
    if (!opts.keep) rmrf(path.join(appDir, "node_modules"));
  }
  rec.wallMs = Date.now() - t0;
  try {
    const { dir: _dir, ...rest } = rec;
    fs.writeFileSync(path.join(runPath, "grade.json"), JSON.stringify(rest, null, 2) + "\n");
  } catch {
    /* the run folder is gone: nothing to write into */
  }
  return rec;
}

/* ------------------------------------------------------------------ output */

const mark = (s) => (s === "pass" ? "ok" : s === "fail" ? "FAIL" : s === "warn" ? "warn" : "-");
const checkStatus = (rec, check) => mark(rec.checks.find((c) => c.check === check)?.status);

function tableRows(recs, CHECKS) {
  const head = ["task", "app", "run", ...CHECKS, "|", "cost", "turns", "time"];
  const rows = recs.map((r) => [
    r.task,
    r.app,
    `#${r.run}`,
    ...CHECKS.map((c) => checkStatus(r, c)),
    "|",
    r.agent || r.verdict !== "error" ? usd((r.agent?.costUsd ?? 0) + r.judgeCostUsd) : "error",
    r.agent?.turns != null ? String(r.agent.turns) : "-",
    fmtDur(r.agent?.durationMs ?? r.wallMs),
  ]);
  return { head, rows };
}

function tableText(recs, CHECKS) {
  const { head, rows } = tableRows(recs, CHECKS);
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const fmt = (r) => r.map((c, i) => c.padEnd(widths[i])).join("  ").trimEnd();
  return [fmt(head), fmt(widths.map((w) => "-".repeat(w))), ...rows.map(fmt)].join("\n");
}

function tableMarkdown(recs, CHECKS) {
  const { head, rows } = tableRows(recs, CHECKS);
  const keep = head.map((h) => h !== "|");
  const pick = (r) => r.filter((_, i) => keep[i]);
  const cols = pick(head);
  return [`| ${cols.join(" | ")} |`, `|${cols.map(() => " --- ").join("|")}|`, ...rows.map((r) => `| ${pick(r).join(" | ")} |`)].join("\n");
}

/** Everything a person needs to see about what went wrong, one entry per problem. */
function failureList(recs) {
  const out = [];
  for (const r of recs) {
    const who = `${r.task} ${r.app} #${r.run}`;
    if (r.verdict === "error") out.push({ who, what: "harness error", detail: r.error ?? "" });
    for (const p of r.problems) out.push({ who, what: "agent", detail: p });
    for (const c of r.checks) if (c.status === "fail") out.push({ who, what: c.check, detail: String(c.detail ?? "") });
  }
  return out;
}
const warnList = (recs) =>
  recs.flatMap((r) => r.checks.filter((c) => c.status === "warn").map((c) => ({ who: `${r.task} ${r.app} #${r.run}`, what: c.check, detail: String(c.detail ?? "") })));

function writeReport(file, summary) {
  const { recs, CHECKS, opts, registry, versions, commit, totalMs, runDir, verdict } = summary;
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const failures = failureList(recs);
  const lines = [];
  lines.push(`## ${stamp} - ${verdict}`);
  lines.push("");
  const loaded = recs.filter((r) => r.agent?.litMdLoaded).length;
  if (opts.fakeAgent) lines.push(`Arm: **fake agent** (\`${shortPath(opts.fakeAgent)}\`), no Claude was run. This tests the harness, not the skill.`);
  else if (opts.noSkill) lines.push(`Arm: **without the litt-md skill** (baseline). The plugin was not loaded${loaded ? ` (but it showed up in ${loaded} run(s))` : ""}; the skill check is skipped.`);
  else lines.push(`Arm: **with the litt-md skill** (plugin directory = this repo; it loaded in ${loaded} of ${recs.length} run(s)).`);
  lines.push("");
  const cv = [...new Set(recs.map((r) => r.agent?.version).filter(Boolean))];
  const cm = [...new Set(recs.map((r) => r.agent?.model).filter(Boolean))];
  lines.push(`Claude Code ${cv.join(", ") || "n/a"}, model ${cm.join(", ") || opts.model + " (requested)"}. litt.md ${commit}.`);
  lines.push(`Hosts: ${Object.entries(versions).map(([a, v]) => `${a}: ${v.summary}`).join(" | ")}. The agent runs \`npx shadcn@latest\`; the host pins shadcn ${versions[Object.keys(versions)[0]]?.all?.shadcn ?? "?"}.`);
  lines.push(
    `Registry: ${registry.mode === "local" ? `local snapshot of ${registry.source} (served on localhost, \`@litt\` registered in components.json)` : `deployed, ${registry.source} (components.json untouched)`}; ${registry.items.length} items, fingerprint ${registry.fingerprint}.`,
  );
  const cost = recs.reduce((s, r) => s + (r.agent?.costUsd ?? 0) + r.judgeCostUsd, 0);
  lines.push(`Judge: ${opts.judge ? opts.judge : "off"}. Runs per task: ${opts.runs}. Cost ${usd(cost)}. Runtime ${fmtDur(totalMs)}. Run folder: ${runDir}`);
  lines.push("");
  if (recs.length) lines.push(tableMarkdown(recs, CHECKS), "");
  if (failures.length) {
    lines.push("### Failures");
    for (const f of failures) {
      lines.push("", `- **${f.who} / ${f.what}**`, "  ```", ...f.detail.split("\n").slice(0, 16).map((l) => "  " + l), "  ```");
    }
    lines.push("");
  }
  if (recs.some((r) => r.agent)) lines.push("### Runs", "");
  for (const r of recs) {
    if (!r.agent) continue;
    lines.push(
      `- ${r.task} ${r.app} #${r.run}: installed ${r.installedItems.join(", ") || "none"}; add commands ${r.agent.addCommands.length}; skills ${JSON.stringify(r.agent.skillsUsed)}; permission denials ${r.agent.permissionDenials.length}; files +${r.files.added.length} ~${r.files.modified.length}`,
    );
  }
  const section = lines.join("\n");
  const title = "# litt agent test: findings, newest first\n\n";
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const body = existing.startsWith("# ") ? existing.replace(/^# [^\n]*\n\n?/, "") : existing;
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, title + section + "\n\n" + body);
}

async function gitCommit() {
  const head = await run("git", ["-C", repoDir, "rev-parse", "--short", "HEAD"], { timeout: 15000 });
  if (head.code !== 0) return "(not a git checkout)";
  const dirty = await run("git", ["-C", repoDir, "status", "--porcelain"], { timeout: 15000 });
  return `${head.out.trim()}${dirty.code === 0 && dirty.out.trim() ? " + uncommitted changes" : ""}`;
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
  const tasks = loadTasks(opts);
  const grader = await loadGrader();
  const runDir = path.join(opts.out, `run-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  ensureDir(path.join(runDir, "logs"));
  const plan = tasks.flatMap((task) => Array.from({ length: opts.runs }, (_, i) => ({ task, app: opts.app ?? task.app, n: i + 1 })));

  let registry = null;
  let browser = null;
  const getBrowser = async () => (browser ??= await launchChromium());
  const recs = [];
  const templates = {};
  let setupError = null;
  let abortReason = null;
  let commit = "";
  try {
    registry = await setupRegistry(opts, runDir);
    commit = await gitCommit();
    console.log("litt agent test");
    console.log(`  arm        ${opts.fakeAgent ? "fake agent (no Claude)" : opts.noSkill ? "WITHOUT the litt-md skill (baseline)" : "with the litt-md skill"}`);
    console.log(
      `  registry   ${registry.mode}: ${registry.source} (${registry.items.length} items, fingerprint ${registry.fingerprint}${registry.mode === "local" ? `, served at ${registry.base}` : ", components.json untouched"})`,
    );
    console.log(`  litt.md    ${commit}`);
    console.log(`  model      ${opts.fakeAgent ? "n/a" : opts.model}${opts.judge ? `   judge ${opts.judge}` : "   judge off"}`);
    console.log(`  tasks      ${plan.map((p) => `${p.task.name} (${p.app})${opts.runs > 1 ? " x" + opts.runs : ""}`).filter((v, i, a) => a.indexOf(v) === i).join(", ")}`);
    console.log(`  grader     ${shortPath(grader.file)}`);
    console.log(`  run folder ${runDir}\n`);

    const tctx = { opts: { work: opts.work, fresh: false, base: "base" }, runDir, getBrowser };
    for (const app of [...new Set(plan.map((p) => p.app))]) templates[app] = await ensureTemplate(app, tctx);

    for (const p of plan) {
      const rec = await runOne({ opts, ...p, runDir, tpl: templates[p.app], registry, grader, getBrowser });
      recs.push(rec);
      if (rec.fatal) {
        abortReason = rec.error;
        console.error(`\naborting the remaining runs: ${abortReason}`);
        break;
      }
    }
  } catch (e) {
    setupError = e.message ?? String(e);
    console.error(`\nharness setup failed: ${setupError}`);
  } finally {
    killAgents();
    if (browser) await browser.close().catch(() => {});
    if (registry?.server) registry.server.close();
    killAll();
  }

  const CHECKS = grader.CHECKS;
  const versions = Object.fromEntries(Object.entries(templates).map(([a, t]) => [a, t.versions]));
  const failures = failureList(recs);
  const harnessError = !!setupError || recs.some((r) => r.verdict === "error");
  const allPassed = !harnessError && recs.length > 0 && recs.every((r) => r.verdict === "pass");
  const exit = harnessError ? 2 : allPassed ? 0 : 1;
  const totalMs = Date.now() - t0;
  const verdict = setupError
    ? "SETUP FAILED"
    : abortReason
      ? "ABORTED"
      : harnessError
      ? "HARNESS ERROR"
      : allPassed
        ? "PASS"
        : `FAIL (${recs.filter((r) => r.verdict !== "pass").length} of ${recs.length} run${recs.length > 1 ? "s" : ""})`;

  if (recs.length) {
    console.log(`\n${tableText(recs, CHECKS)}\n`);
    if (failures.length) {
      console.log(`${failures.length} problem(s):`);
      for (const f of failures) {
        const [first, ...rest] = f.detail.split("\n").filter((l) => l.trim());
        console.log(`  - ${f.who} / ${f.what}: ${first ?? ""}`);
        for (const l of rest.slice(0, 11)) console.log(`      ${l}`);
        if (rest.length > 11) console.log(`      … ${rest.length - 11} more line(s)`);
      }
      console.log("");
    }
    const warns = warnList(recs);
    if (warns.length) {
      console.log(`${warns.length} warning(s):`);
      for (const w of warns) console.log(`  - ${w.who} / ${w.what}: ${oneLine(w.detail.split("\n")[0], 160)}`);
      console.log("");
    }
    if (allPassed) console.log("every run passed every required check\n");
  }
  const cost = recs.reduce((s, r) => s + (r.agent?.costUsd ?? 0) + r.judgeCostUsd, 0);
  if (!recs.length) rmrf(runDir); // setup failed before any run: nothing worth keeping
  console.log(`${verdict}   cost ${usd(cost)}   runtime ${fmtDur(totalMs)}${recs.length ? `   runs ${runDir}` : ""}`);

  const summary = { recs, CHECKS, opts, registry: registry ?? { mode: "-", source: "-", items: [], fingerprint: "-" }, versions, commit, totalMs, runDir, verdict };
  if (opts.json) {
    ensureDir(path.dirname(opts.json));
    writeJson(opts.json, {
      finishedAt: new Date().toISOString(),
      verdict,
      exit,
      setupError,
      abortReason,
      arm: opts.fakeAgent ? "fake agent" : opts.noSkill ? "without the litt-md skill" : "with the litt-md skill",
      litt: commit,
      model: opts.model,
      judge: opts.judge,
      claudeVersions: [...new Set(recs.map((r) => r.agent?.version).filter(Boolean))],
      registry: registry && { mode: registry.mode, source: registry.source, base: registry.base, fingerprint: registry.fingerprint, items: registry.items },
      hosts: versions,
      runDir,
      costUsd: cost,
      totalMs,
      runs: recs,
    });
    console.log(`json ${opts.json}`);
  }
  if (opts.report) {
    writeReport(opts.report, summary);
    console.log(`report ${opts.report}`);
  }
  return exit;
}

process.on("unhandledRejection", (e) => {
  killAgents();
  killAll();
  console.error(e?.stack ?? e);
  process.exit(2);
});

main().then(
  (code) => process.exit(code),
  (e) => {
    killAgents();
    killAll();
    console.error(e.message ?? e);
    process.exit(2);
  },
);
