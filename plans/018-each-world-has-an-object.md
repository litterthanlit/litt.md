# Plan 018: Each world has an object of its own, and the Playground is that object, running the world

> **Executor instructions**: Read this plan fully, then `skills/litt-md/taste/litt-principles.md` and, for phase 1,
> the player in Nick's components repo (`git clone --depth 1 https://github.com/litterthanlit/components`:
> `DESIGN.md`, then `src/components/device/`). Phase 1 ends in a STOP: Nick looks at the first object before the other
> five are drawn. Phases 2 and 3 are briefs for a strong executor who works by eye, in rounds, with screenshots. Each
> phase ends in a green, committed state. Do not edit `plans/` except your row in `README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 0a795d6..HEAD -- gallery/src/gallery/pages/19-playground.tsx gallery/src/gallery/play-app.tsx gallery/src/gallery/motion-panel.tsx gallery/src/gallery/systems gallery/src/gallery/look.ts gallery/scripts/playground.mjs`
> If any changed, compare the "Current state" excerpts against the live code before going on; on a mismatch, STOP.

## Status

- **Priority**: P1 (Nick asked for it on 2026-11-15)
- **Effort**: XL (an engine, six objects drawn by eye, a check that grows from three worlds to six)
- **Risk**: MEDIUM. It is gallery chrome: no registry item, token or component changes, so nothing an installed app
  has moves. The risk is taste: six objects judged by eye, and two rules litt has not settled (below).
- **Depends on**: PR #114 merged (it adds `taste/litt-principles.md`, which this plan builds to). Independent of 017.
- **Category**: direction
- **Planned at**: commit `0a795d6`, 2026-11-15

## Why this matters

Nick, 2026-11-15: "I reckon components is stronger than litt.md", and then: "OHH we should make a device for each
world just like components that looks like the world itself that would be playground".

The components repo is strong because it is one object. Its home page is a player you could hold, every study is a
part of the same instrument, and "a lit edge, a recess or a 2px base is either right or it isn't" (`DESIGN.md`).
litt's worlds are described as objects (Press an instrument, Flat a page, Device a machine) but no page shows one.
The Playground shows every world on the same phone, a rounded box with a clock and a home bar, so a world reads as
a coat on a phone app. This plan gives each world its own object, built only from that world's materials, and makes
the Playground that object: its screen runs the studio app and then the world's own scenes, one at a time, as the
player runs studies.

**The name.** Nick said "device". In this repo Device is a world, and `useDevice` and `DeviceProvider` mean phone or
desktop. So the code and the docs say **object**, after the first principle ("A world is one object").

## Current state

- `gallery/src/gallery/pages/19-playground.tsx` (385 lines). `PlayFrame` (line 264) is the frame: it spreads
  `lookAttributes({ accent, material }, dark)`, is `role="region"` and a tab stop, carries `data-play-frame`, sets
  `contain-layout`, and wraps its children in `MaterialProvider`, `DeviceProvider mode={size}`, `OverlayRoot`,
  `Toaster` and `Framed`. `Phone` (line 298) draws a clock row and a home bar around the app. The page keeps
  `material`, `frame` (`"phone" | "desktop"`, from `motion-panel.tsx`) and the app's `settings` as page state.
- `gallery/src/gallery/play-app.tsx` (421 lines): `PlayApp({ settings, onSettings })`, three screens under its own
  tab bar (Today, Projects, Settings). The same app in every world.
- `gallery/src/gallery/systems/<world>.tsx`, loaded by `scenesOf(material)` (`systems/index.ts`): each world's
  scenes, small live product pieces that are about what the world is for. Contract in `systems/scene.ts`
  (`{ id, title, line, Render }`): only `@/components/*` and tokens, no accent fill, nothing moves on its own, at most
  28rem wide. The world page stages them at `max-w-md`.
- `gallery/src/gallery/look.ts`: `MATERIALS`, six `MaterialInfo` (Press, Flat, Device, Plain, Rack, Heat), each with a
  `tagline`, an `audience` and `abilities`.
- `gallery/scripts/playground.mjs` (`test:playground`): at 1440 by 1000, **for Press, Flat and Device only**, the
  frame wears the world picked, the sheet, toast, menu, command menu and held tooltip open inside the frame's box, the
  sheet's bottom is the frame's, a screen has at most one accent fill, and a world switch keeps the screen and its
  state. Its self-test removes the frame's containment.
- There is no sound in the gallery (`AudioContext` appears nowhere in `gallery/src`).

## Constraints

- **Gallery chrome only.** Nothing in `src/components`, `src/motion`, `src/blocks` or `tokens.css` changes. A body is
  drawn from the tokens its world already has. If an object cannot be drawn without a new token, STOP and name the
  token: that is a taste change, and it goes through `workflows/evolve.md`.
- **One contract, a body per world**, as the parts have. The contract owns the takes, the roles, the keys and the
  state; a body only draws. A body adds no role, key or state of its own.
- **The screen is today's frame**, unchanged in what it does: the world's attributes, the providers, `OverlayRoot`,
  containment, and `data-play-frame="phone"`. So everything `test:playground` proves today still holds.
- **Nothing moves on its own** (R4). The object does not play on load. Phase 3 adds a Play key the viewer presses;
  see Decisions, 1.
- **No sound** in this plan (Decisions, 2).
- **No accent fill in a body** (R6). The app's New project is the view's one accent. The current take is marked the
  way that world's own Tabs body marks the current tab: the ink, a lift, a lamp or brackets.
- **litt's scales, not the player's.** Radii come from the scale and nest concentric (`test:corners`); nothing is set
  above 18px; spacing is on the space scale. The player's em-sized radii and type are not brought over.
- **It fits.** No sideways scroll at 320px (`test:reflow`). Below `sm` the reader is on a phone already: the body is
  dropped to one strip (the readout and the selector) and the screen fills the page, as it does today.
- Repo rules hold: no hex, Nick by name, a bullet in `.claude/CLAUDE.md` for what a future session must know.

## Decisions for Nick

Built as recommended unless Nick says otherwise (the convention in `proposals/worlds.md`). The first two are the open
questions 2 and 3 in `taste/litt-principles.md`.

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | Does the object play by itself, as the player does? | **Only after a hand presses Play.** Never on load. A touch on the screen stops it. | R4 says nothing moves on its own; a viewer who presses Play asked for it. If Nick wants it to run on arrival, as the player does, that is a change to R4 for this page, and phase 3 flips one default. It may differ by world: Plain, which is still, would have no Play at all. |
| 2 | Does it make sound? | **Not in this plan.** | Decision 8 keeps sound to Device, silent by default, and litt has no sound engine yet. It is its own plan. |
| 3 | What does it run? | **The studio app first, then the world's own scenes.** | The app is the same in every world, so it compares them; the scenes are each world's own, so they show its depth. That is the player's tape: one thing at a time. |
| 4 | The six objects | **The table below.** | Each is what its world already says it is. |
| 5 | Where else does the object show? | **The Playground only, for now.** | The world pages and the home have their own heroes. See Later. |

### The six objects

Each is a portrait object: a screen, and under it a deck with a readout and a selector. The words in each cell are
the world's own (`system/material.md`, `look.ts`).

| World | The object | Body | Readout | Selector, the takes |
|---|---|---|---|---|
| Device | **The recorder**: the components repo's player, brought home | An aluminium plate in a machined frame; the screen behind a black bezel; wells pressed into the plate | An LCD in a well: the count and the take's name, in the mono | A dial in a collar that steps in detents, and the tape: one bar per take with a playhead |
| Flat | **A page in a grey frame** | No body. Grey is the object: the frame from litt.design's work slider, nothing cast | A caption under the frame, in the ink | A row of pills, the current one in the ink |
| Press | **A bench instrument** | A plate that stands on the page and casts, lit along its top edge; the screen is a window under glass | Words on a raised face | Raised blocks in a tray, the current one pressed in |
| Plain | **A document** | One 1px line around the page, and nothing else | A line of text above the page | Links in a row, the current one in the ink inside four corner marks |
| Rack | **A module** | A grey panel in a 1px outline with its name on a title bar | A value bar filled to the take's place, with its name in words at the end | A lane of clips, one per take, the current one lit |
| Heat | **A night menu** | A black slab with striped bands and corner brackets | The header band, in cream | A menu of rows with brackets on the row you are on, and keycap hints along the foot |

**The test of an object** is the test of a body: put the six side by side, take away the color and the face
(greyscale, one font), and each must still name its world from its structure alone.

## The approach

### Files

```
gallery/src/gallery/play-object/
  contract.tsx     PlayObject: the takes, the roles and keys, the state; picks the body
  screen.tsx       PlayScreen: today's PlayFrame, moved here unchanged
  takes.ts         takesOf(material): the app, then the world's scenes
  bodies/bare.tsx  the fallback: today's phone, with the takes as a plain row above it
  bodies/<world>.tsx   device, flat, press, plain, rack, heat
```

### Interfaces

```ts
// takes.ts
export type Take = { id: string; title: string; kind: "app" | "scene"; Render: ComponentType };
/** The studio app as take 0 ("Studio"), then the world's scenes in their page order. Loaded once per world. */
export function takesOf(material: Material, app: ComponentType): Promise<Take[]>;

// contract.tsx
export type PlayObjectBodyProps = {
  world: MaterialInfo;
  takes: Take[];
  at: number;
  /** Spread on the element that holds the takes: role="tablist", its name, its arrow keys, Home and End. */
  selector: HTMLAttributes<HTMLElement>;
  /** Spread on take i's control: role="tab", aria-selected, the roving tabIndex, id, aria-controls, onClick. */
  tab: (i: number) => ButtonHTMLAttributes<HTMLButtonElement>;
  /** Spread on a Previous or Next key, where a body draws one. Out of the tab order: the arrows do this. */
  step: (by: 1 | -1) => ButtonHTMLAttributes<HTMLButtonElement>;
  /** Phase 3. Spread on the Play key: aria-pressed and onClick. */
  play?: ButtonHTMLAttributes<HTMLButtonElement>;
  /** What the readout says: "02 / 06" and the take's title. The contract says a change once, in a polite live region. */
  readout: { count: string; title: string };
  /** The screen, already framed. Place it once. */
  screen: ReactNode;
  /** Below sm: draw one strip (readout and selector) and no body. */
  compact: boolean;
};
export function PlayObject(props: { material: Material; dark: boolean; app: ComponentType }): ReactElement;
```

- The selector is a tablist in every world and one tab stop. The screen is its `tabpanel`, named by the current tab,
  and keeps `tabIndex={0}` and `data-play-frame="phone"`.
- The object's root carries `data-play-object` with the body's name (`"device"`, or `"bare"`), and sits inside an
  element that spreads `lookAttributes` for the world, so the body reads the world's tokens.
- The app stays mounted while a scene shows (hidden and `inert`), so its state survives a take change and a world
  switch, which `test:playground` checks. A scene mounts when its take is reached.
- Bodies load on demand, as `systems/index.ts` loads scenes. A world with no body yet draws `bare`.
- `look.ts`: `MaterialInfo` gains `object: string` ("recorder", "page", "instrument", "document", "module", "menu"),
  used in the screen's accessible name ("The studio app in Device, on its recorder") and the Tune panel's Frame switch,
  whose first choice becomes "Object" (the `"phone"` value stays, since `DeviceProvider` reads it).

### Phase 1. The contract, and the recorder comes home

- [ ] Move `PlayFrame` to `play-object/screen.tsx` as `PlayScreen` with no change in behaviour. Run `test:playground`:
      it passes before anything else is added.
- [ ] `takes.ts`, `contract.tsx`, `bodies/bare.tsx`. The Playground renders `PlayObject` where it rendered the phone;
      `Phone` (the clock and the home bar) is deleted with `bare` drawing the screen plain.
- [ ] Extend `playground.mjs` first, and watch each new claim fail before the code makes it pass:
  - every claim it makes today, for **all six worlds**;
  - `data-play-object` is the world's name for each world in `OBJECTS` (a list in the script that grows by one per
    object; `["device"]` after this phase), and `bare` only for worlds not in it;
  - from the World switch, one Tab reaches the selector, the next the screen: one tab stop; ArrowRight, ArrowLeft,
    Home and End change the take, and the readout's text follows;
  - every take draws something inside the screen's box, and nothing in the body is filled with the accent;
  - back on take 0 after visiting a scene, Settings still has Weekly digest on;
  - `--self-test` gains a break: the object is told to draw `bare` under Device, and the check must fail;
  - `--greyscale <dir>` writes one picture per world of the object in greyscale and one font, light and dark, for the
    test of an object. It judges nothing; a person reads the sheet.
- [ ] `bodies/device.tsx`: the recorder, after `src/components/device/` in the components repo (`device.tsx`,
      `dial.tsx`, `readout.tsx`, `tape.tsx`). Port the look and the mechanisms, in litt's Device tokens
      (`--device-*`, `--key-lift`, the LCD's `--field` tokens): no value is copied from that repo's `tokens.css`.
      The dial's detents and its keys use `useHand` and `useSettle` (`@/motion/hand`). Left out: sound, the Home, Find
      and Options screens, and playing on load.
- [ ] Docs: the page's `meta` (lede and summary), the docblock of `19-playground.tsx`, the Playground bullet in
      `.claude/CLAUDE.md`.

**STOP**: report with the greyscale sheet, the six worlds' pictures (five of them `bare`), and anything the recorder
needed that Device's tokens do not have. Nick looks at the recorder and answers Decisions 1 to 4.

### Phase 2. The other five, one at a time

Order: **Flat** (the gallery opens in it, so its object is the first one anyone sees), **Press**, **Plain**, **Rack**,
**Heat**. One commit each. For each:

- [ ] Read the world: its section of `system/material.md`, its page (`#flat`, …), its Tabs and Segmented bodies, and
      its proposal (`proposals/flat.md`, `plain.md`, `rack.md`, `heat.md`).
- [ ] Draw `bodies/<world>.tsx` to the table above, by eye, in rounds: build, `npm run shot --prefix gallery -- --page
      playground --look <world>`, look, change. Light and dark, at 1440 and on a 390px phone.
- [ ] Add the world to `OBJECTS` in `playground.mjs`; run the checks below.
- [ ] Run `--greyscale` and put the sheet in the commit's report. If the new object does not name its world beside
      the others, it is not done.

### Phase 3. Play

Only after Nick answers Decision 1. As recommended:

- [ ] The contract fills `play`. Pressed, the object steps to the next take every 4s and wraps. A press, a key or a
      drag inside the screen, or a take picked by hand, stops it. It never starts by itself.
- [ ] Under reduced motion a take change is instant, and Play still works, since the viewer asked for it.
- [ ] `playground.mjs`: with no input, the take is the same 6s after load; after Play it changes within 5s; a press on
      the screen stops it. `test:motion` still passes.

### Phase 4. Finish

- [ ] `OBJECTS` holds all six, and the check fails if a world in it draws `bare`. `bare` stays for a seventh world.
- [ ] `skills/litt-md/taste/litt-principles.md`, Each world's own: one line in each world's section naming its object, through
      `workflows/evolve.md` (a `taste:` commit, shown to Nick first).
- [ ] The row in `plans/README.md`.

## Checks per phase

```
node skills/litt-md/scripts/check.mjs
npm run verify --prefix gallery && npm run build --prefix gallery
npm run test:playground --prefix gallery && npm run test:playground --prefix gallery -- --self-test
for t in motion reflow text-zoom forced-colors focus gaps corners wall; do npm run test:$t --prefix gallery || break; done
npm run test:a11y --prefix gallery -- --pages playground
```

The registry is untouched, so `registry.lock.json` must not change and `test:registry` is not needed. If verify
rewrites the lock, something in `src/components` or `src/motion` moved: undo it.

## STOP conditions

- Phase 1 is done: report and wait for Nick.
- An object needs a token its world does not have, or a part in `src/components` to change: report what and why.
- A claim `test:playground` makes today can only pass by weakening it: report. Do not relax the check.
- After three rounds an object still fails the greyscale test beside its siblings: stop on that world, leave it on
  `bare`, report with the sheet, and go on to the next.
- An object cannot fit at 320px without dropping the selector: report; the strip is the answer, not a hidden control.

## Done when

- `#playground` shows each of the six worlds on its own object, and `test:playground` passes for all six with none on
  `bare`.
- The greyscale sheet, six objects in one font, names each world by structure. Nick has seen it.
- `git diff --stat <start>..HEAD -- gallery/src/components gallery/src/motion gallery/src/blocks skills/litt-md/assets gallery/registry.lock.json`
  is empty.

## Later (not this plan)

- **Sound**, as Device's ability first (decision 8): a small engine in the motion folder, silent by default.
- **The object on each world's page** and on `#systems`, in place of the cover scene.
- **A page per world, in its own terms**: its object, its materials in order, its mechanisms and its voice, grown
  from its section of `taste/litt-principles.md`. Not every world written through the components repo's `DESIGN.md`.
- **The object as a registry block**, so a project can show its own app on it.
