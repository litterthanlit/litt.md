# Changelog

Every change to the litt registry at https://littmd.vercel.app/r/, newest first. A release is named by its date, and each installed file says which release it came from in a comment at its top (`// @litt/button 2026.10.17`), so you can tell what changed since. Item names are the registry's: install one with `npx shadcn@latest add https://littmd.vercel.app/r/<name>.json`.

To update an item, read the entries since your version, then reinstall it with `--overwrite`. A **breaking** entry says what to change in your code.

## 2026-10-19 · Staples, versions and Frame 103

Six staples, and from this release every item carries its version, in the registry and at the top of each file it installs.

Then taste profile v0.12, from Nick's own drawing of a primary button (Frame 103): one weight, 550, for every text in both faces; controls at 6px and surfaces at 10px; and the primary action as drawn, deep navy into cobalt inside a 1px deep blue edge, with no glow. Then v0.13: a tag is a label, not a control, so it sits flat. Then v0.14, from Nick's pick in the litt lab: true gray neutrals, more space between sections, and tags in the sans. Then v0.15: a lighter primary in the light theme. Items installed earlier today carry the same version, so install them again with `--overwrite`.

- **added** `combobox`: type to find one value, or several, in a long list.
- **added** `date-picker`: Calendar and DatePicker, a day or a range as YYYY-MM-DD strings.
- **added** `accordion`: sections that open in place without the page jumping.
- **added** `scroll-area`: native scrolling with litt's thumb and edge hairlines.
- **added** `breadcrumb`: where a page sits, folding long trails into a menu.
- **added** `context-menu`: the Menu at the pointer, by right-click, Shift+F10 or a hold on touch.
- **changed** `menu`: its rows also work inside a ContextMenu. Nothing changes for an existing Menu.
- **changed** `icons`: ChevronLeftIcon.
- **breaking** `litt`: the one weight is 550 (`--litt-weight`), controls are 6px and surfaces 10px, and the primary action's fill is Frame 103 (`--litt-accent-fill` from `--litt-accent-top` into `--litt-accent`, edged in `--litt-accent-edge`). `--litt-glow`, `--litt-glow-strength` and `shadow-litt-glow` are gone, and every `text-litt-` step now sets the weight.
  Migrate: delete `shadow-litt-glow`; a primary action is `Button variant="primary"`, or by hand `bg-litt-accent bg-(image:--litt-accent-fill) shadow-[inset_0_0_0_1px_var(--litt-accent-edge)] text-litt-accent-fg`. In litt UI drop `font-normal` (it is 400 in your app): the `text-litt-` step carries the weight, and where there is none write `[font-weight:var(--litt-weight)]`.
- **changed** `button`: the primary is Frame 103, navy into cobalt inside a 1px deep blue edge with an off-white label, and no glow or top highlight. Hover brightens both ends of the fill; a disabled primary drops it.
- **changed** `base-styles`: loads the variable builds, `@fontsource-variable/hanken-grotesk` and `@fontsource-variable/geist-mono`, so weight 550 is drawn rather than synthesized. The static `@fontsource/hanken-grotesk` and `@fontsource/geist-mono` can be uninstalled if nothing else imports them.
- **changed** `avatar`, `code-block`, `composer`, `input`, `kbd`, `message`, `segmented`, `select`, `table`, `tabs`, `thinking`, `token-input`: text renders at the one weight, 550; what set `font-normal` takes `--litt-weight` instead, so it holds in any app.
- **changed** `motion`: the Playground's locked preset follows the taste profile (v0.13), and its radius choices are 0, 4, 6 and 8.
- **changed** `tag`, `token-input`: a tag is a flat `--litt-surface-2` fill with no hairline and no top highlight, so it no longer looks like a button, and it is set in the sans; a hue tag keeps only its tint. Token input's tokens and its "+N" chip follow.
- **changed** `litt`: the neutrals are true gray at the same lightness steps (canvas, surfaces, lines, text, glass and shadow ink), so contrast is unchanged. `--litt-section-y` is 96 / 128 / 160, `--litt-gutter` 16 / 32 / 48, `--litt-grid-gap` 32 from 640px, and `--litt-container-content` 1000px.
- **changed** `litt`: the light theme's primary fill is lighter, a mid cobalt rather than navy (`--litt-accent-top`, `--litt-accent`, their hovers and `--litt-accent-edge`), with a white label (`--litt-accent-fg`). The dark theme is unchanged.

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
