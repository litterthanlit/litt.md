import { World } from "../world";
import type { PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "heat",
  title: "Heat",
  lede: "Hard edges, one lime, and everything arrives at speed.",
  order: 0.47,
  group: "Worlds",
  world: "heat",
  summary: "Games, sports, racing and live events. Slabs on asphalt, keys on a hard ledge, one lime for what is selected; a set whips in from the side and is gone at once.",
  tiers: [],
};

export default function HeatPage() {
  return <World material="heat" />;
}
