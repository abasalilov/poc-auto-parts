import type { VehicleSnapshot } from "./vehicleLocalStorage";

const STORAGE_KEY = "partsPassRecentVehicles";
export const MAX_VEHICLE_CHOICES = 5;

/** Engine and year decide which parts show; model names vary between saved and picked vehicles. */
export const vehicleKey = (v: VehicleSnapshot) =>
  [v.engine, v.year].map((part) => String(part ?? "").trim()).join("|");

/** Puts `vehicle` first, dropping an older copy of it. */
export const addRecentVehicle = (
  list: VehicleSnapshot[],
  vehicle: VehicleSnapshot,
  max = MAX_VEHICLE_CHOICES,
): VehicleSnapshot[] => {
  const key = vehicleKey(vehicle);
  return [vehicle, ...list.filter((v) => vehicleKey(v) !== key)].slice(0, max);
};

/** Saved account vehicles first, then this device's recent ones, without the current vehicle. */
export const mergeVehicleChoices = (
  saved: VehicleSnapshot[],
  recent: VehicleSnapshot[],
  current: VehicleSnapshot | null,
  max = MAX_VEHICLE_CHOICES,
): VehicleSnapshot[] => {
  const seen = new Set(current?.engine ? [vehicleKey(current)] : []);
  return [...saved, ...recent]
    .filter((v) => {
      const key = vehicleKey(v);
      if (!v.engine || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, max);
};

/** Maps a Firestore `vehicles` doc (with its engine ref resolved) to a snapshot. */
export const snapshotFromSavedVehicle = (vh: any): VehicleSnapshot | null => {
  const engine = vh?.engine?.id;
  if (engine == null || engine === "") return null;
  const year = typeof vh.year === "object" ? vh.year?.label ?? vh.year?.title : vh.year;
  const model = String(vh.model ?? "");
  return {
    year: year != null ? String(year) : null,
    make: String(vh.make ?? ""),
    model,
    modelName: model,
    engine: String(engine),
    engineTitle: String(vh.engine?.title ?? ""),
    modelFirestoreId: "",
  };
};

export function readRecentVehicles(): VehicleSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => v?.engine) : [];
  } catch {
    return [];
  }
}

export function rememberRecentVehicle(vehicle: VehicleSnapshot): VehicleSnapshot[] {
  const next = addRecentVehicle(readRecentVehicles(), vehicle);
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
