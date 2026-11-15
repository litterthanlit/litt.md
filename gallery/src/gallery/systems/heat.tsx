/**
 * Heat's scenes (scene.ts): a racing game's front end, the menus you drive with keys. Each is the same panel: a black
 * slab banded top and bottom with diagonal stripes, framed by four corner brackets in the ink, its rows a label set
 * right against its value. The row under the keys or the pointer is held in four amber corner brackets, its label in
 * amber and ‹ › beside its value; a level is a row of dashes, lit up to the value; what each key does runs along the
 * foot as keycaps. Amber is words, brackets and marks here, never a fill (R6), so the page's one fill stays Install.
 */
import { useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Kbd } from "@/components/kbd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag, type TagHue } from "@/components/tag";
import type { SystemScenes } from "./scene";

/* ---------- the panel ---------- */

/* Four corner marks, each two 2px bars, in the element's color (after Plain's brackets). Written out whole, so Tailwind
   finds every class. */
const MARKS =
  "pointer-events-none absolute bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom] ";
/* The panel's frame: 16px marks just outside it, in the ink. */
const FRAME = MARKS + "[background-size:16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px] -inset-2 text-fg";
/* The row you are on: 8px marks at its corners, in amber. */
const SELECTED = MARKS + "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] inset-0 text-accent-text";
/* The band above and below the slab: diagonal stripes of the slab's two darkest steps. */
const STRIPES = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

function Panel({ label, head, foot, children }: { label: string; head?: ReactNode; foot: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-4">
      <div role="group" aria-label={label} className="relative">
        <span aria-hidden="true" className={FRAME} />
        <div className="@container grid bg-canvas">
          <div className={"flex h-8 items-center justify-center bg-surface-1 px-4 text-small text-fg-muted " + STRIPES}>{head}</div>
          <div className="border-y border-line py-2">{children}</div>
          <div aria-hidden="true" className={"h-4 bg-surface-1 " + STRIPES} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">{foot}</div>
    </div>
  );
}

function Hint({ k, children }: { k: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-small text-fg">
      <Kbd>{k}</Kbd>
      {children}
    </span>
  );
}

/* A level as a row of dashes, lit up to the value. */
function Dashes({ value, of }: { value: number; of: number }) {
  return (
    <span aria-hidden="true" className="flex h-2 w-full min-w-0 items-center gap-1 bg-tray px-1">
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={"h-1 flex-1 " + (i < value ? "bg-accent-text" : "bg-line-strong")} />
      ))}
    </span>
  );
}

/* ---------- A. Audio: a settings menu you drive with the arrow keys ---------- */

type Setting = { id: string; label: string } & ({ kind: "level"; max: number } | { kind: "choice"; options: string[] });
const SETTINGS: Setting[] = [
  { id: "effects", label: "Sound effects", kind: "level", max: 12 },
  { id: "engine", label: "Engine", kind: "level", max: 12 },
  { id: "speech", label: "Speech", kind: "level", max: 12 },
  { id: "music", label: "Music", kind: "level", max: 12 },
  { id: "interactive", label: "Interactive music", kind: "choice", options: ["Off", "On"] },
  { id: "mode", label: "Audio mode", kind: "choice", options: ["Mono", "Stereo", "Surround"] },
];
const DEFAULTS: Record<string, number> = { effects: 12, engine: 12, speech: 12, music: 9, interactive: 1, mode: 1 };
const top = (s: Setting) => (s.kind === "level" ? s.max : s.options.length - 1);
const say = (s: Setting, v: number) => (s.kind === "level" ? `${v} of ${s.max}` : s.options[v]!);
/* A level stops at its ends; a choice goes round, as a cycler does. */
const next = (s: Setting, v: number) => (s.kind === "level" ? Math.max(0, Math.min(s.max, v)) : (v + s.options.length) % s.options.length);
/* The press answers on the frame, on the locked press scale (1 under reduced motion). */
const PRESS = "transition-transform duration-(--dur-instant) ease-litt active:scale-[var(--press-scale)]";

/* Moves focus to the k-th row's control in the same list, which makes it the row you are on. */
const focusRow = (from: Element, k: number, sel: string) => (from.closest("ul")?.children[k]?.querySelector(sel) as HTMLElement | null)?.focus();

function Audio() {
  const [values, setValues] = useState(DEFAULTS);
  const [active, setActive] = useState(0);
  const set = (s: Setting, v: number) => setValues((all) => ({ ...all, [s.id]: next(s, v) }));
  const onKey = (i: number, s: Setting) => (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, PageDown: -3, PageUp: 3 }[e.key];
    const move = { ArrowUp: -1, ArrowDown: 1 }[e.key];
    if (step) set(s, s.kind === "level" ? values[s.id]! + step : values[s.id]! + Math.sign(step));
    else if (e.key === "Home") set(s, 0);
    else if (e.key === "End") set(s, top(s));
    else if (move) focusRow(e.currentTarget, Math.max(0, Math.min(SETTINGS.length - 1, i + move)), "[role=slider]");
    else return;
    e.preventDefault();
  };
  /* The dashes are a bar you set: press or drag along them, and the value follows the pointer. */
  const onPointer = (s: Setting) => (e: PointerEvent<HTMLDivElement>) => {
    if (e.type === "pointermove" && !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    if (e.type === "pointerdown") {
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.focus();
      if (s.kind === "choice") return set(s, values[s.id]! + 1);
    }
    if (s.kind !== "level") return;
    const r = e.currentTarget.getBoundingClientRect();
    set(s, Math.round(((e.clientX - r.left) / r.width) * s.max));
  };
  return (
    <Panel
      label="Audio"
      head="Audio"
      foot={
        <>
          <Hint k="↑ ↓">Choose</Hint>
          <Hint k="← →">Change</Hint>
          <Button variant="ghost" size="sm" onClick={() => setValues(DEFAULTS)}>
            Defaults
          </Button>
        </>
      }
    >
      {/* Side by side once the panel has room, as the menu sets them; narrower, each label sits over its control. */}
      <ul className="grid">
        {SETTINGS.map((s, i) => {
          const on = i === active;
          const v = values[s.id]!;
          const level = s.kind === "level";
          return (
            <li
              key={s.id}
              className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-1 px-3 py-1.5 @[24rem]:grid-cols-[minmax(0,1fr)_auto_minmax(5rem,9rem)_auto]"
              onPointerEnter={(e) => {
                /* The pointer picks the row; while the keys are in this menu, they follow it there. */
                if (e.currentTarget.parentElement?.contains(document.activeElement)) focusRow(e.currentTarget, i, "[role=slider]");
                else setActive(i);
              }}
            >
              {on && <span aria-hidden="true" className={SELECTED} />}
              <span id={`audio-${s.id}`} className={"col-span-3 truncate px-7 text-small font-title @[24rem]:col-span-1 @[24rem]:px-0 @[24rem]:text-right " + (on ? "text-accent-text" : "text-fg")}>
                {s.label}
              </span>
              <Chevron hidden={!on} off={level && v === 0} label={`Lower ${s.label}`} onClick={() => set(s, v - 1)}>
                ‹
              </Chevron>
              <div
                role="slider"
                tabIndex={on ? 0 : -1}
                aria-labelledby={`audio-${s.id}`}
                aria-valuemin={0}
                aria-valuemax={top(s)}
                aria-valuenow={v}
                aria-valuetext={say(s, v)}
                onFocus={() => setActive(i)}
                onKeyDown={onKey(i, s)}
                onPointerDown={onPointer(s)}
                onPointerMove={onPointer(s)}
                className="grid h-control-sm min-w-0 cursor-pointer touch-none select-none place-items-center outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {level ? <Dashes value={v} of={s.max} /> : <span className="text-small text-fg">{s.options[v]}</span>}
              </div>
              <Chevron hidden={!on} off={level && v === top(s)} label={`Raise ${s.label}`} onClick={() => set(s, v + 1)}>
                ›
              </Chevron>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* The arrows beside the row you are on. The keys do the same, so they take no focus; at an end, one goes quiet. */
function Chevron({ hidden, off, label, onClick, children }: { hidden: boolean; off: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      aria-disabled={off || undefined}
      onClick={off ? undefined : onClick}
      className={
        "grid h-control-sm w-7 place-items-center text-h1 " +
        (hidden ? "invisible " : "") +
        (off ? "cursor-default text-fg-disabled" : "text-accent-text " + PRESS)
      }
    >
      {children}
    </button>
  );
}

/* ---------- B. Controls: which key does what; pick a cell and press the key you want ---------- */

const ACTIONS = ["Accelerate", "Brake", "Steer left", "Steer right", "Handbrake", "Boost"];
const KEYS: string[][] = [
  ["Up", "W"],
  ["Down", "S"],
  ["Left", "A"],
  ["Right", "D"],
  ["Space", ""],
  ["Alt", "X"],
];
const SLOTS = ["Primary", "Secondary"];
const COLUMNS = "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 @[24rem]:grid-cols-[minmax(0,1fr)_minmax(3.5rem,6rem)_minmax(3.5rem,6rem)]";
/* A key as the menu names it: the arrows by direction, a letter in capitals, the space bar in words. */
const keyName = (key: string) => (key === " " ? "Space" : key.startsWith("Arrow") ? key.slice(5) : key.length === 1 ? key.toUpperCase() : key);

function Controls() {
  const [keys, setKeys] = useState(KEYS);
  const [cell, setCell] = useState<[number, number]>([0, 0]);
  const [listening, setListening] = useState(false);
  const [news, setNews] = useState("");
  const [row, col] = cell;
  const bind = (key: string) => {
    const was = keys.flatMap((r, i) => r.map((k, j) => [k, i, j] as const)).find(([k, i, j]) => key && k === key && (i !== row || j !== col));
    setKeys((all) => all.map((r, i) => r.map((k, j) => (i === row && j === col ? key : was && i === was[1] && j === was[2] ? "" : k))));
    setListening(false);
    setNews(!key ? `${ACTIONS[row]}, ${SLOTS[col]!.toLowerCase()}: cleared` : was ? `${key} moved from ${ACTIONS[was[1]]} to ${ACTIONS[row]}` : `${ACTIONS[row]}, ${SLOTS[col]!.toLowerCase()}: ${key}`);
  };
  const onKey = (i: number, j: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (listening) {
      e.preventDefault();
      if (e.key === "Escape") {
        setListening(false);
        setNews("Re-map cancelled");
      } else if (e.key !== "Tab" && e.key !== "Shift") bind(keyName(e.key));
      return;
    }
    const to = { ArrowUp: [i - 1, j], ArrowDown: [i + 1, j], ArrowLeft: [i, j - 1], ArrowRight: [i, j + 1] }[e.key];
    if (to) {
      e.preventDefault();
      const [r, c] = [Math.max(0, Math.min(ACTIONS.length - 1, to[0]!)), Math.max(0, Math.min(1, to[1]!))];
      (e.currentTarget.closest("ul")?.children[r]?.querySelectorAll("button")[c] as HTMLElement | undefined)?.focus();
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      bind("");
    }
  };
  return (
    <Panel
      label="Controls"
      head={
        <span aria-hidden="true" className={COLUMNS + " w-full text-fg"}>
          <span className="hidden @[24rem]:block" />
          <span className="text-center">Primary</span>
          <span className="text-center">Secondary</span>
        </span>
      }
      foot={
        <>
          <Hint k="↵">{listening ? "Press a key" : "Re-map"}</Hint>
          <Hint k="esc">Cancel</Hint>
          <Hint k="⌫">Clear</Hint>
          <Button variant="ghost" size="sm" onClick={() => (setKeys(KEYS), setListening(false), setNews("Controls back to their defaults"))}>
            Defaults
          </Button>
          <span role="status" className="sr-only">
            {news}
          </span>
        </>
      }
    >
      <ul className="grid">
        {ACTIONS.map((action, i) => {
          const on = row === i;
          return (
            <li key={action} className={"relative items-center px-3 py-1 " + COLUMNS}>
              {on && <span aria-hidden="true" className={SELECTED} />}
              <span className={"col-span-2 truncate text-small font-title @[24rem]:col-span-1 " + (on ? "text-accent-text" : "text-fg")}>{action}</span>
              {keys[i]!.map((k, j) => {
                const picked = on && col === j;
                const waiting = picked && listening;
                return (
                  <button
                    key={j}
                    type="button"
                    tabIndex={picked ? 0 : -1}
                    aria-label={`${action}, ${SLOTS[j]!.toLowerCase()}: ${waiting ? "press a key, Escape to cancel" : k || "none"}`}
                    aria-pressed={waiting}
                    onFocus={() => setCell([i, j])}
                    onClick={() => (setCell([i, j]), setListening(!waiting))}
                    onBlur={() => waiting && setListening(false)}
                    onKeyDown={onKey(i, j)}
                    className={"h-control-sm min-w-0 truncate px-2 text-small text-fg " + PRESS + " " + (picked ? "bg-accent-tint" : "bg-block hover:bg-block-hover")}
                  >
                    {waiting ? "…" : k || "–"}
                  </button>
                );
              })}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ---------- C. Standings: the scoreboard, each team in its own colour ---------- */

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

export const heat: SystemScenes = {
  scenes: [
    { id: "audio", title: "Audio", line: "A settings menu you drive with the arrow keys: the row you are on held in amber brackets, its level a row of dashes, ‹ › to change it.", Render: Audio },
    { id: "controls", title: "Controls", line: "Which key does what: pick a cell, press Enter, then the key you want; a key taken elsewhere moves over.", Render: Controls },
    { id: "standings", title: "Standings", line: "The scoreboard: each team in its own colour, the gaps in tabular figures, the pit and the retired as tags.", Render: Standings },
  ],
  cover: "audio",
};
