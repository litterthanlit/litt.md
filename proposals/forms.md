# Forms: switch, select, slider and the field patterns

Written 2026-10-15 for Nick, after the taste profile v0.9. This is the forms step from `gallery/HANDOFF.md`: the same loop as motion, except that Nick asked to build first and test after ("Build next components, I'll do the tests after"). So every recommendation below is built, and each one is a single place to change if the tests say otherwise.

The baseline is the `settings-form` agent task from #10: with no switch, select or slider in the registry, Sonnet hand-built a switch (its color fade ran on the wrong tier), used a native `<select>` (rows 28 to 30px tall on a phone, an unstyled list on the desktop) and hand-built a slider with no spec behind it.

The spec is in `skills/litt-md/system/components.md` (Select, Switch, Slider, Forms).

## Decided by Nick

| # | Question | Decision |
|---|---|---|
| 1 | Large buttons are "too square": the corners or the shape? | **The shape.** An lg button's side padding goes from 24 to 32 (`--button-pad-lg`); corners stay 4px. lg fields keep 24. P10's ratio check gives lg its own range (1.3 to 1.6). |
| 2 | The switch track: a pill or the control radius? | **A pill**, with a round thumb. Switches join the pill list. |
| 3 | Litt's own accent (Q2) | **Cobalt**, from the reference shot: on nearly the neutrals' hue, a lighter cobalt with dark text in dark mode. |

## Built as recommended (Nick reviews after the tests)

| # | Question | Recommendation | Why |
|---|---|---|---|
| 4 | Switch colors | Off: `--surface-1` track with the `--line-control` edge and a `--line-control` thumb. On: `--fg` track and a `--canvas` thumb. | The checkbox's language (v0.7): a form holds many switches, and P1 keeps the accent on the submit. Position, fill and thumb color all change, so color is never the only signal. |
| 5 | Switch motion | Thumb slide and fill fade both on the instant tier. | A switch is a toggle. The baseline's hand-built switch faded on the wrong tier, which is the failure this fixes. |
| 6 | Switch label side | Right of the switch by default, like the checkbox. `align="end"` puts the switch at the row's end for settings lists. | Agents write `<Switch label>` and get the checkbox's layout; a settings list lines its switches up in one column. |
| 7 | Can a switch be invalid? | No. A choice that can be wrong is a checkbox. | Keeps the switch to settings, and the error summary to fields. |
| 8 | Select: native, custom, or a sheet on phones? | **Custom everywhere, anchored on phones**, as a dropdown menu is. | Motion decision 8 said "native for now, revisit after the baseline", and the baseline showed 28px rows and an unstyled list. A dropdown menu stays anchored on phones because its rows are 44px and the finger is beside it; a select's list is the same shape. A sheet would be a second pattern for one list. |
| 9 | Select list look | The Menu's panel: glass, 44px rows, one gliding highlight, a check at the end of the current option. | One list look across Menu, Command menu and Select. |
| 10 | Select chevron | Never turns. | Motion that only decorates. |
| 11 | Slider range and thumb | Range `--fg`; thumb a 20px `--surface-1` circle with the `--line-control` edge; rail fg 12%. | P1 again. A white or dark thumb with an edge reads against both the range and the rail in both themes. |
| 12 | Slider motion | None on the position: the thumb follows the pointer and the keys at once. Colors fade on the instant tier. | Position is a layout value; easing it would lag the input. |
| 13 | Slider ends | Optional words under the two ends ("Slower", "Faster") and an optional mono value at the end of the label row. | The baseline rubric asked for a clear direction; words do that better than an icon. |
| 14 | Settings page layout | Sections with a title and one line of description; from 1024 up the title takes the left third. Save last, alone, lg. | The Vercel, Linear and Stripe settings pattern, and P7's left-aligned column. |
| 15 | Errors | Inline errors under each field, plus a summary above the form that takes focus on a failed submit and links to each field. Three fields or fewer skip the summary. | The pattern that works for screen readers and long forms; short sign-in forms do not need it. |
| 16 | Required or optional | Mark the optional fields with "(optional)". No asterisks. | Most fields in a litt form are required, so marking the few optional ones is quieter. |
| 17 | Action order in a page form | Submit first at the column's start, Cancel (ghost) after, both lg; stacked full width below 640. | A left-aligned column starts with its main action. Dialogs keep primary last, bottom right. |

## Not in this step

- A range slider (two thumbs): it belongs to dashboards, as a table filter.
- Option groups and search inside the select: a long, searchable list is the command menu's job.
- Landscape phones (motion decision 8): still waiting for the real-phone pass.
