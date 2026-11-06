/**
 * Customize, the panel: the header's button and the popover with the accent, the material, motion's feel, the theme,
 * the shape and the typeface. It loads on its own, so the shell stays small; the state and the writes on <body> live in
 * customize-state.tsx.
 *
 * Two sections, by where a choice goes. Look (the accent, the material and motion's feel) is what Copy setup and Copy
 * link carry, so Your look sits under its three controls. This browser (the theme, the shape and the face) stays here.
 * A choice whose picture says more than its word is a tile (the registry's CardPicker at sm): each accent as a small
 * button in its color, each material as a block in its tray, each shape as a card and a control at that radius, each
 * face as "Aa". A choice the word says whole is a row: the theme on a Segmented control, fun motion on a Switch, as
 * the overview's deck has them. Surprise me shuffles the accent, the material, the shape, the face and the feel at
 * once, and says what it picked.
 */
import { useEffect, useState, type CSSProperties } from "react";
import { useDevice } from "@/motion";
import { customizeSnippet, shapeName, shapeRule, shapeSurface, SHAPES, typeRule } from "@/motion/rules";
import { Button } from "@/components/button";
import { CardPicker } from "@/components/card-picker";
import { LinkIcon, SlidersIcon, SparkleIcon } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { Segmented } from "@/components/segmented";
import { Switch } from "@/components/switch";
import { Tag } from "@/components/tag";
import { useCustomize, useDark, type ThemeChoice } from "./customize-state";
import { CopyButton } from "./docs/copy";
import { SITE } from "./docs/copy-prompt";
import { accentName, accentOf, ACCENTS, GALLERY_LOOK, lookAttributes, lookInApp, lookSetup, lookWords, materialOf, MATERIALS, withLook, type Accent, type Material } from "./look";
import { AccentChip } from "./swatch";
import { loadTypeface } from "./typeface";

/* What to set for each accent is in Copy setup, under Your look. */
const accentRule: Record<Accent, string> = {
  mono: "Monochrome fits R6: the primary action takes the ink.",
  blue4: "Blue 4 is what tokens.css ships: nothing to set.",
  pink: "Pink fits R6: its tones ship in tokens.css, 0.12 from every data hue.",
};

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

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
  const rows = [
    typeRule(type),
    shapeRule(radius),
    { ok: true, text: accentRule[look.accent] },
    ...(look.material === "flat" ? [{ ok: true, text: "Flat fits R3: the depth ladder by fill alone. Copy setup says how to set data-material." }] : []),
    ...(look.material === "device"
      ? [{ ok: true, text: "Device fits R3 in hardware: keys, wells and LCD glass. Copy setup says how to set data-material." }]
      : []),
    ...(look.fun
      ? [{ ok: false, cue: true, text: "Fun mode is a trial: its springs bounce past the locked 0.12. Copy setup says how to wrap your app in <FunMode>, and the changelog says if the trial ends." }]
      : []),
  ];
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
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-small text-fg-subtle">Every page follows. The motion dial lives in the Playground.</p>
          <Button size="sm" icon={<SparkleIcon />} onClick={surprise} className="shrink-0">
            Surprise me
          </Button>
        </div>
        <p aria-live="polite" className={"text-caption font-normal text-fg " + (said ? "" : "sr-only")}>
          {said}
        </p>
      </div>

      {/* The look: what leaves this browser, so its three choices sit with the words and the links that carry them. */}
      <section aria-labelledby="customize-look" className="grid gap-6">
        <Heading id="customize-look" title="Look" note="Goes with Copy setup and Copy link" />
        <CardPicker
          size="sm"
          legend="Accent"
          value={look.accent}
          onValueChange={(accent) => setLook({ accent })}
          options={ACCENTS.map((a) => ({ value: a.id, label: accentName(a.id, look.material, true), picture: <AccentChip accent={a.id} /> }))}
        />
        <CardPicker
          size="sm"
          legend="Material"
          value={look.material}
          onValueChange={(material) => setLook({ material })}
          options={MATERIALS.map((m) => ({ value: m.id, label: m.name, picture: <MaterialPreview material={m.id} /> }))}
        />
        <div data-fun-cue="" className="-my-1">
          <Switch label="Fun motion" description="Springier, the same at rest." checked={look.fun} onCheckedChange={(fun) => setLook({ fun })} align="end" />
        </div>
        <div role="group" aria-labelledby="your-look" className="grid gap-3">
          <div className="grid gap-1">
            <p className="flex flex-wrap items-baseline gap-x-2 text-small">
              <span id="your-look" className="font-title text-fg">
                Your look
              </span>
              <span data-fun-cue="" className="text-fg-muted">
                {lookWords(look)}
              </span>
            </p>
            <p data-fun-cue="" className="text-caption font-normal text-fg-subtle">
              {lookInApp(look)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={lookSetup(look, SITE)}>Copy setup</CopyButton>
            <CopyButton text={withLook(location.href, look)} variant="ghost" icon={<LinkIcon />}>
              Copy link
            </CopyButton>
          </div>
        </div>
      </section>

      {/* This browser: what stays here. Theme is a word, so it takes a row; shape and face show themselves. */}
      <section aria-labelledby="customize-browser" className="grid gap-6 border-t border-line pt-6">
        <Heading id="customize-browser" title="This browser" note="Saved here, never in a link" />
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

      <div className="grid gap-3 border-t border-line pt-6">
        {modified ? (
          <>
            <ul className="grid gap-2" aria-label="Against the litt.md rules">
              {rows.map((c) => (
                <li key={c.text} data-fun-cue={"cue" in c ? "" : undefined} className="flex items-start gap-2 text-small">
                  <Tag status={c.ok ? "success" : "warning"}>{c.ok ? "Fits" : "Change"}</Tag>
                  <span className={"pt-0.5 " + (c.ok ? "text-fg-subtle" : "text-fg-muted")}>{c.text}</span>
                </li>
              ))}
            </ul>
            {snippet && (
              <pre tabIndex={0} aria-label="Tokens to paste into tokens.css" className="max-h-40 overflow-auto rounded-control bg-surface-2 p-3 font-mono text-caption font-normal text-fg-muted shadow-[inset_0_0_0_1px_var(--line)]">
                {snippet}
              </pre>
            )}
            <div className="flex gap-2">
              {snippet && <CopyButton text={snippet}>Copy tokens</CopyButton>}
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
            </div>
          </>
        ) : (
          <p className="text-caption font-normal text-fg-subtle">
            The gallery's defaults: {typeface.name}, {shapeName(radius)} controls and {shapeSurface(radius)}px surfaces, {accentOf(GALLERY_LOOK.accent).name.toLowerCase()}, {materialOf(GALLERY_LOOK.material).name.toLowerCase()} and calm motion. The registry ships Blue 4 and press.
          </p>
        )}
      </div>
    </div>
  );
}

/** A section's name, and in a quieter line what happens to the choices under it. */
function Heading({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <div className="grid gap-1">
      <h3 id={id} className="text-body font-title text-fg">
        {title}
      </h3>
      <p className="text-caption font-normal text-fg-subtle">{note}</p>
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
