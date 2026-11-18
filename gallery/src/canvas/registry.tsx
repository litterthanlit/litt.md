/**
 * What is on the language canvas: one entry per item, with a stable id, a readable name (the one that copies), its
 * size and where it starts. Add, rename or remove an item here; the canvas (canvas.tsx) never needs to change for it.
 * Every preview uses made-up data and makes no requests.
 *
 * Each "today" item is the shipping component; each item beside it is the same content in the press material,
 * from experiments.tsx. The settings panels put the whole language side by side, and the last one adds Blue 4.
 */
import { useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Checkbox, CheckboxGroup } from "@/components/checkbox";
import { TextField } from "@/components/input";
import { NumberField } from "@/components/number-field";
import { Progress } from "@/components/progress";
import { Segmented } from "@/components/segmented";
import { SlideConfirm } from "@/components/slide-confirm";
import { Slider } from "@/components/slider";
import { Switch } from "@/components/switch";
import { AccentBlues } from "./blues";
import { PICK, accentVars } from "./accents";
import { CaseStudy } from "@/blocks/case-study";
import { SCALES, ScaleFrame } from "./scale";
import { LOOKS } from "./flat-look-data";
import { FlatLookFrame } from "./flat-look";
import { FlatHand } from "./flat-look-hand";
import { FlatBounceExpressive, FlatBounceResponsive } from "./flat-bounce";
import { PressColumnPreview, type PressColumn } from "./press";
import { PressCallPreview, type PressCallId } from "./press-calls";
import { PressRound2Preview, type PressRound2Id } from "./press-round2";
import { FlatCallPreview, FlatTogetherPreview, type FlatCallId } from "./flat-calls";
import { HypherDifferences, HypherTakePreview, type HypherTake } from "./flat-hypher";
import { FlatIconComposition, FlatIconPairs, FlatIconSet, FlatIconsInUse } from "./flat-icons";
import { NoUiPreview, type NoUiColumn, type NoUiScreen } from "./no-ui";
import { StreakCuts, StreakHero, StreakPairs, StreakPalettes, StreakPrints } from "./streaks";
import {
  BlockButton,
  ButtonBlocks,
  CheckBlocks,
  InputWell,
  InputWells,
  MaterialDepths,
  NumberTray,
  ProgressSlabs,
  SegmentedTray,
  SegmentedTrayDemo,
  SlideSlab,
} from "./experiments";

export type CanvasItem = {
  /** Stable: the saved layout keys positions by it. */
  id: string;
  /** Unique and readable: it is the item's label and what its label copies. */
  name: string;
  /** Where the item starts, in canvas px. */
  x: number;
  y: number;
  /** The preview's width and its least height, in px. */
  width: number;
  height: number;
  render: () => ReactNode;
};

/* ---------------------------------------------------------------- today, for the pairs */

function ButtonsToday() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Publish</Button>
      <Button>Preview</Button>
      <Button variant="ghost">Cancel</Button>
    </div>
  );
}

function SegmentedToday() {
  const [view, setView] = useState<"list" | "board" | "calendar">("board");
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  return (
    <div className="grid justify-items-start gap-4">
      <Segmented legend="View" value={view} onValueChange={setView} options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }, { value: "calendar", label: "Calendar" }]} />
      <Segmented legend="Range" value={range} onValueChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }]} />
    </div>
  );
}

function CheckboxesToday() {
  return (
    <CheckboxGroup legend="Include in the export">
      <Checkbox label="Source files" defaultChecked />
      <Checkbox label="Fonts" description="Only the ones the site uses." defaultChecked />
      <Checkbox label="Analytics history" />
    </CheckboxGroup>
  );
}

function InputsToday() {
  return (
    <div className="grid gap-4">
      <TextField label="Project name" defaultValue="Atelier Nord" />
      <TextField label="Domain" placeholder="atelier.studio" />
    </div>
  );
}

function ProgressToday() {
  return (
    <div className="grid gap-4">
      <Progress label="Uploading 12 images" value={32} />
      <Progress label="Building atelier.studio" value={64} />
      <Progress label="Exported" value={100} status="done" />
    </div>
  );
}

/* ---------------------------------------------------------------- the whole language, in one panel */

const speed = (v: number) => `${v.toFixed(1)}x`;

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="grid gap-6">
      <div className="grid gap-1">
        <h2 className="text-small font-title text-fg">Workspace</h2>
        <p className="text-small text-fg-subtle">How Atelier Nord looks and behaves for the people you invite.</p>
      </div>
      {children}
    </section>
  );
}

function SettingsToday() {
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  return (
    <Panel title="Settings, today">
      <TextField label="Workspace name" defaultValue="Atelier Nord" />
      <Segmented legend="Theme" showLegend value={theme} onValueChange={setTheme} options={[{ value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
      <Switch align="end" label="Email me when a build finishes" defaultChecked />
      <Slider label="Animation speed" min={0.5} max={2} step={0.1} defaultValue={1} formatValue={speed} minLabel="Slower" maxLabel="Faster" />
      <div className="flex justify-end gap-3">
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Save</Button>
      </div>
    </Panel>
  );
}

function SettingsPhysical({ title = "Settings, physical" }: { title?: string }) {
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  return (
    <Panel title={title}>
      <InputWell label="Workspace name" defaultValue="Atelier Nord" />
      <div className="grid gap-2">
        <span aria-hidden="true" className="text-small font-title text-fg">
          Theme
        </span>
        <SegmentedTray legend="Theme" value={theme} onValueChange={setTheme} options={[{ value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
      </div>
      <Switch align="end" label="Email me when a build finishes" defaultChecked />
      <Slider label="Animation speed" min={0.5} max={2} step={0.1} defaultValue={1} formatValue={speed} minLabel="Slower" maxLabel="Faster" />
      <div className="flex justify-end gap-3">
        <BlockButton variant="ghost">Cancel</BlockButton>
        <BlockButton variant="primary">Save</BlockButton>
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------- the registry */

/* The blues and the material up top; the three settings panels across under them, the whole language at a glance;
   then the pairs, today on the left of each and the press material on its right, in two columns. */
const PAIR = 440;
const PANELS = 520;
const C1 = 0;
const C2 = 1000;
const ROW = { a: 1290, b: 1600, c: 1920, d: 2320 };
/* Flat's scale candidates (scale.tsx), under the pairs: the settings panel four times, then the case study four times. */
const SCALE_ROW = { settings: 2720, caseStudy: 3760 };
/* Long exposures (streaks.tsx), candidate pictures for Flat: out to the left, clear of everything else. */
const PICTURES_X = -2600;
/* Flat's candidate looks (flat-look.tsx, proposals/flat-colour.md): a block of their own, out to the right of the scale
   rows, three across and two down, Today first; the hand, today and snappy, under them. */
const LOOKS_X = 4800;
const LOOK = { width: 1120, height: 2320, gap: 120 };
const HAND_Y = 2 * (LOOK.height + LOOK.gap) + 80;
/* Flat bounces more (flat-bounce.tsx, plans/023): to the right of the hand, the other motion experiment for Flat. The
   expressive grid first, then the responsive pair. */
const BOUNCE_X = LOOKS_X + LOOK.width + LOOK.gap;
const BOUNCE = { width: 1420, height: 1640, responsiveWidth: 940, gap: 120 };
/* Press today, Press lighter and Flat (press.tsx, proposals/press-lighter.md): three columns of their own, under
   everything else (the case studies end near 7600), light over dark in each. */
const PRESS_Y = 7800;
const PRESS: { id: PressColumn; name: string }[] = [
  { id: "today", name: "Press · today" },
  { id: "lighter", name: "Press · lighter" },
  { id: "flat", name: "Press · Flat" },
];
/* Plain and No UI (proposals/plain.md), below Press's columns: each screen as Plain ships it, then as No UI. */
const NO_UI_Y = PRESS_Y + 1640 + 240;
const NO_UI: { screen: NoUiScreen; name: string; height: number }[] = [
  { screen: "request", name: "a request", height: 1320 },
  { screen: "search", name: "search", height: 1000 },
  { screen: "preferences", name: "preferences", height: 960 },
];
/* Press, phase 1's nine calls (press-calls.tsx, plans/024, Press): a block of their own under the No UI row (its tallest
   item ends at 11000), three across and three down, each the shipping part today beside the proposal, light over dark. */
const CALLS_Y = NO_UI_Y + 1320 + 240;
const CALL = { width: 1120, gap: 120, heights: [1140, 1180, 1560] };
const PRESS_CALLS: { call: PressCallId; name: string }[] = [
  { call: 1, name: "Press call 1 · raised only where a hand presses" },
  { call: 2, name: "Press call 2 · only a fault takes colour" },
  { call: 3, name: "Press call 3 · the primary, Blue 4, raised once, no glow" },
  { call: 4, name: "Press call 4 · keep the shallow cut for fields" },
  { call: 5, name: "Press call 5 · a stage stays the surface, not a plate" },
  { call: 6, name: "Press call 6 · charts keep five hues, one quantity is the ink" },
  { call: 7, name: "Press call 7 · voice, the deploy dashboard" },
  { call: 8, name: "Press call 8 · card covers, a deploy's preview" },
  { call: 9, name: "Press call 9 · one name per job" },
];
/* Press, round 2 (press-round2.tsx): building on Press's materials after Nick's look at the calls. A block of its own
   to the right of the calls (which end at x 3600), from their top: the table and the tags, then the three charts. */
const R2 = { x: 3600 + 240, y: CALLS_Y, width: 1120, gap: 120, heights: [720, 1280] };
const PRESS_ROUND2: { item: PressRound2Id; name: string; row: number; col: number; height?: number }[] = [
  { item: "table", name: "Press round 2 · table, rows on one tray", row: 0, col: 0 },
  { item: "tags", name: "Press round 2 · status tags, kept", row: 0, col: 1, height: 400 },
  { item: "chart-blocks", name: "Press round 2 · chart, blocks in a tray", row: 1, col: 0 },
  { item: "chart-glass", name: "Press round 2 · chart, a trace on a glass readout", row: 1, col: 1 },
  { item: "chart-slots", name: "Press round 2 · chart, slots cut into the plate", row: 1, col: 2 },
];
/* Flat, phase 1's calls (flat-calls.tsx, plans/024, Flat): a block of their own under Press's calls (which end at
   y 15360) and round 2 (x 3840 to 7440): the new Flat, all calls together, first and alone on its row, then the nine
   calls three across, each today beside the proposal, light over dark. */
const FLAT_Y = 15360 + 480;
const FLAT = { width: 1120, gap: 120, together: 1880, heights: [1000, 1000, 1640] };
const FLAT_CALLS: { call: FlatCallId; name: string }[] = [
  { call: 1, name: "Flat call 1 · the grey ground, white and ink on it" },
  { call: 2, name: "Flat call 2 · paper has no edge, no ring, no shadow" },
  { call: 3, name: "Flat call 3 · a real cover, not a wireframe" },
  { call: 4, name: "Flat call 4 · the ink card, one vivid colour" },
  { call: 5, name: "Flat call 5 · the accent stays the ink" },
  { call: 6, name: "Flat call 6 · a status is a word after a circle" },
  { call: 7, name: "Flat call 7 · off keeps its outline" },
  { call: 8, name: "Flat call 8 · fun at rest is a figure that stands up" },
  { call: 9, name: "Flat call 9 · voice, a site and its readers" },
];
/* Flat icons, a trial (flat-icons.tsx, Nick 2026-11-18): a fun outline set for Flat, nothing ships. A block of its own
   under Flat's calls (their last row ends near y 21720), four across on Flat's column grid: the set, today beside it,
   in use, and the composition. */
const ICONS_Y = 21720 + 480;
const ICONS = { width: 1120, gap: 120 };
/* Flat as Hypher (flat-hypher.tsx, plans/024, Flat, an open comparison): to the right of Flat's calls (which end at
   x 3600), from their top (y 15840), in the space under Press round 2 (which ends at y 13360) and above the icons (from
   y 22200): the three takes, light over dark each, then the differences. */
const HYPHER = { x: 3600 + 240, y: FLAT_Y, width: 880, gap: 120, height: 2010 };
const HYPHER_TAKES: { take: HypherTake; name: string }[] = [
  { take: "today", name: "Flat · today (after 2a)" },
  { take: "new", name: "Flat · the new Flat, all calls" },
  { take: "hypher", name: "Flat · as Hypher" },
];
const flatRowY = (row: number) => FLAT_Y + FLAT.together + FLAT.gap + FLAT.heights.slice(0, row).reduce((sum, h) => sum + h + FLAT.gap, 0);
const callRowY = (row: number) => CALLS_Y + CALL.heights.slice(0, row).reduce((sum, h) => sum + h + CALL.gap, 0);
export const ITEMS: CanvasItem[] = [
  { id: "blues", name: "Accent · six blues and today", x: 0, y: 0, width: 1040, height: 380, render: () => <AccentBlues /> },
  { id: "material", name: "Material · flat, raised, sunken", x: 1120, y: 0, width: 680, height: 200, render: () => <MaterialDepths /> },

  { id: "button-today", name: "Button · today", x: C1, y: ROW.a, width: PAIR, height: 190, render: () => <ButtonsToday /> },
  { id: "button-block", name: "Button · block", x: C1 + 480, y: ROW.a, width: PAIR, height: 190, render: () => <ButtonBlocks /> },

  { id: "segmented-today", name: "Segmented · today", x: C2, y: ROW.a, width: PAIR, height: 140, render: () => <SegmentedToday /> },
  { id: "segmented-tray", name: "Segmented · tray", x: C2 + 480, y: ROW.a, width: PAIR, height: 140, render: () => <SegmentedTrayDemo /> },

  { id: "checkbox-today", name: "Checkbox · today", x: C1, y: ROW.b, width: PAIR, height: 200, render: () => <CheckboxesToday /> },
  { id: "checkbox-block", name: "Checkbox · block", x: C1 + 480, y: ROW.b, width: PAIR, height: 200, render: () => <CheckBlocks /> },

  { id: "input-today", name: "Input · today", x: C2, y: ROW.b, width: PAIR, height: 200, render: () => <InputsToday /> },
  { id: "input-well", name: "Input · well", x: C2 + 480, y: ROW.b, width: PAIR, height: 200, render: () => <InputWells /> },

  { id: "number-today", name: "Number field · today", x: C1, y: ROW.c, width: PAIR, height: 130, render: () => <NumberField label="Seats" defaultValue={3} min={1} max={12} /> },
  { id: "number-tray", name: "Number field · tray", x: C1 + 480, y: ROW.c, width: PAIR, height: 130, render: () => <NumberTray label="Seats" unit="seats" /> },

  { id: "progress-today", name: "Progress · today", x: C2, y: ROW.c, width: PAIR, height: 280, render: () => <ProgressToday /> },
  { id: "progress-slab", name: "Progress · slab", x: C2 + 480, y: ROW.c, width: PAIR, height: 280, render: () => <ProgressSlabs /> },

  { id: "slide-today", name: "Slide to confirm · today", x: C1, y: ROW.d, width: PAIR, height: 170, render: () => <SlideConfirm label="Slide to delete Atelier Nord" confirmedLabel="Deleting Atelier Nord" /> },
  { id: "slide-slab", name: "Slide to confirm · slab", x: C1 + 480, y: ROW.d, width: PAIR, height: 170, render: () => <SlideSlab /> },

  { id: "settings-today", name: "Settings · today", x: 0, y: PANELS, width: 560, height: 640, render: () => <SettingsToday /> },
  { id: "settings-physical", name: "Settings · physical", x: 640, y: PANELS, width: 560, height: 640, render: () => <SettingsPhysical /> },
  {
    id: "settings-physical-blue-4",
    name: "Settings · physical, Blue 4",
    x: 1280,
    y: PANELS,
    width: 560,
    height: 640,
    render: () => (
      <div style={accentVars(PICK.hex)}>
        <SettingsPhysical title="Settings, physical, Blue 4" />
      </div>
    ),
  },
  ...SCALES.flatMap((scale, i): CanvasItem[] => [
    {
      id: `scale-${scale.id}-settings`,
      name: `Flat scale · ${scale.name} · settings`,
      x: i * 640,
      y: SCALE_ROW.settings,
      width: 560,
      height: 760,
      render: () => (
        <ScaleFrame scale={scale}>
          <SettingsToday />
        </ScaleFrame>
      ),
    },
    {
      id: `scale-${scale.id}-case-study`,
      name: `Flat scale · ${scale.name} · case study`,
      x: i * 1160,
      y: SCALE_ROW.caseStudy,
      width: 1080,
      height: 1200,
      render: () => (
        <ScaleFrame scale={scale}>
          <CaseStudy />
        </ScaleFrame>
      ),
    },
  ]),
  { id: "streaks-prints", name: "Long exposure · as in Gradient Keys", x: PICTURES_X, y: 0, width: 1240, height: 420, render: () => <StreakPrints /> },
  { id: "streaks-palettes", name: "Long exposure · twenty-four palettes", x: PICTURES_X, y: 660, width: 1240, height: 1800, render: () => <StreakPalettes /> },
  { id: "streaks-pairs", name: "Long exposure · eight pairs", x: PICTURES_X, y: 2880, width: 1240, height: 900, render: () => <StreakPairs /> },
  { id: "streaks-cuts", name: "Long exposure · five cuts", x: PICTURES_X, y: 4030, width: 1240, height: 420, render: () => <StreakCuts /> },
  { id: "streaks-hero", name: "Long exposure · Flat's hero, today and as a long exposure", x: PICTURES_X, y: 4700, width: 1040, height: 520, render: () => <StreakHero /> },
  ...LOOKS.map(
    (look, i): CanvasItem => ({
      id: `flat-look-${look.id}`,
      name: `Flat look · ${look.name}`,
      x: LOOKS_X + (i % 3) * (LOOK.width + LOOK.gap),
      y: Math.floor(i / 3) * (LOOK.height + LOOK.gap),
      width: LOOK.width,
      height: LOOK.height,
      render: () => <FlatLookFrame look={look} />,
    }),
  ),
  ...PRESS.map(
    (column, i): CanvasItem => ({
      id: `press-${column.id}`,
      name: column.name,
      x: i * 640,
      y: PRESS_Y,
      width: 560,
      height: 1640,
      render: () => <PressColumnPreview column={column.id} />,
    }),
  ),
  { id: "flat-look-hand", name: "Flat · the hand, today and snappy", x: LOOKS_X, y: HAND_Y, width: 1120, height: 720, render: () => <FlatHand /> },
  { id: "flat-bounce-expressive", name: "Flat bounce · expressive, ten candidates", x: BOUNCE_X, y: HAND_Y, width: BOUNCE.width, height: BOUNCE.height, render: () => <FlatBounceExpressive /> },
  {
    id: "flat-bounce-responsive",
    name: "Flat bounce · responsive, today and 0.08",
    x: BOUNCE_X + BOUNCE.width + BOUNCE.gap,
    y: HAND_Y,
    width: BOUNCE.responsiveWidth,
    height: 420,
    render: () => <FlatBounceResponsive />,
  },
  ...NO_UI.flatMap((row, i) =>
    (["plain", "none"] as NoUiColumn[]).map(
      (column, j): CanvasItem => ({
        id: `no-ui-${row.screen}-${column}`,
        name: `${column === "plain" ? "Plain" : "No UI"} · ${row.name}`,
        x: i * 1240 + j * 600,
        y: NO_UI_Y,
        width: 520,
        height: row.height,
        render: () => <NoUiPreview screen={row.screen} column={column} />,
      }),
    ),
  ),
  ...PRESS_CALLS.map(
    ({ call, name }, i): CanvasItem => ({
      id: `press-call-${call}`,
      name,
      x: (i % 3) * (CALL.width + CALL.gap),
      y: callRowY(Math.floor(i / 3)),
      width: CALL.width,
      height: CALL.heights[Math.floor(i / 3)],
      render: () => <PressCallPreview call={call} />,
    }),
  ),
  ...PRESS_ROUND2.map(
    ({ item, name, row, col, height }): CanvasItem => ({
      id: `press-round2-${item}`,
      name,
      x: R2.x + col * (R2.width + R2.gap),
      y: R2.y + R2.heights.slice(0, row).reduce((sum, h) => sum + h + R2.gap, 0),
      width: R2.width,
      height: height ?? R2.heights[row],
      render: () => <PressRound2Preview item={item} />,
    }),
  ),
  { id: "flat-together", name: "Flat · the new Flat, all calls together", x: 0, y: FLAT_Y, width: FLAT.width, height: FLAT.together, render: () => <FlatTogetherPreview /> },
  ...FLAT_CALLS.map(
    ({ call, name }, i): CanvasItem => ({
      id: `flat-call-${call}`,
      name,
      x: (i % 3) * (FLAT.width + FLAT.gap),
      y: flatRowY(Math.floor(i / 3)),
      width: FLAT.width,
      height: FLAT.heights[Math.floor(i / 3)],
      render: () => <FlatCallPreview call={call} />,
    }),
  ),
  ...HYPHER_TAKES.map(
    ({ take, name }, i): CanvasItem => ({
      id: `flat-hypher-${take}`,
      name,
      x: HYPHER.x + i * (HYPHER.width + HYPHER.gap),
      y: HYPHER.y,
      width: HYPHER.width,
      height: HYPHER.height,
      render: () => <HypherTakePreview take={take} />,
    }),
  ),
  {
    id: "flat-hypher-differences",
    name: "Flat · as Hypher, the differences",
    x: HYPHER.x + 3 * (HYPHER.width + HYPHER.gap),
    y: HYPHER.y,
    width: 1120,
    height: 2640,
    render: () => <HypherDifferences />,
  },
  { id: "flat-icons-set", name: "Flat icons · the set", x: 0, y: ICONS_Y, width: ICONS.width, height: 3040, render: () => <FlatIconSet /> },
  { id: "flat-icons-pairs", name: "Flat icons · today and fun, side by side", x: ICONS.width + ICONS.gap, y: ICONS_Y, width: ICONS.width, height: 1100, render: () => <FlatIconPairs /> },
  { id: "flat-icons-in-use", name: "Flat icons · in use", x: 2 * (ICONS.width + ICONS.gap), y: ICONS_Y, width: ICONS.width, height: 1580, render: () => <FlatIconsInUse /> },
  { id: "flat-icons-composition", name: "Flat icons · the composition", x: 3 * (ICONS.width + ICONS.gap), y: ICONS_Y, width: ICONS.width, height: 880, render: () => <FlatIconComposition /> },
];
