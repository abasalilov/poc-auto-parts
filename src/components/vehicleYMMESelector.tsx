"use client";
import { useState, useEffect } from "react";

import { useVehicle } from "@/context/VehicleContext";

import DropDown from "./dropDown";
import type { SelectChangeEventType } from "./dropDown";
import { yearsList } from "@/lib/years";
import { fetchEngines, fetchMakes, fetchModels } from "@/lib/vehicleClient";

interface VehicleYMMESelectorProps {}

interface DropDownOptions {
  value: string;
  label: string;
  id?: string | number;
  isDivider?: boolean;
}

const POPULAR_US_MAKES = [
  "Ford",
  "Chevrolet",
  "Toyota",
  "Honda",
  "Nissan",
  "Hyundai",
];

const sortMakesWithPopularFirst = (makeOptions: DropDownOptions[]) => {
  const popularIndex = new Map(
    POPULAR_US_MAKES.map((mk, index) => [mk.toLowerCase(), index]),
  );
  const sortedMakes = [...makeOptions].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  const popular = sortedMakes
    .filter((mk) => popularIndex.has(mk.label.toLowerCase()))
    .sort(
      (a, b) =>
        (popularIndex.get(a.label.toLowerCase()) ?? 0) -
        (popularIndex.get(b.label.toLowerCase()) ?? 0),
    );
  const remaining = sortedMakes.filter(
    (mk) => !popularIndex.has(mk.label.toLowerCase()),
  );

  if (!popular.length || !remaining.length) {
    return sortedMakes;
  }

  return [
    ...popular,
    { value: "__divider__", label: "__divider__", isDivider: true },
    ...remaining,
  ];
};

export default function VehicleYMMESelector(_props: VehicleYMMESelectorProps) {
  const {
    engine,
    setEngine,
    make,
    setMake,
    model,
    setModel,
    setModelName,
    year,
    setYear,
    setEngineTitle,
    setSaveVehicle,
    setVehicleRefId,
    addVehicle,
    modelFirestoreId,
    setModelFirestoreId,
  } = useVehicle();

  const [engines, setEngines] = useState<DropDownOptions[]>([]);
  const [makes, setMakes] = useState<DropDownOptions[]>([]);
  const [models, setModels] = useState<DropDownOptions[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingEngines, setLoadingEngines] = useState(false);

  useEffect(() => {
    if (!year) {
      setMakes([]);
      setLoadingMakes(false);
      return;
    }

    let cancelled = false;
    const loadMakes = async () => {
      setLoadingMakes(true);
      try {
        const makeOptions = (await fetchMakes(year)).map((mk) => ({
          value: mk,
          label: mk,
        }));

        if (!cancelled) {
          setMakes(sortMakesWithPopularFirst(makeOptions));
        }
      } catch (error) {
        console.error("Failed to load makes", error);
      } finally {
        if (!cancelled) {
          setLoadingMakes(false);
        }
      }
    };

    void loadMakes();
    return () => {
      cancelled = true;
    };
  }, [year]);

  useEffect(() => {
    if (!make || !year) {
      setModels([]);
      setLoadingModels(false);
      return;
    }

    let cancelled = false;
    const loadModels = async () => {
      setLoadingModels(true);
      try {
        const modelOptions = (await fetchModels(year, make))
          .map((md) => ({
            value: md.title,
            label: md.title,
            id: md.id,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        if (!cancelled) {
          setModels(modelOptions);
        }
      } catch (error) {
        console.error("Failed to load models", error);
      } finally {
        if (!cancelled) {
          setLoadingModels(false);
        }
      }
    };

    void loadModels();
    return () => {
      cancelled = true;
    };
  }, [make, year]);

  useEffect(() => {
    if (!modelFirestoreId) {
      setEngines([]);
      setLoadingEngines(false);
      return;
    }

    let cancelled = false;
    const loadEngines = async () => {
      setLoadingEngines(true);
      try {
        const engineOptions = (await fetchEngines(modelFirestoreId))
          .map((eng) => ({
            value: String(eng.id),
            label: eng.title,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        if (!cancelled) {
          setEngines(engineOptions);
        }
      } catch (error) {
        console.error("Failed to load engines", error);
      } finally {
        if (!cancelled) {
          setLoadingEngines(false);
        }
      }
    };

    void loadEngines();
    return () => {
      cancelled = true;
    };
  }, [modelFirestoreId]);

  /** After reload: model title is in storage but model id may be missing — look it up once. */
  useEffect(() => {
    if (!model || modelFirestoreId || models.length === 0) return;

    const match =
      models.find((m) => m.value === model) ||
      models.find(
        (m) =>
          m.value.toLowerCase() === model.toLowerCase() ||
          m.label.toLowerCase() === model.toLowerCase(),
      );

    if (match?.id != null) {
      setModelFirestoreId(String(match.id));
    }
  }, [model, modelFirestoreId, models, setModelFirestoreId]);

  const clearFromMake = () => {
    setMake("");
    setModel("");
    setModelName("");
    setModelFirestoreId("");
    setEngine(null);
    setEngineTitle("");
    setModels([]);
    setEngines([]);
  };

  const clearFromModel = () => {
    setModel("");
    setModelName("");
    setModelFirestoreId("");
    setEngine(null);
    setEngineTitle("");
    setEngines([]);
  };

  const handleSelectYear = (_e: SelectChangeEventType, v: string | null) => {
    if (!v || v === year) return;
    clearFromMake();
    setYear(v);
  };

  const handleSelectMake = (_e: SelectChangeEventType, v: string | null) => {
    if (!v || v === make) return;
    clearFromModel();
    setMake(v);
  };

  const handleSelectModel = (_e: SelectChangeEventType, v: string | null) => {
    if (!v || v === model) return;
    setEngine(null);
    setEngineTitle("");
    setEngines([]);
    setModel(v);
    const selected = models.find((m) => m.value === v);
    if (selected) {
      setModelName(selected.label);
      setModelFirestoreId(String(selected.id));
    } else {
      setModelName(v);
      setModelFirestoreId("");
    }
  };

  const handleSelectEngine = (_e: SelectChangeEventType, v: string | null) => {
    if (!v || v === engine) return;
    const eng = v.toString();
    const engineObj = engines.find((option) => option.value === eng);
    setEngineTitle(engineObj?.label ?? "");
    setEngine(eng);
    setSaveVehicle(true);
    setVehicleRefId(null);
    void addVehicle(eng);
  };

  const fields = [
    {
      label: "Year",
      onChange: handleSelectYear,
      options: yearsList,
      placeholder: "Select year",
      value: year || "",
      disabled: false,
      loading: false,
    },
    {
      label: "Make",
      onChange: handleSelectMake,
      options: makes,
      placeholder: loadingMakes ? "Loading..." : "Select make",
      value: make,
      disabled: !year,
      loading: loadingMakes,
    },
    {
      label: "Model",
      onChange: handleSelectModel,
      options: models,
      placeholder: loadingModels ? "Loading..." : "Select model",
      value: model,
      disabled: !make,
      loading: loadingModels,
    },
    {
      label: "Engine",
      onChange: handleSelectEngine,
      options: engines,
      placeholder: loadingEngines ? "Loading..." : "Select engine",
      value: engine || "",
      disabled: !modelFirestoreId,
      loading: loadingEngines,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {fields.map(({ label, ...field }, index) => (
        <div key={label} className="min-w-0">
          <span className="mb-1 block text-xs font-semibold text-gray-700">
            {index + 1}. {label}
          </span>
          <DropDown label={label} size="md" {...field} />
        </div>
      ))}
    </div>
  );
}
