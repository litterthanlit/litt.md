/**
 * File drop: where someone adds files, by dropping them or choosing them, and where they watch them upload
 * (components.md, "File drop").
 *
 * - FileDrop is the area. It is the Input's cut (R3) at the surface radius: the --cut floor, the --line-control line
 *   and the top wall's shade, because it is something you put files into, as a field is something you type into. A
 *   row, not a centered stack: a square with an up arrow, the words ("Drop files here", and a hint with the types and
 *   the size limit in --fg-subtle), and Choose files, a secondary button at the end. While files are dragged over it,
 *   the line turns --focus, as a field's does on focus, and the words say what a drop will do. Nothing
 *   else moves; the line changes on the instant tier.
 * - Flat (proposals/flat-pill.md): no outline, no dashed edge: a grey area (--cut is --surface-3) that deepens
 *   while a file is over it, the icon a --surface-1 circle on it, no rule between file rows. Under forced colors the
 *   dragging area keeps a Highlight outline.
 * - On a touch screen nothing is dragged in, so the words say "Add files" and the button does the work.
 * - Choosing: Choose files opens the file picker; so does a click anywhere on the area. Only the button is a tab stop.
 * - Checking: files whose type is not in accept or whose size is over maxSize are turned away, each with a sentence
 *   under the area that says which file and why. The rest go to onFiles. The sentences go when the next files come.
 * - FileList and FileRow show what was added: one row per file, its name, its size, and while it uploads a
 *   Progress rail under the name. A failed file says why in --danger and offers Retry. Remove is an icon button.
 * - Disabled lies flat: surface-2 with the plain --line hairline and no shade, no drop and no tab stop. The words stay
 *   --fg-subtle, because they still say something (when it opens again), as a disabled Slide to confirm's do.
 * - Forced colors drops box-shadow, so the line becomes a real border.
 * - One contract, three bodies (proposals/worlds.md, Bodies). This file is the contract: the props, the checking, the
 *   drag count, the picker and its hidden input, the alert, the list and the row's actions. It resolves them once into
 *   FileDropBodyProps and FileRowBodyProps and renders the body the material picks (byWorld). PressBody and
 *   PressRowBody, below, are the default (the cut above). bodies/file-drop.flat.tsx is Flat's and
 *   bodies/file-drop.device.tsx is Device's: a slot with an engraved legend and a Choose key, each file a line of
 *   LCD glass whose upload lights segments in steps.
 */
import { useId, useRef, useState, type ComponentProps, type DragEvent, type ReactNode } from "react";
import { Button } from "@/components/button";
import { ArrowUpIcon, FileIcon, RetryIcon, XIcon } from "@/components/icons";
import { Progress } from "@/components/progress";
import { byWorld, useDevice, useMaterial } from "@/motion";
import { FileDropDeviceBody, FileRowDeviceBody } from "./bodies/file-drop.device";
import { FileDropFlatBody, FileRowFlatBody } from "./bodies/file-drop.flat";

/** 2048 to "2.0 KB": the size in the units people read. */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${bytes < 10 * 1024 ? (bytes / 1024).toFixed(1) : Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Does a file match one entry of an accept list: ".pdf", "image/*" or "image/png"? */
function matches(file: File, rule: string): boolean {
  const r = rule.trim().toLowerCase();
  if (r.startsWith(".")) return file.name.toLowerCase().endsWith(r);
  if (r.endsWith("/*")) return file.type.toLowerCase().startsWith(r.slice(0, -1));
  return file.type.toLowerCase() === r;
}

export type FileRejection = { file: File; reason: string };

/* ------------------------------------------------------------------ FileDrop */

export type FileDropProps = {
  /** What the files are for, as the area's name: "Project files". Screen readers hear it with the button. */
  label: string;
  /** The types it takes, as a file input's accept: [".pdf", "image/*"]. Leave it out to take any file. */
  accept?: string[];
  /** The largest file it takes, in bytes. */
  maxSize?: number;
  /** Takes several files at once. Default true. */
  multiple?: boolean;
  /** Runs with the files that passed the checks, in the order they came. */
  onFiles: (files: File[]) => void;
  /** Runs with the files that were turned away and why. The area also says it under itself. */
  onReject?: (rejected: FileRejection[]) => void;
  /** The line under "Drop files here": the types and the limit, "PDF or images, up to 10 MB". */
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
};

/** An area to drop files on or choose them from. It checks type and size, says what it turned away, and hands over the rest. */
export function FileDrop({ label, accept, maxSize, multiple = true, onFiles, onReject, hint, disabled = false, className = "" }: FileDropProps) {
  const { coarse } = useDevice();
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [over, setOver] = useState(0); // how many dragged items are over the area: enter and leave fire for children too
  const [turnedAway, setTurnedAway] = useState<FileRejection[]>([]);

  const take = (list: FileList | null) => {
    if (!list || disabled) return;
    const files = [...list].slice(0, multiple ? undefined : 1);
    const ok: File[] = [];
    const no: FileRejection[] = [];
    for (const file of files) {
      if (accept?.length && !accept.some((r) => matches(file, r))) no.push({ file, reason: `${file.name} is not a type this takes.` });
      else if (maxSize !== undefined && file.size > maxSize) no.push({ file, reason: `${file.name} is ${formatSize(file.size)}, over the ${formatSize(maxSize)} limit.` });
      else ok.push(file);
    }
    setTurnedAway(no);
    if (no.length) onReject?.(no);
    if (ok.length) onFiles(ok);
  };

  const dragging = over > 0 && !disabled;
  const drag = (e: DragEvent<HTMLDivElement>, step: number) => {
    if (disabled || !e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    setOver((n) => Math.max(0, n + step));
  };

  const area: ComponentProps<"div"> = {
    role: "group",
    "aria-label": label,
    onDragEnter: (e) => drag(e, 1),
    onDragLeave: (e) => drag(e, -1),
    onDragOver: (e) => {
      if (disabled || !e.dataTransfer.types.includes("Files")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDrop: (e) => {
      if (disabled) return;
      e.preventDefault();
      setOver(0);
      take(e.dataTransfer.files);
    },
    /* A click anywhere chooses files too; the button is the keyboard's way in, so the area is no tab stop. */
    onClick: (e) => {
      if (!disabled && !(e.target as Element).closest("button")) input.current?.click();
    },
  };
  const Body = byWorld(useMaterial(), { press: PressBody, flat: FileDropFlatBody, device: FileDropDeviceBody });

  return (
    <div className={"grid gap-3 " + className}>
      <Body
        area={area}
        words={dragging ? (multiple ? "Drop to add these files" : "Drop to add this file") : coarse ? "Add files" : "Drop files here"}
        hint={hint}
        hintId={hintId}
        dragging={dragging}
        disabled={disabled}
        chooseLabel={multiple ? "Choose files" : "Choose a file"}
        onChoose={() => input.current?.click()}
        picker={
          <input
            ref={input}
            type="file"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            multiple={multiple}
            accept={accept?.join(",")}
            disabled={disabled}
            onChange={(e) => {
              take(e.target.files);
              e.target.value = ""; // so choosing the same file again still counts
            }}
          />
        }
      />
      {/* What was turned away, and why. An alert, because it answers what the person just did. */}
      <div role="alert" className="grid gap-1 empty:hidden">
        {turnedAway.map((r) => (
          <p key={r.file.name + r.file.size} className="text-small text-danger">
            {r.reason}
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * What the contract hands the area's body: the drag, the picker and the words, resolved once. A body draws the group
 * (`area`: its role, name, drag and drop handlers and the click that chooses, kept whole, plus its own className and
 * data-body), the words, the hint, a Choose button that calls onChoose and is described by the hint, and the hidden
 * `picker` input, which it renders anywhere inside the group. It says dragging and disabled without color alone: the
 * words change, and a disabled area has no tab stop.
 */
export type FileDropBodyProps = {
  area: ComponentProps<"div">;
  /** "Drop files here", "Drop to add these files" while dragging, or "Add files" on a touch screen. */
  words: string;
  hint?: ReactNode;
  /** The hint's id, which the Choose button names with aria-describedby. */
  hintId: string;
  dragging: boolean;
  disabled: boolean;
  /** "Choose files", or "Choose a file" when it takes one. */
  chooseLabel: string;
  onChoose: () => void;
  /** The hidden file input. */
  picker: ReactNode;
};

/** Press, the default body: a cut in the plate, the Input's, at the surface radius. */
function PressBody({ area, words, hint, hintId, dragging, disabled, chooseLabel, onChoose, picker }: FileDropBodyProps) {
  return (
    <div
      {...area}
      data-body="press"
      className={
        "flex flex-wrap items-center gap-4 rounded-surface p-4 transition-[box-shadow] duration-(--dur-instant) ease-litt forced-colors:border sm:flex-nowrap sm:p-6 " +
        (disabled
          ? "cursor-not-allowed bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)] in-[[data-material=flat]]:shadow-none"
          : dragging
            ? "bg-cut shadow-[inset_0_0_0_1px_var(--focus),var(--cut-shade)] in-[[data-material=flat]]:bg-[color-mix(in_oklab,var(--surface-3),var(--fg)_6%)] in-[[data-material=flat]]:shadow-none forced-colors:in-[[data-material=flat]]:outline-2 forced-colors:in-[[data-material=flat]]:outline-solid forced-colors:in-[[data-material=flat]]:outline-[Highlight]"
            : "cursor-pointer bg-cut shadow-[inset_0_0_0_1px_var(--line-control),var(--cut-shade)] in-[[data-material=flat]]:shadow-none")
      }
    >
      <span
        aria-hidden="true"
        className={
          "grid size-8 shrink-0 place-items-center rounded-control in-[[data-material=flat]]:rounded-pill in-[[data-material=flat]]:shadow-none " +
          (disabled ? "bg-surface-2 text-fg-disabled shadow-[inset_0_0_0_1px_var(--line)]" : "bg-surface-1 text-fg shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]")
        }
      >
        <ArrowUpIcon />
      </span>
      <div className="grid min-w-0 flex-1 gap-1">
        <p className={"text-body font-title " + (disabled ? "text-fg-subtle" : "text-fg")}>{words}</p>
        {hint && (
          <p id={hintId} className="text-small text-fg-subtle">
            {hint}
          </p>
        )}
      </div>
      <Button size="sm" variant="secondary" className="in-[[data-material=flat]]:enabled:bg-surface-1" disabled={disabled} aria-describedby={hint ? hintId : undefined} onClick={onChoose}>
        {chooseLabel}
      </Button>
      {picker}
    </div>
  );
}

/* ------------------------------------------------------------------ FileList and FileRow */

/** The files that were added, one row each. Name it, so a screen reader knows whose files these are. */
export function FileList({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  const device = useMaterial() === "device";
  return (
    <ul aria-label={label} className={"grid " + (device ? "gap-2 " : "") + className}>
      {children}
    </ul>
  );
}

export type FileRowProps = {
  name: string;
  /** In bytes. */
  size?: number;
  /** How far the upload is, 0 to 100. Leave it out once the file is in. */
  progress?: number;
  /** Why the upload failed. Shown in --danger under the name, with Retry. */
  error?: ReactNode;
  onRetry?: () => void;
  onRemove?: () => void;
};

/** What the contract hands a row's body: the row's props and whether it is uploading (a rail shows, and Remove says Cancel). */
export type FileRowBodyProps = FileRowProps & { uploading: boolean };

/** One file in a FileList: its name and size, a Progress rail while it uploads, why it failed, Retry and Remove. */
export function FileRow(props: FileRowProps) {
  const uploading = props.progress !== undefined && props.progress < 100 && !props.error;
  const Body = byWorld(useMaterial(), { press: PressRowBody, flat: FileRowFlatBody, device: FileRowDeviceBody });
  return <Body {...props} uploading={uploading} />;
}

/** Press, the default row: a line between rows, the name and size above a Progress rail. */
function PressRowBody({ name, size, progress, error, uploading, onRetry, onRemove }: FileRowBodyProps) {
  return (
    <li data-body="press" className="flex items-start gap-3 border-t border-line py-3 first:border-t-0 in-[[data-material=flat]]:border-t-0">
      <FileIcon className="mt-0.5 shrink-0 text-fg-muted" />
      <div className="grid min-w-0 flex-1 gap-2">
        <p className="flex items-baseline justify-between gap-4">
          <span className="min-w-0 truncate text-caption font-normal text-fg">{name}</span>
          {size !== undefined && <span className="shrink-0 text-caption tabular-nums font-normal text-fg-subtle">{formatSize(size)}</span>}
        </p>
        {(uploading || error) && (
          <Progress
            label={`Uploading ${name}`}
            hideLabel
            value={progress ?? 0}
            status={error ? "failed" : "active"}
            message={error}
          />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {error && onRetry && (
          <Button size="sm" variant="ghost" iconOnly aria-label={`Retry ${name}`} onClick={onRetry}>
            <RetryIcon />
          </Button>
        )}
        {onRemove && (
          <Button size="sm" variant="ghost" iconOnly aria-label={uploading ? `Cancel ${name}` : `Remove ${name}`} onClick={onRemove}>
            <XIcon />
          </Button>
        )}
      </div>
    </li>
  );
}
