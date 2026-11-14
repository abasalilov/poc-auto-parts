"use client";

import { useEffect, useState } from "react";

import PartCardGrid from "@/components/partCardGrid";
import { useVehicle } from "@/context/VehicleContext";
import type { RelatedParts } from "@/lib/relatedParts";
import { usePartFit } from "./usePartFit";

interface RelatedPartsSectionProps {
  /** Rendered on the server for the newest vehicle the part fits; what search engines see. */
  initial: RelatedParts | null;
  partIds: number[];
  partType: string;
  category1: string;
}

const requests = new Map<string, Promise<RelatedParts | null>>();

const loadForEngine = (params: URLSearchParams) => {
  const key = params.toString();
  let request = requests.get(key);
  if (!request) {
    request = fetch(`/api/related-parts?${params}`)
      .then((res) => (res.ok ? (res.json() as Promise<RelatedParts | null>) : null))
      .catch(() => null);
    requests.set(key, request);
  }
  return request;
};

/** Related parts, switched to the shopper's vehicle when this part fits it. */
export default function RelatedPartsSection({ initial, partIds, partType, category1 }: RelatedPartsSectionProps) {
  const { engine } = useVehicle();
  const { fit } = usePartFit(partIds);
  const [forVehicle, setForVehicle] = useState<{ engine: string; related: RelatedParts | null } | null>(null);
  const partIdsKey = partIds.join(",");

  useEffect(() => {
    if (fit !== "fits" || !engine) return;
    let alive = true;
    const params = new URLSearchParams({ partIds: partIdsKey, engine, partType, category1 });
    loadForEngine(params).then((related) => {
      if (alive) setForVehicle({ engine, related });
    });
    return () => {
      alive = false;
    };
  }, [fit, engine, partIdsKey, partType, category1]);

  const vehicleRelated = fit === "fits" && forVehicle?.engine === engine ? forVehicle.related : null;
  const shopper = Boolean(vehicleRelated?.parts.length);
  const related = shopper ? vehicleRelated : initial;
  if (!related) return null;

  return (
    <section className="mt-14">
      <h2 className="font-mont text-xl font-bold text-gray-900">
        {related.sameJob
          ? "Parts for the same job"
          : `More ${category1 ? `${category1} ` : ""}parts for this vehicle`}
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        {shopper
          ? `These fit your ${related.vehicle}.`
          : `These fit the ${related.vehicle}. Check your own vehicle on each part before you buy.`}
      </p>
      <div className="mt-4">
        <PartCardGrid parts={related.parts} addToCart />
      </div>
    </section>
  );
}
