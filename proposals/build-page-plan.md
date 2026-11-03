# Build Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `#build` gallery page where you pick a look and see it on six whole screens. The screens sit in a frame you can view at desktop or phone width, or light beside dark. From there you hand the look to your agent with Copy install, Copy setup, Copy prompt or Copy link.

**Architecture:**
- The page is gallery chrome. It is an ungrouped page file next to Overview, AI tools and Changelog, so it gets no wall tile and no registry item.
- The look controls move out of the deck into one shared file, so the deck and the page can never disagree.
- The frame is one scroll container with one or two copies of a screen stacked in it. In light-beside-dark, the second copy is themed dark, clipped to the right half and made inert.
- Screen changes arrive through `SoftSwap`, the motion engine's one soft focus. It is the only place in the gallery where a blur may move (R4).

**Tech Stack:** React 19, Vite, Tailwind v4, Motion (`motion/react`), Playwright for the page test, Node for `test:look`.

**Spec:** `proposals/builder.md`, piece 1 ("The Build page"), decisions 1, 2 and 5, and "What litt takes from them". Read it first.

## Global Constraints

- A look is accent, material and motion only. Type and shape are not on this page (decision 1).
- The six screens, in this order: Settings, Dashboard, Product, Sign in, Agent, Projects (decision 5). Their blocks and registry item names are `settings`, `dashboard`, `product`, `sign-in`, `agent` and `projects`.
- Outside the frame, the page has exactly one accent fill: Copy install, the primary action. Inside, the frame is its own view, so the screens keep their own primary actions.
- Soft focus is a fade with a blur of at most 4px, cleared on the responsive spring. It only plays on a swap a hand causes and never on the first paint, and reduced motion stills it (R4, `foundations.md` §5).
- `gallery/src` has no hex values and no off-scale radii, and it never animates `filter` outside `src/motion/` (`lint:litt`).
- The page id is `build`, its file is `gallery/src/gallery/pages/00-build.tsx`, and its `meta` is a plain object literal (the `litt-page-meta` plugin reads it with `new Function`).
- A change to `src/motion/` changes the registry's `motion` item, so it needs a `gallery/CHANGELOG.md` line and the regenerated `registry.lock.json`.
- Refer to Nick by name or as "you". Ask before pushing.

## Review Focus

1. **Light beside dark leaks the hidden copy.** Two copies of a screen mean duplicate ids, headings and focus stops. Expected: the dark copy is `inert` and `aria-hidden`, and keyboard focus never reaches it. Pinned in Task 3: `test:build-page` asserts the attributes, and Tab from the frame never lands inside the dark copy.
2. **A link inside a screen navigates the gallery away.** Blocks link to app routes (`/projects`, `#…`). Expected: you stay on `#build`. Pinned in Task 3: the test clicks the frame's first `a[href]` and checks the hash.
3. **A phone or a 320px window.** Six screen tabs plus the view controls don't fit. Expected: no sideways page scroll; the screen choice scrolls inside its own strip. Pinned automatically: `test:reflow` reads every page file, `#build` included. Task 5 runs it.
4. **Reduced motion.** Expected: a screen change shows the new screen at once, with no blur at any frame. Pinned in Task 4: the test samples `filter` through a swap under `reducedMotion: "reduce"`.
5. **A link with a look and a screen** (`?look=pink-flat&screen=dashboard#build`). Expected: the page opens on Pink, Flat and the Dashboard, and Copy link gives back the same URL. Pinned in Task 3.

---

### Task 1: The words: a screen's prompt, Copy install as the primary, the Looks doc

**Files:**
- Modify: `gallery/src/gallery/look.ts` (add `screenPrompt`; one sentence in `looksDoc`)
- Modify: `gallery/scripts/test-look.mjs`
- Modify: `gallery/src/gallery/docs/copy.tsx` (`CopyButton` takes `variant="primary"`)

**Interfaces:**
- Produces: `screenPrompt(screen: { name: string; exportName: string; install: string; importPath: string }, look: Look, site: string): string` in `look.ts`.
- Produces: `CopyButton({ text, children, variant?: "primary" | "secondary" | "ghost", icon? })`.

- [ ] **Step 1: Write the failing test.** Add to `test-look.mjs`:

```js
const shot = { name: "Settings", exportName: "Settings", install: "npx shadcn@latest add https://littmd.vercel.app/r/settings.json", importPath: "@/components/litt/settings" };
const p = L.screenPrompt(shot, { accent: "pink", material: "flat", fun: false }, SITE);
check(p.startsWith("Build the Settings screen in this project with litt.md."), "a screen prompt names the screen first");
check(p.includes(shot.install) && p.includes(`import { Settings } from "${shot.importPath}";`), "a screen prompt installs the block and imports it");
check(p.includes('data-accent="pink"') && p.includes('data-material="flat"'), "a screen prompt carries the look's edits");
check(!L.screenPrompt(shot, L.REGISTRY_LOOK, SITE).includes("data-"), "the registry's look adds no edits");
check(p.endsWith(`See it: ${SITE}/?look=pink-flat&screen=settings#build`), "a screen prompt ends with the Build page link");
check(L.looksDoc(SITE).includes(`${SITE}/#build`), "llms.txt's Looks names the Build page");
```

- [ ] **Step 2: Run it and see it fail.** Run `npm run test:look --prefix gallery`. Expected: FAIL with `screenPrompt is not a function`.

- [ ] **Step 3: Implement `screenPrompt` in `look.ts`.** Numbered steps:
  1. The install line.
  2. The look's edits from `edits(look)`, or none for the registry's look.
  3. The usage: render `<ExportName />` inside the app's shell, with the import line.

  It ends with `See it: ${site}/?look=${encodeLook(look)}&screen=${id}#build`, where `id` is the item name taken from the install URL. In `looksDoc`, add one sentence: "The Build page, `${site}/#build`, shows a look on whole screens and copies its setup."

- [ ] **Step 4: Check the import path.** Read where `gen-registry.mjs` puts a `registry:block` file in a host (its `target`). If blocks do not land in `components/litt/<block>.tsx`, change the test's `importPath` and the Task 3 table to match.

- [ ] **Step 5: `CopyButton` gets `variant="primary"`.** It passes the variant to its `Button`, and nothing else changes.

- [ ] **Step 6: Run and see it pass.** Run `npm run test:look --prefix gallery && npm run typecheck --prefix gallery`. Expected: every claim holds, and tsc is clean.

- [ ] **Step 7: Commit.**

```bash
git add gallery/src/gallery/look.ts gallery/scripts/test-look.mjs gallery/src/gallery/docs/copy.tsx
git commit -m "gallery: a screen's prompt, and Copy install as a primary"
```

---

### Task 2: One set of look controls for the deck and the page

**Files:**
- Create: `gallery/src/gallery/look-controls.tsx`
- Modify: `gallery/src/gallery/deck.tsx` (use the shared controls; delete its private `Row`, `THEMES` and the inline Segmented controls)

**Interfaces:**
- Produces, each reading and writing `useCustomize()`:
  - `LookRow({ label, children })`: the deck's row, unchanged.
  - `ThemeControl()`
  - `MaterialControl()`
  - `AccentControl()`
  - `FunControl()`: the deck's Fun mode Switch.
- Each control renders its whole row, with its label. The words and markup are exactly the deck's today.

- [ ] **Step 1: Run the current guard.** Run `npm run build --prefix gallery && npm run test:home --prefix gallery`. Expected: every claim holds. This is a pure move, and test:home's deck checks (Theme, Material, Accent, Fun, Reset) are the test.

- [ ] **Step 2: Move the controls.** Move the deck's Theme, Material and Accent Segmented rows and the Fun Switch into `look-controls.tsx`, and render them from `deck.tsx` in the same order. The Shape slider stays in the deck.

- [ ] **Step 3: Run the guard again.** Run the same command. Expected: the same claims hold, and `lint:litt` is clean.

- [ ] **Step 4: Commit.**

```bash
git add gallery/src/gallery/look-controls.tsx gallery/src/gallery/deck.tsx
git commit -m "gallery: the deck's look controls in one file, for the Build page too"
```

---

### Task 3: The Build page, its screens and its frame

**Files:**
- Create: `gallery/scripts/build-page.mjs`; add `"test:build-page": "node scripts/build-page.mjs"` to `gallery/package.json`
- Create: `gallery/src/gallery/build-screens.tsx`
- Create: `gallery/src/gallery/build-frame.tsx`
- Create: `gallery/src/gallery/pages/00-build.tsx`
- Modify: `gallery/src/gallery/kit.tsx` (export `stayPut`)

**Interfaces:**
- Consumes: `screenPrompt` and `CopyButton variant="primary"` (Task 1); `ThemeControl`, `MaterialControl`, `AccentControl`, `FunControl` and `LookRow` (Task 2).
- Consumes from the codebase:
  - `useUrlParam(name)` (`components/table-filter.tsx`)
  - `lookAttributes`, `lookWords`, `lookSetup` and `withLook` (`look.ts`)
  - `installCommand` and `SITE` (`docs/copy-prompt.ts`)
  - `Framed` (`components/framed.tsx`), `DeviceProvider` (`@/motion`) and `Toaster`
- Produces:
  - `type ScreenId = "settings" | "dashboard" | "product" | "sign-in" | "agent" | "projects"`
  - `SCREENS: readonly BuildScreen[]`, where `BuildScreen = { id: ScreenId; name: string; exportName: string; shell: boolean; render: (phone: boolean) => ReactNode }`
  - `BuildFrame({ label, phone, split, children: () => ReactNode })`, whose root carries `data-build-frame`
  - Task 4 wraps the frame's content in `SoftSwap`, keyed by the screen id.

The six screens, each rendered the way its block page's demos render it (`30-<id>.tsx`):

| id | name | exportName | shell | render |
|---|---|---|---|---|
| settings | Settings | Settings | yes | `<Toaster>` around `<Settings />` |
| dashboard | Dashboard | Dashboard | no (it is one) | `<Dashboard label="Studio" viewportHeight="44rem" />` |
| product | Product | ProductPage | no | `<Toaster>` around `<ProductPage />` |
| sign-in | Sign in | SignIn | no | `<SignIn />` |
| agent | Agent | AgentChat | yes | `<AgentChat finished />` |
| projects | Projects | Projects | yes | `<Projects />` |

A screen with `shell: true` renders inside the gallery's own `AppShell`:
- `wordmark="Studio"`, `viewportHeight="44rem"`, `mainLandmark={false}`.
- Its `SidebarNav` lists Dashboard, Projects, Agent and Settings, with the shown screen `current`.
- This is the proposal's "screens inside litt's own App shell". Sign in and Product are not apps, so they get no shell.

- [ ] **Step 1: Write the failing page test.** Write `scripts/build-page.mjs` in the style of `home.mjs`: serve `dist`, use Playwright, and collect `check(ok, claim)` lines, with page errors as problems. Claims:
  - `#build` loads with an h1 "Build"; the sidebar and the phone menu list "Build" after Overview.
  - The page's Material control set to Press removes `data-material` from `<html>`, and Flat puts it back. Accent Pink sets `data-accent="pink"` on `<body>`.
  - The screen choice starts on Settings. Picking Dashboard shows the Dashboard block in `[data-build-frame]` (its h2 or landmark name) and sets `?screen=dashboard` in the address.
  - `?look=pink-flat&screen=dashboard#build` opens on Pink, Flat and the Dashboard. Copy link, read from the clipboard, equals `location.href` with that query.
  - Width Phone: the frame's content is at most 384px wide, and `useDevice` reads compact inside it (the shell shows its menu button).
  - Light beside dark on: `[data-build-frame]` holds two copies. The second has `data-theme="dark"`, the page's `data-material`, `inert` and `aria-hidden="true"`. Tabbing 20 times from the frame never focuses inside it.
  - Clicking the frame's first `a[href]` leaves `location.hash === "#build"`.
  - Copy install equals `installCommand("<screen id>")`. Copy setup equals `lookSetup(look, SITE)`. Copy prompt starts with "Build the Dashboard screen".
  - Outside `[data-build-frame]`, `main` has exactly one accent fill (wall.mjs's probe), and it is Copy install, in Blue 4 and in Pink.

- [ ] **Step 2: Run it and see it fail.** Run `npm run build --prefix gallery && npm run test:build-page --prefix gallery`. Expected: FAIL at "#build loads with an h1".

- [ ] **Step 3: Export `stayPut` from `kit.tsx`.** Only the `export` keyword changes.

- [ ] **Step 4: `build-screens.tsx`.** Build `SCREENS` per the table, and the shell wrapper `ScreenShell({ current, children })`.

- [ ] **Step 5: `build-frame.tsx`.**
  - `BuildFrame` is one `role="region"` scroll container. It carries `aria-label={label}`, `tabIndex={0}`, `onClickCapture={stayPut}`, `data-build-frame`, `h-176`, `overflow-y-auto`, `overscroll-contain`, `rounded-surface`, `bg-canvas`, and the outline AppFrame uses.
  - Inside it, a grid with one cell holds the copies:
    - **Not split:** one copy, `<Framed>` around `children()`.
    - **Split:** a second copy in the same cell, which spreads `lookAttributes({ accent, material }, true)` from `useCustomize().look` and carries `inert` and `aria-hidden="true"`. It also gets `bg-canvas text-fg [clip-path:inset(0_0_0_50%)]` and the same `<Framed>`. The first copy is themed light the same way.
  - **Phone:** each copy sits in `mx-auto w-full max-w-sm` and `<DeviceProvider mode="phone">`.
  - The `label` reads, for example, "Settings, desktop" or "Settings, phone, light beside dark".

- [ ] **Step 6: `pages/00-build.tsx`.**
  - Meta: `export const meta = { id: "build", title: "Build", lede: "Pick a look and see it on whole screens, then hand it to your agent.", order: 0.2, summary: "Your look on six whole screens, with the commands that put it in your app.", tiers: ["responsive"] }`.
  - The page is an `<article aria-labelledby="page-build">` with `PageTitle` (as `00-ai.tsx`), then two columns from `lg`:
    - **Left:** AccentControl, MaterialControl, FunControl and ThemeControl, with the look in words under them (`lookWords(look)`, `aria-live="polite"`).
    - **Right:**
      - A view bar: the screen choice is a `Segmented` (legend "Screen", the six names) inside an `overflow-x-auto` strip. Width is a `Segmented` (Desktop, Phone). "Light beside dark" is a `Switch`.
      - Then `BuildFrame`.
      - Then the export row: `CopyButton variant="primary"` "Copy install", "Copy setup", "Copy prompt", and a ghost "Copy link" with `LinkIcon`.
  - The screen comes from `useUrlParam("screen")`, falling back to `settings` for anything that is not a `ScreenId`. Width and split are local state.
  - Every choice is said in words (R5).

- [ ] **Step 7: Run and see it pass.** Run `npm run build --prefix gallery && npm run test:build-page --prefix gallery && npm run lint:litt --prefix gallery`. Expected: every claim holds, and the lint is clean.

- [ ] **Step 8: Commit.**

```bash
git add gallery/scripts/build-page.mjs gallery/package.json gallery/src/gallery/build-screens.tsx gallery/src/gallery/build-frame.tsx gallery/src/gallery/pages/00-build.tsx gallery/src/gallery/kit.tsx
git commit -m "gallery: the Build page, six screens in a frame, and the commands that hand a look over"
```

---

### Task 4: SoftSwap, the motion engine's soft focus

**Files:**
- Create: `gallery/src/motion/soft-swap.tsx`
- Modify: `gallery/src/motion/index.tsx` (export it), `gallery/src/motion/rules.ts` (`LIMITS.softBlur: 4`)
- Modify: `gallery/src/gallery/build-frame.tsx` (the copies' content goes through `SoftSwap`)
- Modify: `gallery/scripts/build-page.mjs`, `gallery/CHANGELOG.md`, `gallery/registry.lock.json`

**Interfaces:**
- Produces: `SoftSwap({ swapKey, className?, children }: { swapKey: string; className?: string; children: ReactNode })`, exported from `@/motion`.
- Consumes: `useTransition("responsive")`, `useExit("responsive")` and `LIMITS` (rules.ts).

- [ ] **Step 1: Write the failing tests.** Add to `build-page.mjs`. In each, sample `getComputedStyle(content).filter` on the frame's content every animation frame for 600ms after picking a new screen.
  - **Motion allowed:** some sample is a `blur()` above 0px; none is above `blur(4px)`; the last sample is `none`.
  - **Reduced motion** (`reducedMotion: "reduce"`): every sample is `none`, and the new screen is there on the first sample.
  - **First load:** no sample in the first 600ms of `#build` is a blur (no entrance on paint).

- [ ] **Step 2: Run them and see them fail.** Run `npm run test:build-page --prefix gallery`. Expected: FAIL on "some sample is a blur" (the swap is instant today).

- [ ] **Step 3: Implement `SoftSwap`.**
  - Use `AnimatePresence mode="wait"` keyed by `swapKey`.
  - The incoming child goes from `{ opacity: 0, filter: "blur(${LIMITS.softBlur}px)" }` to `{ opacity: 1, filter: "blur(0px)" }` on `useTransition("responsive")`, ending with `transitionEnd: { filter: "none" }`.
  - The outgoing child fades on `useExit("responsive")`, with no blur.
  - It is initial-free on the first mount, with the mounted-ref pattern from `components/tabs.tsx`, not `initial={false}`.
  - Under reduced motion, `useTransition` returns zero, so nothing blurs.
  - Add `softBlur: 4` to `LIMITS`, with the JSDoc "Soft focus's blur, in px (R4)".

- [ ] **Step 4: Use it.** In `BuildFrame`, the frame's content goes through `<SoftSwap swapKey={screenId}>`. Pass the id as a new `swapKey` prop on `BuildFrame`, and change Task 3's interface to `BuildFrame({ label, phone, split, swapKey, children })`.

- [ ] **Step 5: Changelog.** Under the release for the day you commit (or a new `## <date> · The Build page` heading), add:
  `- **changed** \`motion\`: new \`SoftSwap\`, litt's one soft focus (R4): content a hand swaps arrives in a fade with a blur of at most 4px that clears on the responsive spring, never on the first paint, and not at all under reduced motion. \`LIMITS.softBlur\` is 4. Nothing in your code has to change.`

- [ ] **Step 6: Run and see them pass.** Run `npm run verify --prefix gallery && npm run build --prefix gallery && npm run test:build-page --prefix gallery && node scripts/test-registry.mjs --app vite --items motion,button` (from `gallery/`). Expected: every claim holds, verify is clean with the lock rewritten, and the Vite rows pass.

- [ ] **Step 7: Commit.**

```bash
git add gallery/src/motion gallery/src/gallery/build-frame.tsx gallery/scripts/build-page.mjs gallery/CHANGELOG.md gallery/registry.lock.json
git commit -m "gallery: SoftSwap, the motion engine's soft focus, and its first user"
```

---

### Task 5: The gates, CI and the notes

**Files:**
- Modify: `.github/workflows/*.yml` (the job that runs `test:home`: add `npm run test:build-page --prefix gallery` after it)
- Modify: `.claude/CLAUDE.md` (a Gallery bullet for `#build` and `test:build-page`)
- Modify: `gallery/HANDOFF.md` (the round, the roadmap row, Nick's look)
- Modify: `proposals/builder.md` (piece 1: "Built", with what moved off the plan)

- [ ] **Step 1: Run every page check.** Run `npm run test:a11y --prefix gallery -- --pages build && npm run test:motion --prefix gallery && npm run test:reflow --prefix gallery && npm run test:text-zoom --prefix gallery && npm run test:home --prefix gallery && npm run test:wall --prefix gallery`. Expected: all pass. These four checks read the page files, so they cover `#build` already. Fix what they find in the page, not in the checks.

- [ ] **Step 2: Wire CI and write the notes.**
  - The CLAUDE.md bullet: "`#build` (`pages/00-build.tsx`) shows a look on six blocks in one frame (`build-frame.tsx`, `build-screens.tsx`) and copies its install, setup, prompt and link. The frame is its own view for R6, and `npm run test:build-page --prefix gallery` (CI, after a build) holds the page to one accent fill outside it, the inert dark copy, soft focus and the export text."
  - Update the HANDOFF and the proposal status as listed.

- [ ] **Step 3: Screenshots.** Shoot `node scripts/shot.mjs --page build --look mono-flat` and `--look pink`, from `gallery/` after the build. Read them; nothing should overflow, and the frame should read as a screen.

- [ ] **Step 4: Commit.**

```bash
git add .github .claude/CLAUDE.md gallery/HANDOFF.md proposals/builder.md
git commit -m "docs: the Build page in CI, the repo notes and the handoff"
```
