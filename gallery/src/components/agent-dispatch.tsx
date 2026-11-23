/**
 * AgentDispatch, a Device part (plans/024, Device; taste/litt-principles.md, Device): a four-channel hardware agent
 * monitor and transport console built from Device's aluminium plate, black bezel, smoked LCD glass, recessed wells,
 * 2px-skirt keys and hardware lamps.
 *
 * - Plate, well, part: every element carries its Device `data-part` kind (`plate`, `bezel`, `lcd`, `chip`, `well`,
 *   `key`, `light`, `lettering`). Radii nest strictly on litt's scale (`rounded-surface` 8px around 4px padding and
 *   `rounded-control` 4px inside).
 * - Colour rule: monochrome aluminium, black glass (`--lcd`) and light mono ink (`--field-ink`), plus Device's three
 *   signals only where they belong: red (`--signal`) in a `light` lamp for an active or faulted channel, orange
 *   (`--accent`) in a `light` lamp only while a channel waits for your OK, and Device's one screen blue (`--select`,
 *   `--select-ink`) on the selected row of glass. Zero data hues and zero orange fills, borders or text.
 * - Sound (plan 021): keys click (`key-down`, `key-up`) and channel switches tick (`notch`) through `useSound()`,
 *   only under Device and only in answer to a hand.
 * - No motion on load (R4): meters hold their deterministic levels until a hand switches, pauses, resumes or approves
 *   a channel. Every action announces once in a polite status region.
 */
import { useId, useState, type KeyboardEvent } from "react";
import { useSound } from "@/motion/sound";

export type ChannelStatus = "running" | "waiting" | "paused" | "fault";

export type AgentChannel = {
  /** Stable channel identifier. */
  id: string;
  /** Two-digit channel code, e.g. "01". */
  slot: string;
  /** Short agent role printed on the glass, e.g. "Planner", "Coder". */
  name: string;
  /** Current operational state of the channel. */
  status: ChannelStatus;
  /** One-line task description on the LCD footer. */
  task: string;
  /** Token burst level from 0 to 8 bars on the monochrome LCD meter. */
  level: number;
  /** Elapsed timecode printed in hardware frames at 25 fps, e.g. "00M 14S 08F". */
  timecode: string;
};

export type AgentDispatchProps = {
  /** Hardware plate legend printed in engraved capitals via CSS. Defaults to "Agent dispatch · 4 ch". */
  label?: string;
  /** Channels displayed in the LCD window and addressed by the hardware keys. */
  channels?: AgentChannel[];
  /** Controlled active channel id. */
  selectedId?: string;
  /** Initial active channel id when uncontrolled. Defaults to "ch2". */
  defaultSelectedId?: string;
  /** Called when the operator selects a channel. */
  onSelectChannel?: (id: string) => void;
  /** Called when the operator toggles hold/resume or approves a waiting channel. */
  onChannelStatusChange?: (id: string, status: ChannelStatus) => void;
  /** Extra classes on the outer plate. */
  className?: string;
};

export const DEFAULT_AGENT_CHANNELS: AgentChannel[] = [
  { id: "ch1", slot: "01", name: "Planner", status: "running", task: "Map route graph · 14 files", level: 5, timecode: "00M 42S 11F" },
  { id: "ch2", slot: "02", name: "Coder", status: "waiting", task: "Approve write: src/session.ts", level: 3, timecode: "00M 19S 04F" },
  { id: "ch3", slot: "03", name: "Verifier", status: "paused", task: "Hold before suite run", level: 1, timecode: "00M 08S 22F" },
  { id: "ch4", slot: "04", name: "Indexer", status: "fault", task: "Timeout on AST cache", level: 0, timecode: "00M 31S 17F" },
];

const BARS = 8;

const STATUS_META: Record<ChannelStatus, { word: string; chip: string; glyph: string }> = {
  running: { word: "Running", chip: "RUN", glyph: "●" },
  waiting: { word: "Waiting", chip: "WAIT", glyph: "○" },
  paused: { word: "Paused", chip: "HOLD", glyph: "‖" },
  fault: { word: "Fault", chip: "FAULT", glyph: "■" },
};

const deviceKeyBase =
  "litt-target relative flex h-control-sm min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-control px-2.5 text-caption font-title text-fg select-none " +
  "transition-[transform,box-shadow,background-color] duration-(--dur-instant) ease-litt " +
  "active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border";

const deviceKey = deviceKeyBase + " bg-block shadow-(--key-lift)";

/** Recessed hardware lamp: red for REC/Fault, orange only when waiting on your OK, else monochrome ink or off. */
function Lamp({ status }: { status: ChannelStatus }) {
  const fill =
    status === "waiting"
      ? "bg-accent"
      : status === "fault" || status === "running"
        ? "bg-signal"
        : "bg-lamp-off";
  return (
    <span
      aria-hidden="true"
      data-part="light"
      className={"inline-block size-2 shrink-0 rounded-pill shadow-(--lamp-recess) forced-colors:border " + fill}
    />
  );
}

/** Device's four-channel multi-agent hardware console: aluminium plate, LCD glass, channel keys and signal lamps. */
export function AgentDispatch({
  label = "Agent dispatch · 4 ch",
  channels: initialChannels = DEFAULT_AGENT_CHANNELS,
  selectedId: selectedProp,
  defaultSelectedId = "ch2",
  onSelectChannel,
  onChannelStatusChange,
  className = "",
}: AgentDispatchProps) {
  const titleId = useId();
  const { play } = useSound();
  const [channels, setChannels] = useState<AgentChannel[]>(initialChannels);
  const [innerId, setInnerId] = useState(defaultSelectedId);
  const [live, setLive] = useState("");

  const activeId = selectedProp ?? innerId;
  const active = channels.find((c) => c.id === activeId) ?? channels[0]!;
  const activeMeta = STATUS_META[active.status];
  const runningCount = channels.filter((c) => c.status === "running").length;
  const waitingCount = channels.filter((c) => c.status === "waiting").length;

  function selectChannel(ch: AgentChannel) {
    if (selectedProp === undefined) setInnerId(ch.id);
    onSelectChannel?.(ch.id);
    play("notch");
    setLive(`Channel ${ch.slot} ${ch.name} (${STATUS_META[ch.status].word}): ${ch.task}.`);
  }

  function updateStatus(id: string, nextStatus: ChannelStatus, nextLevel: number, nextTask?: string) {
    const ch = channels.find((c) => c.id === id);
    if (!ch) return;
    setChannels((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: nextStatus, level: nextLevel, task: nextTask ?? c.task } : c,
      ),
    );
    onChannelStatusChange?.(id, nextStatus);
    setLive(`Channel ${ch.slot} ${ch.name}: ${STATUS_META[nextStatus].word}.`);
  }

  function onChannelKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const at = channels.findIndex((c) => c.id === active.id);
    const n = channels.length;
    if (n === 0) return;
    const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
    const to = fwd ? (at + 1) % n : back ? (at - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const target = channels[to]!;
    if (target.id !== active.id) selectChannel(target);
    e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")[to]?.focus();
  }

  function toggleHold() {
    if (active.status === "running") {
      updateStatus(active.id, "paused", 1);
    } else if (active.status === "paused") {
      updateStatus(active.id, "running", 6);
    } else if (active.status === "fault") {
      updateStatus(active.id, "running", 5, "Re-indexed AST cache");
    } else if (active.status === "waiting") {
      updateStatus(active.id, "paused", 1);
    }
  }

  function approveOrRetry() {
    if (active.status === "waiting") {
      updateStatus(active.id, "running", 7, "Writing src/session.ts");
    } else if (active.status === "fault") {
      updateStatus(active.id, "running", 5, "Retrying AST cache");
    } else if (active.status === "paused") {
      updateStatus(active.id, "running", 6);
    } else {
      updateStatus(active.id, "waiting", 3, "Ready for next approval");
    }
  }

  const primaryActionLabel =
    active.status === "waiting"
      ? "Approve"
      : active.status === "fault"
        ? "Retry"
        : active.status === "paused"
          ? "Resume"
          : "Request OK";

  const secondaryActionLabel = active.status === "running" ? "Hold" : "Reset";

  return (
    <div
      data-body="device"
      data-part="plate"
      className={"grid w-full max-w-md min-w-0 gap-3 rounded-surface p-3 text-fg shadow-(--plate-edge) forced-colors:border " + className}
      style={{ background: "var(--plate-face)" }}
    >
      {/* Engraved plate header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <span id={titleId} data-part="lettering" className="litt-legend text-caption font-label text-fg">
          {label}
        </span>
        <span data-part="lettering" className="font-mono text-caption font-normal tabular-nums text-legend-quiet">
          {runningCount} run · {waitingCount} wait
        </span>
      </div>

      {/* Black polished bezel holding smoked LCD glass */}
      <div
        data-part="bezel"
        className="rounded-surface bg-bezel p-1 shadow-(--bezel-edge) forced-colors:border"
      >
        <div
          data-part="lcd"
          className="grid gap-2.5 rounded-control bg-field p-3 font-mono text-field-ink shadow-(--lcd-edge)"
          style={{ backgroundImage: "var(--lcd)" }}
        >
          {/* LCD top bar: hardware chip + selected channel + frame timecode */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-field-line pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                data-part="chip"
                className="inline-flex shrink-0 items-center gap-1 rounded-control bg-chip px-1.5 py-0.5 text-caption font-label text-chip-ink forced-colors:border"
              >
                <span aria-hidden="true">{activeMeta.glyph}</span>
                <span>{activeMeta.chip}</span>
              </span>
              <span className="truncate text-caption font-title text-field-ink">
                CH {active.slot} · {active.name}
              </span>
            </div>
            <span className="shrink-0 text-caption font-normal tabular-nums text-lcd-dim">
              {active.timecode}
            </span>
          </div>

          {/* 4-channel readout list on glass; active channel highlighted in Device's selection blue */}
          <div className="grid gap-1" role="list" aria-labelledby={titleId}>
            {channels.map((ch) => {
              const selected = ch.id === active.id;
              const meta = STATUS_META[ch.status];
              return (
                <div
                  key={ch.id}
                  role="listitem"
                  aria-current={selected ? "true" : undefined}
                  className={
                    "flex min-w-0 items-center justify-between gap-2 rounded-control px-2 py-1 text-caption " +
                    (selected
                      ? "bg-select text-select-ink forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                      : "text-field-ink")
                  }
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 font-normal tabular-nums opacity-80">{ch.slot}</span>
                    <span className="truncate font-title">{ch.name}</span>
                    <span className={"shrink-0 font-normal " + (selected ? "text-select-ink" : "text-lcd-dim")}>
                      ({meta.word})
                    </span>
                  </div>

                  {/* 8-bar monochrome LCD token-burst meter */}
                  <div aria-hidden="true" className="flex shrink-0 items-center gap-0.5">
                    {Array.from({ length: BARS }, (_, idx) => {
                      const lit = idx < ch.level;
                      return (
                        <span
                          key={idx}
                          className="block h-2.5 w-1 rounded-none"
                          style={{
                            backgroundColor: lit
                              ? selected
                                ? "var(--select-ink)"
                                : "var(--field-ink)"
                              : selected
                                ? "color-mix(in oklab, var(--select-ink) 28%, transparent)"
                                : "color-mix(in oklab, var(--field-ink) 16%, transparent)",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected channel task line */}
          <div className="flex min-w-0 items-center justify-between gap-2 border-t border-field-line pt-2 text-caption">
            <span className={"truncate font-normal " + (active.status === "fault" ? "text-danger" : "text-lcd-dim")}>
              {active.task}
            </span>
          </div>
        </div>
      </div>

      {/* Recessed well holding channel selector keys (1 roving tab stop) */}
      <div
        role="radiogroup"
        aria-label="Select agent channel"
        onKeyDown={onChannelKeyDown}
        data-part="well"
        className="grid grid-cols-2 gap-1 rounded-surface bg-tray p-1 shadow-(--tray-shade) sm:grid-cols-4 forced-colors:border"
      >
        {channels.map((ch) => {
          const selected = ch.id === active.id;
          return (
            <button
              key={ch.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              data-part="key"
              onPointerDown={() => play("key-down")}
              onPointerUp={() => play("key-up")}
              onClick={() => selectChannel(ch)}
              className={
                deviceKeyBase +
                (selected
                  ? " bg-surface-3 shadow-(--block-press) [transform:translateY(var(--press-depth))] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                  : " bg-block shadow-(--key-lift)")
              }
            >
              <Lamp status={ch.status} />
              <span className="truncate font-mono tabular-nums">CH {ch.slot}</span>
            </button>
          );
        })}
      </div>

      {/* Hardware transport / steering keys in a recessed well */}
      <div data-part="well" className="grid grid-cols-2 gap-1 rounded-surface bg-tray p-1 shadow-(--tray-shade) forced-colors:border">
        <button
          type="button"
          data-part="key"
          onPointerDown={() => play("key-down")}
          onPointerUp={() => play("key-up")}
          onClick={approveOrRetry}
          className={deviceKey}
        >
          <Lamp status={active.status === "waiting" ? "waiting" : active.status === "fault" ? "fault" : "paused"} />
          <span className="truncate">{primaryActionLabel}</span>
        </button>
        <button
          type="button"
          data-part="key"
          onPointerDown={() => play("key-down")}
          onPointerUp={() => play("key-up")}
          onClick={toggleHold}
          className={deviceKey}
        >
          <span className="truncate">{secondaryActionLabel}</span>
        </button>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
