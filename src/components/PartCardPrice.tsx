"use client";

import { formatCurrencyString } from "use-shopping-cart";

export interface PartCardPriceProps {
  /** Our selling price in cents (same units as use-shopping-cart / formatSearchResults). */
  priceCents: number;
  className?: string;
  /** Tighter type for dense grids (e.g. manufacturer catalog). */
  size?: "default" | "compact";
}

export default function PartCardPrice({
  priceCents,
  className,
  size = "default",
}: PartCardPriceProps) {
  const priceCls =
    size === "compact"
      ? "text-base font-bold text-gray-900 tabular-nums"
      : "text-lg font-bold text-gray-900 tabular-nums";

  return (
    <div className={className}>
      <p className={priceCls}>
        {formatCurrencyString({ value: priceCents, currency: "USD" })}
      </p>
    </div>
  );
}
