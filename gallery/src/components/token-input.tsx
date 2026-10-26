/**
 * TokenInput: a field that collects short values as removable tokens, such as the sender
 * domains of a mail rule, the recipients of an invoice or the tags of a project. It is the
 * Input's sibling (components.md, "Token input"): same field, same label and hint.
 *
 * - Field: the Input's cut (R3: the --cut floor, the --line-control line and the top wall's
 *   shade) at the control radius. Heights are minimums on the shared scale (sm 32, md 44, lg 56),
 *   and the 2px focus ring wraps the whole field while its text input is focus-visible. An
 *   invalid field turns the line to --danger. Like the Input it has no hover. Padding sits on the
 *   4px grid, so the field grows by whole token rows (24px tokens, 4px apart) as they wrap.
 * - Token: a raised Tag (R3: a block you can lift out of the cut, --block and --block-lift, its
 *   corners the control radius less 2px; 24px, the sans at the caption size and the label weight),
 *   with a 24px remove button that grows to a 44px hit area on coarse pointers through an
 *   invisible ::before. The "+N" token is a flat surface-2 chip with no button: it stands for
 *   tokens, it is not one. The placeholder shows only while there are no tokens.
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
import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Tag } from "@/components/tag";
import { useDevice, useExit, useTransition } from "@/motion";

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

/* The field: the Input's cut (floor, line, shade) and its focus, error and disabled looks, on a
   wrapper that holds the tokens. The ring follows the text input only (the remove buttons draw their own). */
const FIELD =
  "relative flex w-full min-w-0 cursor-text rounded-control bg-cut font-normal text-fg " +
  "shadow-[inset_0_0_0_1px_var(--line-control),var(--cut-shade)] " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[input:focus-visible]:shadow-[inset_0_0_0_1px_var(--focus),var(--cut-shade),var(--focus-ring)] " +
  "data-[invalid]:shadow-[inset_0_0_0_1px_var(--danger),var(--cut-shade)] " +
  "data-[invalid]:has-[input:focus-visible]:shadow-[inset_0_0_0_1px_var(--danger),var(--cut-shade),var(--focus-ring)] " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-2 data-[disabled]:shadow-[inset_0_0_0_1px_var(--line)] " +
  /* Forced colors drops box-shadow, so the edge becomes a real border and focus gets an outline. */
  "forced-colors:border forced-colors:has-[input:focus-visible]:outline-2 forced-colors:has-[input:focus-visible]:outline-solid forced-colors:has-[input:focus-visible]:outline-offset-2";

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

const REMOVE =
  "relative grid size-6 shrink-0 place-items-center rounded-control text-fg-subtle " +
  "transition-[color] duration-(--dur-instant) ease-litt hover:text-fg " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:text-fg-disabled " +
  /* An invisible 44px target around the 24px button on a finger. */
  "pointer-coarse:before:absolute pointer-coarse:before:-inset-2.5";

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

  return (
    <div className={"grid gap-2 " + className}>
      <label id={labelId} htmlFor={inputId} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </label>

      <div
        ref={fieldRef}
        data-invalid={invalid ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={[FIELD, FIELD_SIZE[size], TEXT_SIZE[size], "pointer-coarse:text-(length:--control-text-lg)"].join(" ")}
        onMouseDown={(e) => {
          /* A press on the field's own air focuses the input and keeps focus from falling off it. */
          if (disabled || (e.target as HTMLElement).closest("button, input")) return;
          e.preventDefault();
          inputRef.current?.focus();
        }}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return; // moving inside the field
          if (document.activeElement === e.target) return; // the window lost focus, not the field
          setFocused(false);
          if (draft.trim() !== "") commit(draft);
        }}
      >
        <div className="relative flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <ul role="list" aria-labelledby={labelId} className="contents">
            <AnimatePresence initial={false} mode="popLayout" onExitComplete={syncFocus}>
              {shown.map((token, at) => (
                <motion.li
                  key={token}
                  layout="position"
                  className="flex max-w-full min-w-0 cursor-default"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, transition: exit }}
                  transition={enter}
                >
                  <Tag raised={!disabled} className="max-w-full min-w-0 pr-0">
                    <span className={"min-w-0 truncate " + (disabled ? "text-fg-subtle" : "")}>{token}</span>
                    <button
                      type="button"
                      ref={(el) => {
                        if (el) buttons.current.set(token, el);
                        else buttons.current.delete(token);
                      }}
                      aria-label={`Remove ${token}`}
                      tabIndex={token === stop ? 0 : -1}
                      disabled={disabled}
                      className={REMOVE}
                      onFocus={() => setActive(token)}
                      onKeyDown={(e) => onRemoveKeyDown(e, token, at)}
                      onClick={(e) => remove(token, e.detail === 0 ? "key" : "pointer")}
                    >
                      <RemoveIcon />
                    </button>
                  </Tag>
                </motion.li>
              ))}
              {more > 0 && (
                <motion.li
                  key="more"
                  layout="position"
                  aria-label={`${more} more`}
                  className="inline-flex h-6 shrink-0 cursor-default items-center rounded-control bg-surface-2 px-2 text-caption text-fg-muted shadow-[inset_0_0_0_1px_var(--line)]"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, transition: exit }}
                  transition={enter}
                >
                  +{more}
                </motion.li>
              )}
            </AnimatePresence>
          </ul>

          <motion.div layout="position" transition={enter} className={"flex flex-1 " + (atMax ? "min-w-1" : "min-w-[8ch]")}>
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
                "box-content h-6 min-w-0 flex-1 bg-transparent pl-2 text-fg outline-none placeholder:text-fg-subtle " +
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
        </div>

        {name && value.map((v) => <input key={v} type="hidden" name={name} value={v} disabled={disabled} />)}
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
