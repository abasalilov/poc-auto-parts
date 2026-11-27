"use client";
import Link from "next/link";

import { useVehicle } from "@/context/VehicleContext";
import type { Breadcrumb } from "@/lib/productStructuredData";
import { searchHref } from "@/lib/searchUrl";

interface ProductBreadcrumbProps {
  /** Brand and part type list pages; what search engines and new visitors see. */
  crumbs: Breadcrumb[];
  partType: string;
  partNumber: string;
}

/**
 * Home › brand › part type for search engines and new visitors. Once a vehicle is selected it's
 * the vehicle › part type, back into that vehicle's results.
 */
export default function ProductBreadcrumb({ crumbs, partType, partNumber }: ProductBreadcrumbProps) {
  const { engine, year, make, model } = useVehicle();
  const vehicleName = [year, make, model].filter(Boolean).join(" ");
  const forVehicle = Boolean(engine && vehicleName);

  const trail: Breadcrumb[] = forVehicle
    ? [{ name: vehicleName, path: "/" }, ...(partType ? [{ name: partType, path: searchHref(partType) }] : [])]
    : [
        { name: "Home", path: "/" },
        ...crumbs,
        ...(partType && !crumbs.some((crumb) => crumb.name === partType)
          ? [{ name: partType, path: searchHref(partType) }]
          : []),
      ];

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-600">
      <ol className="flex flex-wrap items-center gap-1">
        {trail.map((crumb, index) => (
          <li key={crumb.path}>
            {index > 0 && <span aria-hidden>› </span>}
            <Link href={crumb.path} className="hover:text-parts-pass-blue">
              {crumb.name}
            </Link>
          </li>
        ))}
        <li aria-current="page" className="text-gray-900">
          <span aria-hidden>›</span> {partNumber}
        </li>
      </ol>
    </nav>
  );
}
