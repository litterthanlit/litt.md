# The builder: pick a look, hand it to your agent, check what it made

Written 2026-11-02 for Nick. Nick asked whether litt.md is becoming a UI builder, agreed it is configure, export and check ("yes that's what I meant"), and after Flat asked "what about the builder". This proposal turns the three words into three pieces of work, and asks the five questions they depend on. Nothing here is built yet.

## Where it stands

Every piece exists in some form. What's missing is a place where they come together, and a few links between them.

| Step | What exists | Where | What it lacks |
|---|---|---|---|
| **Configure** | A look is three choices: the accent (Monochrome, Blue 4, Pink), the material (Press, Flat) and the motion (Calm, Fun). There are twelve looks, each with a link (`?look=pink-flat-fun`). The Customize panel and the overview's deck pick one, and every page follows. | `gallery/src/gallery/look.ts`, `customize.tsx`, `deck.tsx` | A place to judge a look on whole screens. The panel is a popover, and the pages show one component at a time. |
| **Export** | Copy setup gives numbered steps: install litt, then add `data-accent` and `data-material` on `<html>` and `<FunMode>` around the app. Copy prompt adds a "Match the look" step. `llms.txt` documents the looks for agents. | `lookSetup`, `lookStep`, `looksDoc` in `look.ts` | Install and setup are separate steps. An agent has to edit the host's markup by hand, and a missed edit fails quietly: the app installs litt and shows Blue 4 on Press. |
| **Check** | `litt-check` scores an app's code out of 100 against litt's rules (motion, color, shape, type, reduced motion). The agent test grades a fresh app built by Claude with the same checks. | `skills/litt-md/scripts/litt-check.mjs`, `gallery/scripts/test-agents.mjs` | It checks litt's rules, but not your look. An app that should be Pink on Flat and ships Blue 4 on Press still scores 100. |

Type and shape are in Customize too, but they stay in your browser. Litt's rules mark anything other than Geist and the 4px control radius as "Change" (R8, R9), so neither is part of a look, a link or Copy setup.

## The two competitors

Both are from the journal (2026-10-27, "these might be my real competitors").

- **graphicalui.com** is a visual theme builder. It exports tokens, Base UI components and a `GUI.md` with skills for coding agents. You can change everything, and it hands the agent a description.
- **dialkit.dev** is a live tuning panel for React: sliders, springs, easing curves, a 2D pad, a timeline and presets. Litt's `tune` already covers this ground, with the rules checked as you drag.

Litt's angle is narrower and stronger: **only choices the language allows, and proof that the agent kept them.** graphicalui hands over a theme and trusts the agent. Litt can hand over a look and then check the result.

## What to build

### 1. The Build page: see a look on whole screens

A gallery page, `#build`, in the nav under Overview. It is gallery chrome, not a registry component.

- **Choices on the left.** The deck's controls at full size: Accent, Material and Motion, plus Theme, which is a viewing choice and not part of the look. Each says its value in words (R5). Surprise me sits here too.
- **A screen on the right**, in a large frame. One of the gallery's blocks, picked with tabs: Settings, Dashboard, Product, Sign in, Agent and Projects (all already in `gallery/src/blocks/`). The frame toggles between desktop and phone width, and can split light and dark side by side, as Customize's System tile does.
- **Export under the frame.** The look in words ("Pink, flat material, fun motion"), then four actions: Copy link, Copy install (the one command from piece 2), Copy setup and Copy prompt for a whole screen.
- **The page has one primary action:** Copy install. The blocks inside the frame keep their own primary actions, but the frame counts as its own view, the way a tile on the wall does (R6). The wall check gets a rule for this.
- **Motion:** switching tabs swaps the screen in soft focus. This is `SoftSwap`'s first real user (R4, built in the components theme).

### 2. One command per look

Today: install litt, then edit `<html>`. Proposed: a registry item per look, so the install is the whole setup.

```
npx shadcn@latest add https://littmd.vercel.app/r/look-pink-flat.json
```

- **What a look item installs:** the `litt` item, plus CSS that applies the look to the page's roots. That means the look's accent and material blocks restated for `:root` and every theme root, so no attribute is needed. A `-fun` look adds the `motion` item, and its note says to wrap the app in `<FunMode>`. That one edit stays, because a registry item can add files but cannot rewrite the host's layout.
- **Generated, not written by hand.** `gen-registry.mjs` writes twelve items from `LOOKS`, as it writes the components today, and the changelog gives them versions like any item.
- **The attribute path stays** for a project that switches looks at runtime (the gallery itself does). Copy setup keeps offering it, second.
- **Tested:** `test:registry` gets a looks scenario. It installs `look-pink-flat` into fresh Vite and Next.js apps and runs the accent and material contracts from Flat's look scenario, with no attribute set.

### 3. Check against your look

`litt-check` learns the look an app was meant to have, and reports whether it got there.

```
node litt-check.mjs --look pink-flat-fun
```

- **What it reads:** the installed look item, or the attributes on `<html>` in `index.html` or `app/layout.tsx`, or `<FunMode>` in the entry file. It also flags a `--litt-accent` or neutral token restated in the app's own CSS, which overrides the look.
- **What it says:** a Look line beside the score, in words: "Look: pink-flat-fun. Accent Pink, yes. Material Flat, no: the app is Press. Motion Fun, yes." It is a gate (`--look` fails the run when the look is not met), not a sixth category in the average. A score says how litt-like the code is; the look says whether it is the litt you asked for.
- **The agent test** gets one task per material: build a settings screen in `pink-flat`, and grade the look with the same check.

## Decisions

| # | Question | Suggested | Why |
|---|---|---|---|
| 1 | Do type and shape become part of a look? | **No. A look stays the choices litt's rules allow: accent, material, motion.** Type and shape stay a try-on in your browser, as now. | Geist and the 4px control radius are litt's identity (R8, R9). A builder that exports any font and any corner is graphicalui's game, and litt would lose its point. If you want a second shape, add it the way Flat was added: a choice with its own rule. |
| 2 | Where does the builder live? | **A `#build` page in the gallery**, not a separate app. | The blocks, the looks and the export code are all in the gallery. A separate app would copy them. |
| 3 | Does a look item set the look in CSS, or keep the attribute? | **CSS on the roots, with the attribute kept as the runtime path.** | One command is the whole setup, and a missed `<html>` edit can no longer fail quietly. The attribute still lets a project switch looks at runtime. |
| 4 | Is the look check a gate or part of the score? | **A gate beside the score.** | The score measures rules, the look measures intent. Mixing them would let a perfect-rules app hide the wrong look. |
| 5 | Which screens does the frame show first? | **Settings, Dashboard, Product, Sign in, Agent and Projects.** | One each for forms, data, commerce, auth, agents and lists, which together cover most of what people build. The other eight blocks follow in the tabs' overflow. |

## Order

1. **The components theme first** (`proposals/flat.md`, "What the build showed"). The Build page shows Flat on whole screens, so Flat's card frame, round button and soft focus should exist before it.
2. **The Build page** (piece 1). It works with today's Copy setup, so it can ship before piece 2.
3. **Look items** (piece 2), then **Copy install** on the Build page.
4. **The look check** (piece 3) and its agent task.

Each step is its own branch and release, with a plan written before it starts, as Flat had.

## Open questions this adds

- **Q18.** Should a look ever carry type or shape? *Suggested:* no (decision 1). Revisit only if a second typeface or shape earns a rule of its own.
