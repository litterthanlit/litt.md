/**
 * MagneticButton, a Flat part (skills/litt-md/taste/litt-principles.md, Flat; proposals/flat-studies, Magnetic button):
 * the view's one ink pill with a little gravity. As a pointer comes near, the pill leans toward it, and its words ride
 * half as far again, so the pill seems to reach for the hand.
 *
 * - The pill: the ink (`bg-fg`, the page's words color, so it is the ink on light and on dark) with the paper's color
 *   on it, 48px tall at the pill radius, no outline and nothing cast. `pressed` turns it into the grey bubble with ink
 *   words, for a toggle such as Subscribe and Subscribed.
 * - The pull: within `reach` px of the pill's edge the pill moves toward the pointer by `strength` of the distance,
 *   fading to nothing at the edge of the reach. The pull is measured from the pill's place at rest, so it never chases
 *   itself. Springs wherever a hand is (Flat's motion, rule 3): while the pointer moves, the pill follows on the
 *   responsive spring with no bounce; when the pointer leaves, it springs home on the expressive spring, so it
 *   overshoots a little (Flat's 0.28) and settles.
 * - Only a mouse or a pen pulls: a touch has no hover, so the pill stays where it is. Under reduced motion it never
 *   moves. It never moves on its own (R4).
 * - Press: a short scale to 0.97 on the instant tier (transform only).
 * - Semantics: a native button. `pressed` sets aria-pressed, so a toggle says its state; everything else (onClick,
 *   type, disabled, aria-*) passes through to the button.
 */
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type MagneticButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** The words on the pill, with an icon after them if you like. */
  children: ReactNode;
  /** A toggle's state: true draws the grey bubble with ink words and sets aria-pressed. Leave it out for a plain action. */
  pressed?: boolean;
  /** How far the pill moves toward the pointer, as a share of the distance from its centre. Default 0.35. */
  strength?: number;
  /** How far past the pill's edge, in px, the pull reaches before it fades to nothing. Default 150. */
  reach?: number;
  /** Extra classes for the wrapper that moves. */
  className?: string;
};

/** An ink pill with a little gravity: it leans toward a pointer that comes near and springs home when it leaves. A Flat part. */
export function MagneticButton({
  children,
  pressed,
  strength = 0.35,
  reach = 150,
  className = "",
  type = "button",
  ...button
}: MagneticButtonProps) {
  const { reduced } = useMotionDial();
  const follow = useTransition("responsive");
  const home = useTransition("expressive");
  const wrap = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const labelX = useTransform(x, (v) => v * 0.5);
  const labelY = useTransform(y, (v) => v * 0.5);

  /* Read through refs, so the window listener is added once and always uses the latest springs and props. */
  const live = useRef({ follow, home, strength, reach, reduced });
  live.current = { follow, home, strength, reach, reduced };

  useEffect(() => {
    let leaning = false;
    const go = (tx: number, ty: number, how: typeof follow) => {
      animate(x, tx, how);
      animate(y, ty, how);
    };
    const onMove = (e: PointerEvent) => {
      const el = wrap.current;
      const { strength: k, reach: far, reduced: still, follow: f, home: h } = live.current;
      if (!el || still || e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      const cx = r.left - x.get() + r.width / 2;
      const cy = r.top - y.get() + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const out = Math.max(0, Math.abs(dx) - r.width / 2) + Math.max(0, Math.abs(dy) - r.height / 2);
      const pull = Math.max(0, 1 - out / far);
      if (pull > 0) {
        leaning = true;
        go(dx * k * pull, dy * k * pull, f);
      } else if (leaning) {
        leaning = false;
        go(0, 0, h);
      }
    };
    const letGo = () => {
      if (!leaning) return;
      leaning = false;
      go(0, 0, live.current.home);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", letGo);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", letGo);
    };
  }, [x, y]);

  /* Reduced motion turned on while it leans: home at once. */
  useEffect(() => {
    if (!reduced) return;
    x.set(0);
    y.set(0);
  }, [reduced, x, y]);

  return (
    <motion.span ref={wrap} style={{ x, y }} className={"inline-flex " + className}>
      <button
        type={type}
        aria-pressed={pressed}
        {...button}
        className={
          "litt-target group/magnet relative inline-flex h-12 min-w-0 cursor-pointer items-center justify-center rounded-pill px-6 text-body font-label select-none [-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40 forced-colors:border " +
          (pressed ? "bg-block text-fg hover:bg-(--block-hover)" : "bg-fg text-canvas hover:opacity-90")
        }
      >
        <span className="inline-flex transition-transform duration-(--dur-instant) ease-litt group-active/magnet:scale-97">
          <motion.span style={{ x: labelX, y: labelY }} className="inline-flex items-center gap-2">
            {children}
          </motion.span>
        </span>
      </button>
    </motion.span>
  );
}
