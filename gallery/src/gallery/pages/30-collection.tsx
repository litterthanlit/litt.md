import { Collection } from "@/blocks/collection";
import { Toaster } from "@/components/toast";
import { AppFrame, Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "collection",
  title: "Collection",
  lede: "A store's products as a grid.",
  order: 30.99,
  group: "Blocks",
  verbs: ["select", "press", "open"],
  summary:
    "A store's products as a grid: the title and the count in two inks, the cart at the end, a filter row with what to show and the order, and product cards two across on a phone and in 14rem columns when wide. No buy buttons, so the page has no accent fill until the cart opens. A filter with nothing in it says so and offers the way back.",
  tiers: ["instant", "responsive", "expressive"],
  block: "collection",
};

function DesktopDemo() {
  return (
    <Toaster>
      <AppFrame label="Collection, desktop">
        <Collection />
      </AppFrame>
    </Toaster>
  );
}

function PhoneDemo() {
  return (
    <Toaster>
      <AppFrame label="Collection, phone" phone>
        <Collection />
      </AppFrame>
    </Toaster>
  );
}

export default function CollectionBlockPage() {
  return (
    <Page meta={meta}>
      <Stage
        title="Desktop"
        tier="responsive"
        size="lg"
        align="start"
        code="DesktopDemo"
        caption="Pick Warm or Cool and the grid shows those; In stock leaves Eclipse out. Order by price and the cards reorder at once. Hover a card and its fill steps once. Dusk is on sale, so its old price is struck through; Eclipse keeps its card and says Sold out."
      >
        <DesktopDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="responsive"
        size="lg"
        align="start"
        code="PhoneDemo"
        caption="Two cards across, every cover the same shape, so the rows stay even. The filter row wraps under the title, and the order's Select opens anchored under it."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
