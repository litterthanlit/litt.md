/**
 * Experiments for the language canvas: the press material (material.md, 6) carried past the switch and the slider,
 * to see what litt looks like when everything a hand moves is a block in a tray. They are local to the canvas and
 * use only tokens; nothing here is a registry component, and nothing in src/components changed for them.
 *
 * The idea in one line: a sunken tray holds what you can move, the raised block is what your hand takes, and a block
 * says its state (On, 1.0x, a check) instead of a color saying it.
 */
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { CheckIcon, ChevronRightIcon, MinusIcon, PlusIcon } from "@/components/icons";

/* The pieces every experiment shares. */
const tray = "bg-tray shadow-(--tray-shade)";
const blockRadius = "rounded-[calc(var(--radius-control)-2px)]";
const lift = "bg-block shadow-(--block-lift)";
const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* ---------------------------------------------------------------- material */

/** The three depths side by side: a card in the flow (P4), a block a hand takes, and the tray it sits in. */
export function MaterialDepths() {
  const swatch = "grid h-28 place-items-center text-small font-title text-fg";
  return (
    <div className="grid grid-cols-3 gap-6">
      <figure className="grid gap-2">
        <div className={swatch + " rounded-surface bg-surface-1 shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]"}>Flat</div>
        <figcaption className="text-small text-fg-subtle">A card in the flow. A hairline and the top highlight, no shadow (P4).</figcaption>
      </figure>
      <figure className="grid gap-2">
        <div className={"grid h-28 place-items-center rounded-control p-0.5 " + tray}>
          <div className={"grid size-full place-items-center text-small font-title text-fg " + blockRadius + " " + lift}>Raised</div>
        </div>
        <figcaption className="text-small text-fg-subtle">A block a hand takes: a contact line and a soft cast, lit from the top.</figcaption>
      </figure>
      <figure className="grid gap-2">
        <div className={swatch + " rounded-control " + tray}>Sunken</div>
        <figcaption className="text-small text-fg-subtle">The tray it moves in: a hairline and the top wall's shade.</figcaption>
      </figure>
    </div>
  );
}

/* ---------------------------------------------------------------- button */

const blockButton =
  "inline-flex h-control-md items-center justify-center gap-control px-control-pad-md text-body font-title select-none cursor-pointer " +
  "rounded-control transition-[background-color,box-shadow,translate] duration-(--dur-instant) ease-litt active:translate-y-px " +
  ring;
const blockButtons = {
  primary: "bg-accent text-accent-fg shadow-(--block-lift) hover:bg-accent-hover active:shadow-(--block-press)",
  secondary: "bg-block text-fg shadow-(--block-lift) hover:bg-[color-mix(in_oklab,var(--block),var(--fg)_4%)] active:shadow-(--block-press)",
  ghost: "text-fg-muted hover:text-fg hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]",
};

export function BlockButton({ variant = "secondary", children, ...rest }: { variant?: keyof typeof blockButtons; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={blockButton + " " + blockButtons[variant]}>
      {children}
    </button>
  );
}

/** Toggles in a tray: one pressed in (flat, its word in --fg), the others raised. A toolbar is a tray of blocks. */
function ToggleTray() {
  const [on, setOn] = useState<Record<string, boolean>>({ Wrap: true, Minimap: false, Blame: false });
  return (
    <div role="toolbar" aria-label="Editor view" className={"inline-flex gap-0.5 rounded-control p-0.5 " + tray}>
      {Object.keys(on).map((k) => (
        <button
          key={k}
          type="button"
          aria-pressed={on[k]}
          onClick={() => setOn((s) => ({ ...s, [k]: !s[k] }))}
          className={
            "h-7 px-3 text-small font-title cursor-pointer transition-[background-color,box-shadow,color] duration-(--dur-instant) ease-litt " +
            blockRadius +
            " " +
            ring +
            " " +
            (on[k] ? "bg-transparent text-fg shadow-none" : "bg-block text-fg-muted shadow-(--block-lift) hover:text-fg active:shadow-(--block-press)")
          }
        >
          {k}
        </button>
      ))}
    </div>
  );
}

export function ButtonBlocks() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <BlockButton variant="primary">Publish</BlockButton>
        <BlockButton>Preview</BlockButton>
        <BlockButton variant="ghost">Cancel</BlockButton>
      </div>
      <div className="grid gap-2">
        <span className="text-small text-fg-subtle">A toggle pressed in stays in: Wrap is on.</span>
        <ToggleTray />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- segmented */

/** The switch, with more than two places: one block that slides along a tray to the choice, which it says. */
export function SegmentedTray<T extends string>({
  legend,
  options,
  value,
  onValueChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onValueChange: (v: T) => void;
}) {
  const name = useId();
  const at = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className={"relative inline-grid h-8 auto-cols-fr grid-flow-col rounded-control p-0.5 " + tray}>
        <span
          aria-hidden="true"
          className={"absolute inset-y-0.5 left-0.5 " + blockRadius + " " + lift + " transition-[translate] duration-(--dur-responsive) ease-responsive"}
          style={{ width: `calc((100% - 4px) / ${options.length})`, translate: `${at * 100}% 0` }}
        />
        {options.map((o) => (
          <label
            key={o.value}
            className={
              "relative flex cursor-pointer items-center justify-center px-3 text-caption font-title transition-[color] duration-(--dur-instant) ease-litt has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-focus " +
              blockRadius +
              " " +
              (o.value === value ? "text-fg" : "text-fg-muted hover:text-fg")
            }
          >
            <input type="radio" name={name} value={o.value} checked={o.value === value} onChange={() => onValueChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SegmentedTrayDemo() {
  const [view, setView] = useState<"list" | "board" | "calendar">("board");
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  return (
    <div className="grid gap-4">
      <SegmentedTray legend="View" value={view} onValueChange={setView} options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }, { value: "calendar", label: "Calendar" }]} />
      <SegmentedTray legend="Range" value={range} onValueChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }]} />
    </div>
  );
}

/* ---------------------------------------------------------------- checkbox */

/** A checkbox is an empty tray; checked, a block rises into it and says so with a check. */
export function CheckBlock({ label, description, defaultChecked }: { label: string; description?: string; defaultChecked?: boolean }) {
  const id = useId();
  return (
    <label htmlFor={id} className="grid cursor-pointer grid-cols-[auto_1fr] gap-x-3 py-1.5">
      <span className={"relative grid size-6 place-items-center rounded-control has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus " + tray}>
        <input id={id} type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
        <span
          aria-hidden="true"
          className={
            "absolute inset-0.5 grid place-items-center text-fg opacity-0 scale-75 transition-[opacity,scale] duration-(--dur-instant) ease-litt peer-checked:opacity-100 peer-checked:scale-100 [&>svg]:size-3.5 " +
            blockRadius +
            " " +
            lift
          }
        >
          <CheckIcon />
        </span>
      </span>
      <span className="flex min-h-6 items-center text-small font-title text-fg">{label}</span>
      {description && <span className="col-start-2 text-small text-fg-subtle">{description}</span>}
    </label>
  );
}

export function CheckBlocks() {
  return (
    <fieldset className="grid gap-1">
      <legend className="mb-2 text-small font-title text-fg">Include in the export</legend>
      <CheckBlock label="Source files" defaultChecked />
      <CheckBlock label="Fonts" description="Only the ones the site uses." defaultChecked />
      <CheckBlock label="Analytics history" />
    </fieldset>
  );
}

/* ---------------------------------------------------------------- input */

/** A field is a well: you type into the tray. Focused, its floor comes up to the block's light. */
export function InputWell({ label, placeholder, defaultValue }: { label: string; placeholder?: string; defaultValue?: string }) {
  const id = useId();
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-small font-title text-fg">
        {label}
      </label>
      <input
        id={id}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={
          "h-control-md w-full rounded-control px-control-pad-md text-body text-fg placeholder:text-fg-muted transition-[background-color] duration-(--dur-instant) ease-litt focus:bg-block " +
          tray +
          " " +
          ring
        }
      />
    </div>
  );
}

export function InputWells() {
  return (
    <div className="grid gap-4">
      <InputWell label="Project name" defaultValue="Atelier Nord" />
      <InputWell label="Domain" placeholder="atelier.studio" />
    </div>
  );
}

/* ---------------------------------------------------------------- number field */

/** A number in a tray, with a block at each end to press. The number is a real field, so it can be typed too. */
export function NumberTray({ label, defaultValue = 3, min = 1, max = 12, unit }: { label: string; defaultValue?: number; min?: number; max?: number; unit?: string }) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const set = (n: number) => setValue(Math.min(max, Math.max(min, n)));
  const end = "grid size-9 place-items-center text-fg cursor-pointer transition-[box-shadow,translate] duration-(--dur-instant) ease-litt active:translate-y-px active:shadow-(--block-press) disabled:cursor-not-allowed disabled:bg-transparent disabled:shadow-none disabled:text-fg-disabled " + blockRadius + " " + lift + " " + ring;
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-small font-title text-fg">
        {label}
      </label>
      <div className={"inline-flex h-control-md w-48 items-center justify-between rounded-control p-0.5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus " + tray}>
        <button type="button" aria-label={`Fewer ${unit ?? ""}`.trim()} disabled={value <= min} onClick={() => set(value - 1)} className={end}>
          <MinusIcon />
        </button>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10);
            if (!Number.isNaN(n)) set(n);
          }}
          className="w-16 bg-transparent text-center text-body tabular-nums text-fg focus-visible:outline-none"
        />
        <button type="button" aria-label={`More ${unit ?? ""}`.trim()} disabled={value >= max} onClick={() => set(value + 1)} className={end}>
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- progress */

/** Progress is the slider's slab with no hand on it: it grows to how far along it is and says so. */
export function ProgressSlab({ label, value }: { label: string; value: number }) {
  const p = Math.min(1, Math.max(0, value / 100));
  return (
    <div className="grid gap-2">
      <span className="text-small font-title text-fg">{label}</span>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className={"relative h-8 rounded-control " + tray}>
        <span
          className={"absolute inset-y-0.5 left-0.5 flex items-center justify-end pr-2.5 text-caption font-normal tabular-nums text-fg " + blockRadius + " " + lift}
          style={{ width: `calc(3.5rem + (100% - 4px - 3.5rem) * ${p})` } as CSSProperties}
        >
          <span aria-hidden="true">{value}%</span>
        </span>
      </div>
    </div>
  );
}

export function ProgressSlabs() {
  return (
    <div className="grid gap-4">
      <ProgressSlab label="Uploading 12 images" value={32} />
      <ProgressSlab label="Building atelier.studio" value={64} />
      <ProgressSlab label="Exported" value={100} />
    </div>
  );
}

/* ---------------------------------------------------------------- slide to confirm */

/**
 * Slide to confirm as a slab: push it to the far wall to say yes. Let go short and it slides home on the responsive
 * tier. It moves by transform only: the slab is the tray's full width, slid out of sight to the left. Enter or Space
 * on it confirms, as today's does, because a key press is already deliberate.
 */
export function SlideSlab({ label = "Slide to delete Atelier Nord", done = "Deleting Atelier Nord" }: { label?: string; done?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const hand = useRef<{ id: number; x0: number; from: number } | null>(null);
  const [x, setX] = useState(0); // px the slab has been pushed
  const [held, setHeld] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const GRIP = 48;
  const room = () => (trackRef.current?.offsetWidth ?? 0) - 4 - GRIP;
  const confirm = () => {
    setConfirmed(true);
    setX(room());
  };
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (confirmed || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    hand.current = { id: e.pointerId, x0: e.clientX, from: x };
    setHeld(true);
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    const scale = (trackRef.current?.getBoundingClientRect().width ?? 1) / (trackRef.current?.offsetWidth || 1) || 1;
    setX(Math.min(room(), Math.max(0, h.from + (e.clientX - h.x0) / scale)));
  };
  const up = (e: PointerEvent<HTMLButtonElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    hand.current = null;
    setHeld(false);
    if (x >= room() - 4) confirm();
    else setX(0);
  };
  const keys = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (confirmed) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      confirm();
    }
  };
  return (
    <div className="grid gap-3">
      <div ref={trackRef} className={"relative h-control-md overflow-hidden rounded-control select-none " + tray} data-no-drag="">
        <span className="pointer-events-none absolute inset-0 grid place-items-center text-small text-fg-muted">{label}</span>
        <button
          type="button"
          aria-label={label}
          aria-disabled={confirmed || undefined}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onKeyDown={keys}
          className={
            "absolute inset-y-0.5 left-0.5 flex w-[calc(100%-4px)] touch-pan-y items-center justify-end gap-2 pr-3 text-small font-title text-fg cursor-pointer " +
            blockRadius +
            " bg-block " +
            (held ? "shadow-(--block-press) " : "shadow-(--block-lift) ") +
            (held ? "" : "transition-[translate] duration-(--dur-responsive) ease-responsive ") +
            ring
          }
          style={{ translate: `calc(-100% + ${GRIP}px + ${x}px) 0` }}
        >
          {confirmed ? <span>{done}</span> : <ChevronRightIcon />}
        </button>
      </div>
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {confirmed ? `${done}.` : ""}
      </p>
      {confirmed && (
        <div>
          <BlockButton
            onClick={() => {
              setConfirmed(false);
              setX(0);
            }}
          >
            Ask again
          </BlockButton>
        </div>
      )}
    </div>
  );
}
