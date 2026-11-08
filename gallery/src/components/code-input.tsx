/**
 * Code input: a short one-time code, such as the six digits from a sign-in email or an authenticator app
 * (components.md, "Code input"). It looks like one box per character and behaves like one text field.
 *
 * - One real <input> lies over the cells, invisible, so everything a text field does still works: paste, the
 *   browser's one-time-code autofill from a text message, the password manager, undo, and a screen reader that hears
 *   one field with its label. The cells are drawn from its value and hidden from assistive tech.
 * - Anatomy: the Input's cut per cell (R3: the --cut floor, the --line-control line and the top wall's shade, at the
 *   control radius), square on
 *   the control scale (md 44, lg 56), narrowing to no less than 32px in a box too small for them, each character in the
 *   sans at the body size, in tabular figures. Six cells split three and three
 *   with a wider gap, so the code reads in halves. The label sits above at the title weight and a hint or an error
 *   below, as on a TextField.
 * - Press, the instrument: one raised plate (--block, --plate-lift) holds the cells, each a cut into it (--cut,
 *   --cut-shade); a typed character's cut catches the light on its lower wall (--highlight turned over).
 * - Flat, the page (proposals/flat-pill.md): one grey pill per character parted by space, the empty ones the lighter
 *   grey (--surface-2), a typed one --block with its character in ink at the title weight, the ink ring on the current
 *   one and the danger ring on every cell with an error.
 * - Focus: the cell the next character goes into takes the focus line and ring, and an empty one shows a still 1px
 *   caret. Nothing blinks.
 * - Typing: only what the code can hold gets in (digits, or letters and digits in capitals); the rest is dropped, so a
 *   pasted "123 456" or "123-456" lands as 123456. When the last cell fills, onComplete runs once with the code.
 *   Backspace clears from the end.
 * - Error: every cell takes the --danger line, and the message under them says what to do. Disabled lies flat:
 *   --surface-2, the plain --line hairline, no shade and --fg-disabled, as the Input.
 * - Motion: the lines fade on the instant tier, and the box never moves.
 * - One contract, three bodies (proposals/worlds.md, Bodies). This file is the contract: the props, the one real input
 *   over the cells, the label and the note, the typing and the completion. It resolves the code into CodeInputBodyProps
 *   and renders the body the material picks (byWorld). PressBody, above, is the default; bodies/code-input.flat.tsx and
 *   bodies/code-input.device.tsx draw the cells for the other two.
 * - Device, bodies/code-input.device.tsx: one pane of LCD glass per character, showing the dim ghost of an eight on a
 *   seven-segment display until its character is typed, then the character lit in segments (digits; a letter of an
 *   alphanumeric code is set in the mono). A character only lights when typed (R4), and a change switches in place in
 *   steps on the instant tier.
 */
import { useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { byWorld, useMaterial } from "@/motion";
import { CodeInputDeviceBody } from "./bodies/code-input.device";
import { CodeInputFlatBody } from "./bodies/code-input.flat";

export type CodeInputSize = "md" | "lg";

export type CodeInputProps = {
  /** The label above the cells. Required, because the cells say nothing about what the code is for. */
  label: ReactNode;
  /** How many characters the code has. */
  length?: number;
  /** "numeric" takes digits and brings up the number pad; "alphanumeric" also takes letters, in capitals. */
  type?: "numeric" | "alphanumeric";
  /** The code so far, for a controlled field. */
  value?: string;
  /** The starting code, for an uncontrolled field. */
  defaultValue?: string;
  /** Runs on every change with the cleaned code so far. */
  onValueChange?: (value: string) => void;
  /** Runs once when the last cell fills, with the whole code. Check it here. */
  onComplete?: (code: string) => void;
  /** A hint under the cells: where the code was sent, how long it lasts. An error replaces it. */
  help?: ReactNode;
  /** Draws the danger edge on every cell and shows this under them. Say what to do, such as "Check the code, or send a new one." */
  error?: ReactNode;
  /** Height on the control scale: md is 44, lg is 56. */
  size?: CodeInputSize;
  disabled?: boolean;
  /** The form field name, so a form submits the code. */
  name?: string;
  /** Focus the field when it mounts, as on a page whose only job is this code. */
  autoFocus?: boolean;
  className?: string;
};

const cellHeights: Record<CodeInputSize, string> = {
  md: "h-control-md",
  lg: "h-control-lg",
};
/** What a body draws: the cells, from the code so far. The input, the label and the note are the contract's, above. */
export type CodeInputBodyProps = {
  length: number;
  /** The cell's height class on the control scale. */
  cellHeight: string;
  /** The cleaned code so far. */
  code: string;
  /** The cell the next character goes into. */
  at: number;
  focused: boolean;
  disabled: boolean;
  error: boolean;
  type: "numeric" | "alphanumeric";
};

const cellWidths: Record<CodeInputSize, string> = {
  md: "var(--control-md)",
  lg: "var(--control-lg)",
};

/** Press, the instrument: one raised plate (--block, --plate-lift) holds the cells, each a cut into it (--cut,
 *  --cut-shade). A typed character's cut catches the light on its lower wall: a lit top edge (--highlight) turned over. */
function PressBody({ length, cellHeight, code, at, focused, disabled, error }: CodeInputBodyProps) {
  return (
    <div
      aria-hidden="true"
      data-body="press"
      className={
        "flex w-full gap-2 rounded-surface p-2 forced-colors:border " +
        (disabled ? "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]" : "bg-block shadow-(--plate-lift)")
      }
    >
      {Array.from({ length }, (_, i) => {
        const char = code[i] ?? "";
        const current = focused && !disabled && i === at;
        return (
          <span
            key={i}
            className={
              "relative grid min-w-7 flex-1 basis-0 place-items-center rounded-[calc(var(--radius-surface)-8px)] text-body tabular-nums font-normal " +
              "transition-[box-shadow] duration-(--dur-instant) ease-litt forced-colors:border " +
              cellHeight +
              /* six cells read as two halves of three */
              (length === 6 && i === 3 ? " ml-2" : "") +
              /* Forced colors drop the ring (a box-shadow), so the current cell takes an outline there. */
              (current ? " forced-colors:outline-2 forced-colors:outline-offset-2 forced-colors:outline-[Highlight]" : "") +
              (disabled
                ? " bg-surface-3 text-fg-disabled"
                : " bg-cut font-field text-field-ink " +
                  (current
                    ? error
                      ? "shadow-[inset_0_0_0_1px_var(--danger),var(--cut-shade),var(--focus-ring)]"
                      : "shadow-[inset_0_0_0_1px_var(--focus),var(--cut-shade),var(--focus-ring)]"
                    : error
                      ? "shadow-[inset_0_0_0_1px_var(--danger),var(--cut-shade)]"
                      : "shadow-(--cut-shade)"))
            }
          >
            {char ||
              (current ? <span className="h-5 w-px bg-field-ink forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]" /> : null)}
            {char && !disabled && (
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rotate-180 rounded-[calc(var(--radius-surface)-8px)] shadow-(--highlight)" />
            )}
          </span>
        );
      })}
    </div>
  );
}

/** One field for a short code, drawn as one cell per character. Paste and one-time-code autofill work as in any field. */
export function CodeInput({
  label,
  length = 6,
  type = "numeric",
  value,
  defaultValue = "",
  onValueChange,
  onComplete,
  help,
  error,
  size = "md",
  disabled = false,
  name,
  autoFocus,
  className = "",
}: CodeInputProps) {
  const Body = byWorld(useMaterial(), { press: PressBody, flat: CodeInputFlatBody, device: CodeInputDeviceBody });
  const id = useId();
  const noteId = useId();
  const input = useRef<HTMLInputElement>(null);
  const clean = (s: string) => (type === "numeric" ? s.replace(/\D/g, "") : s.replace(/[^a-z0-9]/gi, "").toUpperCase()).slice(0, length);
  const [own, setOwn] = useState(() => clean(defaultValue));
  const [focused, setFocused] = useState(false);
  const code = value !== undefined ? clean(value) : own;
  const note = error || help;
  const at = Math.min(code.length, length - 1); // the cell the next character goes into
  /* The row is as wide as the box allows, up to square cells; a box too narrow shares its width between them (never
     below 32px each). A max-width, not a width, so the page never counts the full size as its minimum. */
  const gaps = length - 1 + (length === 6 ? 1 : 0);
  const full = `calc(${length} * ${cellWidths[size]} + ${gaps} * var(--space-2))`;

  const change = (e: ChangeEvent<HTMLInputElement>) => {
    const next = clean(e.target.value);
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
    if (next.length === length && code.length < length) onComplete?.(next);
  };
  /* The caret always sits at the end, so a click on any cell carries on from the last character. */
  const toEnd = () => {
    const el = input.current;
    if (el) el.setSelectionRange(el.value.length, el.value.length);
  };

  return (
    <div className={"grid justify-items-start gap-2 " + className}>
      <label htmlFor={id} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </label>
      <div className="relative w-full" style={{ maxWidth: full }}>
        <Body length={length} cellHeight={cellHeights[size]} code={code} at={at} focused={focused} disabled={disabled} error={!!error} type={type} />
        <input
          ref={input}
          id={id}
          name={name}
          value={code}
          onChange={change}
          onFocus={() => {
            setFocused(true);
            toEnd();
          }}
          onBlur={() => setFocused(false)}
          onClick={toEnd}
          onKeyUp={toEnd}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="one-time-code"
          inputMode={type === "numeric" ? "numeric" : "text"}
          pattern={type === "numeric" ? "[0-9]*" : undefined}
          autoCapitalize={type === "numeric" ? undefined : "characters"}
          spellCheck={false}
          /* No maxLength: a pasted "246 810" is seven characters until the space is dropped. clean() keeps the length. */
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          /* Over the cells and invisible: it takes the clicks, the typing and the autofill. 16px, so iOS never zooms. */
          className="absolute inset-0 size-full cursor-text appearance-none bg-transparent text-(length:--control-text-lg) caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
        />
      </div>
      {note && (
        <p id={noteId} className={"text-small " + (error ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </div>
  );
}
