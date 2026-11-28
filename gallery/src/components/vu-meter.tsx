/**
 * VuMeter, a Flat part (the Flat studies, VU meter): a level meter for a mic check, with no needles. On one white paper
 * the level stands as the large figure ("−12 dB"), its meaning in words beside it ("Good level"), and a pill bar per
 * channel that fills with the ink, with a peak mark that holds and falls.
 *
 * - The host feeds `levels`, one per channel, as linear amplitude where 1 reads 0 dB. The bars read −30 to +3 dB.
 * - Ballistics: the VU standard's. A 60ms detector follows the signal, and the bar is a spring on it (stiffness 166,
 *   damping 20.2: 99% of a steady tone in about 300ms, about 1.5% overshoot), so speech reads steadily and a click
 *   never pins it. These are a meter's physics, not interface motion, so they keep their numbers. The peak mark holds
 *   900ms and then falls 12 dB a second.
 * - The figure and the word change ten times a second, so they can be read. The word reads the last second and a half:
 *   "Waiting for sound" under −26 dB, "A little quiet" under −16, "Good level", and "Too loud" for 600ms after anything
 *   over +3 dB, in the danger colour. Each new word is said once in a polite status.
 * - The loop runs only while there is something to show (a level, or a bar or a mark still falling), and only on screen.
 *   Under reduced motion the bars and the mark show each level at once, with no ballistics.
 * - Semantics: a group named by `label`, whose figure and word are its description; the bars are hidden from a screen
 *   reader, since they repeat the figure.
 */
import { useEffect, useId, useRef, useState } from "react";
import { useMotionDial } from "@/motion";

export type VuMeterProps = {
  /** One level per channel, as linear amplitude: 1 reads 0 dB, 0 is silence. */
  levels: number[];
  /** The channels' short names, beside their bars. Default L and R. */
  channels?: string[];
  /** What it measures, over the word ("Mic check"). It names the group too. */
  label?: string;
  className?: string;
};

const FLOOR = -30;
const TOP = 3;
const FULL = 10 ** (TOP / 20);
const RELEASE = 0.06;
const STIFF = 166;
const DAMP = 20.2;
const STEP = 1 / 480;
const HOLD = 900;
const FALL = 12;
const LOUD_FOR = 600;
const READ_EVERY = 100;

const db = (lin: number) => (lin > 0 ? 20 * Math.log10(lin) : -Infinity);
const pos = (d: number) => Math.min(1, Math.max(0, (d - FLOOR) / (TOP - FLOOR)));
const fmt = (d: number) => (d < -0.5 ? "−" : "") + Math.abs(Math.round(d));
const clipOf = (p: number) => `inset(0 ${((1 - p) * 100).toFixed(3)}% 0 0 round 999px)`;

type Word = "quiet" | "low" | "good" | "loud";
const WORDS: Record<Word, string> = { quiet: "Waiting for sound", low: "A little quiet", good: "Good level", loud: "Too loud" };

/** A level meter with VU ballistics: the level as a figure and in words, and a pill bar per channel. A Flat part. */
export function VuMeter({ levels, channels = ["L", "R"], label = "Mic check", className = "" }: VuMeterProps) {
  const { reduced } = useMotionDial();
  const described = useId();
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const marks = useRef<(HTMLSpanElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef(levels);
  input.current = levels;
  const [figure, setFigure] = useState(FLOOR);
  const [word, setWord] = useState<Word>("quiet");
  const [said, setSaid] = useState("");
  const st = useRef({ env: [] as number[], x: [] as number[], v: [] as number[], peak: [] as number[], peakAt: [] as number[], recent: [] as number[], loudUntil: 0, lastRead: 0, word: "quiet" as Word, frame: 0, onScreen: true });

  const paint = (c: number, deflection: number, peakDb: number) => {
    const f = fills.current[c];
    const m = marks.current[c];
    if (f) f.style.clipPath = clipOf(pos(db(Math.max(0, deflection) * FULL)));
    if (m) {
      m.style.transform = `translateX(${(pos(peakDb) * 100).toFixed(3)}%)`;
      m.style.opacity = peakDb > FLOOR + 1 ? "1" : "0";
    }
  };

  /* One loop: the detector, the ballistics, the peak marks, and ten times a second the figure and the word. */
  const tick = (now: number, dt: number) => {
    const s = st.current;
    const n = channels.length;
    let busy = false;
    let loudest = 0;
    for (let c = 0; c < n; c++) {
      const level = Math.max(0, input.current[c] ?? 0);
      s.env[c] = Math.max(level, (s.env[c] ?? 0) * Math.exp(-dt / RELEASE));
      const target = s.env[c] / FULL;
      if (reduced) {
        s.x[c] = target;
        s.v[c] = 0;
      } else {
        let x = s.x[c] ?? 0;
        let v = s.v[c] ?? 0;
        for (let left = dt; left > 0; left -= STEP) {
          const h = Math.min(STEP, left);
          v += (STIFF * (target - x) - DAMP * v) * h;
          x += v * h;
        }
        s.x[c] = x;
        s.v[c] = v;
      }
      if (level > FULL) s.loudUntil = now + LOUD_FOR;
      const d = db(Math.max(0, s.x[c]) * FULL);
      const peak = s.peak[c] ?? FLOOR;
      if (d >= peak || reduced) {
        s.peak[c] = Math.max(FLOOR, d);
        s.peakAt[c] = now;
      } else if (now - (s.peakAt[c] ?? 0) > HOLD) s.peak[c] = Math.max(d, peak - FALL * dt);
      paint(c, s.x[c], s.peak[c]);
      loudest = Math.max(loudest, s.x[c]);
      if (level > 0 || s.env[c] > 1e-4 || Math.abs(s.x[c]) > 1e-4 || (s.peak[c] ?? FLOOR) > FLOOR + 0.1) busy = true;
    }
    if (now - s.lastRead >= READ_EVERY) {
      s.lastRead = now;
      const d = Math.max(FLOOR, db(loudest * FULL));
      setFigure(d);
      s.recent.push(d);
      if (s.recent.length > 15) s.recent.shift();
      const avg = s.recent.reduce((a, b) => a + b, 0) / s.recent.length;
      const next: Word = now < s.loudUntil ? "loud" : avg < -26 ? "quiet" : avg < -16 ? "low" : "good";
      if (next !== s.word) {
        s.word = next;
        setWord(next);
        setSaid(WORDS[next]);
      }
    }
    return busy || now < s.loudUntil;
  };

  /* Off screen it stops. */
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      st.current.onScreen = e.isIntersecting;
      if (e.isIntersecting) wake();
    });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wake = () => {
    const s = st.current;
    if (s.frame || !s.onScreen) return;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const busy = tick(now, dt);
      s.frame = busy && s.onScreen ? requestAnimationFrame(frame) : 0;
    };
    s.frame = requestAnimationFrame(frame);
  };
  /* A new level wakes the loop; it sleeps again once everything has fallen. */
  useEffect(() => {
    if (levels.some((l) => l > 0) || st.current.peak.some((p) => p > FLOOR + 0.1)) wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels]);
  useEffect(() => () => cancelAnimationFrame(st.current.frame), []);

  const loud = word === "loud";
  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      aria-describedby={described}
      className={"litt-paper grid w-full max-w-sm min-w-0 gap-4 rounded-surface bg-surface-1 p-5 text-fg select-none forced-colors:border " + className}
    >
      <div className="flex items-end justify-between gap-4">
        <span aria-hidden="true" className="text-figure-lg leading-none whitespace-nowrap tabular-nums">
          {fmt(figure)}
          <small className="ms-1 text-body font-label text-fg-muted">dB</small>
        </span>
        <span aria-hidden="true" className="grid justify-items-end gap-0.5 text-end">
          <span className="text-small text-fg-muted">{label}</span>
          <b className={"text-body font-label " + (loud ? "text-danger" : word === "good" ? "text-fg" : "text-fg-muted")}>{WORDS[word]}</b>
        </span>
      </div>
      <div aria-hidden="true" className="grid gap-2">
        {channels.map((name, c) => (
          <div key={name} className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-2 text-small text-fg-muted">
            <span>{name}</span>
            <span className="relative h-4 overflow-hidden rounded-pill bg-block forced-colors:border">
              <span
                ref={(el) => {
                  fills.current[c] = el;
                }}
                className="absolute inset-0 rounded-pill bg-fg forced-colors:bg-[CanvasText]"
                style={{ clipPath: clipOf(0) }}
              />
              <span className="absolute inset-y-1 inset-x-1">
                <span
                  ref={(el) => {
                    marks.current[c] = el;
                  }}
                  className="absolute inset-y-0 left-0 w-full opacity-0"
                >
                  <span className="absolute inset-y-0 -left-0.5 w-1 rounded-pill bg-fg forced-colors:bg-[CanvasText]" />
                </span>
              </span>
            </span>
          </div>
        ))}
      </div>
      <p id={described} className="sr-only">
        {fmt(figure)} dB. {WORDS[word]}.
      </p>
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
