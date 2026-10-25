/**
 * The language canvas (#canvas): a freeform workspace of live previews, for rethinking litt with the press material.
 * Not a gallery page: no nav entry, no wall tile, and the page checks (wall, a11y, llms) never see it.
 *
 * - Content lives in source (registry.tsx). This file is only the camera, the gestures, placement and the saved layout.
 * - The camera is outside React state: pan and zoom write one transform per frame to the world, so previews never
 *   rerender or remount while it moves. Only the zoom readout subscribes to it.
 * - Pan: drag empty space; Space + drag or a middle-button drag anywhere; two-finger scroll (a nested scroll area that
 *   can still scroll in that direction scrolls instead); the arrow keys with the canvas focused.
 * - Zoom: Ctrl or ⌘ + wheel and trackpad pinch, anchored under the pointer; the buttons and + and - around the center.
 * - Fit (F) and Reset (0) move only the camera. Positions, theme and drafts stay.
 * - Items move by their handle only, by pointer at the current zoom or by the arrow keys. A name copies itself.
 * - The saved layout is the camera and the positions, by id (layout.ts). The theme is the gallery's own.
 */
import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { Button } from "@/components/button";
import { ArrowLeftIcon, ExpandIcon, GripIcon, MinusIcon, PlusIcon, RetryIcon } from "@/components/icons";
import { ThemeSwitch, useTheme } from "../gallery/app";
import { ITEMS, type CanvasItem } from "./registry";
import { LIMIT, Z_MAX, Z_MIN, loadLayout, saveLayout, type Camera, type Point } from "./layout";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const bounded = (c: Camera): Camera => ({ x: clamp(c.x, -LIMIT, LIMIT), y: clamp(c.y, -LIMIT, LIMIT), z: clamp(c.z, Z_MIN, Z_MAX) });
/** Zoom by `factor` keeping the canvas point under (sx, sy), in viewport px, where it is. */
const zoomAt = (c: Camera, sx: number, sy: number, factor: number): Camera => {
  const z = clamp(c.z * factor, Z_MIN, Z_MAX);
  const k = z / c.z;
  return bounded({ x: sx - (sx - c.x) * k, y: sy - (sy - c.y) * k, z });
};
/* Room the fixed title and controls take, so fit-all and reset keep items clear of them. */
const TOP = 96;
const BOTTOM = 96;
const SIDE = 48;
const PAN_STEP = 48;

/** A camera everyone can read and subscribe to, outside React state. */
function createCamera(initial: Camera) {
  let cam = initial;
  const subs = new Set<() => void>();
  return {
    get: () => cam,
    set(next: Camera) {
      cam = bounded(next);
      subs.forEach((f) => f());
    },
    subscribe(f: () => void) {
      subs.add(f);
      return () => void subs.delete(f);
    },
  };
}
type CameraStore = ReturnType<typeof createCamera>;

/** Whether an element (or one of its ancestors up to `stop`) can still scroll by (dx, dy). */
function canScroll(from: EventTarget | null, stop: Element | null, dx: number, dy: number) {
  for (let el = from instanceof Element ? from : null; el && el !== stop; el = el.parentElement) {
    const s = getComputedStyle(el);
    const scrollsY = /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight;
    const scrollsX = /(auto|scroll)/.test(s.overflowX) && el.scrollWidth > el.clientWidth;
    if (dy && scrollsY && ((dy < 0 && el.scrollTop > 0) || (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1))) return true;
    if (dx && scrollsX && ((dx < 0 && el.scrollLeft > 0) || (dx > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1))) return true;
  }
  return false;
}

/** Focus is in something Space already means something to: a field, a button, a label, a control. */
function spaceIsTaken(el: Element | null) {
  if (!el || el === document.body) return false;
  if (el.closest("[data-canvas-viewport]") === el) return false;
  return !!el.closest("input, textarea, select, button, a, label, summary, [contenteditable=''], [contenteditable=true], [role=button], [role=switch], [role=slider], [role=radio], [role=checkbox], [role=tab], [role=option], [role=menuitem], [tabindex]");
}

export default function LanguageCanvas() {
  const [theme, setTheme] = useTheme();
  const ids = ITEMS.map((i) => i.id);
  const [saved] = useState(() => loadLayout(ids));
  const [positions, setPositions] = useState<Record<string, Point>>(() =>
    Object.fromEntries(ITEMS.map((i) => [i.id, saved.positions[i.id] ?? { x: i.x, y: i.y }])),
  );
  const camera = useRef<CameraStore | null>(null);
  if (!camera.current) camera.current = createCamera(saved.camera ?? { x: SIDE, y: TOP, z: 1 });
  const cam = camera.current;

  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  /* One transform write per frame, whatever moved the camera. */
  useEffect(() => {
    let frame = 0;
    const write = () => {
      frame = 0;
      const c = cam.get();
      if (world.current) world.current.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${c.z})`;
    };
    write();
    const off = cam.subscribe(() => {
      if (!frame) frame = requestAnimationFrame(write);
    });
    return () => {
      off();
      cancelAnimationFrame(frame);
    };
  }, [cam]);

  /* Save after things settle: a bounded debounce, never on every pointer event. Flushed when the canvas goes. */
  const saveTimer = useRef(0);
  const flush = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = 0;
    saveLayout({ camera: cam.get(), positions: positionsRef.current });
  }, [cam]);
  const scheduleSave = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flush, 400);
  }, [flush]);
  useEffect(() => cam.subscribe(scheduleSave), [cam, scheduleSave]);
  useEffect(() => {
    scheduleSave();
  }, [positions, scheduleSave]);
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (saveTimer.current) flush();
    };
  }, [flush]);

  /* The bounds of everything, as laid out: each item's position and its frame's size, title and handle included. */
  const bounds = useCallback(() => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const el of world.current?.querySelectorAll<HTMLElement>("[data-canvas-item]") ?? []) {
      const p = positionsRef.current[el.dataset.canvasItem ?? ""];
      if (!p) continue;
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x + el.offsetWidth);
      y1 = Math.max(y1, p.y + el.offsetHeight);
    }
    return Number.isFinite(x0) ? { x0, y0, x1, y1 } : null;
  }, []);
  const fit = useCallback(() => {
    const b = bounds();
    const vp = viewport.current;
    if (!b || !vp) return;
    const w = vp.clientWidth - SIDE * 2;
    const h = vp.clientHeight - TOP - BOTTOM;
    const z = clamp(Math.min(w / (b.x1 - b.x0), h / (b.y1 - b.y0), 1), Z_MIN, Z_MAX);
    cam.set({ x: SIDE + (w - (b.x1 - b.x0) * z) / 2 - b.x0 * z, y: TOP + (h - (b.y1 - b.y0) * z) / 2 - b.y0 * z, z });
  }, [bounds, cam]);
  const reset = useCallback(() => {
    const b = bounds();
    cam.set({ x: SIDE - (b?.x0 ?? 0), y: TOP - (b?.y0 ?? 0), z: 1 });
  }, [bounds, cam]);
  const zoomBy = useCallback(
    (factor: number) => {
      const vp = viewport.current;
      if (!vp) return;
      cam.set(zoomAt(cam.get(), vp.clientWidth / 2, vp.clientHeight / 2, factor));
    },
    [cam],
  );

  /* First visit: fit everything once the fonts and the layout have settled. A saved camera is kept as it was. */
  useEffect(() => {
    if (saved.camera) return;
    let cancelled = false;
    void document.fonts.ready.then(() =>
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!cancelled) fit();
      })),
    );
    return () => {
      cancelled = true;
    };
  }, [fit, saved.camera]);

  /* While the canvas is up, the page itself never scrolls and a sideways swipe never goes back a page. */
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const before = [html.style.overflow, html.style.overscrollBehaviorX, body.style.overscrollBehaviorX];
    html.style.overflow = "hidden";
    html.style.overscrollBehaviorX = "none";
    body.style.overscrollBehaviorX = "none";
    return () => {
      [html.style.overflow, html.style.overscrollBehaviorX, body.style.overscrollBehaviorX] = before;
    };
  }, []);

  /* Wheel: Ctrl or ⌘ (and a trackpad pinch, which arrives as one) zooms under the pointer; otherwise it pans, unless a
     nested scroll area under it can still scroll that way. Non-passive, so it can keep the browser out. */
  useEffect(() => {
    const vp = viewport.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-canvas-controls]")) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vp.clientHeight : 1;
      const r = vp.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        cam.set(zoomAt(cam.get(), e.clientX - r.left, e.clientY - r.top, Math.pow(2, -clamp(e.deltaY * unit, -120, 120) / 300)));
        return;
      }
      const sideways = e.shiftKey && !e.deltaX;
      const dx = (sideways ? e.deltaY : e.deltaX) * unit;
      const dy = (sideways ? 0 : e.deltaY) * unit;
      const preview = e.target instanceof Element ? e.target.closest("[data-canvas-preview]") : null;
      if (preview && canScroll(e.target, preview.parentElement, dx, dy)) return;
      e.preventDefault();
      const c = cam.get();
      cam.set({ ...c, x: c.x - dx, y: c.y - dy });
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [cam]);

  /* Space arms a pan anywhere, unless focus is in something Space already means something to. Held keys clear when
     the window or the tab loses focus. */
  const space = useRef(false);
  useEffect(() => {
    const down = (e: globalThis.KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || spaceIsTaken(document.activeElement)) return;
      space.current = true;
      e.preventDefault();
    };
    const up = (e: globalThis.KeyboardEvent) => {
      if (e.code === "Space") space.current = false;
    };
    const clear = () => {
      space.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, []);

  /* Pan and pinch by pointer. Which gesture owns the pointer is kept here, outside React state. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pan = useRef<{ moved: boolean; pinch: { d: number; cx: number; cy: number } | null } | null>(null);
  const swallowClick = useRef(false);
  const startPan = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a pointer that is already gone */
    }
    const pts = [...pointers.current.values()];
    const pinch = pts.length >= 2 ? { d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), cx: (pts[0].x + pts[1].x) / 2, cy: (pts[0].y + pts[1].y) / 2 } : null;
    pan.current = { moved: pan.current?.moved ?? false, pinch };
  };
  const onPointerDownCapture = (e: PointerEvent<HTMLDivElement>) => {
    /* A pan that ended without a click (a touch pan) must not swallow this press's click. */
    if (!pointers.current.size) swallowClick.current = false;
    /* Explicit pans come first, over previews and handles alike. */
    if (e.button === 1 || (e.button === 0 && space.current)) {
      e.preventDefault();
      e.stopPropagation();
      startPan(e);
    }
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (pan.current && pointers.current.size && e.pointerType === "touch") return startPan(e); // a second finger: pinch
    const onEmpty = e.target === e.currentTarget || e.target === world.current;
    if (e.button === 0 && onEmpty) startPan(e);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = pan.current;
    const last = pointers.current.get(e.pointerId);
    if (!p || !last) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const c = cam.get();
    if (p.pinch && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const r = viewport.current!.getBoundingClientRect();
      const moved = { ...c, x: c.x + cx - p.pinch.cx, y: c.y + cy - p.pinch.cy };
      cam.set(zoomAt(moved, cx - r.left, cy - r.top, p.pinch.d ? d / p.pinch.d : 1));
      p.pinch = { d, cx, cy };
      p.moved = true;
      return;
    }
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    if (!dx && !dy) return;
    p.moved = true;
    cam.set({ ...c, x: c.x + dx, y: c.y + dy });
  };
  const endPan = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const p = pan.current;
    if (pointers.current.size === 0) {
      if (p?.moved) swallowClick.current = true; // after a pan, nothing under the pointer activates
      pan.current = null;
    } else if (p) {
      p.pinch = null; // one finger left: it goes on panning from where it is
    }
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  };
  /* A lost capture (a pointer the browser took over) ends the gesture like a release. */
  const onLostPointerCapture = (e: PointerEvent<HTMLDivElement>) => {
    if (pointers.current.has(e.pointerId)) endPan(e);
  };

  /* The canvas itself, focused: the arrows pan, + and - zoom, F fits, 0 resets. Keys inside previews stay theirs. */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const step = e.shiftKey ? PAN_STEP * 4 : PAN_STEP;
    const c = cam.get();
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) cam.set({ ...c, x: c.x + moves[e.key][0], y: c.y + moves[e.key][1] });
    else if (e.key === "+" || e.key === "=") zoomBy(1.25);
    else if (e.key === "-" || e.key === "_") zoomBy(0.8);
    else if (e.key === "0") reset();
    else if (e.key === "f" || e.key === "F") fit();
    else return;
    e.preventDefault();
  };

  /* Focus that lands off screen scrolls the viewport natively. Turn that scroll into camera movement instead. */
  const onScroll = () => {
    const vp = viewport.current;
    if (!vp || (!vp.scrollLeft && !vp.scrollTop)) return;
    const c = cam.get();
    cam.set({ ...c, x: c.x - vp.scrollLeft, y: c.y - vp.scrollTop });
    vp.scrollLeft = 0;
    vp.scrollTop = 0;
  };

  const moveItem = useCallback((id: string, p: Point) => setPositions((s) => ({ ...s, [id]: { x: clamp(p.x, -LIMIT, LIMIT), y: clamp(p.y, -LIMIT, LIMIT) } })), []);
  const getZoom = useCallback(() => cam.get().z, [cam]);
  const hintId = useId();
  const moveHintId = useId();

  return (
    <main aria-label="Language canvas" className="fixed inset-0 bg-canvas text-fg">
      <div
        ref={viewport}
        data-canvas-viewport=""
        tabIndex={0}
        role="region"
        aria-roledescription="canvas"
        aria-label="litt, physical: the language canvas"
        aria-describedby={hintId}
        onPointerDownCapture={onPointerDownCapture}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onLostPointerCapture={onLostPointerCapture}
        onClickCapture={onClickCapture}
        onAuxClick={(e) => e.button === 1 && e.preventDefault()}
        onMouseDownCapture={(e) => e.button === 1 && e.preventDefault()} // no middle-click autoscroll
        onKeyDown={onKeyDown}
        onScroll={onScroll}
        className="absolute inset-0 cursor-default touch-none overflow-hidden overscroll-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        <div ref={world} className="absolute top-0 left-0 origin-top-left">
          {ITEMS.map((item) => (
            <ItemFrame key={item.id} item={item} at={positions[item.id]} onMove={moveItem} getZoom={getZoom} moveHintId={moveHintId} />
          ))}
        </div>
      </div>

      <header className="pointer-events-none fixed top-0 left-0 grid gap-1 p-6">
        <h1 className="text-h4 font-title text-fg">litt, physical</h1>
        <p className="text-small text-fg-subtle">Drag to pan. Ctrl or ⌘ and scroll to zoom. Click a name to copy it.</p>
      </header>
      <p id={hintId} hidden>
        Drag empty space to pan, or hold Space and drag anywhere. Ctrl or ⌘ and scroll, or pinch, to zoom. Click a name to copy it; drag its
        handle to move it. With the canvas focused, the arrows pan, + and − zoom, F fits everything and 0 resets the view.
      </p>
      <span id={moveHintId} hidden>
        Drag to move it, or use the arrow keys. Shift moves further.
      </span>

      <div
        data-canvas-controls=""
        role="toolbar"
        aria-label="Canvas"
        className="litt-glass fixed inset-x-4 bottom-4 mx-auto flex w-fit items-center gap-1 rounded-surface p-1 max-sm:gap-0.5"
      >
        <a
          href="#overview"
          className="inline-flex h-control-sm items-center gap-2 rounded-control px-3 text-small font-title max-sm:w-control-sm max-sm:justify-center max-sm:px-0 text-fg-muted transition-[color,background-color] duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ArrowLeftIcon />
          <span className="max-sm:sr-only">Gallery</span>
        </a>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-line max-sm:hidden" />
        <Button variant="ghost" size="sm" iconOnly aria-label="Zoom out" onClick={() => zoomBy(0.8)}>
          <MinusIcon />
        </Button>
        <ZoomReadout cam={cam} />
        <Button variant="ghost" size="sm" iconOnly aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
          <PlusIcon />
        </Button>
        <Button variant="ghost" size="sm" iconOnly aria-label="Fit everything" onClick={fit}>
          <ExpandIcon />
        </Button>
        <Button variant="ghost" size="sm" iconOnly aria-label="Reset the view" onClick={reset}>
          <RetryIcon />
        </Button>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-line max-sm:hidden" />
        <div className="shrink-0">
          <ThemeSwitch theme={theme} onChange={setTheme} />
        </div>
      </div>
    </main>
  );
}

function ZoomReadout({ cam }: { cam: CameraStore }) {
  const z = useSyncExternalStore(cam.subscribe, () => Math.round(cam.get().z * 100));
  return (
    <output aria-live="off" className="w-12 text-center max-sm:w-10 max-[359px]:hidden font-mono text-small tabular-nums text-fg-muted">
      {z}%
    </output>
  );
}

/**
 * One item: its name (which copies itself) and its handle above, the live preview below at its own size. A move writes
 * the frame's transform directly while the handle is held and tells the canvas where it landed once, at the end.
 */
const ItemFrame = memo(function ItemFrame({
  item,
  at,
  onMove,
  getZoom,
  moveHintId,
}: {
  item: CanvasItem;
  at: Point;
  onMove: (id: string, p: Point) => void;
  getZoom: () => number;
  moveHintId: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x0: number; y0: number; from: Point; now: Point } | null>(null);
  const place = (p: Point) => {
    if (frame.current) frame.current.style.transform = `translate(${p.x}px, ${p.y}px)`;
  };
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, from: at, now: at };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const z = getZoom();
    d.now = { x: d.from.x + (e.clientX - d.x0) / z, y: d.from.y + (e.clientY - d.y0) / z };
    place(d.now);
  };
  const onPointerEnd = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.now.x !== d.from.x || d.now.y !== d.from.y) onMove(item.id, d.now);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 40 : 8;
    const moves: Record<string, Point> = { ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 }, ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step } };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    e.stopPropagation();
    onMove(item.id, { x: at.x + m.x, y: at.y + m.y });
  };

  return (
    <div ref={frame} data-canvas-item={item.id} className="absolute top-0 left-0 grid gap-2" style={{ transform: `translate(${at.x}px, ${at.y}px)` }}>
      <div className="flex h-7 items-center gap-1">
        <button
          type="button"
          aria-label={`Move ${item.name}`}
          aria-describedby={moveHintId}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onKeyDown={onKeyDown}
          className="grid size-7 cursor-default touch-none place-items-center rounded-control text-fg-subtle transition-[color,background-color] duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <GripIcon />
        </button>
        <CopyName name={item.name} />
      </div>
      <div
        data-canvas-preview=""
        /* Its own scroll boundary, so the canvas's touch-action stops here and touch inside a preview stays native. */
        className="overflow-hidden rounded-surface bg-surface-1 p-6 shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]"
        style={{ width: item.width, minHeight: item.height }}
      >
        {item.render()}
      </div>
    </div>
  );
});

/** The item's exact name, as text that copies itself. A hint says so on hover and focus; it never copies on hover. */
function CopyName({ name }: { name: string }) {
  const hint = useId();
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(name);
      setState("copied");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setState((s) => (s === "copied" ? "idle" : s)), 1600);
    } catch {
      setState("manual"); // the name as selectable text instead
    }
  };
  return (
    <span className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        aria-describedby={hint}
        className="peer cursor-pointer rounded-control px-1 text-small font-title text-fg decoration-line-strong underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {name}
      </button>
      <span
        id={hint}
        className="pointer-events-none absolute top-full left-1 z-1 mt-1 rounded-control bg-surface-1 px-2 py-1 text-caption whitespace-nowrap text-fg-subtle opacity-0 shadow-tooltip transition-[opacity] duration-(--dur-instant) ease-litt peer-hover:opacity-100 peer-focus-visible:opacity-100"
      >
        Copy the name
      </span>
      <span aria-live="polite" className="text-caption text-fg-subtle">
        {state === "copied" ? "Copied" : ""}
      </span>
      {state === "manual" && (
        <input
          readOnly
          value={name}
          aria-label="The name, to copy by hand"
          ref={(el) => el?.select()}
          onBlur={() => setState("idle")}
          className="h-7 rounded-control bg-surface-1 px-2 text-caption text-fg shadow-[inset_0_0_0_1px_var(--line-control)]"
        />
      )}
    </span>
  );
}
