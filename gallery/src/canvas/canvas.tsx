/**
 * The brainstorm canvas (#canvas): live previews from the registry on a plain field you can pan and zoom. Not a gallery
 * page: it is in no nav, no docs and no registry, and it lives on its own branch.
 *
 * - Camera: one `translate scale` on the world, written at most once a frame from a ref, so moving it never re-renders a
 *   preview. Drag empty space, scroll (two fingers on a trackpad) or two fingers on a touch screen to pan; Ctrl or ⌘ with
 *   the wheel, a trackpad pinch or a touch pinch to zoom around the pointer. Space-drag and a middle-button drag pan from
 *   anywhere, previews included. With the canvas focused: arrows pan, + and − zoom, 0 resets and 1 fits everything.
 * - Items: a name that copies itself and a handle that moves the item (pointer, or arrows on the focused handle). The
 *   body is the live preview, untouched by the canvas.
 * - Saved: the camera and the moved positions, keyed by registry id (layout-store.ts). Nothing else.
 */
import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/button";
import { ChevronLeftIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { pages } from "../gallery/registry";
import { ThemeSwitch, useTheme } from "../gallery/app";
import { boundPoint, bounded, fit, HOME, MAX_ZOOM, MIN_ZOOM, union, zoomAt, type Box, type Camera } from "./camera";
import { loadLayout, saveLayout, type Point } from "./layout-store";
import { ITEMS, type CanvasItem } from "./registry";

const IDS = new Set(ITEMS.map((i) => i.id));
const ZOOM_STEP = 1.25;
const PAN_STEP = 64;
const MOVE_STEP = 8;
/** A pointer that travels less than this is a press, not a drag. */
const SLOP = 3;
const SAVE_AFTER = 400;

/* An element that keeps Space for itself: typing, pressing a control, or anything that takes focus but the canvas. */
function ownsSpace(el: Element | null, shell: HTMLElement | null) {
  if (!el || el === document.body || el === shell) return false;
  return true;
}

/* The nearest element between `from` and `stop` that can still scroll by (dx, dy). */
function scrollerFor(from: EventTarget | null, stop: HTMLElement, dx: number, dy: number) {
  for (let el = from instanceof Element ? from : null; el && el !== stop; el = el.parentElement) {
    const s = getComputedStyle(el);
    const canY = /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight;
    const canX = /(auto|scroll)/.test(s.overflowX) && el.scrollWidth > el.clientWidth;
    if (canY && ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dy < 0 && el.scrollTop > 0))) return el;
    if (canX && ((dx > 0 && Math.abs(el.scrollLeft) + el.clientWidth < el.scrollWidth - 1) || (dx < 0 && Math.abs(el.scrollLeft) > 0))) return el;
  }
  return null;
}

type Gesture =
  | { kind: "pan"; id: number; sx: number; sy: number; from: Camera; moved: boolean }
  | { kind: "pinch"; dist: number; mid: { x: number; y: number }; from: Camera }
  | { kind: "move"; id: number; item: string; sx: number; sy: number; from: Point; moved: boolean };

export default function Canvas() {
  const shell = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const saved = useRef(loadLayout(IDS));
  const camera = useRef<Camera>(saved.current.camera ?? HOME);
  const [positions, setPositions] = useState<Record<string, Point>>(() => {
    const out: Record<string, Point> = {};
    for (const item of ITEMS) out[item.id] = saved.current.positions[item.id] ?? { x: item.x, y: item.y };
    return out;
  });
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const frames = useRef<Map<string, HTMLDivElement>>(new Map());
  const sizes = useRef<Map<string, { width: number; height: number }>>(new Map());
  const gesture = useRef<Gesture | null>(null);
  const touches = useRef<Map<number, { x: number; y: number }>>(new Map());
  const space = useRef(false);
  const frame = useRef(0);
  /* An item being dragged: where it goes on the next frame. One write per frame, like the camera. */
  const moveFrame = useRef(0);
  const movePending = useRef<{ id: string; p: Point } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const zoomListeners = useRef(new Set<(z: number) => void>());
  const [theme, setTheme] = useTheme();
  const helpId = useId();
  const moveHelpId = useId();
  const copyHelpId = useId();

  /* ------------------------------------------------------------ camera */

  const save = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = undefined;
    saveLayout({ camera: camera.current, positions: positionsRef.current });
  }, []);
  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, SAVE_AFTER);
  }, [save]);

  const setCamera = useCallback(
    (next: Camera) => {
      camera.current = bounded(next);
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const { x, y, z } = camera.current;
        if (world.current) world.current.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
        zoomListeners.current.forEach((l) => l(z));
        scheduleSave();
      });
    },
    [scheduleSave],
  );

  const viewSize = () => {
    const r = shell.current?.getBoundingClientRect();
    return { w: r?.width ?? 0, h: r?.height ?? 0, left: r?.left ?? 0, top: r?.top ?? 0 };
  };

  const zoomBy = useCallback(
    (factor: number) => {
      const { w, h } = viewSize();
      setCamera(zoomAt(camera.current, camera.current.z * factor, w / 2, h / 2));
    },
    [setCamera],
  );

  /* Every item's box in canvas px: its position and its measured frame (name row, handle and preview). */
  const bounds = useCallback((): Box => {
    const boxes: Box[] = [];
    for (const item of ITEMS) {
      const p = positionsRef.current[item.id];
      const el = frames.current.get(item.id);
      /* Sizes come from the observer; one not reported yet is read once here. */
      const s = sizes.current.get(item.id) ?? (el ? { width: el.offsetWidth, height: el.offsetHeight } : undefined);
      if (p && s) boxes.push({ x: p.x, y: p.y, width: s.width, height: s.height });
    }
    return union(boxes);
  }, []);

  const fitAll = useCallback(() => {
    const { w, h } = viewSize();
    setCamera(fit(bounds(), w, h));
  }, [bounds, setCamera]);

  const resetCamera = useCallback(() => setCamera(HOME), [setCamera]);

  /* The first frame: the saved camera, or everything in view once the previews have their real sizes and fonts. */
  useLayoutEffect(() => {
    const { x, y, z } = camera.current;
    if (world.current) world.current.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
    zoomListeners.current.forEach((l) => l(z));
    if (saved.current.camera) return;
    let cancelled = false;
    document.fonts.ready.then(() => requestAnimationFrame(() => !cancelled && fitAll()));
    return () => {
      cancelled = true;
    };
  }, [fitAll]);

  /* Measured sizes, refreshed together when any frame changes size, never every frame. */
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const e of entries) {
        const id = (e.target as HTMLElement).dataset.item;
        if (id) sizes.current.set(id, { width: (e.target as HTMLElement).offsetWidth, height: (e.target as HTMLElement).offsetHeight });
      }
    });
    frames.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ------------------------------------------------------------ document while the canvas is up */

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const before = { html: html.style.overscrollBehaviorX, body: body.style.overscrollBehaviorX, overflow: body.style.overflow };
    /* No horizontal history swipe and no page scroll while the canvas is the page. */
    html.style.overscrollBehaviorX = "none";
    body.style.overscrollBehaviorX = "none";
    body.style.overflow = "hidden";
    return () => {
      html.style.overscrollBehaviorX = before.html;
      body.style.overscrollBehaviorX = before.body;
      body.style.overflow = before.overflow;
    };
  }, []);

  /* ------------------------------------------------------------ gestures */

  useEffect(() => {
    const el = shell.current;
    if (!el) return;

    let suppressClick = false;
    const endGesture = () => {
      const g = gesture.current;
      gesture.current = null;
      if (g && "moved" in g && g.moved) {
        /* The press that ended a drag must not also click what is under it. */
        suppressClick = true;
        setTimeout(() => (suppressClick = false), 0);
      }
      if (g) scheduleSave();
    };
    const clearKeys = () => {
      space.current = false;
      touches.current.clear();
      if (gesture.current?.kind !== "move") gesture.current = null;
    };

    const local = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const startPinch = () => {
      const [a, b] = [...touches.current.values()];
      if (!a || !b) return;
      gesture.current = { kind: "pinch", dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, from: camera.current };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        touches.current.set(e.pointerId, local(e));
        if (touches.current.size === 2) {
          /* Two fingers belong to the canvas: pan and pinch, wherever they land. */
          if (gesture.current?.kind === "move") return;
          e.stopPropagation();
          startPinch();
          return;
        }
      }
      const explicit = (space.current && e.button === 0) || e.button === 1;
      const empty = e.target === el || e.target === world.current;
      if (!explicit && !(empty && e.button === 0)) return;
      if (explicit) {
        e.preventDefault();
        e.stopPropagation();
      }
      el.setPointerCapture(e.pointerId);
      gesture.current = { kind: "pan", id: e.pointerId, sx: e.clientX, sy: e.clientY, from: camera.current, moved: false };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" && touches.current.has(e.pointerId)) touches.current.set(e.pointerId, local(e));
      const g = gesture.current;
      if (!g) return;
      if (g.kind === "pinch") {
        const [a, b] = [...touches.current.values()];
        if (!a || !b) return;
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (g.from.z * dist) / g.dist));
        /* The world point under the fingers' first midpoint stays under their midpoint now. */
        const wx = (g.mid.x - g.from.x) / g.from.z;
        const wy = (g.mid.y - g.from.y) / g.from.z;
        setCamera({ x: mid.x - wx * z, y: mid.y - wy * z, z });
        return;
      }
      if (g.kind !== "pan" || e.pointerId !== g.id) return;
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (!g.moved && Math.hypot(dx, dy) > SLOP) g.moved = true;
      setCamera({ ...g.from, x: g.from.x + dx, y: g.from.y + dy });
    };

    const onPointerEnd = (e: PointerEvent) => {
      touches.current.delete(e.pointerId);
      const g = gesture.current;
      if (g?.kind === "pinch") {
        if (touches.current.size < 2) {
          gesture.current = null;
          scheduleSave();
        }
        return;
      }
      if (g?.kind === "pan" && g.id === e.pointerId) endGesture();
    };

    const onClick = (e: MouseEvent) => {
      if (!suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
      suppressClick = false;
    };
    /* A middle press would start the browser's autoscroll, and its release would open links. */
    const onMouseDown = (e: MouseEvent) => e.button === 1 && e.preventDefault();
    const onAuxClick = (e: MouseEvent) => e.button === 1 && e.preventDefault();

    const onWheel = (e: WheelEvent) => {
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      let dx = e.deltaX * unit;
      let dy = e.deltaY * unit;
      if (e.ctrlKey || e.metaKey) {
        /* Ctrl or ⌘ with the wheel, and a trackpad pinch (which arrives as a wheel with ctrlKey), zoom at the pointer. */
        e.preventDefault();
        const p = local(e);
        setCamera(zoomAt(camera.current, camera.current.z * Math.exp(-dy * 0.0025), p.x, p.y));
        return;
      }
      if (e.shiftKey && dx === 0) [dx, dy] = [dy, 0];
      /* A preview's own scroller scrolls while it can; past its end, or anywhere else, the canvas pans. */
      if (scrollerFor(e.target, el, dx, dy)) return;
      e.preventDefault();
      setCamera({ ...camera.current, x: camera.current.x - dx, y: camera.current.y - dy });
    };

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      if (ownsSpace(document.activeElement, el)) return;
      space.current = true;
      e.preventDefault();
    };
    const onKeyUp = (e: globalThis.KeyboardEvent) => {
      if (e.code === "Space") space.current = false;
    };
    const onHidden = () => document.hidden && clearKeys();

    /* Focus that lands off screen (Tab into an item out of view) brings the camera to it; the browser's own scroll of
       the shell is undone, so only the camera ever moves the canvas. */
    const reveal = (target: Element) => {
      if (target === el || !el.contains(target)) return;
      const r = target.getBoundingClientRect();
      const v = el.getBoundingClientRect();
      const pad = 32;
      let dx = 0;
      let dy = 0;
      if (r.left < v.left + pad) dx = v.left + pad - r.left;
      else if (r.right > v.right - pad) dx = Math.max(v.right - pad - r.right, v.left + pad - r.left);
      if (r.top < v.top + pad + 56) dy = v.top + pad + 56 - r.top;
      else if (r.bottom > v.bottom - pad - 72) dy = Math.max(v.bottom - pad - 72 - r.bottom, v.top + pad + 56 - r.top);
      if (dx || dy) setCamera({ ...camera.current, x: camera.current.x + dx, y: camera.current.y + dy });
    };
    /* Measured on the next frame: the browser scrolls the shell to the focused element before focusin, and onScroll
       undoes that scroll, so only then is the element where the camera alone put it. */
    let revealFrame = 0;
    const revealSoon = () => {
      cancelAnimationFrame(revealFrame);
      revealFrame = requestAnimationFrame(() => document.activeElement && reveal(document.activeElement));
    };
    const onFocusIn = () => revealSoon();
    const onScroll = () => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
      revealSoon();
    };

    el.addEventListener("pointerdown", onPointerDown, { capture: true });
    el.addEventListener("pointermove", onPointerMove, { capture: true });
    el.addEventListener("pointerup", onPointerEnd, { capture: true });
    el.addEventListener("pointercancel", onPointerEnd, { capture: true });
    el.addEventListener("lostpointercapture", onPointerEnd);
    el.addEventListener("click", onClick, { capture: true });
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("auxclick", onAuxClick);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("scroll", onScroll);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown, { capture: true });
      el.removeEventListener("pointermove", onPointerMove, { capture: true });
      el.removeEventListener("pointerup", onPointerEnd, { capture: true });
      el.removeEventListener("pointercancel", onPointerEnd, { capture: true });
      el.removeEventListener("lostpointercapture", onPointerEnd);
      el.removeEventListener("click", onClick, { capture: true });
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("auxclick", onAuxClick);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      document.removeEventListener("visibilitychange", onHidden);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      cancelAnimationFrame(moveFrame.current);
      moveFrame.current = 0;
      cancelAnimationFrame(revealFrame);
    };
  }, [scheduleSave, setCamera]);

  /* Leaving the page, or the canvas, writes what is pending. */
  useEffect(() => {
    const flush = () => saveTimer.current !== undefined && save();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [save]);

  /* Keys on the focused canvas itself: the camera. */
  const onShellKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const step = e.shiftKey ? PAN_STEP * 4 : PAN_STEP;
    const c = camera.current;
    if (e.key === "ArrowLeft") setCamera({ ...c, x: c.x + step });
    else if (e.key === "ArrowRight") setCamera({ ...c, x: c.x - step });
    else if (e.key === "ArrowUp") setCamera({ ...c, y: c.y + step });
    else if (e.key === "ArrowDown") setCamera({ ...c, y: c.y - step });
    else if (e.key === "+" || e.key === "=") zoomBy(ZOOM_STEP);
    else if (e.key === "-" || e.key === "_") zoomBy(1 / ZOOM_STEP);
    else if (e.key === "0") resetCamera();
    else if (e.key === "1") fitAll();
    else return;
    e.preventDefault();
  };

  /* ------------------------------------------------------------ moving an item */

  const placeFrame = (id: string, p: Point) => {
    const el = frames.current.get(id);
    if (el) el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  };
  const commit = useCallback(
    (id: string, p: Point) => {
      const next = { x: boundPoint(p.x), y: boundPoint(p.y) };
      setPositions((all) => ({ ...all, [id]: next }));
      positionsRef.current = { ...positionsRef.current, [id]: next };
      scheduleSave();
    },
    [scheduleSave],
  );

  const onHandleDown = useCallback((id: string, e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || space.current || gesture.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const from = positionsRef.current[id]!;
    gesture.current = { kind: "move", id: e.pointerId, item: id, sx: e.clientX, sy: e.clientY, from, moved: false };
  }, []);
  const onHandleMove = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    const g = gesture.current;
    if (g?.kind !== "move" || g.id !== e.pointerId) return;
    const z = camera.current.z;
    const dx = (e.clientX - g.sx) / z;
    const dy = (e.clientY - g.sy) / z;
    if (!g.moved && Math.hypot(dx * z, dy * z) > SLOP) g.moved = true;
    movePending.current = { id: g.item, p: { x: boundPoint(g.from.x + dx), y: boundPoint(g.from.y + dy) } };
    if (moveFrame.current) return;
    moveFrame.current = requestAnimationFrame(() => {
      moveFrame.current = 0;
      const next = movePending.current;
      if (next) placeFrame(next.id, next.p);
    });
  }, []);
  const onHandleUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const g = gesture.current;
      if (g?.kind !== "move" || g.id !== e.pointerId) return;
      gesture.current = null;
      cancelAnimationFrame(moveFrame.current);
      moveFrame.current = 0;
      movePending.current = null;
      const z = camera.current.z;
      commit(g.item, { x: g.from.x + (e.clientX - g.sx) / z, y: g.from.y + (e.clientY - g.sy) / z });
    },
    [commit],
  );
  const onHandleKey = useCallback(
    (id: string, e: KeyboardEvent<HTMLButtonElement>) => {
      const step = e.shiftKey ? MOVE_STEP * 8 : MOVE_STEP;
      const p = positionsRef.current[id]!;
      const moves: Record<string, Point> = {
        ArrowLeft: { x: p.x - step, y: p.y },
        ArrowRight: { x: p.x + step, y: p.y },
        ArrowUp: { x: p.x, y: p.y - step },
        ArrowDown: { x: p.x, y: p.y + step },
      };
      const next = moves[e.key];
      if (!next) return;
      e.preventDefault();
      commit(id, next);
    },
    [commit],
  );
  const handlers = useRef({ onHandleDown, onHandleMove, onHandleUp, onHandleKey });
  handlers.current = { onHandleDown, onHandleMove, onHandleUp, onHandleKey };

  const register = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) frames.current.set(id, el);
    else frames.current.delete(id);
  }, []);

  return (
    <div className="fixed inset-0 bg-canvas text-fg">
      <div
        ref={shell}
        tabIndex={0}
        role="region"
        aria-label="Playful brainstorm canvas"
        aria-describedby={helpId}
        onKeyDown={onShellKey}
        className="absolute inset-0 cursor-default touch-none overflow-hidden overscroll-none outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        <p id={helpId} className="sr-only">
          Drag empty space or scroll to pan. Hold Control or Command and scroll, or pinch, to zoom. With the canvas focused, the arrow keys pan, plus and minus zoom, 0 resets and 1 fits everything.
        </p>
        <p id={moveHelpId} className="sr-only">
          Drag to move the item, or use the arrow keys; hold Shift for bigger steps.
        </p>
        <p id={copyHelpId} className="sr-only">
          Copies the name.
        </p>
        <div ref={world} className="absolute top-0 left-0 origin-top-left">
          {ITEMS.map((item) => (
            <Frame
              key={item.id}
              item={item}
              x={positions[item.id]!.x}
              y={positions[item.id]!.y}
              register={register}
              handlers={handlers}
              moveHelpId={moveHelpId}
              copyHelpId={copyHelpId}
            />
          ))}
        </div>
      </div>

      {/* Fixed controls, on glass because they float over the previews (P3). */}
      <div className="litt-glass pointer-events-auto fixed top-4 left-4 flex items-center gap-3 p-1 pr-4">
        <Button size="sm" variant="ghost" icon={<ChevronLeftIcon />} onClick={() => (location.hash = pages[0]?.id ?? "")}>
          Gallery
        </Button>
        <p className="text-small font-title text-fg">More fun, more play</p>
        <p className="hidden text-small text-fg-subtle sm:block">Today on the left, playful beside it</p>
      </div>
      <div className="litt-glass fixed right-4 bottom-4 flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-end gap-2 p-1" role="toolbar" aria-label="Canvas">
        <Button size="sm" variant="ghost" iconOnly aria-label="Zoom out" onClick={() => zoomBy(1 / ZOOM_STEP)}>
          <MinusIcon />
        </Button>
        <ZoomReadout listeners={zoomListeners} initial={camera.current.z} />
        <Button size="sm" variant="ghost" iconOnly aria-label="Zoom in" onClick={() => zoomBy(ZOOM_STEP)}>
          <PlusIcon />
        </Button>
        <Button size="sm" variant="ghost" onClick={fitAll}>
          Fit all
        </Button>
        <Button size="sm" variant="ghost" onClick={resetCamera}>
          Reset view
        </Button>
        <ThemeSwitch theme={theme} onChange={setTheme} />
      </div>
    </div>
  );
}

/** The zoom in percent. Only this re-renders while the camera moves. */
function ZoomReadout({ listeners, initial }: { listeners: { current: Set<(z: number) => void> }; initial: number }) {
  const [z, setZ] = useState(initial);
  useEffect(() => {
    const set = listeners.current;
    set.add(setZ);
    return () => void set.delete(setZ);
  }, [listeners]);
  return (
    <span aria-live="polite" className="w-12 text-center font-mono text-caption font-normal tabular-nums text-fg-subtle">
      {Math.round(z * 100)}%
    </span>
  );
}

type FrameProps = {
  item: CanvasItem;
  x: number;
  y: number;
  register: (id: string, el: HTMLDivElement | null) => void;
  handlers: {
    current: {
      onHandleDown: (id: string, e: ReactPointerEvent<HTMLButtonElement>) => void;
      onHandleMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
      onHandleUp: (e: ReactPointerEvent<HTMLButtonElement>) => void;
      onHandleKey: (id: string, e: KeyboardEvent<HTMLButtonElement>) => void;
    };
  };
  moveHelpId: string;
  copyHelpId: string;
};

/** One item: the handle and the name above, the live preview below at its own size. Re-renders only when it moves. */
const Frame = memo(function Frame({ item, x, y, register, handlers, moveHelpId, copyHelpId }: FrameProps) {
  const ref = useCallback((el: HTMLDivElement | null) => register(item.id, el), [register, item.id]);
  return (
    <div ref={ref} data-item={item.id} className="absolute top-0 left-0 grid gap-2" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <div className="flex h-6 items-center gap-1">
        <button
          type="button"
          aria-label={`Move ${item.name}`}
          aria-describedby={moveHelpId}
          onPointerDown={(e) => handlers.current.onHandleDown(item.id, e)}
          onPointerMove={(e) => handlers.current.onHandleMove(e)}
          onPointerUp={(e) => handlers.current.onHandleUp(e)}
          onPointerCancel={(e) => handlers.current.onHandleUp(e)}
          onKeyDown={(e) => handlers.current.onHandleKey(item.id, e)}
          className={
            "grid size-6 cursor-default touch-none place-items-center rounded-control text-fg-subtle [-webkit-tap-highlight-color:transparent] " +
            "transition-[background-color,color] duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg " +
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          }
        >
          <GripIcon />
        </button>
        <CopyName name={item.name} copyHelpId={copyHelpId} />
      </div>
      <div className="overflow-hidden rounded-surface bg-surface-1 p-6 shadow-[inset_0_0_0_1px_var(--line)]" style={{ width: item.width, height: item.height }}>
        {item.render()}
      </div>
    </div>
  );
});

/** The item's name as a quiet button: pressing it copies the name exactly. If the clipboard says no, the name is offered as selected text. */
function CopyName({ name, copyHelpId }: { name: string; copyHelpId: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = () => {
    const done = (next: "copied" | "failed") => {
      setState(next);
      clearTimeout(timer.current);
      if (next === "copied") timer.current = setTimeout(() => setState("idle"), 1600);
    };
    if (!navigator.clipboard?.writeText) return done("failed");
    navigator.clipboard.writeText(name).then(
      () => done("copied"),
      () => done("failed"),
    );
  };
  return (
    <span className="group/name flex items-center gap-2">
      {state === "failed" ? (
        <input
          readOnly
          aria-label={`${name}, select to copy`}
          value={name}
          size={name.length}
          ref={(el) => el?.select()}
          onBlur={() => setState("idle")}
          className="rounded-control bg-surface-1 px-1 text-caption font-label text-fg shadow-[inset_0_0_0_1px_var(--line)] outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={copy}
          aria-describedby={copyHelpId}
          className="cursor-pointer rounded-control px-1 text-caption font-label text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {name}
        </button>
      )}
      <span aria-live="polite" className="text-caption text-fg-subtle">
        {state === "copied" ? "Copied" : state === "failed" ? "Press ⌘C or Ctrl C to copy" : ""}
      </span>
      {state === "idle" && (
        <span aria-hidden="true" className="text-caption text-fg-subtle opacity-0 transition-opacity duration-(--dur-instant) ease-litt group-hover/name:opacity-100 group-has-focus-visible/name:opacity-100">
          Press to copy
        </span>
      )}
    </span>
  );
}

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
      {[5, 11].flatMap((x) => [4, 8, 12].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" />))}
    </svg>
  );
}
