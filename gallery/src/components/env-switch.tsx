/**
 * EnvSwitch, a Press part (plans/024, Press; taste/litt-principles.md, Press): a minimal tactile environment and
 * region selector built from Press's recessed tray, raised block, and cut-in slot meter.
 *
 * - Sits directly on Press's warm stone ground with no outer card wrapper.
 * - Choosing an environment (`Production`, `Preview`, `Development`) raises its stone block cleanly out of the
 *   recessed tray (`--highlight, --block-lift`), updates the tabular host/region readout, and adjusts the cut-in slot
 *   meter (`--slot`, `--slot-shade`, `--slot-fill`).
 * - Zero button outlines, zero decorative color pills, zero `--accent` fills (R6), and zero auto-animation on mount.
 */
import { useId, useState } from "react";

export type EnvTarget = {
  /** Stable environment id. */
  id: string;
  /** Short environment name, e.g. "Production", "Preview", "Development". */
  label: string;
  /** Hostname shown in the readout. */
  host: string;
  /** Region code, e.g. "fra1", "iad1", "local". */
  region: string;
  /** Median latency readout, e.g. "18 ms". */
  latency: string;
  /** Current traffic or load percentage (0 to 100) shown in the cut-in slot. */
  load: number;
};

export type EnvSwitchProps = {
  /** Accessible label for the environment switcher. Defaults to "Environment". */
  label?: string;
  /** Available target environments. */
  environments?: EnvTarget[];
  /** Controlled active environment id. */
  value?: string;
  /** Initial active environment id when uncontrolled. Defaults to "prod". */
  defaultValue?: string;
  /** Called with the selected environment id on change. */
  onValueChange?: (id: string) => void;
  /** Extra classes on the root wrapper. */
  className?: string;
};

export const DEFAULT_ENVIRONMENTS: EnvTarget[] = [
  { id: "prod", label: "Production", host: "harbor.app", region: "fra1", latency: "18 ms", load: 74 },
  { id: "preview", label: "Preview", host: "pr-148.harbor.app", region: "iad1", latency: "31 ms", load: 28 },
  { id: "dev", label: "Development", host: "localhost:3000", region: "local", latency: "4 ms", load: 12 },
];

/** Press's tactile environment switcher: raised stone block in a recessed tray paired with a cut-in load slot. */
export function EnvSwitch({
  label = "Environment",
  environments = DEFAULT_ENVIRONMENTS,
  value,
  defaultValue = "prod",
  onValueChange,
  className = "",
}: EnvSwitchProps) {
  const headingId = useId();
  const [inner, setInner] = useState(defaultValue);
  const [live, setLive] = useState("");

  const activeId = value !== undefined ? value : inner;
  const current = environments.find((e) => e.id === activeId) ?? environments[0]!;
  const loadPct = Math.max(0, Math.min(100, Math.round(current.load)));

  function pick(env: EnvTarget) {
    if (value === undefined) setInner(env.id);
    onValueChange?.(env.id);
    setLive(`${env.label}: ${env.host}, ${env.region}, ${env.latency}, ${env.load}% capacity.`);
  }

  return (
    <div data-body="press" className={"grid w-full max-w-md min-w-0 gap-3 text-fg " + className}>
      {/* Recessed tray holding the environment blocks */}
      <div
        role="radiogroup"
        aria-label={label}
        data-part="tray"
        className="grid gap-1 rounded-control bg-tray p-1 shadow-(--tray-shade) forced-colors:border"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, environments.length)}, minmax(0, 1fr))` }}
      >
        {environments.map((env) => {
          const selected = env.id === current.id;
          return (
            <button
              key={env.id}
              type="button"
              role="radio"
              aria-checked={selected}
              data-part={selected ? "block" : "tray"}
              onClick={() => pick(env)}
              className={
                "litt-target flex h-control-sm min-w-0 cursor-pointer items-center justify-center rounded-[calc(var(--radius-control)-2px)] px-2.5 text-caption select-none " +
                "transition-[background-color,color,box-shadow,transform] duration-(--dur-instant) ease-litt " +
                "active:[transform:translateY(var(--press-depth))] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                (selected
                  ? "bg-block font-title text-fg shadow-[var(--highlight),var(--block-lift)] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                  : "bg-transparent font-normal text-fg-muted hover:text-fg")
              }
            >
              <span className="truncate">{env.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quiet tabular host + region readout */}
      <div className="flex items-baseline justify-between gap-3">
        <span id={headingId} data-part="lettering" className="truncate font-mono text-small text-fg">
          {current.host}
        </span>
        <span data-part="lettering" className="shrink-0 font-mono text-caption tabular-nums text-fg-subtle">
          {current.region} · {current.latency} · {loadPct}%
        </span>
      </div>

      {/* Cut-in Press slot showing capacity load */}
      <div
        role="meter"
        aria-labelledby={headingId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={loadPct}
        aria-valuetext={`${loadPct}% capacity`}
        data-part="slot"
        className="relative h-2.5 w-full overflow-hidden rounded-control bg-slot shadow-(--slot-shade) forced-colors:border"
      >
        <div
          data-part="fill"
          className="h-full w-full origin-left bg-slot-fill shadow-(--slot-fill-shade) transition-transform duration-(--dur-instant) ease-litt forced-colors:bg-[Highlight]"
          style={{ transform: `scaleX(${loadPct / 100})` }}
        />
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
