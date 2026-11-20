# Heat's audit, fixed: four tracks that can run side by side

The plan for `plans/audits/heat.md`, written 2026-11-20. Eleven of its fourteen findings are built here. Findings 8 (amber by day), 12 (the game's place names) and 14 (type size) are Nick's and are not touched.

> **Executor instructions.** Read `.claude/CLAUDE.md`, `plans/audits/heat.md` and the Heat section of `skills/litt-md/taste/litt-principles.md` first. Never edit `skills/litt-md/taste/` or `skills/litt-md/assets/tokens.css`. Change nothing in Plain's body. Use only tokens: no hex, no off-scale radius, no new color. Every finding keeps the contract's roles, names and keys unless this file says otherwise. If a fix needs a token, a taste rule or a change this file does not name, stop and report instead of building it.

## Defaults chosen where the audit left a choice

| Finding | Chosen | Why |
|---|---|---|
| 3 | Inside the object the list is called **Index** everywhere (readout, the selector's first cell, the button). The top-left **Home** link keeps its name and target. The Home keycap stays, since that is the key's name. | The way out is Nick's (plans/019). This ends the double meaning without renaming it. |
| 4 | Heat's desktop body draws the strip above the screen, as its compact body already does. The keycap hints stay at the foot. | One order for the eye, the keys and both widths. |
| 10 | The top row's link to a part's page reads **Page**, not Source. | It names where it goes. |
| 11 | The pursuit meter binds real keys (`-` cools, `+` or `=` raises, on the focused part) and shows those keycaps. | The references pair a real key with a word. |
| 2 | `meta` takes `ledeByWorld` and `movesByWorld`, both optional maps by world id. Heat's are written for its set of twelve and for Select, Chart, Checkbox and Input. | Smallest change that makes Heat true; other worlds fill theirs later. |

## Tracks

Each track owns its files. Where two tracks meet in one file, the note says who owns which part.

### Track A. The player (findings 1, 3, 4, 5, 6, 7, 10, 13)

Files: `gallery/src/gallery/play-object/` (contract, body.ts, screen, `bodies/heat.tsx`, and the other bodies only where a rename reaches them), `gallery/scripts/playground.mjs`, the player lines of `.claude/CLAUDE.md`.

In this order, one commit each:

1. **Names (3, 10).** Index for the list, Page for the link. Update every body's labels, the live region, `test:playground` and CLAUDE.md's description. Add to `test:playground`: on every player exactly one control is named Home, and no link named Source points inside the gallery.
2. **Home's rows (6).** Name at the title weight, line regular in the muted ink, rows aligned to their tops. Check: every name in a row of Home's grid shares a top.
3. **Heat's order (4).** Strip above the screen at every width. Check in `test:playground`, for Heat: each tab stop is at or below the one before it, or to its right.
4. **Heat's focus (5).** No ring round the strip. With focus on the selector, the chosen cell's brackets close into a full box in the focus color. Forced colors keep an outline on the cell.
5. **Heat's phone strip (13).** A cut edge (a fade from the canvas, built from tokens) on each side that has more to scroll.
6. **A take's size (7).** `body.ts` lets a body say how tall its screen is at desktop widths; Heat's is shorter, so a take reads larger in it. Floor checked in `test:playground` for Heat: the take's box covers at least a quarter of the screen's area on the pursuit-meter take at 1440 by 1000. If a quarter cannot be reached without scaling the part itself, stop at the best honest value, set the floor there and report it.
7. **Heat's Home (1).** A body may draw Home's list: `body.ts` gains an optional `Home` the contract hands the list, the pick and the link to every component. Heat's: a column of rows, amber brackets on the row under the keys or the pointer, Up and Down to move, Enter to open, the row's part live beside it (its wall tile, `PreviewContext` "tile"). Other bodies keep the contract's Home. Check: on `#heat` at Home a live part is on the screen and exactly one row is current. It must still pass every existing `test:playground` assertion about Home (it lists the set, opens what you pick, links to every component).

### Track B. Words that are true of the world (finding 2)

Files: the `meta` type and its readers in `gallery/src/gallery/kit.tsx` (the lede under a title, How it moves), `takes.ts` or wherever Home reads a take's line, the `meta` of the sixteen pages named above, a new `gallery/scripts/world-words.mjs`, `gallery/package.json`, `.github/workflows/gallery.yml`, CLAUDE.md.

1. Add `ledeByWorld` and `movesByWorld` to `meta`. One helper returns the line for a world, falling back to the shared one. Home, the part's page and the Details panel read it. `gen-llms` and `gen-docs` keep reading the shared line.
2. Write Heat's lines for its set and the four pages. Plain words, in Heat's vocabulary (slab, brackets, dashes, stripes, cells), true of the body as built. Read each body before writing its line.
3. Where a shared lede names a material (glass, a cap, a raised plate), leave it: it is Press's and Flat's too. Only add the per-world line.
4. `npm run test:words --prefix gallery` (after a build): reads the visible text of `main` on every `#heat/*` page and the player's Home, Variants closed, and fails on another world's material words (start with: glass, cast, glow, raised, sinks, pill). Code blocks and Props tables are content, not copy. A `KNOWN` list holds pages not yet rewritten, printing them and failing when one stops happening. `--self-test` puts "a glass dropdown" back in a page and fails if the check misses it. Add it to the CI matrix within the 19-job limit.

Meets Track A in the component that draws Home's rows: A owns the layout, B owns only which string is shown.

### Track C. A part's page on a phone (finding 9)

Files: `gallery/src/gallery/kit.tsx` (the page shell under the h1, and Props), a new `gallery/scripts/jump.mjs`, `gallery/package.json`, the workflow, CLAUDE.md.

1. A jump row under the h1 of every part's page, in every world: links to the sections the page has (Install, Usage, Props, Keyboard, Accessibility). Quiet, one line, scrolling sideways in its own scroller if it must; 44px targets on coarse pointers. It is navigation, so a `nav` with a name.
2. Below 640px wide, Props starts closed behind a disclosure (a `button` with `aria-expanded`), open at wider sizes. Every page check that reads Props must still see it: open it in `openVariants` (routes.mjs) or its own helper, and say so in CLAUDE.md.
3. `npm run test:jump --prefix gallery`: at 390 wide, every part's page in every world has a link to Install in the first screen, and following it lands on the Install heading. `--self-test` removes the row and fails if the check misses it.

Meets Track B in `kit.tsx`: C owns the shell and Props, B owns the lede and How it moves.

### Track D. Keycaps that are keys (finding 11)

Files: `gallery/src/components/pursuit-meter.tsx`, its page, `gallery/CHANGELOG.md`, `gallery/registry.lock.json`.

Bind the two keys on the part when it is interactive, show them as the keycaps, name them in the page's Keyboard section, and add the changelog line for each world's copy the generator asks for. D is the only track that edits the changelog and the lock.

## Every track, before it reports

```bash
npm ci --prefix gallery
node skills/litt-md/scripts/check.mjs && npm run verify --prefix gallery && npm run build --prefix gallery
```

Then the page checks its change can break, after the build: A runs `test:playground`, `test:a11y`, `test:motion`, `test:forced-colors`, `test:focus`, `test:worlds` for Heat; B runs `test:words`, `test:worlds`, `test:a11y` for the pages it touched; C runs `test:jump`, `test:reflow`, `test:a11y`, `test:text-zoom`; D runs `test:registry -- --app vite` for the item, `test:a11y` and `test:materials`. Commit on the track's own branch. Do not push.

## After the tracks

Merge A, then B, C and D into `claude/stoic-ptolemy-4d45q3`, run the full block above and every page check once on the merged tree, re-shoot the audit's screens, and mark each finding in `heat.md` fixed, with its check.
