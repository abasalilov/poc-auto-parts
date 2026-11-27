"use client";

import Link from "next/link";

import { useVehicle } from "@/context/VehicleContext";
import { searchHref } from "@/lib/searchUrl";
import VehicleFinder, { useVehicleName } from "./vehicleFinder";

/**
 * The vehicle picker on brand and part type lists. These pages show every vehicle's parts, so once
 * a vehicle is set the cards are marked by fit and the shopper can jump to the vehicle's own results.
 */
export default function CatalogVehicleBar({ partType }: { partType?: string }) {
  const { engine, model } = useVehicle();
  const vehicleName = useVehicleName();
  const vehicle = model || "vehicle";

  return (
    <div className="mt-6 space-y-2">
      <VehicleFinder />
      {engine && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-700">
          <span>These parts are for many vehicles. Each one is marked if it fits your {vehicleName}.</span>
          <Link
            href={searchHref(partType ?? "")}
            className="font-semibold text-parts-pass-blue hover:text-parts-pass-green"
          >
            {partType ? `Show only ${partType} for my ${vehicle}` : `Shop all parts for my ${vehicle}`} →
          </Link>
        </p>
      )}
    </div>
  );
}
