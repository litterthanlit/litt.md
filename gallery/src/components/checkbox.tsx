/**
 * Checkbox and radio (components.md, "Checkbox and radio"), plus a fieldset group for each.
 *
 * - Both are real <input> elements, so the role, Space, the arrow keys, form values and
 *   the indeterminate state come from the browser. Nothing is faked with ARIA.
 * - Two looks, one structure. "drawn" (the default) restyles the input into the spec's 20px
 *   chip at the control radius, with the --line-control edge and an --fg fill when on (not
 *   the accent: P1 keeps the one accent fill for the primary action, and a form can hold many
 *   checked boxes). A radio is a circle, because a rounded square would read as a checkbox.
 *   "native" is the spec's other option: the browser's own 16px box, with accent-color set
 *   to --fg. Drawn is the default because only a drawn box can take the --line-control edge
 *   and the control radius, and it looks the same in every browser. See the Checkbox page.
 * - The label sits on the right, --space-2 away, at the small size, and the whole row is
 *   clickable. The label is a real <label for>, stretched over the row, so its accessible
 *   name is only its text and the description is linked with aria-describedby.
 * - Motion: the instant tier. Fill, edge and the mark fade with color. The box never moves.
 * - Touch: rows grow from 36 to 44px tall on coarse pointers.
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
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { CheckIcon } from "@/components/icons";

export type ChoiceAppearance = "drawn" | "native";

/* What a group tells its items. Outside a group the defaults apply. */
type GroupState = { appearance: ChoiceAppearance; invalid: boolean };
const GroupContext = createContext<GroupState>({ appearance: "drawn", invalid: false });

type RadioState = { name: string; value: string | undefined; select: (value: string) => void };
const RadioContext = createContext<RadioState | null>(null);

/* ------------------------------------------------------------------ the row */

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The input is the chip. The wash, the mark and the label sit in the same grid cell or beside it. The input sits above
   the label's stretched click area (z-1), so a click on the chip itself still lands on the input, as test tools expect. */
const drawnInput =
  "peer relative z-1 col-start-1 row-start-1 m-0 size-5 shrink-0 cursor-pointer appearance-none self-start " +
  "bg-surface-1 shadow-[inset_0_0_0_1px_var(--line-control)] " +
  "transition-[background-color,box-shadow] duration-(--dur-instant) ease-litt " +
  "checked:bg-fg checked:shadow-none " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "disabled:checked:bg-surface-3 " +
  "forced-colors:border " + // forced colors drops box-shadow, so the edge becomes a real border
  focusRing;

/* Only a checkbox has a mixed state. A radio matches :indeterminate whenever nothing in its group is picked, so it must not use it. */
const mixed = " indeterminate:bg-fg indeterminate:shadow-none disabled:indeterminate:bg-surface-3";

const nativeInput =
  "peer relative z-1 col-start-1 row-start-1 m-0 mt-0.5 size-4 shrink-0 cursor-pointer self-start justify-self-center accent-fg " +
  "disabled:cursor-not-allowed " +
  focusRing;

/* Hover and press, as a wash over the chip. It is not tied to the input's own :hover, because the row is the target. */
const wash =
  "pointer-events-none relative z-1 col-start-1 row-start-1 size-5 self-start bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] opacity-0 " +
  "transition-[opacity,background-color] duration-(--dur-instant) ease-litt " +
  "group-hover/choice:opacity-100 group-active/choice:bg-[color-mix(in_oklab,var(--fg)_10%,transparent)] group-active/choice:opacity-100 " +
  "peer-disabled:hidden";

/* A mark is centered in the chip, and fades with the fill. */
const mark =
  "pointer-events-none relative z-1 col-start-1 row-start-1 grid size-5 place-items-center self-start text-canvas opacity-0 " +
  "transition-opacity duration-(--dur-instant) ease-litt peer-disabled:text-fg-disabled";

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

  const radio = kind === "radio";
  return (
    <div className={"group/choice relative grid w-fit select-none grid-cols-[auto_1fr] gap-x-2 py-2 pointer-coarse:py-3 " + className}>
      <input
        ref={setRef}
        id={id}
        type={kind}
        aria-invalid={invalid || undefined}
        aria-describedby={[describedByProp, descriptionId].filter(Boolean).join(" ") || undefined}
        className={appearance === "native" ? nativeInput : drawnInput + (radio ? " rounded-pill" : " rounded-control" + mixed)}
        {...rest}
      />
      {appearance === "drawn" && (
        <>
          <span aria-hidden="true" className={wash + (radio ? " rounded-pill" : " rounded-control")} />
          {radio ? (
            <span aria-hidden="true" className={mark + " peer-checked:opacity-100"}>
              <svg width={8} height={8} viewBox="0 0 8 8" fill="currentColor" aria-hidden="true" focusable="false">
                <circle cx={4} cy={4} r={4} />
              </svg>
            </span>
          ) : (
            <>
              <span aria-hidden="true" className={mark + " peer-checked:opacity-100 peer-indeterminate:opacity-0"}>
                <CheckIcon />
              </span>
              <span aria-hidden="true" className={mark + " peer-indeterminate:opacity-100"}>
                <DashGlyph />
              </span>
            </>
          )}
        </>
      )}
      {/* The label is stretched over the whole row, so a click anywhere in it toggles the input. */}
      <label
        htmlFor={id}
        className="col-start-2 row-start-1 min-h-5 cursor-pointer text-small text-fg after:absolute after:inset-0 peer-disabled:cursor-not-allowed peer-disabled:text-fg-disabled"
      >
        {label}
      </label>
      {description && (
        <p
          id={descriptionId}
          className={"col-start-2 row-start-2 mt-1 text-small peer-disabled:text-fg-disabled " + (invalidProp ? "text-danger" : "text-fg-subtle")}
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
}) {
  const noteId = useId();
  const note = error ?? help;
  return (
    <fieldset disabled={disabled} aria-describedby={note ? noteId : undefined} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={"p-0 text-small " + (disabled ? "text-fg-disabled" : "text-fg")}>{legend}</legend>
      <div className="grid justify-items-start">{children}</div>
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
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const select = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };
  return (
    <RadioContext.Provider value={{ name: nameProp ?? auto, value, select }}>
      <GroupContext.Provider value={{ appearance, invalid: !!error }}>
        <GroupShell legend={legend} help={help} error={error} disabled={disabled} className={className}>
          {children}
        </GroupShell>
      </GroupContext.Provider>
    </RadioContext.Provider>
  );
}
