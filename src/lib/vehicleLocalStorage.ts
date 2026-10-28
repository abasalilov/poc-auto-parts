/** Single JSON blob — one read, one write, no partial key state. */
const STORAGE_KEY = "partsPassVehicle";

/** Legacy keys kept only for one-time migration from older saves. */
const LEGACY_KEYS = {
  year: "selectedYear",
  make: "selectedMake",
  model: "selectedModel",
  modelName: "selectedModelName",
  engine: "selectedEngine",
  engineTitle: "selectedEngineTitle",
  modelId: "selectedModelId",
} as const;

export type VehicleSnapshot = {
  year: string | null;
  make: string;
  model: string;
  modelName: string;
  engine: string | null;
  engineTitle: string;
  modelFirestoreId: string;
};

const emptySnapshot = (): VehicleSnapshot => ({
  year: null,
  make: "",
  model: "",
  modelName: "",
  engine: null,
  engineTitle: "",
  modelFirestoreId: "",
});

function readLegacySnapshot(): VehicleSnapshot | null {
  if (typeof window === "undefined") return null;

  const model = localStorage.getItem(LEGACY_KEYS.model) ?? "";
  const snapshot: VehicleSnapshot = {
    year: localStorage.getItem(LEGACY_KEYS.year),
    make: localStorage.getItem(LEGACY_KEYS.make) ?? "",
    model,
    modelName: localStorage.getItem(LEGACY_KEYS.modelName) ?? model,
    engine: localStorage.getItem(LEGACY_KEYS.engine),
    engineTitle: localStorage.getItem(LEGACY_KEYS.engineTitle) ?? "",
    modelFirestoreId: localStorage.getItem(LEGACY_KEYS.modelId) ?? "",
  };

  const hasData = Boolean(
    snapshot.year || snapshot.make || snapshot.model || snapshot.engine,
  );
  return hasData ? snapshot : null;
}

function clearLegacyKeys() {
  if (typeof window === "undefined") return;
  Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function readVehicleSnapshotFromLocalStorage(): VehicleSnapshot {
  if (typeof window === "undefined") {
    return emptySnapshot();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return { ...emptySnapshot(), ...(JSON.parse(raw) as VehicleSnapshot) };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const legacy = readLegacySnapshot();
  if (legacy) {
    writeVehicleSnapshotToLocalStorage(legacy);
    clearLegacyKeys();
    return legacy;
  }

  return emptySnapshot();
}

export function writeVehicleSnapshotToLocalStorage(snapshot: VehicleSnapshot) {
  if (typeof window === "undefined") return;

  const hasSelection = Boolean(
    snapshot.year || snapshot.make || snapshot.model || snapshot.engine,
  );
  if (!hasSelection) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearVehicleLocalStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  clearLegacyKeys();
}
