/**
 * Heat's scenes (scene.ts): a racing game's front end, the menus you drive with keys. Each is the same panel: a black
 * slab banded top and bottom with diagonal stripes, framed by four corner brackets in the ink, its rows a label set
 * right against its value. The row under the keys or the pointer is held in four amber corner brackets, its label in
 * amber and ‹ › beside its value; a level is a row of dashes, lit up to the value; what each key does runs along the
 * foot as keycaps. Amber is words, brackets and marks here, never a fill (R6), so the page's one fill stays Install.
 */
import { useState, type KeyboardEvent, type ReactNode } from "react";
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
        <div className="grid bg-canvas">
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

function Audio() {
  const [values, setValues] = useState(DEFAULTS);
  const [active, setActive] = useState(0);
  const set = (s: Setting, v: number) => setValues((all) => ({ ...all, [s.id]: Math.max(0, Math.min(top(s), v)) }));
  const onKey = (i: number, s: Setting) => (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    const move = { ArrowUp: -1, ArrowDown: 1 }[e.key];
    if (step) set(s, values[s.id]! + step);
    else if (e.key === "Home") set(s, 0);
    else if (e.key === "End") set(s, top(s));
    else if (move) {
      const next = Math.max(0, Math.min(SETTINGS.length - 1, i + move));
      (e.currentTarget.closest("ul")?.children[next]?.querySelector("[role=slider]") as HTMLElement | null)?.focus();
    } else return;
    e.preventDefault();
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
      <ul className="grid">
        {SETTINGS.map((s, i) => {
          const on = i === active;
          const v = values[s.id]!;
          return (
            <li key={s.id} className="relative grid grid-cols-[minmax(0,1fr)_1.75rem_minmax(0,9rem)_1.75rem] items-center gap-x-2 px-3 py-1.5" onPointerEnter={() => setActive(i)}>
              {on && <span aria-hidden="true" className={SELECTED} />}
              <span id={`audio-${s.id}`} className={"truncate text-right text-small font-title " + (on ? "text-accent-text" : "text-fg")}>
                {s.label}
              </span>
              <Chevron hidden={!on} label={`Lower ${s.label}`} onClick={() => set(s, v - 1)}>
                ‹
              </Chevron>
              <div
                role="slider"
                tabIndex={0}
                aria-labelledby={`audio-${s.id}`}
                aria-valuemin={0}
                aria-valuemax={top(s)}
                aria-valuenow={v}
                aria-valuetext={say(s, v)}
                onFocus={() => setActive(i)}
                onKeyDown={onKey(i, s)}
                className="grid h-control-sm min-w-0 cursor-default place-items-center outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {s.kind === "level" ? <Dashes value={v} of={s.max} /> : <span className="text-small text-fg">{s.options[v]}</span>}
              </div>
              <Chevron hidden={!on} label={`Raise ${s.label}`} onClick={() => set(s, v + 1)}>
                ›
              </Chevron>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* The arrows beside the row you are on; the keys do the same, so they take no focus. */
function Chevron({ hidden, label, onClick, children }: { hidden: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      onClick={onClick}
      className={"grid h-control-sm place-items-center text-h1 text-accent-text " + (hidden ? "invisible" : "")}
    >
      {children}
    </button>
  );
}

/* ---------- B. Controls: which key does what, each binding a cell you pick ---------- */

const BINDINGS: [string, string, string][] = [
  ["Accelerate", "Up", "W"],
  ["Brake", "Down", "S"],
  ["Steer left", "Left", "A"],
  ["Steer right", "Right", "D"],
  ["Handbrake", "Space", "–"],
  ["Boost", "Alt", "X"],
];
const COLUMNS = "grid grid-cols-[minmax(0,1fr)_minmax(0,6rem)_minmax(0,6rem)] gap-2";

function Controls() {
  const [cell, setCell] = useState<[number, 1 | 2]>([0, 1]);
  return (
    <Panel
      label="Controls"
      head={
        <span className={COLUMNS + " w-full text-fg"}>
          <span />
          <span className="text-center">Primary</span>
          <span className="text-center">Secondary</span>
        </span>
      }
      foot={
        <>
          <Hint k="↵">Re-map</Hint>
          <Hint k="esc">Done</Hint>
        </>
      }
    >
      <ul className="grid">
        {BINDINGS.map(([action, ...keys], row) => {
          const on = cell[0] === row;
          return (
            <li key={action} className={"relative items-center px-3 py-1 " + COLUMNS}>
              {on && <span aria-hidden="true" className={SELECTED} />}
              <span className={"truncate text-small font-title " + (on ? "text-accent-text" : "text-fg")}>{action}</span>
              {keys.map((k, j) => {
                const col = (j + 1) as 1 | 2;
                const picked = on && cell[1] === col;
                return (
                  <button
                    key={col}
                    type="button"
                    aria-pressed={picked}
                    aria-label={`${action}, ${col === 1 ? "primary" : "secondary"}: ${k === "–" ? "none" : k}`}
                    onClick={() => setCell([row, col])}
                    className={"h-control-sm min-w-0 truncate px-2 text-small text-fg " + (picked ? "bg-accent-tint" : "bg-block hover:bg-block-hover")}
                  >
                    {k}
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
    { id: "controls", title: "Controls", line: "Which key does what, each binding a dark cell; the one you picked turns amber.", Render: Controls },
    { id: "standings", title: "Standings", line: "The scoreboard: each team in its own colour, the gaps in tabular figures, the pit and the retired as tags.", Render: Standings },
  ],
  cover: "audio",
};
