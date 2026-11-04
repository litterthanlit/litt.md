/**
 * The look as three pictures: the Build page's panel. A look is the accent, the material and the motion, and nothing
 * else (proposals/builder.md, decision 1: type and shape stay litt's). Each choice shows what it does before it says it
 * (the registry's CardPicker at sm): an accent as a button in its color, a material as a block in its tray, a motion by
 * name. Every pick writes customize-state.tsx, so the whole gallery follows, and the look is said in words under it.
 *
 * On a wide screen the panel floats over the stage, so it is glass there (R3); in the flow on a narrow one it is a
 * surface. The glass is its own layer behind the content, shown from lg.
 */
import { CardPicker } from "@/components/card-picker";
import { useCustomize, useDark } from "./customize-state";
import { ACCENTS, lookAttributes, lookWords, MATERIALS, type Material } from "./look";
import { AccentChip } from "./swatch";

/** Press or Flat as a picture: a block in its tray, drawn in that material. */
function MaterialSwatch({ material }: { material: Material }) {
  const { look } = useCustomize();
  const dark = useDark();
  return (
    <span {...lookAttributes({ accent: look.accent, material }, dark)} className="grid h-6 w-10 grid-cols-2 rounded-control bg-tray p-0.5 shadow-(--tray-shade)">
      <span className="rounded-[calc(var(--radius-control)-2px)] bg-block shadow-(--block-lift)" />
    </span>
  );
}

export function LookPanel({ className = "" }: { className?: string }) {
  const { look, setLook } = useCustomize();
  return (
    <section
      aria-label="Your look"
      className={"relative isolate grid content-start gap-6 rounded-surface bg-surface-1 p-6 shadow-[inset_0_0_0_1px_var(--line),var(--highlight)] lg:bg-transparent lg:shadow-none " + className}
    >
      <div aria-hidden="true" className="litt-glass absolute inset-0 -z-10 hidden lg:block" />
      <CardPicker
        size="sm"
        legend="Accent"
        value={look.accent}
        onValueChange={(accent) => setLook({ accent })}
        options={ACCENTS.map((a) => ({ value: a.id, label: a.short ?? a.name, picture: <AccentChip accent={a.id} /> }))}
      />
      <CardPicker
        size="sm"
        legend="Material"
        value={look.material}
        onValueChange={(material) => setLook({ material })}
        options={MATERIALS.map((m) => ({ value: m.id, label: m.name, picture: <MaterialSwatch material={m.id} /> }))}
      />
      <CardPicker
        size="sm"
        legend="Motion"
        value={look.fun ? "fun" : "calm"}
        onValueChange={(v) => setLook({ fun: v === "fun" })}
        options={[
          { value: "calm", label: "Calm" },
          { value: "fun", label: "Fun" },
        ]}
      />
      <p aria-live="polite" className="border-t border-line pt-4 text-small text-fg-muted">
        {lookWords(look)}
      </p>
    </section>
  );
}
