/**
 * The look of the page, strict (plans/019): each world is closed, so a page in a world (#device, #device/button) shows
 * that world alone, in its own accent, face, shape and Calm, and every other page shows the gallery's, Flat. Nothing is
 * chosen: there is no Customize panel, nothing saved and no link's look applied. The material follows the address
 * (worldOfHash in look.ts), on <html> like data-theme, which index.html paints first.
 *
 * The context keeps the shape the Customize panel had (type, shape, the look, a link), so look.ts's looks, their links
 * and the sentences they produce can come back with it; today every setter but the theme is a no-op and every value is
 * the world's own.
 *
 * The theme stays a choice (light, dark or the system's): data-theme on <html>, under its own key, as the pre-paint
 * script reads it.
 */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { LIMITS, PILL } from "@/motion/rules";

/* Rack opens square (tokens.css): its --radius-control, one of SHAPES. */
const RACK_RADIUS = 2;
import { GALLERY_LOOK, materialOf, worldOfHash, type Look } from "./look";
import { useTypefaces, type Typeface } from "./typeface";

/**
 * A theme, accent, material or shape switch is instant (foundations.md, Motion): every hover fade on the page would
 * otherwise run at once. Transitions are off while the change is written and the styles are worked out, then back on.
 */
function instantly(change: () => void) {
  const off = document.createElement("style");
  off.textContent = "*,*::before,*::after{transition:none!important}"; // litt-allow: turns every transition off for the one frame a theme is written
  document.head.append(off);
  change();
  void getComputedStyle(document.body).color; // work the new styles out while nothing transitions
  off.remove();
}
export type ThemeChoice = "system" | "light" | "dark";
const THEME_KEY = "litt-gallery:theme";

type Ctx = {
  /** Light, dark or the system's, on <html> as data-theme. */
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
  typefaces: Typeface[];
  typeface: Typeface;
  setTypeface: (id: string) => void;
  /** Control radius in px (PILL for the pill), the locked one when nothing is chosen. */
  radius: number;
  lockedRadius: number;
  setRadius: (r: number) => void;
  /** The accent and motion every page shows: the link's while the address names one, else your own. */
  look: Look;
  /** The one write for the accent and motion. During a preview it keeps the link's look first, then applies the patch. */
  setLook: (patch: Partial<Look>) => void;
  /** Set only while the address names a look that differs from your own. */
  link: LinkedLook | null;
  /** Whether anything shown differs from the gallery's defaults. */
  modified: boolean;
  /** Type, shape and your look back to the gallery's defaults, and the end of any preview. */
  reset: () => void;
};

/** A look from the address: keep it (it becomes yours, saved), or drop it (out of the address, back to yours). */
export type LinkedLook = { look: Look; keep: () => void; drop: () => void };

const CustomizeContext = createContext<Ctx | null>(null);

export function CustomizeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(() => {
    const t = document.documentElement.getAttribute("data-theme");
    return t === "light" || t === "dark" ? t : "system";
  });
  const setTheme = (t: ThemeChoice) => {
    setThemeState(t);
    instantly(() => {
      if (t === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
    });
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* ignore */
    }
  };

  /* The world the address is in, and nothing else. */
  const [material, setMaterial] = useState(() => worldOfHash(location.hash));
  useEffect(() => {
    const read = () => setMaterial(worldOfHash(location.hash));
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, []);
  const look = useMemo<Look>(() => ({ ...GALLERY_LOOK, material }), [material]);

  /* The world's own face and shape: Flat at the Pill, Plain and Heat square, Rack at 2px, Press and Device at litt's
     control radius, all from tokens.css with nothing written. */
  const typefaces = useTypefaces(material);
  const typeface = typefaces[0]!;
  const lockedRadius = material === "flat" ? PILL : material === "plain" || material === "heat" ? 0 : material === "rack" ? RACK_RADIUS : LIMITS.control;

  /* Only the material is written, on <html>; whatever an older visit left on <body> or <html> is taken off. */
  useLayoutEffect(() => instantly(() => {
    document.documentElement.style.removeProperty("--font-choice");
    document.body.style.removeProperty("--radius-control");
    document.body.style.removeProperty("--radius-surface");
    delete document.body.dataset.accent;
    const attribute = materialOf(material).attribute;
    if (attribute) document.documentElement.dataset.material = attribute;
    else delete document.documentElement.dataset.material;
  }), [material]);

  const value = useMemo<Ctx>(
    () => ({
      theme,
      setTheme,
      typefaces,
      typeface,
      setTypeface: () => {},
      radius: lockedRadius,
      lockedRadius,
      setRadius: () => {},
      look,
      setLook: () => {},
      link: null,
      modified: false,
      reset: () => {},
    }),
    /* setTheme only writes state, <html> and storage, so the first one stays good. */
    [theme, typefaces, typeface, lockedRadius, look],
  );

  return <CustomizeContext.Provider value={value}>{children}</CustomizeContext.Provider>;
}

export function useCustomize(): Ctx {
  const ctx = useContext(CustomizeContext);
  if (!ctx) throw new Error("useCustomize needs a <CustomizeProvider>");
  return ctx;
}

/** Whether the page is dark right now: the theme choice, or the system's when the choice is System. */
export function useDark(): boolean {
  const { theme } = useCustomize();
  const [systemDark, setSystemDark] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSystemDark(media.matches);
    media.addEventListener("change", on);
    return () => media.removeEventListener("change", on);
  }, []);
  return theme === "system" ? systemDark : theme === "dark";
}

