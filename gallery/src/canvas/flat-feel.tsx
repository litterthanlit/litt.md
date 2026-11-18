/**
 * Flat, full of feel (Nick, 2026-11-18: "make components full of feel and that cotton candy vibe. vivid."; R10). The
 * moments that would bend an approved call, so they sit here as options for Nick, each light beside dark, each with
 * what someone should feel, which part makes them feel it, and the call it bends. What stays inside the calls shipped
 * (plans/024, Flat, "Flat, full of feel").
 *
 * Every colour is a shipping token under Flat (Candy's --data-* hues and the sunset ramp --data-seq-*): no candidate
 * values. Nothing moves on load or by a timer; every motion answers a hand, on Flat's expressive spring (bounce 0.28)
 * where something arrives and the exit tween where it leaves, and under reduced motion nothing moves at all.
 */
import { useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/button";
import { Empty } from "@/components/states";
import { MaterialProvider, OverlayRoot, useExit, useMotionDial, useTransition } from "@/motion";
import { lookAttributes } from "@/gallery/look";
import { FlatIcon } from "./flat-icons";

/* ---------------------------------------------------------------- the frame */

/** One Flat frame in its own theme. */
function FeelFrame({ dark, children }: { dark: boolean; children: ReactNode }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setEl} {...lookAttributes({ accent: "world", material: "flat" }, dark)} className="relative grid min-h-64 content-start gap-6 rounded-surface bg-canvas p-8 text-fg contain-layout">
      <span className="text-small text-fg-subtle">{dark ? "Dark" : "Light"}</span>
      <MaterialProvider material="flat">
        <OverlayRoot container={el}>
          <div className="grid min-h-40 place-items-center">{children}</div>
        </OverlayRoot>
      </MaterialProvider>
    </div>
  );
}

/** An option: its name, what it should make someone feel (R10), the call it bends, and the part light beside dark. */
function Option({ title, feel, bends, children }: { title: string; feel: string; bends: string; children: () => ReactNode }) {
  return (
    <section className="grid gap-6">
      <header className="grid max-w-[60ch] gap-2">
        <h2 className="text-h3 font-title text-fg">{title}</h2>
        <p className="text-small text-fg">
          <span className="font-label">Feel. </span>
          {feel}
        </p>
        <p className="text-small text-fg-muted">
          <span className="font-label text-fg">Bends. </span>
          {bends}
        </p>
      </header>
      <div className="grid grid-cols-2 gap-6">
        <FeelFrame dark={false}>{children()}</FeelFrame>
        <FeelFrame dark>{children()}</FeelFrame>
      </div>
    </section>
  );
}

/* Candy's eight, in R7's order, each name whole in a string. */
const CANDY = ["var(--data-blue)", "var(--data-amber)", "var(--data-teal)", "var(--data-violet)", "var(--data-rose)", "var(--data-sky)", "var(--data-bubblegum)", "var(--data-sun)"];
const SEQ = ["var(--data-seq-1)", "var(--data-seq-2)", "var(--data-seq-3)", "var(--data-seq-4)"];

/** Tick i of n read off the sunset ramp, as the Gauge's ramp does. */
function rampAt(i: number, n: number) {
  const t = (i / Math.max(1, n - 1)) * 3;
  const k = Math.min(2, Math.floor(t));
  return `color-mix(in oklab, ${SEQ[k + 1]} ${Math.round((t - k) * 100)}%, ${SEQ[k]})`;
}

/** Candy dots out of a point, on a hand only: each flies on the expressive spring and fades on the exit tween. */
function Confetti({ shot, reach = 44 }: { shot: number; reach?: number }) {
  const spring = useTransition("expressive");
  const fade = useExit("expressive");
  const { reduced } = useMotionDial();
  /* The flight on the spring, the fade on the exit tween. */
  const flight = { ...spring, opacity: fade };
  if (reduced || shot === 0) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
      <AnimatePresence>
        {CANDY.concat(CANDY).map((c, i, all) => {
          const a = (i / all.length) * Math.PI * 2 + shot * 0.7;
          const r = reach * (i % 2 ? 0.7 : 1);
          return (
            <motion.span
              key={`${shot}-${i}`}
              className="absolute size-2 rounded-pill"
              style={{ background: c }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
              animate={{ x: Math.cos(a) * r * 1.6, y: Math.sin(a) * r, opacity: 0, scale: 1 }}
              transition={flight}
            />
          );
        })}
      </AnimatePresence>
    </span>
  );
}

/* ---------------------------------------------------------------- 1. welcome confetti */

function SubscribeConfetti() {
  const [shot, setShot] = useState(0);
  const joined = shot % 2 === 1;
  return (
    <div className="grid justify-items-center gap-3">
      <span className="relative">
        <Button variant="primary" aria-pressed={joined} onClick={() => setShot((s) => s + 1)}>
          {joined ? "Subscribed" : "Subscribe"}
        </Button>
        {joined && <Confetti shot={shot} />}
      </span>
      <p className="text-small text-fg-muted" aria-live="polite">
        {joined ? "Welcome, reader 1,205." : "1,204 readers get the letter."}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- 2. a like that pops */

function LikeHeart() {
  const [liked, setLiked] = useState(false);
  const spring = useTransition("expressive");
  const { reduced } = useMotionDial();
  return (
    <div className="flex items-center gap-4">
      <motion.button
        type="button"
        aria-pressed={liked}
        aria-label={`Like Dusk tide, ${liked ? 25 : 24} likes`}
        onClick={() => setLiked((l) => !l)}
        animate={reduced ? undefined : { scale: liked ? [0.7, 1] : 1 }}
        transition={spring}
        className="grid size-11 cursor-pointer place-items-center rounded-pill bg-surface-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        style={{ color: liked ? "var(--data-bubblegum)" : "var(--fg)" } as CSSProperties}
      >
        <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 13.25S2 10 2 6.1a3.1 3.1 0 0 1 6-1.5 3.1 3.1 0 0 1 6 1.5c0 3.9-6 7.15-6 7.15z" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </motion.button>
      <p className="text-small text-fg-muted">
        <span className="font-title tabular-nums text-fg">{liked ? 25 : 24}</span> readers liked Dusk tide
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- 3. progress on the sunset */

function SunsetProgress() {
  const [done, setDone] = useState(7);
  const n = 12;
  return (
    <div className="grid w-full max-w-sm gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-small font-title text-fg">Spring series</span>
        <span className="text-caption tabular-nums text-fg-subtle">
          {done} of {n} pictures
        </span>
      </div>
      <div role="progressbar" aria-label="Spring series" aria-valuemin={0} aria-valuemax={n} aria-valuenow={done} aria-valuetext={`${done} of ${n} pictures`} className="grid grid-cols-12 gap-1">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="h-2 rounded-pill transition-colors duration-(--dur-instant) ease-litt" style={{ background: i < done ? rampAt(i, n) : "color-mix(in oklab, var(--fg) 12%, transparent)" }} />
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setDone((d) => Math.min(n, d + 1))} disabled={done === n}>
          Add a picture
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDone(7)}>
          Reset
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 4. a pill that gives */

function GivingPill() {
  const spring = useTransition("expressive");
  const { reduced } = useMotionDial();
  return (
    <div className="flex flex-wrap items-center gap-3">
      {["Subscribe", "Read the letter", "Not now"].map((label, i) => (
        <motion.span key={label} className="inline-flex" whileTap={reduced ? undefined : { scale: 0.94 }} transition={spring}>
          <Button variant={i === 0 ? "primary" : i === 1 ? "secondary" : "ghost"}>{label}</Button>
        </motion.span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- 5. reactions in Candy */

const REACTIONS = [
  { id: "love", label: "Love it", icon: "Heart", hue: "var(--data-bubblegum)", count: 24 },
  { id: "coffee", label: "Read with coffee", icon: "Coffee", hue: "var(--data-amber)", count: 11 },
  { id: "wow", label: "Wow", icon: "Sparkle", hue: "var(--data-sky)", count: 7 },
  { id: "same", label: "Same here", icon: "Smiley", hue: "var(--data-teal)", count: 5 },
];

function Reactions() {
  const [mine, setMine] = useState<string | null>(null);
  const [shot, setShot] = useState(0);
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="React to Dusk tide">
      {REACTIONS.map((r) => {
        const on = mine === r.id;
        return (
          <button
            key={r.id}
            type="button"
            aria-pressed={on}
            aria-label={`${r.label}, ${r.count + (on ? 1 : 0)}`}
            onClick={() => {
              setMine(on ? null : r.id);
              if (!on) setShot((s) => s + 1);
            }}
            className={"relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-pill px-4 text-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " + (on ? "bg-fg text-canvas" : "bg-surface-1 text-fg")}
          >
            <span className="grid size-5 place-items-center rounded-pill" style={{ background: r.hue, color: "var(--canvas)" }} aria-hidden="true">
              <FlatIcon name={r.icon} size={12} />
            </span>
            <span className="font-title tabular-nums">{r.count + (on ? 1 : 0)}</span>
            {on && <Confetti shot={shot} reach={24} />}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- 6. an empty state that glows */

function SunsetEmpty() {
  return (
    <div className="grid justify-items-center gap-4">
      <div aria-hidden="true" className="grid grid-cols-6 gap-1.5">
        {Array.from({ length: 18 }, (_, i) => {
          const row = Math.floor(i / 6), col = i % 6;
          const lit = col + row >= 3;
          return <span key={i} className="size-4 rounded-pill" style={{ background: lit ? rampAt(Math.min(5, col + row - 3), 6) : "color-mix(in oklab, var(--fg) 8%, transparent)" }} />;
        })}
      </div>
      <Empty title="No reads yet" action={<Button variant="secondary">Write a post</Button>}>
        Your first post's readers will light this up, by the hour.
      </Empty>
    </div>
  );
}

/* ---------------------------------------------------------------- the study */

const OPTIONS: { title: string; feel: string; bends: string; render: () => ReactNode }[] = [
  {
    title: "A · Welcome, in confetti",
    feel: "Joining feels like being welcomed: Subscribe throws a handful of Candy (the eight hues) from under your hand, once, on the 0.28 spring, then it fades.",
    bends: "R7 (colour off the data: a celebratory moment a hand caused). Shipped instead: your avatar joins the readers on #flat/button, colour as who you are.",
    render: () => <SubscribeConfetti />,
  },
  {
    title: "B · A like that pops",
    feel: "Liking a picture feels like a small yes: the heart pops on the 0.28 spring and fills in bubblegum; off keeps its outline (call 7).",
    bends: "R7 (colour as state, not data) and the icon set (a heart outline is Flat icons' trial, not shipped).",
    render: () => <LikeHeart />,
  },
  {
    title: "C · Progress that walks the sunset",
    feel: "Getting through a series feels warmer as it nears the end: each picture done lights its segment at its place on the sunset ramp, as the Gauge's ticks do.",
    bends: "Progress's own rule (one quantity: the ink, never a data hue) and R6's 'what fills is the ink'.",
    render: () => <SunsetProgress />,
  },
  {
    title: "D · A pill that gives under the hand",
    feel: "A press feels soft and alive: the pill dips to 0.94 under the finger and settles back with Flat's bounce, instead of only going a step darker.",
    bends: "Flat's press ('does not move, like pressing paper', phase 3's button caption; --press-depth 0). R4 already allows a press to answer.",
    render: () => <GivingPill />,
  },
  {
    title: "E · Reactions in Candy",
    feel: "A reader answering a post feels heard: each reaction wears its own Candy hue, yours turns ink and gives a little burst.",
    bends: "A new part (Flat's reaction bar from flat-directions), and colour on a control (each reaction's chip). The hue says which reaction, so it is identity, but on chrome.",
    render: () => <Reactions />,
  },
  {
    title: "F · An empty state that glows",
    feel: "An empty dashboard feels like a promise, not a hole: a little field of dots already lit in the sunset says what will be here.",
    bends: "R1 (decoration: the dots are not data yet) and R7.",
    render: () => <SunsetEmpty />,
  },
];

export const FEEL_OPTIONS = OPTIONS.length;

/** One option as its own canvas item. */
export function FlatFeelOption({ index }: { index: number }) {
  const o = OPTIONS[index]!;
  return (
    <Option title={o.title} feel={o.feel} bends={o.bends}>
      {o.render}
    </Option>
  );
}

/** The study's head: what shipped, and what waits here. */
export function FlatFeelIntro() {
  return (
    <section className="grid max-w-[72ch] gap-3">
      <h2 className="text-h3 font-title text-fg">Flat, full of feel: options for Nick</h2>
      <p className="text-small text-fg-muted">
        Shipped inside the calls: the sunset ramp (v1.20) on the Heatmap, Cohort grid and Gauge, which now walks every step; slots six to eight on every data part; a live Subscribe on #flat/button where you join the readers on the 0.28 spring; and #flat/about in Flat's voice with Candy on its first screen. The six below would each bend an approved call, so they wait for you. Every colour is a shipping token; nothing moves without a hand.
      </p>
    </section>
  );
}
