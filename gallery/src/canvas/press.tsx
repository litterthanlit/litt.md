/**
 * Press today, Press lighter and Flat, side by side (proposals/press-lighter.md, How to decide). Each column shows the
 * same real parts in a light frame over a dark one, so Nick can press each and pick. Every frame sets its own theme and
 * material (lookAttributes, with a MaterialProvider so each part draws that world's body), whatever the gallery's look.
 * Press lighter is Press with the candidate in press-lighter.css switched on by data-press-lighter.
 */
import { useState, type CSSProperties } from "react";
import { Button } from "@/components/button";
import { TextField } from "@/components/input";
import { Segmented } from "@/components/segmented";
import { SlideConfirm } from "@/components/slide-confirm";
import { Slider } from "@/components/slider";
import { MaterialProvider } from "@/motion";
import { lookAttributes, type Material } from "@/gallery/look";
import { LIMITS, shapeSurface } from "@/motion/rules";
import "./press-lighter.css";

export type PressColumn = "today" | "lighter" | "flat";

const COLUMNS: Record<PressColumn, { title: string; note: string; material: Material }> = {
  today: { title: "Press today", note: "What the registry ships: plate, wall, a label that drops.", material: "press" },
  lighter: { title: "Press lighter", note: "Face, highlight and cast. A press scales the whole button.", material: "press" },
  flat: { title: "Flat", note: "Fill alone, on greys. What the gallery opens in.", material: "flat" },
};

const percent = (v: number) => `${v}%`;

/* The gallery opens in Flat, which sets its Pill shape and a zero press depth on <html>. Neither is a theme token, so a
   nested [data-theme] does not take them back: a Press frame restates Press's own, as the registry ships it. */
const PRESS_OWN = {
  "--radius-control": `${LIMITS.control}px`,
  "--radius-surface": `${shapeSurface(LIMITS.control)}px`,
  "--press-depth": "0.5px",
} as CSSProperties;

function Frame({ column, dark }: { column: PressColumn; dark: boolean }) {
  const { material } = COLUMNS[column];
  const [view, setView] = useState<"list" | "board" | "calendar">("board");
  return (
    <MaterialProvider material={material}>
      <div
        {...lookAttributes({ accent: "world", material }, dark)}
        data-press-lighter={column === "lighter" ? "" : undefined}
        style={material === "press" ? PRESS_OWN : undefined}
        className="grid gap-6 rounded-surface bg-canvas p-6 text-fg"
      >
        <span className="text-small text-fg-subtle">{dark ? "Dark" : "Light"}</span>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Preview</Button>
          <Button variant="primary">Publish</Button>
        </div>
        <section aria-label="Delete project" className="grid gap-4 rounded-surface bg-surface-1 p-4 shadow-[inset_0_0_0_1px_var(--line)]">
          <div className="grid gap-1">
            <h3 className="text-body font-title text-fg">Delete Atelier Nord?</h3>
            <p className="text-small text-fg-muted">Its 12 pages and their history go with it.</p>
          </div>
          <div data-dialog-footer="" className="flex justify-end gap-3">
            <Button variant="ghost">Cancel</Button>
            <Button variant="danger">Delete</Button>
          </div>
        </section>
        <Segmented legend="View" value={view} onValueChange={setView} options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }, { value: "calendar", label: "Calendar" }]} />
        <TextField label="Project name" defaultValue="Atelier Nord" />
        <Slider label="Image quality" min={0} max={100} step={5} defaultValue={70} formatValue={percent} />
        <SlideConfirm label="Slide to publish Atelier Nord" confirmedLabel="Publishing Atelier Nord" />
      </div>
    </MaterialProvider>
  );
}

export function PressColumnPreview({ column }: { column: PressColumn }) {
  const { title, note } = COLUMNS[column];
  return (
    <div data-press-column={column} className="grid gap-6">
      <div className="grid gap-1">
        <span className="text-small font-title text-fg">{title}</span>
        <span className="text-small text-fg-subtle">{note}</span>
      </div>
      <Frame column={column} dark={false} />
      <Frame column={column} dark />
    </div>
  );
}
