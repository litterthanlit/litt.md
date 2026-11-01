# Flat Material Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Flat, a second material beside Press, as `data-material="flat"`. The gallery opens in it, Customize and the `?look=` links carry it, and litt's checks hold it to the same bar as Press.

**Architecture:** `tokens.css` declares eleven `--flat-*` neutral mirrors in each theme block, and one last `[data-material="flat"]` block maps the live neutrals and press tokens onto them, the way pink works. `look.ts` gains a `material` axis, so twelve looks. The gallery writes the attribute on `<html>` before paint and in Customize. `check.mjs` reruns every contrast pair on the flat neutrals.

**Tech Stack:** CSS custom properties, Tailwind v4 (`@theme inline`), React 19 + Vite gallery, Node scripts (`check.mjs`, `test-look.mjs`), Playwright (`test:registry`, `shot.mjs`).

**Spec:** `proposals/flat.md`. Read it first. Its tables are the values.

## Global Constraints

- `skills/litt-md/assets/tokens.css` is the only place hex values live. No hex in Markdown or in `gallery/src` (`lint:litt` fails on it).
- `taste/` changes only through `skills/litt-md/workflows/evolve.md`. Commit them with a `taste:` prefix, and show Nick the `profile.md` diff before committing.
- The dark values sit twice in `tokens.css` (`[data-theme="dark"]` and the `prefers-color-scheme` block). Both get the same `--flat-*` lines; check 3 fails otherwise.
- An empty shadow is `0 0 0 0 transparent`, never `none`.
- The registry keeps shipping Press: `REGISTRY_LOOK.material` is `"press"`. The gallery opens in `{ accent: "mono", material: "flat", fun: false }`.
- An item whose files changed needs a `gallery/CHANGELOG.md` line, and `registry.lock.json` gets committed with it.
- Refer to Nick by name or as "you", and never with a gendered pronoun. Never push without asking.
- Out of scope: component recipes (grey card frames, round buttons) and `SoftSwap`. Those are the components theme, the next plan.

## Review Focus

1. **A nested theme scope inside a flat page renders Press.** Customize's Window previews and `AccentChip` set their own `data-theme`, which redeclares the stone neutrals and press tokens. Expected: they show the page's material. Pinned by `lookAttributes` carrying `data-material` (Task 3 test) and by the callers migrating to it (Task 4).
2. **`none` in a comma list.** `color-picker.tsx` writes `shadow-[inset_0_0_0_1px_var(--danger),var(--block-lift)]`, and a `none` there voids the whole shadow, the error ring with it. Expected: the error ring still shows in Flat. Pinned by check 11 failing any `none` in the flat block (Task 1).
3. **Contrast drift from dropping chroma.** The grey at a stone value's lightness can lose a hair of contrast, for example `--fg-muted` on `--surface-3`. Expected: every WCAG and APCA pair passes in Flat too. Pinned by check 5's flat pass (Task 1).
4. **Links and storage from before Flat.** `?look=pink-fun`, and a saved `{ "accent": "pink" }` with no `material` key. Expected: the link reads as Pink on Press (a link is absolute, and the registry is Press). The saved choice opens on Flat, the gallery's default. Pinned in `test-look.mjs` (Task 3).
5. **A host in dark mode.** A host with `class="dark"` or the system dark setting, plus `data-material="flat"`. Expected: the dark flat neutrals, not the light ones and not stone. Pinned by the registry test's look case (Task 5).

---

### Task 1: Flat in tokens.css, held by check.mjs

**Files:**
- Modify: `skills/litt-md/scripts/check.mjs` (header list; check 5's theme loops; new check 11)
- Modify: `skills/litt-md/assets/tokens.css` (the three theme blocks; a new block after the Monochrome block, before `@media (prefers-reduced-motion)`)

**Interfaces:**
- Produces: CSS `[data-material="flat"]` on any element, `<html>` in practice; tokens `--flat-canvas`, `--flat-surface-1`, `--flat-surface-2`, `--flat-surface-3`, `--flat-line`, `--flat-line-strong`, `--flat-line-control`, `--flat-fg`, `--flat-fg-muted`, `--flat-fg-subtle`, `--flat-fg-disabled` in every theme block. Task 3's test reads the attribute value `flat` from this block.

- [ ] **Step 1: Write the failing checks in `check.mjs`**

Add `const FLAT_NEUTRALS = ["--canvas", "--surface-1", "--surface-2", "--surface-3", "--line", "--line-strong", "--line-control", "--fg", "--fg-muted", "--fg-subtle", "--fg-disabled"];` and `flatOf(map)`, which returns a copy of a theme map with each neutral `N` replaced by `map.get("--flat-" + N.slice(2))`, failing `"<theme>: --flat-<name> is missing"` when one is absent.
- Check 5: every loop that now runs over `[["light", light], ["dark", dark]]` (contrast pairs, tints, accent-apart, APCA) also runs `["flat light", flatOf(light)]` and `["flat dark", flatOf(dark)]`.
- New **check 11, Flat** (add it to the header list):
  - (a) for each theme and each `N` in `FLAT_NEUTRALS`, `--flat-<name>` has OKLCH chroma at most 0.004 and lightness within 0.005 of `N`'s. Use check 5's existing OKLab conversion, where chroma is `hypot(a, b)`.
  - (b) a block matching `/:root\[data-material="flat"\],\s*\[data-material="flat"\]\s*\{/` exists, maps every `N` to `var(--flat-<name>)`, and starts after the `[data-accent="mono"]` block's offset.
  - (c) no value in that block is `none`. Every shadow layer in it has x = y = 0, and blur is 0 unless it is a ring (`0 0 0 1px …`). `--press-depth` is `0px`.
  - (d) it restates `--focus-ring` with `var(--focus)` (never a literal color), plus the five `--data-*-tint`.

- [ ] **Step 2: Run it and see it fail**

Run: `node skills/litt-md/scripts/check.mjs`
Expected: exit 1, with `light: --flat-canvas is missing` (and the like) and `no [data-material="flat"] block`.

- [ ] **Step 3: Add the mirrors to each theme block**

After each block's `--fg-disabled` line (light, `[data-theme="dark"]` and the media block), add the eleven `--flat-*` lines under a comment: "Flat's neutrals (data-material="flat", below): each the stone value above at its OKLCH lightness and chroma 0 (proposals/flat.md)". Compute each hex from its stone twin's OKLab L. A grey's linear channel is `L ** 3`, so `lin = L ** 3`, then `s = lin <= 0.0031308 ? 12.92 * lin : 1.055 * lin ** (1 / 2.4) - 0.055`, and the hex is `round(s * 255)` in all three channels. Do it with a throwaway Node snippet in the scratchpad, not by hand. The two dark blocks get identical lines.

- [ ] **Step 4: Add the Flat block**

After the Monochrome block, add a section comment ("Flat (R3, proposals/flat.md): data-material="flat" on <html> says the depth ladder by fill alone…"), then `:root[data-material="flat"], [data-material="flat"] { … }` with:
- each neutral `--<name>: var(--flat-<name>)`;
- `--highlight: inset 0 0 0 0 transparent`;
- `--tray: transparent; --tray-shade: inset 0 0 0 1px var(--line-strong)`;
- `--cut: var(--surface-1); --cut-shade: inset 0 0 0 0 transparent`;
- `--block: var(--surface-3)`; `--block-lift`, `--block-press`, `--key-lift`, `--plate-lift`, `--cap-lift`, `--cap-press`, `--slot-shade`, `--slot-fill-shade` all `0 0 0 0 transparent`;
- `--slot: var(--surface-3); --slot-fill: color-mix(in oklab, var(--surface-3), var(--fg) 14%)`;
- `--cap: color-mix(in oklab, var(--surface-3), var(--fg) 45%); --cap-held: color-mix(in oklab, var(--surface-3), var(--fg) 55%); --cap-grip: var(--surface-3)`;
- `--press-depth: 0px`;
- `--focus-ring: 0 0 0 2px var(--canvas), 0 0 0 4px var(--focus)`, and the five `--data-<hue>-tint: color-mix(in oklab, var(--data-<hue>) var(--tint-strength), var(--surface-1))`.

Inside the `@media (prefers-reduced-motion: reduce)` block nothing changes: `--press-depth` is already 0px there.

- [ ] **Step 5: Run it and see it pass**

Run: `node skills/litt-md/scripts/check.mjs`
Expected: exit 0. The contrast summary counts four themes' pairs, and a `✓ flat: …` line shows for check 11. If a flat contrast pair fails, report it. Don't nudge a grey off chroma 0: that's Nick's call (Review Focus 3).

- [ ] **Step 6: Commit**

```bash
git add skills/litt-md/scripts/check.mjs skills/litt-md/assets/tokens.css
git commit -m "skill: Flat, a second material, data-material=\"flat\" in tokens.css and held by check 11"
```

---

### Task 2: The rules say Flat (taste v1.4)

**Files:**
- Modify: `skills/litt-md/taste/journal.md` (append four entries)
- Modify: `skills/litt-md/taste/profile.md` (version line, Fixed decisions: Signature and Color, R2, R3, R4, Open questions Q17, Changelog v1.4)
- Modify: `skills/litt-md/system/material.md` (new section 7, a Per-theme row, a self-check line)
- Modify: `skills/litt-md/system/foundations.md` (section 5, Motion: soft focus)
- Modify: `skills/litt-md/SKILL.md` (Signature, R3 and R4 lines, the token quick view)

**Interfaces:**
- Consumes: Task 1's attribute and token names. The docs name variables only, never hex.

- [ ] **Step 1: Append the journal entries**, dated `2026-11-01`, source `chat`, in evolve.md's format:
  1. `process` · litt as configure, export and check (the looks growing toward a theme you hand an agent), not a drag-and-drop UI builder · `decision` · "yes that's what I meant" · - · `open`
  2. `material` · flat like litt.design's work slider (grey frames, nothing casts) as a Material choice beside Press, the gallery opening in it · `decision` · "I want to implement flat design like the new litt.design page. gray, soft, animated thoughtfully", then "Flat as a choice" · a project may run flat (`data-material="flat"`): the depth ladder by fill alone · `→ decision (Signature)`
  3. `color` · Flat's neutrals: litt.design's neutral grey over warm stone · `decision` · chose "Neutral grey like litt.design" · under Flat each neutral is its stone value at chroma 0 · `→ decision (Color)`
  4. `motion` · litt.design's blur fades · `decision` · chose "Soft focus, on a hand" · a content swap a hand causes may arrive in soft focus, a blur of at most 4px on the responsive spring, never on scroll · `→ R4`

- [ ] **Step 2: Distill into `profile.md` as v1.4**
- Version line: `v1.4`, with the journal recounted (`grep -c "^- 20" skills/litt-md/taste/journal.md`), `November 2026`.
- Signature: add "A project may run flat instead (`[data-material="flat"]`): the same ladder said by fill alone, where grey is the object and a hairline is the place, nothing casts and nothing catches the light."
- Color: "warm stone neutrals (neutral grey, chroma 0, under Flat)".
- R2: "Flat has no light: no highlight, no lit wall, no cast; floating things keep their glow and ring."
- R3: one paragraph that maps each depth under Flat, from the spec's table, by token name. Add to the Check: "under Flat a shadow other than a ring or a floating glow fails".
- R4: after "Nothing moves on its own", add "A content swap a hand causes (a carousel step, a caption, a tab's panel) may arrive in soft focus: the fade with a blur of at most 4px, on the responsive spring; never material, never on scroll." In the Check, add "except soft focus" where filter animation fails. In R2's Check, after "Any animation or transition on background-image, filter or glow opacity fails", add "(soft focus under R4 is the one filter that moves)".
- Open questions: add Q17 word for word from the spec's Opened section.
- Changelog: a v1.4 line that quotes Nick and names the four entries, in the house style of v1.3.

- [ ] **Step 3: Propagate to the system docs and SKILL.md**
- `material.md`: add `### 7. Flat: [data-material="flat"]` after section 6, with the spec's depth table and the empty-shadow and nested-scope notes. Add a Per-theme tuning row: "`--flat-*` · the light stone neutrals at chroma 0 · the dark ones at chroma 0 · Flat changes only the hue, so each pair's contrast holds within a hair, and the check runs every pair again". Add a self-check line: "Under Flat, nothing casts and nothing is lit."
- `foundations.md` §5: one paragraph on soft focus, as R4 has it, adding that `SoftSwap` in the motion engine will be its one implementation (the components theme).
- `SKILL.md`: amend the Signature bullet and the R3 and R4 one-liners, and add to the token quick view: "Flat: `[data-material="flat"]`, with `--flat-canvas` … `--flat-fg-disabled`".

- [ ] **Step 4: Check**

Run: `node skills/litt-md/scripts/check.mjs && claude plugin validate .`
Expected: both pass. Check 1 finds every link, and check 2 finds no Markdown hex.

- [ ] **Step 5: Show Nick the `profile.md` diff, then commit**

```bash
git diff skills/litt-md/taste/profile.md   # show Nick; wait for a yes
git add skills/litt-md/taste skills/litt-md/system skills/litt-md/SKILL.md
git commit -m "taste: v1.4, Flat beside Press (R2, R3), neutral grey under Flat, soft focus on a hand (R4), Q17 opened"
```

---

### Task 3: A look carries the material

**Files:**
- Modify: `gallery/src/gallery/look.ts`
- Modify: `gallery/scripts/test-look.mjs`
- Modify: `gallery/index.html` (the two body scripts before `#root`)

**Interfaces:**
- Produces, in `look.ts`:
  - `type Material = "press" | "flat"`
  - `type Look = { readonly accent: Accent; readonly material: Material; readonly fun: boolean }`
  - `type LookSlug = \`${Accent}${"" | "-flat"}${"" | "-fun"}\``
  - `MATERIALS: readonly { id: Material; name: string; note: string; attribute: "flat" | null }[]`, in picker order: Press (`"Raised blocks in sunken trays, lit from the top"`, null), then Flat (`"Grey fills and hairlines, nothing casts"`, `"flat"`)
  - `materialOf(id: Material)`
  - `GALLERY_LOOK = { accent: "mono", material: "flat", fun: false }`; `REGISTRY_LOOK = { accent: "blue4", material: "press", fun: false }`
  - `LOOKS`: twelve, as accent × material × fun, in that nesting order
  - `lookAttributes(look: Pick<Look, "accent" | "material">, dark: boolean): { "data-theme": "light" | "dark"; "data-accent"?: "mono" | "pink"; "data-material"?: "flat" }`. It moves here from `customize-state.tsx` (`accentScope`), so Node can test it.
  - `lookWords(look)`: `"<Accent name>, <material id> material, <calm|fun> motion"`

- [ ] **Step 1: Write the failing tests in `test-look.mjs`**

Change every existing literal `Look` to carry `material`, and the six-looks claim to twelve. Add these checks:
```js
check(L.LOOKS.length === 12 && new Set(L.LOOKS.map(L.encodeLook)).size === 12, "twelve looks, twelve spellings");
check(L.encodeLook(L.GALLERY_LOOK) === "mono-flat" && L.encodeLook(L.REGISTRY_LOOK) === "blue4", "the gallery opens in mono-flat, the registry installs blue4");
check(L.sameLook(L.decodeLook("pink-fun"), { accent: "pink", material: "press", fun: true }), "a link from before Flat reads as press");
check(L.decodeLook("pink-fun-flat") === null, "the material comes before the motion in a slug");
check(JSON.stringify(L.lookAttributes({ accent: "mono", material: "flat" }, true)) === JSON.stringify({ "data-theme": "dark", "data-accent": "mono", "data-material": "flat" }), "a nested scope carries the material");
check(JSON.stringify(L.lookAttributes({ accent: "blue4", material: "press" }, false)) === JSON.stringify({ "data-theme": "light" }), "Blue 4 on press is a theme and nothing else");
check(L.lookInApp({ accent: "pink", material: "flat", fun: true }) === 'In your app: data-accent="pink" and data-material="flat" on <html>, and <FunMode> around the app.', "the panel says all three edits in one line");
check(L.lookNote(L.GALLERY_LOOK) === "This page shows Monochrome, flat material, calm motion. The registry installs Blue 4 and press material.", "the Install note names the material");
```
The existing `lookInApp` check stays as written once its object gets `material: "press"`.
- index.html harness: the expected paint becomes `{ accent, material }`, read from `document.body.dataset.accent` and `document.documentElement.dataset.material`. Cover: nothing saved gives mono and flat; saved `{ accent: "pink" }` (no `material` key) gives pink and flat; saved `{ material: "press" }` gives mono and no material; `?look=blue4` over saved flat gives no accent and no material; `?look=pink-flat-fun` gives pink and flat.
- tokens.css: the `data-material` values it answers (`/\[data-material="(\w+)"\]/g`) equal `MATERIALS`' non-null attributes, exactly.
- Copy setup and the Copy prompt step: for each look, they ask for `data-material="flat"` exactly when `material === "flat"`, and the nested-theme sentence names `data-material` when they do.

- [ ] **Step 2: Run it and see it fail**

Run: `npm run test:look --prefix gallery`
Expected: FAIL, with "twelve looks" and `lookAttributes is not a function` among the failures.

- [ ] **Step 3: Implement `look.ts`**

The slug grammar is `^(mono|blue4|pink)(-flat)?(-fun)?$`. `edits()` gains a material step when `material !== REGISTRY_LOOK.material`:
```
The material: data-material="flat" on <html>.
   Next.js, app/layout.tsx: <html lang="en" data-material="flat">    Vite, index.html: <html lang="en" data-material="flat">
   Flat says the depth ladder by fill alone, on neutral greys: nothing casts and nothing catches the light. Never set it from an effect.
   An element that sets its own theme (class="dark", class="light" or data-theme) needs data-material="flat" too.
```
`lookSetup`'s count reads "one thing", "two things" or "three things". `lookInApp` joins the attributes with " and " before a single " on <html>". `lookNote` adds `"press material"` to what the registry installs instead. `looksDoc` documents `look=<accent>[-flat][-fun]`, gives one bullet per material, and lists the twelve looks.

- [ ] **Step 4: Update `index.html`'s pre-paint scripts**

In the first body script, set `document.documentElement.dataset.material = "flat";` next to `document.body.dataset.accent = "mono";`, and inside the saved-choice block, `if (c.material === "press") delete document.documentElement.dataset.material;`. In the link script, use the slug regex above, then `if (m[2]) document.documentElement.dataset.material = "flat"; else delete document.documentElement.dataset.material;`. Update both comments to say the material lives on `<html>`, like `data-theme`.

- [ ] **Step 5: Run it and see it pass**

Run: `npm run test:look --prefix gallery`
Expected: PASS, with every claim listed.

- [ ] **Step 6: Commit**

```bash
git add gallery/src/gallery/look.ts gallery/scripts/test-look.mjs gallery/index.html
git commit -m "gallery: a look carries the material, twelve looks and the flat link"
```

---

### Task 4: Customize picks the material

**Files:**
- Modify: `gallery/src/gallery/customize-state.tsx` (`Saved`, `own`, the layout effect, the storage effect, the header comment; delete `accentScope`)
- Modify: `gallery/src/gallery/customize.tsx` (a Material `CardPicker`, `MaterialPreview`, `Window`, Surprise me, the rule list, the footer copy)
- Modify: `gallery/src/gallery/swatch.tsx` (`AccentChip`)
- Modify: `.claude/CLAUDE.md` (the Gallery notes on looks and the Customize panel)

**Interfaces:**
- Consumes: `Material`, `MATERIALS`, `materialOf`, `lookAttributes`, `GALLERY_LOOK` (Task 3).
- Produces: `useCustomize().look.material`, and `setLook({ material })`.

- [ ] **Step 1: State.** `Saved` gains `material?: Material`. `own` reads a valid saved material, else `GALLERY_LOOK.material`. The layout effect writes `document.documentElement.dataset.material` from `materialOf(look.material).attribute`, deleting it for Press. The storage effect saves `material` only when it differs from `GALLERY_LOOK.material`. Delete `accentScope`; its callers use `lookAttributes`.

- [ ] **Step 2: Panel.** Add a `CardPicker` with legend `"Material"` between Accent and Theme, valued `look.material`, with `onValueChange={(material) => setLook({ material })}`. Each option is `{ value, label: name, picture: <MaterialPreview material={id} /> }`. `MaterialPreview` is a block in a tray, drawn with the tray and block classes `CardPicker` itself uses, inside a span spread with `lookAttributes({ accent: look.accent, material }, dark)`. `Window` and `AccentChip` spread `lookAttributes({ accent, material: look.material }, dark)`. Surprise me also picks a material and says it: `"<Accent>, <material> material, <shape> corners, <face> and <calm|fun> motion."` Footer: "The gallery's defaults: …, monochrome, flat and calm motion. The registry ships Blue 4 and press." and "A look carries the accent, the material and the motion."

- [ ] **Step 3: Repo notes.** In `.claude/CLAUDE.md`, in the Customize paragraph, add the material (Press or Flat, `data-material="flat"` on `<html>`, which tokens.css answers; the gallery opens in Flat, the registry ships Press, Q17). In the looks paragraph, say "the accent, the material and motion's feel", "twelve looks" and `pink-flat-fun`.

- [ ] **Step 4: Check**

Run: `npm run verify --prefix gallery && npm run build --prefix gallery`
Expected: both pass. Typecheck catches every caller still on `accentScope`.

- [ ] **Step 5: See it in a browser.** Run `npm run dev --prefix gallery`. Open Customize: the gallery opens on Flat, the Material tiles show a block in a tray in each material, and picking Press puts the casts back with no reload flash. The Window previews and accent chips follow the material. Reload and the choice holds. `?look=pink` shows Pink on Press without saving it.

- [ ] **Step 6: Commit**

```bash
git add gallery/src/gallery .claude/CLAUDE.md
git commit -m "gallery: Customize picks Press or Flat, and the gallery opens in Flat"
```

---

### Task 5: The registry ships the attribute

**Files:**
- Modify: `gallery/scripts/gen-registry.mjs:767` (the `litt` item's docs sentence)
- Modify: `gallery/CHANGELOG.md`, `gallery/registry.lock.json` (regenerated)
- Modify: `gallery/scripts/test-registry.mjs` (the `look` case near line 828 and its assertions)

**Interfaces:**
- Consumes: Task 1's block, which the generator renames to `--litt-flat-*`. The attribute name stays `data-material`.

- [ ] **Step 1: The failing host test.** In `test-registry.mjs`'s look case, put `data-material="flat"` on `<html>` beside `data-accent="pink"`, in both the Vite and the Next.js edits. Mirror the pink assertions: in light, `.dark` and system dark, the secondary Button's computed `box-shadow` has no layer with a non-transparent color, and its `background-color` equals the computed `--litt-surface-3` of that theme. Also check that `--litt-canvas` resolves to that theme's `--litt-flat-canvas`.

- [ ] **Step 2: Run it and see it fail**

Run: `npm run build --prefix gallery && npm run test:registry --prefix gallery`
Expected: the look case fails on the Button's shadow until the regenerated `litt` item carries the flat block. If it passes already (tokens.css is synced on prebuild), say so and move on: the test still pins Review Focus 5.

- [ ] **Step 3: Docs and changelog.** Append to the docs sentence: ` For Flat instead of the press material, set data-material="flat" on <html>.` Add to `CHANGELOG.md`, under the release for the day you commit (if it exists, add a sentence to its intro; else start `## <date> · Flat: a second material`):
`- **changed** \`litt\`: a second material, Flat. \`data-material="flat"\` on \`<html>\` says the depth ladder by fill alone, on neutral greys (\`--litt-flat-*\`, the stone neutrals at chroma 0, in each theme): a tray is a hairline, a raised block a grey fill, and nothing casts or catches the light. Glass and its glow stay. Nothing changes until you set the attribute; Press stays the default.`

- [ ] **Step 4: Run every gate**

Run: `npm run verify --prefix gallery && npm run build --prefix gallery && npm run test:registry --prefix gallery && npm run test:wall --prefix gallery && npm run test:motion --prefix gallery && npm run test:a11y --prefix gallery && npm run test:home --prefix gallery`
Expected: all pass. `test:wall` and `test:a11y` now run in Flat, the gallery's default. An a11y contrast failure there is Review Focus 3: report it to Nick.

- [ ] **Step 5: Commit**

```bash
git add gallery/scripts gallery/CHANGELOG.md gallery/registry.lock.json
git commit -m "gallery: the litt item ships Flat behind data-material, and the host test proves it in every theme"
```

---

### Task 6: Look at it, and hand off to the components theme

**Files:**
- Modify: `gallery/scripts/shot.mjs` (a `--look <slug>` flag)
- Modify: `proposals/flat.md` (append "What the build showed")
- Modify: `gallery/HANDOFF.md` (the round's entry and Nick's next look)

- [ ] **Step 1: `--look`.** Add `const look = get("look", "")`, and append `?look=${look}` before the hash in the URL `shot.mjs` loads. Document it in the header's usage line.

- [ ] **Step 2: Shoot Press against Flat.** For each page in `overview button input checkbox switch segmented slider card-picker select tabs card dialog menu`, run `node gallery/scripts/shot.mjs --dist gallery/dist --page <page> --look mono --out .agent-shots/flat/press` and again with `--look mono-flat --out .agent-shots/flat/flat`. For `dialog`, add `--click "button:has-text('Open')"`, and for `menu`, the trigger's click. Expected: no console errors and no overflow lines.

- [ ] **Step 3: Read every pair, against R1's check.** Remove the press material, and the page must still read as finished. Append a table to `proposals/flat.md` under `## What the build showed`, with one row per page: what reads, what doesn't, and which component recipe the components theme should change (a card's grey frame, a round icon button, the card picker's pick, a cap that disappears). Don't change components here.

- [ ] **Step 4: Hand off.** Add the round to `gallery/HANDOFF.md`: what shipped, Q17, and Nick's look at Flat on the overview, Customize and the slider, in both themes and on a phone. Then commit and ask Nick before pushing.

```bash
git add gallery/scripts/shot.mjs proposals/flat.md gallery/HANDOFF.md
git commit -m "docs: Flat against Press on every page, the components theme's input"
```
