/**
 * Rack's scenes (scene.ts): a music studio at work, the screens you touch all day. An effect's values, the mixer, the
 * arrangement's playhead, an automation curve and a filter you play with one hand. Flat panels, 1px outlines and small
 * values; no accent fill anywhere, so no lit toggles (they light in the yellow, R6): every switch here is neutral and
 * every cap is the plain cap.
 */
import { useState } from "react";
import { CurveEditor, type CubicBezier } from "@/components/curve-editor";
import { NumberField } from "@/components/number-field";
import { Pad, type PadValue } from "@/components/pad";
import { Segmented } from "@/components/segmented";
import { Switch } from "@/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag } from "@/components/tag";
import { TimeScrubber, type TimeScrubberMark } from "@/components/time-scrubber";
import type { SystemScenes } from "./scene";

/* A. An effect: an echo on the vocal, every value in reach. */

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
      <Switch
        label="Ping-pong"
        description="Each repeat answers from the other side."
        checked={pingPong}
        onCheckedChange={setPingPong}
      />
    </div>
  );
}

/* B. The mixer: every track's level, pan and state, in tabular figures. */

type Track = { id: string; name: string; volume: number; pan: number; state: "Armed" | "Muted" | null };
const TRACKS: Track[] = [
  { id: "t1", name: "Kick", volume: -3, pan: 0, state: null },
  { id: "t2", name: "Bass", volume: -6.5, pan: 0, state: null },
  { id: "t3", name: "Keys", volume: -9, pan: -18, state: "Muted" },
  { id: "t4", name: "Vocal", volume: -4.5, pan: 4, state: "Armed" },
  { id: "t5", name: "Return A", volume: -12, pan: 0, state: null },
];
const MINUS = "−";
const dB = (v: number) => `${v < 0 ? MINUS : ""}${Math.abs(v).toFixed(1)} dB`;
const panText = (p: number) => (p === 0 ? "C" : `${Math.abs(p)}${p < 0 ? "L" : "R"}`);
const STATE_TAG = { Armed: "danger", Muted: "neutral" } as const;

function Mixer() {
  return (
    <Table label="Mixer, Night bus">
      <TableHeader>
        <TableRow>
          <TableHead>Track</TableHead>
          <TableHead numeric>Volume</TableHead>
          <TableHead numeric>Pan</TableHead>
          <TableHead>State</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {TRACKS.map((t) => (
          <TableRow key={t.id}>
            <TableCell primary>{t.name}</TableCell>
            <TableCell numeric>{dB(t.volume)}</TableCell>
            <TableCell numeric>{panText(t.pan)}</TableCell>
            <TableCell>{t.state ? <Tag status={STATE_TAG[t.state]}>{t.state}</Tag> : <span className="text-fg-subtle">None</span>}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* C. The arrangement: a playhead over 64 bars, its sections as marks. */

const SECTIONS: TimeScrubberMark[] = [
  { at: 1, label: "Intro" },
  { at: 17, label: "Verse" },
  { at: 33, label: "Drop", tone: "warning" },
  { at: 49, label: "Break" },
  { at: 57, label: "Outro" },
];

function Arrangement() {
  return (
    <TimeScrubber
      label="Playhead"
      min={1}
      max={64}
      step={1}
      majorEvery={8}
      defaultValue={33}
      marks={SECTIONS}
      formatValue={(v) => `Bar ${v}`}
    />
  );
}

/* D. Automation: the filter's sweep into the drop, drawn by hand. */

function Automation() {
  const [curve, setCurve] = useState<CubicBezier>([0.6, 0, 0.9, 0.4]);
  return (
    <CurveEditor
      label="Filter sweep into the drop"
      help="Eight bars of cutoff, from closed to open."
      value={curve}
      onValueChange={setCurve}
      defaultMark={[0.42, 0, 0.58, 1]}
      height={200}
    />
  );
}

/* E. A filter you play: cutoff across, resonance up, one hand on the pad. */

const hz = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${v} Hz`);

function Filter() {
  const [value, setValue] = useState<PadValue>({ x: 1200, y: 30 });
  return (
    <Pad
      label="Filter"
      help="Drag across for the cutoff and up for the resonance."
      x={{ label: "Cutoff", min: 100, max: 8000, step: 100, minLabel: "Dark", maxLabel: "Bright" }}
      y={{ label: "Resonance", min: 0, max: 100, step: 1, minLabel: "Soft", maxLabel: "Sharp" }}
      value={value}
      onValueChange={setValue}
      defaultMark={{ x: 4000, y: 20 }}
      formatValue={(v) => `${hz(v.x)}, resonance ${v.y}%`}
      height={200}
    />
  );
}

export const rack: SystemScenes = {
  scenes: [
    { id: "effect", title: "An effect", line: "An echo's values side by side, each a box you can set, and a switch that stays a key.", Render: Effect },
    { id: "mixer", title: "The mixer", line: "Every track's level and pan in tabular figures, its state as a tag.", Render: Mixer },
    { id: "arrangement", title: "Arrangement", line: "The playhead over 64 bars, the sections as marks it settles on.", Render: Arrangement },
    { id: "automation", title: "Automation", line: "A filter's sweep into the drop, drawn with two handles.", Render: Automation },
    { id: "filter", title: "A filter", line: "Cutoff across and resonance up on one pad, played with one hand.", Render: Filter },
  ],
  cover: "effect",
};
