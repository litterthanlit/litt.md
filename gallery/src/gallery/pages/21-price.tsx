import { Price } from "@/components/price";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { eur } from "../shop";

export const meta: PageMeta = {
  id: "price",
  title: "Price",
  lede: "One amount, and what it was.",
  order: 21.1,
  group: "Commerce",
  summary:
    "One amount at the title weight with tabular figures, formatted from an amount and a currency code in the page's locale. A sale strikes the old price through in the grey with hidden words for screen readers, and can add a neutral tag with the saving. Never red, never the accent. Nothing moves.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["price"],
  exports: ["Price", "formatMoney", "multiplyMoney", "sumMoney", "savingOf"],
  usage: `import { Price } from "@/components/price";

// Money is an amount and a currency code: Shopify's MoneyV2 as it comes, { amount: "90.0", currencyCode: "EUR" }.
<Price price={{ amount: "90.0", currencyCode: "EUR" }} />

// A product whose variants differ in price shows its lowest after "From".
<Price price={{ amount: 100, currencyCode: "EUR" }} from />

// A sale: the old price struck through, and on a product page the saving as a tag.
<Price price={{ amount: 108, currencyCode: "EUR" }} compareAt={{ amount: 145, currencyCode: "EUR" }} saving />

// Anywhere you need the words: "€12.50", "€90".
formatMoney({ amount: 12.5, currencyCode: "EUR" });`,
  use: [
    "Any amount someone pays: a product, a variant, a cart line, a plan.",
    "A sale, where the old price matters to the choice. Pass compareAt; it shows only when it is higher.",
    "A product sold by volume or weight, where the unit price helps compare. Pass unitPrice.",
  ],
  skip: [
    "A total that changes while someone watches, such as a cart's subtotal after a quantity changes. Use Rolling number with a currency format.",
    "A number in a table of figures people compare. Set it at the text weight in tabular figures, as Table does.",
    "A plan's price on a pricing page, which is a heading-sized moment. It is still the title weight and never above 18px; write it with formatMoney inside your own layout.",
  ],
  a11y: [
    "A sale price reads \"Sale price €108, Regular price €145\": the strike is never the only signal.",
    "The amount is text, formatted by Intl.NumberFormat in the page's locale, so a screen reader reads the currency as words.",
    "The saving tag is text in the foreground's grey on a raised fill, never a color alone.",
    "Whole amounts drop the cents and any other keeps two places, so a list of prices never reads \"€90.00\" beside \"€12.50\" for no reason.",
  ],
};

function PricesDemo() {
  return (
    <dl className="grid w-full max-w-md gap-4 text-body">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-fg-muted">Open water, A2</dt>
        <dd>
          <Price price={eur(145)} />
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-fg-muted">Any size</dt>
        <dd>
          <Price price={eur(100)} from />
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-fg-muted">Dusk tide, on sale</dt>
        <dd>
          <Price price={eur(108.75)} compareAt={eur(145)} />
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-fg-muted">Print care kit</dt>
        <dd>
          <Price price={eur(18)} unitPrice={{ price: eur(3.6), per: "100 ml" }} className="text-right" />
        </dd>
      </div>
    </dl>
  );
}

function ProductPriceDemo() {
  return (
    <div className="grid w-full max-w-md gap-1">
      <p className="text-caption font-normal text-fg-subtle">Field studies</p>
      <h3 className="text-h1 text-fg">Dusk tide</h3>
      <Price price={eur(108.75)} compareAt={eur(145)} saving className="text-body" />
    </div>
  );
}

function LocalesDemo() {
  const amounts = [
    { label: "Ireland", locale: "en-IE", money: eur(1249.5) },
    { label: "Germany", locale: "de-DE", money: eur(1249.5) },
    { label: "United States", locale: "en-US", money: { amount: "1350.0", currencyCode: "USD" } },
    { label: "Japan", locale: "ja-JP", money: { amount: "198000", currencyCode: "JPY" } },
  ];
  return (
    <dl className="grid w-full max-w-md gap-4 text-body">
      {amounts.map((a) => (
        <div key={a.label} className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">{a.label}</dt>
          <dd>
            <Price price={a.money} locale={a.locale} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function PricePage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Prices in a list"
        align="start"
        code="PricesDemo"
        caption="The amount takes the size of where it sits, at the title weight in the foreground, with tabular figures. From says the lowest of several. A sale strikes the old price through in the grey, after the new one. A unit price sits under it at the caption size. Nothing here moves."
      >
        <PricesDemo />
      </Stage>

      <Stage
        title="On a product page"
        align="start"
        code="ProductPriceDemo"
        caption="Under the page's one 18px title, the price stays at 14px and ranks by weight and ink. The saving is a neutral tag: a sale is not a status, so it is never red and never the accent."
      >
        <ProductPriceDemo />
      </Stage>

      <Stage
        title="In the page's locale"
        align="start"
        code="LocalesDemo"
        caption="The same code in four locales and three currencies. Intl.NumberFormat places the symbol and the separators; whole amounts drop the cents, and a currency with no minor unit, such as the yen, never shows any."
      >
        <LocalesDemo />
      </Stage>

      <TryIt of="Price" component={Price} props={{ price: eur(145), compareAt: eur(180) }} />
    </Page>
  );
}
