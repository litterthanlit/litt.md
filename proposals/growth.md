# Growth: data, round two

Nick, on the dashboards: "The colors we use in the dashboards are really cool", "Let's build on our strengths", then "yes build the growth step". This step adds the data views the dashboards and data-color steps left out, all in the idiom Nick asked for more of after the Meters by kind: **a data hue is drawn thin (a 4px rail, a 2px line, a small dot) on a neutral track, with the words and the numbers neutral beside it.** Nothing new enters the palette: the five data hues (blue, amber, teal, violet, rose) and the foreground.

## The items

| Item | What it is | Built as |
|---|---|---|
| Stacked bars | Usage by kind per day: one stacked rail per category, a hue per series, 2px of air between segments | `StackedBarChart` in `chart.tsx`, a third kind of the shared chart (grid, axis, tooltip, keyboard buttons, hidden table) |
| Funnel | Visited, signed up, activated, paid: one rail per step filled to its share of the first, with the step-to-step conversion in words | `Funnel` in `funnel.tsx` |
| Cohort grid | Retention by signup week: a real table, one row per cohort, a cell per period with a dot in the Heatmap's steps and the percentage beside it | `CohortGrid` in `cohort-grid.tsx` |
| Legend | Toggle which series a chart shows: a row of buttons, each a hued rail swatch and a name, pressed while the series shows | `Legend` in `legend.tsx` |
| Growth | The pattern page: a filter bar (the period as a Segmented, a RangeSlider for weeks, the Legend), the stacked chart, the funnel, the cohort grid and stat tiles | `18-growth.tsx` |

## Decisions

1. **Stacked bars are rails, not blocks.** A column is at most 8px wide (half the 16px the eye reads as a block at this scale), each segment has the control radius, and segments sit 2px apart, like the Breakdown's split rail. The tallest stack sets the scale. Colors follow the series (`hue`, else the next free hue), so the Legend can drop a series without repainting the others. The hovered or focused column takes its series' text tones; the rest rest in the mark tones.
2. **A funnel is rows, not a trapezoid.** Each step is the Meter's anatomy: label, reading, a 4px rail filled to its share of the first step. Between steps, one quiet line says how many went on, in words ("38% continued"), never a red drop. One hue for the whole funnel: it is one quantity.
3. **A cohort grid is a table.** The numbers are the point, so every cell shows its percentage in mono; the dot in front of it carries the Heatmap's four steps of one hue, so the eye still finds where retention holds. Later cohorts have fewer periods, and a cell with no data draws nothing. Native `<table>` semantics, no roving grid: there is nothing to pick.
4. **The Legend filters, the chart draws.** The Legend is its own component that holds which series are hidden. The page passes the shown series to any chart, so one Legend can drive a chart and a table together. The last shown series cannot be hidden.
5. **Static, except the chart's own entrance and tooltip.** The funnel, the cohort grid and the legend do not move. The legend's swatch and text change color on the instant tier.

## Not in this step

- Schedule lanes (projects across weeks) and diverging rails (change against last period). Diverging needs Nick's call on P11 first: direction would take a pair of data hues, and good and bad would stay with success and danger.
- Area charts and donuts: filled areas are what the rail idiom avoids.
