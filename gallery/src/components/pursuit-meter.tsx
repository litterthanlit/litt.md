/**
 * PursuitMeter, a Heat part (proposals/heat.md; taste/litt-principles.md, Heat): the street-racing pursuit condition
 * and heat-level readout — Heat's namesake control.
 *
 * - Framed as a square black slab (`rounded-none border border-line-strong bg-canvas`) banded top and bottom with
 *   diagonal hazard stripes and four 16px outer ink corner brackets (inset inside a 2px-padded wrapper so the marks
 *   never widen the box).
 * - Shows Heat condition (`×1` through `×5`), status in plain words (`Cooldown`, `Active`, `Evade`, `Busted`, never
 *   color alone, R5), tabular bounty readout, and a 16-dash amber pursuit meter (`role="meter"`) that steps across
 *   levels (turning `--danger` on `Busted` or condition `×5` while the word says so).
 * - Optional interactive controls (`Step heat`, `Cooldown`) let a player or tester drive condition levels directly;
 *   every change announces once in a polite status region. Zero accent fills (R6) and zero auto-animation on mount.
 */
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Kbd } from "@/components/kbd";
import { Tag, type TagStatus } from "@/components/tag";

export type PursuitStatus = "cooldown" | "active" | "evade" | "busted";

export type PursuitMeterProps = {
  /** Label naming the pursuit readout, such as "Pursuit heat" or "Rockport PD". */
  label?: ReactNode;
  /** Controlled heat level from 1 to 5. Pair with onLevelChange. */
  level?: number;
  /** Initial heat level (1 to 5) when uncontrolled. Defaults to 3. */
  defaultLevel?: number;
  /** Called when the user steps the heat level. */
  onLevelChange?: (level: number) => void;
  /** Pursuit status shown in words beside the condition badge. */
  status?: PursuitStatus;
  /** Tabular bounty figure, e.g. 142500. Formatted with thousands separators. */
  bounty?: number;
  /** Optional unit/prefix before the bounty figure, e.g. "Bounty". */
  bountyLabel?: string;
  /** Optional count of pursuing units shown in the telemetry footer. */
  units?: number;
  /** Show interactive Raise heat / Cooldown controls under the meter. Defaults to true. */
  interactive?: boolean;
  /** Extra classes on the outer container. */
  className?: string;
};

const DASHES = 16;

const MARKS =
  "pointer-events-none absolute bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom] ";

const FRAME =
  MARKS +
  "[background-size:16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px] -inset-2 text-fg";

const STRIPES = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

const LEVEL_NAMES: Record<number, string> = {
  1: "Local patrol",
  2: "State pursuit",
  3: "Heavy response",
  4: "Federal units",
  5: "Blacklist dispatch",
};

const STATUS_META: Record<PursuitStatus, { word: string; tag: TagStatus }> = {
  cooldown: { word: "Cooldown", tag: "success" },
  active: { word: "Active", tag: "warning" },
  evade: { word: "Evade", tag: "warning" },
  busted: { word: "Busted", tag: "danger" },
};

const clampLevel = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
const groupDigits = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Heat's pursuit condition and bounty readout: striped bracketed slab with a 16-dash heat meter. */
export function PursuitMeter({
  label = "Pursuit heat",
  level: levelProp,
  defaultLevel = 3,
  onLevelChange,
  status: statusProp,
  bounty = 142500,
  bountyLabel = "Bounty",
  units,
  interactive = true,
  className = "",
}: PursuitMeterProps) {
  const titleId = useId();
  const [innerLevel, setInnerLevel] = useState(() => clampLevel(defaultLevel));
  const [live, setLive] = useState("");

  const level = clampLevel(levelProp ?? innerLevel);
  const status: PursuitStatus = statusProp ?? (level === 1 ? "cooldown" : level === 5 ? "evade" : "active");
  const meta = STATUS_META[status];
  const litDashes = Math.round((level / 5) * DASHES);
  const shownUnits = units ?? level * 2;
  const shownBounty = bounty + (level - clampLevel(defaultLevel)) * 35000;
  const dangerBar = status === "busted" || level === 5;

  function stepTo(next: number) {
    const clamped = clampLevel(next);
    if (clamped === level) return;
    if (levelProp === undefined) setInnerLevel(clamped);
    onLevelChange?.(clamped);
    setLive(`Heat level ×${clamped}, ${LEVEL_NAMES[clamped]}.`);
  }

  return (
    <div data-body="heat" className={"grid w-full min-w-0 gap-3 p-2 " + className}>
      <div className="relative min-w-0">
        <span aria-hidden="true" className={FRAME} />
        <div className="grid min-w-0 border border-line-strong bg-canvas forced-colors:border">
          {/* Striped header band */}
          <div className={"flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-1 px-3 py-2 " + STRIPES}>
            <span id={titleId} className="bg-canvas px-2 py-0.5 text-small font-title text-fg">
              {label}
            </span>
            <Tag status={meta.tag}>{meta.word}</Tag>
          </div>

          {/* Condition readout + 16-dash heat bar */}
          <div className="grid gap-3 px-4 py-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-h1 font-title tabular-nums text-accent-text">×{level}</span>
                <span className="text-small font-title text-fg">{LEVEL_NAMES[level]}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-caption text-fg-subtle">{bountyLabel}</span>
                <span className="font-mono text-h3 font-title tabular-nums text-fg">
                  {groupDigits(Math.max(0, shownBounty))}
                </span>
              </div>
            </div>

            <div
              role="meter"
              aria-labelledby={titleId}
              aria-valuemin={1}
              aria-valuemax={5}
              aria-valuenow={level}
              aria-valuetext={`Condition ×${level}, ${LEVEL_NAMES[level]}, ${meta.word}`}
              className="grid gap-1.5"
            >
              <div aria-hidden="true" className="flex h-6 items-center gap-1 border border-line bg-tray px-1.5 forced-colors:border">
                {Array.from({ length: DASHES }, (_, i) => {
                  const lit = i < litDashes;
                  return (
                    <span
                      key={i}
                      className={
                        "h-2.5 flex-1 transition-colors duration-(--dur-instant) ease-litt " +
                        (lit
                          ? dangerBar
                            ? "bg-danger forced-colors:bg-[Highlight]"
                            : "bg-accent-text forced-colors:bg-[Highlight]"
                          : "bg-line-strong")
                      }
                    />
                  );
                })}
              </div>
              <div aria-hidden="true" className="grid grid-cols-5 font-mono text-caption tabular-nums">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={"text-center " + (n === level ? "font-title text-accent-text" : "text-fg-subtle")}>
                    ×{n}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 text-caption text-fg-muted">
              <span className="font-mono tabular-nums">
                {shownUnits} {shownUnits === 1 ? "unit" : "units"} on tail
              </span>
              {interactive && (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="secondary" disabled={level <= 1} onClick={() => stepTo(level - 1)}>
                    Cooldown
                  </Button>
                  <Button size="sm" variant="secondary" disabled={level >= 5} onClick={() => stepTo(level + 1)}>
                    Raise heat
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div aria-hidden="true" className={"h-2.5 border-t border-line bg-surface-1 " + STRIPES} />
        </div>
      </div>

      {interactive && (
        <div aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Cooldown</Kbd>
            <span>Drop condition</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Raise heat</Kbd>
            <span>Escalate pursuit</span>
          </span>
        </div>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
