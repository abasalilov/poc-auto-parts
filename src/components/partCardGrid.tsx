import Image from "next/image";
import Link from "next/link";

import type { ListedPart } from "@/lib/catalog";
import { formatUsd } from "@/lib/pricing";
import { itemKey } from "@/lib/productUrl";
import AddListedPartButton from "./addListedPartButton";
import { FitBadge, PartFitProvider } from "./partFitBadges";

/** Crawlable product links with a photo, part type and current price, marked by fit once a vehicle is set. */
export default function PartCardGrid({
  parts,
  addToCart = false,
}: {
  parts: ListedPart[];
  /** Adds a button that stays on the page. The product link is unchanged. */
  addToCart?: boolean;
}) {
  return (
    <PartFitProvider items={parts.map(itemKey)}>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {parts.map((part) => (
          <li
            key={part.path}
            className="group flex h-full flex-col rounded-lg border border-gray-200 p-3 transition hover:border-parts-pass-blue hover:shadow-sm"
          >
            <Link href={part.path} className="flex flex-1 flex-col">
              <div className="relative aspect-[1/1] w-full overflow-hidden rounded-md bg-white">
                {part.image && (
                  <Image
                    src={part.image}
                    alt={part.title}
                    fill
                    sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
                    className="object-contain"
                  />
                )}
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-parts-pass-blue">
                {part.manufacturer}
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-900 group-hover:text-parts-pass-blue">
                {part.partType}
              </p>
              <p className="text-xs text-gray-600">Part # {part.partNumber}</p>
              <FitBadge item={itemKey(part)} />
              <p className="mt-auto pt-2 text-sm font-semibold text-gray-900">{formatUsd(part.priceCents)}</p>
            </Link>
            {addToCart && <AddListedPartButton part={part} />}
          </li>
        ))}
      </ul>
    </PartFitProvider>
  );
}
