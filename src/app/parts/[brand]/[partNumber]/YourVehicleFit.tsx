"use client";

import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { usePartFit } from "./usePartFit";

export default function YourVehicleFit({ partIds }: { partIds: number[] }) {
  const { fit, vehicleLabel } = usePartFit(partIds);

  if (fit === "fits") {
    return (
      <p className="mt-3 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
        <CheckCircleIcon className="h-5 w-5 flex-none" aria-hidden />
        <span>
          <strong>Fits your {vehicleLabel}</strong>
        </span>
      </p>
    );
  }
  if (fit === "no-fit") {
    return (
      <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        <ExclamationTriangleIcon className="h-5 w-5 flex-none" aria-hidden />
        <span>
          <strong>May not fit your {vehicleLabel}.</strong> It isn&apos;t listed for this vehicle in
          our catalog.
        </span>
      </p>
    );
  }
  return null;
}
