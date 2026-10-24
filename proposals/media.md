# Media player, and what else is missing

Written 2026-10-24 for Nick, who asked: "we need a media player, what else?"

Media already held a `<video controls>` as children, which kept the frame but handed the controls to the browser: a different bar in every browser, drawn over the picture. This round builds litt's own: `VideoPlayer` and `AudioPlayer` in `media-player.tsx`, one row of controls shared by both. As with the earlier steps, it is built as recommended and waits on your tests. Each decision is one place to change. No taste rule changed. The spec is in `skills/litt-md/system/components.md`, under "Media player".

## Decided by Nick

| # | Question | Decision |
|---|---|---|
| 1 | The first build: a raised card, a play disc on the poster, a bordered Play, a thumb, a buffered band, a volume rail, a hover tooltip and mono times | **Too much.** "Needs to be simpler and quieter, get rid of that mono." The second build below takes each of them out. |

## Built as recommended (Nick reviews after the tests)

| # | Question | Recommendation | Why |
|---|---|---|---|
| 2 | Controls over the picture or under it? | **Under it**, one row 8px below, and they never hide. | Over the picture they need a scrim (a gradient, which is material) and still fail contrast somewhere in it, the same reason Media bans text on a photograph. |
| 3 | What sits on the picture? | **Nothing, ever.** A press on the picture plays and pauses. | The row under it already says it is a video; a disc on the poster was a second Play. |
| 4 | Card | **None.** The frame and the row sit in the page; a page that wants one puts it in a Card. | Quieter, and the frame's hairline already holds the picture. |
| 5 | Buttons | **Every one a round ghost**, the first and last 8px outside the row so their marks line up with the picture's edges. | One weight for the whole row; Play is found by being first. |
| 6 | The rail | **4px at fg 12%, played in `--fg`, no thumb, no buffered band.** The whole row height is the target and keyboard focus rings the rail. | The end of the played part is the playhead. A thumb and a second grey were two more things to read. |
| 7 | Time | **"0:12 / 0:42" in the sans with tabular figures**, small, `--fg-subtle`. Only the elapsed part under 20rem. | No mono. Tabular figures keep the digits still. |
| 8 | Captions | **Between the picture and the row**, small, `--fg`, two lines kept. | Captions are text, and text never sits on a picture in litt. |
| 9 | Playhead motion | **One to one, painted each frame** (a CSS variable, no render). Under reduced motion it **steps** a few times a second. | It is the media's state, not decoration, so it never eases. |
| 10 | Speed | **A button that steps through `rates`**, only when given. | Litt's Menu opens in a portal outside the player, which a full-screen player cannot show. |
| 11 | Volume | **Mute only.** | The level is the device's; iOS lets no page set it anyway. |
| 12 | Buffering | **The Button's spinner inside Play**, which stays Pause and pressable. | "A wait is the loading state of the button that started it." |
| 13 | Two players at once | **Starting one pauses the other.** | Two sounds at once is never what someone wants. |
| 14 | Demo media | **Made for the gallery with ffmpeg**: three field studies pushed in slowly over a synthesized chord (14.5 s), and "Tide", 42 s of shaped noise. About 1.3 MB in `gallery/public/media`. | Nothing anyone else owns. `src/gallery/recordings.ts` says how they were made. |

## Questions for your tests

1. Is a thumbless rail clear enough to drag, or should a small dot mark the playhead?
2. On a phone the row only has room for the elapsed time. Is that enough, or should the length win over Captions?
3. Captions under the picture: do they read well enough at the small size?

## What else is missing

Compared with shadcn/ui and with what Nick's studio builds (Framer sites, case studies, web apps, agents), ranked by what each would unlock:

1. **Before and after**: a draggable split between two images, for redesign case studies. Small, and it pairs with Media and Lightbox.
2. **Diff view**: changed lines with + and − in the status tints, split or unified. The Agents group shows commands and code but not what an agent changed.
3. **Toggle and toolbar**: a pressed button (`aria-pressed`) and a `role="toolbar"` row with one tab stop and arrow keys. The player's row needed both, and editors and view switches (grid or list) do too.
4. **Sortable list**: rows reordered by drag and by keys, then a board of columns on top of it.
5. **Marketing blocks**: a hero, pricing, testimonials, a logo wall and a footer. The blocks today are app screens and one case study; a studio that ships sites needs these most.
6. **Navigation menu**: a site header's dropdown panels (Work, Studio, Journal), which Header's links and Menu's actions don't cover.
7. **Comments on a picture**: pins on a screenshot with a thread each, for client review of a site.
8. **Smaller staples**: a copy button, a password field with show and hide, an inbox of notifications, an image cropper for avatar and cover uploads, an agenda calendar.

For the media player itself, next: chapters on the rail (the time scrubber's marks, named in the tooltip), a waveform for voice notes, picture in picture, and a transcript beside the video that follows the captions.
