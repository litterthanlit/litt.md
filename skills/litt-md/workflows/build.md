# Workflow: build

Use this when building or restyling anything visual: a page, section, component, prototype or Framer site. The process is **plan → check against generic defaults → build → self-critique**, with one step added in a React project you can write to: install litt's components from the registry before you write any markup. Never skip the plan. It is short, and it is where taste gets applied.

## 0. Read the situation

1. **Nick's words in this session win.** If they ask for something the profile forbids (a serif, a centered hero), do it, and offer to log it as a journal entry (it may be taste changing).
2. **An existing project system comes next.** If the project already has tokens or a design system, map litt.md onto it (its colors, its components) rather than replacing it. Apply litt.md's *rules* (the P# rules in `taste/profile.md`) within that system.
3. **Know the target.** Ask if it isn't obvious:
   - **A React + Tailwind v4 project on disk, where you can run commands and write files:** install litt's tested components from the registry and use the `litt-` names (section 3). Do not copy the tokens, and do not hand-write components the registry has.
   - **Code you only show** (claude.ai, "just show me the code", "no need to write files"), **in Tailwind v4:** copy `assets/tokens.css` and `assets/tailwind.css` into the project and import `tailwind.css`. Use token utilities (`bg-canvas`, `text-fg-muted`, `border-line`, `h-control-md`, `px-control-pad-md`, `shadow-float`, `py-section`). Radius: `rounded-control` on buttons and inputs, `rounded-surface` on cards, menus, dialogs and toasts, `rounded-pill` only on avatars, icon-only buttons and switches (tags and chips are `rounded-control`). No other `rounded-*`. Show these plain names even for React when nothing gets installed.
   - **Code (plain CSS, Tailwind 3 or another framework):** copy `assets/tokens.css` and use the variables and `.litt-*` primitives.
   - **Framer:** read `system/framer.md` and work in Framer terms (color styles, text styles, stacks, tween presets).
4. **Client work or Litt's own?** Open question Q6 asks whether the full light-and-material signature applies to client work. Until it's answered, ask Nick the first time on any client project, then log the answer.

## 1. Write the token plan (before any markup)

Write it in the reply, or as the first comment in the main CSS file. Keep it to about 10 lines:

```
Accent:        <hex light> / <hex dark>, why it fits this subject
               (contrast: accent on canvas ≥ 3; accent-fg on accent ≥ 4.5; accent-text on canvas ≥ 4.5)
Light source:  where the one light falls (hero? cover?)
Glass:         which elements float (header, menus, modals, toasts), nothing else
Primary action: the one accent fill + glow in each view
Type steps:    which steps the page uses (display once at 18, 14px titles at 500, body/reading at 400, 12px labels at 600)
Layout:        ASCII wireframe on the 12-col grid (asymmetric by default)
Specific detail: one element only THIS subject would have (from its content, not ornament)
Components:    registry items to install (section 3) and what you must hand-build
               (React projects you can write to; leave this line out when you only show code)
```

In a registry project the accent is the installed `--litt-accent`. Name it on the Accent line instead of picking a new color.

**Example wireframe:**
```
| 1  2  3  4  5 | 6 | 7  8  9 10 11 12 |
| Headline      |   | Product visual   |   ← hero, lit from top
| lede · CTA    |   | (glass menu over)|
|---------------|---|------------------|
| Label (h4)    | Content (cols 4–12)  |   ← sections: 3/9 split
```

## 2. Check the plan against generic defaults

Go through the plan line by line. If any item matches, revise that line before building:

- [ ] Purple-to-blue gradient, gradient text, or a gradient used as decoration
- [ ] Everything centered
- [ ] Three equal icon cards as the answer to "features"
- [ ] An accent bar or rail on cards; an arrow suffix on every link
- [ ] The same uppercase mono eyebrow over every section
- [ ] One accent-colored word in the headline
- [ ] A radius off the scale (`rounded-lg`, `rounded-md`, anything but control, surface or pill)
- [ ] A drop shadow with an offset, or any shadow on a card in the flow
- [ ] Buttons off the 32/44/56 scale, a hero or page-form CTA smaller than lg, or lg fields and buttons in a dialog
- [ ] A weight outside the three roles: bold or 700 and up, `font-medium`, `font-semibold` or `font-bold` (use `font-title` and `font-label`), 500 or 600 on running text, or 600 above 12px
- [ ] Type above 18px, or headings stepped down by size instead of weight and ink
- [ ] More than one accent fill or glow per view, counting an accent-filled checkbox, radio or switch
- [ ] Glass on something that doesn't float
- [ ] Motion that isn't a response to the user (reveals, parallax, marquee)
- [ ] Bounce on the responsive tier or on an exit, `transition-all`, or a second expressive moment
- [ ] Nothing in the design is specific to this subject

Then ask: **"If I removed the light and material, would this still look like every other dark SaaS page?"** If it would, the signature is decorative, not structural. Move the light so it lands on the content that matters.

## 3. Install the components (React projects)

Use this when the target is a React + Tailwind v4 project on disk, you can run commands, and the result is written into the project. Skip it when you only show code, or the project is plain HTML/CSS, Tailwind 3 or another framework. Those take the copy-tokens path from section 0.

The litt registry ships the components from the gallery at littmd.vercel.app, tested in Vite and Next.js. Compose them instead of hand-writing look-alikes. Install what the design needs **before you write any markup**.

1. Read the project's `components.json`.
   - `registries` has `@litt`: `npx shadcn@latest add @litt/dialog @litt/input @litt/checkbox`
   - No `@litt` entry: `npx shadcn@latest add https://littmd.vercel.app/r/dialog.json https://littmd.vercel.app/r/input.json`
   - No `components.json` at all: `shadcn add` would run `shadcn init`, which changes the app's own styles. Ask Nick first. If you cannot ask, or the answer is no, take the copy-tokens path.
2. Put every item in one command. A component brings what it needs (`dialog` brings `button`, `icons`, `motion` and `litt`), so name only the components the design uses. Add `--yes` if nobody can answer a prompt.
3. Check it worked. The files sit in `components/litt/` and `lib/litt/` (under `src/` in a Vite app), and the global CSS has a new `--litt-*` block. The CLI also adds npm packages such as `motion` and Radix. That is expected.

| Item | Install it for |
|---|---|
| `button` | Every button: primary, secondary, ghost, icon-only, loading. One primary per view. Pass an icon with `icon` (or `iconRight`), or as a child next to the label, as shadcn writes it. It always renders a `<button>`, so a link to another page is an `<a>`. |
| `input` | `TextField` (label, hint, error), the bare `Input` for inline forms and toolbars, `Textarea`. |
| `number-field` | A number someone sets with bounds and a step: seats, a limit, a price (`NumberField` with `min`, `max`, `step`, a `unit` or a `format`). It reads typed text in the page's locale. Never `type="number"`. |
| `code-input` | A one-time code from an email, a text or an authenticator app (`CodeInput`). One real field drawn as cells, so paste and autofill work; check the code in `onComplete`. |
| `token-input` | A field that collects several short values as tokens: recipients, sender domains, tags (`TokenInput`). Hold the values in state. |
| `combobox` | A searchable field for one value, or several, from a long list: a client, a framework, a teammate (`Combobox` with `options` as `{ value, label, group? }` and `multiple` for tokens). A short fixed list is a `select`. |
| `file-drop` | Adding files: drop or choose, turned away by type or size with a reason (`FileDrop`), and each file uploading on a rail with Retry and Remove (`FileList`, `FileRow`). Never a bare file input. |
| `date-picker` | A day or a range: a launch date, a report period (`DatePicker`, or `Calendar` on its own). Values are `YYYY-MM-DD` strings, or `{ start, end }` with `mode="range"`; `presets` for "Last 7 days". On a phone it opens as a bottom sheet by itself. |
| `checkbox` | `Checkbox`, `CheckboxGroup`, `Radio`, `RadioGroup`, a select-all box. |
| `select` | One value from a short list (`SelectField` with a label, the bare `Select` in a toolbar). Never a native `<select>`. Pass `options` as `{ value, label }`. It stays anchored on a phone. |
| `switch` | An on or off setting (`Switch`). `align="end"` lines switches up at the end of settings rows. A choice that can be wrong, such as accepting terms, is a checkbox. |
| `slider` | A value on a range, such as an animation speed (`Slider`), or a span with two thumbs, such as build times between 20s and 80s in a filter (`RangeSlider`). Give it `minLabel` and `maxLabel` so the direction is clear. |
| `pad` | Two related values set at once on one surface, such as tone against length (`Pad`). Two independent values are two Sliders. |
| `form` | The page patterns: `FormSection` for settings sections, `Fieldset` (`rows` for a list of switches), `ErrorSummary` above a long form, `FormActions` (`align="fields"` on a settings page). |
| `segmented` | One choice from two to five short options: a view switch, a theme, a filter. |
| `tabs` | Views of one thing (underline), or a compact switch (`variant="segmented"`). |
| `tag` | A status or a label: the sans at the label weight, at the control radius. A status colors its text, never the fill, and has no dot. A category can take a data hue (`hue="amber"`): one hue per category in a view. |
| `kbd` | The key cap for a real shortcut, such as ⌘K. |
| `avatar` | A person, client or company (`Avatar`, `AvatarGroup` with a +N count). The hue follows from the name; mark it `decorative` when the name sits beside it. |
| `tooltip` | A label for an icon button or a shortcut. |
| `popover` | A small form, a share link or a detail card on a trigger. On a phone it opens as a bottom sheet by itself, titled by its `label`. |
| `menu` | A dropdown of actions. |
| `context-menu` | Actions on the thing under the pointer, on right-click, Shift+F10 or a hold on touch (`ContextMenu` with the Menu's rows). Every action in it must also be on a visible control, such as a ⋯ `menu` on the row. |
| `command-menu` | ⌘K search for pages, projects and actions. Give it a visible Search button that shows the `kbd` hint. |
| `dialog` | A confirm or a short form that needs full attention. `side="right"` makes a side sheet on desktop. On a phone every dialog is a bottom sheet that drags down to close, with no code of yours: never build your own sheet or drawer. |
| `hover-card` | A preview behind a name or a link, on hover or keyboard focus (`HoverCard`, `HoverCardTrigger`, `HoverCardContent`). The trigger must lead to the same thing: a touch never opens the card. |
| `lightbox` | Images people should see larger: one of a set at the size of the screen (`Lightbox` with `items` and the open `index` in state, set from each `Media`'s `onOpen`). Give every item its `width` and `height`. Never a hand-built overlay for images. |
| `toast` | Feedback after an action. Mount `Toaster` once, then call `toast()`. On a phone toasts swipe away by themselves. |
| `header` | A sticky glass bar with a wordmark, a nav and actions. |
| `card` | A raised surface for one object that links somewhere. |
| `media` | Every image in the page flow (`Media` with `src`, a sentence of `alt` and a `ratio`): it keeps its shape while it loads and says so when it fails. `priority` only on the image the page opens on; `onOpen` to open a `lightbox`. Never a bare `<img>`. |
| `carousel` | A set people look through in order, such as a project's screens, or a strip of cards (`Carousel`, `CarouselContent`, `CarouselItem`, `CarouselControls`, as shadcn's). `perView` one, two or three. It never autoplays or loops; key content goes in the page, not on a later slide. |
| `callout` | An inline note in the flow: a tip, a heads-up, a result to act on (`Callout`). Color lives in the icon only, never a rail or a tinted box. |
| `accordion` | Sections that open in place: questions and answers, groups of settings (`Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`). The page never jumps, and nothing animates its height. |
| `scroll-area` | A region that scrolls inside the page, such as a log or a long list in a fixed-height card (`ScrollArea` with a `label` and a height). Never the page itself. |
| `tree` | Files, pages or folders opened a level at a time (`Tree` with `items` as `{ id, label, detail, children }`). It has a file tree's keys. A flat list is a list. |
| `resizable` | Panels with a line to drag between them: a tree beside a log, a list beside its detail (`ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`, as shadcn's). On a phone show one at a time instead. |
| `breadcrumb` | Where a page sits: Studio / Projects / Marlow Labs (`Breadcrumb` with `items` as `{ label, href }`, the last being the current page). Long trails fold into a menu. |
| `steps` | Where someone is in a flow of three to six steps, such as setup or checkout (`Steps`). Views moved between freely are Tabs. |
| `table` | Rows and columns of data: sticky header, mono figures, sort. |
| `action-bar` | Actions for the rows or cards someone selected (`ActionBar` with `count`, `noun`, `onClear` and sm Buttons), after the list. Never an accent fill. |
| `stat` | A number tile for one figure (`Stat`, `StatGroup`): a label, the value, and a change said in words such as "Up 12% on last week". `tone` says whether it is good or bad news. `trend` takes a Sparkline at the foot of the tile. |
| `chart` | `BarChart`, `LineChart` and `Meter`, never the accent: the foreground by default, or data hues when color tells series apart (`hue` on a series, or `hues` on the chart). Pass a `label`, the category `labels` and `series` of `{ name, values }`. It fills its container's width. |
| `sparkline` | A trend in one thin line beside its figure: in a Stat's `trend` slot, a table cell or a list row (`Sparkline`). Fix `min` and `max` so a column compares. |
| `breakdown` | One whole split into its parts: storage by kind, credits by feature (`Breakdown`). A split rail and a meter row per part, or a legend for a tile. |
| `bar-list` | A ranked list with a thin bar per row: top pages, most-used shortcuts, busiest repos (`BarList`). A lead slot takes a Kbd, an icon or an avatar. |
| `gauge` | One value against a range on an arc of ticks with the figure in the middle (`Gauge`): credits left, storage. For a thin bar use `Meter`. |
| `dot-plot` | A distribution of many values, such as reply or build times, with a goal, the median and named outliers (`DotPlot`). |
| `spread` | How values spread per row on one scale, as thin rails: build times by site, reply times by client (`Spread`). |
| `heatmap` | A grid of dots whose depth says how much: activity per day, usage per month, mail per hour (`Heatmap`). |
| `timeline` | The steps of a run with their times and statuses, grouped in phases, and `TimelineBar` for the whole run as a strip. Never build a deploy log by hand. |
| `app-shell` | `AppShell`, `SidebarNav` and `SidebarLink`: a sidebar that runs the full height of the page, and the page beside it. On a phone it becomes a top bar and a bottom sheet by itself. Lay the page out with `grid grid-cols-1`, so a wide table cannot stretch it. |
| `pagination` | The range ("21 to 40 of 143") with Previous and Next under a table. You hold the page in state. |
| `list` | Project rows and cards with status filters (`ProjectList`, `ProjectGrid`, `ProjectFilters`). It reads a `Project` (`id`, `name`, `client`, `deploy`, `status`, `updated`, `description`, `tags`, `cover`), so map your data into that shape. |
| `states` | Empty, skeleton, loading and error views. |
| `progress` | Work happening now with a known end: an upload, an import (`Progress`). It ends done or failed in words. A quantity that stands still is a `Meter` (chart). |
| `message` | A chat with an agent (`Conversation`, `Message`, `MessageText`, `MessageActions`). The agent's turn has no bubble and the person's is a raised bubble on the right. Put the agent's thinking, plan and tool calls inside its `Message`, and render markdown inside `MessageText`. Pass `busy` while it answers. Never hand-build bubbles or a stick-to-bottom scroller. |
| `composer` | Where the person writes to an agent (`Composer`): a growing field, file chips, a toolbar slot and Send, which becomes Stop while `streaming`. Send is the view's one accent fill; pass `sendDisabled` while an approval waits. `FileChip` shows a sent file. |
| `thinking` | The agent's reasoning above its answer (`Thinking`): "Thinking 4s" with a clock while `active`, then "Thought for 12s". Never a shimmer, a pulse or animated dots. |
| `tool-call` | What an agent did (`ToolCall` rows with a status, the action, the target and the time; `ToolCallGroup` to fold a run; `ToolApproval` to ask before a call runs, with Allow as the accent). |
| `plan` | An agent's steps for a task, ticked off as it works (`Plan` with `steps` of `{ id, label, status }`). |
| `code-block` | Code in an answer, a tool's output or a diff (`CodeBlock` with `code`, `lang` and `filename`). Quiet colors, a Copy button, and `lang="diff"` for a change. |
| `log-view` | A build's or a deploy's output as it arrives (`LogView` with `lines` as `{ time, level, text }` and a `height`). It follows the newest line. Code is a `code-block`. |
| `litt` | The tokens, the Tailwind names and the material classes. Every component brings it. Install it alone when you write all the markup yourself. |
| `base-styles` | Opt-in. Loads Geist at 400, 500 and 600 and Geist Mono at 400, and sets page defaults for the whole app: headings, b and strong at the title weight, table headers at the label weight, the control radius on native controls, the focus ring. Add it when the app is new or Nick wants the whole app in litt. Skip it in an app with its own type system. |
| `motion`, `glide`, `icons`, `list-cover` | Libraries that components bring along. `motion` holds the hooks below, `icons` has 30 16px icons (`SearchIcon`, `PlusIcon`, `SettingsIcon`) and `StatusIcon` with the five step marks, and both are fine to install on their own. |

**Blocks** are whole screens built from the items above. When the task asks for a screen like one of these, start from the block instead of composing it from nothing. It brings every component it uses. The app screens (`projects`, `settings`, `team`, `activity`) are a page's content: render them inside the app's shell, such as `dashboard`'s `AppShell`.

| Block | Install it for |
|---|---|
| `dashboard` | An app's overview: the app shell, four Stat tiles, a bar chart and a paginated table (`Dashboard`). |
| `usage` | A plan's usage or billing page, drawn in rails: trends, a breakdown by kind, limits against budgets (`Usage`). |
| `growth` | A growth or analytics report: stacked columns filtered by a Legend and a week range, a funnel, retention (`Growth`). |
| `insights` | A grid of insight panels, one idea each: a dot plot, a bar list, a rule form, a timeline, a gauge, a heatmap (`Insights`). |
| `agent` | A chat with an agent, every state of a turn, with a composer (`AgentChat`). The run is a script: replace `useRun` with your agent's stream. |
| `projects` | A list of projects or other records with status filters, a search and a list or grid switch, and an action bar for the cards ticked in the grid (`Projects`). It uses the list's `Project` shape. |
| `settings` | An account or studio settings page: sections, an error summary, a saved toast and a danger zone behind a slide to confirm (`Settings`). |
| `team` | Members, roles and invites: a seats meter, a table with a role picker per row, an invite dialog for several addresses (`Team`). |
| `activity` | A feed of what happened, grouped by day and filtered by kind (`Activity`). |
| `sign-in` | A sign-in page with field errors, a server refusal and a second way in (`SignIn`). A whole page, not a part of the app shell. |
| `deployment` | One deploy as a screen: status, facts, a progress rail, the changed files in a tree beside the build log with a line to drag, and each file's diff (`Deployment`). Inside the app shell. |
| `case-study` | One project told as a page: a hero image, the facts, the story beside its labels, a carousel, a grid of details and the next project, with one lightbox for every image (`CaseStudy`). A page's content, inside a site's layout. |

A block lands in `components/litt-blocks/<name>.tsx`, outside `components/litt/`, because it is a starting point. Change it in place: replace the sample data at the top of the file, rename things, drop the panels you do not need. Keep its layout, its spacing and its one accent fill. Never reinstall a block over your edits.

Each item prints a one-line import hint. The gallery page for an item (`https://littmd.vercel.app/#dialog`) has a working example.

Every item also has its docs as Markdown at `https://littmd.vercel.app/docs/<item>.md` (props, keyboard, accessibility), and `https://littmd.vercel.app/llms.txt` lists them all. Read one when the installed file's JSDoc is not enough.

### Keeping installed items current

Every installed file names its release in its first lines (`// @litt/button 2026.10.17`), and `https://littmd.vercel.app/changelog.md` lists what changed in each release, newest first. When Nick asks to update litt, or an item lacks something the changelog says it has: read the entries newer than the installed version, install those items again with `--overwrite`, then follow any **Migrate** line in your own code. Never hand-merge a newer version into an installed file.

### After installing

- **Compose, never copy.** Import from `@/components/litt/<item>` (the `components` alias plus `litt/`). Do not write your own `Button`, `Dialog`, `Input` or any other component the registry has, not even a small one. A fresh shadcn app has its own `components/ui/button.tsx`: leave it alone and use litt's `Button` in litt UI.
- **Never edit** a file under `components/litt/` or `lib/litt/`, or the `--litt-*` block in the global CSS. They are the tested copies, and a later install can overwrite your changes. Read the installed file for props: its exports and JSDoc are the source of truth. A block in `components/litt-blocks/` is the one installed file you change.
- **If a component lacks something,** wrap it in your own file and tell Nick. That is a registry gap worth logging.
- **Hand-build only what the registry lacks** (a hero, a pricing tier, a testimonial). Write it in your own file from `system/components.md`, with the names below.
- **Phones come with the components.** The dialog, popover, menu, command menu, tooltip and toast already adapt to phones and touch (`system/foundations.md` section 6). If your own markup needs to know, read `useDevice()` from `@/lib/litt/motion` (`compact` for layout, `coarse` for touch) or use `max-sm:` and `pointer-coarse:`; never read the user agent.

### Names in a registry project

Every name carries `litt-`, so none of it touches the app's own. To turn a plain name from this skill into one, insert `litt-` after the utility prefix: `bg-surface-1` becomes `bg-litt-surface-1`, `rounded-control` becomes `rounded-litt-control`, `--accent` becomes `--litt-accent`. The tokens switch theme on their own (`.dark`, `[data-theme="dark"]` or the system setting), so do not add `dark:` classes for them.

- **Color:** `bg-litt-canvas`, `bg-litt-surface-1|2|3`, `border-litt-line`, `border-litt-line-strong`, `border-litt-line-control`, `text-litt-fg`, `text-litt-fg-muted|subtle|disabled`, `bg-litt-accent`, `bg-litt-accent-hover`, `text-litt-accent-fg`, `text-litt-accent-text` (links and accent text; never `text-litt-accent`), `bg-litt-accent-tint`, `outline-litt-focus`, `text-litt-success|warning|danger`.
- **Type:** `text-litt-display|h1|h2|h3|h4|reading|body|small|caption`, each with its own leading and tracking. Display to h4 carry the title weight (500) and the caption the label weight (600); the rest are 400. Weights: `font-litt-title` for a title at the body or small size, a button or a tab, `font-litt-label` for a 12px label, `font-normal` for a mono caption. Fonts: `font-litt-sans`, `font-litt-mono`.
- **Space and layout:** `py-litt-section`, `px-litt-gutter`, `max-w-litt-reading|content|wide`, `h-litt-control-sm|md|lg`, `px-litt-control-pad-sm|md|lg`, `gap-litt-control`.
- **Shape and depth:** `rounded-litt-control|surface|pill` (sides such as `rounded-t-litt-surface` are fine), `shadow-litt-tooltip|float|modal|glow`, `inset-shadow-litt-highlight`.
- **Material:** `litt-glass`, `litt-raised`, `litt-lit`, `litt-grain`, `litt-grain-fade`, `litt-trim`. Variables for arbitrary values: `var(--litt-line)`, `var(--litt-fg)`.

Inside litt UI, never use the app's own shadcn tokens or Tailwind's defaults:

| Not this | This |
|---|---|
| `bg-background`, `bg-card`, `bg-muted` | `bg-litt-canvas`, `bg-litt-surface-1`, `bg-litt-surface-2` |
| `text-foreground`, `text-muted-foreground` | `text-litt-fg`, `text-litt-fg-muted` |
| `border-border`, `border-input` | `border-litt-line`, `border-litt-line-control` |
| `bg-primary text-primary-foreground` | `bg-litt-accent text-litt-accent-fg`, once per view. `Button variant="primary"` already does it. |
| `ring-ring`, `bg-destructive` | `outline-litt-focus`, `text-litt-danger` on a secondary button |
| `bg-zinc-900`, `text-gray-500`, `bg-white`, `text-black` | a litt color above |
| `rounded`, `rounded-md`, `rounded-lg`, `rounded-full` | `rounded-litt-control`, `rounded-litt-surface` or `rounded-litt-pill` |
| `text-xs`, `text-sm`, `text-base`, `text-xl`, `text-[15px]` | the `text-litt-` step that fits the role |
| `font-medium`, `font-semibold`, `font-bold` | `font-litt-title` (500) on a title, button or tab, `font-litt-label` (600) on a 12px label, nothing on text. |
| `shadow-sm`, `shadow-md`, `shadow-xl` | nothing on a card. `shadow-litt-float` on a floating surface. |

**Motion in a registry project.** The installed components already carry their tiers.
- Hover, press and color fades are the instant tier: `transition-colors duration-(--litt-dur-instant) ease-litt`. Tailwind's own transition default is 150ms, so always write both classes.
- Anything of yours that moves uses `motion` from `motion/react` and the hooks from `@/lib/litt/motion`: `useTransition("responsive")` or `useTransition("expressive")` for the enter, `useExit(tier)` for the exit, `useTravel()` for distance, `useStagger()` for a cascade. Only transform and opacity animate. One expressive moment per view.
- Never write a duration, delay, spring, bounce or Tailwind ease yourself: no `duration-300`, `ease-in-out`, `transition-all` or `transition={{ duration: 0.3 }}`. Reduced motion works only through the hooks and tokens.
- CSS durations pair with their ease: `--litt-dur-responsive` with `ease-litt-responsive`, `--litt-dur-expressive` with `ease-litt-expressive`, exits (`--litt-dur-exit-responsive`, `--litt-dur-exit-expressive`) with `ease-litt`.

## 4. Build

- **Names:** in a registry project use the `litt-` names and the hooks from section 3. The plain names in the bullets below are for the copy-tokens path and for showing code.
- **Semantic HTML first:** `header`, `nav`, `main`, `section` with `aria-labelledby`, `button` versus `a` used correctly, and `dialog` for modals.
- **Mobile-first:** start at 390px, then 640, then 1024. Check that nothing scrolls horizontally.
- **Primitives:** `.litt-lit`, `.litt-grain`, `.litt-grain-fade`, `.litt-glass`, `.litt-raised`. Component specs are in `system/components.md`, and working code is in `assets/specimen.html`.
- **Spacing** only from the scale. **Radius** control (4), surface (8) or pill. **Controls** only from the 32/44/56 scale. **Color** only from tokens. Never write a hex value in a component.
- **Motion** only through the tier tokens: `--dur-instant` with `--ease-out`, `--dur-responsive` with `--ease-responsive`, `--dur-expressive` with `--ease-expressive`, exits on `--dur-exit-*` with `--ease-out`, plus `--stagger` and `--travel`, so reduced motion keeps working.
- **Performance:** lazy-load images below the fold (`loading="lazy"`), set explicit width and height on media, animate only opacity and transform (color fades at instant), keep glass to a few elements per screen, and never put blend modes on fixed layers.

## 5. Self-critique

Before presenting:
1. If a browser is available, take Playwright screenshots in light and dark at 1440 and 390, and look at them.
2. Run the critique checklist in `workflows/critique.md` on your own output. Fix every **fail** in the Signature and Accessibility groups before showing Nick anything.
3. In a registry project, search your own files (not `components/litt/`) for off-system classes: `rounded-(sm|md|lg|xl|full)`, `text-(xs|sm|base|lg|xl)`, `font-(medium|semibold|bold)`, `shadow-(sm|md|lg|xl)`, `bg-(white|black|zinc|gray|slate|primary|background|muted)`, `transition-all`. Fix every hit. Then run the project's typecheck and production build.
4. **Remove one thing.** Find the least necessary element (an extra label, a second button style, a divider) and delete it.

## 6. Present

Show the result plus 2–4 lines naming the decisions that applied the taste (where the light falls, what floats, the accent choice). In a registry project, also say which items you installed and what you hand-built because the registry lacked it. If Nick reacts ("too much glow", "love the header"), log it with `workflows/evolve.md`. Use the quick template in SKILL.md for a single reaction.
