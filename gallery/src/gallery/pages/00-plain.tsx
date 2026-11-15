import { WorldSite } from "../world-site";
import type { PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "plain",
  title: "Plain",
  lede: "No UI. A page that works.",
  order: 0.4,
  group: "Worlds",
  world: "plain",
  summary: "Docs, forms, admin and internal tools. Lines on paper, links that look like links, and nothing moves: a page changes in place, at once.",
  tiers: [],
};

export default function PlainPage() {
  return <WorldSite material="plain" />;
}
