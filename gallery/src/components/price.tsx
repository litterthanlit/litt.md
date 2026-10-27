/**
 * Price: one amount, with what it was and what it costs per unit when those matter (components.md, "Price").
 *
 * - Money is an amount and a currency code, Shopify's MoneyV2 shape ({ amount: "90.0", currencyCode: "EUR" }), so a
 *   Storefront API price needs no mapping. The amount may be a string or a number.
 * - Type: the amount at the size of where it sits, the title weight, --fg, in the sans with tabular figures, as a
 *   Stat's value. Formatted by Intl.NumberFormat in the page's locale (or `locale`). Whole amounts drop the cents
 *   ("€90"), any other keeps two places ("€12.50"), so a price never reads "€90.00" beside "€12.50" for no reason.
 * - From: a product whose variants differ in price shows its lowest after "From" in --fg-subtle at the text weight.
 * - Sale: a compare-at price higher than the price follows it, struck through, in --fg-subtle at the text weight.
 *   Hidden words say "Sale price" and "Regular price", so the strike is never the only signal. `saving` adds a neutral
 *   Tag after it ("Save 25%"). Never red, never the accent, never a status color: a sale is not a status.
 * - Unit price: an optional line under it at the caption size in --fg-subtle ("€4.20 / 100 ml").
 * - Motion: none. A price that changes just changes; a total that changes while someone watches is a Rolling number.
 */
import { Tag } from "@/components/tag";

/** An amount and its currency, as Shopify's Storefront API gives it: { amount: "90.0", currencyCode: "EUR" }. */
export type Money = {
  /** The amount, as a decimal string or a number. */
  amount: string | number;
  /** The ISO 4217 currency code: EUR, USD, GBP. */
  currencyCode: string;
};

const amountOf = (money: Money) => (typeof money.amount === "number" ? money.amount : Number.parseFloat(money.amount));

/** Formats money in the page's locale (or the one given): "€90" for a whole amount, "€12.50" for any other. */
export function formatMoney(money: Money, locale?: string): string {
  const n = amountOf(money);
  const whole = Number.isInteger(n);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currencyCode,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(n);
}

/** The same money times a count, such as a line's unit price times its quantity. */
export const multiplyMoney = (money: Money, by: number): Money => ({
  amount: Math.round(amountOf(money) * by * 100) / 100,
  currencyCode: money.currencyCode,
});

/** The sum of several amounts in one currency, such as a cart's subtotal. An empty list gives zero in `currencyCode`. */
export const sumMoney = (list: Money[], currencyCode = list[0]?.currencyCode ?? "EUR"): Money => ({
  amount: Math.round(list.reduce((sum, m) => sum + amountOf(m) * 100, 0)) / 100,
  currencyCode,
});

/** How much a compare-at price saves, as a whole percent, or null when it saves nothing. */
export function savingOf(price: Money, compareAt?: Money | null): number | null {
  if (!compareAt) return null;
  const now = amountOf(price);
  const was = amountOf(compareAt);
  if (!(was > now) || was <= 0) return null;
  return Math.round(((was - now) / was) * 100);
}

export type PriceProps = {
  /** What it costs now. */
  price: Money;
  /** What it cost before a sale. Shown struck through after the price, only when it is higher. */
  compareAt?: Money | null;
  /** Says "From" before the price, for a product whose variants differ in price. Pass its lowest. */
  from?: boolean;
  /** Adds a neutral tag with what the sale saves ("Save 25%"). Use it on a product's page, not in a grid. */
  saving?: boolean;
  /** What it costs per unit, on a line under the price: { price, per: "100 ml" }. */
  unitPrice?: { price: Money; per: string };
  /** The locale to format in. Leave it out for the page's. */
  locale?: string;
  /** Extra classes for the price, such as a size: it takes the size of where it sits. */
  className?: string;
};

/** One amount at the title weight, with a struck-through compare-at price and a unit price when they apply. */
export function Price({ price, compareAt, from = false, saving = false, unitPrice, locale, className = "" }: PriceProps) {
  const saved = savingOf(price, compareAt);
  const sale = saved !== null;
  const line = (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {from && <span className="text-fg-subtle">From</span>}
      <span className="font-title text-fg tabular-nums">
        {sale && <span className="sr-only">Sale price </span>}
        {formatMoney(price, locale)}
      </span>
      {sale && compareAt && (
        <s className="text-fg-subtle tabular-nums">
          <span className="sr-only">Regular price </span>
          {formatMoney(compareAt, locale)}
        </s>
      )}
      {sale && saving && <Tag className="self-center">{`Save ${saved}%`}</Tag>}
    </span>
  );
  if (!unitPrice) return <span className={"inline-block " + className}>{line}</span>;
  return (
    <span className={"inline-grid gap-1 " + className}>
      {line}
      <span className="text-caption font-normal text-fg-subtle tabular-nums">
        {formatMoney(unitPrice.price, locale)} / {unitPrice.per}
      </span>
    </span>
  );
}
