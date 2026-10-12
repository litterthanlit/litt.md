/**
 * Toast: custom, no Radix. The other half of the expressive moment.
 *
 * - <Toaster> is a provider plus a portal. Mount it once around the part of the
 *   app that fires toasts; children call useToast(). A bare toast() also works
 *   and routes to the Toaster mounted last.
 * - Look: litt-glass (float shadow), rounded-surface, 360px, fixed height (72px)
 *   so the stack math is plain arithmetic. A tone dot, a small ghost action and
 *   a round close button.
 * - Stack: the newest is in front. Older toasts sit behind, 8px and 16px up,
 *   scaled 0.96 and 0.92, fading. Beyond three they wait out of sight and move
 *   up as space frees. Hover or keyboard focus expands the stack into a list.
 *   Only transform and opacity move, never height or top.
 * - Motion: entering is expressive (from below by useTravel(), scale 0.98 to 1).
 *   Restacking is responsive. Exiting is useExit("expressive"): x by travel
 *   toward the right edge, fading, never bouncing.
 * - Behavior: auto-dismiss after about 4s, errors stay. Paused while hovered,
 *   focused or when the tab is hidden. Escape dismisses the focused toast.
 *   F8 moves focus to the newest toast. Each toast is its own live region:
 *   polite, or assertive for errors.
 * - Touch: there is no hover, so tapping the stack pins it open; tap outside to
 *   close it again.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";
import { Button } from "@/components/button";
import { XIcon } from "@/components/icons";

export type ToastTone = "neutral" | "success" | "error";

export type ToastOptions = {
  /** The message. Keep it to a few words: it is one line, or two when there is no description. */
  title: ReactNode;
  /** A second line in a quieter color, cut to one line. */
  description?: ReactNode;
  /** "neutral" (the default), "success" or "error". It sets the status dot. Errors are announced at once and stay until dismissed. */
  tone?: ToastTone;
  /** A small button on the right, such as Undo or View. Pressing it runs onClick and then dismisses the toast. */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before it dismisses itself. The default is 4000, and errors stay unless you set it. 0 or Infinity stays until dismissed. */
  duration?: number;
};

type ToastItem = ToastOptions & { id: string };

type ToastApi = {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

/* Stack geometry. Fixed height keeps every position a sum of constants. */
const MAX_VISIBLE = 3;
const HEIGHT = 72;
const GAP = 8;
const PEEK = 8;
const SCALES = [1, 0.96, 0.92];
const FADES = [1, 0.8, 0.55];
const AUTO_DISMISS_MS = 4000;

function slotFor(depth: number, expanded: boolean) {
  const d = Math.min(depth, MAX_VISIBLE - 1);
  const away = depth >= MAX_VISIBLE;
  return expanded
    ? { y: -d * (HEIGHT + GAP), scale: 1, opacity: away ? 0 : 1 }
    : { y: -d * PEEK, scale: SCALES[d], opacity: away ? 0 : FADES[d] };
}

const ToastContext = createContext<ToastApi | null>(null);

/** Toasters that are mounted, newest last. toast() talks to the last one. */
const sinks: Array<(options: ToastOptions) => string> = [];

/**
 * Fire a toast from anywhere, without a hook. It goes to the Toaster mounted last, and does nothing
 * (it returns an empty string) when no Toaster is mounted.
 *
 * @param options What to show. Only the title is required.
 * @returns An id you can pass to dismiss().
 */
export function toast(options: ToastOptions): string {
  return sinks[sinks.length - 1]?.(options) ?? "";
}

/**
 * The Toaster's controls: toast(options) shows a toast and returns its id, dismiss(id) removes one, and
 * dismissAll() clears the stack. Use it inside a Toaster, or it throws.
 */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <Toaster>");
  return api;
}

/**
 * Holds the toasts and draws them in a corner of the screen, above everything else. Mount it once, around
 * the part of the app that fires toasts.
 */
export function Toaster({
  children,
}: {
  /** The part of the app that fires toasts. It renders as it is; the toasts themselves are drawn in a portal on the page body. */
  children?: ReactNode;
}) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const push = useCallback((options: ToastOptions) => {
    const id = `toast-${++counter.current}`;
    setItems((list) => [...list, { ...options, id }]);
    return id;
  }, []);
  const dismiss = useCallback((id: string) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const dismissAll = useCallback(() => setItems([]), []);

  useEffect(() => {
    sinks.push(push);
    return () => {
      const at = sinks.indexOf(push);
      if (at >= 0) sinks.splice(at, 1);
    };
  }, [push]);

  const api = useMemo<ToastApi>(() => ({ toast: push, dismiss, dismissAll }), [push, dismiss, dismissAll]);

  return (
    <ToastContext value={api}>
      {children}
      {typeof document !== "undefined" && createPortal(<ToastRegion items={items} dismiss={dismiss} />, document.body)}
    </ToastContext>
  );
}

function ToastRegion({ items, dismiss }: { items: ToastItem[]; dismiss: (id: string) => void }) {
  const regionRef = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [hover, setHover] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [kbd, setKbd] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [tabHidden, setTabHidden] = useState(() => document.visibilityState === "hidden");

  const expanded = hover || kbd || pinned;
  const paused = hover || focusIn || pinned || tabHidden;
  const count = Math.min(items.length, MAX_VISIBLE);
  const height = count === 0 ? 0 : expanded ? count * HEIGHT + (count - 1) * GAP : HEIGHT + (count - 1) * PEEK;

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /* A removed element fires no blur and no pointerleave, so re-read the truth. */
  const syncFocus = useCallback(() => {
    const region = regionRef.current;
    const active = document.activeElement;
    const inside = !!region && !!active && region.contains(active);
    setFocusIn(inside);
    setKbd(inside && !!active && active.matches(":focus-visible"));
  }, []);

  useEffect(() => {
    syncFocus();
    if (items.length === 0) {
      setHover(false);
      setPinned(false);
    }
  }, [items.length, syncFocus]);

  /* F8 jumps to the newest toast, the way Radix does. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "F8" || items.length === 0) return;
      e.preventDefault();
      const newest = items[items.length - 1];
      regionRef.current?.querySelector<HTMLElement>(`[data-toast-id="${newest.id}"] button`)?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items]);

  /* On touch the stack opens by tap and closes by tapping elsewhere. */
  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: PointerEvent) => {
      if (!regionRef.current?.contains(e.target as Node)) setPinned(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [pinned]);

  return (
    <section
      ref={regionRef}
      aria-label="Notifications"
      className={
        "fixed inset-x-gutter bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-60 sm:inset-x-auto sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:w-90 " +
        (count === 0 ? "pointer-events-none" : "")
      }
      style={{ height }}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") setHover(true);
      }}
      onPointerLeave={() => setHover(false)}
      onFocus={(e) => {
        const from = e.relatedTarget as HTMLElement | null;
        if (from && !e.currentTarget.contains(from)) returnFocus.current = from;
        setFocusIn(true);
        setKbd(e.target.matches(":focus-visible"));
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocusIn(false);
          setKbd(false);
        }
      }}
      onClick={(e) => {
        const coarse = window.matchMedia("(hover: none)").matches;
        if (coarse && items.length > 1 && !(e.target as HTMLElement).closest("button")) setPinned((p) => !p);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        const id = (e.target as HTMLElement).closest<HTMLElement>("[data-toast-id]")?.dataset.toastId;
        if (!id) return;
        const rest = items.filter((t) => t.id !== id);
        dismiss(id);
        const next = rest[rest.length - 1];
        requestAnimationFrame(() => {
          const target = next && regionRef.current?.querySelector<HTMLElement>(`[data-toast-id="${next.id}"] button`);
          (target || returnFocus.current)?.focus();
        });
      }}
    >
      <AnimatePresence onExitComplete={syncFocus}>
        {items.map((item, i) => (
          <ToastView
            key={item.id}
            item={item}
            depth={items.length - 1 - i}
            expanded={expanded}
            paused={paused}
            onDismiss={dismiss}
          />
        ))}
      </AnimatePresence>
    </section>
  );
}

const DOT: Record<ToastTone, string> = {
  neutral: "bg-fg-subtle",
  success: "bg-success",
  error: "bg-danger",
};

function ToastView({
  item,
  depth,
  expanded,
  paused,
  onDismiss,
}: {
  item: ToastItem;
  depth: number;
  expanded: boolean;
  paused: boolean;
  onDismiss: (id: string) => void;
}) {
  const enter = useTransition("expressive");
  const move = useTransition("responsive");
  const exit = useExit("expressive");
  const travel = useTravel();
  const settled = useRef(false);

  const tone = item.tone ?? "neutral";
  const away = depth >= MAX_VISIBLE;
  const slot = slotFor(depth, expanded);
  const showContent = depth === 0 || expanded;

  const wanted = item.duration ?? (tone === "error" ? Infinity : AUTO_DISMISS_MS);
  const persistent = !Number.isFinite(wanted) || wanted <= 0;
  const remaining = useRef(persistent ? 0 : wanted);
  const idle = persistent || paused || away;

  /* The clock only runs while the toast is visible and nobody is reading it. */
  useEffect(() => {
    if (idle) return;
    const started = performance.now();
    const timer = window.setTimeout(() => onDismiss(item.id), Math.max(remaining.current, 0));
    return () => {
      window.clearTimeout(timer);
      remaining.current -= performance.now() - started;
    };
  }, [idle, item.id, onDismiss]);

  return (
    <motion.div
      data-toast-id={item.id}
      data-tone={tone}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      inert={away}
      className="litt-glass absolute inset-x-0 bottom-0 h-18 origin-top rounded-surface"
      initial={{ opacity: 0, y: slot.y + travel, scale: 0.98 }}
      animate={{ opacity: slot.opacity, y: slot.y, scale: slot.scale, transition: settled.current ? move : enter }}
      exit={{ opacity: 0, x: travel, transition: exit }}
      onAnimationComplete={() => {
        settled.current = true;
      }}
    >
      <motion.div
        className="flex h-full items-center gap-3 px-4"
        initial={false}
        animate={{ opacity: showContent ? 1 : 0, transition: move }}
      >
        <span aria-hidden="true" className={"size-2 shrink-0 rounded-pill " + DOT[tone]} />
        <div className="min-w-0 flex-1">
          <p className={"text-small text-fg " + (item.description ? "truncate" : "line-clamp-2")}>{item.title}</p>
          {item.description && <p className="truncate text-caption text-fg-subtle">{item.description}</p>}
        </div>
        {item.action && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              item.action?.onClick();
              onDismiss(item.id);
            }}
          >
            {item.action.label}
          </Button>
        )}
        <Button size="sm" variant="ghost" iconOnly aria-label="Dismiss notification" onClick={() => onDismiss(item.id)}>
          <XIcon />
        </Button>
      </motion.div>
    </motion.div>
  );
}
