/**
 * The look's controls, one set for every place that picks a look: the overview's deck and the Build page. Each reads
 * and writes customize-state.tsx, so two places on screen can never disagree. Each control says its value in words
 * (R5), and the accent's segments carry a chip in their color (swatch.tsx), aria-hidden, a sample and not a fill (R6).
 */
import type { ReactNode } from "react";
import { Segmented } from "@/components/segmented";
import { Switch } from "@/components/switch";
import { useCustomize, type ThemeChoice } from "./customize-state";
import { ACCENTS, MATERIALS } from "./look";
import { AccentChip } from "./swatch";

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** A settings row, as the Switch's align="end": the name at the start, the control at the end. The fieldset's own
    legend names the control for a screen reader, so the name you see is hidden from it. */
export function LookRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <span aria-hidden="true" className="text-small font-title text-fg">
        {label}
      </span>
      {children}
    </div>
  );
}

export function ThemeControl() {
  const { theme, setTheme } = useCustomize();
  return (
    <LookRow label="Theme">
      <Segmented legend="Theme" value={theme} onValueChange={setTheme} options={THEMES} />
    </LookRow>
  );
}

export function MaterialControl() {
  const { look, setLook } = useCustomize();
  return (
    <LookRow label="Material">
      <Segmented
        legend="Material"
        value={look.material}
        onValueChange={(material) => setLook({ material })}
        options={MATERIALS.map((m) => ({ value: m.id, label: m.name }))}
      />
    </LookRow>
  );
}

export function AccentControl() {
  const { look, setLook } = useCustomize();
  return (
    <LookRow label="Accent">
      <Segmented
        legend="Accent"
        value={look.accent}
        onValueChange={(accent) => setLook({ accent })}
        options={ACCENTS.map((a) => ({
          value: a.id,
          label: (
            <span className="flex items-center gap-1.5">
              <AccentChip accent={a.id} size="sm" />
              {a.short ?? a.name}
            </span>
          ),
        }))}
      />
    </LookRow>
  );
}

/** Motion's feel: Calm, or fun mode's trial (motion/fun.tsx). */
export function FunControl() {
  const { look, setLook } = useCustomize();
  return <Switch label="Fun mode" description="Springier motion, the same at rest." checked={look.fun} onCheckedChange={(fun) => setLook({ fun })} align="end" />;
}
