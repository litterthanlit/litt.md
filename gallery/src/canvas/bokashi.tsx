/**
 * Bokashi skies: candidate pictures for Flat, moving, compared on the canvas (proposals/bokashi.md). Bokashi is the
 * gradation of a woodblock print: a deep band at the top fading down to pale paper, a second band rising from the
 * horizon, sometimes a red sun. These are an experiment, not components: the ones Nick picks become Flat's pictures
 * in a later change, and this file goes with the canvas.
 *
 * - A sky is paper, two bands and an optional sun, each its own layer. Only a layer's transform moves: a band slides a
 *   little up or down and back, over about half a minute each way. No gradient is animated and the grain never moves
 *   (R2). The colors are CSS named colors, because these are pictures, not the interface.
 * - A picture moving on its own is an exception to R4 that Nick chose for pictures; it is not yet in the profile. So a
 *   sky is still under reduced motion (the motion dial), still while it is off screen, and still when paused: the
 *   Pause button stops every sky where it stands (WCAG 2.2.2).
 */
import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, type AnimationPlaybackControls, type MotionValue } from "motion/react";
import { Button } from "@/components/button";
import { useMotionDial } from "@/motion";

export type Sky = {
  id: string;
  name: string;
  note: string;
  /** The paper, the band at the top, the band at the horizon, and the sun if the sky has one. */
  paper: string;
  deep: string;
  glow: string;
  sun?: string;
};

export const SKIES: Sky[] = [
  { id: "dawn", name: "Dawn", note: "Night blue over salmon, a red sun", paper: "linen", deep: "midnightblue", glow: "lightsalmon", sun: "crimson" },
  { id: "indigo", name: "Indigo", note: "One pigment, from full to water", paper: "aliceblue", deep: "darkslateblue", glow: "lightsteelblue" },
  { id: "persimmon", name: "Persimmon", note: "Brick over pale gold", paper: "oldlace", deep: "firebrick", glow: "navajowhite" },
  { id: "evening", name: "Evening", note: "Violet over coral, a low sun", paper: "lavenderblush", deep: "indigo", glow: "lightcoral", sun: "orangered" },
  { id: "pine", name: "Pine", note: "Deep green over mist", paper: "ivory", deep: "darkslategray", glow: "darkseagreen" },
];

/* How far a layer slides, and how long one way takes, in seconds. Slow enough to notice only if you look. */
const DRIFT = { deep: "9%", glow: "-7%", sun: "-10%" };
const SECONDS = { deep: 34, glow: 27, sun: 41 };

/* Paper grain: fractal noise at 10%, as one still layer over the sky. */
const GRAIN =
  "url(\"data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .1 0'/></filter><rect width='240' height='240' filter='url(#g)'/></svg>",
  ) +
  "\")";

/** Slides a layer from rest to `to` and back, for ever, while `running`; pauses where it stands otherwise. */
function useDrift(value: MotionValue<string>, to: string, seconds: number, running: boolean) {
  const controls = useRef<AnimationPlaybackControls | null>(null);
  useEffect(() => {
    if (!running) {
      controls.current?.pause();
      return;
    }
    if (controls.current) controls.current.play();
    else controls.current = animate(value, ["0%", to], { duration: seconds, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }); // litt-allow: a picture's own slow drift, not a response to a hand (proposals/bokashi.md)
  }, [value, to, seconds, running]);
  useEffect(() => () => controls.current?.stop(), []);
}

/** One sky. `ratio` is its width over its height. It drifts unless `paused`, reduced motion is on, or it is off screen. */
export function Bokashi({ sky, ratio, paused }: { sky: Sky; ratio: number; paused: boolean }) {
  const { reduced } = useMotionDial();
  const frame = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = frame.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setSeen(Boolean(entry?.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const running = seen && !paused && !reduced;
  const deep = useMotionValue("0%");
  const glow = useMotionValue("0%");
  const sun = useMotionValue("0%");
  useDrift(deep, DRIFT.deep, SECONDS.deep, running);
  useDrift(glow, DRIFT.glow, SECONDS.glow, running);
  useDrift(sun, DRIFT.sun, SECONDS.sun, running && Boolean(sky.sun));
  return (
    <div
      ref={frame}
      role="img"
      aria-label={`${sky.name}: ${sky.note}`}
      data-bokashi={sky.id}
      data-running={running ? "" : undefined}
      className="relative isolate w-full overflow-hidden rounded-surface"
      style={{ aspectRatio: String(ratio), background: sky.paper }}
    >
      <motion.div
        aria-hidden="true"
        data-bokashi-layer="deep"
        className="absolute inset-x-0 top-[-20%] h-[85%]"
        style={{ y: deep, background: `linear-gradient(to bottom, ${sky.deep} 0%, ${sky.deep} 24%, transparent 100%)` }}
      />
      <motion.div
        aria-hidden="true"
        data-bokashi-layer="glow"
        className="absolute inset-x-0 bottom-[-20%] h-[70%]"
        style={{ y: glow, background: `linear-gradient(to top, ${sky.glow} 0%, ${sky.glow} 22%, transparent 100%)` }}
      />
      {sky.sun && (
        <motion.div
          aria-hidden="true"
          data-bokashi-layer="sun"
          className="absolute top-[36%] left-[58%] w-[22%] rounded-pill"
          style={{ y: sun, aspectRatio: "1", background: `radial-gradient(circle, ${sky.sun} 0%, ${sky.sun} 60%, transparent 70%)` }}
        />
      )}
      <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}

/** The five skies in a row, as prints (4 to 5), with one button that pauses them all. */
export function BokashiSkies() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-5 gap-5">
        {SKIES.map((sky) => (
          <figure key={sky.id} className="m-0 grid content-start gap-3">
            <Bokashi sky={sky} ratio={0.8} paused={paused} />
            <figcaption className="grid gap-0.5">
              <span className="text-small font-title text-fg">{sky.name}</span>
              <span className="text-caption font-normal text-fg-subtle">{sky.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div>
        <Button size="sm" variant="ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? "Play the skies" : "Pause the skies"}
        </Button>
      </div>
    </div>
  );
}

/** Flat's hero picture, 2.4 to 1: the grey plate it is today, and the Dawn sky in its place. */
export function BokashiHero() {
  const [paused, setPaused] = useState(false);
  const dawn = SKIES[0]!;
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-6">
        <figure className="m-0 grid content-start gap-3">
          <div className="grid w-full place-items-center rounded-surface bg-surface-3 text-caption text-fg-muted" style={{ aspectRatio: "2.4" }}>
            Hero, Bakehouse Nord
          </div>
          <figcaption className="text-small text-fg-subtle">Today</figcaption>
        </figure>
        <figure className="m-0 grid content-start gap-3">
          <Bokashi sky={dawn} ratio={2.4} paused={paused} />
          <figcaption className="text-small text-fg-subtle">As a sky: {dawn.name}</figcaption>
        </figure>
      </div>
      <div>
        <Button size="sm" variant="ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? "Play the sky" : "Pause the sky"}
        </Button>
      </div>
    </div>
  );
}
