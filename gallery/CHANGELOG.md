# Changelog

Every change to the litt registry at https://littmd.vercel.app/r/, newest first. A release is named by its date, and each installed file says which release it came from in a comment at its top (`// @litt/button 2026.10.17`), so you can tell what changed since. Item names are the registry's: install one with `npx shadcn@latest add https://littmd.vercel.app/r/<name>.json`.

To update an item, read the entries since your version, then reinstall it with `--overwrite`. A **breaking** entry says what to change in your code.

## 2026-10-19 · Staples and versions

Six staples, and from this release every item carries its version, in the registry and at the top of each file it installs.

- **added** `combobox`: type to find one value, or several, in a long list.
- **added** `date-picker`: Calendar and DatePicker, a day or a range as YYYY-MM-DD strings.
- **added** `accordion`: sections that open in place without the page jumping.
- **added** `scroll-area`: native scrolling with litt's thumb and edge hairlines.
- **added** `breadcrumb`: where a page sits, folding long trails into a menu.
- **added** `context-menu`: the Menu at the pointer, by right-click, Shift+F10 or a hold on touch.
- **changed** `menu`: its rows also work inside a ContextMenu. Nothing changes for an existing Menu.
- **changed** `icons`: ChevronLeftIcon.

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
