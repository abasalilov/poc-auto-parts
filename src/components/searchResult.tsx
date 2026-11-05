"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

import { useCart } from "@/context/CartContext";
import PartThumbnail from "./partThumbnail";
import PartCardPrice from "./PartCardPrice";
import { productPath } from "@/lib/productUrl";

interface SearchResultProp {
  part: any;
  addItemToCart: (x: any) => void;
}

export default function SearchResult({
  part,
  addItemToCart,
}: SearchResultProp) {
  const { setSelectedPart } = useCart();

  const url = productPath(part) ?? "/";

  const handleSelectPart = () => {
    setSelectedPart(part);
  };

  const handleAddItemToCart = () => {
    setSelectedPart(part);
    addItemToCart(part);
  };

  const decode = (value: unknown) => String(value ?? "").replace(/&amp;/g, "&").trim();
  const title = decode(`${part.manufacturer ?? ""} ${part.category2 ?? ""}`);
  const partNumber = decode(part.partNumber);
  const partName = `${title} ${partNumber}`.trim();

  return (
    <li className="group relative flex items-center gap-3 p-3 transition-colors hover:bg-gray-50 sm:gap-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-white">
        <PartThumbnail part={part} alt={partName} sizes="80px" compact />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
            <Link
              href={url}
              onClick={handleSelectPart}
              className="after:absolute after:inset-0 group-hover:text-parts-pass-blue group-hover:underline"
            >
              {title}
            </Link>
          </h3>
          {partNumber && <p className="text-xs text-gray-500">Part #{partNumber}</p>}
          {part.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-700">{decode(part.description)}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:flex-nowrap sm:justify-end sm:gap-4">
          <PartCardPrice priceCents={part.price} />
          <button
            type="button"
            onClick={handleAddItemToCart}
            className="relative z-10 shrink-0 whitespace-nowrap rounded-md bg-parts-pass-blue px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parts-pass-blue sm:px-4 sm:py-2 sm:text-sm"
          >
            Add to cart
          </button>
        </div>
      </div>
      <ChevronRightIcon
        className="hidden h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-parts-pass-blue sm:block"
        aria-hidden="true"
      />
    </li>
  );
}
