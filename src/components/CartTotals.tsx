import { formatCurrencyString } from "use-shopping-cart";

import ShippingCountdownBanner from "@/components/ShippingCountdownBanner";
import { SHIPPING_QUOTE_EMAIL, SHIPPING_SERVICE } from "@/lib/shippingRates";
import type { CartShipping } from "@/lib/useCartShipping";

const usd = (cents: number) => formatCurrencyString({ value: cents, currency: "USD" });

type Props = {
  subtotalCents: number;
  shipping: CartShipping;
  /** Units across all lines, for the "(3 items)" label. */
  unitCount: number;
};

/** Subtotal and shipping rows plus the ship-by line, shown above the checkout button. */
export default function CartTotals({ subtotalCents, shipping, unitCount }: Props) {
  return (
    <div className="mb-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="font-mont text-sm text-gray-600">
          Subtotal ({unitCount} {unitCount === 1 ? "item" : "items"})
        </p>
        <p className="font-mont text-base font-semibold text-gray-900">{usd(subtotalCents)}</p>
      </div>
      <div className="flex items-center justify-between">
        <p className="font-mont text-sm text-gray-600">
          {SHIPPING_SERVICE} shipping
          {shipping.status === "ready" && shipping.shipments > 1 && (
            <span className="text-gray-500"> · {shipping.shipments} packages</span>
          )}
        </p>
        <p className="font-mont text-sm text-gray-900">
          {shipping.status === "ready"
            ? usd(shipping.shippingCents)
            : shipping.status === "loading"
              ? <span className="text-gray-400">Calculating…</span>
              : <span className="text-gray-500">Calculated at checkout</span>}
        </p>
      </div>
      {shipping.status === "ready" && shipping.shipments > 1 && (
        <p className="font-mont text-xs text-gray-500">
          These parts ship from different warehouses.
        </p>
      )}
      {shipping.status === "ready" && shipping.freightOnly.length > 0 && (
        <p role="alert" className="font-mont rounded-md bg-amber-50 p-2.5 text-xs text-amber-900">
          {shipping.freightOnly.join(", ")} {shipping.freightOnly.length === 1 ? "is" : "are"} too large to ship
          by FedEx Ground. Remove {shipping.freightOnly.length === 1 ? "it" : "them"} to check out, and email{" "}
          <a href={`mailto:${SHIPPING_QUOTE_EMAIL}`} className="font-semibold underline">
            {SHIPPING_QUOTE_EMAIL}
          </a>{" "}
          for a freight quote.
        </p>
      )}
      <div className="pt-1">
        <ShippingCountdownBanner inline />
      </div>
    </div>
  );
}
