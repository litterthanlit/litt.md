/**
 * Customize, the state: type, shape and neutrals for the whole gallery, chosen in the
 * header's panel (customize.tsx, loaded on first use), on every page. Motion
 * stays in the Playground.
 *
 * The choices are saved in this browser and written on <body>, not <html>:
 * - the locked values stay readable on <html> (useTypefaces, readLocked), so
 *   the panel can always say what differs;
 * - the Playground's motion dial writes its variables on <html> and removes
 *   them when you leave, so the two never undo each other. Everything the
 *   gallery draws sits inside <body>, portals included, so <body> wins.
 * index.html applies the saved choices before first paint; this provider owns
 * them after that.
 */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { useMotionDial } from "@/motion";
import { SHAPES, shapeSurface } from "@/motion/rules";
import { neutralsById, type Neutrals } from "./neutrals";
import { loadTypeface, useTypefaces, type Typeface } from "./typeface";

/** Read by the inline script in index.html too: keep the shape in step with it. */
const KEY = "litt-gallery:customize";
type Saved = { face?: Pick<Typeface, "id" | "stack" | "href">; radius?: number; neutrals?: Neutrals["id"] };

type Ctx = {
  typefaces: Typeface[];
  typeface: Typeface;
  setTypeface: (id: string) => void;
  /** Control radius in px (PILL for the pill), the locked one when nothing is chosen. */
  radius: number;
  lockedRadius: number;
  setRadius: (r: number) => void;
  /** The neutral temperature, a Q9 trial (neutrals.ts). "cool" is the locked one. */
  neutrals: Neutrals;
  setNeutrals: (id: string) => void;
  modified: boolean;
  reset: () => void;
};

const CustomizeContext = createContext<Ctx | null>(null);

function readSaved(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null") as Saved | null;
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

export function CustomizeProvider({ children }: { children: ReactNode }) {
  const typefaces = useTypefaces();
  const { locked } = useMotionDial();
  const [saved] = useState(readSaved);
  const [faceId, setFaceId] = useState(() => (typefaces.some((f) => f.id === saved.face?.id) ? saved.face!.id : "locked"));
  const [radiusTuned, setRadiusTuned] = useState<number | null>(() =>
    (SHAPES as readonly number[]).includes(saved.radius as number) ? (saved.radius as number) : null,
  );

  const [neutralsId, setNeutralsId] = useState(() => neutralsById(saved.neutrals).id);

  const typeface = typefaces.find((f) => f.id === faceId) ?? typefaces[0];
  const radius = radiusTuned ?? locked.radius;
  const neutrals = neutralsById(neutralsId);
  const modified = typeface.id !== "locked" || radiusTuned !== null || neutrals.id !== "cool";

  /* Write the choices on <body>, and remove what is back to locked. A layout effect, so a change never paints stale. */
  useLayoutEffect(() => {
    const s = document.body.style;
    if (typeface.id === "locked") s.removeProperty("--font-sans");
    else {
      loadTypeface(typeface);
      s.setProperty("--font-sans", typeface.stack);
    }
    if (radiusTuned === null) {
      s.removeProperty("--radius-control");
      s.removeProperty("--radius-surface");
    } else {
      s.setProperty("--radius-control", `${radiusTuned}px`);
      s.setProperty("--radius-surface", `${shapeSurface(radiusTuned)}px`);
    }
    if (neutrals.id === "cool") delete document.body.dataset.neutrals;
    else document.body.dataset.neutrals = neutrals.id;
  }, [typeface, radiusTuned, neutrals]);

  /* Remember a change, and only a change, so a later change to tokens.css is never shadowed. */
  useEffect(() => {
    try {
      if (!modified) return localStorage.removeItem(KEY);
      const next: Saved = {};
      if (typeface.id !== "locked") next.face = { id: typeface.id, stack: typeface.stack, href: typeface.href };
      if (radiusTuned !== null) next.radius = radiusTuned;
      if (neutrals.id !== "cool") next.neutrals = neutrals.id;
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage can be unavailable; the choice still applies until the page reloads */
    }
  }, [modified, typeface, radiusTuned, neutrals]);

  const value = useMemo<Ctx>(
    () => ({
      typefaces,
      typeface,
      setTypeface: setFaceId,
      radius,
      lockedRadius: locked.radius,
      setRadius: (r) => setRadiusTuned(r === locked.radius ? null : r),
      neutrals,
      setNeutrals: (id) => setNeutralsId(neutralsById(id).id),
      modified,
      reset: () => {
        setFaceId("locked");
        setRadiusTuned(null);
        setNeutralsId("cool");
      },
    }),
    [typefaces, typeface, radius, locked.radius, neutrals, modified],
  );

  return <CustomizeContext.Provider value={value}>{children}</CustomizeContext.Provider>;
}

export function useCustomize(): Ctx {
  const ctx = useContext(CustomizeContext);
  if (!ctx) throw new Error("useCustomize needs a <CustomizeProvider>");
  return ctx;
}
