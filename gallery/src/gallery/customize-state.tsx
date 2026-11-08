/**
 * Customize, the state: type, shape, the accent and motion's feel for the whole gallery,
 * chosen in the header's panel (customize.tsx, loaded on first use), on every
 * page. The motion dial stays in the Playground; the feel is fun mode's trial
 * (motion/fun.tsx), Calm (the locked motion) or Fun, and needs no CSS: it is a
 * <FunMode> around the gallery.
 *
 * The accent is the world's own by default (R6, proposals/worlds.md decision 14): tokens.css with no attribute answers
 * Press with Blue 4, Flat with the ink and Device with orange, so the gallery, which opens in Flat, opens in the ink and
 * a visitor meets the material before the color. Blue 4, Monochrome or Pink asked for is data-accent="blue", "mono" or
 * "pink" on <body> (none where it is the world's own), and it stays asked for as you move between worlds.
 *
 * The choices are saved in this browser and written on <body>, not <html>:
 * - the locked values stay readable on <html> (readLocked), so the panel can always say what differs;
 * - the Playground's motion dial writes its variables on <html> and removes
 *   them when you leave, so the two never undo each other. Everything the
 *   gallery draws sits inside <body>, portals included, so <body> wins.
 * The face is the exception: it is --font-choice on <html>, which every world's face reads first (tokens.css), so it
 * reaches <html>'s own font and every frame that shows another world.
 * index.html applies the saved choices before first paint; this provider owns
 * them after that.
 *
 * A link can carry a look (?look=pink-fun, look.ts). Two stores, one per writer, merged where they are read: your own
 * look lives in storage, and the link's lives in the address and is never saved. While the address names a look that
 * differs from yours, every page shows it. Keep this look saves it, Back to mine takes it out of the address, and any
 * accent or motion change keeps it first, then applies the change and saves.
 *
 * The theme lives here too, so the header's switch and the overview's deck are one choice. It is the exception to
 * <body>: data-theme goes on <html>, under its own key, as the pre-paint script reads it.
 *
 * The material is the other exception: Flat is data-material="flat" on <html> (Press is no attribute), since it
 * changes the canvas as the theme does, and the Playground's dial never touches the neutrals. It is saved with the
 * other choices and is part of the look. The gallery opens in Flat; the registry ships Press (Q17).
 */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { FunMode } from "@/motion";
import { LIMITS, PILL, SHAPES, shapeSurface } from "@/motion/rules";
import { accentAttribute, ACCENTS, GALLERY_LOOK, lookFromSearch, materialOf, MATERIALS, sameLook, withLook, type Accent, type Look, type Material } from "./look";
import { FACES, loadTypeface, useTypefaces, type Typeface } from "./typeface";

/** Read by the inline script in index.html too: keep the shape in step with it. */
const KEY = "litt-gallery:customize";

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
const ACCENT_IDS = ACCENTS.map((a) => a.id);
const MATERIAL_IDS = MATERIALS.map((m) => m.id);
export type ThemeChoice = "system" | "light" | "dark";
const THEME_KEY = "litt-gallery:theme";
type Saved = { face?: Pick<Typeface, "id" | "stack" | "href">; radius?: number; accent?: Accent; material?: Material; fun?: boolean };

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

function readSaved(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null") as Saved | null;
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

export function CustomizeProvider({ children }: { children: ReactNode }) {
  const [saved] = useState(readSaved);
  const [faceId, setFaceId] = useState(() => (FACES.some((f) => f.id === saved.face?.id) ? saved.face!.id : "locked"));
  const [radiusTuned, setRadiusTuned] = useState<number | null>(() =>
    (SHAPES as readonly number[]).includes(saved.radius as number) ? (saved.radius as number) : null,
  );

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
  const [own, setOwn] = useState<Look>(() => ({
    accent: ACCENT_IDS.includes(saved.accent as Accent) ? (saved.accent as Accent) : GALLERY_LOOK.accent,
    material: MATERIAL_IDS.includes(saved.material as Material) ? (saved.material as Material) : GALLERY_LOOK.material,
    fun: saved.fun === true,
  }));
  const [linked, setLinked] = useState(() => lookFromSearch(location.search));
  /* Back and Forward can bring a look into the address, or take it out. */
  useEffect(() => {
    const read = () =>
      setLinked((was) => {
        const now = lookFromSearch(location.search);
        return was && now && sameLook(was, now) ? was : now;
      });
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  const look = linked ?? own;

  /* The world's own face first. A face chosen elsewhere that is this world's own reads as the world's own here, and
     comes back in a world where it is not. */
  const typefaces = useTypefaces(look.material);
  const chosen = FACES.find((f) => f.id === faceId);
  const typeface = (chosen && typefaces.find((f) => f.id === chosen.id)) ?? typefaces[0];
  /* Each material locks its own shape: Flat opens at the Pill (tokens.css, proposals/flat-pill.md), Press and Device at
     litt's control radius. Read from the look, not from <html> at load, so a switch of material moves the default too. */
  const lockedRadius = look.material === "flat" ? PILL : LIMITS.control;
  const radius = radiusTuned ?? lockedRadius;
  const modified = typeface.id !== "locked" || radiusTuned !== null || !sameLook(look, GALLERY_LOOK);

  /* Write the choices on <body> (the face on <html>), and remove what is back to locked. A layout effect, so a change
     never paints stale. */
  useLayoutEffect(() => instantly(() => {
    const s = document.body.style;
    if (typeface.id === "locked") document.documentElement.style.removeProperty("--font-choice");
    else {
      loadTypeface(typeface);
      document.documentElement.style.setProperty("--font-choice", typeface.stack);
    }
    if (radiusTuned === null) {
      s.removeProperty("--radius-control");
      s.removeProperty("--radius-surface");
    } else {
      s.setProperty("--radius-control", `${radiusTuned}px`);
      s.setProperty("--radius-surface", `${shapeSurface(radiusTuned)}px`);
    }
    const attribute = accentAttribute(look.accent, look.material);
    if (attribute) document.body.dataset.accent = attribute;
    else delete document.body.dataset.accent;
    const material = materialOf(look.material).attribute;
    if (material) document.documentElement.dataset.material = material;
    else delete document.documentElement.dataset.material;
  }), [typeface, radiusTuned, look.accent, look.material]);

  /* Remember a change, and only a change, so a later change to tokens.css is never shadowed. Your own look only: a
     link's is never saved. */
  useEffect(() => {
    try {
      const next: Saved = {};
      if (chosen) next.face = { id: chosen.id, stack: chosen.stack, href: chosen.href };
      if (radiusTuned !== null) next.radius = radiusTuned;
      if (own.accent !== GALLERY_LOOK.accent) next.accent = own.accent;
      if (own.material !== GALLERY_LOOK.material) next.material = own.material;
      if (own.fun) next.fun = true;
      if (Object.keys(next).length) localStorage.setItem(KEY, JSON.stringify(next));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage can be unavailable; the choice still applies until the page reloads */
    }
  }, [chosen, radiusTuned, own]);

  const value = useMemo<Ctx>(() => {
    /* history.state carries route.ts's mark on the entry, so it stays. */
    const drop = () => {
      const href = withLook(location.href, null);
      if (href !== location.href) history.replaceState(history.state, "", href);
      setLinked(null);
    };
    const setLook = (patch: Partial<Look>) => {
      setOwn({ ...(linked ?? own), ...patch });
      if (linked) drop();
    };
    return {
      theme,
      setTheme,
      typefaces,
      typeface,
      setTypeface: setFaceId,
      radius,
      lockedRadius,
      setRadius: (r) => setRadiusTuned(r === lockedRadius ? null : r),
      look,
      setLook,
      link: linked && !sameLook(linked, own) ? { look: linked, keep: () => setLook({}), drop } : null,
      modified,
      reset: () => {
        setFaceId("locked");
        setRadiusTuned(null);
        setOwn(GALLERY_LOOK);
        drop();
      },
    };
    /* setTheme only writes state, <html> and storage, so the first one stays good. */
  }, [theme, typefaces, typeface, radius, lockedRadius, own, linked, look, modified]);

  return (
    <CustomizeContext.Provider value={value}>
      <FunMode on={look.fun}>{children}</FunMode>
    </CustomizeContext.Provider>
  );
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

