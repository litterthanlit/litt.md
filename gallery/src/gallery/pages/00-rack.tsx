import { World } from "../world";
import type { PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "rack",
  title: "Rack",
  lede: "An instrument. Grey to work in, and the colour is the music's.",
  order: 0.4,
  group: "Worlds",
  world: "rack",
  summary: "Creative tools, editors and pro apps. Grey chrome and bright clip colours; things cut in on the beat, and nothing travels, grows or bounces.",
  tiers: [],
};

export default function RackPage() {
  return <World material="rack" />;
}
