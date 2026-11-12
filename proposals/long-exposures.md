# Long exposures: moving pictures for Flat

Written 2026-11-11 for Nick, rewritten 2026-11-12. Nick, on Flat: "can you add some japanese moving gradients to the visuals in flat instead of the current ones". Asked how they may move, since R2 and R4 keep gradients and unprompted motion still, Nick chose an exception for pictures: a picture is content, like a video, so it may move slowly on its own, still under reduced motion and while off screen.

Nick's answers so far, all 2026-11-11:

- On the first candidates: "Take inspo from my components repo". That repo (`litterthanlit/components`) has Gradient Keys, whose screen shows a long exposure: "a camera swung through foliage with the shutter open, in a traditional Japanese palette".
- On the long exposure on the canvas: "I like this! let's make it stronger tho and more diverse".
- On the wall of twelve palettes: "I only like long exposure, especially the ones of the bottom, if we could variate from them would be sick." The bottom row was Beni, Yamabuki, Yūyake, Ajisai, Momiji and Hotaru.

This is a proposal, not a build. Flat's screens keep their pictures and the profile keeps its rules until Nick decides. Everything here is live on the language canvas (`#canvas`, out to the left), in `gallery/src/canvas/streaks.tsx` and the `streaks-*.ts` files beside it.

## Tried and dropped

Nick did not pick these, and they are off the canvas:

- **Bokashi skies**: a woodblock print's gradation, two bands and sometimes a red sun, drifting by transform.
- **Suminagashi**: ink dropped on water and combed into rings.
- **Kasumi**: bands of mist sliding over two ranges of hills.
- **Komorebi**: out-of-focus discs of light over dark foliage.
- **Ame**: fine rain falling at a slant, after a woodblock print.

## What a long exposure is

Nick's shader from Gradient Keys. Streaks fan from a root outside the frame, the fan turns slowly while the streaks flow along it, soft masses of light and dark drift behind, and thin glints pick out a few blades, in five stops from dark to light, mixed in linear light under a fine grain. One number, strength, gives it more presence: a steeper tone curve, a deeper darkest stop, richer middle stops and brighter glints. At strength 0, in the first cut, it is Gradient Keys' picture exactly.

It varies three ways, and every variation is still the same long exposure.

**Palettes.** Twenty-four, each five stops dark to light. The bold ones are drawn to the six Nick liked: a dark that is nearly black, a middle at full chroma, a light that is tinted, never white; in a journey, a second hue that arrives suddenly.

| Palette | Group | What it is |
|---|---|---|
| Beni 紅 | pigment | safflower crimson |
| Shu 朱 | pigment | vermilion, the red of a shrine gate |
| Kaki 柿 | pigment | persimmon: a ripe orange |
| Yamabuki 山吹 | pigment | kerria gold |
| Moegi 萌黄 | pigment | spring green, the first leaves |
| Hisui 翡翠 | pigment | jade |
| Ruri 瑠璃 | pigment | lapis lazuli |
| Gunjō 群青 | pigment | ultramarine, ground from azurite |
| Murasaki 紫 | pigment | purple, dyed from gromwell root |
| Botan 牡丹 | pigment | peony: a deep magenta |
| Yūyake 夕焼け | journey | sunset: indigo, violet, coral, gold; it went mostly pale before, so it opens on a balanced frame and its lights are deeper |
| Ajisai 紫陽花 | journey | hydrangea: blue, violet, pink; retuned as Yūyake was |
| Momiji 紅葉 | journey | autumn maples: deep green, rust, gold |
| Hotaru 蛍 | journey | fireflies: night blue to a yellow-green glow |
| Yozakura 夜桜 | journey | cherry blossom at night: plum dark, then pink |
| Kingyo 金魚 | journey | goldfish: dark green water, then red and orange |
| Kujaku 孔雀 | journey | peacock: deep blue, teal, green, then gold |
| Shinkai 深海 | journey | the deep sea: black, blue, a cyan glow |
| Hanabi 花火 | journey | fireworks: night blue, magenta, then gold |
| Wakatake 若竹 | soft | young bamboo; from Gradient Keys |
| Ai 藍 | soft | indigo, fading to asagi; from Gradient Keys |
| Sakura 桜 | soft | cherry, fading to shell white; from Gradient Keys |
| Sumi 墨 | soft | ink, from full to paper |
| Fuji 藤 | soft | wisteria |

**Pairs.** One palette at the fan's root and another at its tips. A new palette already runs out along the streaks, root first; a pair holds that run partway, over a wide soft seam that sits inside the frame at 4 to 5 and at 2.4 to 1. A new pair still sweeps in over 600ms. Four melt: Beni into Yamabuki, Momiji into Beni, Moegi into Yamabuki, Ajisai into Yozakura. Four clash: Ruri into Beni, Gunjō into Yamabuki, Murasaki into Kaki, Hisui into Botan.

**Cuts.** The same shader, framed differently: where the root sits, how fine and how long the streaks are, which way and how fast the fan turns. A new cut dissolves in over 600ms.

| Cut | What the camera did |
|---|---|
| Pan | Gradient Keys' own numbers: swung up and across, from below left |
| Sweep | swung level, from far to the left |
| Fall | dropped straight down, from far above |
| Burst | spun from just past the top right corner |
| Close | nearer the leaves: fewer, broader streaks |

On the canvas: "Long exposure · as in Gradient Keys" (the baseline, unchanged), "twenty-four palettes", "eight pairs", "five cuts", and "Flat's hero, today and as a long exposure", with a cut, a palette, a second palette and the strength to pick.

## What moving costs

- **Two rules change.** The wording below is proposed, not applied.
  - R2, after "glow, grain and gradients never animate, pulse or follow the cursor": "A picture is content, not material: a picture that is itself a gradient (Flat's long exposures) may stream, grain included."
  - R4, after the list of motion that fails: "One exception: a picture may move on its own. It moves slowly; it is still under reduced motion and while off screen; it can be paused; and it is never a control, never a state, and never the view's one expressive moment."
- **A pause control is required.** WCAG 2.2.2 asks that anything moving on its own for more than five seconds can be paused, stopped or hidden. On the canvas each piece has its own Pause. On a real screen the control needs a place.
- **The scenes' contract changes.** `gallery/src/gallery/systems/scene.ts` says a scene "moves nothing on its own (R4)"; a Flat scene with a long exposure needs the same exception written there.
- **The lightbox takes a still.** Carousel, Lightbox and the cards take an image address, not a live layer, so a picture opened large is a still of itself.
- **The checks.** `test:motion` runs under reduced motion, where a picture is still, so it stays green. Nothing in CI fails when something moves with motion allowed.
- **It is WebGL, in one shared context.** A single hidden WebGL canvas draws every picture on a page in turn and copies each into its own 2D canvas, so a wall of forty-three costs one context, where a browser allows about sixteen. Each picture draws at its size on screen. Without WebGL, or if the context is lost, each picture is a still gradient of its palette.
- **Nothing flashes.** Over twenty seconds at resting speed, in Beni, Hanabi, Kingyo and Shinkai, Gunjō into Yamabuki, and every cut, no quarter of the frame changes its brightness by more than about 5% in a third of a second (WCAG 2.3.1 draws the line at 10%). Under a hand, quickened as Gradient Keys does, a quarter can change by up to 14%: one more reason a picture should not answer a hand.
- **Warm palettes are for Flat only.** Beni, Shu, Kaki, Yamabuki, Yūyake, Momiji and Kingyo are warm. Flat's accent is the ink, so a warm picture there is only a picture; in Device (orange) or Press (blue) a picture near the accent would read as a signal.
- **Hex values.** A shader takes numbers, so the palettes are hex, marked as candidates. Picked ones would move into `tokens.css` as picture tokens.

## Decisions

| # | Question | Suggested | Decision |
|---|---|---|---|
| 1 | Skies or long exposures? | | Long exposures. "I only like long exposure", 2026-11-11 |
| 2 | Which fields? | | The long exposure only. "I only like long exposure", 2026-11-11 |
| 3 | Soft or bold palettes? | | The bold ones. "especially the ones of the bottom", 2026-11-11 |
| 4 | Which palettes, pairs and cuts go in? | Palettes: Beni, Yamabuki, Yūyake, Ajisai, Momiji and Hotaru, with Moegi, Gunjō, Botan and Kingyo, the strongest of the new ones. Pairs: Beni into Yamabuki and Gunjō into Yamabuki, one melt and one clash. Cuts: Pan for the hero; Sweep and Close for wide frames and covers, where they sit calmest behind text. | |
| 5 | What strength does Flat ship at? | 1 for a hero or a cover, where the picture is the point; about 0.5 behind text. The strength is one number per picture, so both can ship. | |
| 6 | Does a picture answer a hand? | No: it only streams. Under a hand it quickens to near the flash line. Try Follow the hand on the hero before deciding. | |
| 7 | The R2 and R4 wording above | Approve or edit. It goes into `taste/profile.md` through `workflows/evolve.md`, as a `taste:` commit, only with Nick's yes. | |
| 8 | Where does the pause control live? | One small icon button on each moving picture, shown on hover and on keyboard focus and always reachable by keyboard, saying "Pause the picture" or "Play the picture". | |
| 9 | Do the palettes become picture tokens? | Yes, the picked ones, so both themes and the registry can carry them. | |
| 10 | Is a picture a part of its own, only in Flat? | Yes: Flat has no part of its own yet, and a moving picture is wrong in Press and Device. It would be Flat's first Only here. | |

## After the decision

A later plan ships the picked palettes, pairs and cuts into Flat as a real part: picture tokens in `tokens.css`, the rule wording in the profile and in `foundations.md`, the scenes' contract, a pause control on each picture, the shared renderer under it, a changelog line, and the canvas pieces removed.
