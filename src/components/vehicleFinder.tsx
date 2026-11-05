"use client";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Close from "@mui/icons-material/Close";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import { useVehicle } from "@/context/VehicleContext";
import { useQuery } from "@/context/QueryContext";
import { searchHref } from "@/lib/searchUrl";
import VehicleYMMESelector from "./vehicleYMMESelector";
import VinDecoderCard from "./vinDecoderCard";
import RecentVehicleChoices from "./recentVehicleChoices";
import VehicleSilhouette from "./vehicleSilhouette";
import PartSearchAutocomplete from "./partSearchAutocomplete";

export const useVehicleName = () => {
  const { year, make, model } = useVehicle();
  return [year, make, model].filter(Boolean).join(" ");
};

/** Step 1 picks the vehicle; once an engine is set it collapses to a summary plus the part search. */
export default function VehicleFinder() {
  const { engine, engineTitle, model } = useVehicle();
  const vehicleName = useVehicleName();
  const router = useRouter();
  const { committedSearch, search, setSearch } = useQuery();
  const [editing, setEditing] = useState(false);
  const [showVin, setShowVin] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousEngine = useRef(engine);

  useEffect(() => {
    if (engine && engine !== previousEngine.current) {
      setEditing(false);
      setShowVin(false);
    }
    previousEngine.current = engine;
  }, [engine]);

  const commitPartSearch = (term: string) => {
    const trimmed = term.trim();
    if (!engine || !trimmed) return;
    setSearch(trimmed);
    router.push(searchHref(trimmed), { scroll: false });
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearch("");
    router.push(searchHref(""), { scroll: false });
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const showSelector = !engine || editing;

  return (
    <>
      <div
        id="vehicle-finder"
        className={
          showSelector
            ? "scroll-mt-24 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
            : "scroll-mt-24 rounded-lg bg-slate-100 px-4 py-2.5"
        }
      >
        {showSelector && showVin && (
          <VinDecoderCard
            variant="inline"
            onBackToVehicle={() => setShowVin(false)}
            onVehicleConfirmed={() => {
              setShowVin(false);
              setEditing(false);
            }}
          />
        )}

        {showSelector && !showVin && (
          <>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">
                {engine ? "Change your vehicle" : "Select your vehicle"}
              </h2>
              {engine && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-sm font-semibold text-gray-600 hover:text-parts-pass-blue"
                >
                  Cancel
                </button>
              )}
            </div>
            {!engine && committedSearch && (
              <p className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-parts-pass-blue">
                Choose your vehicle to see <strong>{committedSearch}</strong> that fit.
              </p>
            )}
            <RecentVehicleChoices />
            <VehicleYMMESelector />
            <button
              type="button"
              onClick={() => setShowVin(true)}
              className="font-mont mt-3 text-sm font-semibold text-parts-pass-blue hover:text-parts-pass-green"
            >
              Or find your vehicle by VIN →
            </button>
          </>
        )}

        {!showSelector && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <div className="flex min-w-0 items-center gap-3">
              <VehicleSilhouette model={model} className="h-7 w-auto shrink-0 text-gray-500" />
              <p className="min-w-0 text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Shopping for: </span>
                {vehicleName}
                {engineTitle && <span className="text-gray-500"> · {engineTitle}</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm font-semibold text-parts-pass-blue hover:text-parts-pass-green"
            >
              Change vehicle
            </button>
          </div>
        )}
      </div>

      {engine && !editing && (
        <div className="sticky top-16 z-30 -mx-6 bg-white px-6 py-3 md:static md:mx-0 md:px-0">
          <div className="relative">
            <Input
              fullWidth
              startDecorator={<MagnifyingGlassIcon className="h-5 w-5 text-gray-500" aria-hidden />}
              endDecorator={
                <>
                  {search.trim().length > 0 && (
                    <IconButton
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleClear}
                      aria-label="Clear search"
                      title="Clear search"
                      variant="plain"
                      size="sm"
                    >
                      <Close />
                    </IconButton>
                  )}
                  <button
                    type="button"
                    onClick={() => commitPartSearch(search)}
                    className="ml-3 rounded-md bg-parts-pass-blue px-4 py-2 text-sm font-semibold text-white hover:bg-parts-pass-blue-light"
                  >
                    Search
                  </button>
                </>
              }
              className="font-mont"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitPartSearch(search);
                }
              }}
              slotProps={{
                input: {
                  placeholder: `Search parts for your ${model || "vehicle"}, e.g. brake pads or a part number`,
                  "aria-label": "Search part name or part number",
                  enterKeyHint: "search",
                  ref: inputRef,
                },
              }}
              sx={{
                fontSize: "18px",
                "--Input-minHeight": "56px",
                "--Input-radius": "10px",
                "--Input-focusedHighlight": "#1759C1",
                "--Input-decoratorChildHeight": "40px",
                borderWidth: "2px",
                borderColor: "#1759C1",
                backgroundColor: "#fff",
                boxShadow: "0 1px 3px rgba(23, 89, 193, 0.15)",
                "& input::placeholder": { textOverflow: "ellipsis" },
              }}
              value={search.replaceAll("  ", "")}
            />
            {search.trim() !== committedSearch.trim() && (
              <PartSearchAutocomplete engine={engine} query={search} onSelect={commitPartSearch} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
