import { useState } from "react";
import { AddToCart, Cart, CartButton, CartLine, CartSummary, useCartState } from "@/components/cart";
import { OptionPicker } from "@/components/option-picker";
import { Price } from "@/components/price";
import { findVariant } from "@/components/product-card";
import { toast, Toaster } from "@/components/toast";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";
import { CART_SEED, eur, lineFor, OPEN_WATER_PRINT, PRODUCTS } from "../shop";

export const meta: PageMeta = {
  id: "cart",
  title: "Cart",
  lede: "What someone is about to buy, in a sheet.",
  order: 21.4,
  group: "Commerce",
  verbs: ["press", "type", "open"],
  summary:
    "The cart is a sheet from the right, a bottom sheet on a phone: lines with a quantity and Remove, and a summary pinned at its foot with the subtotal rolling and Check out as its one accent fill. Remove is undone from a toast. Add to cart shows Added with a check for two seconds while the header's count rolls; nothing flies to the cart.",
  tiers: ["instant", "responsive", "expressive"],
};

export const docs: PageDocs = {
  components: ["cart"],
  exports: ["Cart", "CartButton", "AddToCart", "CartLine", "CartSummary", "useCartState"],
  usage: `import { AddToCart, Cart, CartButton, useCartState } from "@/components/cart";
import { toast, Toaster } from "@/components/toast";

// A cart in memory. With Shopify, useShopifyCart() from the shopify item returns the same shape.
const cart = useCartState();
const [open, setOpen] = useState(false);

<Toaster>
  <CartButton count={cart.count} onClick={() => setOpen(true)} />

  <AddToCart
    soldOut={!variant.available}
    onAdd={async () => {
      await cart.add({ variantId: variant.id, title: product.title, variantTitle: "A2 · Natural oak", price: variant.price, image });
      toast({ title: \`Added \${product.title}\`, action: { label: "View cart", onClick: () => setOpen(true) } });
    }}
  />

  <Cart open={open} onOpenChange={setOpen} cart={cart} freeShippingAt={{ amount: 250, currencyCode: "EUR" }} />
</Toaster>`,
  use: [
    "Any store: the cart sits one press away in the header and opens over the page, so browsing is never left.",
    "A product page's buy action. AddToCart is the page's one accent fill; the cart's Check out is the open sheet's.",
    "A cart that lives anywhere: in memory (useCartState), in Shopify (useShopifyCart), or in your own backend behind the same CartState shape.",
  ],
  skip: [
    "The checkout itself. Shopify's checkout is its own hosted page, so Check out goes to the cart's checkoutUrl. A checkout of your own is a Form.",
    "A cart page with room to spare, such as a desktop store with upsells. Use CartLine and CartSummary in your own layout.",
    "Opening the cart on every add. It interrupts browsing; the toast's View cart is one press away. Open it from onAdd only if your store needs that.",
  ],
  keyboard: [
    [["Enter"], "On the cart button, opens the cart. Focus lands on the first quantity."],
    [["ArrowUp", "ArrowDown"], "In a quantity, steps it by one."],
    [["Tab"], "Moves through each line's quantity and Remove, then Check out."],
    [["Esc"], "Closes the cart and puts focus back on the cart button."],
  ],
  a11y: [
    "The cart is a dialog named \"Cart\" and described by its count, with the focus trap, Esc and focus return of the Dialog.",
    "Each quantity is a spinbutton named \"Quantity of Open water\", and each Remove is named \"Remove Open water\", so a list of lines is never a list of identical buttons.",
    "After Remove, focus moves to the next line's Remove, or the previous one, or the empty state's action, never to the page behind. The toast says what went and offers Undo.",
    "The cart button is named \"Cart, 3 items\". The count rolls for sight; the name carries it in words.",
    "Add to cart's words change to \"Added\" for two seconds, and the toast says what was added, so the add is heard as well as seen.",
    "A sale price in a line reads \"Sale price … Regular price …\", and Check out is disabled while the cart is empty or a change is on its way.",
  ],
};

function CartDemo() {
  const cart = useCartState(CART_SEED);
  const [open, setOpen] = useState(false);
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4">
      <p className="text-body font-title text-fg">Field studies</p>
      <CartButton count={cart.count} onClick={() => setOpen(true)} />
      <Cart open={open} onOpenChange={setOpen} cart={cart} freeShippingAt={eur(350)} />
    </div>
  );
}

function AddDemo() {
  const product = OPEN_WATER_PRINT;
  const cart = useCartState();
  const [open, setOpen] = useState(false);
  const [frame, setFrame] = useState("Black");
  const picks = { Size: "A3", Frame: frame };
  const variant = findVariant(product, picks)!;
  return (
    <div className="grid w-full max-w-sm gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h3 className="text-body font-title text-fg">{product.title}, A3</h3>
          <Price price={variant.price} className="text-body" />
        </div>
        <CartButton count={cart.count} onClick={() => setOpen(true)} />
      </div>
      <OptionPicker name="Frame" values={product.options[1]!.values} value={frame} onValueChange={setFrame} />
      <AddToCart
        soldOut={!variant.available}
        onAdd={async () => {
          await new Promise((done) => setTimeout(done, 450)); // a store's round trip
          cart.add(lineFor(product, picks));
          toast({ title: `Added ${product.title}`, description: `A3 · ${frame}`, action: { label: "View cart", onClick: () => setOpen(true) } });
        }}
      />
      <Cart open={open} onOpenChange={setOpen} cart={cart} />
    </div>
  );
}

function LinesDemo() {
  const cart = useCartState([...CART_SEED, { id: "line-silk", ...lineFor(PRODUCTS[2]!, { Size: "A1", Frame: "Black" }) }]);
  return (
    <section aria-label="Your cart" className="litt-raised grid w-full max-w-xl gap-6 rounded-surface p-6">
      <ul aria-label="Items in your cart">
        {cart.items.map((item, i) => (
          <CartLine
            key={item.id}
            item={item}
            onQuantityChange={(q) => cart.update(item.id, q)}
            onRemove={() => {
              cart.remove(item.id);
              toast({ title: `Removed ${item.title}`, action: { label: "Undo", onClick: () => cart.restore(item, i) } });
            }}
          />
        ))}
      </ul>
      <div className="border-t border-line pt-6">
        <CartSummary subtotal={cart.subtotal} freeShippingAt={eur(350)} disabled={cart.items.length === 0} onCheckout={() => toast({ title: "Off to checkout" })} />
      </div>
    </section>
  );
}

function EmptyDemo() {
  const cart = useCartState();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4">
      <p className="text-body font-title text-fg">Field studies</p>
      <CartButton count={cart.count} onClick={() => setOpen(true)} />
      <Cart open={open} onOpenChange={setOpen} cart={cart} />
    </div>
  );
}

export default function CartPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Toaster>
        <Stage
          title="The cart"
          tier="expressive"
          align="start"
          code="CartDemo"
          caption="Press the bag. The sheet comes in from the right on the expressive tier (on a phone it rises from the bottom and drags down to close). Step a quantity and the subtotal rolls on the responsive tier, and the Meter says how far to free shipping. Remove a line: it goes at once, focus moves to the next line, and the toast offers Undo. Check out is the sheet's one accent fill."
        >
          <CartDemo />
        </Stage>

        <Stage
          title="Add to cart"
          tier="responsive"
          align="start"
          code="AddDemo"
          caption="Press Add to cart. The spinner holds the button's place while the store answers, then it says Added with a check for two seconds; both labels share one cell, so the box keeps its size. The bag's count rolls where the cart lives, and the toast says what was added with View cart. The cart does not open by itself, and nothing flies to it."
        >
          <AddDemo />
        </Stage>

        <Stage
          title="Lines on a page"
          align="start"
          code="LinesDemo"
          caption="CartLine and CartSummary on their own, for a cart page. Each line keeps its quantity and Remove; a sale line strikes its old price through, and a line of two says what one costs. The subtotal rolls when a quantity changes."
        >
          <LinesDemo />
        </Stage>

        <Stage
          title="Empty"
          tier="expressive"
          align="start"
          code="EmptyDemo"
          caption="An empty cart says so in one sentence and offers one way back to the products. There is no Check out to press."
        >
          <EmptyDemo />
        </Stage>
      </Toaster>
    </Page>
  );
}
