"use client";
import * as React from "react";
import Image from "next/image";
import { formatCurrencyString } from "use-shopping-cart";
import PartThumbnail from "./partThumbnail";

interface OrderItemProp {
  part: any;
}

export default function PurchasedOrderItem({ part }: OrderItemProp) {
  const partName = `${part.manufacturer} ${part.category_2} ${part.partNumber}`;

  return (
    <li className="p-4 sm:p-6">
      <div className="flex items-center sm:items-start">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 sm:h-40 sm:w-40">
          <div
            style={{ height: 150, width: 150 }}
            className="h-full w-full object-cover object-center"
          >
            <PartThumbnail part={part} sizes="150px" />
          </div>
        </div>
        <div className="ml-6 flex-1 text-sm">
          <div className="font-medium text-gray-900 sm:flex sm:justify-between">
            <h5 className="font-mont">{partName}</h5>
            <p className="font-mont mt-2 sm:mt-0">
              {formatCurrencyString({
                value: 100 * Number(part.price),
                currency: "USD",
              })}
            </p>
          </div>
          <p className="font-mont hidden text-gray-500 sm:mt-2 sm:block">{`Quantity: ${part.qty}`}</p>
        </div>
      </div>
    </li>
  );
}
