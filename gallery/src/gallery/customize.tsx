/**
 * Customize, the panel: the header's button and the popover with the accent, the material, motion's feel, the theme,
 * the shape and the typeface. It loads on its own, so the shell stays small; the state and the writes on <body> live in
 * customize-state.tsx.
 *
 * As little as possible (Rams): only the controls and what carries them out of the browser. No intro, no headings,
 * no notes. A hairline splits the look (the accent, the material and motion's feel, which Copy setup and Copy link
 * carry, so they sit right under it) from what stays in this browser (the theme, the shape and the face). The accents
 * are swatches with their name inside; a choice whose picture says more than its word is a CardPicker tile; a choice
 * the word says whole is a row. The footer is quiet: Surprise me as an icon, and once anything changed, Copy tokens and Reset.
 */
import { useEffect, useId, useState, type CSSProperties } from "react";
import { useDevice } from "@/motion";
import { customizeSnippet, shapeName, shapeSurface, SHAPES } from "@/motion/rules";
import { Button } from "@/components/button";
import { CardPicker } from "@/components/card-picker";
import { CheckIcon, LinkIcon, SlidersIcon, SparkleIcon } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { Segmented } from "@/components/segmented";
import { Switch } from "@/components/switch";
import { useCustomize, useDark, type ThemeChoice } from "./customize-state";
import { CopyButton } from "./docs/copy";
import { SITE } from "./docs/copy-prompt";
import { accentName, ACCENTS, lookAttributes, lookInApp, lookSetup, lookWords, materialOf, MATERIALS, withLook, type Accent, type Material } from "./look";
import { loadTypeface } from "./typeface";

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/**
 * The accents as swatches: each one a block in its own color with its name inside in --accent-fg, so the color and
 * the word are one thing. Native radios, so the arrow keys and the group's name come from the browser. The pick
 * carries a check and a ring in --fg outside the swatch, so it never leans on the color; the keyboard's ring is
 * --focus. The swatch is a sample, not an action, so it never counts as a view's accent fill (R6).
 */
function AccentSwatches({ value, material, onValueChange }: { value: Accent; material: Material; onValueChange: (a: Accent) => void }) {
  const dark = useDark();
  const name = useId();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 p-0 text-small font-title text-fg">Accent</legend>
      <div className="grid grid-cols-3 gap-2">
        {ACCENTS.map((a) => {
          const picked = value === a.id;
          const label = accentName(a.id, material, true);
          return (
            <label
              key={a.id}
              className={
                "relative cursor-pointer rounded-control outline-offset-2 [-webkit-tap-highlight-color:transparent] has-focus-visible:outline-2 has-focus-visible:outline-focus " +
                (picked ? "outline-2 outline-fg" : "")
              }
            >
              <input type="radio" className="sr-only" name={name} value={a.id} checked={picked} aria-label={label} onChange={() => onValueChange(a.id)} />
              <span
                aria-hidden="true"
                {...lookAttributes({ accent: a.id, material }, dark)}
                className="flex h-12 items-center justify-center gap-1.5 rounded-control bg-accent px-2 text-small font-title text-accent-fg forced-colors:border"
              >
                {picked && <CheckIcon />}
                <span className="truncate">{label}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A block in its tray, drawn in one material: raised and cast in Press, a grey fill in a hairline in Flat. */
function MaterialPreview({ material }: { material: Material }) {
  const { look } = useCustomize();
  const dark = useDark();
  return (
    <span {...lookAttributes({ accent: look.accent, material }, dark)} className="grid h-6 w-10 grid-cols-2 rounded-control bg-tray p-0.5 shadow-(--tray-shade)">
      <span className="rounded-[calc(var(--radius-control)-2px)] bg-block shadow-(--block-lift)" />
    </span>
  );
}

/** A card at the shape's surface radius holding a control at its control radius, in the tile's ink. */
function ShapePreview({ radius }: { radius: number }) {
  return (
    <span
      style={{ "--radius-control": `${radius}px`, "--radius-surface": `${shapeSurface(radius)}px` } as CSSProperties}
      className="grid h-8 w-12 place-items-center rounded-surface shadow-[inset_0_0_0_1px_currentColor]"
    >
      <span className="h-3 w-7 rounded-control bg-current" />
    </span>
  );
}

function CustomizePanel() {
  const { theme, setTheme, typefaces, typeface, setTypeface, radius, lockedRadius, setRadius, look, setLook, modified, reset } = useCustomize();
  const [said, setSaid] = useState("");
  const type = { name: typeface.name, stack: typeface.stack, locked: typefaces[0].name };
  const snippet = customizeSnippet(radius, lockedRadius, type);

  /* Every face draws its own "Aa", so each loads once the panel opens. */
  useEffect(() => typefaces.forEach(loadTypeface), [typefaces]);

  const surprise = () => {
    const other = <T,>(all: readonly T[], now: T) => {
      const rest = all.filter((x) => x !== now);
      return rest[Math.floor(Math.random() * rest.length)];
    };
    const a = other(ACCENTS.map((x) => x.id), look.accent);
    const m = other(MATERIALS.map((x) => x.id), look.material);
    const r = other(SHAPES, radius);
    const f = other(typefaces, typeface);
    const feel = Math.random() < 0.5;
    setLook({ accent: a, material: m, fun: feel });
    setRadius(r);
    setTypeface(f.id);
    setSaid(`${accentName(a, m)}, ${materialOf(m).name.toLowerCase()} material, ${shapeName(r).toLowerCase()} corners, ${f.name} and ${feel ? "fun" : "calm"} motion.`);
  };

  return (
    <div className="grid gap-8">
      <section aria-label="Look" className="grid gap-6">
        <AccentSwatches value={look.accent} material={look.material} onValueChange={(accent) => setLook({ accent })} />
        <CardPicker
          size="sm"
          legend="Material"
          value={look.material}
          onValueChange={(material) => setLook({ material })}
          options={MATERIALS.map((m) => ({ value: m.id, label: m.name, picture: <MaterialPreview material={m.id} /> }))}
        />
        <div data-fun-cue="">
          <Switch label="Fun motion" checked={look.fun} onCheckedChange={(fun) => setLook({ fun })} align="end" />
        </div>
        {/* The look is what leaves this browser: the edits for your app, and a link that shows it to someone else. */}
        <div role="group" aria-labelledby="your-look" className="grid gap-2">
          <p className="sr-only">
            <span id="your-look">Your look</span> <span data-fun-cue="">{lookWords(look)}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={lookSetup(look, SITE)}>Copy setup</CopyButton>
            <CopyButton text={withLook(location.href, look)} variant="ghost" icon={<LinkIcon />}>
              Copy link
            </CopyButton>
          </div>
          <p data-fun-cue="" className="text-caption font-normal text-fg-subtle">
            {lookInApp(look)}
          </p>
        </div>
      </section>

      <section aria-label="This browser" className="grid gap-6 border-t border-line pt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <span aria-hidden="true" className="text-small font-title text-fg">
            Theme
          </span>
          <Segmented legend="Theme" value={theme} onValueChange={setTheme} options={THEMES} />
        </div>
        <CardPicker
          size="sm"
          legend="Shape"
          value={String(radius)}
          onValueChange={(v) => setRadius(Number(v))}
          options={SHAPES.map((r) => ({ value: String(r), label: shapeName(r), picture: <ShapePreview radius={r} /> }))}
        />
        <CardPicker
          size="sm"
          legend="Typeface"
          value={typeface.id}
          onValueChange={setTypeface}
          options={typefaces.map((f) => ({
            value: f.id,
            label: f.short ?? f.name,
            picture: (
              <span className="text-display font-title" style={{ fontFamily: f.stack }}>
                Aa
              </span>
            ),
          }))}
        />
      </section>

      <div className="grid gap-2 border-t border-line pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" iconOnly aria-label="Surprise me" title="Surprise me" onClick={surprise}>
            <SparkleIcon />
          </Button>
          <span className="flex-1" />
          {modified && snippet && (
            <CopyButton text={snippet} variant="ghost">
              Copy tokens
            </CopyButton>
          )}
          {modified && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                reset();
                setSaid("");
              }}
            >
              Reset to defaults
            </Button>
          )}
        </div>
        <p id="customize-said" aria-live="polite" className={"text-caption font-normal text-fg-subtle " + (said ? "" : "sr-only")}>
          {said}
        </p>
      </div>
    </div>
  );
}

/** The header's Customize button and its panel. On a phone the button is an icon and the panel is a sheet. */
export default function Customize() {
  const { compact } = useDevice();
  const label = "Customize";
  return (
    <Popover>
      {/* The id lets the look notice (look-notice.tsx) hand focus here. */}
      <PopoverTrigger asChild>
        {compact ? (
          <Button id="customize-trigger" size="sm" variant="ghost" iconOnly aria-label={label}>
            <SlidersIcon />
          </Button>
        ) : (
          <Button id="customize-trigger" size="sm" variant="ghost" icon={<SlidersIcon />}>
            {label}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent label="Customize" size="lg" align="end">
        <CustomizePanel />
      </PopoverContent>
    </Popover>
  );
}
