# Data color: five data hues and nine new components

Written 2026-10-17 for Nick, after the taste profile v0.11. Nick sent five reference shots of dark data panels (a mail rule builder with amber and blue category tags, a "Your voice" pad on a dot grid, a reply-speed dot plot, a keyboard heatmap with a ranked list of shortcuts, a usage dot matrix with a gauge, and a deploy timeline) and said: "lets expand the components, here's some inspo but we stick to our design language, we can add some color too".

So the references gave the component ideas, and litt gave the look: sentence case instead of their uppercase mono labels, words instead of status dots, no glow on a mark, the radius scale, weight 400. The color is new, and it has a rule (P11): **color carries data**. Like the forms and dashboards steps, this was built first and waits on tests: every decision below is built as recommended, and each one is a single place to change.

## Color (built as recommended, Nick reviews after the tests)

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | Where may color appear, beyond the accent? | Only where it says something: which series or category, how much (a heat step), which side of a goal, who or what (a category tag, an avatar). Never on chrome. A new rule, P11. | "Add some color" without a rule drifts into decoration within a week. Tying color to data keeps the calm: chrome stays monochrome, and every hue on screen can be read. |
| 2 | How many hues? | Five, in a fixed order: blue, amber, teal, violet, rose. A sixth series folds into "Other" or a second chart. | Five is about as many as a person matches to a legend at a glance, and every pair of neighbors in this order passes the color-blind check in both themes. Litt's restraint wants fewer rather than more. |
| 3 | How were the values chosen? | Fitted to litt's own surfaces, not taken from a stock palette. Each mark tone reaches 3:1 on canvas, surface-1 and surface-2 in both themes; each text tone reaches 4.5:1 there and on its own tint. Neighbors are at least 11.9 apart for color-blind readers (the target is 8) and 16.9 for everyone (the floor is 15). `check.mjs` checks every pair. | A stock palette put amber, aqua and rose under 3:1 on litt's white. Fitting by lightness to the real surfaces keeps every mark legible, and the checks keep it that way when a value moves. |
| 4 | Is the data blue the accent? | No. It sits at hue 250, more azure and lighter than the cobalt accent at 266, and P1 does not count it. | A chart must never read as a button. Two blues that close would blur which one is the primary action. |
| 5 | Why teal and not green? | Teal at hue 188 keeps clear of the success green at about 152. | A green heat grid beside a green "Up 12%" would mean two things. The reference's green usage grid becomes teal. |
| 6 | Amber sits close to the warning color. Accept it? | Yes, for now. A status always comes with a word, and a hue tag is never a status. | The alternative, an orange, sits between warning and danger and is worse. Worth a look in the tests. |
| 7 | How are tints made? | The mark tone mixed into surface-1 by `--tint-strength`: 12% in light, 18% in dark. | Solid, so the contrast of text on a tint is checkable. Per theme, because a dark tint needs more of the hue to read as a color (P8). |
| 8 | Do charts change by default? | No. The foreground stays the default. A series takes a hue with `hue`, or the chart gives each series the next hue with `hues`. | One quantity reads best quiet. The dashboards step's decisions 1 and 2 still hold unless a chart asks for color. |
| 9 | How does color follow a series? | By the series, never its place: "Sites" stays blue when a filter removes "Templates". A hue series and a foreground one can share a chart, such as this week in blue against last week in the foreground. | Repainting the survivors after a filter would break the reader's memory of which color is which. |
| 10 | How is one hue series emphasised? | Its marks rest in the mark tone and the current one takes the text tone, a step stronger. | Dimming the rest, as the foreground does, would drop them under 3:1. A stronger emphasis keeps every mark legible. |
| 11 | What does the lint add? | It fails a hue's mark tone or tint used as text (`text-data-amber`, `text-data-amber-tint`), in the gallery and in host apps. Text takes the `-text` tone. | The same reason as the accent text rule in v0.10: a mark tone reaches 3:1, not the 4.5:1 that text needs. |
| 12 | What do tags get? | A hue for a category: the tint as the fill, the text tone for the word, a hairline of the hue. One hue per category in a view. | The rule builder's Finance and Skips inbox tags, in litt's mono tag. A status still colors only its text. |

## Not in this step

- A data hue for status (good and bad stay with success and danger, and words).
- Diverging scales (two hues around a neutral middle). Nothing here needs one yet.
- The keyboard heatmap from the references, which is a specific layout rather than a component. The Heatmap and the Bar list cover its data.
