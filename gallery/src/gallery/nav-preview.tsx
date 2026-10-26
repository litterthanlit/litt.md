/**
 * The sidebar's hover preview: rest the pointer on a component's name and its first
 * demo floats beside the sidebar, live and in miniature, so you can see a component
 * before you open it.
 *
 * - The demo is the page's Miniature (miniature.tsx): its first stage's demo, live and
 *   scaled to the panel. No page writes anything for it.
 * - It is a picture, not a second copy of the page: aria-hidden and inert, so nothing in
 *   it takes focus or a click, and the link stays the one thing to act on.
 * - Opens after 300ms of hover intent (an interaction delay, like the tooltip's), then
 *   glides from name to name at once while it is open, on the responsive tier. Keyboard
 *   focus opens it at once. Leaving the sidebar, a click, Escape or a scroll closes it.
 * - Mouse only. A finger has no hover, and the phone's strip has no room beside it.
 * - Surface: solid surface-1 at the surface radius with --shadow-float (R3). Not glass:
 *   a demo inside it can carry glass of its own.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";
import { pages, type PageEntry } from "./registry";
import { Miniature } from "./miniature";

/* The panel, and the stage the demo is laid out on before it is scaled to fit. */
const W = 480;
const H = 304;
const INSET = 24;
const GAP = 24;
const HEADER = 64;
const INTENT = 300;

type Shown = { page: PageEntry; x: number; y: number };

/** Wraps the sidebar. Links with data-preview="<page id>" get a preview. */
export function NavPreview({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const place = (link: HTMLElement): Shown | null => {
    const page = pages.find((p) => p.id === link.dataset.preview);
    const nav = ref.current?.getBoundingClientRect();
    if (!page || !nav) return null;
    const box = link.getBoundingClientRect();
    const y = Math.min(Math.max(box.top + box.height / 2 - H / 2, HEADER + 16), window.innerHeight - H - 16);
    return { page, x: nav.right + GAP, y };
  };
  const open = (link: HTMLElement) => {
    clearTimeout(timer.current);
    setShown(place(link));
  };
  const close = () => {
    clearTimeout(timer.current);
    setShown(null);
  };

  /* The panel is fixed to the viewport, so any scroll would leave it beside the wrong name. */
  useEffect(() => {
    if (!shown) return;
    const onScroll = () => close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("keydown", onKey);
    };
  }, [shown]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const linkOf = (t: EventTarget) => (t instanceof Element ? t.closest<HTMLElement>("a[data-preview]") : null);

  return (
    <div
      ref={ref}
      className={className}
      onPointerOver={(e) => {
        if (e.pointerType !== "mouse") return;
        const link = linkOf(e.target);
        if (!link) return close();
        if (shown) return open(link); // already open: glide to the new name at once
        clearTimeout(timer.current);
        timer.current = setTimeout(() => open(link), INTENT);
      }}
      onPointerLeave={close}
      onFocus={(e) => {
        const link = linkOf(e.target);
        if (link?.matches(":focus-visible")) open(link);
      }}
      onBlur={close}
      onClick={close}
    >
      {children}
      {createPortal(
        <AnimatePresence>{shown && <Panel key="preview" shown={shown} />}</AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

function Panel({ shown }: { shown: Shown }) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  return (
    <motion.div
      aria-hidden="true"
      inert
      className="pointer-events-none fixed top-0 left-0 z-20 overflow-hidden rounded-surface bg-surface-1 shadow-float inset-shadow-highlight"
      style={{ width: W, height: H }}
      /* It grows out of the sidebar: a quarter of the travel nearer the name, then settles. */
      initial={{ opacity: 0, x: shown.x - travel / 4, y: shown.y }}
      animate={{ opacity: 1, x: shown.x, y: shown.y, transition: enter }}
      exit={{ opacity: 0, transition: exit }}
    >
      <Miniature key={shown.page.id} page={shown.page} width={W} height={H} inset={INSET} />
    </motion.div>
  );
}
