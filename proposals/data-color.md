# Data color: five data hues and nine new items

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

## Nine new items (built as recommended)

Seven Sonnet agents built them in parallel, each in its own worktree, from a contract the lead wrote first (the tokens, P11, the hue tag, the spec in the brief). The lead reviewed every diff, merged it, and ran verify, the build, screenshots in both themes at 1440 and 390, and axe on every page. Each item has a page, a spec section in `skills/litt-md/system/components.md`, a registry entry and an install-test recipe.

| Item | From the references | What litt made of it |
|---|---|---|
| Token input | "Mail from [@stripe.com ×] [+2]" | The Input's field with mono tokens in the Tag's look, Enter, comma, blur or paste to add, one roving stop for the remove buttons, a polite live region, and `collapseAfter` for the "+2". |
| Pad | "Your voice", a ring on a dot grid | The Slider in two dimensions: a surface-2 well, a static dot grid, the Slider's thumb with dashed crosshairs, a default mark, the value in words, two hidden range inputs for the keyboard. Never the accent. |
| Avatar | "S Stripe", "+23" | Initials on a hue's tint picked from the name by a stable hash, so a client keeps its hue; a group overlaps them with a ring in the surface. |
| Callout | "Try H to snooze" | A raised note with a status icon, a title, a line and an action. Color only in the icon: no rail, no tinted box. |
| Bar list | Shortcuts, top repos | A ranked list with the Meter's rail per row, key caps or icons in a lead column, and changes in words, aligned by one grid. |
| Gauge | "Credits left 20,830" | A half circle of 2px ticks with the value marked by a longer tick in the stronger tone, the figure in the opening. No needle, no glow. Static. |
| Dot plot | Reply speed | Mirrored stacks of dots on a log or linear axis, a goal that splits a hue from gray on an exact bin boundary, the median, named markers, a legend in numbers. |
| Heatmap | Usage by month, the key heatmap | A dot matrix in one hue's four steps, a 2D keyboard grid, and a sideways scroll inside its own box that starts at today. |
| Timeline | The deploy log and its strip | Steps with start, rail, status and duration in phases; drawn to scale, long steps become bars beside a ghost of the last run ("was 31s"); a strip of the whole run. |

The Insights page composes them into the references' panels, with the deploy and the meters left in the quiet foreground.

## Questions for Nick's tests

1. **Pad and Slider help text:** both now take `help`, but Input and TextField take `hint`. Unify on one name?
2. **Token input remove buttons** are one tab stop before the text input. The alternative is arrow keys only, with no tab stop.
3. **Callout with a Kbd action** hides the key on touch, as key hints do. Keep it?
4. **Avatar hues come from a hash,** so two names can share one. Fine for identity, or should a list pick hues in order instead?
5. **Timeline phase labels** read "Build · 24s" in sentence case, where the reference was lowercase.
6. **Heatmap rows closer than 16px** show every second label and total. The pattern uses a 12px dot so every month is named.
7. **Amber against warning** (decision 6 above).
8. **The data blue** next to the cobalt primary in the Insights view: distinct enough?

## Rails: more of the Meters by kind

After the nine items, Nick saw the Chart page's "Meters by kind" (a storage breakdown: one data hue per kind as a 4px rail on a neutral track, the label at the start, a mono reading at the end, wide air) and said "This is so good!" and "we should do more of whatever this is". It is logged in the journal as an open entry, a rule candidate rather than a rule: **a data hue is drawn thin (a 4px rail, a 2px line, a small dot) on a neutral track, with the words and the numbers neutral beside it.**

Built in that idiom, by three Sonnet agents and the lead:

| Item | What it adds |
|---|---|
| Breakdown | The Meters by kind as a component: a split rail with a segment per part, then a Meter row per part with its share, or a legend for a tile. Pinned hues are reserved; past five, Other. |
| Sparkline | A trend in one 2px line with a dot on today, no axes. Stat takes it in `trend`, at the foot of the tile, so trends in a row line up. |
| Spread | One rail per row on a shared scale: the full range faint, the middle half in a hue, the median a tick. Build times by site. |
| Meter | `target` (a 2px budget tick taller than the rail) and `steps` (equal segments, 7 of 10). |
| Bar list | A hue per row when the rows are kinds. |

The Usage pattern page uses nothing else: every mark on it is a rail or a thin line, the hues name kinds of file across the whole page, and the sections are separated by air, not boxes.

### Questions for Nick (rails)

9. **Promote the rail idea to a rule?** If two more reactions point the same way, P11 could gain a line: a hue is drawn thin, never as a filled area. That would make the Chart's hued bars (32px wide) the exception to revisit.
10. **Spread's faint range** is fg 24% laid over the fg-12% track, so it reads as about 33%. Flatter, or keep?
11. **Breakdown's legend** has no entry for the free space; the header reading and the grey segment say it. Enough?

## Not in this step

- A data hue for status (good and bad stay with success and danger, and words).
- Diverging scales (two hues around a neutral middle). Nothing here needs one yet.
- The keyboard heatmap from the references, which is a specific layout rather than a component. The Heatmap and the Bar list cover its data.
