# Dashboards: stat, chart, app shell and pagination

Written 2026-10-16 for Nick, after the taste profile v0.9. This is the dashboards step from `gallery/HANDOFF.md`. Like the forms step, it was built first and is waiting on tests: every decision below is built as recommended, and each one is a single place to change if the tests say otherwise.

The baseline is the `analytics-dashboard` agent task from #10. With no chart, sidebar or tile in the registry, Sonnet drew every bar as a solid accent fill, which breaks the one-accent rule (P1), and its sidebar was as tall as the window, so in a full-page view it stopped 900px down. Your cobalt reference shot is itself a dashboard (a dark sidebar, number tiles with a small label, topic rows with a thin bar), and the tiles and the rail below come from it.

The spec is in `skills/litt-md/system/components.md` (Pagination, Stat, Chart, App shell). The pass mark is the `analytics-dashboard` task, which now expects `table`, `tag`, `stat`, `chart` and `app-shell`.

## Built as recommended (Nick reviews after the tests)

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | What color are the marks in a chart? | Never the accent. One series is the foreground at about 55% (bars) or full foreground (a line). The current mark and the hovered mark are full foreground. | P1: the accent is for the one primary action, and a chart is made of many marks. A quiet foreground chart also stays readable in both themes. 55% clears 3:1 against a card in light and dark. |
| 2 | How do several series differ? | Step down the foreground: 100%, 55%, 30%, at most three, with a legend. The third series' bars get a 1px edge at 55%, and its line is dashed. | Hue is not allowed, so tone is the only channel. 30% alone is about 2:1 against a card, under the 3:1 that marks need, so the third series gets a second cue. |
| 3 | Do bars have rounded tops? | No. Square tops. | The radius scale is 0, 4, 8 and pill. A 2px corner is off it, and 4px would turn a 14px bar on a phone into a bullet. |
| 4 | How many gridlines, and which way? | Horizontal only, 3 to 5 in all, `--line` hairlines, with the zero baseline in `--line-strong`. | Vertical lines add ink with no data. Fewer than three makes the scale hard to read, more than five becomes a table. |
| 5 | Which axis labels? | Mono caption size, `--fg-subtle`, tabular. On narrow screens every nth category shows, counting back from the last mark. | Mono is the data face in litt (tables, tags). Counting back keeps the current mark labelled, and labels never overlap. |
| 6 | What does hover or focus show? | A tooltip in the Tooltip's own look (solid surface-3, label then a mono value) above the mark, plus a full-foreground mark. The pointer target is the whole plot, and the mark under the pointer is active. The focus ring is drawn around the mark. | One tooltip look across litt. Fourteen columns on a phone are about 24px wide each, narrower than a finger, so one target over the plot beats fourteen small ones. Hover is a color change only. |
| 7 | Which tooltip surface: glass or solid? | **Solid**, as the Tooltip is. | The Tooltip spec says a tooltip is too small for glass to read. Reusing its look keeps one tooltip in the system. |
| 8 | How does a chart move? | One entrance on the responsive tier: bars grow from the baseline by scaleY, a line fades in. Nothing else moves, and new data redraws at once. | Height, width and path data never animate. The chart is not the view's expressive moment. |
| 9 | How is a chart reached without a mouse? | `role="img"` with a one-line summary, a hidden table of every value, and a hidden button per category in a group with one tab stop and arrow keys. On touch a finger scrubs along the plot. | A chart is an image for a screen reader and a set of values for a keyboard. The table and the summary make the numbers available without the picture. |
| 10 | What is a Meter? | A 4px rail at the control radius, fg 12%, filled with the foreground, a label at the start and a mono value at the end. | The reference shot's topic rows, in litt's tokens. Never the accent, and it does not animate. |
| 11 | How is a Stat built? | A raised card: small label in `--fg-subtle`, the value at the h3 size in the sans with tabular numbers, an optional unit and delta. A description list. | The figure is the loudest thing on the tile through size and tone, not weight (P9). Tabular numbers stop a figure from wobbling as it updates. |
| 12 | How is a delta colored? | A word and a number ("Up 12% on last week"). Green only for good news, red only for bad, otherwise subtle. Hidden text says "good news" or "bad news". Never an arrow glyph alone, never a dot. | A build time that fell is good, so direction and judgment are separate. Words carry the direction and hidden text carries the judgment, so color is never the only signal. |
| 13 | How wide are the tile groups? | Two across, four across from 40rem, one below 20rem, measured on the group itself. | The shell eats 240px of a laptop window, so the window width is the wrong measure. The same group works in a frame, a phone stage and a full page. |
| 14 | How tall is the sidebar? | The sidebar column fills the page. Its content is sticky and as tall as the window. | The baseline's sidebar stopped 900px down in a full-page view. A full-height column fixes that without a fixed-height shell, so the page still scrolls as one document. |
| 15 | What are the sidebar rows? | 36px at the small size, the control radius. The current page is `--fg` on `--surface-2`; the rest `--fg-muted` with an fg-6% hover. No dot, no accent. | A sidebar is app UI, where the airy 44px is the open question Q4. 36px keeps four to eight links in view. Touch gets 44px. |
| 16 | What does the nav do on a phone? | The sidebar goes. A glass top bar shows the wordmark and a 44px menu button, and the nav opens in the bottom sheet that Dialog and Popover already use. Picking a link closes it. | One phone sheet across litt, with its drag, scrim and keyboard rules. It does not use up the view's expressive moment. |
| 17 | How does pagination read? | The range first, as text in mono ("21 to 40 of 143"), then Previous and Next as small secondary buttons, with numbered pages only when the row is 36rem wide. The ends disable. | The range is the information. Page numbers are extra, and they need room. A pressed button that becomes disabled hands its focus to the other one. |

## Not in this step

- A range slider (two thumbs) for table filters: it needs a filter bar to live in, which no page here has.
- Sparklines in the stat tile, stacked bars, area charts, donuts and a vertical bar layout.
- A collapsible sidebar (an icon rail), nested nav groups and a workspace switcher.
- Landscape phones (motion decision 8): still waiting for the real-phone pass.
