import { WorldSite } from "../world-site";
import type { PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "heat",
  title: "Heat",
  lede: "A night menu. Black slabs, cream words, and amber on what you pick.",
  order: 0.47,
  group: "Worlds",
  world: "heat",
  summary: "Games, sports, racing and live events. Black slabs banded in stripes, the row you are on held in amber brackets, levels as rows of dashes; a set whips in from the side and is gone at once.",
  tiers: [],
};

export default function HeatPage() {
  return <WorldSite material="heat" />;
}
