"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { commonPartTypes, groupCategoryCounts, splitIntoColumns } from "@/lib/categoryBrowser";
import { searchHref } from "@/lib/searchUrl";
import { useEngineCategoryCounts } from "@/lib/useEngineCategoryCounts";

const COLLAPSED_ITEMS = 6;

/** One fixed layout per breakpoint; CSS shows the one that matches the screen width. */
const LAYOUTS = [
  { columns: 1, className: "grid-cols-1 sm:hidden" },
  { columns: 2, className: "hidden grid-cols-2 sm:grid lg:hidden" },
  { columns: 3, className: "hidden grid-cols-3 lg:grid xl:hidden" },
  { columns: 4, className: "hidden grid-cols-4 xl:grid" },
];

interface CategoryBrowserProps {
  engine: string;
  heading: string;
  /** Part type currently shown in the results, marked instead of linked. */
  selected?: string;
  /** Called when a part type link is followed in this tab. */
  onSelect: (partType: string) => void;
}

export default function CategoryBrowser({ engine, heading, selected, onSelect }: CategoryBrowserProps) {
  const { rows, failed } = useEngineCategoryCounts(engine);
  const groups = useMemo(() => (rows ? groupCategoryCounts(rows) : null), [rows]);
  const columns = useMemo(() => {
    if (!rows || !groups) return [];
    const common = commonPartTypes(rows);
    return [
      ...(common.length > 0 ? [{ title: "Common repairs", items: common, collapsible: false }] : []),
      ...groups.map((group) => ({ ...group, collapsible: true })),
    ];
  }, [rows, groups]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => setExpanded(new Set()), [engine]);

  const selectedKey = selected?.trim().toLowerCase();
  const total = groups?.reduce((sum, group) => sum + group.count, 0) ?? 0;

  const toggle = (title: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  type Column = (typeof columns)[number];

  const collapsedHeight = (group: Column) =>
    2 + Math.min(group.items.length, group.collapsible ? COLLAPSED_ITEMS : group.items.length);

  const renderGroup = (group: Column) => {
    const isCollapsible = group.collapsible && group.items.length > COLLAPSED_ITEMS;
    const isExpanded = expanded.has(group.title);
    const visible =
      isCollapsible && !isExpanded ? group.items.slice(0, COLLAPSED_ITEMS) : group.items;
    return (
      <div key={group.title} className="mb-6">
        <h3 className="border-b border-gray-200 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-900">
          {group.title}
        </h3>
        <ul className="mt-2 space-y-1">
          {visible.map((item) => (
            <li key={item.title}>
              {item.title.toLowerCase() === selectedKey ? (
                <span aria-current="true" className="text-sm font-semibold text-gray-900">
                  {item.title}
                  <span className="ml-1 text-xs font-normal text-gray-500">({item.count})</span>
                </span>
              ) : (
                <Link
                  href={searchHref(item.title)}
                  scroll={false}
                  onClick={() => onSelect(item.title)}
                  className="text-sm text-parts-pass-blue hover:underline"
                >
                  {item.title}
                  <span className="ml-1 text-xs text-gray-500">({item.count})</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
        {isCollapsible && (
          <button
            type="button"
            onClick={() => toggle(group.title)}
            aria-expanded={isExpanded}
            className="mt-1 text-xs font-semibold text-gray-600 hover:text-parts-pass-blue"
          >
            {isExpanded ? "Show fewer" : `Show all ${group.items.length}`}
          </button>
        )}
      </div>
    );
  };

  return (
    <section aria-labelledby="all-categories" className="mt-6">
      <h2 id="all-categories" className="scroll-mt-36 text-lg font-semibold tracking-tight text-gray-900 md:scroll-mt-24">
        {heading}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {groups
          ? `${total.toLocaleString()} in-stock parts across ${groups.length} categories.`
          : failed
            ? "We couldn't load categories. Use the search box above instead."
            : "Loading categories..."}
      </p>

      {!groups && !failed && (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="animate-pulse space-y-2">
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-3 w-3/4 rounded bg-gray-100" />
              <div className="h-3 w-2/3 rounded bg-gray-100" />
              <div className="h-3 w-3/5 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {groups && groups.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">
          No in-stock parts for this vehicle yet. Try searching by part number above.
        </p>
      )}

      {groups && groups.length > 0 &&
        LAYOUTS.map((layout) => (
          <div key={layout.columns} className={`mt-5 grid items-start gap-x-8 ${layout.className}`}>
            {splitIntoColumns(columns, layout.columns, collapsedHeight).map((column, idx) => (
              <div key={idx}>{column.map(renderGroup)}</div>
            ))}
          </div>
        ))}
    </section>
  );
}
