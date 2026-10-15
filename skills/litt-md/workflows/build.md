# Workflow: build

Use this when building or restyling anything visual: a page, section, component, prototype or Framer site. The process is **plan → check against generic defaults → build → self-critique**, with one step added in a React project you can write to: install litt's components from the registry before you write any markup. Never skip the plan. It is short, and it is where taste gets applied.

## 0. Read the situation

1. **Nick's words in this session win.** If they ask for something the profile forbids (a serif, a centered hero), do it, and offer to log it as a journal entry (it may be taste changing).
2. **An existing project system comes next.** If the project already has tokens or a design system, map litt.md onto it (its colors, its components) rather than replacing it. Apply litt.md's *rules* (the P# rules in `taste/profile.md`) within that system.
3. **Know the target.** Ask if it isn't obvious:
   - **A React + Tailwind v4 project on disk, where you can run commands and write files:** install litt's tested components from the registry and use the `litt-` names (section 3). Do not copy the tokens, and do not hand-write components the registry has.
   - **Code you only show** (claude.ai, "just show me the code", "no need to write files"), **in Tailwind v4:** copy `assets/tokens.css` and `assets/tailwind.css` into the project and import `tailwind.css`. Use token utilities (`bg-canvas`, `text-fg-muted`, `border-line`, `h-control-md`, `px-control-pad-md`, `shadow-float`, `py-section`). Radius: `rounded-control` on buttons and inputs, `rounded-surface` on cards, menus, dialogs and toasts, `rounded-pill` only on chips, tags, avatars and status dots. No other `rounded-*`. Show these plain names even for React when nothing gets installed.
   - **Code (plain CSS, Tailwind 3 or another framework):** copy `assets/tokens.css` and use the variables and `.litt-*` primitives.
   - **Framer:** read `system/framer.md` and work in Framer terms (color styles, text styles, stacks, tween presets).
4. **Client work or Litt's own?** Open question Q6 asks whether the full light-and-material signature applies to client work. Until it's answered, ask Nick the first time on any client project, then log the answer.

## 1. Write the token plan (before any markup)

Write it in the reply, or as the first comment in the main CSS file. Keep it to about 10 lines:

```
Accent:        <hex light> / <hex dark>, why it fits this subject
               (contrast: on canvas ≥ 4.5 if used for links; accent-fg on accent ≥ 4.5)
Light source:  where the one light falls (hero? cover?)
Glass:         which elements float (header, menus, modals, toasts), nothing else
Primary action: the one accent fill + glow in each view
Type steps:    which steps the page uses (display once, h2/h4 labels, body/reading)
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
- [ ] Any font weight above 400 (`font-medium`, `font-semibold`, `font-bold`, or 500/600 in CSS)
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
| `button` | Every button: primary, secondary, ghost, icon-only, loading. One primary per view. Pass an icon with `icon` (or `iconRight`), never as a child: children are the label, trimmed to the cap height, so an icon among them breaks the line. It always renders a `<button>`, so a link to another page is an `<a>`. |
| `input` | `TextField` (label, hint, error), the bare `Input` for inline forms and toolbars, `Textarea`. |
| `checkbox` | `Checkbox`, `CheckboxGroup`, `Radio`, `RadioGroup`, a select-all box. |
| `segmented` | One choice from two to five short options: a view switch, a theme, a filter. |
| `tabs` | Views of one thing (underline), or a compact switch (`variant="segmented"`). |
| `tag` | A status or a label: mono, at the control radius. A status colors its text, never the fill, and has no dot. |
| `kbd` | The key cap for a real shortcut, such as ⌘K. |
| `tooltip` | A label for an icon button or a shortcut. |
| `popover` | A small form, a share link or a detail card on a trigger. On a phone it opens as a bottom sheet by itself, titled by its `label`. |
| `menu` | A dropdown of actions. |
| `command-menu` | ⌘K search for pages, projects and actions. Give it a visible Search button that shows the `kbd` hint. |
| `dialog` | A confirm or a short form that needs full attention. `side="right"` makes a side sheet on desktop. On a phone every dialog is a bottom sheet that drags down to close, with no code of yours: never build your own sheet or drawer. |
| `toast` | Feedback after an action. Mount `Toaster` once, then call `toast()`. On a phone toasts swipe away by themselves. |
| `header` | A sticky glass bar with a wordmark, a nav and actions. |
| `card` | A raised surface for one object that links somewhere. |
| `table` | Rows and columns of data: sticky header, mono figures, sort. |
| `list` | Project rows and cards with status filters (`ProjectList`, `ProjectGrid`, `ProjectFilters`). It reads a `Project` (`id`, `name`, `client`, `deploy`, `status`, `updated`, `description`, `tags`, `cover`), so map your data into that shape. |
| `states` | Empty, skeleton, loading and error views. |
| `litt` | The tokens, the Tailwind names and the material classes. Every component brings it. Install it alone when you write all the markup yourself. |
| `base-styles` | Opt-in. Loads Hanken Grotesk and Geist Mono at weight 400 and sets page defaults for the whole app: weight, the control radius on native controls, the focus ring. Add it when the app is new or Nick wants the whole app in litt. Skip it in an app with its own type system. |
| `motion`, `glide`, `icons`, `list-cover` | Libraries that components bring along. `motion` holds the hooks below, `icons` has 25 16px icons (`SearchIcon`, `PlusIcon`, `SettingsIcon`), and both are fine to install on their own. |

Each item prints a one-line import hint. The gallery page for an item (`https://littmd.vercel.app/#dialog`) has a working example.

### After installing

- **Compose, never copy.** Import from `@/components/litt/<item>` (the `components` alias plus `litt/`). Do not write your own `Button`, `Dialog`, `Input` or any other component the registry has, not even a small one. A fresh shadcn app has its own `components/ui/button.tsx`: leave it alone and use litt's `Button` in litt UI.
- **Never edit** a file under `components/litt/` or `lib/litt/`, or the `--litt-*` block in the global CSS. They are the tested copies, and a later install can overwrite your changes. Read the installed file for props: its exports and JSDoc are the source of truth.
- **If a component lacks something,** wrap it in your own file and tell Nick. That is a registry gap worth logging.
- **Hand-build only what the registry lacks** (a hero, a pricing tier, an accordion). Write it in your own file from `system/components.md`, with the names below.
- **Phones come with the components.** The dialog, popover, menu, command menu, tooltip and toast already adapt to phones and touch (`system/foundations.md` section 6). If your own markup needs to know, read `useDevice()` from `@/lib/litt/motion` (`compact` for layout, `coarse` for touch) or use `max-sm:` and `pointer-coarse:`; never read the user agent.

### Names in a registry project

Every name carries `litt-`, so none of it touches the app's own. To turn a plain name from this skill into one, insert `litt-` after the utility prefix: `bg-surface-1` becomes `bg-litt-surface-1`, `rounded-control` becomes `rounded-litt-control`, `--accent` becomes `--litt-accent`. The tokens switch theme on their own (`.dark`, `[data-theme="dark"]` or the system setting), so do not add `dark:` classes for them.

- **Color:** `bg-litt-canvas`, `bg-litt-surface-1|2|3`, `border-litt-line`, `border-litt-line-strong`, `border-litt-line-control`, `text-litt-fg`, `text-litt-fg-muted|subtle|disabled`, `bg-litt-accent`, `bg-litt-accent-hover`, `text-litt-accent-fg`, `bg-litt-accent-tint`, `outline-litt-focus`, `text-litt-success|warning|danger`.
- **Type:** `text-litt-display|h1|h2|h3|h4|reading|body|small|caption`, each with its own leading, tracking and weight 400. Fonts: `font-litt-sans`, `font-litt-mono`.
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
| `font-medium`, `font-semibold`, `font-bold` | nothing. Everything is 400. |
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
