#!/usr/bin/env node
/**
 * A stand-in for Claude, so the agent test harness can be tried at zero cost.
 *
 *   node evals/agents/fake-agent.mjs <task> [--bad] [--no-skill]
 *
 * Run it inside a host app (the runner does: `test-agents.mjs --fake-agent <this file>` runs
 * `node <this file> <task>` with the host as the working directory). It prints stream-json lines
 * on stdout, in the shapes `claude -p --output-format stream-json --verbose` prints, and
 * does real work in the host: it runs the shadcn CLI and writes files.
 *
 * Environment, all set by the runner:
 *   LITT_AGENT_PROMPT    the task prompt (only echoed in the first message)
 *   LITT_AGENT_REGISTRY  the registry base URL, such as http://localhost:1234/r
 *   LITT_AGENT_LITT      "@litt" when the host's components.json registers it, else the base URL
 *
 * Tasks:
 *   settings-dialog      a scripted, correct solution: loads the skill, installs dialog, input,
 *                        checkbox and button from the litt registry, and composes them in src/App.tsx.
 *   anything else        prints an init and a result saying there is no scripted solution (and
 *                        changes nothing), so the harness sees an agent that did nothing.
 *
 * Flags (or the matching environment variable, for the runner, which only passes the task name):
 *   --bad      LITT_FAKE_BAD=1       skip the install and hand-roll the dialog the way an agent
 *                                    without the skill would: Tailwind defaults, a bold weight, a
 *                                    literal duration. It still builds and loads, so registry,
 *                                    composed, tokens and motion should fail and the rest pass.
 *   --no-skill LITT_FAKE_NO_SKILL=1  do not load the litt-md plugin or call the Skill tool.
 *
 * Exit code: 0 when the run finished, 1 when a command it ran failed.
 * stdout carries only JSON lines. Anything else goes to stderr.
 */
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Same CLI version the install test pins (PINS.shadcn in gallery/scripts/test-registry.mjs).
const SHADCN = "shadcn@4.21.0";
const MOTION = "motion@12.43.0"; // the version the gallery uses; only the --bad run installs it

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const host = process.cwd();
const args = process.argv.slice(2);
const flag = (name, env) => args.includes(`--${name}`) || process.env[env] === "1";
const task = args.find((a) => !a.startsWith("--")) ?? "";
const bad = flag("bad", "LITT_FAKE_BAD");
const noSkill = flag("no-skill", "LITT_FAKE_NO_SKILL");

const registry = process.env.LITT_AGENT_REGISTRY || "https://littmd.vercel.app/r";
const litt = process.env.LITT_AGENT_LITT || "@litt";
const prompt = process.env.LITT_AGENT_PROMPT || "";

/* ------------------------------------------------------------------ stream-json */

const sessionId = randomUUID();
const model = "fake-agent";
const t0 = Date.now();
let turns = 0;

const emit = (event) => process.stdout.write(JSON.stringify({ ...event, session_id: sessionId, uuid: randomUUID() }) + "\n");

function init() {
  emit({
    type: "system",
    subtype: "init",
    cwd: host,
    tools: ["Bash", "Edit", "Glob", "Grep", "Read", "Skill", "Write"],
    mcp_servers: [],
    model,
    permissionMode: "default",
    claude_code_version: "0.0.0-fake",
    plugins: noSkill ? [] : [{ name: "litt-md", path: repoDir, source: "litt-md@inline" }],
    skills: noSkill ? [] : ["litt-md:litt-md"],
  });
}

function say(text) {
  turns++;
  emit({
    type: "assistant",
    message: { model, type: "message", role: "assistant", content: [{ type: "text", text }] },
    parent_tool_use_id: null,
  });
}

/** An assistant tool_use. Returns the id to hand to toolResult. */
function toolUse(name, input) {
  turns++;
  const id = "toolu_fake_" + randomUUID().replace(/-/g, "").slice(0, 20);
  emit({
    type: "assistant",
    message: { model, type: "message", role: "assistant", content: [{ type: "tool_use", id, name, input }] },
    parent_tool_use_id: null,
  });
  return id;
}

function toolResult(id, content, isError = false) {
  emit({
    type: "user",
    message: { role: "user", content: [{ tool_use_id: id, type: "tool_result", content, is_error: isError }] },
    parent_tool_use_id: null,
  });
}

function finish(text, { isError = false } = {}) {
  emit({
    type: "result",
    subtype: isError ? "error_during_execution" : "success",
    is_error: isError,
    num_turns: turns,
    duration_ms: Date.now() - t0,
    duration_api_ms: 0,
    total_cost_usd: 0,
    result: text,
    permission_denials: [],
    stop_reason: "end_turn",
  });
  process.exitCode = isError ? 1 : 0;
}

/* ------------------------------------------------------------------ tools */

/** The Write tool: a path under the host, absolute like Claude's own. */
function write(rel, content, why) {
  const file = path.join(host, rel);
  if (why) say(why);
  const id = toolUse("Write", { file_path: file, content });
  const existed = fs.existsSync(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  toolResult(id, `${existed ? "The file" : "File created successfully at:"} ${file}${existed ? " has been updated." : ""}`);
}

/** The Bash tool: run a command in the host, with the output as the tool result. */
function bash(command, argv, why) {
  if (why) say(why);
  const id = toolUse("Bash", { command, description: why ?? command });
  return new Promise((resolve) => {
    let out = "";
    let timedOut = false;
    const env = { ...process.env, CI: "1", NO_COLOR: "1", FORCE_COLOR: "0", npm_config_yes: "true", npm_config_audit: "false", npm_config_fund: "false" };
    const child = spawn(argv[0], argv.slice(1), { cwd: host, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
    const take = (d) => {
      out += d;
      if (out.length > 1e6) out = out.slice(-5e5);
    };
    child.stdout.on("data", take);
    child.stderr.on("data", take);
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }, 420000);
    child.on("error", (e) => {
      out += String(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const ok = code === 0 && !timedOut;
      const tail = out.trim().split("\n").slice(-40).join("\n").slice(-2000);
      toolResult(id, (timedOut ? "Command timed out.\n" : "") + (tail || "(no output)"), !ok);
      resolve({ ok, out });
    });
  });
}

/** `shadcn add`, once more when the only trouble was the network. */
async function shadcnAdd(items, why) {
  const command = `npx ${SHADCN} add ${items.join(" ")} --yes`;
  let r = await bash(command, ["npx", "--yes", SHADCN, "add", ...items, "--yes"], why);
  if (!r.ok && /ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i.test(r.out)) {
    r = await bash(command, ["npx", "--yes", SHADCN, "add", ...items, "--yes"], "That was a network error, not the registry. Trying once more.");
  }
  return r;
}

/** A registry item as the add command spells it: `@litt/<x>`, or `<base>/<x>.json` when @litt is not registered. */
const item = (name) => (litt.startsWith("@") ? `${litt}/${name}` : `${litt.replace(/\/+$/, "")}/${name}.json`);

/* ------------------------------------------------------------------ settings-dialog */

/** The correct solution: the installed litt components, composed, with the host's litt- names. */
const GOOD_APP = `import { useState, type FormEvent } from "react";
import { Button } from "@/components/litt/button";
import { Checkbox } from "@/components/litt/checkbox";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/litt/dialog";
import { SettingsIcon } from "@/components/litt/icons";
import { TextField } from "@/components/litt/input";

type Prefs = { name: string; email: string; notify: boolean };

const START: Prefs = { name: "Nick", email: "nick@litt.design", notify: true };

function SettingsDialog({ prefs, onSave }: { prefs: Prefs; onSave: (next: Prefs) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(prefs);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(draft);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(prefs); // a cancelled edit never sticks
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button icon={<SettingsIcon />}>Settings</Button>
      </DialogTrigger>
      <DialogContent
        title="Settings"
        description="How you show up on litt.design."
        footer={
          <>
            <DialogClose asChild>
              <Button size="lg">Cancel</Button>
            </DialogClose>
            <Button size="lg" variant="primary" type="submit" form="settings-form">
              Save
            </Button>
          </>
        }
      >
        <form id="settings-form" onSubmit={submit} noValidate className="grid gap-6">
          <TextField
            label="Display name"
            autoComplete="name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
          />
          <Checkbox
            label="Email me when a build finishes"
            description="One note per deploy, success or failure."
            checked={draft.notify}
            onChange={(e) => setDraft({ ...draft, notify: e.target.checked })}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function App() {
  const [prefs, setPrefs] = useState(START);
  const [saved, setSaved] = useState(false);

  return (
    <div className="min-h-svh bg-litt-canvas text-litt-fg">
      <header className="mx-auto flex max-w-litt-wide items-center justify-between px-litt-gutter py-6">
        <span className="text-litt-body">litt.design</span>
        <SettingsDialog
          prefs={prefs}
          onSave={(next) => {
            setPrefs(next);
            setSaved(true);
          }}
        />
      </header>

      <main className="mx-auto max-w-litt-wide px-litt-gutter py-litt-section">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="grid content-start gap-6 md:col-span-7">
            <h1 className="text-litt-display text-litt-fg">Sites and systems for small teams</h1>
            <p className="max-w-litt-reading text-litt-reading text-litt-fg-muted">
              Litt Studio designs brand systems and builds them in Framer. This week: the Halo site goes to review and the
              Northwind rebrand ships.
            </p>
          </div>

          <section aria-labelledby="account" className="grid content-start gap-3 md:col-span-4 md:col-start-9">
            <h2 id="account" className="text-litt-small text-litt-fg-subtle">
              Signed in as
            </h2>
            <p className="text-litt-body text-litt-fg">{prefs.name}</p>
            <p className="text-litt-small text-litt-fg-muted">{prefs.email}</p>
            <p className="text-litt-small text-litt-fg-subtle">
              {prefs.notify ? "Build emails are on." : "Build emails are off."}
            </p>
            <p role="status" className="min-h-5 text-litt-small text-litt-success">
              {saved ? "Settings saved." : ""}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
`;

/** The wrong solution: what a run without the skill tends to write. Every line below is a lint failure on purpose. */
const BAD_APP = `import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-zinc-950 dark:text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold">litt.design</span>
        <Button onClick={() => setOpen(true)}>Settings</Button>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-24">
        <h1 className="text-5xl font-bold">Sites and systems for small teams</h1>
        <p className="mt-4 text-lg text-gray-500">Litt Studio designs brand systems and builds them in Framer.</p>
      </main>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            className="w-full max-w-md rounded-lg bg-zinc-900 p-6 text-white shadow-xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold">Settings</h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
            >
              <label className="block text-sm font-medium">
                Display name
                <input className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm" defaultValue="Nick" />
              </label>
              <label className="block text-sm font-medium">
                Email
                <input
                  type="email"
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm"
                  defaultValue="nick@litt.design"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked /> Email me when a build finishes
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="rounded-md px-4 py-2 text-sm text-zinc-300" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white">
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
`;

async function settingsDialog() {
  if (!fs.existsSync(path.join(host, "components.json"))) {
    say("There is no components.json here, so this is not a shadcn app.");
    return finish("fake-agent: run me inside a host app (no components.json in " + host + ").", { isError: true });
  }
  say(`Task: ${prompt ? prompt.split("\n")[0].slice(0, 160) : "settings-dialog"}`);

  if (!noSkill) {
    say("This is UI work for Nick, so I am loading the litt-md skill first.");
    const id = toolUse("Skill", { skill: "litt-md:litt-md" });
    toolResult(id, "Launching skill: litt-md:litt-md");
  }

  if (bad) {
    const r = await bash(`npm install ${MOTION}`, ["npm", "install", MOTION, "--no-audit", "--no-fund"], "I will build the dialog by hand, with motion for the entrance.");
    if (!r.ok) return finish("npm install failed.", { isError: true });
    write("src/App.tsx", BAD_APP, "Writing the page and a hand-rolled dialog.");
    return finish("Done (the bad variant): a hand-rolled dialog in src/App.tsx, nothing from the litt registry.");
  }

  const items = ["dialog", "input", "checkbox", "button"].map(item);
  const r = await shadcnAdd(items, "Installing litt's dialog, input, checkbox and button from the registry before I write any markup.");
  if (!r.ok) return finish("shadcn add failed, so nothing was written.", { isError: true });

  write("src/App.tsx", GOOD_APP, "Composing the installed components on the home page. The dialog owns its motion, so the page adds none.");
  return finish("Added a Settings button on the home page. It opens litt's Dialog with a display name, an email and a notifications checkbox, with Cancel and Save in the footer.");
}

/* ------------------------------------------------------------------ main */

init();
if (task === "settings-dialog") {
  await settingsDialog();
} else {
  say(`The fake agent has no scripted solution for "${task || "(no task given)"}".`);
  finish(`fake-agent has no scripted solution for "${task || "(no task given)"}". It changed nothing.`);
}
