/**
 * The deck: the overview's hero object. litt's own controls at their real size, wired to the whole gallery, so the
 * first thing a visitor touches is the material itself and the wall under it answers.
 *
 * - It is the header's Customize, made physical: fun mode on the Switch, the shape on the post Slider, the theme, the
 *   material and the accent on Segmented controls. Every control reads and writes customize-state.tsx, so the deck, the header's
 *   theme switch and the Customize panel are one set of choices and can never disagree.
 * - A plate in the page flow (R3, flat: surface-1, the hairline and the top highlight), with the controls on it.
 *   Nothing here takes the accent: the hero's Get started is the first screen's one fill (R6), and the deck's Accent
 *   shows on it. Each accent's segment carries a small chip in its color (swatch.tsx), aria-hidden, a sample and not a
 *   fill.
 * - Each value is said in words (R5): On or Off, the shape's name, the theme, the material and the accent by name.
 * - The fun row and the footer are fun cues (data-fun-cue): they say On and Tuned in fun mode, so a Calm and Fun
 *   comparison hides them.
 */
import { Button } from "@/components/button";
import { Slider } from "@/components/slider";
import { shapeName, SHAPES } from "@/motion/rules";
import { useCustomize } from "./customize-state";
import { lookWords } from "./look";
import { AccentControl, FunControl, MaterialControl, ThemeControl } from "./look-controls";

const STOPS = SHAPES.map((_, i) => i);

export function Deck() {
  const { radius, lockedRadius, setRadius, link, modified, reset } = useCustomize();
  const stop = (SHAPES as readonly number[]).indexOf(radius);
  return (
    <section aria-labelledby="deck-title" className="litt-raised grid gap-8 p-6 sm:p-8">
      <header className="grid gap-1">
        <h2 id="deck-title" className="text-body font-title text-fg">
          Tune the gallery
        </h2>
        <p className="text-small text-fg-subtle">Every component on this page follows.</p>
      </header>
      <div data-fun-cue="" className="-my-2">
        <FunControl />
      </div>
      <Slider
        label="Shape"
        value={stop}
        min={0}
        max={STOPS.length - 1}
        step={1}
        marks={STOPS}
        home={(SHAPES as readonly number[]).indexOf(lockedRadius)}
        formatValue={(i) => shapeName(SHAPES[i])}
        minLabel="Square"
        maxLabel="Pill"
        onValueChange={(i) => setRadius(SHAPES[i])}
      />
      <ThemeControl />
      <MaterialControl />
      <AccentControl />
      {/* As tall with Reset as without, so the deck never grows under the hand that changed it. */}
      <footer data-fun-cue="" className="-mt-2 border-t border-line pt-4">
        <div className="flex h-control-sm items-center justify-between gap-4 pointer-coarse:h-control-md">
          <p className="text-caption font-normal text-fg-subtle" aria-live="polite">
            {link ? `From a link: ${lookWords(link.look)}.` : modified ? "Tuned in this browser." : "The gallery's defaults: monochrome, flat, calm, the locked shape."}
          </p>
          {modified && (
            <Button size="sm" variant="ghost" onClick={reset}>
              Reset
            </Button>
          )}
        </div>
      </footer>
    </section>
  );
}
