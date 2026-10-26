/**
 * Composer: where the person writes to an agent (components.md, "Composer"). A text field that grows, file
 * chips, a toolbar and Send. FileChip is the chip on its own, for a message that was already sent.
 *
 * - Box: one surface at the surface radius on surface-1, with the Input's inset --line-control edge. While the
 *   text area has focus the edge is --focus plus --focus-ring, as the Input's. Inside it, top to bottom: the
 *   file chips, the text area, and a toolbar row of sm controls padded --space-2. The edge fades on the instant
 *   tier and nothing else about the box moves.
 * - Text: the body size (16px on coarse pointers, so iOS never zooms) in --fg, the placeholder in --fg-subtle,
 *   side padding as the Input's md. It starts one line tall and grows a line at a time up to `maxRows` (8), then
 *   scrolls inside. The height is set in a layout effect, so it snaps with the text and is never animated. A
 *   visually hidden <label> names it.
 * - Keys: Enter sends and Shift+Enter starts a new line. Enter while an input method is composing (isComposing,
 *   or the keyCode 229 Safari reports for the Enter that confirms it) never sends. On a touch screen, whose soft
 *   keyboard has no Shift, Return is a new line and Send sends, unless `enterSends` says otherwise. With `enterSends={false}`,
 *   Cmd+Enter or Ctrl+Enter sends and Enter is a new line. Esc stops a streaming answer while the field has focus.
 *   While streaming, Enter sends nothing: the person can draft the next message, and Send is Stop.
 * - Send: one icon-only round Button at sm (44px on a coarse pointer or a compact screen), named "Send", primary,
 *   with an ArrowUp icon: the view's one accent fill (R6). It is disabled while the trimmed text is empty or while
 *   `sendDisabled` or `disabled` is set. While `streaming` the same button becomes Stop: secondary, a filled
 *   square, named "Stop". It is one element, so the swap is at once and focus stays on it. After a send or a stop
 *   focus goes back to the field, and if the answer ends while Stop has focus it goes to the field too, so it
 *   never falls to the page.
 * - Files: chips above the text (FileChip), added by `files`. The Attach button, a paste and a drop all call
 *   `onFiles` with the files, and the caller owns the list. A hidden file input sits behind the Attach button,
 *   which shows only when `onFiles` is set. A paste attaches only when the clipboard holds files and no text of
 *   its own, so copying cells from a sheet still pastes text. Files dragged over the box turn its edge --focus and
 *   show "Drop to attach" in place of the text, on the instant tier. A chip enters on the responsive tier
 *   (opacity and a 0.98 scale) and leaves on the exit token, as a token in the TokenInput does. Removing one
 *   moves focus to the next chip, or to the field.
 * - Suggestions: up to four prompts above the box as secondary sm Buttons. A click puts the text in the field and
 *   focuses it with the caret at the end. It never sends (decision 8). The caller drops them after the first turn.
 * - Hint and limit: `hint` is a caption line under the box in --fg-subtle, linked to the field. With `maxLength`
 *   the field stops at the limit, and a tabular count shows in the toolbar once 80% is used, in --danger at the
 *   limit. A polite message says it once at 80% and once at the limit, never on every key.
 * - Disabled: --surface-2 with a --line edge, the text --fg-disabled. Say the reason in the hint.
 * - Compact screens: the toolbar's buttons grow to 44px, and a bottom safe-area inset sits under the composer. The
 *   caller keeps it above the on-screen keyboard (useVisibleScreen from @/motion sizes the chat frame).
 * - Motion: only instant color and edge fades, and the chips' responsive entrance and exit. Send and Stop swap at
 *   once.
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/button";
import { ArrowUpIcon, FileIcon, PaperclipIcon, StopIcon, XIcon } from "@/components/icons";
import { useDevice, useExit, useTransition } from "@/motion";

/** A file shown as a chip above the text. The caller owns the list: add it when a file is picked, update its progress, remove it in onRemoveFile. */
export type ComposerFile = {
  /** A stable id: the chip's key, and how a removal says which file it means. */
  id: string;
  /** The file name. A long name is cut at the end with an ellipsis. */
  name: string;
  /** The size: a number is bytes and reads "2.4 MB", a string is shown as it is. */
  size?: number | string;
  /** Upload progress from 0 to 100. While it is below 100 the chip shows the percent in place of the size. */
  progress?: number;
};

const MAX_SUGGESTIONS = 4;
const NEAR = 0.8; // the share of maxLength at which the count appears

/** 1234567 to "1.2 MB". A string is the caller's own wording and passes through. */
function formatSize(size: number | string): string {
  if (typeof size === "string") return size;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${size < 10 * 1024 ? (size / 1024).toFixed(1) : Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/** 2000 to "2,000", the same on the server and in the browser. */
const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/* ------------------------------------------------------------------ FileChip */

export type FileChipProps = {
  /** The file name. A long name is cut at the end with an ellipsis. */
  name: string;
  /** The size: a number is bytes and reads "2.4 MB", a string is shown as it is. */
  size?: number | string;
  /** Upload progress from 0 to 100. While it is below 100 the chip shows the percent in place of the size. */
  progress?: number;
  /** Called when the remove button is pressed, with the click. Leave it out for a file that was already sent and the chip has no button. */
  onRemove?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Extra classes for the chip. */
  className?: string;
};

const REMOVE =
  "relative grid size-6 shrink-0 cursor-pointer place-items-center rounded-control text-fg-subtle " +
  "transition-[color] duration-(--dur-instant) ease-litt hover:text-fg " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
  /* An invisible 44px target around the 24px button on a finger. */
  "pointer-coarse:before:absolute pointer-coarse:before:-inset-2.5";

/**
 * A file as a chip: an icon, the name, the size or the upload percent, and a remove button named
 * "Remove brief.pdf". With no onRemove it is a plain label, for the files of a message already sent.
 */
export function FileChip({ name, size, progress, onRemove, className = "" }: FileChipProps) {
  const { coarse } = useDevice();
  const uploading = progress !== undefined && progress < 100;
  const percent = Math.round(Math.min(100, Math.max(0, progress ?? 100)));
  return (
    <span
      className={[
        "inline-flex h-8 max-w-full min-w-0 items-center gap-2 rounded-control bg-surface-1 pl-2 font-normal text-fg",
        "shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]",
        onRemove ? "pr-1" : "pr-2",
        className,
      ].join(" ")}
    >
      <FileIcon className="shrink-0 text-fg-muted" />
      <span className="min-w-0 truncate text-caption font-normal text-fg">{name}</span>
      {uploading ? (
        <>
          <span className="sr-only">, uploading {percent} percent</span>
          <span aria-hidden="true" className="min-w-[4ch] shrink-0 text-right text-caption font-normal tabular-nums text-fg-subtle">
            {percent}%
          </span>
        </>
      ) : (
        size !== undefined && (
          <>
            <span className="sr-only">, </span>
            <span className="shrink-0 text-caption tabular-nums font-normal text-fg-subtle">{formatSize(size)}</span>
          </>
        )
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          className={REMOVE + (coarse ? " before:absolute before:-inset-2.5" : "")}
          onClick={onRemove}
        >
          <XIcon />
        </button>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ Composer */

export type ComposerProps = {
  /** The text, when you control it. Pair it with onValueChange. */
  value?: string;
  /** The text it starts with when you do not control it. */
  defaultValue?: string;
  /** Called with the new text on every change, and with an empty string after a send so a controlled field clears. */
  onValueChange?: (value: string) => void;
  /** Called with the trimmed text when the person presses Send or Enter. The field then clears. Not called while streaming or when Send is disabled. */
  onSend?: (text: string) => void;
  /** True while the agent answers. Send becomes Stop, Esc stops, and Enter sends nothing. */
  streaming?: boolean;
  /** Called when Stop is pressed, or Esc is pressed in the field, while streaming. */
  onStop?: () => void;
  /** Disables Send while the field stays usable, such as while the agent waits on an approval. Say why in hint. */
  sendDisabled?: boolean;
  /** Shown in the empty field in the subtle color, such as "Message Litt". It is not the label. */
  placeholder?: string;
  /** The field's name for screen readers. It is visually hidden, because the placeholder is what people see. */
  label?: string;
  /** Controls at the start of the toolbar after Attach, such as a model Select at sm. Keep them sm: Button and Select grow to 44px on a finger themselves. */
  tools?: ReactNode;
  /** The files to show as chips above the text. The caller owns the list. */
  files?: ComposerFile[];
  /** Called with the file whose remove button was pressed. Leave it out and the chips have no remove button. */
  onRemoveFile?: (file: ComposerFile) => void;
  /** Called with the files from the Attach picker, a paste and a drop. Passing it turns files on: the Attach button shows and the box takes drops. */
  onFiles?: (files: File[]) => void;
  /** Which files the picker offers, as the input's accept attribute, such as ".pdf,image/*". */
  accept?: string;
  /** Up to four prompts shown above the box for an empty chat. A click fills the field and focuses it, and never sends. Drop them after the first turn. */
  suggestions?: string[];
  /** A line under the box in the subtle color, such as "Litt can be wrong. Check what matters." Also the place to say why the composer is disabled. */
  hint?: ReactNode;
  /** The most characters the field takes. The count shows once 80% is used, and turns to the danger color at the limit. */
  maxLength?: number;
  /** How many lines it grows to before it scrolls inside. */
  maxRows?: number;
  /** True: Enter sends and Shift+Enter is a new line. False: Cmd or Ctrl+Enter sends and Enter is a new line, for long writing. Left out, it follows the pointer: Enter sends with a mouse or a trackpad, and on a touch screen, whose soft keyboard has no Shift, Return is a new line and Send sends. */
  enterSends?: boolean;
  /** Makes the whole composer unavailable: muted, skipped by Tab. Say why in hint. */
  disabled?: boolean;
  /** Extra classes for the composer. */
  className?: string;
  /** The underlying <textarea>, for focus or a form library. */
  ref?: Ref<HTMLTextAreaElement>;
};

/* The box: the Input's fill, edge, focus and disabled looks on the surface radius. The ring follows the text area. */
const BOX =
  "group/box relative flex flex-col overflow-hidden rounded-surface bg-surface-1 font-normal text-fg " +
  "shadow-[inset_0_0_0_1px_var(--line-control)] " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[textarea:focus-visible]:shadow-[inset_0_0_0_1px_var(--focus),var(--focus-ring)] " +
  "data-[dragging]:shadow-[inset_0_0_0_1px_var(--focus)] " +
  "data-[disabled]:bg-surface-2 data-[disabled]:shadow-[inset_0_0_0_1px_var(--line)] " +
  /* Forced colors drops box-shadow, so the edge becomes a real border and focus gets an outline. */
  "forced-colors:border forced-colors:has-[textarea:focus-visible]:outline-2 forced-colors:has-[textarea:focus-visible]:outline-solid forced-colors:has-[textarea:focus-visible]:outline-offset-2";

const AREA =
  "block w-full min-w-0 resize-none overflow-y-hidden bg-transparent px-control-pad-md py-3 font-normal text-body text-fg " +
  "outline-none placeholder:text-fg-subtle pointer-coarse:text-(length:--control-text-lg) " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:placeholder:text-fg-disabled";

/* Shown over the text while files are dragged over the box: the same place and size as the placeholder. */
const DROP =
  "pointer-events-none absolute inset-px bg-surface-1 px-[calc(var(--control-pad-md)-1px)] py-[calc(var(--space-3)-1px)] text-body text-fg-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) opacity-0 transition-opacity duration-(--dur-instant) ease-litt " +
  "group-data-[dragging]/box:opacity-100";

/** A file in the clipboard is pasted as an attachment only when the clipboard holds no text of its own (a copied file's text is just its name). */
function pastedFiles(data: DataTransfer): File[] {
  const files = Array.from(data.files);
  if (files.length === 0) return [];
  const names = new Set(files.map((f) => f.name));
  const text = data.getData("text/plain").trim();
  return text === "" || text.split(/\r?\n/).every((line) => names.has(line.trim())) ? files : [];
}

/**
 * The composer: a growing text field, file chips, a toolbar for your controls and a round Send that becomes
 * Stop while the agent answers. Hold the text yourself with value and onValueChange, or let it keep its own, and
 * call your agent in onSend. Enter sends, Shift+Enter starts a new line, and Esc stops an answer.
 */
export function Composer({
  value: valueProp,
  defaultValue,
  onValueChange,
  onSend,
  streaming = false,
  onStop,
  sendDisabled = false,
  placeholder = "Message",
  label = "Message",
  tools,
  files = [],
  onRemoveFile,
  onFiles,
  accept,
  suggestions,
  hint,
  maxLength,
  maxRows = 8,
  enterSends: enterSendsProp,
  disabled = false,
  className = "",
  ref,
}: ComposerProps) {
  const uid = useId();
  const areaId = `${uid}-text`;
  const hintId = `${uid}-hint`;
  const countId = `${uid}-count`;

  const [inner, setInner] = useState(defaultValue ?? "");
  const value = valueProp ?? inner;
  const [dragging, setDragging] = useState(false);
  const [said, setSaid] = useState("");

  const { compact, coarse } = useDevice();
  const big = compact || coarse;
  const enterSends = enterSendsProp ?? !coarse;
  const enter = useTransition("responsive");
  const exit = useExit("responsive");

  const area = useRef<HTMLTextAreaElement | null>(null);
  const setArea = useCallback(
    (el: HTMLTextAreaElement | null) => {
      area.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
  const picker = useRef<HTMLInputElement>(null);
  const action = useRef<HTMLButtonElement>(null);
  const actionFocused = useRef(false);
  const dragDepth = useRef(0);
  const chips = useRef(new Map<string, HTMLLIElement>());
  const after = useRef<string | "field" | null>(null);
  const caretAtEnd = useRef(false);

  function setValue(next: string) {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  }

  /* The height follows the text a line at a time. It snaps: no transition is ever set on it. */
  const fit = useCallback(() => {
    const el = area.current;
    if (!el) return;
    const top = el.scrollTop;
    el.style.height = "auto";
    const full = el.scrollHeight;
    if (full === 0) return; // not laid out (hidden): nothing to measure
    const cs = getComputedStyle(el);
    const font = parseFloat(cs.fontSize) || 15;
    const line = parseFloat(cs.lineHeight) || font * 1.55;
    const limit = line * maxRows + (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const over = full > limit + 0.5;
    el.style.height = `${over ? limit : full}px`;
    el.style.overflowY = over ? "auto" : "hidden";
    // Typing at the end keeps the last line, and the air under it, in view. Anywhere else the scroll stays where it was.
    if (over) el.scrollTop = document.activeElement === el && el.selectionStart === el.value.length ? el.scrollHeight : top;
  }, [maxRows]);
  useLayoutEffect(fit, [fit, value, coarse]);
  useEffect(() => {
    const el = area.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let width = el.clientWidth;
    const watch = new ResizeObserver(() => {
      if (el.clientWidth === width) return; // our own height changes land here too
      width = el.clientWidth;
      fit();
    });
    watch.observe(el);
    return () => watch.disconnect();
  }, [fit]);

  /* A suggestion puts the caret after its text, once the field holds it. */
  useLayoutEffect(() => {
    const el = area.current;
    if (!caretAtEnd.current || !el || el.value !== value) return;
    caretAtEnd.current = false;
    el.setSelectionRange(value.length, value.length);
  }, [value]);

  /* Focus lands where a removed chip was, once the list has re-rendered. */
  useEffect(() => {
    const target = after.current;
    if (!target) return;
    after.current = null;
    if (target !== "field") {
      const next = chips.current.get(target)?.querySelector("button");
      if (next) return next.focus();
    }
    area.current?.focus();
  });

  /* The button swaps between Send and Stop in place. If the answer ends while it has focus and it turns disabled,
     focus would fall to the page, so it goes to the field instead. */
  useEffect(() => {
    if (!actionFocused.current) return;
    const at = document.activeElement;
    const lost = !at || at === document.body || (at === action.current && action.current?.disabled);
    if (lost) area.current?.focus();
    actionFocused.current = false;
  }, [streaming]);

  /* What was added or finished is said once. A removal is said where it happens, so a send that clears the list is not announced as one. */
  const seen = useRef<Map<string, { name: string; uploading: boolean }> | null>(null);
  useEffect(() => {
    const now = new Map(files.map((f) => [f.id, { name: f.name, uploading: f.progress !== undefined && f.progress < 100 }]));
    const before = seen.current;
    seen.current = now;
    if (!before) return;
    const added = [...now].filter(([id]) => !before.has(id)).map(([, f]) => f.name);
    const done = [...now].filter(([id, f]) => before.get(id)?.uploading && !f.uploading).map(([, f]) => f.name);
    const spoken: string[] = [];
    if (added.length) spoken.push(`Attached ${added.join(", ")}`);
    if (done.length) spoken.push(`Uploaded ${done.join(", ")}`);
    if (spoken.length) setSaid(spoken.join(". "));
  }, [files]);

  const trimmed = value.trim();
  const canSend = !disabled && !sendDisabled && !streaming && trimmed !== "";

  function send() {
    if (!canSend) return;
    onSend?.(trimmed);
    setValue("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // An input method confirms its text with Enter. Safari reports that Enter after compositionend, as keyCode 229.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Escape" && streaming) {
      e.preventDefault();
      onStop?.();
    } else if (e.key === "Enter" && !e.shiftKey && (enterSends || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    if (!onFiles || disabled) return;
    const pasted = pastedFiles(e.clipboardData);
    if (pasted.length === 0) return;
    e.preventDefault();
    onFiles(pasted);
  }

  const droppable = (e: DragEvent) => !!onFiles && !disabled && Array.from(e.dataTransfer.types).includes("Files");
  function onDragEnter(e: DragEvent) {
    if (!droppable(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }
  function onDragOver(e: DragEvent) {
    if (!droppable(e)) return;
    e.preventDefault(); // without this the browser refuses the drop
    e.dataTransfer.dropEffect = "copy";
  }
  function onDragLeave(e: DragEvent) {
    if (!droppable(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }
  function onDrop(e: DragEvent) {
    if (!droppable(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) onFiles?.(dropped);
  }

  /** `how` is the press that asked: after a tap focus is left alone, so the keyboard does not open. */
  function removeFile(file: ComposerFile, how: "key" | "pointer") {
    const at = files.findIndex((f) => f.id === file.id);
    const next = files[at + 1] ?? files[at - 1];
    setSaid(`Removed ${file.name}`);
    onRemoveFile?.(file);
    if (how === "key" || !coarse) after.current = next ? next.id : "field";
  }

  const near = maxLength !== undefined && value.length >= maxLength * NEAR;
  const full = maxLength !== undefined && value.length >= maxLength;
  const limitSaid =
    maxLength === undefined || !near
      ? ""
      : full
        ? `Limit of ${group(maxLength)} characters reached`
        : `Close to the limit of ${group(maxLength)} characters`;

  const shown = (suggestions ?? []).slice(0, MAX_SUGGESTIONS);
  const describedBy = [hint ? hintId : "", near ? countId : ""].filter(Boolean).join(" ") || undefined;
  const grow = "pointer-coarse:h-control-md pointer-coarse:w-control-md max-sm:h-control-md max-sm:w-control-md";

  return (
    <div className={["flex min-w-0 flex-col gap-2 max-sm:pb-[env(safe-area-inset-bottom)]", className].join(" ")}>
      {shown.length > 0 && (
        <div role="group" aria-label="Suggestions" className="flex flex-wrap gap-2 pb-1">
          {shown.map((text) => (
            <Button
              key={text}
              size={coarse ? "md" : "sm"}
              disabled={disabled}
              className="max-w-full pointer-coarse:h-control-md [&>span]:min-w-0 [&>span>span]:truncate [&>span>span]:py-[0.25em]"
              onClick={() => {
                caretAtEnd.current = true;
                setValue(text);
                area.current?.focus();
              }}
            >
              {text}
            </Button>
          ))}
        </div>
      )}

      <div
        data-dragging={dragging ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={BOX}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <ul role="list" aria-label="Attached files" className={"hidden flex-wrap has-[li]:flex has-[li]:px-2 has-[li]:pt-2 " + (coarse ? "gap-3" : "gap-2")}>
          <AnimatePresence initial={false}>
            {files.map((file) => (
              <motion.li
                key={file.id}
                layout="position"
                ref={(el: HTMLLIElement | null) => {
                  if (el) chips.current.set(file.id, el);
                  else chips.current.delete(file.id);
                }}
                className="flex max-w-full min-w-0"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: exit }}
                transition={enter}
              >
                <FileChip
                  name={file.name}
                  size={file.size}
                  progress={file.progress}
                  onRemove={onRemoveFile && !disabled ? (e) => removeFile(file, e.detail === 0 ? "key" : "pointer") : undefined}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="relative">
          <label htmlFor={areaId} className="sr-only">
            {label}
          </label>
          <textarea
            ref={setArea}
            id={areaId}
            rows={1}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            enterKeyHint={enterSends ? "send" : "enter"}
            aria-describedby={describedBy}
            className={AREA}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
          />
          <span aria-hidden="true" className={DROP}>
            Drop to attach
          </span>
        </div>

        <div className="flex items-center gap-2 p-2">
          {onFiles && (
            <>
              <input
                ref={picker}
                type="file"
                multiple
                accept={accept}
                hidden
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  e.target.value = ""; // so the same file can be picked again
                  if (picked.length) onFiles(picked);
                }}
              />
              <Button
                variant="ghost"
                size={big ? "md" : "sm"}
                iconOnly
                aria-label="Attach files"
                disabled={disabled}
                className={grow}
                onClick={() => picker.current?.click()}
              >
                <PaperclipIcon />
              </Button>
            </>
          )}
          {tools && <div className="flex min-w-0 items-center gap-2">{tools}</div>}
          <div className="min-w-0 flex-1" />
          {near && (
            <span
              id={countId}
              className={
                "shrink-0 px-1 text-caption font-normal tabular-nums transition-colors duration-(--dur-instant) ease-litt " +
                (full ? "text-danger" : "text-fg-subtle")
              }
            >
              <span className="sr-only">Characters used: </span>
              {group(value.length)} / {group(maxLength)}
            </span>
          )}
          <Button
            ref={action}
            variant={streaming ? "secondary" : "primary"}
            size={big ? "md" : "sm"}
            iconOnly
            aria-label={streaming ? "Stop" : "Send"}
            disabled={streaming ? disabled : !canSend}
            className={grow}
            onFocus={() => {
              actionFocused.current = true;
            }}
            onBlur={() => {
              actionFocused.current = false;
            }}
            onClick={() => {
              if (streaming) onStop?.();
              else send();
              area.current?.focus();
            }}
          >
            {streaming ? <StopIcon /> : <ArrowUpIcon />}
          </Button>
        </div>
      </div>

      {hint && (
        <p id={hintId} className="px-control-pad-md text-caption font-normal text-fg-subtle">
          {hint}
        </p>
      )}

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {limitSaid}
      </div>
    </div>
  );
}
