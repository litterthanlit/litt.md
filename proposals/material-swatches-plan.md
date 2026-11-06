# Material swatches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the three Material choices in the Customize panel (Press, Flat, Device) tell themselves apart at a glance, each drawn in its own material and named.

**Architecture:** Today the Material row is three `Swatches` (`gallery/src/gallery/customize.tsx`): flat blocks with `bg-block` and `--block-lift`, named only when picked. At swatch size Press and Device both read as near-white blocks, and Flat in dark disappears into the panel. Each swatch becomes a specimen, a key standing in a tray with its name on the key, scoped to its own material by `lookAttributes`. That way the tokens draw the difference: Press raised and casting, Flat a fill in a hairline tray with no shadow, Device an aluminium key with a hard 2px drop and its name in Geist Mono. The name shows on every material swatch, since a surface does not say what it is the way a color does. Accent swatches keep the name-only-when-picked rule.

**Tech Stack:** React 19, Tailwind 4 with litt's tokens, the gallery's Playwright home check (`gallery/scripts/home.mjs`).

**Spec:** No written spec. The decisions come from this session's review of PR litterthanlit/litt.md#81: "material buttons aren't distinctive enough", and unlabeled material swatches failed in the prototype (Press and Device look alike in light, Flat vanishes in dark). They are restated in Global Constraints.

## Global Constraints

- No hex values and no off-scale radii in `gallery/src` (`npm run lint:litt --prefix gallery`).
- Every color, shadow and font comes from a token answered under the swatch's own `data-material` (spread `lookAttributes({ accent: look.accent, material }, dark)`). No per-material class names that restate token values.
- Order stays Material, then Accent (material picks first, since it changes the accents).
- Each option stays a native radio named `Press`, `Flat` or `Device` (`aria-label`), inside a fieldset with legend `Material`. `home.mjs` clicks these.
- The pick is the ring in `--fg` outside the swatch (`outline-2 outline-offset-2`), and `--focus` for the keyboard, the same as Accent.
- Nothing moves at rest, and nothing moves under reduced motion (`npm run test:motion`).
- Only `gallery/src/gallery/customize.tsx` and `gallery/scripts/home.mjs` change. No component, token, registry or changelog change.

## Review Focus

1. **Dark theme, Flat:** the Flat swatch must stay visible on the dark panel. Its key's hairline (`--line-strong`) has to read against `--tray`. Under Flat, `--tray` is transparent and `--block-lift` is no shadow, so the hairline is the tray's `--tray-shade` (`inset 0 0 0 1px var(--line-strong)`), and the key is a `--block` (`--surface-3`) fill. Pinned in Task 1 (claim 3) and the Task 2 screenshots.
2. **Forced colors:** shadows vanish there, so the three specimens must still differ by their names and borders. Covered by `forced-colors:border` in Task 2 and the forced-colors screenshot.
3. **Device under the Pink and Mono accents:** the specimen draws no accent, so it must look the same under all three accents. Pinned in Task 1 (claim 4).
4. **Panel width at 320px (phone sheet):** three specimens with names must not overflow. `test:reflow` does not open the panel, so Task 2 checks a 320px screenshot.
5. **Picked Device in dark:** the `--fg` ring must stay visible against Device's dark body. Checked in the Task 2 screenshots.

---

### Task 1: Pin the distinction in the home check

**Files:**
- Modify: `gallery/scripts/home.mjs` (the "header's Customize panel" block, around line 171)

**Interfaces:**
- Consumes: the panel's `fieldset` with legend `Material`, and inside each `label` a tray marked `data-material-tray` holding a key marked `data-material-key` (Task 2 adds both).
- Produces: four claims Task 2 must make pass.

- [ ] **Step 1: Write the failing claims.** After the Accent claims, read each specimen's computed style:

```js
const material = panel.locator("fieldset", { has: pg.locator("legend", { hasText: /^Material$/ }) });
const specimens = () => material.locator("[data-material-tray]").evaluateAll((els) =>
  els.map((t) => { const k = t.querySelector("[data-material-key]"); return { text: k.textContent.trim(), key: getComputedStyle(k).boxShadow, tray: getComputedStyle(t).boxShadow, font: getComputedStyle(k).fontFamily }; }),
);
const s = await specimens();
check(s.map((x) => x.text).join("|") === "Press|Flat|Device", "every material swatch names itself: Press, Flat, Device");
check(new Set(s.map((x) => x.key)).size === 3, "the three material keys cast three different shadows");
check(s[1].tray.includes("inset"), "the Flat tray draws its hairline, so Flat never vanishes into the panel");
```

Then claim 4, once, across the accents: read `s[2].font` and `s[0].font` with Mono picked, then pick `Pink` and `Blue 4` through `accentTiles` (the label for each radio) and read them again. Pass if all three Device fonts match `/Geist Mono|monospace/`, no Press font contains `Geist Mono`, and the three Device key shadows are equal. Claim text: `"Device's key is Geist Mono and the same under every accent; Press's is not mono"`.

- [ ] **Step 2: Run it and see it fail.**
Run: `npm run build --prefix gallery && npm run test:home --prefix gallery`
Expected: `✗ every material swatch names itself` and the other three fail, since no `[data-material-tray]` exists yet.

- [ ] **Step 3: Commit.** Leave it out. Task 1 and Task 2 land as one commit, so the branch never has a red check.

### Task 2: Material swatches as specimens

**Files:**
- Modify: `gallery/src/gallery/customize.tsx` (the `Swatch` type, `Swatches`, and the Material block in `CustomizePanel`)

**Interfaces:**
- Consumes: `lookAttributes(look, dark)` and `MATERIALS` from `./look`. `useDark()` from `./customize-state`.
- Produces: `type Swatch<T> = { value: T; label: string; className: string; style?: CSSProperties; attrs?: Record<string, string>; content?: ReactNode; named?: boolean }`. `content` replaces the default label inside the box. `named` shows the label even when not picked (default `false`, as Accent has it now).

- [ ] **Step 1: Extend `Swatch` and `Swatches`.** When `o.content` is given, render it in place of the label span. When `o.named`, render the label regardless of the pick. Keep the hidden radio and its `aria-label` unchanged.

- [ ] **Step 2: Add `function MaterialKey({ name }: { name: string })`.** It draws a key standing in a tray, the name on the key:
  - Tray: `data-material-tray`, `grid h-full w-full place-items-center rounded-control bg-tray p-1.5 shadow-(--tray-shade)`
  - Key: `data-material-key`, `grid h-9 w-full place-items-center rounded-[calc(var(--radius-control)-2px)] bg-block font-sans text-small font-title text-fg shadow-(--block-lift) forced-colors:border`
  - `font-sans` is what makes Device's name Geist Mono, since `--font-sans` is restated under `data-material="device"` (tokens.css, `--font-sans: var(--font-mono)`). Do not name a mono font yourself.

- [ ] **Step 3: Wire the Material row.** Each option passes `attrs: lookAttributes({ accent: look.accent, material: m.id }, dark)`, `className: "h-16 p-0"`, `content: <MaterialKey name={m.name} />` and `named: true`. Accent options are unchanged.

- [ ] **Step 4: Run the checks.**
Run: `npm ci --prefix gallery && npm run verify --prefix gallery && npm run build --prefix gallery && npm run test:home --prefix gallery && npm run test:motion --prefix gallery && npm run test:forced-colors --prefix gallery`
Expected: `home: 63 claims hold.` (59 plus Task 1's four), `nothing moved`, `every highlight stands apart`.

- [ ] **Step 5: Look at it.** Screenshot the open panel at deviceScaleFactor 2 in light and dark, with each material picked, and once at a 320px viewport, plus one forced-colors capture (`page.emulateMedia({ forcedColors: "active" })`). Pass if, in every shot:
  - the three keys read as three different objects without reading the names (cover the names to check);
  - Flat stays visible in dark;
  - the picked ring is visible;
  - nothing overflows at 320px.

  If Press and Flat still read alike in light, stop and report back with the screenshots before inventing another cue. The next cue (Device's LCD screen, `.litt-raised`) is a design decision for Nick.

- [ ] **Step 6: Commit with Task 1.**

```bash
git add gallery/src/gallery/customize.tsx gallery/scripts/home.mjs
git commit -m "Customize: material swatches drawn in their own material"
```

### Task 3: Update the PR

**Files:**
- None in the repo. This updates the description of PR litterthanlit/litt.md#81.

- [ ] **Step 1: Push** `claude/stoic-brown-hivznl` and wait for the Vercel preview to reach READY.
- [ ] **Step 2: Edit the PR description.** Replace the Material bullet with the specimen design, list the four new home claims, and attach the light, dark and forced-colors screenshots from Task 2, Step 5.
