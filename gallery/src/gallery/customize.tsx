/**
 * Customize, the panel: the header's button and the popover with the typeface,
 * the radius, the accent and motion's feel. It loads on its own, so the shell stays small; the state and
 * the writes on <body> live in customize-state.tsx.
 */
import { useState } from "react";
import { useDevice } from "@/motion";
import { customizeSnippet, shapeName, shapeRule, shapeSurface, SHAPES, typeRule } from "@/motion/rules";
import { Button } from "@/components/button";
import { CheckIcon, CopyIcon, SlidersIcon } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { Segmented } from "@/components/segmented";
import { Tag } from "@/components/tag";
import { useCustomize } from "./customize-state";

function CustomizePanel() {
  const { typefaces, typeface, setTypeface, radius, lockedRadius, setRadius, accent, setAccent, fun, setFun, modified, reset } = useCustomize();
  const [copied, setCopied] = useState(false);
  const type = { name: typeface.name, stack: typeface.stack, locked: typefaces[0].name };
  const rows = [
    typeRule(type),
    shapeRule(radius),
    ...(accent === "mono" ? [{ ok: true, text: "Monochrome fits R6: the primary action takes the ink. Set data-accent=\"mono\" on <html> or <body>; there are no tokens to paste." }] : []),
    ...(fun ? [{ ok: false, text: "Fun mode is a trial: its springs bounce past the locked 0.12. Nothing to paste yet; if it wins, it goes into tokens.css and the rules." }] : []),
  ];
  const snippet = customizeSnippet(radius, lockedRadius, type);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the snippet is on screen to select by hand */
    }
  };

  return (
    <div className="grid gap-6">
      <p className="text-small text-fg-subtle">Type, shape, the accent and how motion feels, for every page, saved in this browser. The motion dial lives in the Playground.</p>
      <Segmented
        legend="Typeface"
        showLegend
        block
        size="sm"
        value={typeface.id}
        onValueChange={setTypeface}
        options={typefaces.map((f) => ({ value: f.id, label: f.short ?? f.name }))}
      />
      <Segmented
        legend="Radius"
        showLegend
        block
        size="sm"
        value={String(radius)}
        onValueChange={(v) => setRadius(Number(v))}
        options={SHAPES.map((r) => ({ value: String(r), label: shapeName(r) }))}
      />
      <Segmented
        legend="Accent"
        showLegend
        block
        size="sm"
        value={accent}
        onValueChange={setAccent}
        options={[
          { value: "blue4", label: "Blue 4" },
          { value: "mono", label: "Monochrome" },
        ]}
      />
      <Segmented
        legend="Motion"
        showLegend
        block
        size="sm"
        value={fun ? "fun" : "calm"}
        onValueChange={(v) => setFun(v === "fun")}
        options={[
          { value: "calm", label: "Calm" },
          { value: "fun", label: "Fun" },
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
              <Button size="sm" variant="ghost" onClick={reset}>
                Reset to locked
              </Button>
            </div>
          </>
        ) : (
          <p className="text-caption font-normal text-fg-subtle">
            Locked: {typeface.name}, {shapeName(radius)} controls and {shapeSurface(radius)}px surfaces, Blue 4, calm motion.
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
