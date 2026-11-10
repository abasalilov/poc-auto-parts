export const MARKUP_RATE = 0.2;

const toNumber = (value: unknown) => {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Sell price in the same unit as the inputs: cost plus markup, plus the core charge when present. */
export const markupPrice = (price: unknown, core: unknown = 0) => {
  const base = toNumber(price);
  return base + base * MARKUP_RATE + toNumber(core);
};

/** Sell price in integer cents from distributor cost and core charge in dollars. */
export const sellPriceCents = (costDollars: unknown, coreDollars: unknown = 0) =>
  Math.round(markupPrice(toNumber(costDollars) * 100, toNumber(coreDollars) * 100));

export const formatUsd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
