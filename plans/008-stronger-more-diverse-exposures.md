# Plan 008: The long exposures get stronger and more diverse: five kinds of field, a dozen palettes, one shared WebGL context

> **Executor instructions**: This plan is a brief for a strong executor. It
> fixes the goal, the constraints, the contracts and the acceptance checks,
> and leaves the drawing to you. Read it fully before starting. Honour the
> "STOP conditions". Do not edit `plans/README.md`; the reviewer maintains it.
>
> **Drift check (run first)**:
> `git diff --stat 43abde4..HEAD -- gallery/src/canvas gallery/src/motion/index.tsx gallery/src/components proposals/bokashi.md`
> If anything but `plans/` changed since this plan was written, read the
> change before proceeding; if it touches `gallery/src/canvas/streaks.tsx` or
> `registry.tsx`, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: LOW for the product (nothing shipped changes: the pictures live on the canvas, which the page checks never visit); MEDIUM for the work (shader drawing judged by eye)
- **Depends on**: 007 (done; `gallery/src/canvas/streaks.tsx` must be present)
- **Category**: direction
- **Planned at**: commit `43abde4`, 2026-11-11

## Why this matters

Nick wants Flat's pictures to be "japanese moving gradients". Plan 007 put
Nick's own long exposure (the shader from Gradient Keys in the public repo
`litterthanlit/components`) on the language canvas in five palettes. Nick's
answer, 2026-11-11: "I like this! let's make it stronger tho and more
diverse".

Read those two words this way:

- **Stronger** means more presence: deeper darks, pigment at full strength in
  the middle, a clearer structure, brighter glints. It does not mean faster.
  Flat's interface is airy and monochrome (its accent is the ink), so its
  pictures are where the colour lives; a strong picture on a quiet page is the
  point.
- **More diverse** means two things. Today all five pictures are the same fan
  of streaks in five single-pigment ramps, so they read as one picture
  recoloured. Diversity needs (a) different kinds of field, each a different
  subject, and (b) a wider set of palettes, including some that travel through
  more than one hue.

Nick picks from what is on the canvas, so the job is to give Nick a real
choice: several fields that are clearly different pictures, in palettes that
are clearly different moods, with the original kept beside them for
comparison.

## Current state

- `gallery/src/canvas/streaks.tsx` (473 lines, from plan 007). Read it all
  first. It holds:
  - `VERTEX` and `FRAGMENT`: the two shaders, copied unchanged from Gradient
    Keys. The fragment shader draws a fan of streaks (polar coordinates about
    a point below and left of the frame, three-octave fbm, a five-stop ramp
    mixed in linear light, animated grain, a pointer light and a press ring).
  - `Palette` (five hex stops, dark to light), `Exposure`, and `EXPOSURES`:
    Wakatake, Ai, Sakura (Nick's, with Nick's seeds 3, 1, 5), Sumi and Fuji
    (added in 007). Each palette line carries `litt-allow`.
  - `StreakField({ id, palette, seed, paused, hand })`: one WebGL context per
    field, a render loop that runs only while the field is on screen, not
    paused, and motion is allowed (`useMotionDial().reduced` from `@/motion`).
    It marks itself `data-streaks={id}` and `data-running` while streaming.
  - `StreakPrints` (five prints in a row, one Pause button) and `StreakHero`
    (Flat's hero today beside a long exposure, with palette buttons, Pause,
    and Follow the hand).
- `gallery/src/canvas/registry.tsx` ends its `ITEMS` array with four entries
  in a column at `x: BOKASHI_X` (-2600): `bokashi-skies` (y 0), `bokashi-hero`
  (y 620), `streaks-prints` (y 1140), `streaks-hero` (y 1760). `width` is the
  piece's width; `height` is nominal and the frame grows with its content.
- `proposals/bokashi.md` has a section `## A second candidate: long
  exposures` with a palette table, costs, and decisions 8 to 12.
- `plans/007-long-exposures-on-the-canvas.md` carries the browser check from
  007 (`check-streaks.mjs`) and a ten-line script (`take.mjs`, Step 2) that
  extracts it. Use them as your starting point for the check.
- The language canvas (`gallery/src/canvas/canvas.tsx`) zooms and pans with a
  CSS transform on the element that holds every piece; it opens zoomed far
  out (about 13%). It is reached at `index.html?look=flat#canvas` in a build.
- `gallery/.agent-shots/` is gitignored: scripts and screenshots go there.

### Rules that bind this work

- The lint (`npm run lint:litt --prefix gallery`) fails on a quoted hex colour
  in `gallery/src` unless that line carries the words `litt-allow`, and on
  literal motion timings in object literals (`duration: 0.6`), looping CSS
  animations, off-scale radii, and non-token shadows. Read
  `skills/litt-md/scripts/lint-litt.mjs` lines 128 to 210 if a line fails.
  Candidate palette lines carry `litt-allow` with a reason; nothing else in
  the file should need it.
- Only token utilities for everything that is interface (frames, captions,
  buttons): `rounded-surface`, `text-small`, `text-caption`, `text-fg`,
  `text-fg-subtle`, `bg-surface-3`, the gallery's `Button`, `Slider` and
  other components from `@/components`. Nothing above 18px, weights by role
  (`font-normal`, `font-title`, `font-label`).
- Taste rules R2 and R4 (in `skills/litt-md/taste/profile.md`, which you must
  not edit) keep gradients and unprompted motion still. Nick chose an
  exception for pictures that is not yet in the profile. Until it is: a
  picture is still under reduced motion, still off screen, and can be paused.
- Never push. Never open a pull request. Never edit anything under
  `skills/`, `gallery/src/components/`, `gallery/src/blocks/`,
  `gallery/CHANGELOG.md` or `gallery/registry.lock.json`.
- Refer to Nick by name or as "you"; never use gendered pronouns for Nick.
- No AI model name in any commit message, comment or file.

## What to build

### 1. One shared WebGL context

A browser allows about sixteen WebGL contexts on a page, and this plan puts
more than twenty pictures on the canvas. So no field may own a context.

- One module-level renderer owns the only WebGL canvas (never attached to the
  page, or attached hidden) and one render loop.
- Each field on the page is an ordinary 2D `<canvas>` that the renderer draws
  into: render the field into the shared GL canvas (use the viewport, do not
  reallocate the GL canvas for every field), then `drawImage` the result into
  the field's 2D canvas.
- One compiled program per kind of field, compiled on first use and cached.
- The loop runs only while at least one field is streaming. A field streams
  only while it is on screen (IntersectionObserver), not paused, and motion is
  allowed. Under reduced motion a field is drawn once, and again when its
  palette, field kind or strength changes. Paused, it holds its frame.
- Resolution: sharp at 100% zoom, cheap when the canvas is zoomed out. Size
  each field from its box on screen (which follows the canvas's zoom), capped
  at its layout box times 1.5, and never more than a density of 1.5. Re-check
  the size in the loop, since a transform does not fire a ResizeObserver.
- If WebGL is missing or the context is lost, each field shows the still CSS
  gradient of its palette, as today, and nothing throws. Restore on
  `webglcontextrestored` if that is cheap to do well; otherwise leave the
  gradient.

### 2. Five kinds of field

Keep Nick's fan exactly as it is, as the first kind, and draw at least four
more. Each must be a different subject, recognisable in a still frame, and
each must move slowly and continuously with no beat, pulse or flash. Share
the helpers (hash, noise, fbm, the five-stop ramp in linear light, the grain,
the palette sweep, the pointer light and the ring) so a new field is only its
own `float` field function.

| id | Name | The picture |
|---|---|---|
| `fan` | Nagashi (流し, the pan) | Nick's long exposure: a camera swung through foliage. Unchanged at strength 0. |
| `suminagashi` | Suminagashi (墨流し, floating ink) | Ink dropped on water and combed: nested warped rings and veins, slowly breathing and drifting. Marbled paper. |
| `kasumi` | Kasumi (霞, mist) | Horizontal bands of mist sliding over each other at different speeds, soft edges, a horizon; the bokashi gradation as a field. |
| `komorebi` | Komorebi (木漏れ日, light through leaves) | Large out-of-focus discs of light, overlapping, drifting and slowly swelling. Dappled and airy. |
| `ame` | Ame (雨, rain) | Fine near-vertical streaks of different lengths falling at a slant over a soft gradation, after a woodblock print of rain. |

These five are the brief, not a cage. If one will not come out well, replace
it with a better subject from the same tradition (for example nami, long
waves; or yuki, slow snow) and say so in your report. Do not ship a field you
would not pick yourself. Check each Japanese name and its gloss; do not
invent words.

### 3. Strength

Add one number, `strength`, from 0 to 1, as a uniform every field reads.

- At 0 the fan must draw exactly what it draws today.
- At 1 the picture has more presence: a steeper tone curve (deeper darks,
  cleaner lights), a little more saturation in the middle stops (do it in the
  ramp, in linear light, not as a filter over the canvas), and brighter, a
  few more, glints or highlights. No change of speed.
- New fields are designed at strength 1 and must still hold together at 0.

### 4. A dozen palettes

Keep the five in `EXPOSURES` as they are. Add at least seven more, so there
are at least twelve, in two groups:

- **Full-strength single pigments**, deeper and more saturated than the five:
  choose from the traditional colours, for example ruri (瑠璃, lapis), beni
  (紅, crimson), yamabuki (山吹, golden yellow), kaki (柿, persimmon), matcha
  (抹茶), gunjō (群青, ultramarine), moegi (萌黄, spring green).
- **Journeys through more than one hue**, still five stops from dark to
  light: for example yūyake (夕焼け, sunset: indigo, violet, coral, gold),
  ajisai (紫陽花, hydrangea: blue, violet, pink), momiji (紅葉, maple: deep
  green, rust, gold), akatsuki (暁, dawn).

Rules for palettes: five stops, dark to light in luminance, so the ramp never
bands or inverts; real names with a correct gloss; each line carries
`litt-allow` with the reason; no two palettes that read as the same mood.
Warm palettes (beni, kaki, yamabuki) are allowed because Flat's accent is the
ink; say in the proposal that they are for Flat only, since Device's accent
is orange and Press's is blue.

### 5. The canvas pieces

All in the same column (`x: BOKASHI_X`), under the bokashi pieces. Keep ids
that exist; choose `y` values so no two pieces overlap (measure the frames in
a screenshot; leave about 180px between them).

- `streaks-prints` (exists): keep it as the baseline. Rename it "Long
  exposure · as in Gradient Keys": the fan, strength 0, the first five
  palettes. Its look must not change.
- `streaks-fields` (new): "Long exposure · five fields": one print of each
  field, each in the palette that suits it best, at strength 1, with the
  field's name, its Japanese name and one line saying what it is.
- `streaks-palettes` (new): "Long exposure · twelve palettes": every palette
  as a print, at strength 1, with buttons that switch the field for the whole
  wall.
- `streaks-hero` (exists): Flat's hero today beside the picture, now with a
  field picker, a palette picker, a strength slider (the gallery's `Slider`),
  Pause, and Follow the hand. Changing the field or the palette must not
  remount the canvas.
- Every piece that moves has its own Pause button, as today.

Each field's host element keeps this contract, which the checks read:
`data-streaks="<unique id>"`, `data-field="<field id>"`,
`data-palette="<palette id>"`, `data-running` present only while it streams,
and exactly one `<canvas>` inside it.

### 6. The proposal

In `proposals/bokashi.md`, bring the section `## A second candidate: long
exposures` up to date, in the document's plain voice:

- Quote Nick's second answer ("I like this! let's make it stronger tho and
  more diverse").
- Replace the palette table with two tables: the fields (name, Japanese name,
  what it is) and the palettes (name, group, what it is, and "from Gradient
  Keys" for Nick's three).
- Update the costs: the WebGL point now says one shared context serves every
  picture on a page; add that strength is one number; add that warm palettes
  are for Flat only.
- Update decision 9 (which palettes) and add decisions: which fields go in,
  and what strength Flat ships at. Give a suggestion for each, from what you
  saw.
- Do not touch the rest of the document, and do not fill in the Decision
  column: those are Nick's.

## How to work

This is drawing, so work by eye, in rounds.

1. Get the shared renderer working with the fan only, and prove the baseline
   row still looks as it did (compare a screenshot of `streaks-prints` under
   reduced motion, before and after; small differences from the resampling
   are fine, a different picture is not).
2. Draw one field at a time. For each, render stills at several moments
   (set the time directly in a scratch page or script under
   `gallery/.agent-shots/`), at a print's shape (4 to 5) and the hero's (2.4
   to 1), and look at the images yourself. Judge: is the subject recognisable;
   is it clearly not the fan; does it hold at both shapes; does it band,
   alias or shimmer; is there any flash.
3. Then the palettes, on at least two fields each.
4. Then the pieces on the canvas, in light and dark, at real size (the canvas
   opens zoomed out; for a screenshot, set the transform of the element that
   holds the pieces, as a script, not in the source).
5. Do at least two full rounds of look, then change. Keep the stills from
   each round in `gallery/.agent-shots/` and say in your report what you
   changed between rounds and why.

Accessibility, which you must check and not assume:

- Nothing flashes: no change in a picture's overall brightness faster than
  three times a second (WCAG 2.3.1). Glints fade in and out; they do not blink.
- Every moving piece can be paused, and everything is still under reduced
  motion (WCAG 2.2.2, 2.3.3).
- Pictures are decorative here: the field is `aria-hidden`, its frame has
  `role="img"` and a label naming the field and the palette.
- Pickers are real buttons with `aria-pressed`; the slider has a label.

## Commands you will need

Run from the repo root.

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm ci --prefix gallery` | exit 0 |
| Verify (also generates the files typecheck needs) | `npm run verify --prefix gallery` | exit 0 |
| Typecheck | `npm run typecheck --prefix gallery` | exit 0 |
| Lint | `npm run lint:litt --prefix gallery` | ends with `files clean.` |
| Build | `npm run build --prefix gallery` | exit 0 |
| Skill checks | `node skills/litt-md/scripts/check.mjs` | ends with `All checks passed.` |
| Shipped files untouched | `git diff --exit-code <starting commit> -- gallery/registry.lock.json gallery/CHANGELOG.md skills gallery/src/components gallery/src/blocks` | exit 0, no output |

Playwright is deliberately not a dependency. `require("playwright")` resolves
from `/opt/node22/lib` in this environment (see how plan 007's check finds
it). If it is missing, install it beside the repo:

```bash
npm install --prefix "${TMPDIR:-/tmp}/a11y" --no-save --no-package-lock playwright@1.56.1
"${TMPDIR:-/tmp}/a11y/node_modules/.bin/playwright" install chromium
export A11Y_TOOLS="${TMPDIR:-/tmp}/a11y"
```

## Scope

**In scope**:
- `gallery/src/canvas/streaks.tsx` (rewrite freely; you may split it into
  more files in `gallery/src/canvas/`, each named `streaks-*.ts(x)`)
- `gallery/src/canvas/registry.tsx` (imports and the entries named above)
- `proposals/bokashi.md` (the one section)

**Out of scope**:
- `gallery/src/canvas/bokashi.tsx` and its two entries; `canvas.tsx`,
  `layout.ts` and the other experiments.
- Everything under `skills/`, `gallery/src/components/`, `gallery/src/blocks/`,
  `gallery/src/gallery/`, `gallery/src/motion/`.
- `gallery/CHANGELOG.md`, `gallery/registry.lock.json`, any token file.
- `plans/`.

## Git workflow

- Branch: the one the operator gave you.
- Commits, in order: `gallery: one shared WebGL context for the long exposures`;
  `gallery: five fields, twelve palettes and a strength for the long exposures`;
  `proposals: stronger and more diverse long exposures`. Split further if it
  helps a reader; do not squash the renderer into the drawing.
- Do NOT push or open a PR.

## The check

Start from plan 007's `check-streaks.mjs` and adapt it to the new pieces, in
`gallery/.agent-shots/check-streaks.mjs`. It must fail, with a message, on
each of these, with motion allowed and with reduced motion:

- More than one WebGL context is created on the page (count successful
  `getContext("webgl")` and `"webgl2"` calls with an init script).
- Fewer than five field ids or fewer than twelve palette ids among the
  fields' `data-field` and `data-palette` values.
- A field host without exactly one canvas, or a page error.
- Motion allowed: any on-screen field whose picture is the same after two
  seconds; any field still running or changing after every Pause is pressed;
  any field not changing again after Play.
- Reduced motion: any field running, or any picture changing by itself.
- The hero not changing when a palette is picked, when a field is picked, and
  when the strength slider is moved, in both modes.
- The hero's canvas being replaced by a new element when a field or palette
  is picked.
- At zoom 1 (set the transform in the script), a print's canvas narrower than
  its width on screen.

It ends with one line saying it passed, and exit code 0.

## Done criteria

- [ ] The check above exits 0, twice in a row
- [ ] `npm run verify --prefix gallery`, `npm run build --prefix gallery` exit 0; lint ends `files clean.`
- [ ] `node skills/litt-md/scripts/check.mjs` ends with `All checks passed.`
- [ ] The shipped-files command prints nothing
- [ ] `git diff --stat <starting commit> HEAD` lists only files in scope
- [ ] At least five fields and twelve palettes are on the canvas, with the baseline row unchanged in look
- [ ] Stills of every field (two shapes) and every palette, and screenshots of the four pieces in light and dark at real size, are in `gallery/.agent-shots/`, and you have looked at them
- [ ] The proposal section is updated, with the Decision column still empty

## STOP conditions

Stop and report (do not improvise) if:

- `gallery/src/canvas/streaks.tsx` is missing or is not the 473-line file plan 007 describes.
- The shared-context design cannot keep the fan at strength 0 looking as it does today.
- `verify` fails on a registry version or lock complaint: this work must not change what the registry ships.
- The work seems to need a change outside the scope, a new dependency, or a change to a taste rule.
- After three rounds a field still does not read as its subject and you have no better subject: ship the fields that work (at least four in all) and report the gap.

## Maintenance notes

- **The fan is Nick's.** Its field function is a copy of the shader in `litterthanlit/components`, `src/registry/components/gradient-keys.tsx`. If Nick retunes Gradient Keys, copy the change across.
- **Everything else here is a candidate.** When Nick fills in `proposals/bokashi.md`, a later plan ships the picked fields and palettes into Flat as a real part with picture tokens in `tokens.css`, the rule wording in the profile through `workflows/evolve.md`, a pause control on each picture, and removes what was not picked from the canvas.
- **The shared renderer is the part worth keeping.** A shipped picture part should be built on it, so a page of covers costs one context.
