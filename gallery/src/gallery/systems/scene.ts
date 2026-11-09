/**
 * A scene: one small piece of a product, built from the litt parts, that shows a system (a world) at work. A system's
 * page (world.tsx) runs its scenes one after another, each under its own title, and the Systems index shows one as the
 * system's card. Each world's scenes live in their own file (press.tsx, flat.tsx, device.tsx) and are about what that
 * world is for (look.ts, audience), so the three pages read as three products, not one product in three coats.
 *
 * A scene is drawn by the page inside a stage, centred, at most 28rem wide, in the page's material. It:
 * - uses only `@/components/*` and tokens: no hex, radii on the scale, nothing above 18px;
 * - has no heading above h3 (the page gives it its h2) and no landmark of its own;
 * - holds no accent fill: the system page's one accent is its Install button (R6);
 * - moves nothing on its own (R4) and takes no focus on mount;
 * - is live: its controls work, and its state stays inside it.
 */
import type { ComponentType } from "react";

export type Scene = {
  /** The anchor on the system's page, kebab-case. */
  id: string;
  /** The section's title, two or three words, sentence case: what the scene is, "A deploy", "Notifications". */
  title: string;
  /** One sentence under the title, saying what the scene shows of the world. */
  line: string;
  /** The scene itself. */
  Render: ComponentType;
};

export type SystemScenes = {
  scenes: Scene[];
  /** The id of the scene the Systems index shows as this system's card. */
  cover: string;
};
