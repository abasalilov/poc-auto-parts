"use client";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useFirestore } from "reactfire";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { UserContext } from "./UserContext";
import {
  AUTHOR,
  ENGINE,
  ID,
  MAKE,
  TITLE,
  VEHICLES,
  YEAR,
} from "@/lib/constants";
import {
  clearVehicleLocalStorage,
  readVehicleSnapshotFromLocalStorage,
  writeVehicleSnapshotToLocalStorage,
  type VehicleSnapshot,
} from "@/lib/vehicleLocalStorage";
import { rememberRecentVehicle } from "@/lib/recentVehicles";
import { trackGa4AddVehicle } from "@/lib/ga4Analytics";

type AddVehicleMetadata = {
  vin?: string;
  source?: string;
  year?: string;
  make?: string;
  model?: string;
  modelName?: string;
};

type AddVehicleResult = {
  status: "created" | "updated" | "skipped";
};

const normalizeValue = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const resolveYearLabel = (rawYear: unknown) => {
  if (!rawYear) return "";
  if (typeof rawYear === "object") {
    const yr = rawYear as { title?: string; label?: string; value?: string };
    return String(yr.title ?? yr.label ?? yr.value ?? "").trim();
  }
  return String(rawYear).trim();
};

interface VehicleContext {
  /** Pass engine id string when saving immediately after engine select (state may not have flushed yet). */
  addVehicle: (
    engineIdOverride?: string,
    metadata?: AddVehicleMetadata,
  ) => Promise<AddVehicleResult>;
  engineTitle: string;
  engine: string | null;
  setEngine: (x: string | null) => void;
  handleSetSaveVehicle: (x: boolean) => void;
  touchVehicleLastUsed: (vehicleId: string) => Promise<void>;
  /** Switches the whole vehicle at once, e.g. from a recent or saved vehicle. */
  selectVehicle: (vehicle: VehicleSnapshot) => void;
  make: string;
  setMake: (x: string) => void;
  model: string;
  setModel: (x: string) => void;
  resetVehicle: () => void;
  setModelName: (x: string) => void;
  /** Firestore `model` document id for engine queries. */
  modelFirestoreId: string;
  setModelFirestoreId: (x: string) => void;
  saveVehicle: boolean;
  vehicleRefId: string | null;
  setVehicleRefId: (x: any) => void;
  year: string | null;
  setYear: (x: any) => void;
  setSaveVehicle: (x: boolean) => void;
  setEngineTitle: (x: string) => void;
}

export const VehicleContext = createContext<VehicleContext>(
  {} as VehicleContext,
);

export default function VehicleContextProvider(props: PropsWithChildren) {
  const firestore = useFirestore();
  const { user } = useContext(UserContext);

  const [engine, setEngine] = useState<string | null>(null);
  const [engineTitle, setEngineTitle] = useState<string>("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [modelName, setModelName] = useState("");
  const [modelFirestoreId, setModelFirestoreId] = useState("");
  const [saveVehicle, setSaveVehicle] = useState(true);
  const [vehicleRefId, setVehicleRefId] = useState<any>(null);
  const [year, setYear] = useState<string | null>(null);
  const addVehicleInFlightRef = useRef(false);

  useEffect(() => {
    const saved = readVehicleSnapshotFromLocalStorage();
    const hasSaved = Boolean(
      saved.year || saved.make || saved.model || saved.engine,
    );
    if (!hasSaved) return;

    setYear(saved.year);
    setMake(saved.make);
    setModel(saved.model);
    setModelName(saved.modelName);
    setModelFirestoreId(saved.modelFirestoreId);
    setEngine(saved.engine);
    setEngineTitle(saved.engineTitle);
  }, []);

  useEffect(() => {
    const hasSelection = Boolean(year || make || model || engine);
    if (!hasSelection) return;

    const snapshot = { year, make, model, modelName, modelFirestoreId, engine, engineTitle };
    writeVehicleSnapshotToLocalStorage(snapshot);
    if (engine) rememberRecentVehicle(snapshot);
  }, [year, make, model, modelName, modelFirestoreId, engine, engineTitle]);

  const addVehicle = useCallback(
    async (
      engineIdOverride?: string,
      metadata?: AddVehicleMetadata,
    ): Promise<AddVehicleResult> => {
      const engineId = engineIdOverride ?? engine;
      if (!engineId || !user?.uid) {
        return { status: "skipped" };
      }
      if (addVehicleInFlightRef.current) {
        return { status: "skipped" };
      }
      addVehicleInFlightRef.current = true;

      try {
        const effectiveYear = metadata?.year ?? year ?? "";
        const effectiveMake = metadata?.make ?? make;
        const effectiveModel =
          metadata?.modelName ?? metadata?.model ?? modelName ?? model;
        const author = user.uid;
        const engineCollection = collection(firestore, ENGINE);
        const parsedEngineId = Number(engineId);
        const engineByNumericId = Number.isFinite(parsedEngineId)
          ? query(engineCollection, where(ID, "==", parsedEngineId))
          : null;
        const numericSnapshot = engineByNumericId
          ? await getDocs(engineByNumericId)
          : { docs: [] as any[] };
        const stringSnapshot =
          numericSnapshot.docs.length > 0
            ? numericSnapshot
            : await getDocs(
                query(engineCollection, where(ID, "==", String(engineId))),
              );
        if (!stringSnapshot.docs.length) {
          return { status: "skipped" };
        }
        const engineRef = stringSnapshot.docs[0].ref;

        const existingForEngine = query(
          collection(firestore, VEHICLES),
          where(AUTHOR, "==", author),
          where("engine", "==", engineRef),
        );
        const existingSnap = await getDocs(existingForEngine);
        const sameVehicleDoc = existingSnap.docs.find((entry) => {
          const data = entry.data() as Record<string, any>;
          const existingYear = resolveYearLabel(data.year);
          const yearMatches =
            normalizeValue(existingYear) === normalizeValue(effectiveYear);
          const makeMatches =
            normalizeValue(data.make) === normalizeValue(effectiveMake);
          const modelMatches =
            normalizeValue(data.model) === normalizeValue(effectiveModel);
          return yearMatches && makeMatches && modelMatches;
        });

        if (sameVehicleDoc) {
          await updateDoc(sameVehicleDoc.ref, {
            lastUsed: new Date(),
            vin: metadata?.vin || "",
            source: metadata?.source || "manual",
            make: effectiveMake,
            model: effectiveModel,
          });
          setSaveVehicle(false);
          return { status: "updated" };
        }

        const yearCollection = collection(firestore, YEAR);
        const yearByTitle = query(
          yearCollection,
          where(TITLE, "==", String(effectiveYear)),
        );
        const years = await getDocs(yearByTitle);
        const yearCandidates = years.docs.map(
          (d) => d.data() as Record<string, any>,
        );
        const yearDoc =
          yearCandidates.find(
            (entry) =>
              normalizeValue(entry.make) === normalizeValue(effectiveMake),
          ) ||
          yearCandidates.find(
            (entry) =>
              normalizeValue(entry[MAKE]) === normalizeValue(effectiveMake),
          ) ||
          yearCandidates[0];

        const updatedYear = {
          ...(yearDoc || {}),
          yearId: yearDoc?.id || String(effectiveYear),
          label: yearDoc?.title || String(effectiveYear),
          value: yearDoc?.title || String(effectiveYear),
        };
        const vehicleData = {
          author: author,
          engine: engineRef,
          bodyType: "",
          color: "",
          dateAdded: new Date(),
          make: effectiveMake,
          model: effectiveModel,
          year: updatedYear,
          imageMedium: "",
          imageThumb: "",
          plate: "",
          nickname: "",
          lastUsed: new Date(),
          vin: metadata?.vin || "",
          source: metadata?.source || "manual",
        };
        await addDoc(collection(firestore, VEHICLES), { ...vehicleData });
        if (typeof window !== undefined) {
          trackGa4AddVehicle({
            userId: user.uid,
            make: effectiveMake,
            model: effectiveModel,
            engine: engineRef,
          });
        }
        setSaveVehicle(false);
        return { status: "created" };
      } finally {
        addVehicleInFlightRef.current = false;
      }
    },
    [engine, firestore, make, model, modelName, user.uid, year],
  );

  const handleSetSaveVehicle = useCallback((t: boolean) => {
    setSaveVehicle(t);
  }, []);

  const touchVehicleLastUsed = useCallback(
    async (vehicleId: string) => {
      const vehicleRef = doc(firestore, VEHICLES, vehicleId);
      await updateDoc(vehicleRef, {
        lastUsed: new Date(),
      });
    },
    [firestore],
  );

  const selectVehicle = useCallback((vehicle: VehicleSnapshot) => {
    setYear(vehicle.year);
    setMake(vehicle.make);
    setModel(vehicle.model);
    setModelName(vehicle.modelName || vehicle.model);
    setModelFirestoreId(vehicle.modelFirestoreId);
    setEngine(vehicle.engine);
    setEngineTitle(vehicle.engineTitle);
  }, []);

  const resetVehicle = useCallback(() => {
    setEngine(null);
    setMake("");
    setModel("");
    setModelName("");
    setModelFirestoreId("");
    setEngineTitle("");
    setYear(null);
    setVehicleRefId(null);
    clearVehicleLocalStorage();
  }, []);

  const value = useMemo(
    () => ({
      addVehicle,
      engine,
      setEngine,
      engineTitle,
      handleSetSaveVehicle,
      touchVehicleLastUsed,
      selectVehicle,
      make,
      setMake,
      model,
      setModel,
      resetVehicle,
      setModelName,
      modelFirestoreId,
      setModelFirestoreId,
      saveVehicle,
      vehicleRefId,
      setVehicleRefId,
      year,
      setYear,
      setSaveVehicle,
      setEngineTitle,
    }),
    [
      addVehicle,
      engine,
      setEngine,
      engineTitle,
      handleSetSaveVehicle,
      touchVehicleLastUsed,
      selectVehicle,
      make,
      setMake,
      model,
      setModel,
      resetVehicle,
      setModelName,
      modelFirestoreId,
      setModelFirestoreId,
      saveVehicle,
      vehicleRefId,
      setVehicleRefId,
      year,
      setYear,
      setSaveVehicle,
      setEngineTitle,
    ],
  );

  return (
    <VehicleContext.Provider value={value}>
      {props.children}
    </VehicleContext.Provider>
  );
}

export const useVehicle = () => useContext(VehicleContext);
