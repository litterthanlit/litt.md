# Staples, versions, agent docs and the directory

Written 2026-10-19 for Nick, after the competition check against shadcn/ui and Fluid Functionalism on 2026-10-17. That check found six places where litt trails, and Nick said "do the steps 1-6 where we trail":

1. Not in shadcn's registry directory.
2. No docs for agents (Markdown per page, `llms.txt`).
3. No versioning for people who installed (a changelog and versions on the items).
4. Missing staples: combobox, accordion, date picker, breadcrumb, context menu, scroll area.
5. No agent or chat UI.
6. Fluid Functionalism closed its reduced-motion gap, so litt's lead there narrowed.

Step 5 was already done: the agents step (#18, `proposals/agents.md`) merged on 2026-10-18 with Message, Composer, Thinking, Tool call, Plan, Code block and the Agent page, so this round builds nothing for it. It does give that release its changelog entry.

As with forms, dashboards and agents, everything below is built as recommended and waits on Nick's tests. Each recommendation is a single place to change if the tests say otherwise. The spec is in `skills/litt-md/system/components.md`.

## Decided by Nick

| # | Question | Decision |
|---|---|---|
| 1 | List the registry in shadcn's directory (open decision 26, "not yet, revisit after forms ship")? | **Yes.** Forms shipped in #14. The entry and the pull request text are in `gallery/HANDOFF.md`. The pull request to shadcn-ui/ui goes up after this branch reaches production, so the directory's health check finds the versioned items. |

## Built as recommended (Nick reviews after the tests)

### Versions and agent docs

| # | Question | Recommendation | Why |
|---|---|---|---|
| 2 | How is a release versioned? | By date, `2026.10.19`. One release per day at most. | Litt ships whenever a step lands, and a date says how old an install is at a glance. Semver would ask "is this breaking?" of every taste change, and the changelog already answers that per entry. |
| 3 | Where does the changelog live? | `gallery/CHANGELOG.md`, written by hand, one section per release with `added`, `changed`, `fixed`, `breaking` and `removed` lines that name the items. It is served at `/changelog.md` and drawn on a Changelog page. | One file that a person writes and an agent reads, like Fluid Functionalism's monthly changelog, with no second format to keep in sync. |
| 4 | How does an item know its version? | `gallery/registry.lock.json` keeps a hash of what each item installs and the release that last changed it. `gen-registry` stamps that version into the item's `meta` and into a comment at the top of every file it installs. It fails when an item's files changed but the changelog has no newer entry for it. | An installed copy can say which release it came from, and nobody can change a component without telling the people who installed it. |
| 5 | How does someone update? | Read the entries since their version, then install the item again with `--overwrite`. The skill's build workflow says so. | shadcn has no update command for a namespaced registry. Fluid Functionalism's upgrade script does the same reinstall. |
| 6 | Docs for agents | Every docs page is also Markdown at `/docs/<page>.md`, generated at build time from the page's own docs and the props in `docs.json`. `/llms.txt` lists them, `/llms-full.txt` has all of them in one file, and each page has a Markdown link beside Copy prompt. Asking the home page for `text/markdown` returns `llms.txt`. | Both competitors serve this. The gallery's hash routes (`/#button`) can't take a `.md` suffix, so the pages get their own paths. |
| 7 | Reduced motion | A CI check opens every page and the overlays on it with reduced motion on, and fails if anything moves. With `--self-test` it runs with motion allowed and must see it, so a blind check fails too. The guarantee is written on every Markdown page and in `llms.txt`. | Litt's components already zero every duration, travel and stagger without a provider. Fluid Functionalism now follows the OS too, but only inside its provider. A check in CI turns "built in" into a guarantee nobody else makes. |

### The staples

| # | Question | Recommendation | Why |
|---|---|---|---|
| 8 | Combobox or a searchable Select? | A separate **Combobox**: the Input's field with the Menu's list under it. Select stays for short fixed lists, and Command menu for actions. | Typing changes what a field shows, while a Select trigger is a button. Two components keep both simple. |
| 9 | Combobox on phones | The list stays anchored under the field and is cut to the screen above the keyboard. | A sheet would cover the field being typed in. The command menu reads the visible screen the same way. |
| 10 | Combobox with several values | `multiple` shows the picks as tokens inside the field, in Token input's look, and keeps the list open after each pick. | One look for removable values across the system. |
| 11 | Date values | Plain `YYYY-MM-DD` strings, never `Date` objects. The locale defaults to `en-GB`, with weeks starting on Monday. | A date without a time has no time zone to get wrong. Litt's copy already writes "4 November". |
| 12 | Calendar look | Day numbers in mono at the small size. The picked day is an `--fg` fill with `--canvas` text, today has an inset `--line-strong` ring, and a range is an fg 8% band between two filled ends. Always six weeks. | P1: the accent stays on the primary action, as with checkboxes. Six rows keep the height still when the month changes. |
| 13 | Calendar motion | A new month slides half of `--travel` in from the side it comes from and cross-fades, on the responsive tier, as Tabs panels do. | It says which way time moved. Nothing else in the calendar moves. |
| 14 | Typing a date | Not in this step. The Date picker's field is a button that opens the calendar. | A typed date needs locale-aware parsing, and the calendar covers the common case. |
| 15 | Accordion motion | The panel's height is never animated: it snaps, its content fades in and drops a quarter of `--travel`, and the rows below move to their new place by transform (Motion `layout`). All of it runs on the responsive tier, and the chevron turns half a turn. | Only transform and opacity animate (P5 and the motion rules), and the page still never jumps. |
| 16 | Accordion look | Rows split by `--line` hairlines, triggers 56px tall with the label at the body size in `--fg`, content in `--fg-muted` at the reading measure. No card around it unless the page puts one there. | An airy list, like table rows. |
| 17 | Breadcrumb separator | A `/` in `--fg-subtle`. | The technical-precision choice. A chevron reads as "opens". |
| 18 | Long breadcrumbs | Past four levels the middle folds into an icon-only "…" button that opens a Menu. On compact screens only the last two levels show. | The current page and its parent are what people need. The rest is one tap away. |
| 19 | Context menu | Menu's look and rows exactly. It opens at the pointer on a right-click, on Shift+F10 or the menu key, and on a 500ms press and hold on touch. Every action in it must also be reachable another way. | One menu across the system. The hold matches the tooltip's, and a context menu is a shortcut that touch and keyboard users would otherwise never find. |
| 20 | Scroll area | Native scrolling with litt's thumb: fg 24% (40% on hover), 6px wide at `--radius-control`, shown while scrolling or hovering. A `--line` hairline appears on any edge that has more content beyond it. | Hairlines instead of gradient fades keep material static and precise (P5, P6). |

## Questions for Nick's tests

1. Is mono right for the calendar's day numbers, or should they be the sans at the small size?
2. The scroll area's thumb shows on hover and while scrolling. Should it always show in dense panels?
3. Should a long breadcrumb fold at four levels, or later?
4. Is the dated release name (`2026.10.19`) enough, or do you want a version you bump yourself?
