/**
 * The instrument. Presets, fine controls per tier, playback, a live check
 * against today's litt.md rules, and "Lock it", which writes the tokens.
 */
import { useId, useState } from "react";
import { PRESETS, PRESET_LABEL, surfaceRadius, useMotionDial, type PresetName, type Radius, type Travel } from "@/motion";
import { curve, overshoot, toCss, type Spring } from "@/motion/spring";
import { Button } from "@/components/button";
import { CheckIcon, CopyIcon } from "@/components/icons";

function Slider({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
      <label htmlFor={id} className="text-small text-fg-muted">{label}</label>
      <output htmlFor={id} className="font-mono text-caption text-fg tabular-nums">{format(value)}</output>
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
      <p className="font-mono text-caption text-fg-subtle">
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
        <p className="text-caption text-fg-subtle">{use}</p>
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

const ms = (v: number) => `${Math.round(v)}ms`;
const sec = (v: number) => `${Math.round(v * 1000)}ms`;
const pct = (v: number) => v.toFixed(2);

export function MotionPanel() {
  const { dial, preset, setPreset, update, slow, setSlow, reducedPreview, setReducedPreview, reduced, radius, setRadius } = useMotionDial();
  const [locked, setLocked] = useState(false);
  const [copied, setCopied] = useState(false);

  const r = toCss(dial.responsive);
  const e = toCss(dial.expressive);

  const checks: { ok: boolean; text: string }[] = [
    { ok: dial.responsive.time <= 0.24 && dial.expressive.time <= 0.24, text: `240ms ceiling: responsive ${sec(dial.responsive.time)}, expressive ${sec(dial.expressive.time)} (visual time)` },
    { ok: dial.responsive.bounce === 0 && dial.expressive.bounce === 0, text: "No bounce" },
    { ok: dial.travel <= 8, text: `8px travel limit: ${dial.travel}px` },
    { ok: dial.stagger === 0, text: `No staggered entrances: ${dial.stagger}ms stagger` },
    { ok: radius === 0, text: `Square corners: ${radius ? `${radius}px controls, ${surfaceRadius(radius)}px surfaces` : "square"}` },
  ];

  const snippet = [
    `/* Motion, locked in litt-ui (Q18). Springs are time + bounce:`,
    `   Motion visualDuration + bounce, Framer Time + Bounce. */`,
    `--dur-instant: ${dial.instant}ms;`,
    `--spring-responsive: ${Math.round(dial.responsive.time * 1000)}ms ${dial.responsive.bounce};`,
    `--spring-expressive: ${Math.round(dial.expressive.time * 1000)}ms ${dial.expressive.bounce};`,
    `--ease-responsive: ${r.easing};`,
    `--dur-responsive: ${r.duration}ms;`,
    `--ease-expressive: ${e.easing};`,
    `--dur-expressive: ${e.duration}ms;`,
    `--stagger: ${dial.stagger}ms;`,
    `--travel: ${dial.travel}px;`,
    `--exit: ${dial.exit};`,
    ``,
    `/* Shape (Q19): concentric, surfaces = controls + the 4px inset. */`,
    `--radius-control: ${radius}px;`,
    `--radius-surface: ${surfaceRadius(radius)}px;`,
  ].join("\n");

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

  return (
    <div className="grid gap-6">
      <header className="grid gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-h4 text-fg">Tune</h2>
          <span className="text-caption text-fg-subtle">{preset === "custom" ? "Custom" : PRESET_LABEL[preset]}</span>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-control shadow-[inset_0_0_0_1px_var(--line-strong)]" role="group" aria-label="Motion preset">
          {(Object.keys(PRESETS) as PresetName[]).map((p) => (
            <button
              key={p} type="button" aria-pressed={preset === p} onClick={() => setPreset(p)}
              className="h-control-sm cursor-pointer px-2 text-small text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg aria-pressed:bg-surface-3 aria-pressed:text-fg"
            >
              {PRESET_LABEL[p]}
            </button>
          ))}
        </div>
        {reduced && (
          <p className="text-caption text-warning">
            {reducedPreview ? "Previewing reduced motion: everything is instant." : "Your system asks for reduced motion, so every component is instant."}
          </p>
        )}
      </header>

      <Group title="Shape" use="Corner radius. Surfaces are controls plus the 4px inset">
        <div className="grid gap-2">
          <span className="text-small text-fg-muted" id="radius-label">Radius</span>
          <div className="grid grid-cols-4 overflow-hidden rounded-control shadow-[inset_0_0_0_1px_var(--line-strong)]" role="group" aria-labelledby="radius-label">
            {([0, 2, 4, 6] as Radius[]).map((r) => (
              <button
                key={r} type="button" aria-pressed={radius === r} onClick={() => setRadius(r)}
                className="h-control-sm cursor-pointer font-mono text-caption text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg aria-pressed:bg-surface-3 aria-pressed:text-fg"
              >
                {r === 0 ? "Square" : `${r}px`}
              </button>
            ))}
          </div>
          <p className="font-mono text-caption text-fg-subtle">
            controls {radius}px · surfaces {surfaceRadius(radius)}px · pills stay pills
          </p>
        </div>
      </Group>

      <Group title="Instant" use="Hover, press, toggles">
        <Slider label="Duration" value={dial.instant} min={60} max={160} step={10} format={ms} onChange={(v) => update({ instant: v })} />
      </Group>

      <Group title="Responsive" use="Menus, tabs, tooltips, the gliding highlight">
        <Slider label="Time" value={dial.responsive.time} min={0.12} max={0.4} step={0.01} format={sec}
          onChange={(v) => update({ responsive: { ...dial.responsive, time: v } })} />
        <Slider label="Bounce" value={dial.responsive.bounce} min={0} max={0.3} step={0.01} format={pct}
          onChange={(v) => update({ responsive: { ...dial.responsive, bounce: v } })} />
        <Curve spring={dial.responsive} />
      </Group>

      <Group title="Expressive" use="One moment per view: dialog, toasts, the list entrance">
        <Slider label="Time" value={dial.expressive.time} min={0.2} max={0.7} step={0.01} format={sec}
          onChange={(v) => update({ expressive: { ...dial.expressive, time: v } })} />
        <Slider label="Bounce" value={dial.expressive.bounce} min={0} max={0.4} step={0.01} format={pct}
          onChange={(v) => update({ expressive: { ...dial.expressive, bounce: v } })} />
        <Curve spring={dial.expressive} />
        <Slider label="Stagger" value={dial.stagger} min={0} max={80} step={10} format={ms} onChange={(v) => update({ stagger: v })} />
        <div className="grid gap-2">
          <span className="text-small text-fg-muted" id="travel-label">Travel</span>
          <div className="grid grid-cols-4 overflow-hidden rounded-control shadow-[inset_0_0_0_1px_var(--line-strong)]" role="group" aria-labelledby="travel-label">
            {([4, 8, 16, 24] as Travel[]).map((t) => (
              <button
                key={t} type="button" aria-pressed={dial.travel === t} onClick={() => update({ travel: t })}
                className="h-control-sm cursor-pointer font-mono text-caption text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg aria-pressed:bg-surface-3 aria-pressed:text-fg"
              >
                {t}px
              </button>
            ))}
          </div>
        </div>
      </Group>

      <Group title="Playback" use="For looking, not for shipping">
        <Toggle label="Slow motion ×4" checked={slow === 4} onChange={(b) => setSlow(b ? 4 : 1)} />
        <Toggle label="Preview reduced motion" checked={reducedPreview} onChange={setReducedPreview} />
      </Group>

      <section className="grid gap-3 border-t border-line pt-6" aria-label="Against today's rules">
        <h3 className="text-body text-fg">Against today's rules</h3>
        <ul className="grid gap-2">
          {checks.map((c) => (
            <li key={c.text} className="flex items-start gap-2 text-small">
              <span className={"mt-1.5 size-1.5 shrink-0 rounded-pill " + (c.ok ? "bg-success" : "bg-warning")} aria-hidden="true" />
              <span className={c.ok ? "text-fg-subtle" : "text-fg-muted"}>
                {c.text}
                <span className="sr-only">{c.ok ? " (fits)" : " (needs a rule change)"}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3 border-t border-line pt-6">
        <Button variant="primary" block onClick={() => setLocked((v) => !v)} aria-expanded={locked} aria-controls="lock-snippet">
          {locked ? "Hide tokens" : "Lock it"}
        </Button>
        {locked && (
          <div className="grid gap-3">
            <pre id="lock-snippet" className="max-h-64 overflow-auto rounded-control bg-surface-2 p-4 font-mono text-caption text-fg-muted shadow-[inset_0_0_0_1px_var(--line)]">
              {snippet}
            </pre>
            <Button size="sm" icon={copied ? <CheckIcon /> : <CopyIcon />} onClick={copy}>
              {copied ? "Copied" : "Copy tokens"}
            </Button>
            <p className="text-caption text-fg-subtle">Paste these to Claude and say "lock it" to write them into litt.md.</p>
          </div>
        )}
      </section>
    </div>
  );
}
