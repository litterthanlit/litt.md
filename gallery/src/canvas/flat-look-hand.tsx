/**
 * Flat · the hand, today and snappy (proposals/flat-colour.md): the same controls that move, twice. The left frame runs
 * today's motion tokens; the right one a snappier set, inside the bounds in gallery/src/motion/rules.ts (check 9).
 * Something to feel, not to read: Nick said "motion should be snappy maybe? not sure".
 *
 * How the tokens reach a part decides what the snappy frame can show. CSS reads --dur-* and --ease-* from the
 * element, so the switch, the slider's cap and every hover, press and colour fade follow the frame's custom
 * properties. The JS springs (the segmented control's glide, the select's list, the menu) read the dial the page's
 * motion provider parsed from <html> once, when it mounted; a frame cannot reach them without a change in
 * gallery/src/motion, so they move on today's springs in both frames, and the frame says so.
 *
 * Reduced motion: tokens.css zeroes the durations on <html>, and a frame's own values would override that, so the
 * snappy frame sets nothing while the reader asks for reduced motion and inherits the zeros like every part.
 */
import { useState, type CSSProperties } from "react";
import { Button } from "@/components/button";
import { Menu, MenuItem } from "@/components/menu";
import { Segmented } from "@/components/segmented";
import { SelectField } from "@/components/select";
import { Slider } from "@/components/slider";
import { Switch } from "@/components/switch";
import { MaterialProvider, useMotionDial } from "@/motion";
import { toCss, type Spring } from "@/motion/spring";

/** Today's values, as tokens.css locks them (visual time and bounce; the instant tween in ms). */
export const TODAY = { instant: 100, responsive: { time: 0.2, bounce: 0 }, expressive: { time: 0.35, bounce: 0.12 } }; // litt-allow: today's motion, for comparison
/**
 * The snappy candidate: the instant tier 100 to 70ms, the responsive spring 200 to 140ms, the expressive 350 to 240ms.
 * The expressive bounce is already at the ceiling (0.12), so it cannot take more; responsive stays at 0, as it must.
 */
export const SNAPPY = { instant: 70, responsive: { time: 0.14, bounce: 0 }, expressive: { time: 0.24, bounce: 0.12 } }; // litt-allow: candidate motion (proposals/flat-colour.md)
const EXIT = 0.75;

const exitMs = (s: Spring) => Math.round(Math.round(s.time * 1000) * EXIT);

/** The CSS custom properties a set of springs writes, as the Playground mirrors its dial. */
function motionProps(m: typeof SNAPPY): CSSProperties {
  const r = toCss(m.responsive);
  const e = toCss(m.expressive);
  return {
    "--dur-instant": `${m.instant}ms`,
    "--ease-responsive": r.easing,
    "--dur-responsive": `${r.duration}ms`,
    "--ease-expressive": e.easing,
    "--dur-expressive": `${e.duration}ms`,
    "--dur-exit-responsive": `${exitMs(m.responsive)}ms`,
    "--dur-exit-expressive": `${exitMs(m.expressive)}ms`,
  } as CSSProperties;
}

/** The numbers each frame shows: visual time, settle, exit. */
export function motionNumbers(m: typeof SNAPPY) {
  return {
    instant: m.instant,
    responsive: { time: Math.round(m.responsive.time * 1000), settle: toCss(m.responsive).duration, exit: exitMs(m.responsive) },
    expressive: { time: Math.round(m.expressive.time * 1000), bounce: m.expressive.bounce, settle: toCss(m.expressive).duration, exit: exitMs(m.expressive) },
  };
}

const REGIONS = [
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Washington" },
  { value: "sin", label: "Singapore" },
];

function Numbers({ m }: { m: typeof SNAPPY }) {
  const n = motionNumbers(m);
  return (
    <dl className="grid grid-cols-3 gap-4 text-caption">
      <div className="grid gap-0.5">
        <dt className="text-fg-subtle">Instant</dt>
        <dd className="tabular-nums text-fg">{n.instant}ms</dd>
      </div>
      <div className="grid gap-0.5">
        <dt className="text-fg-subtle">Responsive</dt>
        <dd className="tabular-nums text-fg">
          {n.responsive.time}ms, settles {n.responsive.settle}ms
        </dd>
      </div>
      <div className="grid gap-0.5">
        <dt className="text-fg-subtle">Expressive</dt>
        <dd className="tabular-nums text-fg">
          {n.expressive.time}ms, bounce {n.expressive.bounce}, settles {n.expressive.settle}ms
        </dd>
      </div>
    </dl>
  );
}

function HandFrame({ which }: { which: "today" | "snappy" }) {
  const { reduced } = useMotionDial();
  const [view, setView] = useState<"list" | "board" | "calendar">("board");
  const m = which === "snappy" ? SNAPPY : TODAY;
  const style = which === "snappy" && !reduced ? motionProps(SNAPPY) : undefined;
  return (
    <div className="grid content-start gap-4">
      <div className="grid gap-1">
        <span className="text-small font-title text-fg">{which === "today" ? "Today" : "Snappy"}</span>
        <Numbers m={m} />
      </div>
      <MaterialProvider material="flat">
        <div data-material="flat" data-flat-hand={which} style={style} className="grid content-start gap-6 rounded-surface bg-canvas p-6 shadow-[inset_0_0_0_1px_var(--line)]">
          <div data-part="segmented">
            <Segmented legend={`View, ${which}`} value={view} onValueChange={setView} options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }, { value: "calendar", label: "Calendar" }]} />
          </div>
          <div data-part="switch">
            <Switch align="end" label={`Publish on every push, ${which}`} />
          </div>
          <SelectField label={`Region, ${which}`} options={REGIONS} defaultValue="fra" />
          <div>
            <Menu label={`Project actions, ${which}`} align="start" trigger={<Button>Project actions</Button>}>
              <MenuItem onSelect={() => {}}>Rename</MenuItem>
              <MenuItem onSelect={() => {}}>Duplicate</MenuItem>
              <MenuItem destructive onSelect={() => {}}>
                Delete
              </MenuItem>
            </Menu>
          </div>
          <Slider label={`Rollout, ${which}`} min={0} max={100} step={10} defaultValue={40} formatValue={(v) => `${v}%`} />
        </div>
      </MaterialProvider>
    </div>
  );
}

export function FlatHand() {
  return (
    <div className="grid gap-6">
      <p className="max-w-(--measure) text-small text-fg-subtle">
        Flip the switch and press the slider's slot in each. The snappy side runs shorter times on everything CSS moves: the switch, the slider's cap,
        every hover, press and colour fade. The segmented control's glide, the select's list and the menu are springs in script, read once from the page,
        so they move alike in both.
      </p>
      <div className="grid grid-cols-2 gap-8">
        <HandFrame which="today" />
        <HandFrame which="snappy" />
      </div>
    </div>
  );
}
