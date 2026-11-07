import { World } from "../world";
import type { PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "flat",
  title: "Flat",
  lede: "Grey is the object. Nothing casts.",
  order: 0.2,
  group: "Worlds",
  wall: true,
  world: "flat",
  summary: "Sites, portfolios and reading, and what the gallery opens in. Things come from where you touched them: a set deals out of what opened it and gathers back.",
  tiers: [],
};

export default function FlatPage() {
  return <World material="flat" />;
}
