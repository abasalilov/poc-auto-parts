"use client";
import { useMemo } from "react";
import Link from "next/link";

import { usePartSearch } from "@/context/PartSearchContext";
import { similarPartTypes } from "@/lib/categoryBrowser";
import { searchHref } from "@/lib/searchUrl";
import { useEngineCategoryCounts } from "@/lib/useEngineCategoryCounts";

interface SimilarPartTypesProps {
  engine: string;
  term: string;
  /** Part types already in the results. */
  shown: string[];
  onSelect: (partType: string) => void;
}

export default function SimilarPartTypes({ engine, term, shown, onSelect }: SimilarPartTypesProps) {
  const { searchCategories } = usePartSearch();
  const { rows } = useEngineCategoryCounts(engine);
  const shownKey = shown.join("|");

  const items = useMemo(
    () => (rows ? similarPartTypes(searchCategories(term, 40), rows, shownKey.split("|")) : []),
    [rows, searchCategories, term, shownKey],
  );

  if (items.length === 0) return null;

  return (
    <p className="mt-6 text-sm text-gray-700">
      <span className="font-medium">Similar part types:</span>{" "}
      {items.map((item, idx) => (
        <span key={item.title}>
          {idx > 0 && <span className="mx-1.5 text-gray-400" aria-hidden>·</span>}
          <Link
            href={searchHref(item.title)}
            scroll={false}
            onClick={() => onSelect(item.title)}
            className="text-parts-pass-blue hover:underline"
          >
            {item.title}
          </Link>
          <span className="ml-1 text-xs text-gray-500">({item.count})</span>
        </span>
      ))}
    </p>
  );
}
