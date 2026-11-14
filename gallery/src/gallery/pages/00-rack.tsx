import { World } from "../world";
import type { PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "rack",
  title: "Rack",
  lede: "An instrument. Every value in reach, and what is on is lit.",
  order: 0.4,
  group: "Worlds",
  world: "rack",
  summary: "Creative tools, editors and pro apps. Things cut in on the beat: a set appears column by column, and nothing travels, grows or bounces.",
  tiers: [],
};

export default function RackPage() {
  return <World material="rack" />;
}
