/** Each world's scenes load on demand, once: a system page needs its own, the Systems page all three covers. */
import type { Material } from "../look";
import type { SystemScenes } from "./scene";

const LOADERS: Record<Material, () => Promise<SystemScenes>> = {
  press: () => import("./press").then((m) => m.press),
  flat: () => import("./flat").then((m) => m.flat),
  device: () => import("./device").then((m) => m.device),
};

const loaded = new Map<Material, Promise<SystemScenes>>();

/** The world's scenes, one promise per world for the life of the page, so React's use() can read it. */
export function scenesOf(material: Material): Promise<SystemScenes> {
  let p = loaded.get(material);
  if (!p) loaded.set(material, (p = LOADERS[material]()));
  return p;
}

export type { Scene, SystemScenes } from "./scene";
