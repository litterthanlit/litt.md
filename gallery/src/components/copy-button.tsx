/**
 * Copy button: a key that copies a command, and the LCD line that shows it (proposals/device-studies.md, Copy button).
 * A Device part: it reads the key and field tokens every material sets, so it is only at home under
 * data-material="device" (components.md, "Copy button").
 *
 * - Anatomy: a key (2.9em square: its face --block, its skirt and rim --key-lift) beside a line of LCD glass (--field,
 *   --field-ink, --field-shade) that shows the command in the mono, after a prompt in --field-ink-subtle. The key is
 *   the only control; the line is only a picture of what it copies.
 * - Press: the key sinks the whole --press-depth (2px under Device) onto its skirt, and --block-press replaces its lift,
 *   at once. Under Press and Flat the same depth is half a pixel and nothing, so it stays quiet there.
 * - Copied: the copy glyph crossfades to a check (opacity and scale on the responsive tier) and the check draws in, its
 *   stroke offset running from 1 to 0 after a short delay. The state is said in words (R5): the line reads "Copied" for
 *   the hold, and a polite status says it to a screen reader. Then it goes back by itself.
 * - The glitch wave: a copy clears the command from the line right to left, and it decodes back in left to right
 *   once the hold ends. Each character shows glyphs from the display's ROM (half-width katakana, digits and :=*+<>)
 *   for 140 to 340ms, swapping every 35 to 85ms at a flicker of 0.6 to 1.0, fading out or in as it settles. The
 *   whole wave takes at most 520ms. A hidden character keeps its width, so the line never moves. A second copy
 *   mid-wave reverses it from where it is. Every frame writes textContent, visibility and opacity on the spans and
 *   never React state, and the loop stops when every character has settled.
 * - Nothing moves on its own (R4): no rehearsal on mount, no sound in this wave. Reduced motion swaps the glyphs at once
 *   and draws nothing.
 * - A failed clipboard write selects the command on the line instead, so it can be copied by hand, and says so in
 *   the status.
 * - Accessibility: the key is a button named "Copy command" (or `label`); the command is real text for a screen reader
 *   and the glyph spans are hidden from it.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type CopyButtonProps = {
  /** What a press puts on the clipboard. */
  text: string;
  /** The key's name for a screen reader. */
  label?: string;
  /** What the line shows. Default: the text itself. Pass a shorter or prettier form when the text is long. */
  command?: string;
  className?: string;
};

const HOLD_MS = 1800; // how long the key says Copied
const WAVE_MS = 520; // the longest a whole wave takes
const GLITCH_MIN = 140; // a character glitches 140 to 340ms
const GLITCH_SPREAD = 200;
const MAX_GAP_MS = 18; // the most one character waits for its neighbour
const CHECK_DELAY = 0.075; // seconds before the check starts to draw
const GLYPHS = [..."ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:=*+<>"];

/* ---------------------------------------------------------------- the wave */

type Cell = {
  el: HTMLSpanElement;
  ch: string;
  /** Whitespace takes no part in the wave. */
  live: boolean;
  /** Where the cell is heading: shown or hidden. */
  target: boolean;
  mode: "idle" | "in" | "out";
  /** Progress through the glitch, 0 to 1, and the clock it is measured from. */
  p: number;
  p0: number;
  t0: number;
  dur: number;
  next: number;
  flick: number;
  text: string;
  vis: string;
  op: string;
};

type Wave = {
  /** Clear the line, right to left. */
  hide: () => void;
  /** Decode the line back in, left to right. */
  show: () => void;
  destroy: () => void;
};

const quantise = (a: number) => Math.round(a * 10) / 10;

/** The wave over the spans in `line`. `edge` hears true when the line has finished clearing and false the moment it starts back. */
function makeWave(line: HTMLElement, reduced: () => boolean, edge: (hidden: boolean) => void): Wave {
  const cells: Cell[] = [...line.children].map((el) => {
    const ch = el.textContent ?? "";
    return { el: el as HTMLSpanElement, ch, live: ch.trim() !== "", target: true, mode: "idle", p: 1, p0: 0, t0: 0, dur: 0, next: 0, flick: 1, text: ch, vis: "", op: "" };
  });
  let frame = 0;

  const write = (c: Cell, text: string, vis: string, op: string) => {
    if (c.text !== text) c.el.textContent = c.text = text;
    if (c.vis !== vis) c.el.style.visibility = c.vis = vis;
    if (c.op !== op) c.el.style.opacity = c.op = op;
  };
  const settle = (c: Cell) => {
    c.mode = "idle";
    c.p = 1;
    write(c, c.ch, c.target ? "" : "hidden", "");
  };

  const tick = (now: number) => {
    frame = 0;
    let active = false;
    for (const c of cells) {
      if (c.mode === "idle") continue;
      active = true;
      if (now < c.t0) continue; // still waiting its turn: it holds how it was
      c.p = Math.min(1, c.p0 + (now - c.t0) / c.dur);
      if (c.p >= 1) {
        settle(c);
        continue;
      }
      let text = c.text;
      if (now >= c.next || !GLYPHS.includes(text)) {
        text = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;
        c.next = now + 35 + Math.random() * 50;
        c.flick = 0.6 + Math.random() * 0.4;
      }
      const alpha = c.flick * (c.mode === "out" ? 1 - 0.7 * c.p : 0.35 + 0.65 * c.p);
      write(c, text, "", String(quantise(alpha)));
    }
    if (active) frame = requestAnimationFrame(tick);
    else edge(cells.every((c) => !c.live || !c.target));
  };

  const run = (showing: boolean) => {
    const now = performance.now();
    const order = (showing ? cells : [...cells].reverse()).filter((c) => c.live);
    const gap = order.length > 1 ? Math.min(MAX_GAP_MS, (WAVE_MS - GLITCH_MIN - GLITCH_SPREAD) / (order.length - 1)) : 0;
    if (showing) edge(false);
    let moved = false;
    order.forEach((c, rank) => {
      if (c.target === showing) return;
      c.target = showing;
      moved = true;
      if (reduced()) return settle(c);
      if (c.mode === "idle") {
        c.p = 0;
        c.p0 = 0;
        c.t0 = now + rank * gap;
        c.dur = GLITCH_MIN + Math.random() * GLITCH_SPREAD;
        c.next = 0;
      } else {
        c.p0 = 1 - c.p; // reverse from where it is
        c.t0 = now;
      }
      c.mode = showing ? "in" : "out";
    });
    if (!moved) return;
    if (reduced()) edge(!showing);
    else if (!frame) frame = requestAnimationFrame(tick);
  };

  return {
    hide: () => run(false),
    show: () => run(true),
    destroy: () => cancelAnimationFrame(frame),
  };
}

/* ---------------------------------------------------------------- the clipboard */

/** The old route, for pages without the async clipboard API. It must run inside the click. */
function copyBySelection(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

/* ---------------------------------------------------------------- the glyphs */

const glyph = "col-start-1 row-start-1 size-4 transition-[opacity,scale] duration-(--dur-responsive) ease-responsive";

/** A key that copies `text`, beside an LCD line that shows the command and decodes it back in after the copy. */
export function CopyButton({ text, label = "Copy command", command, className = "" }: CopyButtonProps) {
  const shown = command ?? text;
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const { reduced } = useMotionDial();
  const move = useTransition("responsive");

  const line = useRef<HTMLSpanElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const check = useRef<SVGPathElement>(null);
  const wave = useRef<Wave | null>(null);
  const hold = useRef(0);
  const reducedNow = useRef(reduced);
  reducedNow.current = reduced;

  /* The wave reads its spans from the DOM, so it is built after the spans are, and again if the command changes. */
  useLayoutEffect(() => {
    const el = line.current;
    if (!el) return;
    [...el.children].forEach((c, i) => {
      c.textContent = [...shown][i] ?? "";
      (c as HTMLElement).style.visibility = "";
      (c as HTMLElement).style.opacity = "";
    });
    word.current?.removeAttribute("data-on");
    const w = makeWave(el, () => reducedNow.current, (hidden) => {
      if (hidden) word.current?.setAttribute("data-on", "");
      else word.current?.removeAttribute("data-on");
    });
    wave.current = w;
    return () => {
      w.destroy();
      wave.current = null;
    };
  }, [shown]);

  useEffect(() => () => window.clearTimeout(hold.current), []);

  /* The check draws in when the key says Copied. */
  useEffect(() => {
    const path = check.current;
    if (state !== "copied" || !path) return;
    if (reduced) {
      path.style.strokeDashoffset = "0";
      return;
    }
    const run = animate(path, { strokeDashoffset: [1, 0] }, { ...move, delay: CHECK_DELAY });
    return () => run.stop();
  }, [state, reduced, move]);

  const copied = () => {
    setState("copied");
    wave.current?.hide();
    window.clearTimeout(hold.current);
    hold.current = window.setTimeout(() => {
      setState("idle");
      wave.current?.show();
    }, HOLD_MS);
  };
  const failed = () => {
    const box = line.current;
    if (box) window.getSelection()?.selectAllChildren(box);
    setState("failed");
  };
  const press = () => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(copied, () => (copyBySelection(text) ? copied() : failed()));
    else if (copyBySelection(text)) copied();
    else failed();
  };

  const done = state === "copied";
  return (
    <span className={"inline-flex w-full max-w-lg items-center gap-3 text-body " + className}>
      <button
        type="button"
        aria-label={label}
        onClick={press}
        className={
          "litt-target relative grid size-[2.9em] shrink-0 cursor-pointer select-none place-items-center rounded-control bg-block text-fg shadow-(--key-lift) forced-colors:border " +
          "transition-[background-color,color,translate] duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
          "hover:bg-(--block-hover) active:translate-y-(--press-depth) active:shadow-(--block-press) " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        }
      >
        <span aria-hidden="true" className="grid place-items-center">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round" className={glyph + (done ? " scale-95 opacity-0" : " scale-100 opacity-100")}>
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
            <path d="M10.5 3.5V3A1.5 1.5 0 0 0 9 1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h.5" />
          </svg>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={glyph + (done ? " scale-100 opacity-100" : " scale-95 opacity-0")}>
            <path ref={check} d="m3 8.5 3.2 3L13 4.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1} />
          </svg>
        </span>
      </button>

      <span className="relative flex min-h-[2.9em] min-w-0 flex-1 items-start gap-2 rounded-control bg-field px-3 py-3 font-mono text-small font-normal text-field-ink shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)]">
        <span aria-hidden="true" className="select-none text-field-ink-subtle">
          $
        </span>
        <span className="sr-only">{shown}</span>
        <span className="relative min-w-0 flex-1">
          <span ref={line} aria-hidden="true" className="block break-all whitespace-pre-wrap">
            {[...shown].map((ch, i) => (
              <span key={i} suppressHydrationWarning className="inline-block w-[1ch] text-center whitespace-pre">
                {ch}
              </span>
            ))}
          </span>
          <span
            ref={word}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 opacity-0 transition-opacity duration-(--dur-instant) ease-litt data-[on]:opacity-100"
          >
            Copied
          </span>
        </span>
      </span>

      <span role="status" className="sr-only">
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed. The command is selected; copy it by hand." : ""}
      </span>
    </span>
  );
}
