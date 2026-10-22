/**
 * Resizable: panels side by side, or one above another, with a line between them that a person drags to give one more
 * room: a file tree beside a log, a list beside its detail, a chat beside a preview (components.md, "Resizable").
 * ResizablePanelGroup, ResizablePanel and ResizableHandle, as shadcn names them.
 *
 * - Sizes are percents of the group, from each panel's defaultSize (the rest shared out evenly), kept between its
 *   minSize and maxSize. A handle moves the line between the two panels beside it, and only those two.
 * - The handle is a 1px --line hairline, the look of every divider, with a 12px hit area (44px on a touch screen). It
 *   turns --line-strong under the pointer and --fg-subtle while it is dragged, on the instant tier. No grip and no
 *   dots: the cursor says it moves. Focus draws the 2px focus ring around it.
 * - Dragging follows the pointer one to one, with no easing and no snapping. A double click puts the two panels back
 *   to where they started.
 * - Keys, on the handle (a Tab stop): ← and → (↑ and ↓ when stacked) move the line by 5%, with Shift by 20%; Home and
 *   End give the panel before it its smallest and largest size.
 * - `autoSaveId` keeps the sizes in the browser, so the layout someone chose is there next time. `onLayout` hands them
 *   to you instead, to keep them anywhere.
 * - On a phone two panels side by side are rarely both readable: show one at a time there (a Segmented control or
 *   Tabs), and keep the group for wider screens.
 * - Accessibility: each handle is a separator with aria-valuenow (the size of the panel before it), aria-valuemin,
 *   aria-valuemax and aria-controls pointing at that panel, named by `label` ("Resize the file tree").
 */
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";

type Direction = "horizontal" | "vertical";

type PanelSpec = { defaultSize?: number; minSize: number; maxSize: number };

type GroupCtx = {
  direction: Direction;
  sizes: number[];
  specs: PanelSpec[];
  ids: string[];
  group: RefObject<HTMLDivElement | null>;
  /** Set the panels either side of handle `before` (the panel before it) so the one before is `size`. */
  resize: (before: number, size: number, start?: number[]) => void;
  /** Put the two panels beside handle `before` back to their starting sizes. */
  reset: (before: number) => void;
  /** Tell the caller (and the browser's storage) the layout after a drag or a key. */
  settle: () => void;
};

const GroupContext = createContext<GroupCtx | null>(null);
const SlotContext = createContext<number>(0);

/** Starting sizes: each panel's defaultSize, the rest shared evenly among the panels without one, scaled to 100. */
function startingSizes(specs: PanelSpec[]): number[] {
  const given = specs.reduce((sum, s) => sum + (s.defaultSize ?? 0), 0);
  const open = specs.filter((s) => s.defaultSize === undefined).length;
  const share = open ? Math.max(0, 100 - given) / open : 0;
  const raw = specs.map((s) => s.defaultSize ?? share);
  const total = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((v) => (v / total) * 100);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const STORE = (id: string) => `litt-resizable:${id}`;

export type ResizablePanelGroupProps = {
  /** Side by side (horizontal) or one above another (vertical). */
  direction?: Direction;
  /** Keep the sizes in the browser under this name, so the layout someone chose comes back. */
  autoSaveId?: string;
  /** Called with every panel's size, in percent, after a drag or a key. */
  onLayout?: (sizes: number[]) => void;
  /** ResizablePanels with a ResizableHandle between each two. */
  children: ReactNode;
  /** Extra classes for the group. Give it a height when it is horizontal and its panels scroll inside. */
  className?: string;
};

/** The row or column of panels. Put ResizablePanels in it with a ResizableHandle between each two. */
export function ResizablePanelGroup({ direction = "horizontal", autoSaveId, onLayout, children, className = "" }: ResizablePanelGroupProps) {
  const base = useId();
  const parts = Children.toArray(children).filter(isValidElement) as ReactElement<Record<string, unknown>>[];
  const panels = parts.filter((p) => p.type === ResizablePanel) as ReactElement<ResizablePanelProps>[];
  const specs: PanelSpec[] = panels.map((p) => ({ defaultSize: p.props.defaultSize, minSize: p.props.minSize ?? 0, maxSize: p.props.maxSize ?? 100 }));
  const ids = panels.map((p, i) => p.props.id ?? `${base}-panel-${i}`);
  const [sizes, setSizes] = useState(() => startingSizes(specs));
  const latest = useRef(sizes);
  latest.current = sizes;
  const group = useRef<HTMLDivElement>(null);

  /* A saved layout comes back after the first render, so the server and the browser agree on the first one. */
  useLayoutEffect(() => {
    if (!autoSaveId) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORE(autoSaveId)) ?? "null") as unknown;
      if (Array.isArray(saved) && saved.length === specs.length && saved.every((n) => typeof n === "number")) setSizes(saved as number[]);
    } catch {
      /* no storage, or something else stored there: keep the defaults */
    }
    // once, for this name
  }, [autoSaveId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* A panel added or removed: start over from the defaults. */
  if (sizes.length !== specs.length) setSizes(startingSizes(specs));

  const resize = (before: number, size: number, start = latest.current) => {
    const a = specs[before]!;
    const b = specs[before + 1]!;
    const pair = start[before]! + start[before + 1]!;
    let first = clamp(size, a.minSize, a.maxSize);
    let second = pair - first;
    const fixed = clamp(second, b.minSize, b.maxSize);
    if (fixed !== second) {
      second = fixed;
      first = pair - second;
    }
    const next = [...start];
    next[before] = first;
    next[before + 1] = second;
    setSizes(next);
    latest.current = next;
  };

  const reset = (before: number) => {
    const fresh = startingSizes(specs);
    const now = latest.current;
    const pair = now[before]! + now[before + 1]!;
    const share = fresh[before]! / (fresh[before]! + fresh[before + 1]!);
    resize(before, pair * share);
    settle();
  };

  const settle = () => {
    onLayout?.(latest.current);
    if (!autoSaveId) return;
    try {
      localStorage.setItem(STORE(autoSaveId), JSON.stringify(latest.current.map((n) => Math.round(n * 100) / 100)));
    } catch {
      /* storage is full or off: the layout still holds for this visit */
    }
  };

  let panelIndex = -1;
  return (
    <GroupContext value={{ direction, sizes, specs, ids, group, resize, reset, settle }}>
      <div
        ref={group}
        data-direction={direction}
        className={"flex min-h-0 min-w-0 " + (direction === "horizontal" ? "flex-row" : "flex-col") + " " + className}
      >
        {parts.map((part, i) => {
          if (part.type === ResizablePanel) panelIndex++;
          /* A panel knows its own place; a handle knows the panel before it. */
          return (
            <SlotContext key={part.key ?? i} value={panelIndex}>
              {part}
            </SlotContext>
          );
        })}
      </div>
    </GroupContext>
  );
}

export type ResizablePanelProps = {
  /** Its starting size, in percent of the group. Panels without one share what is left. */
  defaultSize?: number;
  /** The smallest it may be, in percent. */
  minSize?: number;
  /** The largest it may be, in percent. */
  maxSize?: number;
  /** An id of your own, for aria-controls on its handle. */
  id?: string;
  /** What the panel holds. It clips to its size, so give a long list its own ScrollArea. */
  children: ReactNode;
  /** Extra classes for the panel. */
  className?: string;
};

/** One panel. Its size comes from the group; it clips what it holds to that size. */
export function ResizablePanel({ children, className = "" }: ResizablePanelProps) {
  const ctx = useContext(GroupContext);
  const index = useContext(SlotContext);
  if (!ctx) throw new Error("ResizablePanel must sit inside a ResizablePanelGroup.");
  const size = ctx.sizes[index] ?? 0;
  return (
    <div
      id={ctx.ids[index]}
      data-panel=""
      className={"min-h-0 min-w-0 overflow-hidden " + className}
      style={{ flex: `${size} 1 0px` }}
    >
      {children}
    </div>
  );
}

export type ResizableHandleProps = {
  /** What moving it does, for screen readers: "Resize the file tree". */
  label?: string;
  /** Extra classes for the handle. */
  className?: string;
};

/** The line between two panels. Drag it, or focus it and use the arrow keys. A double click puts the two back. */
export function ResizableHandle({ label = "Resize", className = "" }: ResizableHandleProps) {
  const ctx = useContext(GroupContext);
  const before = useContext(SlotContext);
  if (!ctx) throw new Error("ResizableHandle must sit inside a ResizablePanelGroup.");
  const { direction, sizes, specs, ids, group, resize, reset, settle } = ctx;
  const [dragging, setDragging] = useState(false);
  const horizontal = direction === "horizontal";
  const spec = specs[before];
  if (!spec || !specs[before + 1]) return null;

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !group.current) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.focus({ preventScroll: true });
    const panels = Array.from(group.current.children).filter((el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute("data-panel"));
    const room = panels.reduce((sum, el) => sum + (horizontal ? el.offsetWidth : el.offsetHeight), 0) || 1;
    const rtl = horizontal && getComputedStyle(group.current).direction === "rtl";
    const start = [...sizes];
    const from = horizontal ? e.clientX : e.clientY;
    handle.setPointerCapture(e.pointerId);
    setDragging(true);
    const cursor = document.body.style.cursor;
    document.body.style.cursor = horizontal ? "col-resize" : "row-resize";

    const move = (ev: PointerEvent) => {
      const moved = ((horizontal ? ev.clientX : ev.clientY) - from) * (rtl ? -1 : 1);
      resize(before, start[before]! + (moved / room) * 100, start);
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      document.body.style.cursor = cursor;
      setDragging(false);
      settle();
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const by = e.shiftKey ? 20 : 5;
    const rtl = horizontal && getComputedStyle(e.currentTarget).direction === "rtl";
    const grow = horizontal ? (rtl ? "ArrowLeft" : "ArrowRight") : "ArrowDown";
    const shrink = horizontal ? (rtl ? "ArrowRight" : "ArrowLeft") : "ArrowUp";
    const now = sizes[before]!;
    const to = e.key === grow ? now + by : e.key === shrink ? now - by : e.key === "Home" ? spec.minSize : e.key === "End" ? spec.maxSize : null;
    if (to === null) return;
    e.preventDefault();
    resize(before, to);
    settle();
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-controls={ids[before]}
      aria-valuenow={Math.round(sizes[before] ?? 0)}
      aria-valuemin={spec.minSize}
      aria-valuemax={spec.maxSize}
      data-dragging={dragging ? "" : undefined}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={() => reset(before)}
      className={[
        "relative z-10 shrink-0 touch-none bg-line outline-none [-webkit-tap-highlight-color:transparent]",
        "transition-[background-color] duration-(--dur-instant) ease-litt hover:bg-line-strong data-[dragging]:bg-fg-subtle",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        /* The hit area: 12px, or 44px under a finger, centered on the hairline. */
        "before:absolute",
        horizontal
          ? "w-px cursor-col-resize self-stretch before:inset-y-0 before:-inset-x-1.5 pointer-coarse:before:-inset-x-5"
          : "h-px cursor-row-resize self-stretch before:inset-x-0 before:-inset-y-1.5 pointer-coarse:before:-inset-y-5",
        className,
      ].join(" ")}
    />
  );
}
