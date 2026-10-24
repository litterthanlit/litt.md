import { AudioPlayer, VideoPlayer, type VideoPlayerProps } from "@/components/media-player";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { BLUE_HOUR } from "../plates";
import { REEL, REEL_CAPTIONS, REEL_LENGTH, REEL_POSTER, TIDE, TIDE_LENGTH } from "../recordings";

export const meta: PageMeta = {
  id: "media-player",
  title: "Media player",
  lede: "A video or a sound that someone plays.",
  order: 15.06,
  group: "Layout",
  verbs: ["press", "drag"],
  summary:
    "A video in a Media frame, or a sound under its title, with the controls in a bar under the picture, never over it. Nothing plays until someone presses Play. The playhead follows the media one to one with no easing, and steps under reduced motion; the time under the pointer fades in on the responsive tier and colors change on the instant tier. Captions show under the picture, and starting one player pauses the other.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["media-player"],
  exports: ["VideoPlayer", "AudioPlayer"],
  usage: `import { AudioPlayer, VideoPlayer } from "@/components/media-player";

// A video: the same file in two formats, best first, a poster and its captions.
<VideoPlayer
  label="The Halo walkthrough"
  src={[
    { src: "/work/halo/walkthrough.webm", type: "video/webm" },
    { src: "/work/halo/walkthrough.mp4", type: "video/mp4" },
  ]}
  poster="/work/halo/walkthrough.jpg"
  captions={{ src: "/work/halo/walkthrough.vtt", lang: "en", label: "English" }}
  caption="The Halo walkthrough, 2:40"
/>

// A sound, with a speed button for a long one.
<AudioPlayer title="Studio notes, episode 4" byline="Nick, 24 minutes" src="/notes/episode-4.mp3" rates={[1, 1.5, 2]} />

// A long page of videos: load nothing until a press, and say the length until then.
<VideoPlayer label="Northwind, the identity" src="/work/northwind/film.mp4" poster="/work/northwind/film.jpg" preload="none" duration={94} />`,
  use: [
    "A video that shows work moving: a site's walkthrough, a prototype, a launch film in a case study.",
    "A sound someone chooses to hear: a studio note, an interview, a sound study.",
    "Anything longer than a glance, where people need to pause, go back and find their place.",
  ],
  skip: [
    "A loop that only decorates. Nothing in litt moves on its own; show a still in a Media frame instead.",
    "A short animation that explains a control. Draw it with the components and their motion, or show a still.",
    "Background sound. Nothing plays without being asked.",
    "A gallery of stills. That is Media, a Carousel or a Lightbox.",
  ],
  keyboard: [
    [["Tab"], "Moves through Play, the rail and the buttons."],
    [["Space", "K"], "Plays and pauses. Space on a button presses that button instead."],
    [["←", "→"], "Moves 5 seconds back or on."],
    [["J", "L"], "Moves 10 seconds back or on."],
    [["Home", "End"], "Goes to the start or the end."],
    [["Page Up", "Page Down"], "On the rail, moves a tenth of the length."],
    [["M"], "Mutes and unmutes."],
    [["C"], "Turns the captions on and off, when there are some."],
    [["F"], "Full screen, for a video."],
    [["<", ">"], "Slower or faster, when there is a Speed button."],
  ],
  a11y: [
    "The player is a group named by the label (a video) or the title (a sound). Every control is a real button with a name: Play, Pause or Play again, Captions, Speed, Mute and Full screen.",
    "Captions, Mute and Full screen are toggles, read as pressed or not pressed, and their marks change too, so the state never rests on color.",
    "The rail is a slider named Seek. Its value says the time in words, such as \"1 minute 12 seconds of 3 minutes\", and it changes once a second, never on every frame.",
    "Give a video captions for what is heard: speech, and the sounds that matter. They show under the picture, at the small size in the foreground color, so they never sit on it.",
    "A press on the picture plays and pauses, as a shortcut for the Play button, so it is not a second tab stop.",
    "Nothing plays on its own, and under reduced motion the playhead steps a few times a second instead of gliding.",
  ],
};

/* The reel, as a site would load it: the length first, the rest on a press. */
function ReelDemo() {
  return (
    <VideoPlayer
      label="Field studies, a reel"
      src={REEL}
      poster={REEL_POSTER.src}
      posterSrcSet={REEL_POSTER.srcSet}
      sizes="(min-width: 48rem) 40rem, 100vw"
      captions={REEL_CAPTIONS}
      caption="Field studies: Open water, Dusk tide and Silk, 2026"
      className="w-full max-w-2xl"
    />
  );
}

function SoundDemo() {
  return (
    <div className="grid w-full max-w-lg gap-6">
      <AudioPlayer title="Tide" byline="A sound study, 2026" src={TIDE} cover={BLUE_HOUR.src} rates={[1, 1.5, 2]} />
      <AudioPlayer title="Tide, from a page of many" byline="Loads nothing until you press Play" src={TIDE} preload="none" duration={TIDE_LENGTH} />
    </div>
  );
}

/* A video that cannot be decoded, so the failed state shows without a request; and the reel in a box as narrow as a phone. */
const BROKEN = "data:video/mp4;base64,AAAA";

function StatesDemo() {
  return (
    <div className="grid w-full max-w-3xl items-start gap-6 sm:grid-cols-2">
      <VideoPlayer label="The Halo walkthrough" src={BROKEN} caption="Failed" />
      <VideoPlayer
        label="Field studies, a reel"
        src={REEL}
        poster={REEL_POSTER.src}
        posterSrcSet={REEL_POSTER.srcSet}
        sizes="(min-width: 40rem) 20rem, 100vw"
        preload="none"
        duration={REEL_LENGTH}
        caption="In a narrow box"
        className="max-w-xs"
      />
    </div>
  );
}

/* Try it shows an address of your own in its code; the stage plays the gallery's reel. */
function TryVideo(props: VideoPlayerProps) {
  return <VideoPlayer {...props} src={REEL} poster={REEL_POSTER.src} posterSrcSet={REEL_POSTER.srcSet} sizes="28rem" captions={REEL_CAPTIONS} />;
}

function Tile() {
  return (
    <VideoPlayer
      label="Field studies, a reel"
      src={REEL}
      poster={REEL_POSTER.src}
      posterSrcSet={REEL_POSTER.srcSet}
      sizes="32rem"
      preload="none"
      duration={REEL_LENGTH}
      className="w-full max-w-md"
    />
  );
}

export default function MediaPlayerPage() {
  return (
    <Page meta={meta} docs={docs} tile={<Tile />}>
      <Stage
        title="A video"
        tier="instant"
        code="ReelDemo"
        caption="Press the picture or Play. The controls sit in a bar under the picture, never over it, so they need no scrim, never hide and never cover the work. The playhead follows the video with no easing, and the time under the pointer fades in above the rail. Turn the captions on and they show under the picture too, with room for two lines so the bar does not move between them."
      >
        <ReelDemo />
      </Stage>

      <Stage
        title="A sound"
        tier="instant"
        code="SoundDemo"
        caption="The same bar under a title, on the same raised card. The first one steps through three speeds; the second loads nothing until you press Play, and says the length it was given until then. Start one while the other plays and the other one pauses."
      >
        <SoundDemo />
      </Stage>

      <Stage
        title="Failing, and narrow"
        tier="instant"
        align="start"
        code="StatesDemo"
        caption="A file that doesn't load keeps the frame's size and says so beside a mark, and the controls go quiet. In a box under 28rem the rail takes a row of its own above the buttons, and the volume rail goes, as it does on any touch screen, which has the device's own."
      >
        <StatesDemo />
      </Stage>

      <TryIt
        of="VideoPlayer"
        component={TryVideo}
        props={{ src: "/work/halo/walkthrough.mp4", label: "The Halo walkthrough", caption: "The Halo walkthrough, 2026", className: "w-full max-w-md" }}
        controls={[{ name: "ratio", options: ["16/9", "8/5", "4/3", "1/1", "4/5"] }, "caption", "defaultCaptions", "preload"]}
      />
    </Page>
  );
}
