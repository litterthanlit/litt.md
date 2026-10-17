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
| `--tasks a,b` | Run only these tasks. The default is all of them. |
| `--runs 3` | Repeat each task. One run is one sample, and Claude varies. |
| `--model sonnet` | The model that builds. |
| `--no-skill` | The baseline arm: the same task without the litt-md plugin. Compare its table with a normal run to see what the skill adds. |
| `--no-self-shots` | Do not let the agent take its own screenshots. Runs before 15 October 2026 could not, so use this to compare with them. |
| `--judge [model]` | Also let a Claude judge read the screenshots against the task's `look` rubric. The judge is Opus unless you name a model, so it is not the model it grades. It is capped at $2 per run. |
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

The prompt is the only instruction, plus two lines the runner appends to the system prompt: Claude is running non-interactively and nobody can answer questions, and it can look at its work by running `npm run build`, then `gallery/scripts/agent-shot.mjs`. None of this mentions the registry, the skill or litt's tokens. Finding them is what is being tested.

`agent-shot.mjs` is the build workflow's self-critique step (screenshots in light and dark at 1440 and 390) made possible in the test: the agent cannot start a preview server or Playwright itself, so this one command serves its production build with the grader's own server and writes full-page PNGs to `.litt-shots/`, which the agent opens with Read. The grader leaves `.litt-shots/` out of the file diff. It adds turns and cost, so `--no-self-shots` turns it off.

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
| `phone-settings` | Vite | Settings that come up from the bottom on a phone and swipe down to close | `dialog`, `input`, `checkbox`, `button` |
| `settings-form` | Vite | An account page with a role dropdown, two switches, a speed slider and a theme choice | `input`, `button`, `select`, `switch`, `slider`, `segmented` or `tabs` |
| `analytics-dashboard` | Next.js | A deploy dashboard: a sidebar behind a menu button on phones, four tiles, a 14-day chart, a table | `table`, `tag`, `stat`, `chart`, `app-shell` |
| `agent-chat` | Vite | The studio agent's chat mid-conversation: thinking, three tool calls, a diff in the answer, the composer | `message`, `composer`, `thinking`, `tool-call`, `code-block` |

The last three started as baselines for the next steps (motion on phones, forms, dashboards). The Dialog has been a bottom sheet on phones since the responsive motion build, so `phone-settings` now checks that the agent uses it. The forms step shipped the select, switch and slider, so `settings-form` is now its pass mark and expects them. The dashboards step shipped the stat, chart, app shell and pagination, so `analytics-dashboard` is now its pass mark: it expects `stat`, `chart` and `app-shell` beside `table` and `tag`, and its rubric fails an accent-colored bar and a sidebar that stops partway down the page. Pagination is not expected, because the prompt does not ask for it. The agents step shipped the chat and the agent modules, so `agent-chat` is its pass mark: it expects `message`, `composer`, `thinking`, `tool-call` and `code-block`, and its rubric fails an accent bubble, a second accent fill beside Send, a shimmering thinking label and a rainbow code block. `plan` is not expected, because the prompt does not ask for one.

Each prompt reads like a message from Nick, says where the work goes (the home page, replacing the starter), and says it is litt's own site. Without that last line the skill stops to ask whether it is client work, and nobody is there to answer.

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
    { "name": "open", "click": "role=button[name=/settings/i] >> nth=0", "wait": 700 },
    { "name": "open-phone", "width": 390, "click": "role=button[name=/settings/i] >> nth=0", "frames": [60, 140, 260], "wait": 700 },
    { "name": "swiped", "width": 390, "click": "role=button[name=/settings/i] >> nth=0", "wait": 700, "drag": { "from": "role=dialog >> role=heading >> nth=0", "dy": 360 }, "after": 700 }
  ],
  "look": "Claims for the screenshot judge.",
  "max_turns": 60,
  "timeout_seconds": 1500,
  "max_budget_usd": 5
}
```

- `app` is `vite` or `next`. The prompt says where the work goes (`src/App.tsx` or `app/page.tsx` is the home page) and that it is litt's own site.
- `expect.items` are registry item names that must end up installed. An array inside the list means any one of these. Check them against the component's gallery page (`gallery/src/gallery/pages/`): ask only for what the registry makes necessary. For example `list` already brings the status filters and the status tag, so `project-list` does not also ask for `segmented`, `tabs` or `tag`.
- `shots` start with the page as loaded. Each later shot runs in light and dark and takes a viewport screenshot, `<name>-<theme>-<width>.png`. It does a `click` (a Playwright selector), a `press` (a key chord), or both in that order, waits `wait` ms, then takes the screenshot. Component entrances take a few hundred ms, so wait at least 600. Test a selector against a real build before you rely on it.
- A later shot can also set a width, touch, frames mid-animation and a drag. Every field is optional, and a shot without them runs at 1440 with a mouse, as it always did:

| Field | Default | What it does |
|---|---|---|
| `width` | 1440 | Viewport width, 200 to 3840. The height is 844 below 640 and 900 from there. |
| `touch` | `true` below 640 | A phone context (`hasTouch` and `isMobile`). `click` becomes a tap, `(hover: none)` and `(pointer: coarse)` match, and a drag sends real touch events. `false` keeps the mouse. |
| `frames` | none | One to six offsets in ms. A screenshot is taken that long after the click (after the press, when there is one) and named `<name>-<theme>-<width>-<ms>ms.png`. They catch an entrance mid-motion. |
| `wait` | 500, or the last frame if that is later | ms from the click or press until the drag or the screenshot. It counts from the action, not from the last frame, so it must be at least the last frame. |
| `drag` | none | `{ "from": selector, "dx": 0, "dy": 0, "ms": 240 }`. The pointer (a finger on a touch context) goes down at the centre of the visible part of `from`, moves by `dx` and `dy` in up to 12 steps over `ms`, and lifts. |
| `after` | 600 | ms to wait after the drag before the screenshot. Ignored without a drag. |

- Frames are close to their offset, not exact. A frame lands about 5 to 20 ms after its name, and a screenshot takes 30 to 50 ms, so keep frames at least 80 ms apart. A frame taken more than 40 ms late says so in the judge's label, and `page` shows `warn`.
- A drag goes to whatever is at the centre of `from`, and the centre of a form dialog is usually a text field. A drag that starts on a field belongs to the field: under a mouse it selects text. Point `from` at something that is not a field, such as `role=dialog >> role=heading >> nth=0`, or at a grab handle.
- A touch context lays the page out at 980 px wide when it has no `<meta name="viewport">`, as a phone does. The Vite and Next.js starters have one.
- A missing or hidden `click` or `drag.from` target fails `page`. So does a shot the task file got wrong: an unknown field, a `wait` shorter than the last frame, two shots that would write the same file.
- Every frame, in both themes, is one more screenshot for the judge to open. Three or four frames are enough.
- `look` is 4 to 7 claims a judge can check from a screenshot: what is on screen, where, in which state. Claims about the system (one accent fill, weight 400, slight radius, glass only on floating surfaces, left-aligned and airy, no emoji, no gradient text) belong here, written as things you can see. Name the shots a claim is about (`page-*`, `open-*`). A claim about motion names the frames (`open-phone-*-60ms`) and the settled picture it compares them with (`open-phone-*`). The judge is told that frames are mid-animation on purpose.
- Use real studio content. No lorem ipsum.

Run a new task with `--fake-agent` first to check it loads. The fake agent only has a solution for `settings-dialog`, so a new task should fail its checks with "no scripted solution". That is the expected result.

## Cost and results

A real run is paid. In the first nine Sonnet runs (October 2026), one task cost $0.26 to $0.38 for the agent and took one to one and a half minutes of agent time, plus about 30 seconds to grade. `--judge` with Opus added $0.11 to $0.23. All four tasks with the judge came to about $1.90 and six and a half minutes. Each task is capped by its `max_budget_usd` and `timeout_seconds`. The fake agent costs nothing.

Results are not committed. Runs live under `$TMPDIR/litt-agent-test/`, and `--report` and `--json` write wherever you point them. When a run finds something worth keeping (a check that fails often, a gap in the registry), write it up in the repo notes or fix the skill or the component, and run the task again.
