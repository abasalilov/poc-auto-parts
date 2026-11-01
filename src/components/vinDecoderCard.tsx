"use client";

import { useMemo, useState } from "react";
import { useFirestore } from "reactfire";
import { collection, getDocs, query, where } from "firebase/firestore";

import { ENGINE, MAKE, MODEL, MODEL_ID, TITLE, YEAR } from "@/lib/constants";
import { useVehicle } from "@/context/VehicleContext";
import { useUserContext } from "@/context/UserContext";
import VehicleYMMESelector from "./vehicleYMMESelector";

type DecodedVehicle = {
  year: string;
  make: string;
  model: string;
  engine: string;
  trim: string;
  body_class: string;
  confidence: "high" | "medium" | "low";
};

type VinDecodeApiResponse =
  | { status: "ok"; vin: string; vehicle: DecodedVehicle }
  | { status: "invalid_request"; vin: string; message: string };

type EngineCandidate = {
  id: string;
  title: string;
  make: string;
  model: string;
  modelId?: string | number;
  refId: string;
};

type ModelCandidate = {
  id: string | number;
  label: string;
  make: string;
};

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
const vinDecodeClientCache = new Map<string, VinDecodeApiResponse>();

const normalize = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const engineScore = (engineTitle: string, decodedEngine: string) => {
  if (!decodedEngine) return 0;
  const hay = normalize(engineTitle);
  const needle = normalize(decodedEngine);
  if (!needle) return 0;
  if (hay === needle) return 100;
  if (hay.includes(needle) || needle.includes(hay)) return 60;
  const needleTokens = needle.split(/\s+/).filter(Boolean);
  return needleTokens.reduce((score, token) => (hay.includes(token) ? score + 8 : score), 0);
};

const tokenize = (value: string) =>
  normalize(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const extractNumericTokens = (value: string) => tokenize(value).filter((token) => /\d/.test(token));

const hasToken = (value: string, token: string) => tokenize(value).includes(token);

const modelScore = (modelLabel: string, decodedModel: string, decodedTrim: string) => {
  const hay = normalize(modelLabel);
  const needle = normalize(`${decodedModel} ${decodedTrim}`.trim());
  if (!hay || !needle) return 0;
  if (hay === normalize(decodedModel)) return 260;
  if (hay === needle) return 240;
  if (hay.includes(normalize(decodedModel)) || normalize(decodedModel).includes(hay)) {
    return 180;
  }

  const needleTokens = tokenize(`${decodedModel} ${decodedTrim}`.trim());
  const hayTokens = new Set(tokenize(modelLabel));
  let score = needleTokens.reduce((acc, token) => (hayTokens.has(token) ? acc + 20 : acc), 0);

  const decodedNumeric = extractNumericTokens(`${decodedModel} ${decodedTrim}`);
  const candidateNumeric = extractNumericTokens(modelLabel);
  if (decodedNumeric.length === 0 && candidateNumeric.length > 0) {
    // VIN did not indicate a numbered trim (e.g. 1500/6500), so avoid over-specific HD models.
    score -= 40;
  }
  if (decodedNumeric.length > 0) {
    const numericHits = decodedNumeric.filter((n) => candidateNumeric.includes(n)).length;
    score += numericHits * 45;
  }

  const decodedHasHD = hasToken(`${decodedModel} ${decodedTrim}`, "hd");
  const candidateHasHD = hasToken(modelLabel, "hd");
  if (!decodedHasHD && candidateHasHD) score -= 55;
  if (decodedHasHD && candidateHasHD) score += 25;

  return score;
};

interface VinDecoderCardProps {
  variant?: "card" | "homepage" | "inline";
  onVehicleConfirmed?: () => void;
  onBackToVehicle?: () => void;
}

export default function VinDecoderCard({
  variant = "card",
  onVehicleConfirmed,
  onBackToVehicle,
}: VinDecoderCardProps) {
  const firestore = useFirestore();
  const { user } = useUserContext();
  const {
    addVehicle,
    setYear,
    setMake,
    setModel,
    setModelName,
    setModelFirestoreId,
    setEngine,
    setEngineTitle,
    handleSetSaveVehicle,
  } = useVehicle();

  const [vin, setVin] = useState("");
  const [decodedVehicle, setDecodedVehicle] = useState<DecodedVehicle | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodeLoading, setDecodeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [showManualEdit, setShowManualEdit] = useState(false);

  const normalizedVin = useMemo(() => vin.trim().toUpperCase(), [vin]);

  const openManualEdit = (vehicle?: DecodedVehicle) => {
    handleSetSaveVehicle(true);
    if (vehicle) {
      setYear(vehicle.year);
      setMake(vehicle.make.toUpperCase());
      setModel(vehicle.model);
      setModelName(vehicle.model);
      setModelFirestoreId("");
    }
    setShowManualEdit(true);
  };

  const applyDecodedToContext = (vehicle: DecodedVehicle, engineCandidate: EngineCandidate) => {
    setYear(vehicle.year);
    setMake(engineCandidate.make || vehicle.make);
    setModel(engineCandidate.model || vehicle.model);
    setModelName(engineCandidate.model || vehicle.model);
    setModelFirestoreId(
      engineCandidate.modelId !== undefined && engineCandidate.modelId !== null
        ? String(engineCandidate.modelId)
        : "",
    );
    setEngine(engineCandidate.id);
    setEngineTitle(engineCandidate.title || vehicle.engine);
  };

  const resolveEngineCandidate = async (vehicle: DecodedVehicle) => {
    const yearValue = String(vehicle.year || "").trim();
    if (!yearValue) return null;

    // 1) Resolve model first (prevents Tahoe/Silverado cross-match on shared engines).
    const modelCollection = collection(firestore, MODEL);
    const modelByYear = query(modelCollection, where(YEAR, "==", yearValue));
    const modelSnapshot = await getDocs(modelByYear);
    const allYearModels: ModelCandidate[] = modelSnapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, any>;
      return {
        id: data.id,
        label: String(data[TITLE] ?? ""),
        make: String(data[MAKE] ?? ""),
      };
    });

    const makeFilteredModels = allYearModels.filter((m) => {
      const mk = normalize(m.make);
      const target = normalize(vehicle.make);
      return mk === target || mk.replaceAll(" ", "") === target.replaceAll(" ", "");
    });
    const modelCandidates = makeFilteredModels.length > 0 ? makeFilteredModels : allYearModels;
    if (modelCandidates.length === 0) return null;

    const rankedModels = [...modelCandidates]
      .map((model) => ({
        model,
        score: modelScore(model.label, vehicle.model, vehicle.trim),
      }))
      .filter((entry) => entry.score >= 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    if (rankedModels.length === 0) return null;

    // 2) Resolve engines for top model candidates and choose best combined score.
    const engineCollection = collection(firestore, ENGINE);
    let bestCombined: { candidate: EngineCandidate; combinedScore: number } | null = null;

    for (const rankedModel of rankedModels) {
      const modelId = Number(rankedModel.model.id);
      if (!Number.isFinite(modelId)) continue;

      const engineByModelId = query(engineCollection, where(MODEL_ID, "==", modelId));
      const engineSnapshot = await getDocs(engineByModelId);
      const engines = engineSnapshot.docs
        .map((doc) => {
          const data = doc.data() as Record<string, any>;
          return {
            id: String(data.id ?? ""),
            title: String(data[TITLE] ?? ""),
            make: String(data[MAKE] ?? ""),
            model: rankedModel.model.label,
            modelId: data[MODEL_ID] ?? rankedModel.model.id,
            refId: doc.id,
          };
        })
        .filter((d) => d.id && d.refId);
      if (engines.length === 0) continue;

      const rankedEngines = [...engines].sort((a, b) => {
        return engineScore(b.title, vehicle.engine) - engineScore(a.title, vehicle.engine);
      });
      const topEngine = rankedEngines[0];
      const combinedScore =
        rankedModel.score + engineScore(topEngine.title, vehicle.engine) * 2;

      if (!bestCombined || combinedScore > bestCombined.combinedScore) {
        bestCombined = { candidate: topEngine, combinedScore };
      }
    }

    return bestCombined?.candidate ?? null;
  };

  const handleDecode = async () => {
    setSaveSuccess(null);
    setDecodeError(null);
    setDecodedVehicle(null);

    if (!VIN_REGEX.test(normalizedVin)) {
      setDecodeError("Please enter a valid 17-character VIN.");
      return;
    }

    const cached = vinDecodeClientCache.get(normalizedVin);
    if (cached) {
      if (cached.status === "ok") {
        setDecodedVehicle(cached.vehicle);
      } else {
        setDecodeError(cached.message || "We couldn't decode this VIN.");
      }
      return;
    }

    setDecodeLoading(true);
    try {
      const response = await fetch("/api/vin-decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: normalizedVin }),
      });
      const data = (await response.json()) as VinDecodeApiResponse;
      vinDecodeClientCache.set(normalizedVin, data);

      if (data.status === "ok") {
        setDecodedVehicle(data.vehicle);
      } else {
        setDecodeError(data.message || "We couldn't decode this VIN.");
      }
    } catch {
      setDecodeError("VIN decoder is unavailable right now. You can continue manually.");
    } finally {
      setDecodeLoading(false);
    }
  };

  const handleConfirmVehicle = async () => {
    if (!decodedVehicle) return;

    setSaveLoading(true);
    setDecodeError(null);
    setSaveSuccess(null);
    try {
      const engineCandidate = await resolveEngineCandidate(decodedVehicle);
      if (!engineCandidate) {
        setDecodeError("We couldn't fully identify your engine. You can continue manually.");
        openManualEdit(decodedVehicle);
        return;
      }

      applyDecodedToContext(decodedVehicle, engineCandidate);
      if (!user?.uid) {
        setDecodedVehicle(null);
        setVin("");
        setShowManualEdit(false);
        onVehicleConfirmed?.();
        return;
      }
      const saveResult = await addVehicle(engineCandidate.id, {
        vin: normalizedVin,
        source: "vin",
        year: decodedVehicle.year,
        make: engineCandidate.make || decodedVehicle.make,
        model: engineCandidate.model || decodedVehicle.model,
        modelName: engineCandidate.model || decodedVehicle.model,
      });
      if (saveResult.status === "skipped") {
        setDecodeError("We couldn't save this vehicle. Please try Edit and confirm manually.");
        openManualEdit(decodedVehicle);
        return;
      }
      setSaveSuccess(
        saveResult.status === "updated"
          ? "Vehicle already existed. We refreshed it as your active vehicle."
          : "Vehicle saved to your account.",
      );
      setDecodedVehicle(null);
      setVin("");
      setShowManualEdit(false);
      onVehicleConfirmed?.();
    } catch {
      setDecodeError("We couldn't save this vehicle. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const isHomepageVariant = variant === "homepage";
  const isInlineVariant = variant === "inline";

  return (
    <div
      className={
        isInlineVariant
          ? "w-full"
          : isHomepageVariant
          ? "rounded-lg border border-gray-200 bg-white p-3 sm:p-4"
          : "rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
      }
    >
      {!isInlineVariant && (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            VIN Decoder
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {isHomepageVariant
              ? "Enter VIN (17 characters) to auto-fill vehicle"
              : "Enter VIN (17 characters)"}
          </p>
        </>
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={vin}
          onChange={(e) => setVin(e.target.value.toUpperCase())}
          maxLength={17}
          placeholder="1HGCM82633A123456"
          className="font-mont w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-parts-pass-blue focus:outline-none focus:ring-2 focus:ring-parts-pass-blue/20"
        />
        <button
          type="button"
          onClick={handleDecode}
          disabled={decodeLoading}
          className="font-mont rounded-md bg-parts-pass-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-parts-pass-green disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {decodeLoading ? "Decoding..." : "Decode VIN"}
        </button>
      </div>
      {!isInlineVariant && (
        <p className="mt-2 text-xs text-slate-500">
          Not sure? Your VIN is on your dashboard or driver-side door.
        </p>
      )}

      {isInlineVariant && onBackToVehicle && (
        <button
          type="button"
          onClick={onBackToVehicle}
          className="font-mont mt-2 text-xs font-semibold text-parts-pass-blue transition-colors hover:text-parts-pass-green"
        >
          Use year, make, model instead
        </button>
      )}

      {decodeError && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {decodeError}
        </p>
      )}

      {decodedVehicle && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
          <p className="text-sm font-semibold text-emerald-800">We found your vehicle:</p>
          <p className="mt-1 text-sm text-slate-900">
            {decodedVehicle.year} {decodedVehicle.make} {decodedVehicle.model}
          </p>
          <p className="mt-0.5 text-sm text-slate-700">
            Engine: {decodedVehicle.engine || "Unknown"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConfirmVehicle}
              disabled={saveLoading}
              className="font-mont rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {saveLoading ? "Saving..." : "Confirm Vehicle"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isInlineVariant && onBackToVehicle) {
                  onBackToVehicle();
                  return;
                }
                openManualEdit(decodedVehicle);
              }}
              className="font-mont rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {saveSuccess && (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {saveSuccess}
        </p>
      )}

      {showManualEdit && !isHomepageVariant && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <p className="mb-2 text-sm font-semibold text-slate-800">Continue manually</p>
          <VehicleYMMESelector />
        </div>
      )}
    </div>
  );
}
