/**
 * File drop: where someone adds files, by dropping them or choosing them, and where they watch them upload
 * (components.md, "File drop").
 *
 * - FileDrop is the area. This file is the contract; the look is a body per material (below).
 * - On a touch screen nothing is dragged in, so the words say "Add files" and the button does the work.
 * - Choosing: Choose files opens the file picker; so does a click anywhere on the area. Only the button is a tab stop.
 * - Checking: files whose type is not in accept or whose size is over maxSize are turned away, each with a sentence
 *   under the area that says which file and why. The rest go to onFiles. The sentences go when the next files come.
 * - FileList and FileRow show what was added: one row per file, its name, its size, and while it uploads a
 *   progress rail under the name. A failed file says why in --danger and offers Retry. Remove is a button named for
 *   its file, and says Cancel while the file uploads.
 * - Dragging is counted, because enter and leave fire for children too; the words say what a drop will do. A body shows
 *   it on the instant tier and under forced colors keeps an outline.
 * - Disabled lies flat: no drop and no tab stop. The words stay --fg-subtle, because they still say something (when
 *   it opens again), as a disabled Slide to confirm's do.
 * - One contract, three bodies (proposals/worlds.md, Bodies). This file is the contract: the props, the checking, the
 *   drag count, the picker and its hidden input, the alert, the list and the row's actions. It resolves them once into
 *   FileDropBodyProps and FileRowBodyProps and renders the body the material picks (byWorld).
 *   - PressBody and PressRowBody, below: a plate that stands (--block, --plate-lift) with a deep tray cut into it
 *     (--tray, --tray-shade) that holds a raised arrow block (--block, --block-lift), the words and Choose files. While
 *     files are over it the tray goes deeper (--slot, --slot-shade) and its lower wall catches the light. The list is
 *     a tray of slats: each file a raised block with its name, size and a Progress rail cut into it.
 *   - bodies/file-drop.flat.tsx: a grey sheet with one sentence, "Drop files or choose", ringed in ink while a file is
 *     over it. Each file is a line of words with Retry and Remove as words.
 *   - bodies/file-drop.device.tsx: a slot with an engraved legend over LCD glass and a Choose key; each file a line of
 *     glass whose upload lights segments in steps.
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
    <div className={"grid grid-cols-[minmax(0,1fr)] gap-3 " + className}>
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

/**
 * Press, the instrument: a plate that stands on the page (--block, --plate-lift) with a deep tray cut into it
 * (--tray, --tray-shade, 4px in, its corners the plate's less those 4px). In the tray stands the arrow on a raised
 * block (--block, --block-lift), then the words, and Choose files at the end. While files are over it the tray goes
 * deeper: its floor is the slot's (--slot, a step toward --fg) and its walls are the slot's (--slot-shade), whose lower wall catches
 * the light. The words change too, so it is never said by depth alone. Disabled lies flat: --surface-2 with the
 * hairline, and a tray that is only a --surface-3 floor.
 */
function PressBody({ area, words, hint, hintId, dragging, disabled, chooseLabel, onChoose, picker }: FileDropBodyProps) {
  return (
    <div
      {...area}
      data-body="press"
      className={
        "rounded-surface p-1 forced-colors:border " +
        (disabled ? "cursor-not-allowed bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]" : "cursor-pointer bg-block shadow-(--plate-lift)")
      }
    >
      <div
        className={
          "flex flex-wrap items-center gap-4 rounded-[calc(var(--radius-surface)-4px)] p-4 transition-[background-color,box-shadow] duration-(--dur-instant) ease-litt forced-colors:border sm:flex-nowrap sm:p-5 " +
          (disabled
            ? "bg-surface-3"
            : dragging
              ? "bg-[color-mix(in_oklab,var(--slot),var(--fg)_6%)] shadow-(--slot-shade) forced-colors:outline-2 forced-colors:outline-solid forced-colors:outline-[Highlight]"
              : "bg-tray shadow-(--tray-shade)")
        }
      >
        <span
          aria-hidden="true"
          className={
            "grid size-8 shrink-0 place-items-center rounded-control forced-colors:border " +
            (disabled ? "bg-surface-2 text-fg-disabled shadow-[inset_0_0_0_1px_var(--line)]" : "bg-block text-fg shadow-(--block-lift)")
          }
        >
          <ArrowUpIcon />
        </span>
        <div className="grid min-w-0 flex-1 basis-40 gap-1">
          <p className={"text-body font-title " + (disabled ? "text-fg-subtle" : "text-fg")}>{words}</p>
          {/* The hint is on the tray's floor, a step darker than the plate, so it takes the full ink to keep 4.5:1 there. */}
          {hint && (
            <p id={hintId} className={"text-small " + (disabled ? "text-fg-subtle" : "text-fg")}>
              {hint}
            </p>
          )}
        </div>
        <Button size="sm" variant="secondary" disabled={disabled} aria-describedby={hint ? hintId : undefined} onClick={onChoose}>
          {chooseLabel}
        </Button>
        {picker}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ FileList and FileRow */

/* Press: the list is a tray, and each file stands in it as a slat. Flat: rows parted by space. Device: lines of glass. */
const listLook = {
  press: "gap-1 rounded-surface bg-tray p-1 shadow-(--tray-shade) forced-colors:border ",
  flat: "gap-1 ",
  device: "gap-2 ",
};

/** The files that were added, one row each. Name it, so a screen reader knows whose files these are. */
export function FileList({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  const material = useMaterial();
  return (
    <ul aria-label={label} className={"grid grid-cols-[minmax(0,1fr)] " + byWorld(material, listLook) + className}>
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

/**
 * Press, a slat: a raised block (--block, --block-lift) standing in the list's tray, 4px in, its corners the tray's less
 * those 4px. Its name and size are on its face, a Progress rail is cut into it under them, and Retry and Remove are
 * ghost icon buttons at its end.
 */
function PressRowBody({ name, size, progress, error, uploading, onRetry, onRemove }: FileRowBodyProps) {
  return (
    <li
      data-body="press"
      className="flex items-center gap-3 rounded-[calc(var(--radius-surface)-4px)] bg-block py-3 pr-2 pl-4 shadow-(--block-lift) forced-colors:border"
    >
      <FileIcon className="shrink-0 text-fg-muted" />
      <div className="grid min-w-0 flex-1 gap-2">
        <p className="flex items-baseline justify-between gap-4">
          <span className="min-w-0 truncate text-caption font-normal text-fg">{name}</span>
          {size !== undefined && <span className="shrink-0 text-caption tabular-nums font-normal text-fg-subtle">{formatSize(size)}</span>}
        </p>
        {(uploading || error) && <Progress label={`Uploading ${name}`} hideLabel value={progress ?? 0} status={error ? "failed" : "active"} message={error} />}
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
