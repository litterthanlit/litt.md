/**
 * Agent indicator, the Flat body (plans/027): what an agent is doing, reduced to pure geometry and color.
 * No hardware box, no frame, no border and no shadow — just six compact mechanisms in one consistent 64px by 32px
 * inline space (`w-16 h-8`):
 * - thinking: 3 violet circles (`--data-violet`) rising and falling in sequence
 * - searching: 4 sky vertical pill bars (`--data-sky`) scanning left-to-right
 * - reading: 3 teal horizontal pill lines (`--data-teal`) sweeping in reading rhythm
 * - reasoning: 3x3 blue circle grid (`--data-blue`) lighting in a diagonal wave
 * - running: 4 horizontal step pills walking Flat's sunset ramp (`--data-seq-1..4`)
 * - writing: an expanding bubblegum pill stroke with a lively dot caret (`--data-bubblegum`)
 *
 * Motion: every live indicator shares one requestAnimationFrame loop that stops when none is live, when `paused` is
 * true, when off screen, or under reduced motion (`useMotionDial().reduced`). On mount each mechanism draws a crisp
 * mid-motion snapshot before first paint, so paused and reduced-motion states stay expressive with zero animation.
 * Phase changes crossfade smoothly on `useTransition("expressive")` (instant under reduced motion).
 */
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AGENT_PHASES, type AgentIndicatorProps, type AgentPhase } from "@/components/agent-indicator";
import { useMotionDial, useTransition } from "@/motion";

/* ----------------------------------------------------------------- shared animation loop */

type DrawFn = (t: number) => void;
type MakeSim = (root: HTMLElement) => { preroll: number; draw: DrawFn };

const runners = new Set<(dt: number) => void>();
let rafId = 0;
let lastNow = 0;

function tick(now: number) {
  const dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000));
  lastNow = now;
  runners.forEach((run) => run(dt));
  rafId = runners.size ? requestAnimationFrame(tick) : 0;
}

function join(run: (dt: number) => void) {
  runners.add(run);
  if (!rafId) {
    lastNow = performance.now();
    rafId = requestAnimationFrame(tick);
  }
  return () => {
    runners.delete(run);
    if (!runners.size && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}

/** Writes an attribute only when its string value changes. */
const attr = (el: Element, name: string) => {
  let prev = "";
  return (v: string) => {
    if (v !== prev) {
      prev = v;
      el.setAttribute(name, v);
    }
  };
};

/** Writes transform/opacity inline styles only when their string value changes. */
const styleProp = (el: HTMLElement, prop: "transform" | "opacity") => {
  let prev = "";
  return (v: string) => {
    if (v !== prev) {
      prev = v;
      el.style[prop] = v;
    }
  };
};

const qa = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => Array.from(root.querySelectorAll<T>(sel));

/** Runs a mechanism's direct-DOM loop only while `live` is true; draws its static mid-motion frame before paint. */
function useFlatSim(make: MakeSim, live: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef<{ t: number; draw: DrawFn } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sim = make(el);
    sim.draw(sim.preroll);
    state.current = { t: sim.preroll, draw: sim.draw };
    return () => {
      state.current = null;
    };
  }, [make]);

  useEffect(() => {
    if (!live) return;
    return join((dt) => {
      const s = state.current;
      if (!s) return;
      s.t += dt;
      s.draw(s.t);
    });
  }, [live]);

  return ref;
}

/* ----------------------------------------------------------------- 1. thinking (violet circles) */

const makeThinking: MakeSim = (root) => {
  const dots = qa(root, "[data-dot]").map((el) => ({
    transform: styleProp(el, "transform"),
    opacity: styleProp(el, "opacity"),
  }));
  return {
    preroll: 0.35,
    draw(t) {
      for (let i = 0; i < dots.length; i++) {
        const wave = Math.sin(t * 4.4 - i * 0.85);
        const unit = (wave + 1) * 0.5;
        const y = (-wave * 4.5).toFixed(2);
        const sc = (0.88 + 0.16 * unit).toFixed(3);
        dots[i]!.transform(`translate3d(0, ${y}px, 0) scale(${sc})`);
        dots[i]!.opacity((0.52 + 0.48 * unit).toFixed(2));
      }
    },
  };
};

function ThinkingFlat({ live }: { live: boolean }) {
  const ref = useFlatSim(makeThinking, live);
  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          data-dot=""
          data-part="circle"
          className="size-2.5 shrink-0 rounded-pill forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]"
          style={{ backgroundColor: "var(--data-violet)" }}
        />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- 2. searching (sky vertical pills) */

const makeSearching: MakeSim = (root) => {
  const bars = qa(root, "[data-bar]").map((el) => ({
    transform: styleProp(el, "transform"),
    opacity: styleProp(el, "opacity"),
  }));
  return {
    preroll: 0.52,
    draw(t) {
      const pos = (t * 2.4) % 4;
      for (let i = 0; i < bars.length; i++) {
        const raw = Math.abs(i - pos);
        const d = Math.min(raw, 4 - raw);
        const beam = Math.exp(-d * d * 1.4);
        const sy = (0.42 + 0.58 * beam).toFixed(3);
        bars[i]!.transform(`scaleY(${sy})`);
        bars[i]!.opacity((0.34 + 0.66 * beam).toFixed(2));
      }
    },
  };
};

function SearchingFlat({ live }: { live: boolean }) {
  const ref = useFlatSim(makeSearching, live);
  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          data-bar=""
          data-part="mark"
          className="h-5 w-1.5 shrink-0 origin-center rounded-pill forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]"
          style={{ backgroundColor: "var(--data-sky)" }}
        />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- 3. reading (teal horizontal pill lines) */

const LINE_WIDTHS = ["w-10", "w-12", "w-8"] as const;

const makeReading: MakeSim = (root) => {
  const lines = qa(root, "[data-line]").map((el) => ({
    transform: styleProp(el, "transform"),
    opacity: styleProp(el, "opacity"),
  }));
  return {
    preroll: 1.65,
    draw(t) {
      const cycle = (t * 0.9) % 3;
      for (let i = 0; i < lines.length; i++) {
        const delta = (cycle - i + 3) % 3;
        let level = 0;
        if (delta < 1) {
          level = 0.5 - 0.5 * Math.cos(Math.PI * delta);
        } else if (delta < 2) {
          level = 0.5 + 0.5 * Math.cos(Math.PI * (delta - 1));
        }
        const sx = (0.46 + 0.54 * level).toFixed(3);
        lines[i]!.transform(`scaleX(${sx})`);
        lines[i]!.opacity((0.35 + 0.65 * level).toFixed(2));
      }
    },
  };
};

function ReadingFlat({ live }: { live: boolean }) {
  const ref = useFlatSim(makeReading, live);
  return (
    <div ref={ref} className="grid h-full w-12 content-center gap-1.5">
      {LINE_WIDTHS.map((width, i) => (
        <span
          key={i}
          data-line=""
          data-part="mark"
          className={"block h-1.5 origin-left rounded-pill forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none] " + width}
          style={{ backgroundColor: "var(--data-teal)" }}
        />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- 4. reasoning (blue 3x3 diagonal wave) */

const CELLS = Array.from({ length: 9 }, (_, i) => ({ r: Math.floor(i / 3), c: i % 3 }));

const makeReasoning: MakeSim = (root) => {
  const dots = qa(root, "[data-cell]").map((el, i) => ({
    diag: CELLS[i]!.r + CELLS[i]!.c,
    transform: styleProp(el, "transform"),
    opacity: styleProp(el, "opacity"),
  }));
  return {
    preroll: 0.85,
    draw(t) {
      for (const dot of dots) {
        const wave = 0.5 + 0.5 * Math.sin(t * 4.0 - dot.diag * 0.9);
        const sc = (0.76 + 0.34 * wave).toFixed(3);
        dot.transform(`scale(${sc})`);
        dot.opacity((0.22 + 0.78 * wave).toFixed(2));
      }
    },
  };
};

function ReasoningFlat({ live }: { live: boolean }) {
  const ref = useFlatSim(makeReasoning, live);
  return (
    <div ref={ref} className="grid h-full w-full place-items-center">
      <div className="grid grid-cols-3 gap-1">
        {CELLS.map((_, i) => (
          <span
            key={i}
            data-cell=""
            data-part="circle"
            className="size-1.5 rounded-pill forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]"
            style={{ backgroundColor: "var(--data-blue)" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- 5. running (sunset ramp step pills) */

/* Literal CSS variable strings so gen-registry renames every sequential token cleanly for host installs. */
const RUN_STEPS = ["var(--data-seq-1)", "var(--data-seq-2)", "var(--data-seq-3)", "var(--data-seq-4)"] as const;

const makeRunning: MakeSim = (root) => {
  const pills = qa(root, "[data-step]").map((el) => ({
    transform: styleProp(el, "transform"),
    opacity: styleProp(el, "opacity"),
  }));
  return {
    preroll: 0.88,
    draw(t) {
      const pos = (t * 2.5) % 4;
      for (let i = 0; i < pills.length; i++) {
        const raw = Math.abs(i - pos);
        const d = Math.min(raw, 4 - raw);
        const lit = Math.exp(-d * d * 1.5);
        const sc = (0.9 + 0.22 * lit).toFixed(3);
        pills[i]!.transform(`scale(${sc})`);
        pills[i]!.opacity((0.28 + 0.72 * lit).toFixed(2));
      }
    },
  };
};

function RunningFlat({ live }: { live: boolean }) {
  const ref = useFlatSim(makeRunning, live);
  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center gap-1">
      {RUN_STEPS.map((color, i) => (
        <span
          key={i}
          data-step=""
          data-part="mark"
          className="h-2 w-2.5 shrink-0 rounded-pill forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- 6. writing (bubblegum stroke + caret) */

const makeWriting: MakeSim = (root) => {
  const stroke = root.querySelector("[data-stroke]")!;
  const caret = root.querySelector("[data-caret]")!;
  const setWidth = attr(stroke, "width");
  const setCx = attr(caret, "cx");
  const setR = attr(caret, "r");
  const setCaretOpacity = attr(caret, "opacity");

  return {
    preroll: 0.72,
    draw(t) {
      const u = 0.5 - 0.5 * Math.cos(t * 2.4);
      const w = 10 + 22 * u;
      const pulse = 0.5 + 0.5 * Math.sin(t * 6.0);
      setWidth(w.toFixed(2));
      setCx((2 + w + 6).toFixed(2));
      setR((2.6 + 0.6 * pulse).toFixed(2));
      setCaretOpacity((0.55 + 0.45 * pulse).toFixed(2));
    },
  };
};

function WritingFlat({ live }: { live: boolean }) {
  const ref = useFlatSim(makeWriting, live);
  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center">
      <svg viewBox="0 0 48 16" className="h-4 w-12 overflow-visible" aria-hidden="true">
        <rect
          data-stroke=""
          data-part="mark"
          x="2"
          y="5"
          width="22"
          height="6"
          rx="3"
          fill="var(--data-bubblegum)"
          className="forced-colors:fill-[CanvasText]"
        />
        <circle
          data-caret=""
          data-part="circle"
          cx="30"
          cy="8"
          r="3"
          fill="var(--data-bubblegum)"
          className="forced-colors:fill-[CanvasText]"
        />
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------- registry + export */

const FLAT_DRAW: Record<AgentPhase, ComponentType<{ live: boolean }>> = {
  thinking: ThinkingFlat,
  searching: SearchingFlat,
  reading: ReadingFlat,
  reasoning: ReasoningFlat,
  running: RunningFlat,
  writing: WritingFlat,
};

function IdleFlat() {
  return (
    <span className="flex h-full w-full items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          data-part="circle"
          className="size-1.5 shrink-0 rounded-pill bg-slot forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]"
        />
      ))}
    </span>
  );
}

/** Flat body for AgentIndicator: six pure geometric mechanisms in one compact frameless canvas. */
export function AgentIndicatorFlat({ phase, paused = false, label, className = "" }: AgentIndicatorProps) {
  const { reduced } = useMotionDial();
  const expressive = useTransition("expressive");
  const box = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => entry && setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const live = !!phase && !paused && !reduced && visible;
  const words = label ?? AGENT_PHASES.find((p) => p.phase === phase)?.words;
  const Draw = phase ? FLAT_DRAW[phase] : null;

  return (
    <span
      ref={box}
      role="status"
      data-body="flat"
      data-agent-indicator=""
      data-phase={phase ?? undefined}
      className={"relative inline-grid h-8 w-16 shrink-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center align-middle " + className}
    >
      {words && <span className="sr-only">{words}</span>}
      {reduced ? (
        <span
          key={phase ?? "idle"}
          aria-hidden="true"
          data-layer={phase ?? "idle"}
          className="col-start-1 row-start-1 grid h-full w-full place-items-center"
        >
          {Draw ? <Draw live={false} /> : <IdleFlat />}
        </span>
      ) : (
        <AnimatePresence initial={false}>
          <motion.span
            key={phase ?? "idle"}
            aria-hidden="true"
            data-layer={phase ?? "idle"}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={expressive}
            className="col-start-1 row-start-1 grid h-full w-full place-items-center"
          >
            {Draw ? <Draw live={live} /> : <IdleFlat />}
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
}
