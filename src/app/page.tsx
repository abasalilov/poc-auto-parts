"use client";
import { useEffect, useState } from "react";
import Clarity from '@microsoft/clarity';
import { useShoppingCart } from "use-shopping-cart";
import { useFirestore } from "reactfire";

import { useVehicle } from "@/context/VehicleContext";
import { useUserContext } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";

// import EmailDiscountModal from "@/components/emailDiscountModal";

import Header from "@/components/header";
import SearchResultsSection from "@/components/searchResultsSection";
import VehicleFinder from "@/components/vehicleFinder";
import Footer from "@/components/footer";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { USERS } from "@/lib/constants";
import { trackMetaAddToCart } from "@/lib/metaPixel";
import { trackGa4AddToCart } from "@/lib/ga4Analytics";
import { unitPriceCentsFromCatalogListPrice } from "@/lib/priceCents";
import { doc, getDoc } from "firebase/firestore";

const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

if (clarityProjectId) {
  Clarity.init(clarityProjectId);
}

const trustHighlights = [
  "Guaranteed fit",
  "Ships from U.S. warehouses",
  "30-day returns",
  "Secure checkout",
];

export default function HomePage() {
  const firestore = useFirestore();
  const { addItem } = useShoppingCart();
  const { setIsSideCartOpen } = useCart();
  const {
    user,
    setShowUserEmailDiscountModal,
    setEmailDiscountHasBeenShow,
    emailDiscountHasBeenShow,
  } = useUserContext();
  const { engine, engineTitle, make, model, vehicleRefId, year } = useVehicle();

  useEffect(() => {
    const checkUserEmail = async () => {
      if (firestore) {
        const useRef = doc(firestore, USERS, user.uid);
        const u = await getDoc(useRef);
        const userData = u.data();
        if (userData && !userData?.email && !emailDiscountHasBeenShow) {
          setTimeout(() => {
            setShowUserEmailDiscountModal(true);
            setEmailDiscountHasBeenShow(true);
          }, 4500);
        }
      }
    };

    if (user && user.uid) {
      checkUserEmail();
    }
  }, [user]);

  const addItemToCart = (selectedPart: any) => {
    const quantity = 1;
    const selectedItem = {
      ...selectedPart,
      vehicle: vehicleRefId,
      qtyInCart: quantity,
      price: unitPriceCentsFromCatalogListPrice(selectedPart.price, "cents"),
    };
    addItem(selectedItem, { count: quantity });
    setIsSideCartOpen(true);
    if (typeof window !== "undefined") {
      trackGa4AddToCart({
        userId: user.uid,
        item: selectedItem,
        quantity,
        itemVariant: `${year} ${make} ${model} ${engineTitle}`,
      });
      trackMetaAddToCart(selectedItem);
    }
  };

  return (
    <div className="bg-white w-full">
      <Header />

      <main id="search-section" className="mx-auto max-w-7xl px-6 pb-14 pt-5 lg:px-8">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-baseline lg:justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            {engine ? "Parts that fit your vehicle" : "Find parts that fit your vehicle"}
          </h1>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 sm:text-sm">
            {trustHighlights.map((highlight) => (
              <li key={highlight} className="inline-flex items-center gap-1">
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-parts-pass-green" aria-hidden />
                {highlight}
              </li>
            ))}
          </ul>
        </div>
        <VehicleFinder />
        <SearchResultsSection addItemToCart={addItemToCart} />
      </main>

      <Footer />
    </div>
  );
}
