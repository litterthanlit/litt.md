/**
 * What an object runs, one take at a time (plans/018, decision 3): the studio app first, the same in every world so
 * the worlds compare, then the world's own scenes (systems/<world>.tsx) in their page order, so its depth shows.
 */
import type { ComponentType } from "react";
import type { Material } from "../look";
import { scenesOf } from "../systems";

/** The app is take 0, drawn by the page; a scene brings its own Render. */
export type Take =
  | { id: "studio"; title: string; kind: "app" }
  | { id: string; title: string; kind: "scene"; Render: ComponentType };

export const STUDIO: Take = { id: "studio", title: "Studio", kind: "app" };

const loaded = new Map<Material, Promise<Take[]>>();

/** The world's takes, one promise per world for the life of the page, so React's use() can read it. */
export function takesOf(material: Material): Promise<Take[]> {
  let p = loaded.get(material);
  if (!p) {
    p = scenesOf(material).then(({ scenes }) => [STUDIO, ...scenes.map((s): Take => ({ id: s.id, title: s.title, kind: "scene", Render: s.Render }))]);
    loaded.set(material, p);
  }
  return p;
}
