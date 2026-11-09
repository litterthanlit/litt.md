import { World } from "../world";
import type { PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "device",
  title: "Device",
  lede: "Hardware. Keys, wells and LCD glass, every word in the mono.",
  order: 0.3,
  group: "Worlds",
  world: "device",
  summary: "Agents, terminals and tools. Things are mechanisms: a set switches on in place in steps, and nothing fades or travels.",
  tiers: [],
};

export default function DevicePage() {
  return <World material="device" />;
}
