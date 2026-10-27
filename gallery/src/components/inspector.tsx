/**
 * Inspector: a floating panel for tuning one thing live, built from litt's own controls. Groups that fold, versions
 * you save and go back to, a check against your rules, and the result copied as tokens.
 *
 * - Surface: floating glass (R3, litt-glass) at --radius-surface, 320px wide and never wider than its container. The
 *   caller places it: beside the thing it tunes, or fixed in a corner. If the caller caps its height, the body
 *   scrolls inside it and the header stays.
 * - Header: a 44px row with the sliders icon, the title at the small size and --weight-title, Reset (a ghost sm
 *   button, only while the value differs from defaultValue) and an icon-only ghost button that folds the panel to its
 *   header. Its chevron turns half a turn on the responsive tier; the body snaps, never animating its height, and
 *   fades in on the responsive tier.
 * - Versions: a Select (sm) of the presets and the versions you saved, with Save beside it (a secondary sm button).
 *   Save keeps the current value as "Version 1", "Version 2" and so on; picking one puts its value back. While the
 *   value matches none of them, the Select says "Unsaved changes". A saved version that is picked can be deleted with
 *   the trash button. With storageKey, saved versions live in localStorage under it; up to twelve, the oldest goes
 *   first. A polite status says "Saved as Version 3".
 * - Groups: InspectorGroup is one fold: a full-width row (32px, 44px on a coarse pointer) with the title at the small
 *   size and --weight-title, an optional summary in --fg-subtle and a chevron, over its controls. Groups are split by
 *   --line hairlines, as the Accordion's rows are. Put any litt control inside: Slider, Switch, Segmented, Select,
 *   Pad, Spring editor, Curve editor.
 * - Rules: pass checks and a Rules group lists one row per rule, each with a Fits or Change tag (success and warning
 *   words, never fills), as the Playground's rows do. Its summary says "All fit" or "2 to change".
 * - Tokens: pass tokens and the footer has Copy tokens (a secondary sm button that says Copied for two seconds), with
 *   a Tokens group that shows them in mono, since they are code. Where the clipboard is refused, the text is selected
 *   instead, so a copy shortcut finishes the job.
 * - No accent fill (R6): the inspector is chrome around the page's one main action, never the action itself.
 * - A Select inside it opens solid (--surface-2), never glass on glass.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useTransition } from "@/motion";
import { Button } from "@/components/button";
import { CheckIcon, ChevronDownIcon, CopyIcon, SlidersIcon, TrashIcon } from "@/components/icons";
import { Select } from "@/components/select";
import { Tag } from "@/components/tag";

/** One saved value with its name, such as a preset or a version you kept. */
export type InspectorVersion<T> = {
  /** What the version list shows, such as "Calm" or "Version 2". */
  label: string;
  /** The value it puts back. */
  value: T;
};

/** One rule the value is checked against. */
export type InspectorCheck = {
  /** True when the value fits the rule. */
  ok: boolean;
  /** The rule and the value in words, such as "Bounce at most 0.12: 0.2". */
  text: string;
};

export type InspectorProps<T> = {
  /** What is being tuned, such as "Toast". It names the panel for screen readers. */
  title: ReactNode;
  /** Every value the panel tunes, as one object. Versions save it and put it back. */
  value: T;
  /** Called with a whole value when a version, a preset or Reset puts one back. The controls inside call their own handlers. */
  onValueChange: (value: T) => void;
  /** The value Reset goes back to. Without it there is no Reset. */
  defaultValue?: T;
  /** Named starting points, listed before the saved versions. */
  presets?: InspectorVersion<T>[];
  /** Keeps saved versions in localStorage under this key. Use one key per shape of value, and change it when the shape changes. Without it, versions last as long as the page. */
  storageKey?: string;
  /** Checks the value against your rules. Each row says Fits or Change, in a Rules group. */
  checks?: (value: T) => InspectorCheck[];
  /** Writes the value as tokens to paste, such as CSS custom properties. Adds Copy tokens and a Tokens group. */
  tokens?: (value: T) => string;
  /** Whether the panel is open, when you control it. Pair it with onOpenChange. */
  open?: boolean;
  /** Whether it starts open when you do not control it. Open by default. */
  defaultOpen?: boolean;
  /** Called with the new state when the panel folds or opens. */
  onOpenChange?: (open: boolean) => void;
  /** The groups, each an InspectorGroup. */
  children: ReactNode;
  /** Extra classes for the panel, such as where it sits or a max height. */
  className?: string;
};

export type InspectorGroupProps = {
  /** The group's name, such as "Shape" or "Motion". */
  title: ReactNode;
  /** A few words at the end of the group's row, such as the value it holds. They stay visible while it is folded. */
  summary?: ReactNode;
  /** Whether it starts open. Open by default. */
  defaultOpen?: boolean;
  /** The controls. */
  children: ReactNode;
};

const MAX_SAVED = 12;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function readSaved<T>(key?: string): InspectorVersion<T>[] {
  if (!key || typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(raw) ? raw.filter((v) => v && typeof v.label === "string" && "value" in v) : [];
  } catch {
    return [];
  }
}

/** A chevron that turns half a turn when open, on the responsive tier. */
function Chevron({ open }: { open: boolean }) {
  const turn = useTransition("responsive");
  return (
    <motion.span aria-hidden="true" className="inline-flex text-fg-subtle" initial={false} animate={{ rotate: open ? 180 : 0 }} transition={turn}>
      <ChevronDownIcon />
    </motion.span>
  );
}

/** The body of a fold: it snaps in, then fades on the responsive tier. Its height never animates. */
function Fold({ id, labelledBy, className, children }: { id: string; labelledBy: string; className: string; children: ReactNode }) {
  const enter = useTransition("responsive");
  return (
    <motion.div id={id} role="group" aria-labelledby={labelledBy} className={className} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: enter }}>
      {children}
    </motion.div>
  );
}

const row =
  "flex w-full cursor-pointer items-center gap-2 px-3 text-left text-small font-title text-fg h-control-sm pointer-coarse:h-control-md " +
  "transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/** One fold of the inspector: a row that opens and closes, over the controls it holds. */
export function InspectorGroup({ title, summary, defaultOpen = true, children }: InspectorGroupProps) {
  const id = useId().replace(/[^\w-]/g, "");
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-line">
      <button type="button" id={`${id}-row`} aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen((o) => !o)} className={row}>
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {summary !== undefined && <span className="shrink-0 text-caption font-normal tabular-nums text-fg-subtle">{summary}</span>}
        <Chevron open={open} />
      </button>
      {open && (
        <Fold id={`${id}-body`} labelledBy={`${id}-row`} className="grid gap-5 px-3 pt-2 pb-4">
          {children}
        </Fold>
      )}
    </div>
  );
}

/** A floating panel of litt controls for tuning one thing live: folding groups, saved versions, a rules check and Copy tokens. */
export function Inspector<T>({
  title,
  value,
  onValueChange,
  defaultValue,
  presets = [],
  storageKey,
  checks,
  tokens,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  children,
  className = "",
}: InspectorProps<T>) {
  const id = useId().replace(/[^\w-]/g, "");
  const titleId = `${id}-title`;
  const bodyId = `${id}-body`;
  const tokensId = `${id}-tokens`;

  const [openInner, setOpenInner] = useState(defaultOpen);
  const open = openProp ?? openInner;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenInner(next);
    onOpenChange?.(next);
  };

  /* Saved versions are read after mount, so the server and the first paint agree. */
  const [saved, setSaved] = useState<InspectorVersion<T>[]>([]);
  const loaded = useRef(false);
  useEffect(() => {
    setSaved(readSaved<T>(storageKey));
    loaded.current = true;
  }, [storageKey]);
  useEffect(() => {
    if (!loaded.current || !storageKey) return;
    try {
      if (saved.length) localStorage.setItem(storageKey, JSON.stringify(saved));
      else localStorage.removeItem(storageKey);
    } catch {
      /* storage can be full or refused; the versions still last the visit */
    }
  }, [saved, storageKey]);

  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const options = [
    ...presets.map((p, i) => ({ value: `preset-${i}`, label: p.label, item: p })),
    ...saved.map((s, i) => ({ value: `saved-${i}`, label: s.label, item: s })),
  ];
  const current = options.find((o) => same(o.item.value, value));
  const pickedSaved = current?.value.startsWith("saved-") ? Number(current.value.slice(6)) : -1;
  const differs = defaultValue !== undefined && !same(value, defaultValue);

  const save = () => {
    const taken = new Set(saved.map((s) => s.label));
    let n = saved.length + 1;
    while (taken.has(`Version ${n}`)) n++;
    const label = `Version ${n}`;
    setSaved((list) => [...list, { label, value: structuredClone(value) }].slice(-MAX_SAVED));
    setStatus(`Saved as ${label}.`);
  };
  const remove = (i: number) => {
    const label = saved[i]?.label;
    setSaved((list) => list.filter((_, j) => j !== i));
    if (label) setStatus(`Deleted ${label}.`);
  };

  const rows = checks ? checks(value) : [];
  const toChange = rows.filter((r) => !r.ok).length;
  const text = tokens ? tokens(value) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setStatus("Copied the tokens.");
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      const pre = document.getElementById(tokensId);
      if (pre) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        setStatus("The clipboard is not available here, so the tokens are selected. Copy them with your shortcut.");
      } else {
        setStatus("The clipboard is not available here. Open Tokens to copy them by hand.");
      }
    }
  };

  return (
    <section aria-labelledby={titleId} className={"litt-glass flex w-full max-w-80 min-h-0 flex-col overflow-hidden rounded-surface " + className}>
      <div className="flex h-control-md shrink-0 items-center gap-2 pr-1 pl-3">
        <SlidersIcon aria-hidden="true" className="shrink-0 text-fg-subtle" />
        <span id={titleId} className="min-w-0 flex-1 truncate text-small font-title text-fg">
          {title}
        </span>
        {differs && open && (
          <Button size="sm" variant="ghost" onClick={() => onValueChange(structuredClone(defaultValue as T))}>
            Reset
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          aria-label={open ? `Fold ${typeof title === "string" ? title : "the panel"}` : `Open ${typeof title === "string" ? title : "the panel"}`}
          aria-expanded={open}
          aria-controls={bodyId}
          icon={<Chevron open={open} />}
          onClick={() => setOpen(!open)}
        />
      </div>

      {open && (
        <Fold id={bodyId} labelledBy={titleId} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex items-center gap-2 border-t border-line px-3 py-3">
            <div className="min-w-0 flex-1">
              <Select
                size="sm"
                aria-label="Version"
                options={options.map(({ value: v, label }) => ({ value: v, label }))}
                value={current?.value ?? ""}
                placeholder="Unsaved changes"
                onValueChange={(v) => {
                  const hit = options.find((o) => o.value === v);
                  if (hit) onValueChange(structuredClone(hit.item.value));
                }}
                disabled={options.length === 0}
              />
            </div>
            {pickedSaved >= 0 && (
              <Button size="sm" variant="ghost" iconOnly aria-label={`Delete ${saved[pickedSaved]?.label}`} icon={<TrashIcon />} onClick={() => remove(pickedSaved)} />
            )}
            <Button size="sm" onClick={save} disabled={current !== undefined}>
              Save
            </Button>
          </div>

          {children}

          {rows.length > 0 && (
            <InspectorGroup title="Rules" summary={toChange ? `${toChange} to change` : "All fit"}>
              <ul className="grid gap-2">
                {rows.map((r) => (
                  <li key={r.text} className="flex items-start gap-2 text-small">
                    <Tag status={r.ok ? "success" : "warning"}>{r.ok ? "Fits" : "Change"}</Tag>
                    <span className={"pt-0.5 " + (r.ok ? "text-fg-subtle" : "text-fg-muted")}>{r.text}</span>
                  </li>
                ))}
              </ul>
            </InspectorGroup>
          )}

          {tokens && (
            <InspectorGroup title="Tokens" defaultOpen={false}>
              <pre
                id={tokensId}
                tabIndex={0}
                aria-label="Tokens to paste"
                className="max-h-64 overflow-auto rounded-control bg-surface-2 p-3 font-mono text-caption font-normal whitespace-pre text-fg-muted shadow-[inset_0_0_0_1px_var(--line)]"
              >
                {text}
              </pre>
            </InspectorGroup>
          )}

          {tokens && (
            <div className="border-t border-line p-3">
              <Button size="sm" block icon={copied ? <CheckIcon /> : <CopyIcon />} onClick={copy}>
                {copied ? "Copied" : "Copy tokens"}
              </Button>
            </div>
          )}
        </Fold>
      )}
      <p role="status" className="sr-only">
        {status}
      </p>
    </section>
  );
}
