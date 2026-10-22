/**
 * Customize, the state: type, shape and motion's feel for the whole gallery,
 * chosen in the header's panel (customize.tsx, loaded on first use), on every
 * page. The motion dial stays in the Playground; the feel is fun mode's trial
 * (motion/fun.tsx), Calm (the locked motion) or Fun, and needs no CSS: it is a
 * <FunMode> around the gallery.
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
import { FunMode, useMotionDial } from "@/motion";
import { SHAPES, shapeSurface } from "@/motion/rules";
import { loadTypeface, useTypefaces, type Typeface } from "./typeface";

/** Read by the inline script in index.html too: keep the shape in step with it. */
const KEY = "litt-gallery:customize";
type Saved = { face?: Pick<Typeface, "id" | "stack" | "href">; radius?: number; fun?: boolean };

type Ctx = {
  typefaces: Typeface[];
  typeface: Typeface;
  setTypeface: (id: string) => void;
  /** Control radius in px (PILL for the pill), the locked one when nothing is chosen. */
  radius: number;
  lockedRadius: number;
  setRadius: (r: number) => void;
  /** Fun mode's trial: Calm is the locked motion, Fun turns on <FunMode>. */
  fun: boolean;
  setFun: (on: boolean) => void;
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

  const [fun, setFun] = useState(saved.fun === true);

  const typeface = typefaces.find((f) => f.id === faceId) ?? typefaces[0];
  const radius = radiusTuned ?? locked.radius;
  const modified = typeface.id !== "locked" || radiusTuned !== null || fun;

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
  }, [typeface, radiusTuned]);

  /* Remember a change, and only a change, so a later change to tokens.css is never shadowed. */
  useEffect(() => {
    try {
      if (!modified) return localStorage.removeItem(KEY);
      const next: Saved = {};
      if (typeface.id !== "locked") next.face = { id: typeface.id, stack: typeface.stack, href: typeface.href };
      if (radiusTuned !== null) next.radius = radiusTuned;
      if (fun) next.fun = true;
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage can be unavailable; the choice still applies until the page reloads */
    }
  }, [modified, typeface, radiusTuned, fun]);

  const value = useMemo<Ctx>(
    () => ({
      typefaces,
      typeface,
      setTypeface: setFaceId,
      radius,
      lockedRadius: locked.radius,
      setRadius: (r) => setRadiusTuned(r === locked.radius ? null : r),
      fun,
      setFun,
      modified,
      reset: () => {
        setFaceId("locked");
        setRadiusTuned(null);
        setFun(false);
      },
    }),
    [typefaces, typeface, radius, locked.radius, fun, modified],
  );

  return (
    <CustomizeContext.Provider value={value}>
      <FunMode on={fun}>{children}</FunMode>
    </CustomizeContext.Provider>
  );
}

export function useCustomize(): Ctx {
  const ctx = useContext(CustomizeContext);
  if (!ctx) throw new Error("useCustomize needs a <CustomizeProvider>");
  return ctx;
}
