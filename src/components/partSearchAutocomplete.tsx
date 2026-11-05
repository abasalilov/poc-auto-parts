"use client";

import { useMemo } from "react";
import { usePartSearch } from "@/context/PartSearchContext";

const SUGGESTION_LIMIT = 6;

interface PartSearchAutocompleteProps {
  engine?: string | null;
  query: string;
  onSelect: (term: string) => void;
}

export default function PartSearchAutocomplete({
  engine,
  query,
  onSelect,
}: PartSearchAutocompleteProps) {
  const { searchCategories, categoriesLoading } = usePartSearch();
  const trimmedQuery = query.trim();
  const isEnabled = Boolean(engine) && trimmedQuery.length >= 2;

  const suggestions = useMemo(
    () => (isEnabled ? searchCategories(query, SUGGESTION_LIMIT) : []),
    [isEnabled, query, searchCategories],
  );
  const isLoading = isEnabled && categoriesLoading;

  if (!isEnabled || (!isLoading && suggestions.length === 0)) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full z-[60] mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
      {isLoading && suggestions.length === 0 ? (
        <div className="px-3 py-2 text-sm text-slate-500">Finding suggestions...</div>
      ) : (
        <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(suggestion.title)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-gray-800 transition hover:bg-slate-50"
              >
                <span className="font-medium">{suggestion.title}</span>
                <span className="shrink-0 text-[11px] uppercase tracking-wide text-slate-400">
                  Part
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
