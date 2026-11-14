"use client";

import { useShoppingCart } from "use-shopping-cart";

import { useCart } from "@/context/CartContext";
import { useUserContext } from "@/context/UserContext";
import { useVehicle } from "@/context/VehicleContext";
import type { ListedPart } from "@/lib/catalog";
import { trackGa4AddToCart } from "@/lib/ga4Analytics";
import { trackMetaAddToCart } from "@/lib/metaPixel";
import { itemKey } from "@/lib/productUrl";
import { useItemFit } from "./partFitBadges";

/** Adds a listed part without leaving the page. Attaches the vehicle only when the part fits it. */
export default function AddListedPartButton({ part }: { part: ListedPart }) {
  const { addItem } = useShoppingCart();
  const { setIsSideCartOpen } = useCart();
  const { user } = useUserContext();
  const { engine, engineTitle, make, model, vehicleRefId, year } = useVehicle();
  const fits = useItemFit(itemKey(part)) === "fits";
  const vehicleLabel = [year, make, model, engineTitle].filter(Boolean).join(" ");

  const handleAddToCart = () => {
    const cartItem = {
      id: part.id ?? `${part.lineCode}-${part.partNumber}`,
      name: part.title,
      price: part.priceCents,
      currency: "USD",
      image: part.image || undefined,
      manufacturer: part.manufacturer,
      partNumber: part.partNumber,
      productLine: part.lineCode,
      lineCode: part.lineCode,
      category2: part.partType,
      description: "",
      engineId: fits ? engine : "",
      vehicle: fits ? vehicleRefId : null,
      product_data: { metadata: { type: part.partType } },
    };
    addItem(cartItem, { count: 1 });
    setIsSideCartOpen(true);
    trackGa4AddToCart({
      userId: user?.uid,
      item: cartItem,
      quantity: 1,
      itemVariant: fits ? vehicleLabel : undefined,
    });
    trackMetaAddToCart({ ...cartItem, qtyInCart: 1 });
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="mt-2 w-full rounded-md bg-parts-pass-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-parts-pass-blue-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parts-pass-blue sm:text-sm"
    >
      Add to cart
    </button>
  );
}
