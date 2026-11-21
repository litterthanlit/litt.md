import { ClipLauncher, type ClipTrack } from "@/components/clip-launcher";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "clip-launcher",
  title: "Clip launcher",
  lede: "A color-coded Session View clip and scene grid for Rack.",
  order: 9.09,
  group: "Tools",
  verbs: ["select", "press"],
  worlds: ["rack"],
  summary:
    "Ableton Live's Session View clip launcher in Rack's materials: quiet grey module chrome with 1px outlines, and the color belongs to the music: each track keeps one of Rack's five clip colors (orange, blue, cyan, purple, green) across its header and slots. Click any clip to launch or stop it on the frame, or trigger an entire scene across all tracks from the Master column. It belongs to Rack.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["clip-launcher", "button"],
  exports: ["ClipLauncher"],
  usage: `import { ClipLauncher } from "@/components/clip-launcher";

<ClipLauncher title="Ghost town · Session" bpm={124} />`,
  use: [
    "Live clip triggering, scene launches, and multi-track session grids in DAWs, sequencers, and creative tools under Rack.",
    "Color-coding tracks so every clip in a column shares one unmistakable hue without tinting the chrome.",
  ],
  skip: [
    "Another world's page. ClipLauncher relies on Rack's five pastel/deep clip tints and instant-cut chrome; it needs data-material=\"rack\" on <html>.",
    "A plain list of selectable cards. Use CardPicker.",
    "A tabular data sheet. Use Table.",
  ],
  keyboard: [
    [["Tab"], "Moves to Stop all, then into the session grid as one stop, on the cell focused last, then out of it."],
    [["←", "→", "↑", "↓"], "Moves one cell at a time across the clips, the empty slots and the Master column, without wrapping."],
    [["Home", "End"], "Goes to the first or last cell of the scene's row. With Ctrl or ⌘, to the first or last cell of the grid."],
    [["Enter", "Space"], "Launches or stops the focused clip, stops the track from an empty slot, or fires the scene from Master."],
  ],
  a11y: [
    "The session is a grid: its first row names the tracks and Master as column headers, and each scene is a row. It is one tab stop, and the arrows move in it.",
    "Every clip and scene button is a native button with aria-pressed and a descriptive aria-label naming the track, clip, bar length, and live state.",
    "Playing state is never color alone: the clip icon flips from play triangle to stop square and the header live count updates.",
    "Every launch and stop announces once in a polite live status region.",
  ],
};

const COMPACT_TRACKS: ClipTrack[] = [
  {
    id: "drums",
    name: "Drums",
    hue: "amber",
    clips: [
      { id: "cd1", name: "Hat pulse", bars: "2" },
      { id: "cd2", name: "Full kit", bars: "4" },
      { id: "cd3", name: "Half-time", bars: "2" },
    ],
  },
  {
    id: "bass",
    name: "Bass",
    hue: "blue",
    clips: [
      { id: "cb1", name: "Sub pulse", bars: "4" },
      { id: "cb2", name: "Acid line", bars: "4" },
      null,
    ],
  },
  {
    id: "synth",
    name: "Synth",
    hue: "violet",
    clips: [
      { id: "cs1", name: "Air pad", bars: "8" },
      { id: "cs2", name: "Lead stab", bars: "4" },
      { id: "cs3", name: "Swell", bars: "4" },
    ],
  },
];

function SessionGridDemo() {
  return <ClipLauncher title="Ghost town · Session" bpm={124} className="max-w-3xl" />;
}

function CompactLiveSetDemo() {
  return (
    <ClipLauncher
      title="Warmup set"
      bpm={118}
      scenes={["Loop A", "Peak", "Break"]}
      tracks={COMPACT_TRACKS}
      defaultPlaying={{ drums: "cd2", bass: "cb2", synth: "cs2" }}
      className="max-w-2xl"
    />
  );
}

export default function ClipLauncherPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={
        <ClipLauncher
          title="Ghost town"
          bpm={124}
          scenes={["Intro", "Drop", "Break"]}
          tracks={COMPACT_TRACKS}
          defaultPlaying={{ drums: "cd2", bass: "cb2", synth: "cs2" }}
          className="max-w-lg"
        />
      }
    >
      <Stage
        title="Session View"
        tier="instant"
        size="lg"
        code="SessionGridDemo"
        caption="Click any colored clip to launch it on the frame (stopping any other clip in its track), or press Intro, Verse, Drop or Break in the Master column to fire a whole row at once."
      >
        <SessionGridDemo />
      </Stage>
      <Stage
        title="Compact live set"
        tier="instant"
        code="CompactLiveSetDemo"
        caption="Pass custom tracks and scenes with any of Rack's five clip hues (amber, blue, teal, violet, rose). Empty slots act as per-track stop buttons."
      >
        <CompactLiveSetDemo />
      </Stage>
      <TryIt
        of="ClipLauncher"
        component={ClipLauncher}
        props={{ title: "Ghost town · Session", bpm: 124, className: "max-w-3xl" }}
        controls={[
          { name: "title", type: "text" },
          { name: "bpm", type: "number" },
        ]}
      />
    </Page>
  );
}
