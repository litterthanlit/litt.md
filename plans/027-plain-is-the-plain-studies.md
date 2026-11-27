# 027. Plain is the Plain studies

Status: IN PROGRESS (phase 1 and phase 2, 2026-11-27).

## Nick's words

2026-11-26 and 2026-11-27, across the Plain studies iterations (`proposals/plain-studies/`, PR #177):
1. "can you design a study for plain please, following flat" -> "I love this, do it's own motion language please, theme is subtraction, also components should be agentic".
2. "Make sure its readable, hierarchy is right, spacing etc. should we do helvetica? /litt-design-craft".
3. "how would plan display data, diagrams, charts etc. can we build a page of components please? also there' some bugs . some boxes are not needed also. maybe also maybe decrease opacity for not selected somponents".
4. "Really good. Open a pr then keep going".

## What already agrees

Plain's palette and document foundation in `tokens.css` already agree: pure white paper and black ink in light, deep charcoal paper and crisp white ink in dark, link blue for running links (underlined), square `0px` corners, zero light, zero cast shadows, zero glass blur, and four corner marks (`[ ]`) on the one primary action or active choice. PR #177 landed the 12 Data, Diagram & Chart components, the 24 de-boxed agentic studies, `proposals/plain-studies.md`, and the eight journal entries (`2026-11-26` and `2026-11-27`).

## Phase 1. The rules, the tokens and Subtraction (this PR)

- [x] Journal (`skills/litt-md/taste/journal.md`): mark the eight 2026-11-26 and 2026-11-27 Plain studies entries `→ v1.23`.
- [x] Profile v1.23 (`skills/litt-md/taste/profile.md`), `taste/litt-principles.md`, `SKILL.md`, `system/foundations.md`, `system/material.md`, and `gallery/src/gallery/look.ts`:
  - Plain's face is Helvetica Neue (`var(--font-choice, "Helvetica Neue", Helvetica, Arial, sans-serif)`), matching Press's grotesk clarity while keeping `--font-choice` for a project's override.
  - Plain's motion language is **Subtraction**: zero bounce everywhere (`BOUNCE_CAP.plain = 0`, `EXPRESSIVE_BOUNCE.plain = 0`), `--spring-expressive: 280ms 0` (`558ms` settle, `210ms` expressive exit), `:root`'s `100ms` instant and `200ms 0` responsive spring, living four-corner brackets that glide across choices and tighten on press, and fast pare-out exits. Reduced motion zeroes every duration on Plain as in every other world.
  - Plain's box and data grammar: a 4-sided box is kept only for something that floats over the page; stats, sparklines, charts, legends and tables sit bare on white paper parted by single `1px` hairlines, with white-paper scale cuts through ink bars and unfocused marks stepping back when inspecting a point.
- [x] `skills/litt-md/assets/tokens.css`, `skills/litt-md/scripts/check.mjs`, `gallery/src/motion/rules.ts`, `gallery/scripts/test-rules.mjs`:
  - Set Plain's `--font-sans` to Helvetica Neue, replace Plain's `0ms` stillness overrides with `--spring-expressive: 280ms 0`, `--dur-expressive: 558ms`, `--ease-expressive` (bounce 0) and `--dur-exit-expressive: 210ms`, and name Plain in `@media (prefers-reduced-motion: reduce)`.
  - Hold `BOUNCE_CAP.plain` and `EXPRESSIVE_BOUNCE.plain` to `0` in `check.mjs`, `rules.ts` and `test-rules.mjs`.
- [x] `gallery/src/motion/index.tsx` and `gallery/src/motion/deal.ts`:
  - Release `useMotionDial()` from forcing `reduced: true` under Plain (real `prefers-reduced-motion` still sets `reduced: true`).
  - Add Plain's Subtraction `deal` and `gather` in `deal.ts`: calm `4px` zero-bounce responsive settle on entry, fast `75ms` pare-out on exit, and flat non-sliding overlays (`grow: 1`, `slides: false`).

## Phase 2. Plain's data and control bodies (this PR)

- [x] Six bare-paper Plain data and label bodies in `gallery/src/worlds/plain/`, wired into their contracts so Plain never falls back to Press's sunken stone trays or 4-sided status boxes:
  - `worlds/plain/stat.tsx` (`StatPlainBody`): bare on white paper under a `1px` top hairline, tabular `text-figure`, plain-word delta, bare trend slot.
  - `worlds/plain/sparkline.tsx` (`SparklinePlainBody`): bare `1.5px` mitered polyline on the page, optional `1px` dashed baseline, crisp `4.5px` square endpoint ringed in the surface colour.
  - `worlds/plain/chart.tsx` (`ChartPlainBody`): Tufte bare-paper bar, stacked-bar and line charts — `1px` baseline rule, subtle `4px` y-tick marks, `0px` square bars with `1.5px` clipped scale cuts, square `5px` line vertices, zero-bounce arrival, and Subtraction emphasis (unfocused marks step down in opacity while inspecting a category).
  - `worlds/plain/legend.tsx` (`LegendPlainBody`): bare inline word toggles with `12px` square rule swatches, striking and stepping back hidden series without a tray.
  - `worlds/plain/table.tsx` (`tablePlainDress`): frameless `bg-canvas` table with a `1px` `--line-control` head rule, `1px` `--line` row rules, zero outer box, and zero-bounce Subtraction row transitions.
  - `worlds/plain/tag.tsx` (`TagPlainBody`): bare status mark + status-coloured word on paper (dropping the 4-sided box in tables and dashboards), flat `--surface-2` paper strip for labels, square tint strip for categories, and a `1px` hairline token only when raised inside a field.
- [x] Subtraction polish on Plain's control and agentic bodies:
  - `worlds/plain/tabs.tsx`, `worlds/plain/segmented.tsx`, `worlds/plain/switch.tsx`: four `4px` corner marks glide from choice to choice on the `200ms` zero-bounce responsive spring (`layout="position"` on each corner so `1px` strokes never stretch), with generous clearance around the active word.
  - `worlds/plain/button.tsx`: `6px` corner marks tighten subtly (`scale-[0.96]`) on press at `--dur-instant` and hold generous horizontal room so swapped labels (`Copy` -> `Copied`) never cramp.
  - `components/agent-transcript.tsx` and `pages/20-agent-transcript.tsx`: gliding corner-mark filter tabs and Subtraction payload/step transitions.
- [x] Player set (`play-object/takes.ts`), system copy (`00-plain.tsx`, `systems/plain.tsx`), and `world-words.mjs`:
  - Update `SET.plain` to lead with Plain's agentic, data and Subtraction parts (`agent-transcript`, `thinking`, `tool-call`, `file-changes`, `sources`, `stat`, `chart`, `sparkline`, `table`, `tabs`, `segmented`, `switch`).
  - Update `world-words.mjs` so foreign physical-material words (`glass`, `cast`, `raised`, `sinks`, `cap`, `plate`, `tray`) remain banned on Plain while Subtraction motion words are allowed.

## Phase 3 onward. New Plain studies parts, a batch per PR

Add the remaining Plain studies (`proposals/plain-studies/`) that have no component yet — such as orthogonal `ArchitectureDiagram`, `ExecutionWaterfall`, `TokenSankey`, `ToolApproval`, `RedactionReview`, and `EvalMatrix` — as standalone Plain components (`worlds: ["plain"]`), one batch per PR.
