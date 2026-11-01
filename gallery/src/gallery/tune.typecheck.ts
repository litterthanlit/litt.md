/**
 * What useTune's types promise, checked by `npm run typecheck` (tsconfig includes src). Nothing imports this file,
 * so none of it runs: each @ts-expect-error fails the typecheck the day its line starts to compile.
 */
import type { Transition } from "motion/react";
import type { CubicBezier } from "@/components/curve-editor";
import { useTune } from "@/components/tune";

export function useTypes() {
  const v = useTune("Type test", (t) => ({
    radius: t.radius("surface"),
    padding: t.space(24),
    size: t.choice(["sm", "md"], "sm"),
    float: t.toggle(false),
    enter: t.spring("expressive"),
    leave: t.easing("out"),
    blur: t.number(8, { min: 0, max: 40, unit: "px" }),
    go: t.action("Go", () => {}),
  }));
  const radius: string = v.radius;
  const padding: string = v.padding;
  const size: "sm" | "md" = v.size;
  const float: boolean = v.float;
  const enter: Transition = v.enter;
  const leave: CubicBezier = v.leave;
  const blur: number = v.blur;
  // @ts-expect-error a choice is one of its options, never another word
  const large: "lg" = v.size;
  // @ts-expect-error an action is a button in the panel, not a value
  void v.go;
  // @ts-expect-error a key the schema does not declare
  void v.margin;
  useTune("Type test spring", (t) => ({
    // @ts-expect-error a spring of your own names the tier it is checked against
    own: t.spring({ time: 0.3, bounce: 0.1 }), // litt-allow: a type test, never run
  }));
  useTune("Type test choice", (t) => ({
    // @ts-expect-error the start of a choice is one of its options
    size: t.choice(["sm", "md"], "lg"),
  }));
  return [radius, padding, size, float, enter, leave, blur, large] as const;
}
