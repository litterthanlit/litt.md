/**
 * Heat's scenes (scene.ts): a racing game's front end and its live timing, the screens that keep score. A screen of
 * Heat is a run of hard slabs on asphalt: the standings, the needle, the garage, the splits. Each team keeps one data
 * hue (R7) everywhere it shows, its name as a chip and its bar. No accent fill (the lime lights what is selected, R6),
 * so every switch here is neutral.
 */
import { useState } from "react";
import { BarList } from "@/components/bar-list";
import { Gauge } from "@/components/gauge";
import { Segmented } from "@/components/segmented";
import { Slider } from "@/components/slider";
import { Sparkline } from "@/components/sparkline";
import { Stat, StatGroup } from "@/components/stat";
import { Switch } from "@/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag, type TagHue } from "@/components/tag";
import type { SystemScenes } from "./scene";

/* The grid: five drivers, each in a team colour used by every scene, so a colour means one team on the whole page. */

type Driver = { id: string; name: string; team: string; hue: TagHue; gap: number | null; best: number; state: "Pit" | "Out" | null };
const GRID: Driver[] = [
  { id: "vale", name: "Rin Vale", team: "Northline", hue: "blue", gap: null, best: 71.402, state: null },
  { id: "osei", name: "Kofi Osei", team: "Kestrel", hue: "amber", gap: 1.218, best: 71.655, state: null },
  { id: "marr", name: "Ida Marr", team: "Halcyon", hue: "teal", gap: 3.904, best: 71.981, state: "Pit" },
  { id: "dunn", name: "Theo Dunn", team: "Vantage", hue: "violet", gap: 6.37, best: 72.118, state: null },
  { id: "sato", name: "Mei Sato", team: "Redline", hue: "rose", gap: null, best: 72.6, state: "Out" },
];
const lap = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, "0")}`;
const STATE_TAG = { Pit: "warning", Out: "danger" } as const;

/* A. Standings: the order, the gap to the leader, the best lap, and who is in the pit or out. */

function Standings() {
  return (
    <Table label="Standings, lap 14 of 20">
      <TableHeader>
        <TableRow>
          <TableHead numeric>Pos</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead numeric>Gap</TableHead>
          <TableHead numeric>Best lap</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {GRID.map((d, i) => (
          <TableRow key={d.id}>
            <TableCell numeric>{d.state === "Out" ? "–" : i + 1}</TableCell>
            <TableCell primary>
              <span className="flex min-w-0 items-center gap-2">
                <Tag hue={d.hue}>{d.team}</Tag>
                <span className="truncate">{d.name}</span>
                {d.state ? <Tag status={STATE_TAG[d.state]}>{d.state}</Tag> : null}
              </span>
            </TableCell>
            <TableCell numeric>{d.state === "Out" ? "–" : d.gap === null ? "Leader" : `+${d.gap.toFixed(3)}`}</TableCell>
            <TableCell numeric>{lap(d.best)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* B. Telemetry: the needle, and the figures that go with it. */

function Telemetry() {
  return (
    <div className="grid min-w-0 gap-5">
      <Gauge label="Speed" value={248} min={0} max={320} valueText="248 km/h" figure="248" caption="km/h, sixth gear" hue="blue" size={240} className="mx-auto" />
      <StatGroup>
        <Stat label="Lap" value="14" unit="/ 20" />
        <Stat label="Last lap" value={lap(71.402)} delta="Best of the race" tone="good" />
      </StatGroup>
    </div>
  );
}

/* C. Garage: the class you race in and the car's tune, each value a bar you set. */

const pct = (v: number) => `${v}%`;

function Garage() {
  const [tier, setTier] = useState("sport");
  const [assist, setAssist] = useState(false);
  return (
    <div className="grid min-w-0 gap-4">
      <Segmented
        legend="Class"
        showLegend
        value={tier}
        onValueChange={setTier}
        block
        options={[
          { value: "street", label: "Street" },
          { value: "sport", label: "Sport" },
          { value: "exotic", label: "Exotic" },
        ]}
      />
      <div className="grid gap-1">
        <Slider label="Grip" defaultValue={64} min={0} max={100} home={50} formatValue={pct} />
        <Slider label="Top speed" defaultValue={78} min={0} max={100} home={50} formatValue={pct} />
        <Slider label="Boost" defaultValue={40} min={0} max={100} formatValue={pct} />
      </div>
      <Switch label="Driving assist" description="Steadies the car out of a slide." checked={assist} onCheckedChange={setAssist} />
    </div>
  );
}

/* D. Splits: each team's best sector against the fastest, and the leader's laps as a trend. */

const SECTOR = 23.8;
const LAPS = [73.1, 72.4, 72.2, 71.9, 72.0, 71.8, 71.7, 71.9, 71.6, 71.5, 71.7, 71.5, 71.45, 71.402];

function Splits() {
  return (
    <div className="grid min-w-0 gap-5">
      <BarList
        label="Best second sector by team, seconds off the fastest"
        items={GRID.map((d, i) => ({ label: d.team, value: Math.round((0.15 + i * 0.21) * 1000) / 1000, hue: d.hue }))}
        max={1.2}
        formatValue={(v) => `+${v.toFixed(3)} s`}
      />
      <div className="grid gap-2">
        <p className="text-small text-fg-subtle">Rin Vale's laps, fastest last · sector record {SECTOR.toFixed(1)} s</p>
        <Sparkline label="Rin Vale's lap times, 14 laps, falling from 1:13.1 to 1:11.4" values={LAPS} min={71} max={73.5} hue="blue" height={40} />
      </div>
    </div>
  );
}

export const heat: SystemScenes = {
  scenes: [
    { id: "standings", title: "Standings", line: "The order on hard slabs: each team in its own colour, the gaps in tabular figures, the pit and the retired as tags.", Render: Standings },
    { id: "telemetry", title: "Telemetry", line: "The needle and the figures beside it, read at a glance.", Render: Telemetry },
    { id: "garage", title: "Garage", line: "A class to race in and a tune you set, every key standing on its ledge until you press it down onto it.", Render: Garage },
    { id: "splits", title: "Splits", line: "Each team's best sector against the fastest, and the leader's laps falling.", Render: Splits },
  ],
  cover: "standings",
};
