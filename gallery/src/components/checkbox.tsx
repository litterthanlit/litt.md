/**
 * Checkbox and radio (components.md, "Checkbox and radio"), plus a fieldset group for each.
 *
 * - Both are real <input> elements, so the role, Space, the arrow keys, form values and
 *   the indeterminate state come from the browser. Nothing is faked with ARIA.
 * - Two looks, one structure. "drawn" (the default) restyles the input into the spec's 20px
 *   chip at the control radius. A radio is a circle, because a rounded square would read as a
 *   checkbox. "native" is the spec's other option: the browser's own 16px box, with accent-color
 *   set to --fg. Drawn is the default because only a drawn box can be a cut and take the control
 *   radius, and it looks the same in every browser. See the Checkbox page.
 * - Press (R3, material.md 6): the drawn box and cup are the cut, what you put a mark into: --cut inside the
 *   --line-control edge with the top wall's shade (--cut-shade) for a checkbox, and a deeper cup (--slot, --slot-shade)
 *   for a radio. The cut itself never fills. On, an ink block (--fg) is seated flush in it, 2px in so a rim of the cut shows,
 *   lit only on its top edge, with the tick or dash in --canvas; a chosen radio takes a bead, a round raised block
 *   (--fg, --block-lift). A press sinks the block --press-depth. Never the accent (R6): the one accent fill is the
 *   primary action's, and a form can hold many checked boxes. An error swaps the edge for --danger and keeps the shade.
 *   Disabled, it lies flat on --surface-2 with the hairline, and so does the block and the bead.
 * - Flat is bodies/checkbox.flat.tsx: ink on paper, an outline when off, the ink when on, the label's weight carrying
 *   the checked state. At the Pill shape the 20px box is a circle; at other shapes it follows --radius-control, and a
 *   radio is always round.
 * - The label sits on the right, --space-2 away, at the small size, and the whole row is
 *   clickable. The label is a real <label for>, stretched over the row, so its accessible
 *   name is only its text and the description is linked with aria-describedby.
 * - Motion: the instant tier. Fill, edge and the mark fade with color. The box never moves.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): checking a drawn box pops it on fun mode's pop
 *   spring and the tick draws itself in, as a pen would. Only on a person's change, and only while it moves: once
 *   still, the box and the tick are exactly the drawn ones above. Reduced motion turns it off.
 * - Touch: rows grow from 36 to 44px tall on coarse pointers.
 * - One contract, three bodies (proposals/worlds.md, Bodies). This file is the contract: the props, the real <input>
 *   with its role, checked and mixed state, the label and description, the groups and the keys. It resolves them once
 *   into ChoiceBodyProps and renders the body the material picks (byWorld) for the drawn look. PressBody, below, is the
 *   default (the cut above). bodies/checkbox.flat.tsx is Flat's recipe, an outline when off and the ink when on.
 *   bodies/checkbox.device.tsx is Device's: a square key in a well that latches down and lights its lamp when checked,
 *   and half lights it when mixed. A radio group there is a row of the same keys, interlocked, so pressing one lets the
 *   last one up. The "native" look is the browser's own box in every world. A frame that sets its own look draws its
 *   own body, not <html>'s.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { animate } from "motion/react";
import { byWorld, useFun, useMaterial } from "@/motion";
import { CheckIcon } from "@/components/icons";
import { ChoiceDeviceBody } from "./bodies/checkbox.device";
import { ChoiceFlatBody } from "./bodies/checkbox.flat";

export type ChoiceAppearance = "drawn" | "native";

/* What a group tells its items. Outside a group the defaults apply. */
type GroupState = { appearance: ChoiceAppearance; invalid: boolean };
const GroupContext = createContext<GroupState>({ appearance: "drawn", invalid: false });

type RadioState = { name: string; value: string | undefined; select: (value: string) => void };
const RadioContext = createContext<RadioState | null>(null);

/* ------------------------------------------------------------------ the row */

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* Press: the input is the cut, a place you put a mark into. It stays empty and sunk, checked or not. The ink is a separate
   block seated in it (below). The input sits above the label's stretched click area (z-1), so a click on the chip itself
   still lands on the input, as test tools expect. A checkbox's cut is a field's cut (--cut, --cut-shade); a radio's is a
   cup, deeper (--slot, --slot-shade). */
const cutBase =
  "peer relative z-1 col-start-1 row-start-1 m-0 size-5 shrink-0 cursor-pointer appearance-none self-start " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger),var(--cut-shade)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border " + // forced colors drops box-shadow, so the edge becomes a real border
  focusRing;
const squareCut = cutBase + " rounded-control bg-cut shadow-[inset_0_0_0_1px_var(--line-control),var(--cut-shade)]";
const cupCut = cutBase + " rounded-pill bg-slot shadow-[inset_0_0_0_1px_var(--line-control),var(--slot-shade)]";

/* Hover and press, as a wash over the cut. It is not tied to the input's own :hover, because the row is the target. */
const wash =
  "pointer-events-none relative z-1 col-start-1 row-start-1 size-5 self-start bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] opacity-0 " +
  "transition-[opacity,background-color] duration-(--dur-instant) ease-litt " +
  "group-hover/choice:opacity-100 group-active/choice:bg-[color-mix(in_oklab,var(--fg)_10%,transparent)] group-active/choice:opacity-100 " +
  "peer-disabled:hidden";

/* The ink block: 16px, seated 2px in the cut so a rim of the cut shows round it, its corners the cut's less those 2px.
   Lit only on its top edge and casting nothing, because it is flush; under the hand it sinks --press-depth. The mark in it
   is --canvas. The block is shown by opacity, so it fades on the instant tier and never moves on its own. */
const block =
  "pointer-events-none relative z-1 col-start-1 row-start-1 m-0.5 grid size-4 place-items-center self-start rounded-[calc(var(--radius-control)-2px)] " +
  "bg-fg text-canvas opacity-0 shadow-[inset_0_1px_0_color-mix(in_oklab,white_20%,transparent)] " +
  "transition-[opacity,transform] duration-(--dur-instant) ease-litt " +
  "group-active/choice:translate-y-(--press-depth) " +
  "peer-disabled:bg-surface-3 peer-disabled:text-fg-disabled peer-disabled:shadow-none forced-colors:border";

/* A chosen radio's bead: a round raised block in the cup, with the block's cast (--block-lift), 12px in a 20px cup. */
const bead =
  "pointer-events-none relative z-1 col-start-1 row-start-1 m-1 size-3 self-start rounded-pill bg-fg opacity-0 shadow-(--block-lift) " +
  "transition-[opacity,transform] duration-(--dur-instant) ease-litt peer-checked:opacity-100 " +
  "group-active/choice:translate-y-(--press-depth) group-active/choice:shadow-(--block-press) " +
  "peer-disabled:bg-fg-disabled peer-disabled:shadow-none forced-colors:bg-[CanvasText]";

const nativeInput =
  "peer relative z-1 col-start-1 row-start-1 m-0 mt-0.5 size-4 shrink-0 cursor-pointer self-start justify-self-center accent-fg " +
  "disabled:cursor-not-allowed " +
  focusRing;

/**
 * What the contract hands a body: the input resolved once. A body draws the control, the <input> (appearance: none)
 * and what sits beside it in the row's first cell; the row, the label and the description stay with the contract. A
 * body keeps the input's props whole (`input`: ref, id, type, checked, handlers, aria-*), says the state without color
 * alone, and carries data-body on the input.
 */
export type ChoiceBodyProps = {
  /** "checkbox" has a mixed state; a "radio" does not (it matches :indeterminate whenever its group is empty). */
  kind: "checkbox" | "radio";
  /** The input's props, without a className: the body draws it. */
  input: ComponentProps<"input">;
  /** The tick's ref, which fun mode draws in. A body that has no tick leaves it alone. */
  tick: Ref<HTMLSpanElement>;
};

/** Press, the default body: a cut in the plate. Checked, an ink block sits flush in it; a radio is a cup that takes a bead. */
function PressBody({ kind, input, tick }: ChoiceBodyProps) {
  const radio = kind === "radio";
  return (
    <>
      <input {...input} data-body="press" className={radio ? cupCut : squareCut} />
      <span aria-hidden="true" className={wash + (radio ? " rounded-pill" : " rounded-control")} />
      {radio ? (
        <span aria-hidden="true" className={bead} />
      ) : (
        <>
          <span ref={tick} aria-hidden="true" className={block + " peer-checked:opacity-100 peer-indeterminate:opacity-0"}>
            <CheckIcon />
          </span>
          <span aria-hidden="true" className={block + " peer-indeterminate:opacity-100"}>
            <DashGlyph />
          </span>
        </>
      )}
    </>
  );
}

/** The dash for the mixed state: 16px, 1.5px stroke, like the other icons. */
function DashGlyph() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M4.5 8h7" />
    </svg>
  );
}

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  kind: "checkbox" | "radio";
  label: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
  indeterminate?: boolean;
  appearance?: ChoiceAppearance;
  ref?: Ref<HTMLInputElement>;
};

function Choice({
  kind,
  label,
  description,
  invalid: invalidProp,
  indeterminate = false,
  appearance: appearanceProp,
  id: idProp,
  "aria-describedby": describedByProp,
  className = "",
  ref,
  ...rest
}: ChoiceProps) {
  const group = useContext(GroupContext);
  const appearance = appearanceProp ?? group.appearance;
  const invalid = invalidProp ?? group.invalid;
  const auto = useId();
  const id = idProp ?? auto;
  const descriptionId = description ? `${id}-description` : undefined;

  /* The mixed state is a DOM property, not an attribute. Set it after every render, because a click clears it. */
  const input = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (input.current && kind === "checkbox") input.current.indeterminate = indeterminate;
  });
  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      input.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  /* Fun mode: a box a person checks pops, and its tick draws in. Inline styles only while it moves, then cleared. */
  const material = useMaterial();
  const fun = useFun();
  const tick = useRef<HTMLSpanElement>(null);
  const onChange = rest.onChange;
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    const box = input.current;
    const path = tick.current?.querySelector("path");
    if (!fun || kind !== "checkbox" || appearance !== "drawn" || !e.target.checked || !box || !path || !tick.current) return;
    const mark = tick.current;
    path.setAttribute("pathLength", "1");
    path.style.strokeDasharray = "1";
    animate(path, { strokeDashoffset: [1, 0] }, fun.tick).then(() => {
      path.removeAttribute("pathLength");
      path.style.strokeDasharray = "";
      path.style.strokeDashoffset = "";
    });
    animate([box, mark], { scale: [0.8, 1] }, fun.pop).then(() => {
      box.style.transform = "";
      mark.style.transform = "";
    });
  };

  const Body = byWorld(material, { press: PressBody, flat: ChoiceFlatBody, device: ChoiceDeviceBody });
  const device = material === "device";
  const inputProps: ComponentProps<"input"> = {
    ref: setRef,
    id,
    type: kind,
    "aria-invalid": invalid || undefined,
    "aria-describedby": [describedByProp, descriptionId].filter(Boolean).join(" ") || undefined,
    ...rest,
    onChange: handleChange,
  };
  return (
    <div className={"group/choice relative grid w-fit select-none grid-cols-[auto_1fr] gap-x-2 py-2 pointer-coarse:py-3 " + className}>
      {appearance === "native" ? (
        <input {...inputProps} data-body={material} className={nativeInput} />
      ) : (
        <Body kind={kind} input={inputProps} tick={tick} />
      )}
      {/* The label is stretched over the whole row, so a click anywhere in it toggles the input. */}
      <label
        htmlFor={id}
        className={
          "col-start-2 row-start-1 min-h-5 cursor-pointer text-small font-title text-fg after:absolute after:inset-0 peer-disabled:cursor-not-allowed peer-disabled:text-fg-disabled" +
          (appearance === "drawn" ? " in-[[data-material=flat]]:font-normal in-[[data-material=flat]]:peer-checked:font-title" : "") + // Flat: the weight says on
          (device ? " pt-0.5" : "") // Device's key is 24px, so the first line sits 2px lower to meet its middle
        }
      >
        {label}
      </label>
      {description && (
        <p
          id={descriptionId}
          /* A disabled box keeps its description readable: it is often what says why the box is off-limits. */
          className={"col-start-2 row-start-2 mt-1 text-small " + (invalidProp ? "text-danger" : "text-fg-subtle")}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ checkbox */

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  /** The label, on the right of the box. Required, because a box alone has no name. The whole row is clickable. */
  label: ReactNode;
  /** A line of detail under the label. It is linked to the input with aria-describedby. When you pass invalid on this checkbox, it turns danger color, so it can carry the error message. */
  description?: ReactNode;
  /** Shows the mixed state, for a select-all box when only some of its items are on. Clicking it still sets checked. */
  indeterminate?: boolean;
  /** Draws the error edge and sets aria-invalid. In a CheckboxGroup this follows the group's error. */
  invalid?: boolean;
  /** "drawn" restyles the input into the 20px chip and is the default. "native" is the browser's own 16px box in the foreground color. */
  appearance?: ChoiceAppearance;
  /** The underlying <input>, for focus or a form library. */
  ref?: Ref<HTMLInputElement>;
};

/** One checkbox with its label. Use checked and onChange to control it, or defaultChecked to leave it alone. Every other input attribute goes through. */
export function Checkbox({ label, description, indeterminate = false, invalid, appearance, ...rest }: CheckboxProps) {
  return <Choice kind="checkbox" label={label} description={description} indeterminate={indeterminate} invalid={invalid} appearance={appearance} {...rest} />;
}

/* ---------------------------------------------------------------------- radio */

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "value"> & {
  /** The label, on the right of the circle. Required, because a circle alone has no name. The whole row is clickable. */
  label: ReactNode;
  /** What this radio stands for. In a RadioGroup it is what onValueChange gets, and it is the value a form sends. */
  value: string;
  /** A line of detail under the label. It is linked to the input with aria-describedby. */
  description?: ReactNode;
  /** Draws the error edge and sets aria-invalid. In a RadioGroup this follows the group's error. */
  invalid?: boolean;
  /** "drawn" restyles the input into the 20px circle and is the default. "native" is the browser's own 16px radio in the foreground color. */
  appearance?: ChoiceAppearance;
  /** The underlying <input>, for focus or a form library. */
  ref?: Ref<HTMLInputElement>;
};

/** One radio with its label. Put two or more in a RadioGroup, which gives them a shared name so the arrow keys move between them. */
export function Radio({ label, value, description, invalid, appearance, onChange, ...rest }: RadioProps) {
  const group = useContext(RadioContext);
  return (
    <Choice
      kind="radio"
      label={label}
      value={value}
      description={description}
      invalid={invalid}
      appearance={appearance}
      {...rest}
      {...(group
        ? {
            name: group.name,
            checked: group.value === value,
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
              onChange?.(e);
              group.select(value);
            },
          }
        : { onChange })}
    />
  );
}

/* --------------------------------------------------------------------- groups */

/* A fieldset with a legend, the options, and a hint or an error under them. */
function GroupShell({
  row = false,
  legend,
  help,
  error,
  disabled,
  className,
  children,
}: {
  legend: ReactNode;
  help: ReactNode;
  error: ReactNode;
  disabled: boolean | undefined;
  className: string;
  children: ReactNode;
  /** The options run in a row (Device's radio keys, side by side). */
  row?: boolean;
}) {
  const noteId = useId();
  const note = error ?? help;
  return (
    <fieldset disabled={disabled} aria-describedby={note ? noteId : undefined} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={"p-0 text-small " + (disabled ? "text-fg-disabled" : "text-fg")}>{legend}</legend>
      <div className={row ? "flex flex-wrap gap-x-5" : "grid justify-items-start"}>{children}</div>
      {note && (
        <p id={noteId} className={"text-small " + (error ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </fieldset>
  );
}

export type CheckboxGroupProps = {
  /** The group's name, shown above the boxes and read out with each one. Required. */
  legend: ReactNode;
  /** A hint under the group. An error replaces it. */
  help?: ReactNode;
  /** Shown in danger color under the group and linked to the fieldset. Also marks every box invalid. Say how to fix it. */
  error?: ReactNode;
  /** Disables every box in the group, through the fieldset. */
  disabled?: boolean;
  /** The look for every box in the group: "drawn" or "native". A box can still set its own. */
  appearance?: ChoiceAppearance;
  /** Extra classes for the fieldset, such as a width. */
  className?: string;
  /** The Checkbox elements. */
  children: ReactNode;
};

/** Boxes that belong together, in one fieldset with a legend. The group holds no value: each Checkbox keeps its own. */
export function CheckboxGroup({ legend, help, error, disabled, appearance = "drawn", className = "", children }: CheckboxGroupProps) {
  return (
    <GroupContext.Provider value={{ appearance, invalid: !!error }}>
      <GroupShell legend={legend} help={help} error={error} disabled={disabled} className={className}>
        {children}
      </GroupShell>
    </GroupContext.Provider>
  );
}

export type RadioGroupProps = {
  /** The group's name, shown above the options and read out with each one. Required. */
  legend: ReactNode;
  /** The radios' shared name, which is what makes the arrow keys move between them and what a form sends. Made up for you when left out. */
  name?: string;
  /** The value of the selected radio, when you control it. Pair it with onValueChange. */
  value?: string;
  /** The value that starts selected when you do not control it. */
  defaultValue?: string;
  /** Called with the picked radio's value each time the selection changes, by click, tap or arrow key. */
  onValueChange?: (value: string) => void;
  /** A hint under the group. An error replaces it. */
  help?: ReactNode;
  /** Shown in danger color under the group and linked to the fieldset. Also marks every radio invalid. Say how to fix it. */
  error?: ReactNode;
  /** Disables every radio in the group, through the fieldset. */
  disabled?: boolean;
  /** The look for every radio in the group: "drawn" or "native". A radio can still set its own. */
  appearance?: ChoiceAppearance;
  /** Extra classes for the fieldset, such as a width. */
  className?: string;
  /** The Radio elements. */
  children: ReactNode;
};

/** Radios that share one choice, in one fieldset with a legend. Native radios already group by name, so the arrow keys and Tab work without code. */
export function RadioGroup({
  legend,
  name: nameProp,
  value: valueProp,
  defaultValue,
  onValueChange,
  help,
  error,
  disabled,
  appearance = "drawn",
  className = "",
  children,
}: RadioGroupProps) {
  const auto = useId();
  const row = useMaterial() === "device";
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const select = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };
  return (
    <RadioContext.Provider value={{ name: nameProp ?? auto, value, select }}>
      <GroupContext.Provider value={{ appearance, invalid: !!error }}>
        <GroupShell row={row} legend={legend} help={help} error={error} disabled={disabled} className={className}>
          {children}
        </GroupShell>
      </GroupContext.Provider>
    </RadioContext.Provider>
  );
}
