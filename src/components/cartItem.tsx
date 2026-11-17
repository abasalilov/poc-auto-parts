"use client";
import { useRouter } from "next/navigation";
import { useShoppingCart } from "use-shopping-cart";
import { TrashIcon } from "@heroicons/react/24/outline";

import { useCart } from "@/context/CartContext";
import { resolveCartItemUrl } from "@/lib/cartItemNavigation";

import QuantityButtons from "./quantityButtons";
import PartThumbnail from "./partThumbnail";
import PartCardPrice from "./PartCardPrice";

interface CartItemProp {
  part: any;
  /** e.g. "In Stock — Ships Today" or "In Stock — Ships Next Business Day"; when null, shows "In Stock" only */
  shippingBadge?: string | null;
}

export default function CartItem({ part, shippingBadge }: CartItemProp) {
  const router = useRouter();
  const { decrementItem, incrementItem, removeItem } = useShoppingCart();

  const { setSelectedPart } = useCart();

  const handleDecreaseItemQty = () => {
    if (part.quantity > 1) {
      decrementItem(part.id);
    } else if (part.quantity === 1) {
      removeItem(part.id);
    }
  };

  const handleIncreaseItemQty = () => {
    if (12 > part.quantity) {
      incrementItem(part.id);
    }
  };

  const handleSelectPart = async () => {
    setSelectedPart(part);
    const url = resolveCartItemUrl(part);

    if (!url) return;
    router.push(url);
  };

  const handleRemoveItem = () => {
    removeItem(part.id);
  };

  const partName = `${part.manufacturer} ${part.category2} ${part.partNumber}`;
  const description = part.description?.trim();
  const showDescription =
    description && description.toLowerCase() !== "primary" && description.length > 1;
  const unitPriceCents = Math.round(Number(part.price) || 0);
  const quantity = Math.max(1, Number(part.quantity) || 1);
  const lineTotalCents = unitPriceCents * quantity;
  const showLineTotalBreakdown = quantity > 1;

  return (
    <li
      key={part.id}
      className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:gap-6 sm:p-5"
    >
      <button
        type="button"
        onClick={handleSelectPart}
        className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 shadow-inner ring-1 ring-gray-100 sm:h-32 sm:w-32"
      >
        <PartThumbnail part={part} sizes="(min-width: 640px) 128px, 96px" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={handleSelectPart}
              className="font-mont text-left text-base font-semibold text-gray-900 hover:text-parts-pass-blue sm:text-lg"
            >
              {partName}
            </button>
            <p className="font-mont mt-0.5 text-sm text-gray-500">
              {part.partNumber}
            </p>
            <p className="font-mont mt-0.5 text-xs text-green-600">
              {shippingBadge ?? "In Stock"}
            </p>
            {showDescription && (
              <p className="font-mont mt-1 text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
          <div className="mt-3 sm:mt-0 sm:w-[172px] sm:flex-shrink-0 sm:text-right">
            <PartCardPrice
              className="sm:text-right [&>p]:whitespace-nowrap"
              priceCents={showLineTotalBreakdown ? lineTotalCents : unitPriceCents}
              size="compact"

            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-50 pt-3 sm:mt-4">
          <QuantityButtons
            increaseQty={handleIncreaseItemQty}
            decreaseQty={handleDecreaseItemQty}
            qty={part.quantity}
            maxQty={12}
          />
          <button
            type="button"
            onClick={handleRemoveItem}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label={`Remove ${partName} from cart`}
          >
            <TrashIcon className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
