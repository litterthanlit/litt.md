/**
 * Switch (components.md, "Switch"): an on or off setting that takes effect as a setting.
 *
 * - Built on @radix-ui/react-switch. The root is a <button role="switch"> with aria-checked,
 *   Space toggles it, and inside a <form> a hidden input sends the value like a checkbox:
 *   the value when on, nothing when off. The hidden input is Radix's, so name, value and
 *   required are passed straight to it.
 * - A thick block thrown along a deep tray (material.md, 6, "Press"). The tray is 92 by 32, cut deep: --slot with
 *   --slot-shade, at the control radius. The block fills half of it, 44 by 28, set 2px in, raised: --block with
 *   --block-lift and a lit top edge (--highlight). Its corners are the control radius less those 2px, so the two
 *   stay concentric at every shape.
 * - The tray's floor says the state: "On" set in the floor's start, "Off" at its end, at the caption size and the
 *   title weight, in --fg. The block carries no word; it covers the word on its side and its travel uncovers the
 *   other. Position and word both change, so color is never the signal.
 * - Two tones. neutral (the default) keeps the block white when on. accent fills it with the accent. The accent is one fill per view (R6), so accent is for a lone switch that is the view's
 *   main choice; a list of settings stays neutral.
 * - No invalid state. A choice that can be wrong, such as accepting terms, is a Checkbox.
 * - The label is a real <label for> stretched over the whole row, so a click anywhere in it toggles the switch. Its
 *   accessible name is only its text (the floor's words are hidden from screen readers, aria-checked says the state),
 *   and the description is linked with aria-describedby. By default the switch comes first, like the checkbox.
 *   With align="end" the label and description come first and the switch sits at the row's end, so the switches
 *   of a settings list line up in one column.
 * - Hand: press anywhere on the row and the block presses down (its cast tightens). A click, a tap or Space toggles
 *   it. Or take the block and drag it: it follows the finger one to one, says the side it is over, and lands on the
 *   nearer side when let go. A drag that ends where it started changes nothing.
 * - Motion: the block crosses on the responsive tier (bounce 0), by translate; its fill, word and cast change on the
 *   instant tier. The tray never moves. Hover deepens the tray's floor a little.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): the block crosses on fun mode's glide spring,
 *   as a CSS linear() easing, so it meets the far wall with a little life and settles. At rest it is exactly the
 *   block above. Reduced motion turns it off.
 * - Touch: rows are at least 44px tall. The tray owns a sideways drag and leaves vertical scrolling to the page.
 * - One contract, three bodies (proposals/worlds.md, Bodies). This file is the contract: the props, the Radix root with
 *   its role and aria-checked, the hidden input, the label and description, the hand (press, drag, keys) and the state.
 *   It resolves them once into SwitchBodyProps and renders the body the material picks (byWorld). PressBody, above, is
 *   the default. bodies/switch.flat.tsx and bodies/switch.device.tsx are the other two; each draws its own root
 *   element, and its own --sw-travel, which a drag measures. A frame that sets its own look (a study's strip, a
 *   preview inside a MaterialProvider) draws its own body, not <html>'s.
 * - Flat (R1 to R3, proposals/flat-pill.md), bodies/switch.flat.tsx: a small ink pill with a canvas knob when on and an
 *   outline pill (the 1.5px --line-control edge, a --line-control knob) when off, the accent only for tone="accent".
 *   The word sits in type beside it in the text weight, both words in one cell so the row never reflows. The pill is
 *   44 by 26 and the knob 20, so the crossing is 18px.
 * - Device, bodies/switch.device.tsx: a toggle key in a well that flips with a detent (three steps on the instant
 *   tier, never a spring), and its word on a small LCD beside it in the mono, with a lamp that lights when on.
 * - Forced colors drops box-shadow and background colors, so the tray and the block get real borders and system
 *   colors mark the on state.
 */
import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { byWorld, useFun, useMaterial } from "@/motion";
import { SwitchDeviceBody } from "./bodies/switch.device";
import { SwitchFlatBody } from "./bodies/switch.flat";

export type SwitchAlign = "start" | "end";
export type SwitchTone = "neutral" | "accent";

export type SwitchProps = {
  /** The label, beside the switch. Required, because a switch alone has no name. The whole row is clickable. */
  label: ReactNode;
  /** A line of detail under the label. It is linked to the switch with aria-describedby. */
  description?: ReactNode;
  /** Whether the switch is on, when you control it. Pair it with onCheckedChange. */
  checked?: boolean;
  /** Whether the switch starts on, when you do not control it. */
  defaultChecked?: boolean;
  /** Called with the new state each time the switch is toggled, by click, tap, drag, label or Space. */
  onCheckedChange?: (checked: boolean) => void;
  /** "neutral" keeps the block white when on. "accent" fills it with the accent: one per view (R6), for a lone switch that is the view's main choice. */
  tone?: SwitchTone;
  /** The block's two words, [off, on]. Keep them to three letters or so, such as ["Aus", "An"]. The state itself is read from aria-checked. */
  words?: [string, string];
  /** Mutes the row, skips it in the tab order and keeps a form from sending it. */
  disabled?: boolean;
  /** Marks the switch as required, for a form that must have it on. It sets aria-required. */
  required?: boolean;
  /** The name a form sends the value under. A form sends it only while the switch is on. */
  name?: string;
  /** What a form sends while the switch is on. */
  value?: string;
  /** The id of the switch, which the label points at. Made up for you when left out. */
  id?: string;
  /** "start" puts the switch first, then the label, like the checkbox. "end" puts the label first and the switch at the end of a full-width row, for settings lists. */
  align?: SwitchAlign;
  /** Extra classes for the row, such as a width. */
  className?: string;
  /** The switch button, for focus or a form library. */
  ref?: Ref<HTMLButtonElement>;
};

/**
 * What the contract hands a body: the switch resolved once. A body draws the control (the Radix root and what is
 * inside it); the row, the label and the description stay with the contract. A body keeps the root's role, aria-checked
 * and wiring (`root`), says the state without color alone, gives the row 44px, sets --sw-travel on the root (what a
 * drag measures) and carries data-body on it.
 */
export type SwitchBodyProps = {
  /** The side shown: the switch's state, or the side a drag is over. */
  shown: boolean;
  disabled: boolean;
  /** A hand is dragging the knob, so it follows 1:1 and nothing eases it. */
  dragging: boolean;
  /** The knob's translate: the drag's px while dragging, else the start or --sw-travel. */
  x: string;
  tone: SwitchTone;
  /** [off, on]. */
  words: [string, string];
  /** The knob's transitions: the crossing on the responsive tier or fun mode's glide, and while dragging only the colors. */
  motion: CSSProperties;
  /** The Radix root's props: id, checked, handlers, aria-describedby, name, value, required, ref. */
  root: ComponentProps<typeof SwitchPrimitive.Root> & { "data-no-drag": "" };
  /** Where the control sits in the row's grid. */
  className: string;
};

/** How far the block crosses in Press, in px: the tray's 92, less 2px on each side, less the block's own 44. Flat and Device set their own through --sw-travel. */
const TRAVEL = 44;
/** How far a finger moves before a press becomes a drag, in px. */
const SLOP = 4;

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The tray is the button, cut deep into the plate (--slot, --slot-shade). The row's label is stretched over the whole
   row, so the tray sits above it (z-1) and a press on the tray itself still lands on the button. It clips the block,
   so a cast never spills past its walls. */
const tray =
  "[--sw-travel:44px] " +
  "peer relative z-1 inline-flex h-8 w-23 shrink-0 cursor-pointer touch-pan-y items-center self-start overflow-hidden rounded-control p-0.5 " +
  "bg-slot shadow-(--slot-shade) " +
  "transition-[background-color] duration-(--dur-instant) ease-litt " +
  "enabled:group-hover/switch:bg-[color-mix(in_oklab,var(--slot),var(--fg)_4%)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border forced-colors:p-px " + // the border is real, so the padding gives it back its px
  focusRing;

/* A word set in the floor, one in each half. The block covers the one on its side and uncovers the other, so travel
   is what reveals the state. --fg on the --slot floor keeps 4.5:1. */
const floorWord =
  "pointer-events-none absolute inset-y-0 flex w-1/2 select-none items-center justify-center text-caption font-title text-fg " +
  "forced-colors:text-[CanvasText]";

/* The block, thick and bare: a lit top edge (--highlight) over its cast, no word on it. Its corners are the control
   radius less the 2px it is set in, so they stay concentric with the tray's. */
const blockBase =
  "pointer-events-none flex h-7 w-11 shrink-0 rounded-[calc(var(--radius-control)-2px)] " +
  "forced-colors:border";

const blockLift = "shadow-[var(--block-lift),var(--highlight)] group-active/switch:shadow-[var(--block-press),var(--highlight)]";
const blockOff = "bg-block " + blockLift;
const blockOn: Record<SwitchTone, string> = {
  neutral: "bg-block " + blockLift + " forced-colors:bg-[Highlight]",
  accent: "bg-accent " + blockLift + " forced-colors:bg-[Highlight]",
};
/* Disabled, the block lies flat: no cast, a hairline. */
const blockDisabled = "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";

/** Press, the default body: a thick block thrown along a deep tray to a stop, uncovering the word set in the floor. */
function PressBody({ shown, disabled, x, tone, words, motion, root, className }: SwitchBodyProps) {
  const block = blockBase + " " + (disabled ? blockDisabled : shown ? blockOn[tone] : blockOff);
  const word = floorWord + (disabled ? " text-fg-disabled" : "");
  return (
    <SwitchPrimitive.Root {...root} data-body="press" className={tray + className}>
      <span aria-hidden="true" className={word + " left-0"}>{words[1]}</span>
      <span aria-hidden="true" className={word + " right-0"}>{words[0]}</span>
      <SwitchPrimitive.Thumb className={block} style={{ ...motion, translate: `${x} 0` }} />
    </SwitchPrimitive.Root>
  );
}

/* The block's crossing on the responsive tier, and its fill, word and cast on the instant tier. While a hand drags it,
   it follows one to one, so only the colors keep their fade. */
const crossing: CSSProperties = {
  transitionProperty: "translate, background-color, color, box-shadow",
  transitionDuration: "var(--dur-responsive), var(--dur-instant), var(--dur-instant), var(--dur-instant)",
  transitionTimingFunction: "var(--ease-responsive), var(--ease-out), var(--ease-out), var(--ease-out)",
};
const following: CSSProperties = {
  transitionProperty: "background-color, color, box-shadow",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: "var(--ease-out)",
};

/** One switch with its label. Use checked and onCheckedChange to control it, or defaultChecked to leave it alone. */
export function Switch({
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  tone = "neutral",
  words = ["Off", "On"],
  disabled,
  required,
  name,
  value,
  id: idProp,
  align = "start",
  className = "",
  ref,
}: SwitchProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const descriptionId = description ? `${id}-description` : undefined;
  const end = align === "end";
  const Body = byWorld(useMaterial(), { press: PressBody, flat: SwitchFlatBody, device: SwitchDeviceBody });

  /* The switch keeps its own state when you do not control it, because a drag sets it to a side, not a flip. */
  const [inner, setInner] = useState(defaultChecked ?? false);
  const on = checked ?? inner;
  const set = (next: boolean) => {
    if (checked === undefined) setInner(next);
    onCheckedChange?.(next);
  };

  /* A hand on the block: where it took hold, and where the block is now. A press becomes a drag past SLOP px. */
  const hand = useRef<{ id: number; x0: number; from: number; at: number; scale: number; travel: number; moved: boolean } | null>(null);
  const dropped = useRef(-1);
  const [dragX, setDragX] = useState<number | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const scale = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1;
    const travel = parseFloat(getComputedStyle(el).getPropertyValue("--sw-travel")) || TRAVEL;
    const from = on ? travel : 0;
    hand.current = { id: e.pointerId, x0: e.clientX, from, at: from, scale, travel, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    const dx = (e.clientX - h.x0) / h.scale;
    if (!h.moved && Math.abs(dx) < SLOP) return;
    h.moved = true;
    h.at = Math.min(h.travel, Math.max(0, h.from + dx));
    setDragX(h.at);
  };
  const onPointerEnd = (e: PointerEvent<HTMLButtonElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    hand.current = null;
    if (!h.moved) return;
    setDragX(null);
    if (e.type === "pointercancel") return;
    /* The click that follows a drag must not flip it back: the drop already chose the side. */
    dropped.current = e.timeStamp;
    const next = h.at > h.travel / 2;
    if (next !== on) set(next);
  };
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (dropped.current >= 0 && e.timeStamp - dropped.current < 500) e.preventDefault(); // Radix skips its toggle
    dropped.current = -1;
  };

  const dragging = dragX !== null;
  const shown = dragging ? dragX > (hand.current?.travel ?? TRAVEL) / 2 : on;
  const x = dragging ? `${dragX}px` : on ? "var(--sw-travel)" : "0px";

  /* Fun mode: the crossing (the first transitioned property) takes the glide spring; the rest keep the instant tier. */
  const fun = useFun();
  const motion: CSSProperties = dragging
    ? following
    : fun
      ? {
          ...crossing,
          transitionDuration: `${fun.glideCss.duration}ms, var(--dur-instant), var(--dur-instant), var(--dur-instant)`,
          transitionTimingFunction: `${fun.glideCss.easing}, var(--ease-out), var(--ease-out), var(--ease-out)`,
        }
      : crossing;

  return (
    <div
      className={
        "group/switch relative grid select-none py-1.5 " +
        (end ? "w-full grid-cols-[1fr_auto] gap-x-4 " : "w-fit grid-cols-[auto_1fr] gap-x-3 ") +
        className
      }
    >
      <Body
        shown={shown}
        disabled={!!disabled}
        dragging={dragging}
        x={x}
        tone={tone}
        words={words}
        motion={motion}
        className={end ? " col-start-2 row-start-1" : " col-start-1 row-start-1"}
        root={{
          ref,
          id,
          checked: on,
          onCheckedChange: set,
          disabled,
          required,
          name,
          value,
          "aria-describedby": descriptionId,
          onPointerDown,
          onPointerMove,
          onPointerUp: onPointerEnd,
          onPointerCancel: onPointerEnd,
          onClick,
          "data-no-drag": "",
        }}
      />
      {/* The label is stretched over the whole row, so a click anywhere in it toggles the switch. */}
      <label
        htmlFor={id}
        className={
          "row-start-1 flex min-h-8 cursor-pointer items-center text-small font-title text-fg after:absolute after:inset-0 peer-disabled:cursor-not-allowed peer-disabled:text-fg-disabled " +
          (end ? "col-start-1" : "col-start-2")
        }
      >
        {label}
      </label>
      {description && (
        <p
          id={descriptionId}
          /* A disabled switch keeps its description at --fg-subtle: it is often what says why the switch is off-limits. */
          className={"row-start-2 text-small text-fg-subtle " + (end ? "col-start-1" : "col-start-2")}
        >
          {description}
        </p>
      )}
    </div>
  );
}
