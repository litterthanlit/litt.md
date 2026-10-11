/**
 * Command menu: ⌘K search over pages, projects and actions.
 *
 * - Overlay, focus trap and Esc come from @radix-ui/react-dialog. The panel is
 *   floating glass with the modal shadow, rounded-surface, max width 560, 15vh
 *   from the top. Rows and their highlight are rounded-control inside a 4px
 *   list inset, so the corners stay concentric.
 * - The list is the combobox + listbox pattern: DOM focus stays in the input
 *   and aria-activedescendant names the highlighted option. Rows never take
 *   focus (mousedown is prevented), so the caret never leaves the field.
 * - The first enabled row is always highlighted. Arrows move and wrap, skipping
 *   disabled rows. Enter fires only on the highlighted row. Escape clears a
 *   non-empty query first and closes when it is empty. Every handler returns
 *   early while an IME is composing. Pointer leave keeps the highlight.
 * - Filtering keeps the original order and shows a designed empty state.
 * - Motion, responsive tier: the panel fades, drops half the travel and scales
 *   0.98 to 1; the overlay fades on opacity only; exits use useExit. Typing
 *   changes the list instantly and the panel's height is never animated: the
 *   list has a max height and scrolls inside. The gliding highlight is glide.tsx.
 * - The panel body (CommandPanel) renders without the dialog too, for a static preview.
 */
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";
import { SearchIcon } from "./icons";
import { GLIDE_ROW, useGlide, type GlideSource } from "./glide";

export type CommandItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Mono hint on the right, for example ⌘N. */
  shortcut?: string;
  disabled?: boolean;
};
export type CommandGroup = { id: string; heading: string; items: CommandItem[] };

type Section = { id: string; heading: string; rows: (CommandItem & { index: number })[] };

/** Keeps the original order. Matches the label, ignoring case. */
function filter(groups: CommandGroup[], query: string) {
  const q = query.trim().toLowerCase();
  const flat: CommandItem[] = [];
  const sections: Section[] = [];
  for (const g of groups) {
    const rows: Section["rows"] = [];
    for (const item of g.items) {
      if (q && !item.label.toLowerCase().includes(q)) continue;
      rows.push({ ...item, index: flat.length });
      flat.push(item);
    }
    if (rows.length) sections.push({ id: g.id, heading: g.heading, rows });
  }
  return { sections, flat };
}

const firstEnabled = (items: CommandItem[]) => items.findIndex((i) => !i.disabled);

/** A key cap: mono, rounded-control, a faint fill. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded-control bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] px-1 font-mono text-caption text-fg-muted">
      {children}
    </kbd>
  );
}

function Hint({ keys, children }: { keys: string; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Kbd>{keys}</Kbd>
      <span className="truncate">{children}</span>
    </span>
  );
}

/* ----------------------------------------------------------------- panel */

export type CommandPanelProps = {
  groups: CommandGroup[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (item: CommandItem) => void;
  /** How the panel came up. A keyboard open shows the ring on the first row at once. */
  initialSource?: GlideSource;
  autoFocus?: boolean;
};

/** Input, list and footer. The caller supplies the surface around it. */
export function CommandPanel({ groups, query, onQueryChange, onSelect, initialSource = "keyboard", autoFocus }: CommandPanelProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const { sections, flat } = useMemo(() => filter(groups, query), [groups, query]);

  /* The highlighted row. Null means "the first enabled row", which is where every
     new query starts (adjusted during render, so there is no stale frame). */
  const [pick, setPick] = useState<number | null>(null);
  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setPick(null);
  }
  const [source, setSource] = useState<GlideSource>(initialSource);
  const picked = pick !== null && flat[pick] && !flat[pick].disabled ? pick : -1;
  const current = picked >= 0 ? picked : firstEnabled(flat);
  const active = current >= 0 ? flat[current] : undefined;

  const glide = useGlide({
    scroll: true,
    keepOnLeave: true,
    onPointerRow: (index, _row, type) => {
      setPick(index);
      setSource(type === "touch" ? "touch" : "pointer");
    },
  });

  /* The glide follows the state. A list change snaps; a move glides. */
  const { setActive } = glide;
  const prevFlat = useRef(flat);
  useLayoutEffect(() => {
    const changed = prevFlat.current !== flat;
    prevFlat.current = flat;
    setActive(current >= 0 ? current : null, source, { jump: changed });
  }, [current, source, flat, setActive]);

  const move = (dir: 1 | -1) => {
    const enabled = flat.flatMap((it, i) => (it.disabled ? [] : [i]));
    if (!enabled.length) return;
    const at = enabled.indexOf(current);
    const next = at < 0 ? enabled[dir === 1 ? 0 : enabled.length - 1] : enabled[(at + dir + enabled.length) % enabled.length];
    setPick(next);
    setSource("keyboard");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active && !active.disabled) onSelect(active);
    } else if (e.key === "Escape" && query) {
      e.preventDefault();
      e.stopPropagation();
      onQueryChange("");
    }
  };

  const optionId = (item: CommandItem) => `${uid}-opt-${item.id}`;

  return (
    <>
      <div className="flex h-13 items-center gap-3 border-b border-[var(--glass-border)] px-4">
        <SearchIcon className="shrink-0 text-fg-subtle" />
        <input
          role="combobox"
          aria-label="Search pages, projects and actions"
          aria-expanded={flat.length > 0}
          aria-controls={flat.length > 0 ? listId : undefined}
          aria-activedescendant={active ? optionId(active) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={query}
          placeholder="Search pages, projects and actions"
          onChange={(e) => {
            onQueryChange(e.target.value);
            setSource("keyboard");
          }}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-subtle pointer-coarse:text-(length:--control-text-lg)"
        />
      </div>

      {flat.length > 0 ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Results"
          ref={glide.ref}
          {...glide.props}
          onMouseDown={(e) => e.preventDefault()}
          className="relative max-h-[min(55vh,22rem)] overflow-y-auto overscroll-contain p-1"
        >
          {glide.highlight}
          {sections.map((s) => (
            <div key={s.id} role="group" aria-labelledby={`${uid}-g-${s.id}`}>
              <div id={`${uid}-g-${s.id}`} className="flex h-control-sm items-center px-3 text-caption text-fg-subtle">
                {s.heading}
              </div>
              {s.rows.map((r) => (
                <div
                  key={r.id}
                  id={optionId(r)}
                  role="option"
                  aria-selected={r.index === current}
                  aria-disabled={r.disabled || undefined}
                  data-active={r.index === current || undefined}
                  {...GLIDE_ROW}
                  onClick={() => !r.disabled && onSelect(r)}
                  className="relative flex h-control-md scroll-mt-8 scroll-mb-1 cursor-pointer items-center gap-3 rounded-control px-3 text-small text-fg-muted transition-colors duration-(--dur-instant) ease-litt data-[active]:text-fg aria-disabled:cursor-not-allowed aria-disabled:text-fg-disabled"
                >
                  {r.icon !== undefined && <span className="grid size-4 shrink-0 place-items-center">{r.icon}</span>}
                  <span className="min-w-0 truncate">{r.label}</span>
                  {r.shortcut && <span className="ml-auto shrink-0 pl-4 font-mono text-caption text-fg-subtle">{r.shortcut}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div role="status" className="grid justify-items-center gap-2 px-6 py-12 text-center">
          <SearchIcon className="text-fg-subtle" />
          <p className="max-w-full break-words text-small text-fg">No results for “{query.trim()}”</p>
          <p className="text-caption text-fg-subtle">Check the spelling, or try a project name.</p>
        </div>
      )}

      {/* A container query, not a viewport one: the same panel is 358 wide in the dialog and 295 in a card.
          Under 24rem the arrow hint goes first, since the Enter hint says what will happen. */}
      <div className="@container border-t border-[var(--glass-border)]">
        <div className="flex h-10 items-center gap-4 px-4 text-caption text-fg-subtle">
          <span className="flex @max-sm:hidden">
            <Hint keys="↑↓">to move</Hint>
          </span>
          {active && <Hint keys="↵">to open {active.label}</Hint>}
          <span className="ml-auto flex shrink-0">
            <Hint keys="esc">to close</Hint>
          </span>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- dialog */

export type CommandMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
  /** Runs after the menu closes itself. */
  onSelect: (item: CommandItem) => void;
  /** Keyboard (the shortcut, Enter on the trigger) or pointer. Decides whether the first row shows the ring at once. */
  openedBy?: "keyboard" | "pointer";
};

export function CommandMenu({ open, onOpenChange, groups, onSelect, openedBy = "keyboard" }: CommandMenuProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && <Body key="body" groups={groups} onSelect={onSelect} onClose={() => onOpenChange(false)} openedBy={openedBy} />}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/* Mounted once per open, so the query starts empty and survives the exit animation. */
function Body({
  groups,
  onSelect,
  onClose,
  openedBy,
}: {
  groups: CommandGroup[];
  onSelect: (item: CommandItem) => void;
  onClose: () => void;
  openedBy: "keyboard" | "pointer";
}) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  const [query, setQuery] = useState("");
  /* There is no Dialog.Trigger (the page owns the button and the shortcut), so give focus back ourselves. */
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  return (
    <Dialog.Portal forceMount>
      <Dialog.Overlay asChild>
        <motion.div
          className="fixed inset-0 z-50 bg-[color-mix(in_oklab,var(--canvas)_55%,transparent)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: enter }}
          exit={{ opacity: 0, transition: exit }}
        />
      </Dialog.Overlay>
      <div className="pointer-events-none fixed inset-x-0 top-[15vh] z-50 flex justify-center px-4">
        <Dialog.Content
          asChild
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            opener?.focus?.({ preventScroll: true });
          }}
          onEscapeKeyDown={(e) => {
            /* Composing an IME word: Esc cancels the composition, not the menu. */
            if (e.isComposing) return e.preventDefault();
            /* A non-empty query clears first; the menu closes on the next Esc. */
            if (query) {
              e.preventDefault();
              setQuery("");
            }
          }}
        >
          <motion.div
            className="litt-glass pointer-events-auto w-full max-w-140 origin-top rounded-surface outline-none [--glass-shadow:var(--shadow-modal)]"
            initial={{ opacity: 0, y: -travel / 2, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: enter }}
            exit={{ opacity: 0, scale: 0.98, transition: exit }}
          >
            <Dialog.Title className="sr-only">Command menu</Dialog.Title>
            <CommandPanel
              groups={groups}
              query={query}
              onQueryChange={setQuery}
              initialSource={openedBy}
              onSelect={(item) => {
                onSelect(item);
                onClose();
              }}
            />
          </motion.div>
        </Dialog.Content>
      </div>
    </Dialog.Portal>
  );
}

/** ⌘K or Ctrl+K. Call it from the page that owns the menu: the listener lives only while that page is mounted. */
export function useCommandShortcut(toggle: () => void) {
  const latest = useRef(toggle);
  latest.current = toggle;
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.isComposing) return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        latest.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
