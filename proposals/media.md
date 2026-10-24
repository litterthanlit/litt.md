# Media player, and what else is missing

Written 2026-10-24 for Nick, who asked: "we need a media player, what else?"

Media already held a `<video controls>` as children, which kept the frame but handed the controls to the browser: a different bar in every browser, drawn over the picture. This round builds litt's own: `VideoPlayer` and `AudioPlayer` in `media-player.tsx`, one bar shared by both. As with the earlier steps, it is built as recommended and waits on your tests. Each decision is one place to change. No taste rule changed. The spec is in `skills/litt-md/system/components.md`, under "Media player".

## Built as recommended (Nick reviews after the tests)

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | Controls over the picture or under it? | **Under it**, in a bar on the same raised card, and they never hide. | Over the picture they need a scrim (a gradient, which is material) and still fail contrast somewhere in it, the same reason Media bans text on a photograph. Under it they never cover the work, and nothing has to fade in and out. |
| 2 | What sits on the picture? | **Only a round 56px disc before the first play**, solid surface-1 with the secondary edge. After that, nothing; a press on the picture plays and pauses. | It says "this is a video" on a poster, and a solid surface reads on any image. |
| 3 | Captions | **Under the picture**, at the small size in `--fg`, with two lines kept so the bar never moves between cues. The browser's own drawing over the picture stays off. | Captions are text, and text never sits on a picture in litt. |
| 4 | The rail | **The Slider's rail and thumb**: fg 12%, loaded at fg 24%, played in `--fg`, never the accent. The time under the pointer in the chart tooltip's look. | One slider look across the system, and P1. |
| 5 | Playhead motion | **One to one, painted each frame** (two CSS variables, no React render). Under reduced motion it **steps** a few times a second. | It is the media's state, not decoration, so it never eases; stepping is what a native player does and what the reduced-motion check accepts. |
| 6 | Speed | **A button that steps through `rates`**, not a menu. | Litt's Menu opens in a portal outside the player, which a full-screen player cannot show. |
| 7 | Volume | **Mute everywhere; a 64px rail only on a fine pointer in a wide box.** | A phone has hardware volume, and iOS lets no page set it. |
| 8 | Buffering | **The Button's spinner inside Play**, which stays Pause and pressable. | "A wait is the loading state of the button that started it", and the spinner is the one loop allowed. |
| 9 | Two players at once | **Starting one pauses the other.** | Two sounds at once is never what someone wants. |
| 10 | Demo media | **Made for the gallery with ffmpeg**: three field studies pushed in slowly over a synthesized chord (14.5 s), and "Tide", 42 s of shaped noise. About 1.3 MB in `gallery/public/media`. | Nothing anyone else owns, and real files so the page loads as a site would. `src/gallery/recordings.ts` says how they were made. |

## Questions for your tests

1. Is the card right around a video, or should a VideoPlayer sit bare in the page with the bar under the frame?
2. Should the disc stay on the picture whenever it is paused, or only before the first play (as built)?
3. Captions under the picture: do they read well enough at the small size, or should they step up to the body size?
4. Should the bar's Play be secondary (as built) or ghost like the rest?

## What else is missing

Compared with shadcn/ui and with what Nick's studio builds (Framer sites, case studies, web apps, agents), ranked by what each would unlock:

1. **Before and after**: a draggable split between two images, for redesign case studies. Small, and it pairs with Media and Lightbox.
2. **Diff view**: changed lines with + and − in the status tints, split or unified. The Agents group shows commands and code but not what an agent changed.
3. **Toggle and toolbar**: a pressed button (`aria-pressed`) and a `role="toolbar"` row with one tab stop and arrow keys. The player's bar needed both, and editors and view switches (grid or list) do too.
4. **Sortable list**: rows reordered by drag and by keys, then a board of columns on top of it.
5. **Marketing blocks**: a hero, pricing, testimonials, a logo wall and a footer. The blocks today are app screens and one case study; a studio that ships sites needs these most.
6. **Navigation menu**: a site header's dropdown panels (Work, Studio, Journal), which Header's links and Menu's actions don't cover.
7. **Comments on a picture**: pins on a screenshot with a thread each, for client review of a site.
8. **Smaller staples**: a copy button, a password field with show and hide, an inbox of notifications, an image cropper for avatar and cover uploads, an agenda calendar.

For the media player itself, next: chapters on the rail (the time scrubber's marks, named in the tooltip), a waveform for voice notes, picture in picture, and a transcript beside the video that follows the captions.
