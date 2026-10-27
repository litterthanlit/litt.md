# The gallery's first screen, search and the agent steps

Written 2026-10-26 for Nick, after a competition check against five component galleries and Nick's UI moodboard. Nick: "I found 3 more competitors ... let's build up that wow effect, build on the gallery. what are we missing? ... let's build on our strengths. We need to make it intuitive, captivating, fun and easy to use."

As with the steps before it, everything below is built as recommended and waits on Nick's tests. Nothing in `src/components` changed, so the registry and its versions are untouched.

## What the five do

Each was opened at 1440 and 390 wide on 2026-10-26.

| Site | Opens on | Stands out for | What litt takes from it |
|---|---|---|---|
| [transitions.dev](https://transitions.dev/) | A 48px two-line statement and an AI prompt box with a soft glow | ⌘K search; a Motion Agent that scores a codebase out of 100 | Search. Litt already has the score (`litt check`, free), so the home now says so. |
| [bencho.dev](https://bencho.dev/) | A 40px statement and one Join button | A wall of live blocks filtered by Hover, Press, Drag…; Sounds; ⌘K search | Search. The wall and its verb filter were already litt's (2026-10-23). |
| [affectui.com](https://www.affectui.com/) | "UI for AI agents" at 56px and two buttons | Complete screens in a large frame with tabs (Agent Run, Evals, CRM…) | Proposed next: a live screens showcase for the blocks. |
| [uiarc.dev](https://uiarc.dev/) | A 64px statement on a soft gradient field | "Give Arc to your AI": the shadcn CLI and an MCP server side by side | The three steps for agents, on the home. |
| [libraries.dev](https://libraries.dev/) | A 40px statement ringed by small tiles, each a live effect | "Copy the prompt. Paste it to your coding agent" in three steps | The same three-step shape, with litt's own commands. |

All five open on a large statement and one live object or action, sell themselves as built for AI agents, and four have search. Three lean on logos, testimonials or install counts, which litt does not have and should not invent.

Nick's moodboard (four sheets) pulls the same way, and further: large editorial type (The Hebbia Archives, Melius's "One platform. Every creative outcome."), photography and film grain under floating glass panels (Fastino, Branch, Cursor), dither and ASCII texture, raised buttons you want to press, dense instrument panels of sliders (a glass panel's Refraction, Depth and Frost; a dither tool), and big two-tone numbers.

## What litt was missing

1. **A first screen.** Litt opened on an 18px line, three links and a checklist tile. What is most litt, the press material, fun mode and Customize, sat below the fold or behind a ghost button.
2. **Search.** The gallery has a Command menu component and 91 pages, but no way to type a name. `HANDOFF.md` listed it as open.
3. **The way in for agents, where people look.** The plugin, the registry, the MCP setup and the score all existed, on a separate AI tools page.
4. **Fun mode, out in the open.** Litt's most playful asset was two clicks deep in Customize.

## Built in this round

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | What does the home open on? | A statement and a **deck**: litt's own Switch, post Slider and Segmented controls, wired to the whole gallery. Fun mode, Shape (Square to Pill), Theme and Accent. Every tile below follows. | The one thing no competitor can show: the language itself changes under your hand. It is the header's Customize made physical, so there is one set of choices (the deck, the header's theme switch and the panel share `customize-state.tsx`). |
| 2 | How large is the statement? | 56px on desktop and 36px on a phone, for the one line "A design language you can hold.", with its lede at 18px under it. | Nick's moodboard and all five references open on large type. At 18px, a two-ink line beside the deck read as a caption next to a form (screenshots in the session's trail). It is one line with `litt-allow`, as the mobile menu's 28px links are, and **a question for Nick**: an exception for the gallery's hero, or a step toward Q4 (Hypher's 50px headlines). |
| 3 | What does the hero ask you to do? | **Get started** (primary, lg) takes focus to the three steps; **Search components** (secondary, lg, ⌘K) opens search. The site's pages sit under them. | R9 makes hero actions lg. Without one accent fill on the first screen, the deck's Monochrome changed nothing you could see. |
| 4 | Two accent fills on one page? | Get started is the first screen's one; the Button tile carries the wall's, and sits at least a screen below. `test:wall` now fails two fills within one screen of each other anywhere on the page (a probe with the Button tile first failed, 594px apart). | R6 counts a view. A long page holds several, and the check says what a view is. |
| 5 | Search | ⌘K or Ctrl+K anywhere, and a Search button in the header (an icon on a phone). Litt's own Command menu: the components in the sidebar's groups, then the site's pages, then Customize actions said as changes ("Turn fun mode on", "Dark theme"). | Two references have it, and litt already ships the part. Its code loads on first use. |
| 6 | Two menus for one ⌘K? | The gallery listens in the capture phase and stops there, so the Command menu's demo on the wall never opens a second one. The Command menu's own page keeps ⌘K for its demo, which is what that page documents. | `test:home` checks both. |
| 7 | Where do the agent steps go? | After the blocks, reached from Get started: give Claude the language (the plugin), add any part (shadcn), score your app ("how litt is this app?"). Each with a line to copy. The AI tools page keeps the MCP setup. | Three steps is how libraries.dev and uiarc.dev say it. Litt's step 3 is free where transitions.dev's agent is the product. |
| 8 | What opens the wall? | Gauge, Heatmap, Plan, Slide to confirm, Pad, Time scrubber, Stat, Tabs, then Button. | The deck already holds the Switch, the Slider and the Segmented control, so the wall leads with what the deck cannot show. |
| 9 | Proof | `npm run test:home` (in CI): 21 claims about the deck, Get started and search on a build, desktop and phone. It fails on the old build, waiting for the deck. | A reviewer reruns it instead of trusting screenshots. |

## Not built, proposed next

In the order I would do them:

1. **Photography under glass for the hero** (Q5, art direction, is open). The moodboard's strongest pattern: one photograph with film grain, and litt's glass floating over it. The deck would be the floating glass, which R3 allows over busy content. It needs Nick's pick of images and an answer to Q5.
2. **A live screens showcase.** The fourteen blocks are still pictures in a grid. affectUI shows whole screens in one large frame with tabs. Litt's version: one AppFrame on the home, a Segmented control above it to pick Agent, Dashboard, Settings or Product, the block live inside it.
3. **Sounds in fun mode.** bencho.dev sells sounds. A key cap's click, a notch's tick on the slider and a switch's clack, off by default and only in fun mode. Audio is a new kind of feedback for litt, so it is Nick's call.
4. **Search by what a part does.** Typing "modal" does not find Dialog, or "toggle" Switch, because the Command menu matches labels only. A `keywords` prop on `CommandItem` fixes it for every litt user, but it changes a registry item, so it waits for the next release date.
5. **Copy from the wall.** A copy button on each tile's name row for its `shadcn add` line, as transitions.dev has on its cards, so nobody has to open a page to install.
6. **New on the wall.** A New tag on the tiles of items added in the latest releases, read from the changelog, as bencho.dev marks its newest.

## Questions for Nick's tests

1. The 56px statement: keep it as a gallery exception, change R8, or go back to 18px?
2. Is the deck the right first object, or should the first screen show a component from the wall beside it, so a change on the deck shows somewhere besides the deck itself?
3. Get started and the Button tile are each a screen's one accent fill. Is a "view" one screen?
4. Which of the six proposals next?
