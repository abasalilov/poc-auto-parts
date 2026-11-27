"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useShoppingCart } from "use-shopping-cart";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

import { useCart } from "@/context/CartContext";
import { useUserContext } from "@/context/UserContext";
import { useVehicle } from "@/context/VehicleContext";
import { trackCheckoutStarted } from "@/lib/checkoutAnalytics";
import { trackGa4AddToCart, trackGa4ViewItem } from "@/lib/ga4Analytics";
import { trackMetaAddToCart, trackMetaViewContent } from "@/lib/metaPixel";
import { formatUsd } from "@/lib/pricing";
import {
  isFreightOnly,
  shipmentCents,
  SHIPPING_QUOTE_EMAIL,
  SHIPPING_SERVICE,
  type Parcel,
} from "@/lib/shippingRates";
import { useBackForwardRestore } from "@/lib/useBackForwardRestore";

import { usePartFit } from "./usePartFit";

export interface BuyBoxProduct {
  id: string;
  title: string;
  manufacturer: string;
  partNumber: string;
  lineCode: string;
  partKey: string;
  category1: string;
  category2: string;
  tagline: string;
  image: string | null;
  priceCents: number;
  coreCents: number;
  parcel: Parcel;
  partIds: number[];
}

const MAX_QTY = 12;

export default function BuyBox({ product }: { product: BuyBoxProduct }) {
  const { addItem } = useShoppingCart();
  const { checkout, checkoutError, setIsSideCartOpen, setReadyToCheckout } = useCart();
  const { user } = useUserContext();
  const { engine, vehicleRefId } = useVehicle();
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const viewTracked = useRef(false);

  const { fit, vehicleLabel } = usePartFit(product.partIds);
  const fits = fit === "fits";

  const cartItem = useMemo(
    () => ({
      id: product.id,
      name: product.title,
      price: product.priceCents,
      currency: "USD",
      image: product.image ?? undefined,
      manufacturer: product.manufacturer,
      partNumber: product.partNumber,
      productLine: product.lineCode,
      lineCode: product.lineCode,
      partKey: product.partKey,
      category1: product.category1,
      category2: product.category2,
      description: product.tagline,
      engineId: fits ? engine : "",
      vehicle: fits ? vehicleRefId : null,
      product_data: { metadata: { type: product.category2 } },
    }),
    [product, fits, engine, vehicleRefId],
  );

  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackGa4ViewItem({ userId: user?.uid, item: cartItem, quantity: 1 });
    trackMetaViewContent(cartItem);
    // Track once per page view with the initial item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useBackForwardRestore(() => {
    setBuying(false);
    setReadyToCheckout(false);
  });

  const handleAddToCart = () => {
    addItem(cartItem, { count: quantity });
    setIsSideCartOpen(true);
    trackGa4AddToCart({
      userId: user?.uid,
      item: cartItem,
      quantity,
      itemVariant: fits ? vehicleLabel : undefined,
    });
    trackMetaAddToCart({ ...cartItem, qtyInCart: quantity });
  };

  const handleBuyNow = async () => {
    if (buying) return;
    setBuying(true);
    const line = { ...cartItem, quantity };
    setReadyToCheckout(true);
    trackCheckoutStarted({
      cartItems: [line],
      userId: user?.uid,
      itemVariant: fits ? vehicleLabel : undefined,
      metaValueCents: product.priceCents * quantity + shippingFor(quantity),
    });
    const started = await checkout([line], window.location.pathname + window.location.search);
    if (!started) {
      setReadyToCheckout(false);
      setBuying(false);
    }
  };

  const shippingFor = (qty: number) => shipmentCents([{ parcel: product.parcel, quantity: qty }]);

  const shipping = shippingFor(quantity);
  const freightOnly = isFreightOnly(product.parcel);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mont text-3xl font-bold text-gray-900">{formatUsd(product.priceCents)}</p>
        {product.coreCents > 0 && (
          <p className="mt-1 text-sm text-gray-600">
            Includes {formatUsd(product.coreCents)} core charge, refunded when you return your old part.
          </p>
        )}
      </div>

      <div className="min-h-[6rem]" aria-live="polite">
        {fit === "fits" && (
          <p className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            <CheckCircleIcon className="h-5 w-5 flex-none" aria-hidden />
            <span>
              <strong>Fits your {vehicleLabel}</strong>
            </span>
          </p>
        )}
        {fit === "no-fit" && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <ExclamationTriangleIcon className="h-5 w-5 flex-none" aria-hidden />
            <span>
              <strong>May not fit your {vehicleLabel}.</strong> Check the vehicle list below before
              ordering.
            </span>
          </p>
        )}
        {fit === "no-vehicle" && (
          <p className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <InformationCircleIcon className="h-5 w-5 flex-none text-parts-pass-blue" aria-hidden />
            <span>
              <a href="#fitment" className="font-semibold text-parts-pass-blue underline">
                Check the vehicle list
              </a>{" "}
              to confirm this part fits.
            </span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="qty" className="text-sm font-medium text-gray-700">
          Qty
        </label>
        <select
          id="qty"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-parts-pass-blue focus:ring-parts-pass-blue"
        >
          {Array.from({ length: MAX_QTY }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-600" aria-hidden />
          In stock
        </span>
      </div>

      {freightOnly ? (
        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">Call for a shipping quote</p>
          <p className="mt-1">
            This part is too large to ship by FedEx Ground, so it can&apos;t be ordered online. Email{" "}
            <a href={`mailto:${SHIPPING_QUOTE_EMAIL}`} className="font-semibold text-parts-pass-blue underline">
              {SHIPPING_QUOTE_EMAIL}
            </a>{" "}
            with the part number for a freight quote.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={buying}
            className="w-full rounded-lg bg-parts-pass-blue px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-parts-pass-blue-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parts-pass-blue disabled:opacity-60"
          >
            {buying ? "Opening checkout…" : "Buy now"}
          </button>
          {checkoutError && !buying && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {checkoutError}
            </p>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full rounded-lg border-2 border-parts-pass-blue bg-white px-6 py-3 text-base font-semibold text-parts-pass-blue hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parts-pass-blue"
          >
            Add to cart
          </button>
        </div>
      )}

      <ul className="space-y-1.5 text-sm text-gray-700">
        {!freightOnly && <li>{formatUsd(shipping)} {SHIPPING_SERVICE} shipping</li>}
        <li>30-day returns on new, unused parts</li>
      </ul>

      {!freightOnly && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-gray-200 bg-white py-3 pl-4 pr-24 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] md:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-gray-600">{product.title}</p>
            <p className="font-mont text-lg font-bold text-gray-900">{formatUsd(product.priceCents)}</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className="rounded-lg bg-parts-pass-blue px-5 py-3 text-sm font-semibold text-white"
          >
            Add to cart
          </button>
        </div>
      )}
    </div>
  );
}
