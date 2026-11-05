"use client";
import { useEffect, useMemo, useState } from "react";

import { useUserVehicles } from "@/context/UserVehiclesContext";
import { useVehicle } from "@/context/VehicleContext";
import {
  mergeVehicleChoices,
  readRecentVehicles,
  snapshotFromSavedVehicle,
  vehicleKey,
} from "@/lib/recentVehicles";
import type { VehicleSnapshot } from "@/lib/vehicleLocalStorage";
import VehicleSilhouette from "./vehicleSilhouette";

type Choice = VehicleSnapshot & { savedId?: string };

/** One-tap switch to the account's saved vehicles and this device's recent ones. */
export default function RecentVehicleChoices() {
  const { vehicles } = useUserVehicles();
  const vehicle = useVehicle();
  const { selectVehicle, touchVehicleLastUsed } = vehicle;
  const [recent, setRecent] = useState<VehicleSnapshot[]>([]);

  useEffect(() => setRecent(readRecentVehicles()), []);

  const choices = useMemo(() => {
    const saved: Choice[] = vehicles.flatMap((vh) => {
      const snapshot = snapshotFromSavedVehicle(vh);
      return snapshot ? [{ ...snapshot, savedId: vh.id }] : [];
    });
    const current = vehicle.engine
      ? {
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          modelName: "",
          engine: vehicle.engine,
          engineTitle: vehicle.engineTitle,
          modelFirestoreId: vehicle.modelFirestoreId,
        }
      : null;
    return mergeVehicleChoices(saved, recent, current) as Choice[];
  }, [vehicles, recent, vehicle.year, vehicle.make, vehicle.model, vehicle.engine, vehicle.engineTitle, vehicle.modelFirestoreId]);

  if (choices.length === 0) return null;

  const choose = (choice: Choice) => {
    selectVehicle(choice);
    if (choice.savedId) void touchVehicleLastUsed(choice.savedId).catch(() => {});
  };

  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Your vehicles
      </h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {choices.map((choice) => (
          <li key={vehicleKey(choice)}>
            <button
              type="button"
              onClick={() => choose(choice)}
              className="group flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:border-parts-pass-blue hover:bg-blue-50"
            >
              <VehicleSilhouette
                model={choice.modelName || choice.model}
                className="h-7 w-auto shrink-0 text-gray-400 group-hover:text-parts-pass-blue"
              />
              <span>
                <span className="font-semibold text-gray-900">
                  {[choice.year, choice.make, choice.modelName || choice.model].filter(Boolean).join(" ")}
                </span>
                {choice.engineTitle && (
                  <span className="block text-xs text-gray-500">{choice.engineTitle}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
