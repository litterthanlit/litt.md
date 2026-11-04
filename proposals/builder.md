# The builder: pick a look, hand it to your agent, check what it made

Written 2026-11-02 for Nick; the competitors checked again on their sites on 2026-11-03. Nick asked whether litt.md is becoming a UI builder, agreed it is configure, export and check ("yes that's what I meant"), and after Flat asked "what about the builder". This proposal turns the three words into three pieces of work, and asks the five questions they depend on. Nothing here is built yet.

## Where it stands

Every piece exists in some form. What's missing is a place where they come together, and a few links between them.

| Step | What exists | Where | What it lacks |
|---|---|---|---|
| **Configure** | A look is three choices: the accent (Monochrome, Blue 4, Pink), the material (Press, Flat) and the motion (Calm, Fun). There are twelve looks, each with a link (`?look=pink-flat-fun`). The Customize panel and the overview's deck pick one, and every page follows. | `gallery/src/gallery/look.ts`, `customize.tsx`, `deck.tsx` | A place to judge a look on whole screens. The panel is a popover, and the pages show one component at a time. |
| **Export** | Copy setup gives numbered steps: install litt, then add `data-accent` and `data-material` on `<html>` and `<FunMode>` around the app. Copy prompt adds a "Match the look" step. `llms.txt` documents the looks for agents. | `lookSetup`, `lookStep`, `looksDoc` in `look.ts` | Install and setup are separate steps. An agent has to edit the host's markup by hand, and a missed edit fails quietly: the app installs litt and shows Blue 4 on Press. |
| **Check** | `litt-check` scores an app's code out of 100 against litt's rules (motion, color, shape, type, reduced motion). The agent test grades a fresh app built by Claude with the same checks. | `skills/litt-md/scripts/litt-check.mjs`, `gallery/scripts/test-agents.mjs` | It checks litt's rules, but not your look. An app that should be Pink on Flat and ships Blue 4 on Press still scores 100. |

Type and shape are in Customize too, but they stay in your browser. Litt's rules mark anything other than Geist and the 4px control radius as "Change" (R8, R9), so neither is part of a look, a link or Copy setup.

## What the others do

Each site was read on 2026-11-03. graphicalui.com and dialkit.dev are the two Nick called "my real competitors" (journal, 2026-10-27); the other three are the galleries from the 2026-10-26 check (`proposals/gallery-wow.md`) whose ideas the builder borrows.

| Site | What it is | Configure | Whole screens | Hand to an agent | Check | Price |
|---|---|---|---|---|---|---|
| [graphicalui.com](https://graphicalui.com) | A visual theme builder: "A complete design language" | Nearly everything: neutrals and the primary color in light and dark, a licensed typeface (GT Standard) and icon set (Central), character presets ("Airy", "Quiet", "Bold", "Compact"), motion, spacing, radii, strokes, shadows and component states, in a visual editor for Base UI components | Mockups of several components together (a balance card, a list, a chat workspace, a sidebar) | A download or a shadcn install: theme tokens, `GUI.md`, light and dark references, setup steps, React source and three agent skills | One of the skills has the agent "find inconsistent styles": the agent's judgment, not a script | One-time purchase; the price is not on the page |
| [dialkit.dev](https://dialkit.dev) | A live tuning panel: "Tune interfaces in real time" | Values in your own code: sliders, toggles, color, a 2D pad, spring and easing editors, a timeline of clips, presets and saved versions. React, Solid, Svelte, Vue and plain JavaScript | None | Prompts that have your agent "wire it up"; hidden in production unless enabled | None | Free on npm |
| [affectui.com](https://www.affectui.com) | "Agent-ready UI for AI products": 132 items | None; each item is one self-contained file | 13 screens (Agent Chat, Agent Run, Analytics, CRM, Evals, Onboarding, Settings & Billing…) inside an App Shell, "the frame every screen sits in" | The shadcn CLI, or an MCP server for Claude, Cursor or v0 | None | 40 items free (MIT), Pro from $199 once |
| [uiarc.dev](https://uiarc.dev) | "The React UI library your AI agents can build with": 239 components, 139 blocks | Edit the semantic color tokens, type and motion in your own copy | One block called full screen (an AI chat) | The shadcn CLI, an MCP server, a Markdown page per component and `llms.txt` | None | 121 components free, Pro $249 once |
| [libraries.dev](https://libraries.dev) | Effect libraries and on-device ML models for UI | Public playgrounds; Pro's Studio exports a library's exact configuration | None | "Copy the prompt. Paste it to coding agent": each library ships as a prompt; Pro adds skills that teach an agent its parameters | None | Free libraries on npm; Pro, price not on the page |

Three things stand out:

1. **Handing work to an agent is now standard.** Every one of them has it: a shadcn install, an MCP server, a prompt to paste, or skills. Litt has all four (the registry, the shadcn MCP setup on the AI tools page, Copy prompt, and the litt.md skill itself), so this is table stakes, not an edge.
2. **graphicalui is the one doing what the builder does.** It configures more than litt ever will, and it ships agent skills, as litt does. What it does not have is a deterministic check: its consistency skill asks the agent to look for problems, and the agent decides what counts.
3. **No one checks that the agent kept the look.** None of the five can say "you asked for Flat and the app is Press" from the code alone, with no AI and no account. That is litt's opening.

## How the builder compares

| | graphicalui | affectUI, Arc, libraries.dev | dialkit | litt's builder |
|---|---|---|---|---|
| **What you choose** | Almost everything, licensed fonts included | Little or nothing: you take their look, or edit the source | Any value in your code | Only what litt's rules allow: accent, material, motion. Geist and the 4px corner stay. |
| **Where you judge it** | Mockups of several components | Screens in a frame (affectUI) or single blocks | Your own app, live | litt's own screens in a frame, as affectUI frames its screens, and in your look |
| **How it reaches your app** | A download or shadcn, and three skills | shadcn, MCP, a prompt | npm and an agent prompt | One shadcn command per look (piece 2), with the litt.md skill and `llms.txt` beside it |
| **Proof it was kept** | An agent skill that looks for inconsistency | None | None | `litt-check --look`: a script, no AI, no account, a pass or fail in words (piece 3) |
| **Price** | One-time purchase | Free tier, Pro from $199 to $249 once | Free | Free, as litt is today |

What litt takes from them:
- **The frame from affectUI:** the Build page shows every screen inside litt's own App shell.
- **One page per item for agents from Arc:** litt already serves a Markdown page per component and `llms.txt`. The look items get the same, and so does `/docs/build.md`.
- **One prompt that carries everything from libraries.dev:** Copy prompt on the Build page holds the install, the look and the screen in one paste.

What litt does not take: graphicalui's open configuration (decision 1), and paid tiers. Neither fits a design language whose point is that the choices are already made.

## What to build

### 1. The Build page: see a look on whole screens

*Built on 2026-11-04 (`proposals/build-page-plan.md`). Off the plan: the frame's Copy install installs the screen's block until piece 2 ships the look items; the screen lives in the address as `?screen=`; Agent and Projects sit in the App shell with Settings, while Sign in and Product stand alone.*

A gallery page, `#build`, in the nav under Overview. It is gallery chrome, not a registry component.

- **Choices on the left.** The deck's controls at full size: Accent, Material and Motion, plus Theme, which is a viewing choice and not part of the look. Each says its value in words (R5). Surprise me sits here too.
- **A screen on the right**, in a large frame: litt's own App shell, as affectUI frames its screens. One of the gallery's blocks, picked with tabs: Settings, Dashboard, Product, Sign in, Agent and Projects (all already in `gallery/src/blocks/`). The frame toggles between desktop and phone width, and can split light and dark side by side, as Customize's System tile does.
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
| 1 | Do type and shape become part of a look? | **No. A look stays the choices litt's rules allow: accent, material, motion.** Type and shape stay a try-on in your browser, as now. | Geist and the 4px control radius are litt's identity (R8, R9). graphicalui already sells open configuration, licensed fonts included; litt would be a weaker copy of it, and would lose its point. If you want a second shape, add it the way Flat was added: a choice with its own rule. |
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
