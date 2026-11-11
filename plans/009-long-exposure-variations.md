# Plan 009: Only the long exposure stays, and it varies: more bold palettes, two-palette pictures, and new cuts of the fan

> **Executor instructions**: This plan is a brief for a strong executor. It
> fixes the goal, the constraints, the contracts and the acceptance checks,
> and leaves the drawing to you. Read it fully before starting. Honour the
> "STOP conditions". Do not edit `plans/README.md`; the reviewer maintains it.
>
> **Drift check (run first)**:
> `git diff --stat 4667802..HEAD -- gallery/src/canvas proposals/bokashi.md`
> If anything there changed since this plan was written, read the change
> before proceeding; if it touches the `streaks*` files or `registry.tsx`,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: LOW for the product (canvas only; nothing shipped changes); MEDIUM for the work (drawing judged by eye)
- **Depends on**: 008 (done)
- **Category**: direction
- **Planned at**: commit `4667802`, 2026-11-11

## Why this matters

Plan 008 put five kinds of moving picture in twelve palettes on the language
canvas. Nick looked at the preview, at the wall "Long exposure · twelve
palettes" showing the fan (Nagashi), and said, 2026-11-11:

> "I only like long exposure, especially the ones of the bottom, if we could
> variate from them would be sick."

That settles three things and asks for one:

- **Long exposures, not skies.** The bokashi skies go.
- **One field: the long exposure** (Nagashi, Nick's fan from Gradient Keys).
  Suminagashi, Kasumi, Komorebi and Ame go.
- **The bottom row is the taste**: Beni, Yamabuki, Yūyake, Ajisai, Momiji,
  Hotaru. These are the full-strength pigments and the journeys through more
  than one hue. The top row (Wakatake, Ai, Sakura, Sumi, Fuji, Ruri) is liked
  less.
- **Vary from them.** More pictures in the spirit of those six, all of them
  long exposures.

## Current state

Read these first, all of them:

- `gallery/src/canvas/streaks.tsx`: the components (`StreakField`, the prints,
  the walls, the hero).
- `gallery/src/canvas/streaks-shaders.ts`: a shared head, one `field()`
  function per kind of field, a shared main. The fan's function is Nick's
  shader from Gradient Keys.
- `gallery/src/canvas/streaks-renderer.ts`: one module-level WebGL canvas and
  loop that draws every field into its own 2D canvas.
- `gallery/src/canvas/streaks-palettes.ts`: twelve palettes in three groups
  (soft, pigment, journey), five hex stops each, dark to light, each line
  marked `litt-allow`.
- `gallery/src/canvas/bokashi.tsx`: the skies.
- `gallery/src/canvas/registry.tsx`: its `ITEMS` array ends with six entries
  in a column at `x: BOKASHI_X`: `bokashi-skies`, `bokashi-hero`,
  `streaks-prints` ("as in Gradient Keys"), `streaks-fields`,
  `streaks-palettes`, `streaks-hero`.
- `proposals/bokashi.md`: the proposal, with fourteen decisions, none filled.
- `plans/008-stronger-more-diverse-exposures.md`: the brief this builds on.
  Its "Rules that bind this work" section, its data-attribute contract and
  its "How to work" section all still apply; this plan does not repeat them.

In the fan's shader, a palette change already runs out along the streaks:
`uMix` moves from 0 to 1 and the new palette arrives from the fan's root to
its tips. Held partway, that same mechanism gives a picture that is one
palette at the root and another at the tips. Use it for the two-palette
pictures below.

## What to build

### 1. Take away what Nick did not pick

- Delete `gallery/src/canvas/bokashi.tsx` and its two entries in
  `registry.tsx` (and its import). Rename `BOKASHI_X` to `PICTURES_X` and fix
  its comment.
- Remove the four fields that are not the fan: their shader functions, their
  entries, the `streaks-fields` piece, and the field pickers on the palette
  wall and the hero. Remove anything that then has no user (types, props,
  helpers, the cross-fade between kinds of field). Leave no dead code.
- Keep the shared renderer, the strength control, the pause buttons, Follow
  the hand, and the baseline row `streaks-prints` ("as in Gradient Keys": the
  fan, strength 0, the five soft palettes), whose look must not change.

### 2. More palettes in the spirit of the bottom row

Keep all twelve. Add at least ten more, so there are at least twenty-two,
all in the two groups Nick liked:

- **Pigments at full strength**: for example kaki (柿, persimmon), shu (朱,
  vermilion), gunjō (群青, ultramarine), moegi (萌黄, spring green), murasaki
  (紫, purple), enji (臙脂, deep crimson), kohaku (琥珀, amber), hisui (翡翠,
  jade).
- **Journeys through more than one hue**: for example akatsuki (暁, dawn),
  tasogare (黄昏, dusk), yozakura (夜桜, cherry blossom at night), shinkai
  (深海, deep sea), budō (葡萄, grape), hanabi (花火, fireworks).

The examples are a pool, not a list to fill. Same rules as 008: five stops,
dark to light in luminance; real names with a correct gloss; `litt-allow` on
each line; no two that read as the same mood. Look at the six Nick liked and
say to yourself what they share (a dark that is nearly black, a middle at
full chroma, a light that is tinted, not white; in the journeys, a second
hue that arrives suddenly) and draw the new ones to that.

Two of the twelve are weak on the fan: Ajisai and Yūyake go mostly pale.
You may retune their stops so more of the frame sits in the middle of the
ramp, as long as each still reads as itself.

### 3. Two-palette pictures

A picture that is one palette at the fan's root and another at its tips,
held there (not a transition). Build it on the palette mix that already runs
along the streaks. Draw at least six pairs from the bold palettes, chosen by
eye: neighbours that melt (Beni into Yamabuki) and opposites that clash well
(Ruri into Beni). The seam must be soft and must sit inside the frame at
both shapes (4 to 5 and 2.4 to 1). A pair is named by its two palettes.

When a pair's palettes change, the picture still sweeps to the new pair over
600ms, as a single palette does.

### 4. Cuts: the same long exposure, framed differently

Today every picture is the same composition: streaks fanning up and right
from a point below and left of the frame. Add cuts: the same shader with its
geometry as uniforms (where the fan's root sits, how fine and how long the
streaks are, which way and how fast the fan turns). The numbers in Nick's
shader are the first cut, and with them the picture must be exactly what it
is today.

Draw at least four more cuts that are still plainly the same long exposure,
for example: a sideways sweep (root far to the left, streaks nearly level);
a fall (root far above, streaks nearly upright); a burst (root just outside
a corner, streaks spreading wide); a close cut (fewer, broader streaks, as if
nearer the leaves). Name each plainly in English, with a Japanese name only
if it is a real word used that way. Do not add a cut that reads as a
different subject: no rings, no discs, no rain.

### 5. The canvas pieces

One column at `x: PICTURES_X`, starting at `y: 0` now that the skies are
gone, about 180px between frames (measure them in a screenshot).

- `streaks-prints` (exists): the baseline, unchanged in look.
- `streaks-palettes` (exists): every single palette as a print, at strength
  1, in the first cut, bold groups first. Rename it for its count.
- `streaks-pairs` (new): the two-palette pictures.
- `streaks-cuts` (new): every cut, each in a bold palette that suits it.
- `streaks-hero` (exists): Flat's hero today beside the picture, with a cut
  picker, a palette picker, a second-palette picker (with "None"), the
  strength slider, Pause, and Follow the hand. Changing any of them must not
  replace the canvas element. Open it on a bold palette.
- Every moving piece has its own Pause button.

Each field's host keeps the contract from 008 (`data-streaks`, `data-field`
which is now always `fan`, `data-palette`, `data-running`, exactly one
canvas) and adds `data-cut="<cut id>"` and, for a pair,
`data-palette-to="<palette id>"`.

### 6. The proposal

Rename `proposals/bokashi.md` to `proposals/long-exposures.md` (with
`git mv`) and rewrite it so the long exposure is its subject, in the
document's plain voice, shorter than it is now:

- Open with what Nick asked for and the three answers so far, quoted with
  their dates: "Take inspo from my components repo"; "I like this! let's make
  it stronger tho and more diverse"; "I only like long exposure, especially
  the ones of the bottom, if we could variate from them would be sick."
- A short section, "Tried and dropped", for the bokashi skies and the four
  other fields: what each was, in a line, and that Nick did not pick it.
- What is on the canvas now: the palettes (name, group, what it is, "from
  Gradient Keys" for Nick's three), the pairs, the cuts.
- What moving costs: keep the R2 and R4 wording for a streaming gradient, the
  pause control, the scenes' contract, the lightbox, the checks, the shared
  context, the hex values. Drop the wording that was only for the skies.
- Decisions: record the ones Nick has made, in Nick's words with the date
  (long exposures, not skies; the long exposure is the only field; the bold
  palettes over the soft ones). Keep the open ones open and renumber: which
  palettes, pairs and cuts go in; what strength Flat ships at; whether a
  picture answers a hand; the rule wording; where the pause control lives;
  whether the palettes become picture tokens; whether the picture is a part
  of its own, only in Flat. Give a suggestion for each open one, from what
  you saw. Do not fill in an open Decision.
- Update every reference to the old path under `gallery/src`. Leave `plans/`
  alone; old plans keep the old name.

## How to work

As in 008: by eye, in rounds, at least two. For each new palette, pair and
cut, render stills at both shapes and look at them. Judge against the six
Nick liked: would this one sit in that bottom row without looking weaker?
If not, change it or drop it. Keep stills from each round in
`gallery/.agent-shots/` and say in your report what you changed and why.

Accessibility, to check and not assume: nothing flashes (measure the largest
brightness change in a third of a second on at least three bold palettes and
one pair, not one palette only); everything pauses; everything is still
under reduced motion; pickers are real buttons with `aria-pressed`; each
frame's label names the cut and the palette or pair.

## Commands you will need

Run from the repo root.

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm ci --prefix gallery` | exit 0 |
| Verify | `npm run verify --prefix gallery` | exit 0 |
| Typecheck | `npm run typecheck --prefix gallery` | exit 0 |
| Lint | `npm run lint:litt --prefix gallery` | ends with `files clean.` |
| Build | `npm run build --prefix gallery` | exit 0 |
| Skill checks | `node skills/litt-md/scripts/check.mjs` | ends with `All checks passed.` |
| Shipped files untouched | `git diff --exit-code <starting commit> -- gallery/registry.lock.json gallery/CHANGELOG.md skills gallery/src/components gallery/src/blocks gallery/src/gallery gallery/src/motion` | exit 0, no output |

Playwright resolves from `/opt/node22/lib` here; see plan 008 if it is missing.

## Scope

**In scope**:
- `gallery/src/canvas/streaks.tsx`, `streaks-shaders.ts`, `streaks-renderer.ts`, `streaks-palettes.ts` (and new `streaks-*.ts(x)` files if they help)
- `gallery/src/canvas/bokashi.tsx` (delete)
- `gallery/src/canvas/registry.tsx` (the picture entries, the import, the constant)
- `proposals/bokashi.md` (rename to `proposals/long-exposures.md` and rewrite)

**Out of scope**:
- Everything under `skills/`, `gallery/src/components/`, `gallery/src/blocks/`, `gallery/src/gallery/`, `gallery/src/motion/`.
- `gallery/CHANGELOG.md`, `gallery/registry.lock.json`, any token file.
- `canvas.tsx`, `layout.ts`, the other experiments, and `plans/`.

## Git workflow

- Branch: the one the operator gave you.
- Commits, in order: `gallery: only the long exposure stays on the canvas`;
  `gallery: more bold palettes, two-palette pictures and cuts of the long exposure`;
  `proposals: the long exposure is Flat's picture`. Split further if it helps
  a reader; keep the removal separate from the drawing.
- Do NOT push or open a PR.

## The check

Adapt 008's `gallery/.agent-shots/check-streaks.mjs` (it is gitignored, so
rebuild it from your understanding of 008's contract if it is not there). It
must fail, with a message, on each of these, with motion allowed and with
reduced motion:

- More than one WebGL context on the page.
- Any `[data-bokashi]` element, or any `data-field` other than `fan`.
- Fewer than twenty-two palette ids, fewer than six pairs, or fewer than
  five cut ids among the fields.
- A field host without exactly one canvas, or a page error.
- Motion allowed: an on-screen field unchanged after two seconds; any field
  running or changing after every Pause is pressed; any field not changing
  again after Play.
- Reduced motion: any field running, or any picture changing by itself.
- The hero not changing when a palette, a second palette, a cut or the
  strength is changed, in both modes; or its canvas element being replaced.
- At zoom 1, a print's canvas narrower than its width on screen.

Also prove the baseline: a screenshot of `streaks-prints` under reduced
motion, before your first change and after your last, identical below its
label.

## Done criteria

- [ ] The check exits 0, twice in a row
- [ ] The baseline row is identical before and after
- [ ] `verify` and `build` exit 0; lint ends `files clean.`; the skill checks end `All checks passed.`
- [ ] The shipped-files command prints nothing
- [ ] `git diff --stat <starting commit> HEAD` lists only files in scope
- [ ] `grep -rn "bokashi" gallery/src` prints nothing
- [ ] At least twenty-two palettes, six pairs and five cuts are on the canvas, and you would put each one in Nick's bottom row
- [ ] Stills and screenshots of every piece, light and dark at real size, are in `gallery/.agent-shots/`, and you have looked at them

## STOP conditions

Stop and report (do not improvise) if:

- The `streaks*` files are not as plan 008 left them (four files; `streaks-palettes.ts` with twelve palettes).
- The cuts cannot be added without changing what the first cut draws.
- `verify` fails on a registry version or lock complaint.
- The work seems to need a change outside the scope, a new dependency, or a change to a taste rule.

## Maintenance notes

- **The first cut is Nick's shader.** Its numbers come from `litterthanlit/components`, `src/registry/components/gradient-keys.tsx`. If Nick retunes Gradient Keys, copy the change into the first cut.
- **Still an experiment.** When Nick picks palettes, pairs and cuts in `proposals/long-exposures.md`, a later plan ships the picture into Flat as a real part: picture tokens in `tokens.css`, the rule wording in the profile through `workflows/evolve.md`, a pause control on each picture, the shared renderer under it, and the canvas pieces removed.
- **Old plans name old files.** Plans 006 to 008 refer to `proposals/bokashi.md` and `bokashi.tsx`; they are history and stay as written.
