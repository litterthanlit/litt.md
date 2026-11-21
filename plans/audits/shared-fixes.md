# What every world shares, fixed once

The plan for the shared findings in `README.md`, written 2026-11-21 after the six audits were reviewed. It goes first: each world's own plan (`press-fixes.md`, `flat-fixes.md`, `device-fixes.md`, `plain-fixes.md`, `rack-fixes.md`) builds on what this one adds.

> **Executor instructions.** Read `.claude/CLAUDE.md`, `plans/audits/README.md` and `plans/audits/heat-fixes.md` (the same work, done for Heat) first. Never edit `skills/litt-md/taste/` or `skills/litt-md/assets/tokens.css`. Tokens only. Keep every contract role, name and key unless this file changes it. Where a step is marked **Nick**, build nothing: write the options up and stop.

## What the review added

The audits were checked against each other and against the build. Their main claims held (Press's radio groups ignore the arrows, Rack's clip launcher is 20 tab stops, Device's About names orange as its accent). Three things no audit reported:

| # | Finding | Evidence | Severity |
|---|---|---|---|
| S1 | Every page in a world is titled "litt.md Gallery" | `document.title` on `#press`, `#press/button`, `#press/about`, `#press/components`, `#heat/slider`; only `#systems` has its own | Medium: a tab, a bookmark, the history list and a screen reader's page announcement all say the same thing (WCAG 2.4.2) |
| S2 | Back loses your place in the player | On `#flat`, step to Poll, follow Page, press Back: the player is on Index, not Poll. The take is not in the address | Medium |
| S3 | On a phone the list starts half a screen down | First Index row at y 400 to 443 of 844 in Press, Flat, Device, Plain and Rack; Heat's is at 294 | Medium: the first screen is mostly chrome |

And the gaps between the audits, measured in all six worlds:

- **No world but Heat has a live part on its Index.** Device and Plain too, which their audits did not raise.
- **Focus climbs back up to the screen in all five**, Device included.
- **The selector is named "Components" in all six**, Heat included.

## Tracks

### Track 1. Words that are true of each world

The mechanism is built (`ledeByWorld`, `summaryByWorld`, `movesByWorld`, `lineIn` in `kit.tsx`) and `test:words` holds Heat.

1. Add a fourth map for the docs bullets (Use when, Skip when, Accessibility) and for a study's Anatomy labels, read through `lineIn`. Heat's audit left these open, and every other audit hit them.
2. Write each world's lines for its set of twelve, then for every page `test:words` flags. **One agent, one world at a time**: every world's lines live in the same page files, so this cannot run side by side. Order: Flat, Rack, Device, Plain (Plain's lines are **Nick**: draft them, do not land them).
3. Give `WORDS` in `world-words.mjs` a list per world, and move each world from `KNOWN` to passing as its lines land. Press needs a short list of its own: the words of Flat and Device that its How it moves text uses.
4. Where a shared line can be made true of every body by saying what the part does, not what it is made of, change the shared line and delete the per-world ones. Fewer maps is better.

Fixed when: `test:words` reads all six worlds and its `KNOWN` list holds only what waits on Nick.

### Track 2. The player's contract

Files: `gallery/src/gallery/play-object/contract.tsx`, `body.ts`, `route.ts`, `gallery/scripts/playground.mjs`.

1. **Page titles (S1).** Every address sets `document.title`: the part or page, then the world, then the gallery ("Button · Press · litt.md Gallery"). The player's title follows the take. Check: no two addresses in `routes()` share a title, and none is the bare gallery name.
2. **The take is in the address (S2).** `#<world>?take=<id>` or the like, written with `replaceState` as you step so Back does not fill with steps, and read on load. Back from a part's page returns to that take. Check in `test:playground`.
3. **The selector's name.** "Components" is also the link beside it. Name the slider for what it does: "Take". Check: no two controls on a player share a name unless they go to the same place.
4. **A lint for touch targets.** `test:targets` catches an unpositioned target after a build. Add the same rule to `lint:litt` so it fails at verify: a class list with `litt-target` and no `relative`, `absolute`, `fixed` or `sticky`.

### Track 3. The front door, as a kit

Nick, 2026-11-21: "I totally agree that first screen is boring." Heat's fix is the model: a body may draw Index itself (`Home` in `body.ts`), handed the list, its keys, the pick, the link to every component and the current row's part live.

1. Make that hand-off complete enough for five more bodies: the current part live at a size the body picks, the row under the pointer as well as the keys, and on a phone a choice between leaving the part out and drawing it above the list.
2. On a phone, start the list higher (S3): the top row's two lines of chrome fold into one, as each body allows.
3. Each world's own Index is in its own plan. This track only makes them possible and keeps one check: on every world in `OBJECTS`, Index shows a live part on the screen, exactly one row is current, and Down moves both.

### Track 4. A take's size (Nick)

Every audit measured it: a take covers a few percent to a quarter of its screen. Heat could not reach a quarter by shortening the screen. Options, none built until Nick picks:

- **A. Top-align the take** under the readout, as a document does. Cheap, and suits Plain and Rack.
- **B. Draw the take larger**: the tile at 1.5x inside the screen, where the part allows.
- **C. Shrink the screen to the take**, so the object is a small device, not a wide slab.

## Order

Track 2 and Track 3 step 1 first, since the worlds' plans stand on them. Track 1 runs alongside in its own agent. Track 4 waits.

## Before anything is pushed

```bash
node skills/litt-md/scripts/check.mjs && npm run verify --prefix gallery && npm run build --prefix gallery
```

Then `test:playground` with its self-test, `test:targets`, `test:gaps`, `test:words`, `test:worlds`, `test:wall`, `test:materials` and `test:focus`. The Heat work shipped two faults that only CI caught (a gap between Index rows, a click that raced a lazy section), so run the gaps and reflow checks on anything that draws a list or opens a disclosure.
