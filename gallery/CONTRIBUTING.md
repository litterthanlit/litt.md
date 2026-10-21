# Building a gallery component

The gallery is the components gallery for **litt.md**, Nick's design language. Every page runs the locked v0.5 tokens. The Playground is the one place that tunes motion, the header's Customize panel lets anyone try another typeface and radius on every page, and Nick finds the next sweet spot there. So every component must follow `tokens.css`, and on the Playground it must follow the dial live.

We studied Fluid Functionalism for ideas. **We are not copying it.** Take principles, never its look: no weight that changes on hover or selection, no true-gray neutrals, no bounce on small things. This is litt.

## Read first

The rules live in the litt.md skill, one level up from this folder (`../skills/litt-md/`):

- `taste/profile.md`: the rules P1 to P11, the fixed decisions, Do and Don't.
- `system/components.md`: the component specs. Read your component's section.
- `system/foundations.md` and `system/material.md`: type, color, glass, light.
- `src/components/button.tsx` in this repo: the reference component. Match its style.

## Stack

- React 19, TypeScript, Vite.
- Tailwind v4 in **strict mode**: off-system utilities don't exist (see below).
- Motion 12: `import { motion, AnimatePresence } from "motion/react"`.
- Radix primitives are installed and are the accessibility layer: `@radix-ui/react-dropdown-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-tooltip`, `@radix-ui/react-tabs`. Use them for roles, focus and keyboard behavior, and style everything yourself.
- **Do not install packages or edit `package.json`.**

## Files you own

Create only your own files:
- `src/components/<name>.tsx`, plus `src/components/<name>-*.ts(x)` helpers if needed.
- `src/gallery/pages/<NN>-<name>.tsx`, which registers itself automatically.

**Do not edit shared files**: `src/motion/*`, `src/gallery/kit.tsx`, `src/gallery/docs/*`, `src/gallery/app.tsx`, `src/gallery/route.ts`, `src/gallery/motion-panel.tsx`, `src/components/button.tsx`, `src/components/icons.tsx`, `src/styles/*`, `src/generated/*`, `scripts/*`. If you need an icon that is missing, define it inside your own file using the same 16px, 1.5px-stroke pattern. If you need a shared change, say so in your report.

You may import `Button` from `@/components/button` and icons from `@/components/icons`. Do not import another agent's component; they are being built at the same time.

## Motion contract

There are three tiers, and `tokens.css` owns all of their numbers. The Playground overrides them on its own page only:

| Tier | For | How |
|---|---|---|
| instant | hover, press, toggles, color changes | CSS: `transition-[...] duration-(--dur-instant) ease-litt` |
| responsive | menus, submenus, tabs indicator, tooltips, highlights | `useTransition("responsive")` |
| expressive | **one** signature moment per view: dialog, toasts, list entrance | `useTransition("expressive")`, `useStagger()` |

```tsx
import { useTransition, useExit, useTravel, useStagger, useMotionDial } from "@/motion";
const enter = useTransition("responsive");
const exit = useExit("responsive");
const travel = useTravel(); // px, already 0 under reduced motion

<motion.div
  initial={{ opacity: 0, y: -travel / 2, scale: 0.98 }}
  animate={{ opacity: 1, y: 0, scale: 1, transition: enter }}
  exit={{ opacity: 0, scale: 0.98, transition: exit }}
/>
```

- **Never write a duration, delay, spring or easing value.** Use the hooks, or the CSS variables from `tokens.css` (the Playground overrides them on its page only): `--dur-instant`, `--ease-responsive`/`--dur-responsive`, `--ease-expressive`/`--dur-expressive`, `--dur-exit-responsive`/`--dur-exit-expressive`, `--stagger`, `--travel`. A duration class and its ease must pair by tier: `duration-(--dur-instant)` with `ease-litt`, `--dur-responsive` with `ease-responsive`, `--dur-expressive` with `ease-expressive`, and every exit with `ease-litt`. The lint fails any literal and any mismatch.
- **Only transform (x, y, scale) and opacity animate.** Color and background-color may change on the instant tier. Size changes use Motion's `layout` or `layoutId`, which animate through transform; use `layout="position"` where text would stretch.
- **Never animate** width, height, top, left, margins, font-weight, letter-spacing, filter or blur, box-shadow, or anything material (glow, grain, gradients, backdrop) (P5). The one exception is a control's edge and the focus ring, drawn as box-shadow, which may fade on the instant tier as a color would (`foundations.md` section 5).
- **Exits** use `useExit(tier)`: quicker than the enter, a tween, never a bounce.
- **Origin-aware:** popovers grow from their trigger (`transform-origin` on the trigger side) and travel from the side they actually open on, after collision flipping. Radix exposes `data-side`; use it.
- **Distance:** travel at most `useTravel()`, and usually half of it for small things. The one exception is a sheet on compact screens, which rises by its own height so it comes from the edge it is dragged back to (`foundations.md` section 6).
- **One expressive moment per view.** Everything else is instant or responsive.
- **Reduced motion is handled by the hooks** (they return 0). Do not add your own `prefers-reduced-motion` code paths.

## Interaction rules

These come from the audit and are candidate rules. Build them in.
1. **A state change never moves the box.** Hover, selected and active change color or fill only. Labels and icons keep exactly the same size and position.
2. **Touch parity.** Tailwind v4's `hover:` only applies on devices that can hover. Anything revealed on hover must also be visible on focus and on touch (`(hover: none)`). Inputs use at least 16px text on coarse pointers. A pressed row, card or button fills at its own hover fill on a coarse pointer (`pointer-coarse:active:`), never below fg 6%.
3. **Focus by modality.** Use `:focus-visible` only: 2px `outline-focus`, 2px offset, or an inset ring inside lists. A popup opened by pointer shows no ring on its first row until a key is pressed. A keyboard-highlighted row needs a 3:1 indicator, such as an inset 1px `var(--focus)` ring on the highlight; a faint fill alone is not enough.
4. **Phones and touch** follow `foundations.md` section 6 and the "On compact screens" lines in `components.md`. Read the device with `useDevice()` from `@/motion`: `compact` (narrower than 640) decides presentation, `coarse` (a finger) decides input. In CSS use `max-sm:` and `pointer-coarse:`. Both are false on the server, so the first render is the desktop one. A drag to dismiss uses `useDismissDrag` from `@/motion/drag` (not re-exported from `@/motion`), which reads its thresholds with `readDismiss()`, never a number of its own. Every gesture has a button that does the same thing.

## Visual rules

- **Slight radius (litt.md v0.5), and it must stay concentric.** `tokens.css` sets it, 4px and 8px, and the Customize panel can try other values live on every page:
  - `rounded-control` on buttons, inputs, menu and list rows, tabs, segmented groups (with `overflow-hidden`), tags, chips, kbd and tooltips;
  - `rounded-surface` on cards, stages, menus, popovers, dialogs, toasts and the command menu;
  - `rounded-pill` only on avatars, icon-only buttons and switches. Tags and chips are `rounded-control`.
  - No dots for status or the current page: a status is a word (a Tag), and the current page steps the text color.

  An element inset 4px inside a surface uses `rounded-control`; that is what makes it concentric. No other radius exists.
- **Weight by role (P9):** text at 400, titles, buttons, tabs and segments at 500 (`font-title`), 12px labels at 600 (`font-label`). `text-display` to `text-h4` carry 500 and `text-caption` carries 600 on their own, so a mono caption (kbd, numbers) adds `font-normal`, and so does a sentence set at the caption size. Never `font-medium`, `font-semibold` or `font-bold`.
- **Type:** Geist for everything, Geist Mono for code, keys and data (never tags). `text-display` 18, `text-h1` 18, `text-h2` to `text-h4` 14, `text-reading` 14, `text-body` 14, `text-small` 13, `text-caption` 12. Line height and tracking come with the token. Never name a family: use `font-sans` or `font-mono`, so the Customize panel's typeface reaches every component. Use sentence case; no uppercase eyebrows.
- **Text spacing:** a label 4px above its title, a title 4px above its text, blocks 16px apart, sections 48px apart (`foundations.md`, Text spacing).
- **Color only through tokens:**
  - surfaces: `bg-canvas`, `bg-surface-1`, `bg-surface-2`, `bg-surface-3`;
  - text: `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-disabled`;
  - lines and focus: `border-line`, `border-line-strong`, `outline-focus`;
  - accent and status: `bg-accent`, `text-accent-fg`, `text-success`, `text-warning`, `text-danger`;
  - data hues (P11), only where color carries data: marks `bg-data-blue` / `fill-data-blue`, text `text-data-blue-text`, tints `bg-data-blue-tint`, for blue, amber, teal, violet and rose in that order. Never on chrome, and the lint fails a mark tone or tint used as text;
  - arbitrary values read variables, for example `bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]`.
- **Glass (`litt-glass`) only on floating surfaces:** menus, popovers, tooltips, dialogs, toasts, the command menu. Set its shadow with `[--glass-shadow:var(--shadow-modal)]` for dialogs (the default is `--shadow-float`).
  - A floating surface opened **inside** another floating surface is solid (`bg-surface-2` or `bg-surface-3`) with `shadow-float`, never glass on glass.
  - Cards in the page flow use `litt-raised` and no shadow.
  - `.litt-glass` carries the surface radius (v0.5). A glass surface that is full-bleed or hugs an edge resets the corners it should not have: `rounded-none` on the header, `rounded-r-none` on the right-edge sheet.
- **Depth:** `shadow-float`, `shadow-modal`, `shadow-tooltip`, `shadow-glow` (the primary action only). There are no offset shadows. Hairlines are `shadow-[inset_0_0_0_1px_var(--line)]` or `border-line`.
- **One accent fill per view,** on the primary action (P1). Accent can also mark a focus ring. Checkboxes, radios and switches fill with `--fg`, never the accent.
- **Never add `litt-lit` light inside a stage.** The page already has its one light source (P2).
- **Airy density** (Nick's call): menu and list rows are 44px (`h-control-md`), with generous padding. Controls use the 32/44/56 scale (`h-control-sm/md/lg`, `px-control-pad-sm/md/lg`). `size="lg"` is for hero CTAs only (P10). A page form's submit and its paired Cancel are `md`, like its fields, and so are a dialog's fields and actions.
- **Utility classes from tokens.css:** `litt-glass`, `litt-raised`, `litt-trim` (cap-height labels).

## Your gallery page

`src/gallery/pages/<NN>-<name>.tsx`:

```tsx
import { Page, Stage, useReplay, type PageMeta } from "../kit";
export const meta: PageMeta = { id: "menu", title: "Menu", order: 4,
  summary: "One sentence: what it is and what its motion does.", tiers: ["instant", "responsive"] };
export default function MenuPage() {
  return <Page meta={meta}>
    <Stage title="…" tier="responsive" caption="What moves, how, and why, in plain words.">…</Stage>
  </Page>;
}
```

- Use two to four stages. Each caption says what moves, on which tier, and why. Make every demo realistic: Nick's studio, projects, Framer sites and builds; no lorem ipsum.
- Add a Replay button (`useReplay()` and `onReplay`) wherever an entrance matters.
- Captions are written for Nick: short, plain sentences, no em dashes. Say "the travel token" or "the stagger token", not "the dial", and avoid quoting the tunable numbers (durations, travel, stagger), so the copy cannot drift from `tokens.css`.
- Leave `tune` off in your page meta. Only the Playground sets it, because it is the one page allowed to override the motion tokens.
- Name the file `<NN>-<meta.id>.tsx`. The Code view finds a page's source by its id.

## Document it

Every component page is also its docs page. `01-button.tsx` is the reference; copy its shape.

```tsx
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const docs: PageDocs = {
  components: ["menu"],                 // stems in src/components: Props, Source and the Copy prompt's files
  exports: ["Menu", "MenuItem"],        // what a reader uses, in reading order
  usage: `import { Menu, MenuItem } from "@/components/menu";\n…`,
  use: ["…"],                           // 3 to 5 bullets
  skip: ["… Use Command menu."],        // name the alternative
  keyboard: [[["ArrowDown"], "Moves to the next row"]],
  a11y: ["…"],                          // what it guarantees, and what the caller must still do
};

function ProjectActionsDemo() { … }     // a named top-level function

export default function MenuPage() {
  return <Page meta={meta} docs={docs}>
    <Stage title="…" caption="…" code="ProjectActionsDemo"><ProjectActionsDemo /></Stage>
  </Page>;
}
```

- **Props are generated, not written.** `scripts/gen-docs.mjs` reads your component with the TypeScript checker: each prop's type, whether it is required, the default from the destructuring in the signature, and the JSDoc above it. So give every prop a one-line JSDoc. `children` and `ref` only appear when they have one.
- **Code views are your demos.** `code="Name"` shows that function from the page file, with the imports and page helpers it uses. Write demos someone could paste.
- Only claim what the code does. Check every keyboard and accessibility line against the component and its Radix part.
- **Try it** (`<TryIt>` from `../kit`, after the last stage) puts the component beside controls for its props and shows the JSX for what is set. The controls come from the generated prop types: a boolean is a Switch, a union of string literals a Segmented control or a Select, and a string (or a ReactNode you start as text) an Input. Name the export and pass the component and the props it always needs: `<TryIt of="Tag" component={Tag} props={{ children: "In review" }} />`. Add `controls` to choose and order the props, or to offer a DOM attribute such as `{ name: "disabled", type: "boolean" }`, and `derive` for a prop that follows another, such as a Gauge's valueText.

## It ships in the registry

Every `src/components/<name>.tsx` with a page becomes an installable item (`npx shadcn@latest add https://littmd.vercel.app/r/<name>.json`). `scripts/gen-registry.mjs` builds it, so there is nothing to register by hand, but write the component so it can live in someone else's app:
- Import other components and the engines as `@/components/<x>`, `@/motion` or `./<x>`. The generator rewrites them to relative paths and adds the dependencies.
- Use only litt tokens, as the lint already demands. The generator renames them `litt-…` for the host, and fails the build if it meets one it can't map.
- Never assume a provider, a browser global at import time, or the gallery's `vite.config.ts` defines. Next.js renders client components once on the server.
- When you change a component, the motion engine or the tokens, run `npm run test:registry` (fresh Vite and Next.js apps, about ten minutes) before you report.
- **Every change to what an item installs gets a changelog line.** Add it under today's release in `CHANGELOG.md` (`- **changed** \`menu\`: what changed for someone who installed it`), or start the release (`## 2026-10-19 · Title`) if today has none. A new item is an `added` line. `npm run verify` fails and names any item whose files changed without one, then rewrites `registry.lock.json`: commit it with the change. Its words (title, description, docs line) are not part of the hash, and an item today's release already names can change again without a second line.

## Verify before you report

Run these from `gallery/`. In an agent session, never run `npm run dev` or anything long-lived, and build into your own `--outDir` so parallel runs do not collide.

```bash
npm run verify   # syncs the tokens, generates the docs data, then typechecks and runs the litt rule lint
npx vite build --outDir .agent-dist/<you> --emptyOutDir --logLevel warn
node scripts/shot.mjs --dist .agent-dist/<you> --page <id> --out .agent-shots/<you> \
  [--click "<selector>"] [--keys ArrowDown,ArrowDown] [--hover "<selector>"] [--wait 600]
```

Open the PNGs it writes with your Read tool: light and dark, desktop and phone. Take one screenshot with each popup or overlay open, using `--click`. Fix anything broken, cramped, misaligned, or overflowing (the overflow must be 0px), and any console error. Do not commit; the lead commits.

## Report

Keep the report under 400 words:
1. **Files.** What you created.
2. **Built.** What you built and each component's motion, by tier.
3. **Verification.** Typecheck, lint and screenshot results, including what you saw and what you fixed.
4. **Deviations.** Anything you deviated from, and why.
5. **For the lead.** Suggested shared changes and open questions for Nick.
