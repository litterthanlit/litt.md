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
];
