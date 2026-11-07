import { World } from "../world";
import type { PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "press",
  title: "Press",
  lede: "Lit from above. Objects you can hold.",
  order: 0.1,
  group: "Worlds",
  wall: true,
  world: "press",
  summary: "Product UI, settings and dashboards, and what the registry installs. Things have weight: a set settles into place from above and nothing flies.",
  tiers: [],
};

export default function PressPage() {
  return <World material="press" />;
}
