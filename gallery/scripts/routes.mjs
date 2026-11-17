/**
 * Every address a page check should visit (plans/019): the gallery's own pages, then each world's player, its About
 * page, its gallery view and every component page in it (#device, #device/about, #device/components, #device/button
 * …), read from each page's `export const meta` in src/gallery/pages, as wall.mjs reads it. Each world is closed, so a component's page is
 * checked once per world it belongs to (meta.worlds), in that world's own bodies.
 *
 *   import { routes } from "./routes.mjs";
 *   routes()                    every address
 *   routes({ only: ["button"] })  the addresses of the button page in every world, or exact addresses ("device/button")
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PAGES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "gallery", "pages");
export const WORLD_IDS = ["press", "flat", "device", "plain", "rack", "heat"];
/** A world's pages of the gallery's own beside about and components (OWN_PAGES in world-site.tsx): Device's voices. */
export const OWN_PAGES = { device: ["sound"] };

/** Each page's id, group, world (for a world page) and worlds (for a part in fewer than all), in file order. */
export function pageMetas() {
  return fs
    .readdirSync(PAGES_DIR)
    .filter((f) => /^\d+-.+\.tsx$/.test(f))
    .sort()
    .flatMap((f) => {
      const meta = /export\s+const\s+meta\b[\s\S]*?\n\};?/.exec(fs.readFileSync(path.join(PAGES_DIR, f), "utf8"))?.[0] ?? "";
      const id = /\bid:\s*"([^"]+)"/.exec(meta)?.[1];
      if (!id) return [];
      const group = /\bgroup:\s*"([^"]+)"/.exec(meta)?.[1];
      const world = /\bworld:\s*"([^"]+)"/.exec(meta)?.[1];
      const worlds = /\bworlds:\s*\[([^\]]*)\]/.exec(meta)?.[1];
      return [{ id, group, world, worlds: worlds ? [...worlds.matchAll(/"([^"]+)"/g)].map((m) => m[1]) : null }];
    });
}

export function routes({ only = [] } = {}) {
  const metas = pageMetas();
  const site = metas.filter((p) => !p.group && !p.world).map((p) => p.id);
  const parts = metas.filter((p) => p.group && p.group !== "Worlds" && !p.world);
  const inWorld = WORLD_IDS.flatMap((w) => [w, `${w}/about`, `${w}/components`, ...(OWN_PAGES[w] ?? []).map((p) => `${w}/${p}`), ...parts.filter((p) => !p.worlds || p.worlds.includes(w)).map((p) => `${w}/${p.id}`)]);
  const all = [...site, ...inWorld];
  if (!only.length) return all;
  return all.filter((r) => only.includes(r) || only.includes(r.split("/").pop()) || only.includes(r.split("/")[0]));
}

/**
 * A component page holds its other stages and Try it under one disclosure, Variants (kit.tsx, plans/024 phase 0). A
 * check that reads a page's main opens it first, so what it holds is checked as it was when it lay open, and waits for
 * what it loads (Try it reads the docs layer).
 */
export async function openVariants(pg) {
  const button = pg.locator('main button[data-variants][aria-expanded="false"]');
  if (!(await button.count())) return;
  await button.first().click({ timeout: 2000 });
  await pg.waitForLoadState("networkidle");
  await pg.waitForTimeout(100);
}
