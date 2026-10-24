import { ProductPage } from "@/blocks/product";
import { Toaster } from "@/components/toast";
import { AppFrame, Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "product",
  title: "Product",
  lede: "One product's page, for a store.",
  order: 30.98,
  group: "Blocks",
  verbs: ["select", "press", "open"],
  summary:
    "One product's page: the pictures in the wider column beside the details (a carousel of one and a peek on a phone), the title as the page's one 18px line, the price under it, the options, the quantity and Add to cart as the one accent fill, and the rest in an accordion. Picking a frame shows that frame's picture; a sold-out pick says so and Add to cart turns to Sold out. Adding says Added, rolls the cart's count and offers View cart in a toast.",
  tiers: ["instant", "responsive", "expressive"],
  block: "product",
};

function DesktopDemo() {
  return (
    <Toaster>
      <AppFrame label="Product, desktop">
        <ProductPage />
      </AppFrame>
    </Toaster>
  );
}

function PhoneDemo() {
  return (
    <Toaster>
      <AppFrame label="Product, phone" phone>
        <ProductPage />
      </AppFrame>
    </Toaster>
  );
}

export default function ProductBlockPage() {
  return (
    <Page meta={meta}>
      <Stage
        title="Desktop"
        tier="expressive"
        size="lg"
        align="start"
        code="DesktopDemo"
        caption="Pick a frame: the first picture swaps to that frame, fading in on the instant tier. Pick A1 and Walnut fades in the frame row, because it is sold out at that size; pick it anyway and the legend says so and Add to cart turns to Sold out. Press Add to cart: it says Added for two seconds, the bag's count rolls and a toast offers View cart. Press a picture for the lightbox."
      >
        <DesktopDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="expressive"
        size="lg"
        align="start"
        code="PhoneDemo"
        caption="One column. The pictures are a carousel of one and a peek, moved by a swipe or its buttons. The details follow, with Add to cart the full width of the column. The cart rises as a bottom sheet."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
