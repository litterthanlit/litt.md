# Plain's words, drafted for Nick

Track 1 of `shared-fixes.md`, step 2, for Plain. Nick's rule is that nothing in Plain changes without asking, so nothing here is built: each row is a line a visitor reads under `#plain/…` today, what it says, and what is proposed in its place. Say yes to a row (or rewrite it) and it lands as written, through the maps in `meta`, `docs` and `study` (`ledeByWorld`, `summaryByWorld`, `movesByWorld`, `useByWorld`, `skipByWorld`, `a11yByWorld`, `partsByWorld`). Until then `test:words` holds each Plain page in its `KNOWN` list with the words that page's row replaces, so a new word, or another world named on a page no row covers, still fails.

Drafted 2026-11-21 from Plain's bodies (`gallery/src/worlds/plain/`), `litt-principles.md` (Plain: no UI, still, the reader's own page) and `plain.md`, finding 2.

## What has already changed under Plain

The shared lines that named Press's materials were rewritten on 2026-11-21 to say what each part does, so they are true of every world, Plain included (the commit "Say what each part does, not what Press makes it of"). Those are not Plain's own words, but Plain's pages read them: Select's "tray of slats in glass" and Button's "a press sinks the block half a pixel" in Accessibility are gone from every world, and Checkbox's and Tabs' ledes no longer say "filled with ink" and "slide into place". Nothing below has landed.

## One line for every How it moves

Plain moves nothing, so one line can stand for How it moves on every study page under Plain (22 pages have one), in place of the shared paragraph:

> Nothing moves. A press, a key or a pick changes the part the moment you ask, and reduced motion has nothing to take away.

Where a part does something over time that is not motion (Thinking's clock, Copy button's Copied), its own line says so; those are below. With this line, Replay has nothing to show under Plain: the plan's question is whether Replay hides where the world is still (`plain.md`, finding 2).

## The set

| Page | Line | Today | Proposed |
|---|---|---|---|
| Index (player), Dialog | lede | The view's one expressive moment. | A question the page asks before it goes on. |
| Dialog | About | The one expressive moment. The panel is placed, not thrown: it rises by the travel token's distance, settles from 0.98 and may bounce slightly. Exits are quicker and never bounce. On a phone it is a bottom sheet you can drag away. | A question the page asks before it goes on: a panel on the page, inside one line, with the question, what it is about and the answers. It appears at once and goes at once. On a phone it is a sheet at the foot of the screen. |
| Dialog | How it moves | The hand presses a button and the panel answers. This is the view's one expressive moment… | The line above, then: Focus goes in and comes back to the button that opened it. |
| Checkbox | lede | Real checkboxes and radios, with a mark when on. (Shared, changed 2026-11-21 from "filled with ink when on", which was false in Plain and Heat.) | (keep) |
| Checkbox | About | Real checkboxes and radios, drawn as a small cut, like a field… On, the ink fills the box around its tick… Fill, edge and mark fade on the instant tier, and nothing moves. | Real checkboxes and radios, each a square or a circle in one line. On, the line goes to the ink and a tick sits in the box, or a dot in the circle; nothing is filled. The label sits on the right and the whole row is the target. It changes at once. |
| Tabs | lede | Views of one thing, one open at a time. (Shared, changed 2026-11-21 from "Views that slide into place", which was false in Plain, Device, Rack and Heat.) | (keep) |
| Tabs | About | Underline or segmented. The chosen tab is marked by its line or its face, the label only changes color, and the panel shows the tab you picked. | A row of words, the open one in the ink inside four corner marks and the rest in grey. The panel under them shows the one you picked, at once. |
| Tabs | Accessibility | Under reduced motion the indicator jumps and the panel appears without sliding. | The corner marks and the ink say which tab is open, not color alone; nothing moves, so reduced motion changes nothing. |
| Button | About | Roomy, with the label at the title weight. Primary is the view's one strong fill… | A word you press. The main one is in the ink at the title weight inside four corner marks, the one framed thing on a screen; the others are grey words that come to the ink under the hand. Danger is red words. Nothing is filled, and nothing moves. |
| Button | How it moves | Hover swaps the fill on the instant tier, 100ms. A press sinks the block half a pixel… | Under the hand a grey word comes to the ink and takes the corner marks, at once. A press changes nothing else: there is no box to push. Loading keeps the word in place at opacity 0 and turns the spinner where it was, so nothing around it moves. |
| Button | Anatomy | The button, The row, The label | The word, The marks, The label (the marks: the four corners round the main action) |
| Button | Replay | Watch the width: the label fades out under the spinner, and the button keeps its size. | Watch the width: the spinner takes the word's place, and nothing around it moves. |
| Input | lede | A roomy field that answers in color, not motion. | A line under what you type. |
| Input | About | A roomy, slightly rounded field cut a hair into the page, on the same 32, 44 and 56 scale as Button: a white floor in light… | A field drawn as one line under what you type, with no fill and no frame, so the words line up with the label and the page. Focus thickens the line to the focus color and an error draws it in red, and the words under the field say it too. |
| Select | lede | One value from a short list. | (keep) |
| Select | About | One value from a short list. You press the trigger, so it looks like the secondary Button… | One value from a short list. The trigger is a line like a text field's, the value on it and a chevron after it. The list is the page again, inside one line; the current row has a check, and the row under the hand or the keys is in the ink inside four corner marks. |
| Table | About | Real table semantics with hairline rows… Its rows can arrive in one staggered cascade, this page's single expressive moment… | Real table semantics with hairline rows, tabular figures and a sticky header. Rows appear at once, and sorting and filtering change them in place. (Then the shared lines on the virtual body, selection and filters in the address, unchanged.) |
| Form | About | …Fields and link colors answer on the instant tier, and the saved toast is the view's one expressive moment. | How the fields make a page: one left-aligned column, sections on a settings page, and an error summary that takes focus when a submit fails. A saved form says so in words under it. |
| Callout | About | An inline note in the page flow… A surface with an icon… | An inline note in the page flow, said in words: a tip, a heads-up or a result to act on, with its icon, a title, a line and an optional action. Only the icon takes the status color, and a hidden word says the same thing. |
| Breadcrumb | Skip when | The main navigation. Use the Glass header or the App shell's sidebar. | Waits on Nick's call on the name Glass header (below). |
| Details, Pagination | any | Nothing false found. | (keep) |

## Every other page `test:words` flags under Plain

| Page | Line | Today (the words that are not Plain's) | Proposed |
|---|---|---|---|
| About | the stage (from `look.ts`) | "nothing fades, slides, grows or springs"; "a field… casts" | Plain's row in `look.ts` is read by the Copy prompt too: these are true clauses of absence and a field that does not cast; the check reads them because the clause runs past a comma. Proposed: leave the words, and let the check end an absence at "or". |
| Accordion | About | the content fades in and drops a little | Sections that open in place, split by hairlines. A section opens and closes at once, and the rows below take their new place with it. |
| Action bar | About | It rises by the travel token… | A bar at the foot of the view while something is selected: the count in words, the actions as words, and Clear. It appears when the selection starts and goes when it ends. |
| App shell | Accessibility | the sheet, which rises on the expressive spring | Nothing moves: the sheet appears in place. |
| Carousel | About, Keyboard, Accessibility | "slides" (the noun) | The check reads "slides" as motion. Proposed: keep the noun and teach the check that "slides" after "the" or "a row of" is a thing, not a move. |
| Case study, Settings, List, Spring editor | About, Use when, Skip when | "the view's one expressive moment", "expressive tier" | Drop the clause under Plain: nothing in it is a moment. The Spring editor's tier names are code (`tier="expressive"`) and stay. |
| Code input | How it moves | the edge moves to the next, fading on the instant tier | The cell the next digit goes into takes the focus line at once. |
| Date picker | About, Keyboard | the next month slides in | the next month shows. |
| File changes | About, Accessibility | the diff fades in and travels | the diff opens under its row at once. |
| Header, Components | everything | Glass header | Waits on Nick (below). |
| Inspector, Tune | the stage | Settles in 646ms | Content: the demo's own numbers about springs. Leave. |
| Lightbox | About | Opening is the view's expressive moment… rises… settles | One picture of a set at the size of the screen, the rest a key or a swipe away. It opens and changes pictures at once. |
| Media | About | the image fades in | the image appears in its frame. |
| Message | Accessibility | A turn that arrives fades in once and rises | A turn that arrives appears at once. |
| Pad | About | Only the tooltip fades | The tooltip appears at once. |
| Plan | About, Use when, Accessibility | a step added later fades in | a step added later appears in its place. |
| Range chart | Replay | the launch segment rises | Under Plain, Replay has nothing to play (see the line for every How it moves). |
| Rolling number | About | each leaves half of the travel token and fades | A number that updates in place: the new value replaces the old at once. |
| Rule builder, Time scrubber, Shopify | About, Accessibility | settles | it takes its place / the ruler stops at the nearest step / the cart shows the answer when Shopify gives it. |
| Slide to confirm, Tabs | Accessibility | sliding | as written for Tabs above; Slide to confirm keeps its name (the act is a drag). |
| Slider | Anatomy, How it moves | The plate, The cap; the shared paragraph | Plain has no slider body yet, so Plain draws Press's: Anatomy and How it moves are Press's own words for Press's body. Either Plain gets a slider body (`plain.md`, finding 3) or these keep Press's lines. |
| Switch | Anatomy, How it moves | The tray; the shared paragraph | Anatomy: The words, The marks, The label. How it moves: A press anywhere on it, or Space, moves the marks and the ink to the other word at once. Nothing travels. |
| Thinking | How it moves | the body fades in | the body opens at once. |

## For Nick

1. **Yes or no to each row.** A yes lands it as written.
2. **One line for How it moves** on every Plain page, and whether Replay hides there.
3. **Glass header.** The part is named for glass, and its page explains glass (blur, reduced transparency). In Plain, Flat, Rack and Heat the bar is not glass. Rename it (Header), keep the name and say under each world what its bar is, or leave it.
