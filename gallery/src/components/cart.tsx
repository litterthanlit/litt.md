/**
 * Cart: the lines someone is about to buy, in a sheet, and the controls around it (components.md, "Cart").
 *
 * - The cart is plain data (CartItem) behind one small interface (CartState: items, count, subtotal, add, update,
 *   remove, restore), so the parts do not care where it lives. useCartState keeps one in memory, for a demo or a store
 *   without a backend; the `shopify` item's useShopifyCart keeps one in Shopify, with the same shape.
 * - Cart: the Dialog at side="right", so it is a bottom sheet on compact screens that sits above the keyboard and
 *   drags down to close. The lines scroll in the body; the summary is the footer, so it never scrolls away.
 * - CartLine: a 64px picture at 1/1 and the control radius, the title at the body size and the title weight in --fg,
 *   the picked options under it at the small size in --fg-subtle, and the line's price at the end ("€90 each" under it
 *   when there are several). Under them, a Number field at sm for the quantity, its label hidden ("Quantity of Open
 *   water" for screen readers), and Remove as an sm ghost button named "Remove Open water". Lines are a ul split by
 *   --line hairlines, 16px above and below.
 * - Remove: a line goes at once, with Undo in a toast ("Removed Open water"). No confirm: it can be undone. Focus moves
 *   to the next line's Remove, or the previous one, or the empty state's action, never to the page behind. The toast
 *   needs a Toaster mounted once near the root.
 * - CartSummary: an optional free-shipping Meter in --fg, never a hue ("€12 to free shipping", then "Free shipping"),
 *   the subtotal as a labelled figure at the end of its row, its figure a Rolling number, "Taxes and shipping at
 *   checkout." at the small size in --fg-subtle, and Check out: a primary md button the width of the sheet, the open
 *   cart's one accent fill (P1). It goes to checkoutUrl (Shopify's hosted checkout), or runs onCheckout.
 * - Empty: the Empty state, "Your cart is empty", and one secondary action back to the products. No Check out.
 * - CartButton: the header's way in, a ghost button with the bag icon and the count in the mono, named "Cart, 3 items".
 *   The count is a Rolling number, so an add is seen where the cart lives.
 * - AddToCart: the product's primary action. While the add is in flight it shows the Button's spinner; then it says
 *   "Added" with a check for 2s, colors and the label only (the box never changes size, both labels share one cell).
 *   Sold out, it is a disabled "Sold out". The page fires its own toast ("Added Open water", with View cart); the cart
 *   never opens by itself unless the page opens it.
 * - Motion: the sheet's own, and the Rolling numbers. Lines leave at once, quantities change at once. Nothing flies to
 *   the cart: motion confirms, it never performs.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, type ButtonSize } from "@/components/button";
import { Meter } from "@/components/chart";
import { Dialog, DialogContent } from "@/components/dialog";
import { BagIcon, CheckIcon } from "@/components/icons";
import { Media } from "@/components/media";
import { NumberField } from "@/components/number-field";
import { formatMoney, multiplyMoney, sumMoney, Price, type Money } from "@/components/price";
import type { ProductImage } from "@/components/product-card";
import { RollingNumber } from "@/components/rolling-number";
import { Empty } from "@/components/states";
import { toast } from "@/components/toast";

/** One line of a cart: a variant and how many. */
export type CartItem = {
  /** The line's own id. The local cart makes one; Shopify gives its cart line's id. */
  id: string;
  /** The variant the line buys. Adding the same variant again adds to its line. */
  variantId: string;
  /** The product's name. */
  title: string;
  /** The picks in words: "A2 · Natural oak". */
  variantTitle?: string;
  quantity: number;
  /** The price of one. */
  price: Money;
  /** What one cost before a sale. */
  compareAt?: Money | null;
  image?: ProductImage;
  /** The most anyone may buy, such as the stock left. */
  maxQuantity?: number;
};

/** What the cart parts need from a cart, wherever it lives. useCartState and useShopifyCart both return it. */
export type CartState = {
  items: CartItem[];
  /** How many things, adding up the quantities. */
  count: number;
  subtotal: Money;
  /** The store's checkout page, when it has one (Shopify's cart.checkoutUrl). */
  checkoutUrl?: string;
  /** True while a change is on its way to the store. */
  pending?: boolean;
  /** Adds a variant, or adds to its line if it is already in the cart. */
  add: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void | Promise<void>;
  /** Sets a line's quantity. */
  update: (id: string, quantity: number) => void | Promise<void>;
  /** Takes a line out. */
  remove: (id: string) => void | Promise<void>;
  /** Puts a removed line back where it was, for Undo. */
  restore: (item: CartItem, index: number) => void | Promise<void>;
};

/* ----------------------------------------------------------------- a cart in memory */

/** A cart kept in memory: for a demo, a prototype or a store without a backend. Same shape as useShopifyCart. */
export function useCartState(initial: CartItem[] = [], currencyCode = initial[0]?.price.currencyCode ?? "EUR"): CartState {
  const [items, setItems] = useState<CartItem[]>(initial);
  const next = useRef(0);
  return {
    items,
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: sumMoney(items.map((i) => multiplyMoney(i.price, i.quantity)), currencyCode),
    add: ({ quantity = 1, ...item }) =>
      setItems((list) => {
        const found = list.find((i) => i.variantId === item.variantId);
        if (found) return list.map((i) => (i === found ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxQuantity ?? Infinity) } : i));
        next.current += 1;
        return [...list, { ...item, id: `line-${item.variantId}-${next.current}`, quantity }];
      }),
    update: (id, quantity) => setItems((list) => list.map((i) => (i.id === id ? { ...i, quantity } : i))),
    remove: (id) => setItems((list) => list.filter((i) => i.id !== id)),
    restore: (item, index) =>
      setItems((list) => (list.some((i) => i.id === item.id) ? list : [...list.slice(0, index), item, ...list.slice(index)])),
  };
}

/* ----------------------------------------------------------------- a line */

export type CartLineProps = {
  item: CartItem;
  /** Called with the new quantity, by a stepper, a key or a typed number. */
  onQuantityChange: (quantity: number) => void;
  /** Called when Remove is pressed. */
  onRemove: () => void;
  /** The locale for the prices. Leave it out for the page's. */
  locale?: string;
  className?: string;
};

/** One line of a cart: picture, name, picks, quantity, Remove and the line's price. Render it in a ul. */
export function CartLine({ item, onQuantityChange, onRemove, locale, className = "" }: CartLineProps) {
  const several = item.quantity > 1;
  return (
    <li className={"flex gap-4 border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0 " + className}>
      <Media ratio="1/1" radius="control" alt="" src={item.image?.src} srcSet={item.image?.srcSet} sizes="64px" className="w-16 shrink-0" />
      <div className="grid min-w-0 flex-1 content-start gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="grid min-w-0 gap-1">
            <p className="text-body font-title text-fg">{item.title}</p>
            {item.variantTitle && <p className="text-small text-fg-subtle">{item.variantTitle}</p>}
          </div>
          <div className="grid shrink-0 justify-items-end gap-1 text-body">
            <Price
              price={multiplyMoney(item.price, item.quantity)}
              compareAt={item.compareAt ? multiplyMoney(item.compareAt, item.quantity) : undefined}
              locale={locale}
            />
            {several && <span className="text-caption font-normal text-fg-subtle tabular-nums">{formatMoney(item.price, locale)} each</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <NumberField
            size="sm"
            hideLabel
            label={`Quantity of ${item.title}`}
            min={1}
            max={item.maxQuantity}
            required
            value={item.quantity}
            onValueChange={(q) => q !== null && onQuantityChange(q)}
            className="w-28"
          />
          <Button size="sm" variant="ghost" data-cart-remove="" aria-label={`Remove ${item.title}`} onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}

/* ----------------------------------------------------------------- the summary */

/** Currency options for a figure that may or may not have cents, as formatMoney writes them. */
const moneyFormat = (money: Money): Intl.NumberFormatOptions => {
  const whole = Number.isInteger(typeof money.amount === "number" ? money.amount : Number.parseFloat(money.amount));
  return { style: "currency", currency: money.currencyCode, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 };
};
const amount = (m: Money) => (typeof m.amount === "number" ? m.amount : Number.parseFloat(m.amount));

export type CartSummaryProps = {
  subtotal: Money;
  /** The subtotal that ships free. Shows a Meter of how far there is to go. */
  freeShippingAt?: Money;
  /** The words under the subtotal. */
  note?: ReactNode;
  /** Where Check out goes: the store's checkout page. */
  checkoutUrl?: string;
  /** Runs on Check out instead of following checkoutUrl. */
  onCheckout?: () => void;
  /** The button's words. */
  checkoutLabel?: string;
  /** Disables Check out, such as for an empty cart or while a change is on its way. */
  disabled?: boolean;
  /** Shows the Button's spinner on Check out. */
  loading?: boolean;
  locale?: string;
  className?: string;
};

/** The cart's foot: how far to free shipping, the subtotal, what is still to come, and Check out. */
export function CartSummary({
  subtotal,
  freeShippingAt,
  note = "Taxes and shipping at checkout.",
  checkoutUrl,
  onCheckout,
  checkoutLabel = "Check out",
  disabled = false,
  loading = false,
  locale,
  className = "",
}: CartSummaryProps) {
  const left = freeShippingAt ? Math.max(0, amount(freeShippingAt) - amount(subtotal)) : 0;
  return (
    <div className={"grid w-full gap-4 " + className}>
      {freeShippingAt && (
        <Meter
          label={left > 0 ? `${formatMoney({ amount: left, currencyCode: subtotal.currencyCode }, locale)} to free shipping` : "Free shipping"}
          value={Math.min(amount(subtotal), amount(freeShippingAt))}
          max={amount(freeShippingAt)}
          valueText={left > 0 ? `${formatMoney(subtotal, locale)} of ${formatMoney(freeShippingAt, locale)}` : "Included"}
        />
      )}
      <div className="grid gap-1">
        <dl className="flex items-baseline justify-between gap-4">
          <dt className="text-body text-fg-muted">Subtotal</dt>
          <dd className="text-body font-title text-fg">
            <RollingNumber value={amount(subtotal)} format={moneyFormat(subtotal)} locale={locale} />
          </dd>
        </dl>
        {note && <p className="text-small text-fg-subtle">{note}</p>}
      </div>
      <Button
        variant="primary"
        block
        disabled={disabled}
        loading={loading}
        onClick={() => {
          if (onCheckout) onCheckout();
          else if (checkoutUrl) window.location.assign(checkoutUrl);
        }}
      >
        {checkoutLabel}
      </Button>
    </div>
  );
}

/* ----------------------------------------------------------------- the sheet */

export type CartProps = {
  /** Whether the sheet is open. Pair it with onOpenChange. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The cart: useCartState() or useShopifyCart(). */
  cart: CartState;
  /** The subtotal that ships free, for the summary's Meter. */
  freeShippingAt?: Money;
  /** Runs on Check out instead of following the cart's checkoutUrl. */
  onCheckout?: () => void;
  /** The empty cart's action. The default is "Keep browsing", which closes the sheet. */
  emptyAction?: ReactNode;
  /** The sheet's title. */
  title?: string;
  /** The locale for the prices. Leave it out for the page's. */
  locale?: string;
};

/** The cart as a sheet from the right (a bottom sheet on a phone): the lines, and the summary pinned at its foot. */
export function Cart({ open, onOpenChange, cart, freeShippingAt, onCheckout, emptyAction, title = "Cart", locale }: CartProps) {
  const body = useRef<HTMLDivElement>(null);
  /* After a removal, where focus goes: the line now at that index, else the one before, else the empty state's action. */
  const [focusAt, setFocusAt] = useState<number | null>(null);
  useEffect(() => {
    if (focusAt === null) return;
    const root = body.current;
    const removes = root?.querySelectorAll<HTMLElement>("[data-cart-remove]");
    const target = removes?.length ? removes[Math.min(focusAt, removes.length - 1)] : root?.querySelector<HTMLElement>("button");
    target?.focus();
    setFocusAt(null);
  }, [focusAt, cart.items.length]);

  const empty = cart.items.length === 0;
  const remove = (item: CartItem, index: number) => {
    void cart.remove(item.id);
    setFocusAt(index);
    toast({ title: `Removed ${item.title}`, action: { label: "Undo", onClick: () => void cart.restore(item, index) } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        side="right"
        title={title}
        description={empty ? undefined : `${cart.count} ${cart.count === 1 ? "item" : "items"}`}
        footer={
          empty ? undefined : (
            <CartSummary
              subtotal={cart.subtotal}
              freeShippingAt={freeShippingAt}
              checkoutUrl={cart.checkoutUrl}
              onCheckout={onCheckout}
              disabled={cart.pending}
              locale={locale}
            />
          )
        }
      >
        <div ref={body}>
          {empty ? (
            <Empty bare title="Your cart is empty" action={emptyAction ?? <Button onClick={() => onOpenChange(false)}>Keep browsing</Button>}>
              Anything you add shows here.
            </Empty>
          ) : (
            <ul aria-label="Items in your cart">
              {cart.items.map((item, i) => (
                <CartLine
                  key={item.id}
                  item={item}
                  locale={locale}
                  onQuantityChange={(q) => void cart.update(item.id, q)}
                  onRemove={() => remove(item, i)}
                />
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------------------------------------- the ways in */

export type CartButtonProps = {
  /** How many things are in the cart. */
  count: number;
  /** Opens the cart. */
  onClick: () => void;
  /** sm in a header (the default), md beside md controls. */
  size?: Exclude<ButtonSize, "lg">;
  className?: string;
};

/** The header's way into the cart: the bag and the count, which rolls when it changes. */
export function CartButton({ count, onClick, size = "sm", className = "" }: CartButtonProps) {
  return (
    <Button
      variant="ghost"
      size={size}
      icon={<BagIcon />}
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
      aria-haspopup="dialog"
      onClick={onClick}
      className={"pointer-coarse:h-control-md " + className}
    >
      <RollingNumber value={count} className="font-mono font-normal" />
    </Button>
  );
}

export type AddToCartProps = {
  /** Adds the picked variant. It may return a promise: the button shows a spinner until it settles. */
  onAdd: () => void | Promise<void>;
  /** The picked variant is out of stock: the button is a disabled "Sold out". */
  soldOut?: boolean;
  /** Nothing is picked yet, or the pick has no variant. */
  disabled?: boolean;
  /** The words. */
  label?: string;
  /** md on a product page (the default), lg only for a hero. */
  size?: ButtonSize;
  /** Fills the width of its column. */
  block?: boolean;
  className?: string;
};

/** A product's primary action: Add to cart, a spinner while it adds, then "Added" with a check for 2s. */
export function AddToCart({ onAdd, soldOut = false, disabled = false, label = "Add to cart", size = "md", block = true, className = "" }: AddToCartProps) {
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const added = state === "added";
  const press = async () => {
    setState("adding");
    try {
      await onAdd();
      setState("added");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  };
  if (soldOut) {
    return (
      <Button variant="primary" size={size} block={block} disabled className={className}>
        Sold out
      </Button>
    );
  }
  return (
    <Button variant="primary" size={size} block={block} disabled={disabled} loading={state === "adding"} onClick={press} className={className}>
      {/* Both labels share one cell, so the box keeps its size when the words change. */}
      <span className="grid">
        <span className={"col-start-1 row-start-1 text-center " + (added ? "invisible" : "")}>{label}</span>
        <span aria-hidden={!added} className={"col-start-1 row-start-1 inline-flex items-center justify-center gap-control " + (added ? "" : "invisible")}>
          <CheckIcon />
          Added
        </span>
      </span>
    </Button>
  );
}
