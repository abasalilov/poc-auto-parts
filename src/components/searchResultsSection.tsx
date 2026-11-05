"use client";
import { Suspense, useCallback, useState, useEffect, useContext } from "react";
import { useFirestore } from "reactfire";
import { addDoc, collection } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { UserContext } from "@/context/UserContext";
import { SEARCHES } from "@/lib/constants";

import { useVehicle } from "@/context/VehicleContext";

import SearchResult from "./searchResult";
import CategoryBrowser from "./categoryBrowser";
import { useVehicleName } from "./vehicleFinder";
import { formatSearchResults } from "@/lib/helpers";
import SortFilterDropDown from "./sortFilterDropDown";
import { PART_SORT_OPTIONS, sortParts, type PartSort } from "@/lib/sortParts";
import SimilarPartTypes from "./similarPartTypes";
import { useQuery } from "@/context/QueryContext";
import { usePartSearch } from "@/context/PartSearchContext";
import { trackGa4RelatedSearchTerm, trackGa4Search } from "@/lib/ga4Analytics";

const FEW_RESULTS = 6;

interface SearchResultsSectionProps {
  addItemToCart: (x: any) => void;
}

/**
 * Reads ?search= in its own Suspense boundary so the rest of the page can be prerendered.
 * The URL is the source of truth for the committed search, so links and back/forward work.
 */
function SearchParamPrefill({ onSearch }: { onSearch: (search: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onSearch((searchParams?.get("search") || "").trim());
  }, [searchParams, onSearch]);

  return null;
}

let saveSearchTimerId: any = undefined;
let saveSearchTimeOut = 3000;

export default function SearchResultsSection({
  addItemToCart,
}: SearchResultsSectionProps) {
  const firestore = useFirestore();
  const { committedSearch, commitSearch } = useQuery();

  const { query, refine, clear, hits, status } = usePartSearch();
  const { user } = useContext(UserContext);
  const [sort, setSort] = useState<PartSort>("price-asc");
  const [sortedParts, setSortedParts] = useState<any[]>([]);
  const [lastSettledSearchKey, setLastSettledSearchKey] = useState<string>("");

  const { engine } = useVehicle();
  const vehicleName = useVehicleName();
  const { uid } = user;

  const handleUrlSearch = useCallback(
    (term: string) => {
      if (term.toLowerCase() === committedSearch.trim().toLowerCase()) return;
      commitSearch(term);
      if (term) refine(term);
      else clear();
    },
    [committedSearch, commitSearch, refine, clear],
  );

  useEffect(() => {
    const logSearchAnalytics = async (q: string) => {
      if (typeof window !== undefined) {
        trackGa4Search({ userId: uid, searchTerm: q });
        if (engine) {
          if (q.length > 3) {
            await addDoc(collection(firestore, SEARCHES), {
              author: user.uid,
              engineId: engine?.toString(),
              results: sortedParts.length,
              part: q,
              date: new Date(),
            });
          }
        }
      }
    };
    if (saveSearchTimerId) {
      clearTimeout(saveSearchTimerId);
    }
    if (engine) {
      saveSearchTimerId = setTimeout(async () => {
        logSearchAnalytics(query);
      }, saveSearchTimeOut);
    }
  }, [query, engine, uid]);

  useEffect(() => {
    const searchTerm = committedSearch.trim();
    if (!engine || searchTerm.length <= 2) return;

    const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
    if (normalize(query) === normalize(searchTerm)) return;

    refine(searchTerm);
  }, [engine, committedSearch, query, refine]);

  useEffect(() => {
    if (engine && query.length > 2) {
      const fitting = formatSearchResults(hits.filter((hit) => hit.category_2 !== "Battery")).filter(
        (part: any) => part.engineId === engine.toString(),
      );
      setSortedParts(sortParts(fitting, sort, committedSearch));
    } else {
      setSortedParts([]);
    }
  }, [hits, sort, engine, query, committedSearch]);

  const scrollToFinder = () => {
    window.requestAnimationFrame(() => {
      document.getElementById("vehicle-finder")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  /** Part type links navigate to `?search=`; this just brings the results into view. */
  const handleSelectPartType = () => scrollToFinder();

  const handleSelectRelatedTerm = (term: string) => {
    if (typeof window !== "undefined") {
      trackGa4RelatedSearchTerm({
        userId: uid,
        relatedSearchTerm: term,
        sourceSearchTerm: committedSearch.trim(),
      });
    }
  };

  const normalizedSearchKey = query.trim().toLowerCase();
  const isSearchLoading = status === "loading";
  const hasParts = sortedParts.length > 0;
  const shouldShowResults = Boolean(engine) && query.length > 2;
  const hasSettledCurrentSearch = lastSettledSearchKey === normalizedSearchKey;
  const hasNoParts =
    shouldShowResults && !isSearchLoading && hasSettledCurrentSearch && !hasParts;
  const shouldShowSimilar =
    hasSettledCurrentSearch && !isSearchLoading && sortedParts.length < FEW_RESULTS;
  const displaySearchTerm = committedSearch.trim() || query;

  useEffect(() => {
    if (!shouldShowResults) {
      setLastSettledSearchKey("");
      return;
    }
    if (!isSearchLoading) {
      setLastSettledSearchKey(normalizedSearchKey);
    }
  }, [shouldShowResults, isSearchLoading, normalizedSearchKey]);

  const prefill = (
    <Suspense fallback={null}>
      <SearchParamPrefill onSearch={handleUrlSearch} />
    </Suspense>
  );

  if (!engine) return prefill;

  if (!shouldShowResults) {
    return (
      <>
        {prefill}
        <CategoryBrowser
          engine={engine}
          heading={`All parts for your ${vehicleName}`}
          onSelect={handleSelectPartType}
        />
      </>
    );
  }

  const scrollToCategories = () =>
    document.getElementById("all-categories")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      {prefill}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-4 pt-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-gray-900">
            {displaySearchTerm}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {isSearchLoading
                ? "Searching..."
                : `${sortedParts.length} part${sortedParts.length === 1 ? "" : "s"} for your ${vehicleName}`}
            </span>
          </h2>
          <button
            type="button"
            onClick={scrollToCategories}
            className="mt-1 text-sm font-semibold text-parts-pass-blue hover:text-parts-pass-green"
          >
            Browse categories ↓
          </button>
        </div>
        {sortedParts.length > 1 && (
          <SortFilterDropDown filter={sort} onSelectFilter={setSort} options={PART_SORT_OPTIONS} />
        )}
      </div>

      {hasNoParts && (
        <section className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-center">
          <SearchOffIcon className="mx-auto text-gray-400" sx={{ fontSize: 48 }} />
          <h3 className="mt-3 text-lg font-semibold text-gray-900">No exact matches found</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            We couldn&apos;t find &quot;{displaySearchTerm}&quot; for your {vehicleName}. Try a similar
            part type or browse the categories below.
          </p>
        </section>
      )}

      {(hasParts || isSearchLoading) && (
        <ul
          role="list"
          className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white"
        >
          {hasParts
            ? sortedParts.map((part) => (
                <SearchResult key={part.id} part={part} addItemToCart={addItemToCart} />
              ))
            : Array.from({ length: 6 }).map((_, idx) => (
                <li key={`search-skeleton-${idx}`} className="flex animate-pulse gap-4 p-3">
                  <div className="h-20 w-20 shrink-0 rounded-md bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 w-1/2 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-2/3 rounded bg-gray-200" />
                  </div>
                  <div className="hidden w-28 sm:block">
                    <div className="ml-auto h-5 w-16 rounded bg-gray-200" />
                    <div className="mt-3 h-9 w-full rounded bg-gray-200" />
                  </div>
                </li>
              ))}
        </ul>
      )}

      {shouldShowSimilar && (
        <SimilarPartTypes
          engine={engine}
          term={displaySearchTerm}
          shown={[displaySearchTerm, ...sortedParts.map((part) => String(part.category2 ?? ""))]}
          onSelect={handleSelectRelatedTerm}
        />
      )}

      <div className="mt-10 border-t border-gray-200 pt-2">
        <CategoryBrowser
          engine={engine}
          heading={`Browse other parts for your ${vehicleName}`}
          selected={displaySearchTerm}
          onSelect={handleSelectPartType}
        />
      </div>
    </>
  );
}
