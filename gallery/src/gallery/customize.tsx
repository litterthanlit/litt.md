/**
 * Customize, the panel: the header's button and the popover with the accent, motion's feel, the theme, the shape and
 * the typeface. It loads on its own, so the shell stays small; the state and the writes on <body> live in
 * customize-state.tsx.
 *
 * The material is not here. A material is a world, a place you arrive on (proposals/worlds.md), so it is chosen where
 * you arrive: the nav's Worlds, the world pages and the overview's deck. Surprise me still picks one, and Your look,
 * Copy setup and Copy link still carry it.
 *
 * As little as possible (Rams): only the controls and what carries them out of the browser. No intro, no headings,
 * no notes. A hairline splits the look (the accent, then motion's feel, which Copy setup and Copy link
 * carry, so they sit right under it) from what stays in this browser (the theme, the shape and the face). The accents
 * are swatches, the color itself with its name inside. The shape is an ordered scale, so it is a Slider with a stop
 * per shape and the locked one marked home, as the overview's deck has it; a choice whose picture says more than its word is a CardPicker tile; a choice
 * the word says whole is a row. The footer is quiet: Surprise me as an icon, and once anything changed, Copy tokens and Reset.
 */
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { useDevice } from "@/motion";
import { customizeSnippet, shapeName, SHAPES } from "@/motion/rules";
import { Button } from "@/components/button";
import { LinkIcon, SlidersIcon, SparkleIcon } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { Select } from "@/components/select";
import { Slider } from "@/components/slider";
import { Switch } from "@/components/switch";
import { useCustomize, useDark } from "./customize-state";
import { CopyButton } from "./docs/copy";
import { SITE } from "./docs/copy-prompt";
import { accentName, accentsIn, canonicalAccent, lookAttributes, lookSetup, lookWords, materialOf, MATERIALS, withLook } from "./look";
import { loadTypeface } from "./typeface";

/** The shape slider's stops, one per shape. */
const STOPS = SHAPES.map((_, i) => i);


/** One swatch: its name, and how the box behind the name is drawn (classes, a style, and attributes such as a look). */
/** One swatch: its name, and how the box behind the name is drawn (classes, a style, and attributes such as a look).
    content draws the inside in place of the name; named shows the name when the swatch is not picked too. */
type Swatch<T extends string> = { value: T; label: string; className: string; style?: CSSProperties; attrs?: Record<string, string>; content?: ReactNode; named?: boolean };

/**
 * A choice drawn as the thing itself: the accents as blocks in their color. An accent says its name once picked (R5:
 * the value you have is said in words; the others say theirs on hover); `named` and `content` let a swatch say its name
 * always or draw something else inside. Native radios, so the arrow
 * keys and the group's name come from the browser; the box is hidden and the radio carries the name. The pick is a
 * ring in --fg outside the box, so it never leans on color; the keyboard's ring is --focus. An accent's block is a
 * sample, not an action, so it never counts as a fill (R6).
 */
function Swatches<T extends string>({ legend, value, onValueChange, options }: { legend: string; value: T; onValueChange: (v: T) => void; options: Swatch<T>[] }) {
  const name = useId();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 p-0 text-small font-title text-fg">{legend}</legend>
      <div className="grid grid-flow-col auto-cols-fr gap-2">
        {options.map((o) => {
          const picked = value === o.value;
          return (
            <label
              key={o.value}
              title={o.label}
              style={o.style}
              className={
                "group relative min-w-0 cursor-pointer rounded-control outline-offset-2 [-webkit-tap-highlight-color:transparent] has-focus-visible:outline-2 has-focus-visible:outline-focus " +
                (picked ? "outline-2 outline-fg" : "")
              }
            >
              <input type="radio" className="sr-only" name={name} value={o.value} checked={picked} aria-label={o.label} onChange={() => onValueChange(o.value)} />
              <span aria-hidden="true" {...o.attrs} style={o.style} className={"flex items-center justify-center rounded-control font-title forced-colors:border " + o.className}>
                {o.content ?? <span className={"truncate " + (picked || o.named ? "" : "opacity-0 pointer-coarse:group-active:opacity-100")}>{o.label}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function CustomizePanel() {
  const { typefaces, typeface, setTypeface, radius, lockedRadius, setRadius, look, setLook, modified, reset } = useCustomize();
  const dark = useDark();
  const [said, setSaid] = useState("");
  const type = { name: typeface.id === "locked" ? typefaces[0].name : typeface.name, stack: typeface.stack, locked: typefaces[0].name };
  const snippet = customizeSnippet(radius, lockedRadius, type);

  /* Every face draws its own "Aa", so each loads once the panel opens. */
  useEffect(() => typefaces.forEach(loadTypeface), [typefaces]);

  const surprise = () => {
    const other = <T,>(all: readonly T[], now: T) => {
      const rest = all.filter((x) => x !== now);
      return rest[Math.floor(Math.random() * rest.length)];
    };
    const m = other(MATERIALS.map((x) => x.id), look.material);
    const a = other(accentsIn(m).map((x) => x.id), canonicalAccent(look.accent, m));
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
        <Swatches
          legend="Accent"
          value={canonicalAccent(look.accent, look.material)}
          onValueChange={(accent) => setLook({ accent })}
          options={accentsIn(look.material).map((a) => ({
            value: a.id,
            label: accentName(a.id, look.material, true),
            attrs: lookAttributes({ accent: a.id, material: look.material }, dark),
            className: "h-12 px-1 bg-accent text-small text-accent-fg",
          }))}
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
        </div>
      </section>

      <section aria-label="This browser" className="grid gap-6 border-t border-line pt-6 in-[[data-material=flat]]:border-t-0">
        <Slider
          label="Shape"
          value={(SHAPES as readonly number[]).indexOf(radius)}
          min={0}
          max={SHAPES.length - 1}
          step={1}
          marks={STOPS}
          home={(SHAPES as readonly number[]).indexOf(lockedRadius)}
          formatValue={(i) => shapeName(SHAPES[i])}
          minLabel="Square"
          maxLabel="Pill"
          onValueChange={(i) => setRadius(SHAPES[i])}
        />
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <span id="customize-face" className="text-small font-title text-fg">
            Typeface
          </span>
          <div className="w-40">
            <Select
              size="sm"
              aria-labelledby="customize-face"
              value={typeface.id}
              onValueChange={setTypeface}
              options={typefaces.map((f) => ({ value: f.id, textValue: f.name, label: <span style={{ fontFamily: f.stack }}>{f.short ?? f.name}</span> }))}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-2 border-t border-line pt-4 in-[[data-material=flat]]:border-t-0">
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

/**
 * The header's Customize button and its panel. On a phone the button is an icon and the panel is a sheet. `defaultOpen`
 * is for the shell, which mounts this once it is wanted: a press on its stand-in button opens the panel on arrival.
 */
export default function Customize({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { compact } = useDevice();
  const label = "Customize";
  return (
    <Popover defaultOpen={defaultOpen}>
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
