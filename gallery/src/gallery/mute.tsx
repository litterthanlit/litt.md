/**
 * The mute (plans/021, phase 1): gallery chrome, a key in each Device page's top row. Device starts with sound on
 * (Nick, 2026-11-16: "start with sound for device"); a viewer who mutes it is remembered per viewer under
 * `litt-gallery:sound` ("off", or "on"), and every tab follows. The pages under it read it through SoundProvider
 * (motion/sound.ts), so a component never knows where the mute lives.
 *
 * - The key is a toggle button named Mute, aria-pressed while muted; its glyph is a speaker, crossed out while muted.
 * - M toggles it too, as on the components repo's recorder, but only where M is not a page's own key: never with a
 *   modifier, never in a field, and never inside a widget that reads letters (a menu's or a list's typeahead, a grid,
 *   a slider, an open dialog), and never once a page has handled the key itself.
 * - The recorder body (#device, the player) gets its own mute key later; this row is not drawn there.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/button";

const KEY = "litt-gallery:sound";
const listeners = new Set<() => void>();
/** The mute where storage is blocked (a private window), for this page only. */
let memory: boolean | null = null;

const read = (): boolean => {
  try {
    return localStorage.getItem(KEY) === "off";
  } catch {
    return false;
  }
};

const subscribe = (change: () => void) => {
  listeners.add(change);
  const storage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) change();
  };
  window.addEventListener("storage", storage);
  return () => {
    listeners.delete(change);
    window.removeEventListener("storage", storage);
  };
};

function write(muted: boolean) {
  try {
    localStorage.setItem(KEY, muted ? "off" : "on");
  } catch {
    /* private mode: the mute holds for this page only */
    memory = muted;
  }
  for (const l of [...listeners]) l();
}

/** Whether the viewer has muted Device, and a way to change it. Sound is on until they do. */
export function useMuted(): [boolean, (muted: boolean) => void] {
  const stored = useSyncExternalStore(subscribe, read, () => false);
  return [memory ?? stored, write];
}

/** Where a press of M belongs to the page, not the mute. */
const OWN_KEYS =
  "input, textarea, select, [contenteditable]:not([contenteditable=false]), [role=menu], [role=menubar], [role=listbox], [role=tree], " +
  "[role=treegrid], [role=grid], [role=radiogroup], [role=tablist], [role=slider], [role=spinbutton], [role=combobox], [role=application], " +
  "[role=dialog], [role=alertdialog]";

/** M toggles the mute, where it is no page's own key. */
export function useMuteKey(muted: boolean, setMuted: (muted: boolean) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey || (e.key !== "m" && e.key !== "M")) return;
      if (e.target instanceof Element && e.target.closest(OWN_KEYS)) return;
      if (document.querySelector("[role=dialog], [role=alertdialog]")) return;
      e.preventDefault();
      setMuted(!muted);
    };
    /* Bubble phase, after the page's own handlers, so one that takes M has already said so (defaultPrevented). */
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, muted, setMuted]);
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 6v4h2.5l3.5 3V3L5 6z" />
      {muted ? <path d="M11 6l3.5 4M14.5 6L11 10" /> : <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.75 3.75a6 6 0 0 1 0 8.5" />}
    </svg>
  );
}

/** The key in a Device page's top row. */
export function MuteKey({ muted, setMuted }: { muted: boolean; setMuted: (muted: boolean) => void }) {
  const toggle = useCallback(() => setMuted(!muted), [muted, setMuted]);
  return (
    <Button size="sm" variant="ghost" data-silent="" aria-pressed={muted} aria-keyshortcuts="M" title="Mute (M)" icon={<SpeakerIcon muted={muted} />} onClick={toggle}>
      Mute
    </Button>
  );
}
