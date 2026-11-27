import { WorldSite } from "../world-site";
import type { PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "plain",
  title: "Plain",
  lede: "No UI. A page that works.",
  order: 0.4,
  group: "Worlds",
  world: "plain",
  summary: "Docs, forms, admin, internal tools and agentic workspaces. Bare 1px lines on paper in Helvetica Neue, links that look like links, bare-paper data, and Subtraction motion with zero bounce.",
  tiers: ["instant", "responsive", "expressive"],
};

export default function PlainPage() {
  return <WorldSite material="plain" />;
}
