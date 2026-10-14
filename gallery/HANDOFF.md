# Gallery handoff

For the next agent working on the gallery. Written 2026-10-14. `main` is at `d951cb5` (PR #7), and production runs it.

- Live gallery: https://littmd.vercel.app
- Live registry: https://littmd.vercel.app/r/registry.json (24 items)
- Install a component anywhere: `npx shadcn@latest add https://littmd.vercel.app/r/button.json`

## Read first

1. `.claude/CLAUDE.md`: the repo rules. Never push without asking Nick.
2. `gallery/README.md`: how the pipelines and the deploy work.
3. `gallery/CONTRIBUTING.md`: how a component is built, documented and shipped. It is binding.
4. `skills/litt-md/system/components.md`: the spec. Build what it says, never invent a look.

Each roadmap step so far was one branch (`claude/gallery-step-N`) and one PR with an "Open for Nick" list. Keep that rhythm.

## Where we stand against the competitors

The competitor facts come from research done on 2026-10-11. Re-check the numbers before you quote them anywhere.

| | litt.md (now) | Fluid Functionalism | shadcn/ui |
|---|---|---|---|
| What it is | Nick's design language: a gallery, a Claude skill, and a registry | Micka Touillaud's motion layer on top of shadcn, launched April 2026 | The default open-code component system, by Vercel |
| Components | 18, plus Overview and Playground | 28, plus 3 blocks | 64, plus 30 blocks and charts |
| Docs page | Preview and Code on every demo, Install, Use when / Skip when, Usage, Props generated from TypeScript, Keyboard, Accessibility, Copy prompt | Preview and Code, props tables, Use when / Skip when, Copy prompt, Inspect, preset codes | Preview and Code, install, usage, API, composition, Copy page |
| Install | shadcn registry, 24 items, every token renamed `litt-…`, so it never restyles the host app. The install test proves it in fresh Vite and Next.js apps. | shadcn registry `@fluid`, in Radix and Base UI flavors. It relies on the host's shadcn tokens. | CLI, MCP server, a directory of 434 registries |
| Tokens | Locked. A lint fails the build on off-system values, and the gallery runs Tailwind in strict mode. | CSS variables, user-changeable | CSS variables, presets, 8 styles |
| Motion | 3 spring tiers, CSS `linear()` export, origin-aware entrances, one gliding highlight. Reduced motion is enforced in the hooks and CSS. | 3 spring tiers, exit tokens, nearest-row hover, weight shift. Reduced motion is the host app's job. | CSS keyframes, no springs |
| Material | Glass, light from above, grain | Elevation and shadow | Flat |
| Tuning | A Playground that checks values against the rules and exports tokens | Preset codes | The /create theme builder |
| AI | The litt-md skill (build, critique, interview, evolve) and Copy prompt | A skill, Copy prompt, and **weekly agent-install evals** | MCP server, skills, docs CLI, llms.txt (stale) |
| Quality checks | `verify` (token sync, docs data, the registry's verifier, typecheck, lint) and `test:registry` (by hand, about 14 minutes). **No CI.** | CI that checks the registry matches the source, keyboard tests, evals | Extensive |
| Reach | New, one maintainer | About 1k stars | About 125k stars |

**Where we lead**
- **Enforcement:** the only system whose rules a machine enforces.
- **Material:** the only one with a material identity.
- **Collision-free registry:** litt components drop into any Tailwind v4 app and change nothing else, and a test proves it.
- **Reduced motion:** enforced inside the components, not left to the host.
- **Playground:** a tuning instrument that checks itself against the rules.

**Where we trail**
- **No CI:** nothing runs on a PR except Vercel's build.
- **No agent evals:** Fluid Functionalism runs agent-install evals weekly, and we run none.
- **Breadth:** 18 components against 28 and 64.
- **AI integration:** no llms.txt and no MCP.
- **Navigation:** no gallery-wide search.
- **Reach:** very small so far.

## The roadmap, step by step

| Step | Status | Where |
|---|---|---|
| 1. LICENSE, small fixes, public URL | Done | PR #4 |
| 2. Docs pages | Done, small leftovers | PR #5 |
| 3. Registry | Done, built differently from the plan | PR #6 |
| 4. Breadth | Mostly done | PR #7 |
| 5. Agent tests | Not started | |
| 6. Accessibility | Partly done | |
| 7. Nice to have | Not started | |

### 1. LICENSE, small fixes, public URL: done (PR #4)

- **License and URL:** MIT LICENSE, copyright litterthanlit. The public URL is littmd.vercel.app.
- **Phones:** the theme switch now shows on phones, and the phone nav strip fades at its edges and scrolls the active page into view.
- **One Kbd chip:** a single shared component instead of three drifted copies.
- **Code-splitting:** each page loads as its own chunk.

### 2. Docs pages: done (PR #5)

- **Preview and Code:** a switch built with our own Tabs.
- **Generated props:** `scripts/gen-docs.mjs` reads the TypeScript types and JSDoc.
- **Every page has:** Use when / Skip when, Usage, Keyboard, Accessibility and a Copy prompt button.

Leftovers:
- **Section deep links:** hash routing means `#props` would open a page called "props". Links need routes like `#button/props`.
- **Types section:** types such as `CommandGroup` and `Project` show only by name in Props.
- **Kit weight:** the kit imports Tabs, so every page, Overview included, loads about 7 kB gzip more.

### 3. Registry: done (PR #6), built differently from the plan

- **The plan was:** commit the registry files, with CI checking they match the source.
- **What exists:** `scripts/gen-registry.mjs` generates them on every build into the gitignored `public/r/`. They can't drift, because they are never committed.
- **Namespacing:** every litt token ships renamed `litt-…`, so nothing collides with or restyles the host app. A verifier fails the build if anything unprefixed survives.
- **The proof is `npm run test:registry`.** It builds fresh Vite and Next.js apps, installs every item in six ways, then typechecks, builds and runs a Chromium smoke test, and checks that the host's own Button, fonts and variables are unchanged. It is not in CI yet.

Leftovers:
- **Directory listing:** being listed in shadcn's registry directory takes a PR to their repo. Nick decides.
- **Motion versions:** host apps get `motion` 14, because dependencies ship unversioned (pinned versions downgraded host packages). The gallery still runs 12.43.

### 4. Breadth: mostly done (PR #7)

- **Built:** Input (with Textarea), Checkbox and radio, Segmented control, Tag, a Kbd page, Popover, Glass header, Card, Table, and the empty, loading and error states.
- **Not built:**
  - switch, select and slider, because `components.md` doesn't specify them. Nick has to specify them first.
  - "Make List/cards generic", only partly: the list's tags and empty state build on Tag and Empty, but `ProjectCard` does not build on Card yet, because that would change its hover. Nick decides.

### 5. Agent tests: not started (recommended next)

The goal is to give Claude a fresh app and a task, then grade the result with our own checks. Our checks are stricter than anything Fluid Functionalism grades against.

Start from what exists:
- **Existing evals:** `evals/` (at the repo root, so it never ships in the claude.ai zip) already holds 5 skill-trigger evals run by `claude plugin eval .`. Each is a `case.yaml` with `tool_used` and `regex` graders. Ask the claude-code-guide agent which other grader types `claude plugin eval` supports, such as one that runs a command.
- **Reusable scaffolding:** `scripts/test-registry.mjs` already scaffolds and caches fresh Vite and Next.js hosts, serves a registry, runs `shadcn add`, builds, and drives Chromium. Reuse it rather than writing a second harness.
- **Task shape:** a few realistic tasks, such as "add a settings dialog with a form" or "build a pricing section". Grade on these points:
  - the build passes;
  - the output uses litt's registry components instead of hand-rolled copies;
  - no off-system values;
  - the motion goes through the tiers;
  - a screenshot looks right.
- **One gap:** `lint-litt.mjs` only knows the gallery's unprefixed token names. Code that installs from the registry uses `litt-…` names, so the grader needs a host mode.
- **Quick win in the same area:** `skills/litt-md/SKILL.md` and `workflows/build.md` never mention the gallery or the registry. So when Claude builds UI with the skill, it writes components by hand instead of installing the tested ones. Teaching the build workflow to run `npx shadcn@latest add @litt/<item>` first is a small change with a large effect. `taste/` is Nick's, but the workflows can change with a normal reviewed PR.

### 6. Accessibility: partly done

Done:
- **Forced colors:** Windows high-contrast support in Input, Checkbox and Segmented.
- **Per-page axe runs:** clean on every page, in light and dark, at 1440 and 390, apart from a known false positive. Axe reads the phone nav's off-screen `#route` links as skip links.

Left:
- **CI:** there is no `.github/` at all. Add a workflow:
  - on every PR: `npm ci`, `verify` and `build`, then axe across every route;
  - nightly or on a label: `test:registry`, which is slow and needs the network.

  In CI, `npx playwright install --with-deps chromium` is fine. The "never run playwright install" rule only applies inside Claude's cloud container.
- **Route changes:** move focus to the page heading on a route change. Nothing announces a page change today.
- **Forced colors everywhere else:** the edges of Button, Tabs, Menu, Toast, Dialog, Card and Table are drawn with box-shadow too.

### 7. Nice to have: not started

- **Gallery-wide ⌘K:** search built on our own CommandMenu, covering pages and their sections. Sections need the `#page/section` routing from step 2's leftovers.
- **Comparison page:** a page comparing litt with stock shadcn. Fluid Functionalism has one at `/compare`.

## Open decisions for Nick

Collected from PRs #4 to #7. None of these blocks anything; each needs Nick's taste, not an agent's.

**Spec gaps**
- **Toast timing:** `components.md` says toasts close after 5 seconds, but the code says 4.
- **Dialog tier:** the spec says the dialog drops to the responsive tier when the view's expressive moment is taken, but `DialogContent` can't do that yet.
- **Kbd size:** the spec asks for 11px, but the type scale has no 11. Add a kbd size token, or move the spec to 12px.
- **Unspecified components:** switch, select and slider are not specified.

**Taste calls on what shipped**
- **Checked boxes:** they fill with the accent, but rule P1 allows one accent fill per view. Should checked use `--fg`, or should native be the default?
- **Dark tooltip chip:** its outline is faint on the dark tooltip. Should it use `--line-strong`?
- **Disabled secondary Button:** it loses its box on a surface-2 panel. Should it keep a hairline?
- **Skeletons:** they are static. A pulse needs a new token, and on a surface-2 container a skeleton is invisible.
- **Header current page:** an accent dot, or a Tabs-style underline?
- **Segmented md:** is 13px text right, and should segments be equal width?
- **Textarea:** keep this spec extension?
- **Tag guidance:** "keep one status tag" is an agent's taste call. Keep or cut it?
- **Input focus edge:** it fades with `transition-[box-shadow]`, as the specimen does, but CONTRIBUTING says never animate box-shadow. Which rule wins?

**Housekeeping**
- **Duplicate Vercel projects:** delete `litt-md` and `litt-md-93z4` (see below).
- **shadcn directory:** list the registry there, or not?

## Infrastructure and gotchas

- **Vercel:**
  - The project is `litt.md` (`prj_aSXaCdGhZ7SgWR1dMm6A9rLUn1BI`, team `nicks-projects-14b58bdc`). `main` is production, and every branch gets a preview.
  - Previews sit behind Vercel login, so `shadcn add` can't fetch a preview's registry. Test installs against production, or locally with `test-registry.mjs`.
  - Two duplicate projects, `litt-md` and `litt-md-93z4`, were imported by mistake. Nick is deleting them in the dashboard; if they still exist, they're the source of extra PR checks.
- **Two deploy configs:** `vercel.json` builds from the repo root. `gallery/vercel.json` is the same config for a project rooted at `gallery/`, which is what a Vercel import detects. Change them together.
- **The pipelines run in order on every `verify` and build:** sync tokens, generate docs data, generate the registry, typecheck, lint. All generated output is gitignored. Never edit it; fix the source or the generator.
- **A new component needs:**
  - a page with `docs`;
  - JSDoc on every prop;
  - a `COPY` entry in `gen-registry.mjs`;
  - a smoke recipe in `test-registry.smoke.mjs`;
  - a `test:registry` run.
- **Registry gotchas** (details in the header of `gen-registry.mjs`):
  - shadcn's CLI rewrites a written `asChild` into Base UI's `render` prop in `base-*` hosts, so the generator spreads it instead.
  - `registry:font` rewrites a Next.js layout, so the fonts ship through `@fontsource` in the opt-in `base-styles` item.
  - `cssVars.light` and `cssVars.dark` write cyclic variables, so they aren't used.
- **Radix:** keep `@radix-ui/react-focus-scope` at one version (`npm ls @radix-ui/react-focus-scope`). Popover 1.1.23 bundled its own copy, and a Dialog then pulled focus out of a Popover inside it. Popover 1.2.0 matches Dialog 1.2.0 and dropdown-menu 2.1.25.
- **Motion:**
  - Never put `AnimatePresence initial={false}` around content. It reaches every motion component inside and swallows their entrances; that's how the List cascade was frozen for a whole step.
  - The press scale `0.98` is written as a literal 20 times across the components. A `usePressScale()` hook reading the token would remove them all.
- **Install test:**
  - `npm run test:registry --prefix gallery` takes about 14 minutes for both apps. Host templates are cached under the OS temp dir.
  - `--registry https://littmd.vercel.app/r` checks production.
  - In Claude's cloud container, Playwright is global under `/opt/node22`, with Chromium at `/opt/pw-browsers`.

## How the work was run

This process held up over four steps:
1. **Orchestration:** a lead agent orchestrated parallel Sonnet agents.
2. **The brief:** the lead wrote a brief with a binding contract (API shapes, file ownership, shared files off-limits). Placeholders in shared tables meant agents never edited the same lines.
3. **Agent reports:** agents reported findings and smoke recipes instead of editing shared test files.
4. **Review:** the lead reviewed every diff, fixed what agents found in shared code, and ran the full checks, the screenshots and `test:registry` before committing.
5. **Commits and PRs:** one commit per agent's unit of work, and one PR per step with an "Open for Nick" list.
