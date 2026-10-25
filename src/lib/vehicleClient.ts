import { getJson } from "./partSearchClient";
import type { VehicleOption } from "./vehicleQueries";

export const fetchMakes = (year: string) =>
  getJson<string[]>(`/api/vehicles/makes?${new URLSearchParams({ year }).toString()}`);

export const fetchModels = (year: string, make: string) =>
  getJson<VehicleOption[]>(
    `/api/vehicles/models?${new URLSearchParams({ year, make }).toString()}`,
  );

export const fetchEngines = (modelId: string) =>
  getJson<VehicleOption[]>(
    `/api/vehicles/engines?${new URLSearchParams({ modelId }).toString()}`,
  );
