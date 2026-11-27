"use client";

import { useEffect, useState } from "react";

import { useVehicle } from "@/context/VehicleContext";

export type PartFit = "fits" | "no-fit" | "checking" | "no-vehicle";

const requests = new Map<string, Promise<boolean | null>>();

const checkFit = (partIdsKey: string, engine: string) => {
  const key = `${partIdsKey}@${engine}`;
  let request = requests.get(key);
  if (!request) {
    const params = new URLSearchParams({ partIds: partIdsKey, engine });
    request = fetch(`/api/part-fits?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { fits?: boolean } | null) =>
        data && typeof data.fits === "boolean" ? data.fits : null,
      )
      .catch(() => null);
    requests.set(key, request);
  }
  return request;
};

/** Whether the product fits the shopper's selected vehicle; shared by the buy box and fitment list. */
export const usePartFit = (partIds: number[]) => {
  const { engine, engineTitle, year, make, model } = useVehicle();
  const [fit, setFit] = useState<PartFit>("no-vehicle");
  const partIdsKey = partIds.join(",");
  const vehicleLabel = [year, make, model, engineTitle].filter(Boolean).join(" ");

  useEffect(() => {
    if (!engine) {
      setFit("no-vehicle");
      return;
    }
    let alive = true;
    setFit("checking");
    checkFit(partIdsKey, String(engine)).then((fits) => {
      if (alive) setFit(fits === null ? "no-vehicle" : fits ? "fits" : "no-fit");
    });
    return () => {
      alive = false;
    };
  }, [engine, partIdsKey]);

  return { fit, vehicleLabel };
};
