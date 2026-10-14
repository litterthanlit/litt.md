# Agent tests

These tests give Claude a fresh app and a task, then grade what it built with litt's own checks. They answer one question the other evals cannot: when Claude builds real UI in a real project, does it use litt's tested components and stay inside the system?

The runner is `gallery/scripts/test-agents.mjs`. The grader is `gallery/scripts/test-agents.grade.mjs`. This folder holds the tasks, a fake agent for testing the harness, and these notes.

## Why this is not `claude plugin eval`

`claude plugin eval` grades with regex, `tool_used`, `tool_order`, `file_exists`, `llm` and `baseline`. It has no command or exit-code grader, so it cannot run a typecheck, a production build or a browser. It also cannot start from a real app. The cases in `evals/*/case.yaml` stay as they are: they check that the skill loads and that code shown in chat uses the plain token names. They never write a file.

So this runner drives `claude -p` itself, inside a copy of the same Vite and Next.js host apps the install test uses (`npm run test:registry --prefix gallery`), and grades the result.

Do not add a `case.yaml` or a `prompt.md` in this folder. `claude plugin eval` would pick them up.

## Run it

From the repo root:

```bash
npm run test:agents --prefix gallery -- --tasks settings-dialog
```

Useful flags (the runner's `--help` lists all of them):

| Flag | What it does |
|---|---|
| `--tasks a,b` | Run only these tasks. The default is all four. |
| `--runs 3` | Repeat each task. One run is one sample, and Claude varies. |
| `--model sonnet` | The model that builds. |
| `--no-skill` | The baseline arm: the same task without the litt-md plugin. Compare its table with a normal run to see what the skill adds. |
| `--judge [model]` | Also let a Claude judge read the screenshots against the task's `look` rubric. The judge is Opus unless you name a model, so it is not the model it grades. Adds up to $1 per run. |
| `--registry <dir or url>` | Where the components come from. The default is your working tree (`gallery/public/r`, built with `npm run gen:registry --prefix gallery`). Use `https://littmd.vercel.app/r` to test what is deployed. |
| `--fake-agent ../evals/agents/fake-agent.mjs` | Run the fake agent instead of Claude. Free. See below. |
| `--report <file>` / `--json <file>` | Write findings (markdown, newest first) or everything (JSON). |
| `--keep` | Keep each run's `app/node_modules`, so you can open the app. |

It needs Node 20 or later, network access (npm and the registry), Chromium through Playwright, and a logged-in `claude` CLI. The header of `test-agents.mjs` has the container notes.

Exit code: 0 when every required check passes, 1 when one fails, 2 on a harness error.

## What a run does

1. Copies the cached host app, and in local mode registers `@litt` in its `components.json`.
2. Runs `claude -p` in it with your prompt, the litt-md plugin, and a short list of allowed tools.
3. Grades the app that comes out. Each run keeps its `transcript.jsonl`, `shots/` and `grade.json` under `$TMPDIR/litt-agent-test/`.

The prompt is the only instruction, plus one line the runner appends to the system prompt: Claude is running non-interactively and nobody can answer questions. Neither mentions the registry, the skill or litt's tokens. Finding them is what is being tested.

## The checks

A failed required check fails the run. `warn` and `skip` do not.

| Check | It passes when |
|---|---|
| `skill` | The `litt-md` skill was loaded. Skipped with `--no-skill`. |
| `registry` | Every item in the task's `expect.items` ended up installed from the litt registry (in `components/litt/`, or `lib/litt/` for motion and glide). Warns if the agent also added shadcn components of its own. |
| `composed` | The agent's files import the installed litt components, use each expected one, did not rewrite one by hand, and did not edit anything under `components/litt/` or `lib/litt/`. |
| `tokens` | The code the agent wrote has no off-system values: radii, weights, shadows, colors or type sizes. It runs `lint-litt.mjs --host` on those files. |
| `motion` | Motion goes through the tiers: the litt motion hooks, or the `--litt-dur-*` tokens with their ease. No literal durations, no Tailwind easing. |
| `tsc` | The typecheck passes. |
| `build` | The production build passes. |
| `page` | The built page loads in Chromium, light and dark, at 1440 and 390 wide, with no console error and no horizontal overflow at 390. It also takes the task's extra screenshots (open the dialog, press a key chord). |
| `look` | Only with `--judge`. A Claude judge reads the screenshots against the task's `look` rubric. |

## The tasks

| Task | App | What Nick asks for | Must install |
|---|---|---|---|
| `settings-dialog` | Vite | A Settings button that opens a form dialog | `dialog`, `input`, `button`, `checkbox` |
| `pricing-section` | Vite | The home page as a three-tier pricing section | `button` |
| `project-list` | Next.js | The studio's projects, filtered by status | `list` |
| `command-menu` | Vite | A ⌘K menu with a visible shortcut hint | `command-menu`, `kbd` |

Each prompt reads like a message from Nick, says where the work goes (the home page), and says it is litt's own site. Without that last line the skill stops to ask whether it is client work, and nobody is there to answer.

## The fake agent

`fake-agent.mjs` stands in for Claude, so you can test the harness for free. It prints the same stream-json lines `claude -p` prints and does real work in the host: it runs the shadcn CLI and writes files.

```bash
npm run test:agents --prefix gallery -- --tasks settings-dialog --fake-agent ../evals/agents/fake-agent.mjs
LITT_FAKE_BAD=1 npm run test:agents --prefix gallery -- --tasks settings-dialog --fake-agent ../evals/agents/fake-agent.mjs
```

- The first run is the correct solution for `settings-dialog`: it loads the skill, installs the four components and composes them. Every check should pass (`look` is skipped without `--judge`).
- With `LITT_FAKE_BAD=1` it skips the install and hand-rolls the dialog with `rounded-lg`, `bg-zinc-900`, `shadow-xl`, `font-semibold` and a literal duration. It still builds and loads, so `skill`, `tsc`, `build` and `page` pass, and `registry`, `composed`, `tokens` and `motion` should fail. If one of those four passes, the grader has a hole.
- `LITT_FAKE_NO_SKILL=1` leaves out the plugin and the Skill call.
- Any other task prints "no scripted solution" and changes nothing, so the grader sees an app nobody touched.

You can also run it by hand inside a host app: `node evals/agents/fake-agent.mjs settings-dialog [--bad] [--no-skill]`.

## Add a task

Make `evals/agents/<name>/task.json`:

```json
{
  "name": "settings-dialog",
  "description": "One line: what it tests.",
  "app": "vite",
  "prompt": "What Nick would type.",
  "expect": { "items": ["dialog", "input", "button", "checkbox"] },
  "shots": [
    { "name": "page" },
    { "name": "open", "click": "role=button[name=/settings/i] >> nth=0", "wait": 700 }
  ],
  "look": "Claims for the screenshot judge.",
  "max_turns": 60,
  "timeout_seconds": 1500,
  "max_budget_usd": 5
}
```

- `app` is `vite` or `next`. The prompt says where the work goes (`src/App.tsx` or `app/page.tsx` is the home page) and that it is litt's own site.
- `expect.items` are registry item names that must end up installed. An array inside the list means any one of these. Check them against the component's gallery page (`gallery/src/gallery/pages/`): ask only for what the registry makes necessary. For example `list` already brings the status filters and the status tag, so `project-list` does not also ask for `segmented`, `tabs` or `tag`.
- `shots` start with the page as loaded. Each later shot does one `click` (a Playwright selector) or one `press` (a key chord), waits `wait` ms, then takes a screenshot. Component entrances take a few hundred ms, so wait at least 600. Test a selector against a real build before you rely on it.
- `look` is 4 to 7 claims a judge can check from a screenshot: what is on screen, where, in which state. Claims about the system (one accent fill, weight 400, slight radius, glass only on floating surfaces, left-aligned and airy, no emoji, no gradient text) belong here, written as things you can see. Name the shots a claim is about (`page-*`, `open-*`).
- Use real studio content. No lorem ipsum.

Run a new task with `--fake-agent` first to check it loads. The fake agent only has a solution for `settings-dialog`, so a new task should fail its checks with "no scripted solution". That is the expected result.

## Cost and results

A real run is paid. In the first nine Sonnet runs (October 2026), one task cost $0.26 to $0.38 for the agent and took one to one and a half minutes of agent time, plus about 30 seconds to grade. `--judge` with Opus added $0.11 to $0.23. All four tasks with the judge came to about $1.90 and six and a half minutes. Each task is capped by its `max_budget_usd` and `timeout_seconds`. The fake agent costs nothing.

Results are not committed. Runs live under `$TMPDIR/litt-agent-test/`, and `--report` and `--json` write wherever you point them. When a run finds something worth keeping (a check that fails often, a gap in the registry), write it up in the repo notes or fix the skill or the component, and run the task again.
