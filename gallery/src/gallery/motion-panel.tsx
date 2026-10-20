/**
 * The instrument, on the Playground only. Presets, fine controls per tier,
 * playback, a live check against the litt.md rules, and "Lock it", which
 * writes the tokens.
 *
 * Everything here applies to the Playground page alone. Every other page runs
 * the values locked in tokens.css.
 */
import { useId, useState } from "react";
import { PRESET_LABEL, RADII, TRAVELS, surfaceRadius, useMotionDial, type DeviceMode, type PresetName } from "@/motion";
import { curve, overshoot, toCss, type Spring } from "@/motion/spring";
import { checkRules, diffFromLocked, tokensSnippet } from "@/motion/rules";
import { Button } from "@/components/button";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { Tag } from "@/components/tag";

/** A slider's range always includes its current value, so a token outside the usual range still shows. */
const span = (value: number, min: number, max: number): { min: number; max: number } => ({ min: Math.min(min, value), max: Math.max(max, value) });

function Slider({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
      <label htmlFor={id} className="text-small text-fg-muted">{label}</label>
      <output htmlFor={id} className="font-mono text-caption font-normal text-fg tabular-nums">{format(value)}</output>
      <input
        id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="col-span-2 h-6 w-full cursor-pointer accent-(--fg)"
      />
    </div>
  );
}

function Curve({ spring }: { spring: Spring }) {
  const pts = curve(spring);
  const max = Math.max(1.05, ...pts.map(([, y]) => y));
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${(4 + x * 112).toFixed(1)} ${(44 - (y / max) * 36).toFixed(1)}`).join("");
  const target = 44 - (1 / max) * 36;
  const { duration } = toCss(spring);
  const over = Math.round(overshoot(spring) * 100);
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 48" className="h-12 w-30 shrink-0" aria-hidden="true">
        <path d="M4 44H116" stroke="var(--line-strong)" fill="none" />
        <path d={`M4 ${target.toFixed(1)}H116`} stroke="var(--line-strong)" strokeDasharray="2 3" fill="none" />
        <path d={d} stroke="var(--fg)" strokeWidth="1.5" fill="none" />
      </svg>
      <p className="font-mono text-caption font-normal text-fg-subtle">
        settles {duration}ms
        <br />
        {over ? `overshoots ${over}%` : "no overshoot"}
      </p>
    </div>
  );
}

function Group({ title, use, children }: { title: string; use: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line pt-6">
      <header>
        <h3 className="text-body text-fg">{title}</h3>
        <p className="text-caption font-normal text-fg-subtle">{use}</p>
      </header>
      {children}
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (b: boolean) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 text-small text-fg-muted">
      {label}
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-(--fg)" />
    </label>
  );
}

/** The Device switch: what the demos on the Playground think the screen is. */
const DEVICES: { mode: DeviceMode; label: string }[] = [
  { mode: "auto", label: "Auto" },
  { mode: "phone", label: "Phone" },
  { mode: "desktop", label: "Desktop" },
];

const ms = (v: number) => `${Math.round(v)}ms`;
const sec = (v: number) => `${Math.round(v * 1000)}ms`;
const pct = (v: number) => v.toFixed(2);

export function MotionPanel({ device, onDeviceChange }: {
  /** Which device the demos are forced to, or "auto" for the real screen. The Playground owns it, so leaving the page resets it. */
  device: DeviceMode;
  onDeviceChange: (mode: DeviceMode) => void;
}) {
  const { dial, locked, presets, preset, setPreset, update, reset, slow, setSlow, reducedPreview, setReducedPreview, reduced, radius, setRadius } = useMotionDial();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const checks = checkRules(dial, radius);
  const differs = diffFromLocked(dial, radius, locked);
  const snippet = tokensSnippet(dial, radius);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const pre = document.getElementById("lock-snippet");
      if (pre) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  const segmented = "grid overflow-hidden rounded-control shadow-[inset_0_0_0_1px_var(--line-strong)]";
  const segment =
    "h-control-sm cursor-pointer text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg aria-pressed:bg-surface-3 aria-pressed:text-fg";
  const instantRange = span(dial.instant, 60, 160);
  const respRange = span(dial.responsive.time, 0.12, 0.4);
  const expRange = span(dial.expressive.time, 0.2, 0.7);
  const staggerRange = span(dial.stagger, 0, 80);

  return (
    <div className="grid gap-6">
      <header className="grid gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-h4 text-fg">Tune</h2>
          <span className="text-caption text-fg-subtle">{preset === "custom" ? "Custom" : PRESET_LABEL[preset]}</span>
        </div>
        <p className="text-caption font-normal text-fg-subtle">Applies on this page only. Every other page runs the locked values from tokens.css.</p>
        <div className={segmented + " grid-cols-3"} role="group" aria-label="Motion preset">
          {(Object.keys(presets) as PresetName[]).map((p) => (
            <button key={p} type="button" aria-pressed={preset === p} onClick={() => setPreset(p)} className={segment + " px-2 text-small font-title"}>
              {PRESET_LABEL[p]}
            </button>
          ))}
        </div>
        <div className="flex justify-start">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              reset();
              onDeviceChange("auto");
            }}
            className="-ml-3"
          >
            Reset to locked
          </Button>
        </div>
        {reduced && (
          <p className="text-caption font-normal text-warning">
            {reducedPreview ? "Previewing reduced motion: everything is instant." : "Your system asks for reduced motion, so every component is instant."}
          </p>
        )}
        {device !== "auto" && (
          <p className="text-caption font-normal text-warning">
            {device === "phone" ? "Previewing a phone: the narrow-screen paths are on." : "Previewing a desktop: the narrow-screen paths are off."}
          </p>
        )}
      </header>

      <Group title="Shape" use="Corner radius. Surfaces are controls plus the 4px inset">
        <div className="grid gap-2">
          <span className="text-small text-fg-muted" id="radius-label">Radius</span>
          <div className={segmented + " grid-cols-4"} role="group" aria-labelledby="radius-label">
            {RADII.map((r) => (
              <button key={r} type="button" aria-pressed={radius === r} onClick={() => setRadius(r)} className={segment + " font-mono text-caption font-normal"}>
                {r === 0 ? "Square" : `${r}px`}
              </button>
            ))}
          </div>
          <p className="font-mono text-caption font-normal text-fg-subtle">
            controls {radius}px · surfaces {surfaceRadius(radius)}px · pills stay pills
          </p>
        </div>
      </Group>

      <Group title="Instant" use="Hover, press, toggles">
        <Slider label="Duration" value={dial.instant} {...instantRange} step={10} format={ms} onChange={(v) => update({ instant: v })} />
      </Group>

      <Group title="Responsive" use="Menus, tabs, tooltips, the gliding highlight">
        <Slider label="Time" value={dial.responsive.time} {...respRange} step={0.01} format={sec}
          onChange={(v) => update({ responsive: { ...dial.responsive, time: v } })} />
        <Slider label="Bounce" value={dial.responsive.bounce} min={0} max={0.3} step={0.01} format={pct}
          onChange={(v) => update({ responsive: { ...dial.responsive, bounce: v } })} />
        <Curve spring={dial.responsive} />
      </Group>

      <Group title="Expressive" use="One moment per view: dialog, toasts, the list entrance">
        <Slider label="Time" value={dial.expressive.time} {...expRange} step={0.01} format={sec}
          onChange={(v) => update({ expressive: { ...dial.expressive, time: v } })} />
        <Slider label="Bounce" value={dial.expressive.bounce} min={0} max={0.4} step={0.01} format={pct}
          onChange={(v) => update({ expressive: { ...dial.expressive, bounce: v } })} />
        <Curve spring={dial.expressive} />
        <Slider label="Stagger" value={dial.stagger} {...staggerRange} step={10} format={ms} onChange={(v) => update({ stagger: v })} />
        <div className="grid gap-2">
          <span className="text-small text-fg-muted" id="travel-label">Travel</span>
          <div className={segmented + " grid-cols-4"} role="group" aria-labelledby="travel-label">
            {TRAVELS.map((t) => (
              <button key={t} type="button" aria-pressed={dial.travel === t} onClick={() => update({ travel: t })} className={segment + " font-mono text-caption font-normal"}>
                {t}px
              </button>
            ))}
          </div>
        </div>
      </Group>

      <Group title="Playback" use="For looking, not for shipping">
        <Toggle label="Slow motion ×4" checked={slow === 4} onChange={(b) => setSlow(b ? 4 : 1)} />
        <Toggle label="Preview reduced motion" checked={reducedPreview} onChange={setReducedPreview} />
        <div className="grid gap-2">
          <span className="text-small text-fg-muted" id="device-label">Device</span>
          <div className={segmented + " grid-cols-3"} role="group" aria-labelledby="device-label" aria-describedby="device-note">
            {DEVICES.map(({ mode, label }) => (
              <button key={mode} type="button" aria-pressed={device === mode} onClick={() => onDeviceChange(mode)} className={segment + " px-2 text-small font-title"}>
                {label}
              </button>
            ))}
          </div>
          <p id="device-note" className="text-caption font-normal text-fg-subtle">
            Auto follows your screen. Phone lets a desktop try the sheet, the menu drill-down and the command menu at the top edge. Input details on touch, such as 44px targets and pressed fills, follow your real pointer, not this switch.
          </p>
        </div>
      </Group>

      <section className="grid gap-3 border-t border-line pt-6" aria-labelledby="rules-title">
        <h3 id="rules-title" className="text-body text-fg">Against litt.md v{__LITT_MD_VERSION__} rules</h3>
        <ul className="grid gap-2">
          {checks.map((c) => (
            <li key={c.text} className="flex items-start gap-2 text-small">
              <Tag status={c.ok ? "success" : "warning"}>{c.ok ? "Fits" : "Change"}</Tag>
              <span className={"pt-0.5 " + (c.ok ? "text-fg-subtle" : "text-fg-muted")}>{c.text}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 pt-2">
          <h4 className="text-small text-fg-muted">Differs from locked</h4>
          {differs.length ? (
            <ul className="grid gap-1 font-mono text-caption font-normal text-fg-subtle">
              {differs.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : (
            <p className="text-caption font-normal text-fg-subtle">Nothing. This matches tokens.css.</p>
          )}
        </div>
      </section>

      <section className="grid gap-3 border-t border-line pt-6">
        <Button block onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="lock-snippet">
          {open ? "Hide tokens" : "Lock it"}
        </Button>
        {open && (
          <div className="grid gap-3">
            <pre id="lock-snippet" tabIndex={0} role="region" aria-label="Tokens to paste into tokens.css" className="max-h-64 overflow-auto rounded-control bg-surface-2 p-4 font-mono text-caption font-normal text-fg-muted shadow-[inset_0_0_0_1px_var(--line)]">
              {snippet}
            </pre>
            <Button size="sm" icon={copied ? <CheckIcon /> : <CopyIcon />} onClick={copy}>
              {copied ? "Copied" : "Copy tokens"}
            </Button>
            <p className="text-caption font-normal text-fg-subtle">Paste these to Claude and say "lock it" to write them into litt.md.</p>
          </div>
        )}
      </section>
    </div>
  );
}
