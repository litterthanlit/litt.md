# Changelog

Every change to the litt registry at https://littmd.vercel.app/r/, newest first. A release is named by its date, and each installed file says which release it came from in a comment at its top (`// @litt/button 2026.10.17`), so you can tell what changed since. Item names are the registry's: install one with `npx shadcn@latest add https://littmd.vercel.app/r/<name>.json`.

To update an item, read the entries since your version, then reinstall it with `--overwrite`. A **breaking** entry says what to change in your code.

## 2026-10-22 · Blocks

The first blocks: the gallery's five composed screens, each installable as one item that brings the components it uses. A block lands in `components/litt-blocks/` with its sample data at the top of the file, and unlike a component it is yours to change: it is a starting point, so edit it in place and never reinstall it over your edits.

- **added** `dashboard`: Dashboard, a deploy dashboard as one screen: an app shell with a sidebar, four number tiles, a chart of deploys per day and a table of recent deploys with its pagination.
- **added** `usage`: Usage, a plan's usage as one screen, drawn only in rails: trends, storage and bandwidth by kind of file, limits against their budgets and build times by site.
- **added** `growth`: Growth, twelve weeks of growth as one screen: sign-ups by source with a legend and a week range that filter them, the funnel from visit to paid and retention by signup week.
- **added** `insights`: Insights, seven panels of inbox and build insights in the data colors, two columns when wide and one on a phone.
- **added** `agent`: AgentChat, a chat with an agent as one screen, from the first word to the deploy, played by a script you replace with your agent's stream.

## 2026-10-21 · The header's wordmark is bare again, a color picker, a rolling number and slide to confirm

Taste profile v0.16's P12 covers the current page only: the wordmark in a segment stays the gallery's own, not the language's. And three staples: a color picker for the person's own colors, a rolling number for a figure that changes while someone watches, and slide to confirm for what cannot be undone.

- **added** `color-picker`: ColorPicker and ColorPanel, one color as a hex string, from a saturation and brightness area, a hue rail, the hex, an eyedropper where the browser has one, or swatches.
- **added** `rolling-number`: RollingNumber, a figure whose changed digits roll to the new value, up when it rises and down when it falls. Pass it as a Stat's value to roll a tile.
- **added** `slide-confirm`: SlideConfirm, a track and a thumb to slide to the end for an action that cannot be undone. The thumb is also a button, so keys and screen readers confirm too.
- **changed** `motion`: `StillMotion` holds everything inside it still, as reduced motion does: the hooks return 0, Motion skips its animations and the CSS tier tokens read 0. Wrap a thumbnail or a preview of live components in it. Nothing changes for existing code.
- **breaking** `header`: the wordmark is bare again, as before 2026.10.20, and the `wordmarkFrame` prop is gone. The current link keeps the selected segment's look (P12).
  Migrate: drop `wordmarkFrame` if you passed it. To keep the segment around your wordmark, wrap it yourself in the segmented control's track and one raised segment.

## 2026-10-20 · Geist, md form buttons, growth and stone neutrals

The face of taste profile v0.13: Geist replaces Inter, as on Nick's portfolio. Sizes, weights and tracking are unchanged. And v0.14's P10: lg is for hero CTAs only, so a page form's submit and Cancel are md, like its fields. And the growth step: three more data views in the rail idiom, a legend that filters, and stacked rails in the chart. And v0.15's Color decision: the neutrals move from cool blue-gray to warm stone. And v0.16's P12: selected is a raised segment, in the header's current link, its wordmark and the app shell's current link.

- **changed** `header`: the current link wears the selected segment (P12), `surface-1` with the hairline and the top highlight, and keeps it on hover; the others keep the hover fill. The wordmark sits in a segment, the segmented control's track with one raised segment; pass `wordmarkFrame={false}` to keep a logo bare. Nothing in your code has to change.
- **changed** `app-shell`: the current sidebar link keeps its `surface-2` fill and gains the hairline and the top highlight, the selected segment's look (P12). Nothing in your code has to change.
- **changed** `litt`: the neutrals are warm stone (OKLCH hue about 60) in both themes: `--litt-canvas`, the surfaces, the lines, the inks, the dark glass and the light theme's glass border and glows. Lightness and chroma are unchanged, so contrast is too. Reinstall to pick it up; nothing in your code changes.
- **changed** `litt`: Geist replaces Inter in `--litt-font-sans`, falling back to Helvetica Neue, Helvetica and Arial. The stack names both "Geist" (Google Fonts) and "Geist Sans" (Fontsource).
- **changed** `base-styles`: loads Geist at 400, 500 and 600 and Geist Mono at 400 (`@fontsource/geist-sans` replaces `@fontsource/inter`).
- **added** `funnel`: how many went on at each step, as rows: a thin rail per step against the first, in one data hue, with the step-to-step conversion in words.
- **added** `cohort-grid`: retention by signup week as a real table, a dot in one hue's four steps and the number in every cell, the cohort column held while the periods scroll.
- **added** `legend`: toggles which series a chart shows, each item a hued rail swatch and a name, pressed while its series shows. `legendHues` keeps a series' color when another is hidden.
- **changed** `chart`: `StackedBarChart`, each category's parts as one thin stacked rail with a hue per series and the total in the tooltip; and `legend={false}` turns off a chart's own legend when a Legend drives it. Nothing changes for an existing chart.
- **changed** `button`: the size docs say lg is for hero actions only, md in a page form and a dialog. Nothing renders differently; pass `size="md"` (or leave size out) on a page form's buttons.
- **changed** `form`: FormActions' docs ask for md buttons, submit and Cancel. Nothing renders differently; drop `size="lg"` from the buttons you pass it.

## 2026-10-19 · Staples, versions and type

Six staples, and from this release every item carries its version, in the registry and at the top of each file it installs.

The type of taste profile v0.12, after Nick's own portfolio: Inter for every role, nearly everything at 14px with an 18px title, three weights by role (text 400, titles 500, 12px labels 600), two inks, and tags in the sans. The six staples below already ship it.

- **added** `combobox`: type to find one value, or several, in a long list.
- **added** `date-picker`: Calendar and DatePicker, a day or a range as YYYY-MM-DD strings.
- **added** `accordion`: sections that open in place without the page jumping.
- **added** `scroll-area`: native scrolling with litt's thumb and edge hairlines.
- **added** `breadcrumb`: where a page sits, folding long trails into a menu.
- **added** `context-menu`: the Menu at the pointer, by right-click, Shift+F10 or a hold on touch.
- **changed** `menu`: its rows also work inside a ContextMenu. Nothing changes for an existing Menu.
- **changed** `icons`: ChevronLeftIcon.
- **changed** `litt`: Inter replaces Hanken Grotesk in `--litt-font-sans`. Three weights by role: `--litt-weight` (400, text), `--litt-weight-title` (500, titles) and `--litt-weight-label` (600, 12px labels), with the utilities `font-litt-title` and `font-litt-label`. The scale tops out at 18px: display and h1 are 18 on 28, h2 to h4, reading and body 14 on 22, small 13 on 20 and caption 12 on 16, all on whole-pixel line heights. `text-litt-display` to `text-litt-h4` carry the title weight and `text-litt-caption` the label weight. Control labels are 13, 14 and 16. `--litt-fg-muted` takes the grey of `--litt-fg-subtle` in both themes, so there are two inks.
- **changed** `base-styles`: loads Inter at 400, 500 and 600 and Geist Mono at 400 (`@fontsource/inter` replaces `@fontsource/hanken-grotesk`). Headings, b and strong take the title weight and table headers the label weight.
- **changed** `tag`, `token-input`: tags are set in the sans at the caption size and the label weight, no longer in mono. The tokens of a token input and its +N chip follow.
- **changed** `button`, `tabs`, `segmented`, `pagination`: labels at the title weight. Page numbers stay in mono at 400.
- **changed** `input`, `select`, `checkbox`, `switch`, `slider`, `pad`, `form`: field labels, legends and form section titles at the title weight. Typed text stays at 400.
- **changed** `card`, `callout`, `list`, `states`, `toast`, `dialog`, `command-menu`, `tool-call`, `plan`, `message`, `header`, `app-shell`: titles at the title weight, and wordmarks too. A dialog's title sits 4px above its description, and a description at the caption size stays at 400. MessageText sets headings and strong text at the title weight, never bold.
- **changed** `table`: column headers at the label weight. Mono figures stay at 400.
- **changed** `avatar`, `breakdown`, `chart`, `code-block`, `composer`, `dot-plot`, `gauge`, `heatmap`, `menu`, `spread`, `stat`, `thinking`, `timeline`: mono captions stay at 400 under the caption's label weight, and avatar initials stay at 400 at every size. A stat's value takes the title weight from its step.
- **changed** `code-block`: keywords take `--fg`, so comments stay the one grey in code now that body text and metadata share an ink.

## 2026-10-18 · Agents

A chat and the modules an agent shows while it works (`proposals/agents.md`), and the Slider's range.

- **added** `message`: Conversation and Message, the turns between a person and an agent.
- **added** `composer`: where the person writes to an agent, with Send and Stop.
- **added** `thinking`: the agent's reasoning as a quiet disclosure with a clock.
- **added** `tool-call`: what an agent did, as rows, a folding group and an approval.
- **added** `plan`: an agent's steps, ticked off as it works.
- **added** `code-block`: code in an answer, a tool's output or a diff.
- **changed** `slider`: RangeSlider, two thumbs on the Slider's rail for a span.
- **changed** `icons`: ArrowUpIcon, ArrowDownIcon, StopIcon, PaperclipIcon, RetryIcon, and StatusIcon with the Timeline's five marks.

## 2026-10-17 · Dashboards, data color, rails

Parts for dashboards and data panels, and five data hues (taste profile v0.11, P11: color carries data and never chrome).

- **added** `stat`, `chart`, `app-shell`, `pagination`: number tiles, bar and line charts with a Meter, the sidebar shell and paging.
- **added** `token-input`, `pad`, `avatar`, `callout`, `bar-list`, `gauge`, `dot-plot`, `heatmap`, `timeline`: the data-color parts.
- **added** `breakdown`, `sparkline`, `spread`: data drawn as thin rails.
- **changed** `litt`: five data hues, each with a mark tone, a text tone and a tint (`--litt-data-blue`, `--litt-data-blue-text`, `--litt-data-blue-tint`, and amber, teal, violet and rose).
- **changed** `tag`: takes a hue for a category.
- **changed** `chart`: a hue per series, the Meter takes a hue, a target and steps.
- **changed** `bar-list`: each row can take its own hue.
- **changed** `stat`: a trend slot for a Sparkline.

## 2026-10-16 · Forms

Select, Switch, Slider and the field patterns, and Litt's own accent (taste profile v0.9 and v0.10).

- **added** `select`, `switch`, `slider`, `form`: the forms step.
- **changed** `litt`: the accent is cobalt, a fill with white text in both themes, and accent text has its own token. lg buttons run wider (`--litt-button-pad-lg`).
- **changed** `button`: lg buttons have 32px side padding.
- **changed** `checkbox`: a checked box shows its hover.
- **breaking** `litt`: the accent is a fill only.
  Migrate: replace `text-litt-accent` with `text-litt-accent-text` wherever the accent colors text, such as links.

## 2026-10-15 · Phones and touch, the open decisions

Motion on phones and touch (taste profile v0.6), the open decisions after the agent tests (v0.7) and tags in mono (v0.8). Desktop motion is unchanged.

- **changed** `motion`: the compact and coarse device signals and drag to dismiss.
- **changed** `dialog`: a bottom sheet on phones that drags to close and sits above the keyboard. Dialog takes a `tier`.
- **changed** `popover`: a bottom sheet on phones.
- **changed** `menu`: a submenu replaces the list in place on phones, and pressed rows fill.
- **changed** `command-menu`: sits at the top edge on phones, with a Cancel button on touch.
- **changed** `toast`: swipes away, leaves downward on phones, docks at the top over a sheet, and stays 5s. No status dot.
- **changed** `tooltip`: opens on a 500ms hold on touch.
- **changed** `button`: takes an icon child, fills when pressed on touch and keeps its hairline when disabled.
- **changed** `checkbox`: checked boxes and radios fill with the foreground color.
- **changed** `tag`: mono at the control radius on surface-1, with status as colored text and no dot.
- **changed** `header`: the current page steps its text color instead of a dot.
- **changed** `kbd`: the caption size.
- **changed** `list`: the Project shape asks only for what it uses.

## 2026-10-13 · Breadth

- **added** `input`, `checkbox`, `segmented`, `tag`, `popover`, `header`, `card`, `table`, `states`: the components the spec described and the gallery did not show yet.
- **removed** `dialog-fields`: replaced by Input and Segmented control.
  Migrate: import TextField from `input` and Segmented from `segmented`, and install those two items.

## 2026-10-12 · The registry

The first release: litt's components install into any React and Tailwind v4 project, with every token renamed `litt-…`.

- **added** `litt`, `base-styles`, `motion`, `glide`, `icons`, `kbd`: the tokens, the optional base styles, the motion engine, the gliding highlight, icons and the key cap.
- **added** `button`, `tooltip`, `tabs`, `menu`, `command-menu`, `dialog`, `dialog-fields`, `toast`, `list`, `list-cover`: the first components.
