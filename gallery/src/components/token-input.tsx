/**
 * TokenInput: a field that collects short values as removable tokens, such as the sender
 * domains of a mail rule, the recipients of an invoice or the tags of a project. It is the
 * Input's sibling (components.md, "Token input"): same field, same label and hint.
 *
 * - Bodies (proposals/worlds.md): the contract below is one, and the material picks the look.
 *   Press is the Input's cut (--slot-shade with --field-shade: the top wall shaded, the lower wall lit) with each
 *   token a block standing out of it (--block with --highlight and --key-lift) and a small block on it (--block with
 *   --block-lift) that removes it. Flat is a grey pill field, the tokens darker grey pills with a cross, and the "+N"
 *   bare words. Device is the Input's glass (bodies/token-input.device.tsx), each token an inverted cell of lit mono
 *   words with a small key. The body decides the field, the chip, the remove button and the "+N", through TokenSkin.
 * - Field: heights are minimums on the shared scale (sm 32, md 44, lg 56), and the 2px focus ring wraps the whole
 *   field while its text input is focus-visible. An invalid field draws a --danger line. Like the Input it has no
 *   hover. Padding sits on the 4px grid, so the field grows by whole token rows (24px tokens, 4px apart) as they wrap.
 * - Token: 24px, the sans at the caption size, corners the control radius less 4px, with a remove button that grows to
 *   a 44px hit area on coarse pointers through an invisible ::before. The "+N" stands for tokens, it is not one: no
 *   button. The placeholder shows only while there are no tokens.
 * - Adding: Enter, a comma and blur commit the typed text, and a paste is split on commas,
 *   semicolons and line breaks. Values are trimmed, and empty ones and case-insensitive
 *   duplicates are ignored. A value that `validate` rejects stays in the input with its message
 *   until the text changes. Blur is the field losing focus, so moving to a remove button
 *   inside it does not commit.
 * - Removing: the x, Backspace in an empty input, and Backspace or Delete on a remove button.
 *   The remove buttons are one roving tab stop, and the arrow keys move between them and the
 *   input. A polite live region says what was added and removed.
 * - Disabled: the Input's, flat (surface-2 fill, --line hairline, no shade), and the tokens lie flat too, as plain
 *   Tags. The labels stay at --fg-subtle because they are still read, and the remove buttons are disabled and left
 *   out of Tab.
 * - Collapse: while the field is not focused and holds more tokens than `collapseAfter`, it
 *   shows that many and a "+N" token, and it opens when it takes focus.
 * - Motion (responsive tier, hooks only): a new token fades in with a 0.98 scale, its neighbors
 *   and the input move with `layout="position"`, and a removed token fades out on the exit
 *   token. The edge and the ring fade on the instant tier. Nothing else moves.
 * - Phones: 16px text in the input on coarse pointers so iOS never zooms, the small field grows
 *   to 44, and the remove buttons are 44px targets. After a tap on x the input is not focused,
 *   so the keyboard does not open.
 */
import { useEffect, useId, useRef, useState, type ClipboardEvent, type FocusEventHandler, type KeyboardEvent, type MouseEventHandler, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { byWorld, useDevice, useExit, useMaterial, useTransition } from "@/motion";
import { useOverlayMotion } from "@/motion/deal";
import { TokenInputDeviceBody } from "./bodies/token-input.device";
import { TokenInputFlatBody } from "./bodies/token-input.flat";

export type TokenInputProps = {
  /** The label above the field. Required, because a placeholder is not a label. Clicking it focuses the input. */
  label: ReactNode;
  /** A hint under the field. An error, a rejected value or the limit replaces it. */
  hint?: ReactNode;
  /** Shown in danger color under the field and linked with aria-describedby. Also draws the danger edge. Say how to fix it. */
  error?: ReactNode;
  /** The values, when you control them. Pair it with onValueChange. Values are unique, ignoring case. */
  value?: string[];
  /** The values it starts with when you do not control it. */
  defaultValue?: string[];
  /** Called with the new list whenever a value is added or removed. */
  onValueChange?: (value: string[]) => void;
  /** Checks a value before it is added. Return true to accept it, or a message that says how to fix it. A rejected value stays in the input with the message under the field until the text changes. */
  validate?: (value: string) => string | true;
  /** Hint text inside the empty field. It disappears once there is a token, and it is never a label. */
  placeholder?: string;
  /** Minimum height on the shared control scale: sm is 32, md is 44, lg is 56. The field grows taller as tokens wrap. */
  size?: "sm" | "md" | "lg";
  /** The most values it holds. At the limit the input stops adding and the hint area says so. */
  max?: number;
  /** While the field is not focused and holds more values than this, it shows this many and a "+N" token. It opens on focus. */
  collapseAfter?: number;
  /** The field name a form sends the values under, once per value, through hidden inputs. */
  name?: string;
  /** Makes the field unavailable: muted, skipped by Tab, and left out of a form, like a native field. */
  disabled?: boolean;
  /** Extra classes for the whole component: the label, the field and the note under it. */
  className?: string;
};

/** What a body decides about one token: its chip, its label, its remove button and the "+N" chip. The part owns the list, the motion and the handlers. */
export type TokenSkin = {
  /** The chip around one token: its label and its remove button are the children. */
  Chip: (props: { disabled: boolean; children: ReactNode }) => ReactNode;
  /** The classes of the token's label. */
  text: (disabled: boolean) => string;
  /** The classes of the remove button, which keeps its name, its tab stop and its 44px target on coarse pointers. */
  remove: string;
  /** The cross in the remove button. */
  Cross: () => ReactNode;
  /** The classes of the "+N" chip. */
  more: string;
};

/** The state the part resolves, and the pieces it owns, for a body to dress. A body draws the label, the field, the note and the live region. */
export type TokenInputBodyProps = {
  size: "sm" | "md" | "lg";
  invalid: boolean;
  disabled: boolean;
  className: string;
  label: ReactNode;
  labelId: string;
  inputId: string;
  note: ReactNode;
  noteId: string;
  /** Goes on the element that wraps the tokens and the input: it finds focus and takes a press on its own air. */
  field: { ref: RefObject<HTMLDivElement | null>; onMouseDown: MouseEventHandler<HTMLDivElement>; onFocus: () => void; onBlur: FocusEventHandler<HTMLDivElement> };
  /** The tokens and the "+N" chip, drawn with the body's skin. */
  list: (skin: TokenSkin) => ReactNode;
  /** The real text input, in its slot. */
  input: ReactNode;
  /** One hidden input per value when the field has a name. */
  hidden: ReactNode;
  /** What the polite live region says. */
  said: string;
};

/* The field: the Input's cut (floor, line, shade) and its focus, error and disabled looks, on a
   wrapper that holds the tokens. The ring follows the text input only (the remove buttons draw their own). */
const FIELD =
  "relative flex w-full min-w-0 cursor-text bg-field font-field font-normal text-field-ink " +
  "shadow-[var(--slot-shade),var(--field-shade)] " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[input:focus-visible]:shadow-[var(--slot-shade),var(--field-shade),var(--focus-ring)] " +
  "data-[invalid]:shadow-[inset_0_0_0_1px_var(--danger),var(--slot-shade),var(--field-shade)] " +
  "data-[invalid]:has-[input:focus-visible]:shadow-[inset_0_0_0_1px_var(--danger),var(--slot-shade),var(--field-shade),var(--focus-ring)] " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-2 data-[disabled]:shadow-[inset_0_0_0_1px_var(--line)] " +
  /* Forced colors drops box-shadow, so the edge becomes a real border and focus gets an outline. */
  "forced-colors:border forced-colors:has-[input:focus-visible]:outline-2 forced-colors:has-[input:focus-visible]:outline-solid forced-colors:has-[input:focus-visible]:outline-offset-2";

/* The corners: the control radius, but never past half the one-line height, so a field that wraps to more rows of
   tokens keeps the corners it had on one line and stays concentric with the tokens inside, instead of turning into a
   lozenge at the pill. On one line it is the same as the control radius. */
const RADIUS = {
  sm: "rounded-[min(var(--radius-control),calc(var(--control-sm)/2))] pointer-coarse:rounded-[min(var(--radius-control),calc(var(--control-md)/2))]",
  md: "rounded-[min(var(--radius-control),calc(var(--control-md)/2))]",
  lg: "rounded-[min(var(--radius-control),calc(var(--control-lg)/2))]",
};

/* Padding on the 4px grid. A 24px token row plus this air lands on 32, 44 (centered in the minimum) and 56. */
const FIELD_SIZE = {
  sm: "min-h-control-sm px-1 py-1 pointer-coarse:min-h-control-md",
  md: "min-h-control-md px-2 py-2",
  lg: "min-h-control-lg px-4 py-4",
};

/* The text's size. The input inherits it, so 8ch is measured in the input's own font. */
const TEXT_SIZE = {
  sm: "text-small",
  md: "text-body",
  lg: "text-(length:--control-text-lg)",
};

/* Press: a small block on the token. It stands on the token's face (--block with its --highlight and --block-lift) and
   sinks the --press-depth under a press, its cast stepping down to --block-press. Nothing glides: the sink and the cast
   are on the instant tier. A disabled token lies flat, so its key does too. */
const CORNER = "rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))]";
const REMOVE =
  "relative grid size-5 shrink-0 cursor-pointer place-items-center " + CORNER + " bg-block text-fg-muted shadow-[var(--highlight),var(--block-lift)] " +
  "transition-[color,transform,box-shadow] duration-(--dur-instant) ease-litt hover:bg-(--block-hover) hover:text-fg " +
  "active:shadow-[var(--highlight),var(--block-press)] active:[transform:translateY(var(--press-depth))] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
  "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-fg-disabled disabled:shadow-none disabled:hover:bg-transparent disabled:hover:text-fg-disabled " +
  /* An invisible 44px target around the 20px block on a finger. */
  "pointer-coarse:before:absolute pointer-coarse:before:-inset-3";

const SEPARATOR = /[,;\r\n]/;

/** The text that went in between two states of the input: its change, found by trimming the shared start and end. */
function inserted(before: string, after: string): string {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let end = 0;
  while (end < before.length - start && end < after.length - start && before[before.length - 1 - end] === after[after.length - 1 - end]) end++;
  return after.slice(start, after.length - end);
}

/** A 16px cross, drawn smaller than the 24px button so it sits with the caption-size label. */
function RemoveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" />
    </svg>
  );
}

/* Press, the cut: today's field, with the Tag's raised block for each token. */
const PRESS_SKIN: TokenSkin = {
  Chip: ({ disabled, children }) => (
    <span
      className={
        "inline-flex h-6 max-w-full min-w-0 shrink-0 items-center gap-1 whitespace-nowrap pr-0.5 pl-2 text-caption " +
        CORNER +
        (disabled ? " bg-surface-3 text-fg-subtle" : " bg-block text-fg shadow-[var(--highlight),var(--key-lift)] forced-colors:border")
      }
    >
      {children}
    </span>
  ),
  text: () => "min-w-0 truncate",
  remove: REMOVE,
  Cross: RemoveIcon,
  /* "+N" stands for tokens and is not one: a shallow dent in the field, with no block to lift out. */
  more: "inline-flex h-6 shrink-0 cursor-default items-center bg-tray px-2 text-caption text-fg shadow-(--tray-shade) " + CORNER + " forced-colors:border",
};

function PressBody({ size, invalid, disabled, className, label, labelId, inputId, note, noteId, field, list, input, hidden, said }: TokenInputBodyProps) {
  return (
    <div data-body="press" className={"grid gap-2 " + className}>
      <label id={labelId} htmlFor={inputId} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </label>

      <div
        ref={field.ref}
        data-invalid={invalid ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={[FIELD, RADIUS[size], FIELD_SIZE[size], TEXT_SIZE[size], "pointer-coarse:text-(length:--control-text-lg)"].join(" ")}
        onMouseDown={field.onMouseDown}
        onFocus={field.onFocus}
        onBlur={field.onBlur}
      >
        <div className="relative flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {list(PRESS_SKIN)}
          {input}
        </div>
        {hidden}
      </div>

      {note && (
        <p id={noteId} className={"text-small " + (invalid ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </div>
    </div>
  );
}

/**
 * A labelled field that turns typed or pasted values into removable tokens. Enter or a comma adds what you typed, blur adds it
 * too so nothing is lost, and a pasted list is split into tokens. Backspace removes the last token; the arrow keys walk the
 * remove buttons. Hold the values in state with value and onValueChange, or give it a defaultValue and a name to post them with a form.
 */
export function TokenInput({
  label,
  hint,
  error,
  value: valueProp,
  defaultValue,
  onValueChange,
  validate,
  placeholder,
  size = "md",
  max,
  collapseAfter,
  name,
  disabled = false,
  className = "",
}: TokenInputProps) {
  const uid = useId();
  const inputId = `${uid}-input`;
  const labelId = `${uid}-label`;
  const noteId = `${uid}-note`;

  const [inner, setInner] = useState<string[]>(defaultValue ?? []);
  const value = valueProp ?? inner;
  const [draft, setDraft] = useState("");
  const [rejection, setRejection] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [said, setSaid] = useState("");

  const { coarse } = useDevice();
  const enter = useTransition("responsive");
  const exit = useExit("responsive");

  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const after = useRef<{ token: string } | "input" | null>(null);

  /* Focus lands where the removed token was, once the list has re-rendered. */
  useEffect(() => {
    const target = after.current;
    if (!target) return;
    after.current = null;
    if (target !== "input") {
      const next = buttons.current.get(target.token);
      if (next) return next.focus();
    }
    inputRef.current?.focus();
  });

  /* A focused button that is removed fires no blur, so the field checks where focus really is once a token has gone. */
  const syncFocus = () => setFocused(fieldRef.current?.contains(document.activeElement) ?? false);

  const collapsed = !focused && collapseAfter !== undefined && value.length > collapseAfter;
  const shown = collapsed ? value.slice(0, collapseAfter) : value;
  const more = value.length - shown.length;
  /* One roving tab stop among the remove buttons: the one last focused, else the last one in view. */
  const stop = active !== null && shown.includes(active) ? active : shown[shown.length - 1];

  const atMax = max !== undefined && value.length >= max;
  const invalid = rejection !== null || !!error;
  const note = rejection ?? error ?? (atMax ? `Limit of ${max} reached. Remove one to add another.` : hint);

  function setValue(next: string[]) {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  }

  /** Splits text on commas, semicolons and line breaks, then adds each part that passes. Rejected parts stay in the input. */
  function commit(text: string) {
    const parts = text.split(/[,;\r\n]+/).map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    const taken = new Set(next.map((v) => v.toLowerCase()));
    const added: string[] = [];
    const kept: string[] = [];
    let duplicate: string | null = null;
    let message: string | null = null;
    let full = false;
    for (const part of parts) {
      if (taken.has(part.toLowerCase())) {
        duplicate ??= part;
      } else if (max !== undefined && next.length >= max) {
        full = true;
      } else {
        const verdict = validate ? validate(part) : true;
        if (verdict !== true) {
          kept.push(part);
          message ??= verdict;
        } else {
          next.push(part);
          taken.add(part.toLowerCase());
          added.push(part);
        }
      }
    }
    if (added.length) setValue(next);
    setDraft(kept.join(", "));
    setRejection(message);
    const spoken: string[] = [];
    if (added.length) spoken.push(`Added ${added.join(", ")}`);
    if (message) spoken.push(message);
    else if (full || (added.length && max !== undefined && next.length >= max)) spoken.push(`Limit of ${max} reached`);
    else if (!added.length && duplicate) spoken.push(`${duplicate} is already added`);
    if (spoken.length) setSaid(spoken.join(". "));
  }

  /** Removes a token. `stay` leaves focus alone; otherwise it moves to the next token or the input, except after a tap, so the keyboard stays shut. */
  function remove(token: string, focus: "stay" | "key" | "pointer") {
    const at = value.indexOf(token);
    if (at < 0 || disabled) return;
    const next = value.filter((v) => v !== token);
    setValue(next);
    setSaid(`Removed ${token}`);
    if (focus === "key" || (focus === "pointer" && !coarse)) after.current = next[at] !== undefined ? { token: next[at] } : "input";
  }

  function focusButton(token: string | undefined) {
    if (token !== undefined) buttons.current.get(token)?.focus();
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    const el = e.currentTarget;
    if (e.key === "Enter" && draft.trim() !== "") {
      e.preventDefault(); // an empty field still submits its form
      commit(draft);
    } else if (e.key === "Backspace" && el.value === "" && value.length > 0) {
      e.preventDefault();
      remove(value[value.length - 1], "stay");
    } else if (e.key === "ArrowLeft" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && el.selectionStart === 0 && el.selectionEnd === 0 && shown.length > 0) {
      e.preventDefault();
      focusButton(shown[shown.length - 1]);
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!SEPARATOR.test(text)) return; // one value lands in the input, to check before it is added
    e.preventDefault(); // an input flattens line breaks, so the list is read from the clipboard itself
    const el = e.currentTarget;
    const from = el.selectionStart ?? draft.length;
    commit(draft.slice(0, from) + text + draft.slice(el.selectionEnd ?? from));
  }

  function onRemoveKeyDown(e: KeyboardEvent<HTMLButtonElement>, token: string, at: number) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusButton(shown[Math.max(0, at - 1)]);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (at < shown.length - 1) focusButton(shown[at + 1]);
      else inputRef.current?.focus();
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      remove(token, "key");
    }
  }

  const material = useMaterial();
  const om = useOverlayMotion();
  /* Press and Flat grow and slide their neighbors; Device switches in place and nothing glides. */
  const switches = material === "device" && om.switches;
  const itemEnter = switches ? om.switchIn : enter;
  const itemExit = switches ? om.switchOut : exit;
  const Body = byWorld(material, { press: PressBody, flat: TokenInputFlatBody, device: TokenInputDeviceBody });

  const list = (skin: TokenSkin) => (
    <ul role="list" aria-labelledby={labelId} className="contents">
      <AnimatePresence initial={false} mode="popLayout" onExitComplete={syncFocus}>
        {shown.map((token, at) => (
          <motion.li
            key={token}
            layout={switches ? false : "position"}
            className="flex max-w-full min-w-0 cursor-default"
            initial={{ opacity: 0, scale: switches ? 1 : 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: itemExit }}
            transition={itemEnter}
          >
            <skin.Chip disabled={disabled}>
              <span className={skin.text(disabled)}>{token}</span>
              <button
                type="button"
                ref={(el) => {
                  if (el) buttons.current.set(token, el);
                  else buttons.current.delete(token);
                }}
                aria-label={`Remove ${token}`}
                tabIndex={token === stop ? 0 : -1}
                disabled={disabled}
                className={skin.remove}
                onFocus={() => setActive(token)}
                onKeyDown={(e) => onRemoveKeyDown(e, token, at)}
                onClick={(e) => remove(token, e.detail === 0 ? "key" : "pointer")}
              >
                <skin.Cross />
              </button>
            </skin.Chip>
          </motion.li>
        ))}
        {more > 0 && (
          <motion.li
            key="more"
            layout={switches ? false : "position"}
            aria-label={`${more} more`}
            className={skin.more}
            initial={{ opacity: 0, scale: switches ? 1 : 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: itemExit }}
            transition={itemEnter}
          >
            +{more}
          </motion.li>
        )}
      </AnimatePresence>
    </ul>
  );

  return (
    <Body
      size={size}
      invalid={invalid}
      disabled={disabled}
      className={className}
      label={label}
      labelId={labelId}
      inputId={inputId}
      note={note}
      noteId={noteId}
      field={{
        ref: fieldRef,
        onMouseDown: (e) => {
          /* A press on the field's own air focuses the input and keeps focus from falling off it. */
          if (disabled || (e.target as HTMLElement).closest("button, input")) return;
          e.preventDefault();
          inputRef.current?.focus();
        },
        onFocus: () => setFocused(true),
        onBlur: (e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return; // moving inside the field
          if (document.activeElement === e.target) return; // the window lost focus, not the field
          setFocused(false);
          if (draft.trim() !== "") commit(draft);
        },
      }}
      list={list}
      input={
        <motion.div layout={switches ? false : "position"} transition={itemEnter} className={"flex flex-1 " + (atMax ? "min-w-1" : "min-w-[8ch]")}>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={draft}
            placeholder={value.length === 0 ? placeholder : undefined}
            disabled={disabled}
            readOnly={atMax}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={invalid || undefined}
            aria-describedby={note ? noteId : undefined}
            className={
              "box-content h-6 min-w-0 flex-1 bg-transparent pl-2 text-field-ink outline-none placeholder:text-field-ink-subtle " +
              "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:placeholder:text-fg-disabled"
            }
            onChange={(e) => {
              const text = e.target.value;
              if (SEPARATOR.test(inserted(draft, text))) return commit(text); // a typed comma, or a paste the browser kept whole
              setDraft(text);
              setRejection(null);
            }}
            onKeyDown={onInputKeyDown}
            onPaste={onPaste}
          />
        </motion.div>
      }
      hidden={name && value.map((v) => <input key={v} type="hidden" name={name} value={v} disabled={disabled} />)}
      said={said}
    />
  );
}
