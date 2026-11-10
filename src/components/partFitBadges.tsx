"use client";

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

import { useVehicle } from "@/context/VehicleContext";

/** Item keys that fit the selected engine, or null while unknown or with no vehicle. */
const FitContext = createContext<Set<string> | null>(null);

const requests = new Map<string, Promise<string[] | null>>();

const loadFits = (engine: string, items: string[]) => {
  const params = new URLSearchParams({ engine, items: items.join(",") });
  const key = params.toString();
  let request = requests.get(key);
  if (!request) {
    request = fetch(`/api/listing-fits?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { fits?: string[] } | null) => (Array.isArray(data?.fits) ? data.fits : null))
      .catch(() => null)
      .then((fits) => {
        if (!fits) requests.delete(key);
        return fits;
      });
    requests.set(key, request);
  }
  return request;
};

/** Checks every card in a grid against the shopper's vehicle with one request. */
export function PartFitProvider({ items, children }: PropsWithChildren<{ items: string[] }>) {
  const { engine } = useVehicle();
  const [fits, setFits] = useState<{ key: string; fits: Set<string> } | null>(null);
  const itemsKey = items.join(",");
  const requestKey = `${engine}|${itemsKey}`;

  useEffect(() => {
    if (!engine || !itemsKey) return;
    let alive = true;
    loadFits(engine, itemsKey.split(",")).then((keys) => {
      if (alive && keys) setFits({ key: `${engine}|${itemsKey}`, fits: new Set(keys) });
    });
    return () => {
      alive = false;
    };
  }, [engine, itemsKey]);

  const current = engine && fits?.key === requestKey ? fits.fits : null;
  return <FitContext.Provider value={current}>{children}</FitContext.Provider>;
}

/** Fit for one card: unknown until the vehicle check returns. */
export const useItemFit = (item: string): "fits" | "no-fit" | "unknown" => {
  const fits = useContext(FitContext);
  if (!fits) return "unknown";
  return fits.has(item) ? "fits" : "no-fit";
};

/** "Fits your 4Runner" or "Doesn't fit", once the vehicle check is back. */
export function FitBadge({ item }: { item: string }) {
  const fits = useContext(FitContext);
  const { model } = useVehicle();
  if (!fits) return null;
  const vehicle = model || "vehicle";
  return fits.has(item) ? (
    <p className="mt-1 inline-flex w-fit items-center rounded bg-green-50 px-1.5 py-0.5 text-xs font-semibold text-green-700">
      ✓ Fits your {vehicle}
    </p>
  ) : (
    <p className="mt-1 inline-flex w-fit items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
      Doesn&apos;t fit your {vehicle}
    </p>
  );
}
