/**
 * Rack's scenes (scene.ts): a music studio at work, the screens you touch all day. The colour is the music's, never the
 * chrome's: each track keeps one of the five clip colours (the data hues, R7) everywhere it shows, its name as a chip,
 * its sections, its level. Pastel clips with dark marks in light, deep clips with bright marks in dark. No accent fill
 * (the yellow lights a switch that is on, R6), so every switch here is neutral and every cap the plain cap.
 */
import { useState } from "react";
import { BarList } from "@/components/bar-list";
import { CurveEditor, type CubicBezier } from "@/components/curve-editor";
import { NumberField } from "@/components/number-field";
import { Segmented } from "@/components/segmented";
import { Sparkline } from "@/components/sparkline";
import { Switch } from "@/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag, type TagHue } from "@/components/tag";
import { Button } from "@/components/button";
import { TimelineBar, type TimelineBarPhase } from "@/components/timeline";
import { TimeScrubber, type TimeScrubberMark } from "@/components/time-scrubber";
import type { SystemScenes } from "./scene";

/* The set: five tracks, each with its clip colour, used by every scene so a colour means one track on the whole page. */

type Track = { id: string; name: string; hue: TagHue; volume: number; peak: number; state: "Armed" | "Muted" | null };
const TRACKS: Track[] = [
  { id: "drums", name: "Drums", hue: "amber", volume: -3, peak: -1.2, state: null },
  { id: "bass", name: "Bass", hue: "blue", volume: -6.5, peak: -4.8, state: null },
  { id: "perc", name: "Percussion", hue: "teal", volume: -9, peak: -9.5, state: "Muted" },
  { id: "synth", name: "Synth", hue: "violet", volume: -7.5, peak: -6.1, state: null },
  { id: "keys", name: "Keys", hue: "rose", volume: -4.5, peak: -3.4, state: "Armed" },
];
const MINUS = "−";
const dB = (v: number) => `${v < 0 ? MINUS : ""}${Math.abs(v).toFixed(1)} dB`;
const STATE_TAG = { Armed: "danger", Muted: "neutral" } as const;
const CLIPS: Record<string, number[]> = {
  drums: wave(0.2, 4, 40),
  bass: wave(1.1, 8, 40),
  perc: wave(2.3, 3, 40),
  synth: wave(3.4, 10, 40),
  keys: wave(4.6, 6, 40),
};

/* A waveform, made up but steady: a beat every `beat` steps, with quieter hits between, so each clip has a shape of its own. */
function wave(seed: number, beat: number, length = 64): number[] {
  return Array.from({ length }, (_, i) => {
    const hit = i % beat === 0 ? 1 : i % beat === Math.floor(beat / 2) ? 0.6 : 0;
    const body = Math.abs(Math.sin(i * 0.9 + seed)) ** 3 * 0.3 + Math.abs(Math.sin(i * 0.23 + seed * 2)) ** 2 * 0.18;
    return Math.round(Math.max(hit, body) * 100) / 100;
  });
}

/* Takes: what was just generated, each take a clip you can play. After the take list of a music tool. */

const TAKES = [
  { id: 1, values: wave(0.4, 8) },
  { id: 2, values: wave(1.7, 6) },
  { id: 3, values: wave(2.9, 8) },
];

function Takes() {
  const [playing, setPlaying] = useState<number | null>(null);
  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-small text-fg-subtle">Guitar · wah funk, clean · 4 bars</p>
      <ul aria-label="Takes" className="grid gap-2">
        {TAKES.map((t) => (
          <li key={t.id} className="grid grid-cols-[auto_1.5rem_minmax(0,1fr)] items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setPlaying(playing === t.id ? null : t.id)} aria-pressed={playing === t.id}>
              {playing === t.id ? "Stop" : "Play"}
            </Button>
            <span className="text-small text-fg tabular-nums">{t.id}</span>
            <Sparkline label={`Take ${t.id}, wah funk guitar`} values={t.values} min={0} max={1} hue="amber" height={40} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* A. Tracks: the mixer, each track named in its clip colour, its clip beside it. */

function Tracks() {
  return (
    <Table label="Tracks, Ghost town">
      <TableHeader>
        <TableRow>
          <TableHead>Track</TableHead>
          <TableHead>Clip</TableHead>
          <TableHead numeric>Volume</TableHead>
          <TableHead>State</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {TRACKS.map((t) => (
          <TableRow key={t.id}>
            <TableCell primary>
              <Tag hue={t.hue}>{t.name}</Tag>
            </TableCell>
            <TableCell>
              <div className="w-28">
                <Sparkline label={`${t.name} clip`} values={CLIPS[t.id]!} min={0} max={1} hue={t.hue} height={24} />
              </div>
            </TableCell>
            <TableCell numeric>{dB(t.volume)}</TableCell>
            <TableCell>{t.state ? <Tag status={STATE_TAG[t.state]}>{t.state}</Tag> : <span className="text-fg-subtle">None</span>}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* B. Arrangement: the song as coloured sections, and the playhead over it. */

const SONG: TimelineBarPhase[] = [
  { label: "Intro", hue: "teal", steps: [{ label: "Percussion alone", seconds: 15, status: "done" }] },
  { label: "Verse", hue: "blue", steps: [{ label: "Bass enters", seconds: 15, status: "done" }, { label: "Keys answer", seconds: 15, status: "done" }] },
  { label: "Drop", hue: "amber", steps: [{ label: "Drums, full", seconds: 30, status: "done" }] },
  { label: "Break", hue: "violet", steps: [{ label: "Synth pad", seconds: 15, status: "done" }] },
  { label: "Outro", hue: "rose", steps: [{ label: "Keys fade", seconds: 15, status: "done" }] },
];
const SECTIONS: TimeScrubberMark[] = [
  { at: 0, label: "Intro" },
  { at: 15, label: "Verse" },
  { at: 45, label: "Drop", tone: "warning" },
  { at: 75, label: "Break" },
  { at: 90, label: "Outro" },
];
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Arrangement() {
  return (
    <div className="grid min-w-0 gap-5">
      <TimelineBar label="Ghost town" phases={SONG} />
      <TimeScrubber label="Playhead" min={0} max={105} step={1} majorEvery={15} defaultValue={45} marks={SECTIONS} formatValue={clock} />
    </div>
  );
}

/* C. Levels: each track's peak, in its own colour. Closer to 0 dB is louder. */

function Levels() {
  return (
    <BarList
      label="Peak level by track"
      items={TRACKS.map((t) => ({ label: t.name, value: Math.round((24 + t.peak) * 10) / 10, hue: t.hue }))}
      max={24}
      formatValue={(v) => dB(Math.round((v - 24) * 10) / 10)}
    />
  );
}

/* D. An effect: an echo on the keys, every value in reach. */

function Effect() {
  const [sync, setSync] = useState("eighth");
  const [pingPong, setPingPong] = useState(true);
  return (
    <div className="grid min-w-0 gap-4">
      <Segmented
        legend="Sync"
        showLegend
        value={sync}
        onValueChange={setSync}
        block
        options={[
          { value: "free", label: "Free" },
          { value: "eighth", label: "1/8" },
          { value: "quarter", label: "1/4" },
          { value: "half", label: "1/2" },
        ]}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-3">
        <NumberField label="Feedback" size="sm" defaultValue={0.42} min={0} max={1} step={0.01} format={{ style: "percent" }} />
        <NumberField label="Dry/wet" size="sm" defaultValue={0.3} min={0} max={1} step={0.01} format={{ style: "percent" }} />
        <NumberField label="Width" size="sm" defaultValue={1} min={0} max={1} step={0.05} format={{ style: "percent" }} />
      </div>
      <Switch label="Ping-pong" description="Each repeat answers from the other side." checked={pingPong} onCheckedChange={setPingPong} />
    </div>
  );
}

/* E. Automation: the filter's sweep into the drop, drawn by hand. */

function Automation() {
  const [curve, setCurve] = useState<CubicBezier>([0.6, 0, 0.9, 0.4]);
  return (
    <CurveEditor
      label="Filter sweep into the drop"
      help="Thirty seconds of cutoff, from closed to open."
      value={curve}
      onValueChange={setCurve}
      defaultMark={[0.42, 0, 0.58, 1]}
      height={200}
    />
  );
}

export const rack: SystemScenes = {
  scenes: [
    { id: "takes", title: "Takes", line: "What was just made, each take a clip: a block in its colour with its waveform in it.", Render: Takes },
    { id: "tracks", title: "Tracks", line: "Each track named in its clip colour with its clip beside it, its level in tabular figures, its state as a tag.", Render: Tracks },
    { id: "arrangement", title: "Arrangement", line: "The song as sections, each in the colour of the track that leads it, and the playhead that settles on them.", Render: Arrangement },
    { id: "levels", title: "Levels", line: "Every track's peak as a bar in the track's own colour.", Render: Levels },
    { id: "effect", title: "An effect", line: "An echo's values side by side, each a box you can set, and a switch that stays a key.", Render: Effect },
    { id: "automation", title: "Automation", line: "A filter's sweep into the drop, drawn with two handles.", Render: Automation },
  ],
  cover: "takes",
};
