/**
 * Customize, the panel: the header's button and the popover with the accent, the theme, the shape, the typeface and
 * motion's feel. It loads on its own, so the shell stays small; the state and the writes on <body> live in
 * customize-state.tsx.
 *
 * Every choice is a tile that shows what it does before it says it (tiles.tsx): each accent as a small button in its
 * color, each theme as a small window, each shape as a card and a control at that radius, each face as "Aa", and
 * Calm and Fun as a dot that moves on that mode's spring when it is picked. Surprise me shuffles the accent, the shape,
 * the face and the feel at once, and says what it picked.
 */
import { useEffect, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { FUN_SPRINGS, useDevice, useTransition } from "@/motion";
import { customizeSnippet, shapeName, shapeRule, shapeSurface, SHAPES, typeRule } from "@/motion/rules";
import { Button } from "@/components/button";
import { CheckIcon, CopyIcon, SlidersIcon, SparkleIcon } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { Tag } from "@/components/tag";
import { accentScope, useCustomize, type ThemeChoice } from "./customize-state";
import { accentOf, ACCENTS, GALLERY_LOOK, type Accent } from "./look";
import { AccentChip } from "./swatch";
import { Tiles } from "./tiles";
import { loadTypeface } from "./typeface";

const accentRule: Record<Accent, string> = {
  mono: 'Monochrome fits R6: the primary action takes the ink. Set data-accent="mono" on <html> or <body>; there are no tokens to paste.',
  blue4: "Blue 4 is what tokens.css ships: nothing to set.",
  pink: 'Pink fits R6: its tones ship in tokens.css, 0.12 from every data hue. Set data-accent="pink" on <html> or <body>.',
};

/** A page in one theme, as a small window: a title line, a body line and the primary action in the current accent. */
function Window({ dark, accent, className = "" }: { dark: boolean; accent: Accent; className?: string }) {
  return (
    <span
      {...accentScope(accent, dark)}
      style={{ "--radius-control": "4px" } as CSSProperties}
      className={"grid h-8 w-12 grid-rows-[auto_auto_1fr] gap-1 rounded-control bg-canvas p-1.5 shadow-[inset_0_0_0_1px_var(--line-strong)] " + className}
    >
      <span className="h-1 w-5 rounded-pill bg-fg" />
      <span className="h-1 w-8 rounded-pill bg-[color-mix(in_oklab,var(--fg)_30%,transparent)]" />
      <span className="h-2 w-4 self-end justify-self-end rounded-pill bg-accent" />
    </span>
  );
}

function ThemePreview({ theme, accent }: { theme: ThemeChoice; accent: Accent }) {
  if (theme !== "system") return <Window dark={theme === "dark"} accent={accent} />;
  return (
    <span className="relative h-8 w-12">
      <Window dark={false} accent={accent} className="absolute inset-0" />
      <Window dark accent={accent} className="absolute inset-0 [clip-path:inset(0_0_0_50%)]" />
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

/** A dot on a rail that crosses when its tile is picked, on that feel's spring: the responsive tier, or fun mode's pop. */
function FeelPreview({ fun, on }: { fun: boolean; on: boolean }) {
  const responsive = useTransition("responsive");
  const pop = { type: "spring", visualDuration: FUN_SPRINGS.pop.time, bounce: FUN_SPRINGS.pop.bounce } as const;
  return (
    <span className="relative h-2 w-10 rounded-pill bg-tray shadow-(--tray-shade)">
      <motion.span
        initial={false}
        animate={{ x: on ? 28 : 0 }}
        transition={fun ? pop : responsive}
        className="absolute -top-0.5 left-0 size-3 rounded-pill bg-current"
      />
    </span>
  );
}

function CustomizePanel() {
  const { theme, setTheme, typefaces, typeface, setTypeface, radius, lockedRadius, setRadius, accent, setAccent, fun, setFun, modified, reset } = useCustomize();
  const [copied, setCopied] = useState(false);
  const [said, setSaid] = useState("");
  const type = { name: typeface.name, stack: typeface.stack, locked: typefaces[0].name };
  const rows = [
    typeRule(type),
    shapeRule(radius),
    { ok: true, text: accentRule[accent] },
    ...(fun ? [{ ok: false, text: "Fun mode is a trial: its springs bounce past the locked 0.12. Nothing to paste yet; if it wins, it goes into tokens.css and the rules." }] : []),
  ];
  const snippet = customizeSnippet(radius, lockedRadius, type);

  /* Every face draws its own "Aa", so each loads once the panel opens. */
  useEffect(() => typefaces.forEach(loadTypeface), [typefaces]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the snippet is on screen to select by hand */
    }
  };

  const surprise = () => {
    const other = <T,>(all: readonly T[], now: T) => {
      const rest = all.filter((x) => x !== now);
      return rest[Math.floor(Math.random() * rest.length)];
    };
    const a = other(ACCENTS.map((x) => x.id), accent);
    const r = other(SHAPES, radius);
    const f = other(typefaces, typeface);
    const feel = Math.random() < 0.5;
    setAccent(a);
    setRadius(r);
    setTypeface(f.id);
    setFun(feel);
    const accentName = accentOf(a).name;
    setSaid(`${accentName}, ${shapeName(r).toLowerCase()} corners, ${f.name} and ${feel ? "fun" : "calm"} motion.`);
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-4">
          <p className="text-small text-fg-subtle">Every page follows, saved in this browser. The motion dial lives in the Playground.</p>
          <Button size="sm" icon={<SparkleIcon />} onClick={surprise} className="shrink-0">
            Surprise me
          </Button>
        </div>
        <p aria-live="polite" className={"text-caption font-normal text-fg " + (said ? "" : "sr-only")}>
          {said}
        </p>
      </div>
      <Tiles
        legend="Accent"
        value={accent}
        onValueChange={setAccent}
        tiles={ACCENTS.map((a) => ({ value: a.id, label: a.short ?? a.name, preview: <AccentChip accent={a.id} /> }))}
      />
      <Tiles
        legend="Theme"
        value={theme}
        onValueChange={setTheme}
        tiles={(["light", "dark", "system"] as const).map((t) => ({
          value: t,
          label: t === "light" ? "Light" : t === "dark" ? "Dark" : "System",
          preview: <ThemePreview theme={t} accent={accent} />,
        }))}
      />
      <Tiles
        legend="Shape"
        value={String(radius)}
        onValueChange={(v) => setRadius(Number(v))}
        tiles={SHAPES.map((r) => ({ value: String(r), label: shapeName(r), preview: <ShapePreview radius={r} /> }))}
      />
      <Tiles
        legend="Typeface"
        value={typeface.id}
        onValueChange={setTypeface}
        tiles={typefaces.map((f) => ({
          value: f.id,
          label: f.short ?? f.name,
          preview: (
            <span className="text-display font-title" style={{ fontFamily: f.stack }}>
              Aa
            </span>
          ),
        }))}
      />
      <Tiles
        legend="Motion"
        value={fun ? "fun" : "calm"}
        onValueChange={(v) => setFun(v === "fun")}
        tiles={[
          { value: "calm", label: "Calm", preview: <FeelPreview fun={false} on={!fun} /> },
          { value: "fun", label: "Fun", preview: <FeelPreview fun on={fun} /> },
        ]}
      />
      <div className="grid gap-3 border-t border-line pt-4">
        {modified ? (
          <>
            <ul className="grid gap-2" aria-label="Against the litt.md rules">
              {rows.map((c) => (
                <li key={c.text} className="flex items-start gap-2 text-small">
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
              {snippet && (
                <Button size="sm" icon={copied ? <CheckIcon /> : <CopyIcon />} onClick={copy}>
                  {copied ? "Copied" : "Copy tokens"}
                </Button>
              )}
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
            The gallery's defaults: {typeface.name}, {shapeName(radius)} controls and {shapeSurface(radius)}px surfaces, {accentOf(GALLERY_LOOK.accent).name.toLowerCase()} and calm motion. The registry ships Blue 4.
          </p>
        )}
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
      <PopoverTrigger asChild>
        {compact ? (
          <Button size="sm" variant="ghost" iconOnly aria-label={label}>
            <SlidersIcon />
          </Button>
        ) : (
          <Button size="sm" variant="ghost" icon={<SlidersIcon />}>
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
