/**
 * The motion dial: the gallery's tuning instrument.
 *
 * Three tiers (see CONTRIBUTING.md):
 * - instant     hover, press, toggles. A short ease-out tween. Invisible.
 * - responsive  menus, tabs, tooltips, the gliding highlight. A spring, normally no bounce.
 * - expressive  one signature moment per view: dialog, toasts, the list entrance.
 *
 * Components never write durations or springs. They ask the dial through the
 * hooks below, so every component follows the dial (and reduced motion) live.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MotionConfig, useReducedMotion, type Transition } from "motion/react";
import { toCss, type Spring } from "./spring";

export type Tier = "instant" | "responsive" | "expressive";
export type Travel = 4 | 8 | 16 | 24;
export type Dial = {
  instant: number; // ms
  responsive: Spring;
  expressive: Spring;
  stagger: number; // ms between items in an expressive entrance
  travel: Travel; // px, the furthest anything moves on entry (8px grid)
  exit: number; // exits run at this fraction of the enter time, as a tween, never bouncing
};
export type PresetName = "invisible" | "sweet" | "expressive";
/** Corner radius for controls, in px. Surfaces get this plus the 4px inset (concentric). 0 is litt.md v0.3 square. */
export type Radius = 0 | 2 | 4 | 6;
export const surfaceRadius = (r: Radius) => (r === 0 ? 0 : r + 4);

export const PRESETS: Record<PresetName, Dial> = {
  invisible: { instant: 120, responsive: { time: 0.16, bounce: 0 }, expressive: { time: 0.2, bounce: 0 }, stagger: 0, travel: 4, exit: 0.8 },
  sweet: { instant: 100, responsive: { time: 0.2, bounce: 0 }, expressive: { time: 0.35, bounce: 0.12 }, stagger: 40, travel: 16, exit: 0.75 },
  expressive: { instant: 120, responsive: { time: 0.28, bounce: 0.15 }, expressive: { time: 0.5, bounce: 0.25 }, stagger: 60, travel: 24, exit: 0.75 },
};
export const PRESET_LABEL: Record<PresetName, string> = { invisible: "Invisible", sweet: "Sweet spot", expressive: "Expressive" };

/** litt.md's --ease-out as a cubic-bezier array for Motion. */
export const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

type Ctx = {
  dial: Dial;
  preset: PresetName | "custom";
  setPreset: (p: PresetName) => void;
  update: (patch: Partial<Dial>) => void;
  slow: number;
  setSlow: (n: number) => void;
  reducedPreview: boolean;
  setReducedPreview: (b: boolean) => void;
  /** True when the system asks for reduced motion or the preview switch is on. */
  reduced: boolean;
  radius: Radius;
  setRadius: (r: Radius) => void;
};

const DialContext = createContext<Ctx | null>(null);
const STORE = "litt-ui-dial";

function load(): { dial: Dial; preset: PresetName | "custom" } {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || "null");
    if (raw && raw.dial && raw.preset) return raw;
  } catch {
    /* storage can be unavailable; fall back to the sweet spot */
  }
  return { dial: PRESETS.sweet, preset: "sweet" };
}

function sameDial(a: Dial, b: Dial) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function MotionDialProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(load, []);
  const [dial, setDial] = useState<Dial>(initial.dial);
  const [slow, setSlow] = useState(1);
  const [reducedPreview, setReducedPreview] = useState(false);
  const [radius, setRadius] = useState<Radius>(() => {
    try {
      const r = Number(localStorage.getItem("litt-ui-radius"));
      if ([0, 2, 4, 6].includes(r) && localStorage.getItem("litt-ui-radius") !== null) return r as Radius;
    } catch {
      /* ignore */
    }
    return 4;
  });
  const system = useReducedMotion() ?? false;
  const reduced = system || reducedPreview;

  const preset = (Object.keys(PRESETS) as PresetName[]).find((k) => sameDial(PRESETS[k], dial)) ?? "custom";

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ dial, preset }));
    } catch {
      /* ignore */
    }
  }, [dial, preset]);

  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty("--radius-control", `${radius}px`);
    s.setProperty("--radius-surface", `${surfaceRadius(radius)}px`);
    try {
      localStorage.setItem("litt-ui-radius", String(radius));
    } catch {
      /* ignore */
    }
  }, [radius]);

  /* Mirror the dial into CSS variables so CSS-only parts follow it too. */
  useEffect(() => {
    const s = document.documentElement.style;
    const r = toCss(dial.responsive);
    const e = toCss(dial.expressive);
    const z = reduced ? 0 : 1;
    s.setProperty("--dur-instant", `${dial.instant * slow * z}ms`);
    s.setProperty("--ease-responsive", r.easing);
    s.setProperty("--dur-responsive", `${r.duration * slow * z}ms`);
    s.setProperty("--ease-expressive", e.easing);
    s.setProperty("--dur-expressive", `${e.duration * slow * z}ms`);
    s.setProperty("--stagger", `${dial.stagger * slow * z}ms`);
    s.setProperty("--travel", `${dial.travel * z}px`);
  }, [dial, slow, reduced]);

  const value: Ctx = {
    dial,
    preset,
    setPreset: (p) => setDial(PRESETS[p]),
    update: (patch) => setDial((d) => ({ ...d, ...patch })),
    slow,
    setSlow,
    reducedPreview,
    setReducedPreview,
    reduced,
    radius,
    setRadius,
  };

  return (
    <DialContext.Provider value={value}>
      <MotionConfig reducedMotion={reducedPreview ? "always" : "user"}>{children}</MotionConfig>
    </DialContext.Provider>
  );
}

export function useMotionDial() {
  const ctx = useContext(DialContext);
  if (!ctx) throw new Error("useMotionDial must be used inside <MotionDialProvider>");
  return ctx;
}

/** The enter transition for a tier. Pass it to a motion component's `transition`. */
export function useTransition(tier: Tier): Transition {
  const { dial, slow, reduced } = useMotionDial();
  if (reduced) return { duration: 0 };
  if (tier === "instant") return { type: "tween", duration: (dial.instant / 1000) * slow, ease: EASE_OUT };
  const sp = dial[tier];
  return { type: "spring", visualDuration: sp.time * slow, bounce: sp.bounce };
}

/** The exit transition for a tier: quicker than the enter, a plain ease-out tween, never a bounce. */
export function useExit(tier: Tier): Transition {
  const { dial, slow, reduced } = useMotionDial();
  if (reduced) return { duration: 0 };
  const base = tier === "instant" ? dial.instant / 1000 : dial[tier].time;
  return { type: "tween", duration: base * dial.exit * slow, ease: EASE_OUT };
}

/** How far things travel on entry, in px (0 under reduced motion). Use fractions of it, never more. */
export function useTravel(): number {
  const { dial, reduced } = useMotionDial();
  return reduced ? 0 : dial.travel;
}

/** Seconds between items in an expressive entrance (0 under reduced motion). */
export function useStagger(): number {
  const { dial, slow, reduced } = useMotionDial();
  return reduced ? 0 : (dial.stagger / 1000) * slow;
}
