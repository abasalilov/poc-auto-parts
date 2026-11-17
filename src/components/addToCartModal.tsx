import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrencyString, useShoppingCart } from "use-shopping-cart";

import {
  TransitionChild,
  Transition,
} from "@headlessui/react";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { useCart } from "@/context/CartContext";
import PartThumbnail from "@/components/partThumbnail";
import ExpressCheckoutButtons, {
  prefetchExpressCheckoutSession,
} from "@/components/ExpressCheckoutButtons";
import CartTotals from "@/components/CartTotals";
import { sumCartLinesArrayCents } from "@/lib/priceCents";
import { useCartShipping } from "@/lib/useCartShipping";
import { resolveCartItemUrl } from "@/lib/cartItemNavigation";
import { trackCheckoutStarted } from "@/lib/checkoutAnalytics";
import { toCheckoutLines } from "@/lib/checkoutLines";
import { useUserContext } from "@/context/UserContext";
import { useVehicle } from "@/context/VehicleContext";
import { useBackForwardRestore } from "@/lib/useBackForwardRestore";

interface AddToCartModal {
  open: boolean;
  toggleModal: (x: boolean) => void;
}

export default function AddToCartModal({ open, toggleModal }: AddToCartModal) {
  const showExpressCheckoutButtons = false;
  const panelRef = useRef<HTMLElement | null>(null);
  const mobileSheetRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const router = useRouter();
  const { cartCount, cartDetails, incrementItem, decrementItem, removeItem } = useShoppingCart();
  const [delayedOpen, setDelayedOpen] = useState(false);
  const [isCheckoutBusy, setIsCheckoutBusy] = useState(false);
  const [showAllMobileItems, setShowAllMobileItems] = useState(false);
  const { user } = useUserContext();
  const { engineTitle, make, model, year } = useVehicle();

  const { checkout, checkoutError, setReadyToCheckout, setSelectedPart } = useCart();

  useEffect(() => {
    setDelayedOpen(open);
    if (!open) {
      setShowAllMobileItems(false);
    }
  }, [open]);

  const handleClosePanel = useCallback(() => {
    toggleModal(false);
  }, [toggleModal]);

  useEffect(() => {
    if (!delayedOpen) return;

    const handlePointerOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (mobileSheetRef.current?.contains(target)) return;
      handleClosePanel();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClosePanel();
      }
    };

    document.addEventListener("mousedown", handlePointerOutside);
    document.addEventListener("touchstart", handlePointerOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerOutside);
      document.removeEventListener("touchstart", handlePointerOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [delayedOpen, handleClosePanel]);

  useEffect(() => {
    if (!delayedOpen) return;

    const mobileSheet = mobileSheetRef.current;
    if (!mobileSheet) return;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = event.changedTouches[0];
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);

      // Close only on deliberate downward swipe.
      if (deltaY > 80 && deltaX < 40) {
        handleClosePanel();
      }
      touchStartRef.current = null;
    };

    mobileSheet.addEventListener("touchstart", onTouchStart, { passive: true });
    mobileSheet.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      mobileSheet.removeEventListener("touchstart", onTouchStart);
      mobileSheet.removeEventListener("touchend", onTouchEnd);
    };
  }, [delayedOpen, handleClosePanel]);

  const handleSelectCart = async () => {
    if (isCheckoutBusy) return;
    handleCheckoutStarted();
    try {
      const checkoutStarted = await checkout(
        undefined,
        window.location.pathname + window.location.search,
      );
      if (!checkoutStarted) {
        setReadyToCheckout(false);
        setIsCheckoutBusy(false);
      }
    } catch (error) {
      console.log("side-cart checkout error", error);
      setReadyToCheckout(false);
      setIsCheckoutBusy(false);
    }
  };

  const cartItems = Object.values(cartDetails ?? {});
  const totalItemCount = cartItems.reduce(
    (sum, item) => sum + (Number(item?.quantity ?? item?.qtyInCart ?? 0) || 0),
    0,
  );
  const subtotalCents = sumCartLinesArrayCents(cartItems);
  const shipping = useCartShipping(open ? cartItems : []);
  const shippingCents = shipping.status === "ready" ? shipping.shippingCents : 0;
  const hasFreightOnly = shipping.status === "ready" && shipping.freightOnly.length > 0;
  const checkoutLines = useMemo(() => toCheckoutLines(cartItems), [cartItems]);

  useEffect(() => {
    if (!showExpressCheckoutButtons || cartItems.length === 0 || isCheckoutBusy) {
      return;
    }

    void prefetchExpressCheckoutSession(checkoutLines);
  }, [showExpressCheckoutButtons, cartItems.length, isCheckoutBusy, checkoutLines]);

  const handleCheckoutStarted = () => {
    setIsCheckoutBusy(true);
    setReadyToCheckout(true);
    trackCheckoutStarted({
      cartItems,
      userId: user?.uid,
      itemVariant: `${year} ${make} ${model} ${engineTitle}`,
      metaValueCents: subtotalCents + shippingCents,
    });
  };

  const handleCheckoutReset = () => {
    setReadyToCheckout(false);
    setIsCheckoutBusy(false);
  };

  useBackForwardRestore(handleCheckoutReset);

  const handleOpenCartItem = async (item: any) => {
    setSelectedPart(item);

    try {
      const url = resolveCartItemUrl(item);

      if (!url) return;
      handleClosePanel();
      router.push(url);
    } catch (error) {
      console.log("side-cart item navigation error", error);
    }
  };

  const renderCartItems = (items: any[]) =>
    items.map((item) => {
      const qty = Math.max(1, Number(item?.quantity ?? item?.qtyInCart ?? 1));
      const unitCents = Math.round(Number(item?.price ?? item?.value ?? 0) || 0);
      const lineCents = Math.max(0, unitCents * qty);
      const itemName = `${item?.manufacturer ?? ""} ${item?.category2 ?? ""}`.trim();
      const itemPart = String(item?.partNumber ?? "").trim();

      const handleDecreaseQty = () => {
        if (qty > 1) {
          decrementItem(item.id);
        }
      };

      const handleIncreaseQty = () => {
        if (qty < 10) {
          incrementItem(item.id);
        }
      };

      const handleRemoveItem = () => {
        removeItem(item.id);
      };

      return (
        <div key={`${item?.id ?? item?.partNumber ?? item?.partKey}`} className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => handleOpenCartItem(item)}
              className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50 transition-shadow hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-parts-pass-blue"
              aria-label={`View ${itemName || "cart item"}`}
            >
              <PartThumbnail part={item} alt={itemName || "Cart item"} sizes="64px" compact />
            </button>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => handleOpenCartItem(item)}
                className="font-mont line-clamp-2 text-left text-sm font-semibold text-gray-900 transition-colors hover:text-parts-pass-blue focus:outline-none focus:text-parts-pass-blue"
              >
                {itemName}
              </button>
              {itemPart ? (
                <p className="font-mont mt-0.5 text-xs text-gray-500">Part #{itemPart}</p>
              ) : null}
              <div className="mt-1 inline-flex items-center rounded-md border border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={handleDecreaseQty}
                  disabled={qty <= 1}
                  className="flex h-10 w-10 items-center justify-center text-base text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="font-mont min-w-[2.2rem] px-1 text-center text-sm font-semibold text-gray-900">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={handleIncreaseQty}
                  disabled={qty >= 10}
                  className="flex h-10 w-10 items-center justify-center text-base text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex h-full min-h-[88px] flex-col items-end justify-between text-right">
              <p className="font-mont text-sm font-semibold text-gray-900">
                {formatCurrencyString({ value: lineCents, currency: "USD" })}
              </p>
              <button
                type="button"
                onClick={handleRemoveItem}
                className="mt-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove ${itemName || "cart item"} from cart`}
              >
                <TrashIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      );
    });

  return (
    <Transition show={delayedOpen} as={Fragment}>
      <div className="pointer-events-none fixed inset-0 z-[60]">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-x-0 bottom-0 flex max-w-full lg:hidden">
          <TransitionChild
            as={Fragment}
            enter="transform transition ease-out duration-300"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <aside
              ref={mobileSheetRef}
              className="pointer-events-auto w-full"
              aria-label="Added to cart panel"
            >
              <div className="flex h-[82vh] max-h-[82vh] flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl">
                <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3">
                  <div className="mx-auto mb-1.5 h-1.5 w-10 rounded-full bg-gray-200" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-mont text-base font-semibold text-gray-900">
                        Cart ({totalItemCount || cartCount})
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-parts-pass-blue"
                      onClick={handleClosePanel}
                    >
                      <span className="sr-only">Close panel</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
                  {cartItems.length === 0 ? (
                    <p className="font-mont py-8 text-center text-sm text-gray-500">Your cart is empty.</p>
                  ) : (
                    <p className="font-mont mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                      Items in cart
                    </p>
                  )}
                  <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
                    {renderCartItems(showAllMobileItems ? cartItems : cartItems.slice(0, 3))}
                  </div>
                  {!showAllMobileItems && cartItems.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllMobileItems(true)}
                      className="font-mont mt-2.5 text-xs font-semibold text-parts-pass-blue"
                    >
                      View all items ({cartItems.length})
                    </button>
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="border-t border-gray-100 bg-white p-4">
                    <CartTotals
                      subtotalCents={subtotalCents}
                      shipping={shipping}
                      unitCount={totalItemCount || cartCount || 0}
                    />
                    <button
                      type="button"
                      disabled={isCheckoutBusy || hasFreightOnly}
                      className="font-mont inline-flex w-full justify-center rounded-md bg-gray-900 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-gray-900"
                      onClick={handleSelectCart}
                    >
                      {isCheckoutBusy ? "Opening checkout…" : "Checkout"}
                    </button>
                    {checkoutError && !isCheckoutBusy && (
                      <p role="alert" className="font-mont mt-2.5 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        {checkoutError}
                      </p>
                    )}
                    {showExpressCheckoutButtons && (
                      <ExpressCheckoutButtons
                        cartItems={cartItems}
                        disabled={cartItems.length === 0 || isCheckoutBusy}
                        lines={checkoutLines}
                        onCheckoutReadyReset={handleCheckoutReset}
                        onCheckoutStart={handleCheckoutStarted}
                      />
                    )}
                    <p className="font-mont mt-2.5 text-center text-xs text-gray-500">
                      Tax calculated at checkout
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </TransitionChild>
        </div>
        <div className="absolute inset-y-0 right-0 hidden max-w-full pl-8 sm:pl-10 lg:flex">
          <TransitionChild
            as={Fragment}
            enter="transform transition ease-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <aside
              ref={panelRef}
              className="pointer-events-auto w-screen max-w-lg"
              aria-label="Added to cart panel"
            >
              <div className="flex h-full flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl">
                <div className="border-b border-gray-100 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-mont text-lg font-semibold text-gray-900">
                        Cart ({totalItemCount || cartCount})
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-parts-pass-blue"
                      onClick={handleClosePanel}
                    >
                      <span className="sr-only">Close panel</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
                  {cartItems.length === 0 ? (
                    <p className="font-mont py-8 text-center text-sm text-gray-500">Your cart is empty.</p>
                  ) : (
                    <p className="font-mont mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                      Items in cart
                    </p>
                  )}
                  <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
                    {renderCartItems(cartItems)}
                  </div>
                </div>

                {cartItems.length > 0 && (
                  <div className="mt-auto border-t border-gray-100 bg-white p-4">
                    <CartTotals
                      subtotalCents={subtotalCents}
                      shipping={shipping}
                      unitCount={totalItemCount || cartCount || 0}
                    />
                    <button
                      type="button"
                      disabled={isCheckoutBusy || hasFreightOnly}
                      className="font-mont inline-flex w-full justify-center rounded-md bg-gray-900 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-gray-900"
                      onClick={handleSelectCart}
                    >
                      {isCheckoutBusy ? "Opening checkout…" : "Checkout"}
                    </button>
                    {checkoutError && !isCheckoutBusy && (
                      <p role="alert" className="font-mont mt-2.5 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        {checkoutError}
                      </p>
                    )}
                    {showExpressCheckoutButtons && (
                      <ExpressCheckoutButtons
                        cartItems={cartItems}
                        disabled={cartItems.length === 0 || isCheckoutBusy}
                        lines={checkoutLines}
                        onCheckoutReadyReset={handleCheckoutReset}
                        onCheckoutStart={handleCheckoutStarted}
                      />
                    )}
                    <p className="font-mont mt-2.5 text-center text-xs text-gray-500">
                      Tax calculated at checkout
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </TransitionChild>
        </div>
      </div>
    </Transition>
  );
}
