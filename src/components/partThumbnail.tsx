"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

import { buildPartImageUrl, extractPartImageNames } from "@/lib/partImages";
import PartImageFallback from "./PartImageFallback";

interface PartThumbnailProps {
  part: Record<string, any>;
  alt?: string;
  /** `sizes` for the rendered width, so Next.js serves a matching image size. */
  sizes?: string;
  compact?: boolean;
}

const lookups = new Map<string, Promise<string[]>>();

/** Image names for parts that weren't loaded with `pies_images` (saved carts, orders). */
const lookupImageNames = (lineCode: string, partNumber: string) => {
  const key = `${lineCode}|${partNumber}`;
  let names = lookups.get(key);
  if (!names) {
    const params = new URLSearchParams({ lineCode, partNumber });
    names = fetch(`/api/part-images?${params}`)
      .then((res) => (res.ok ? res.json() : { images: [] }))
      .then((data: { images?: string[] }) => data.images ?? [])
      .catch(() => {
        lookups.delete(key);
        return [];
      });
    lookups.set(key, names);
  }
  return names;
};

const imageUrlsFor = (part: Record<string, any>, productLine: string, names?: string[]) => {
  const fromNames = extractPartImageNames(names ? { pies_images: names.join(",") } : part)
    .map((name) => buildPartImageUrl(productLine, name))
    .filter(Boolean);
  if (fromNames.length > 0) return fromNames;
  const image = typeof part.image === "string" ? part.image : "";
  return image.startsWith("https://storage.googleapis.com/") ? [image] : [];
};

/**
 * Part image resized by Next.js. Uses the image names loaded with the part (`pies_images`),
 * then the item's own image URL, then looks the names up for items saved without either.
 */
export default function PartThumbnail({
  part,
  alt,
  sizes = "(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw",
  compact = false,
}: PartThumbnailProps) {
  const productLine = String(
    part.productLine ?? part["Product Line"] ?? part.lineCode ?? "",
  ).trim();
  const partNumber = String(part.partNumber ?? part.part_number ?? "").trim();
  const title = alt ?? `${part.manufacturer ?? ""} ${part.category2 ?? ""} ${partNumber}`.trim();
  const initialUrls = imageUrlsFor(part, productLine);
  const needsLookup = initialUrls.length === 0 && part.pies_images === undefined;

  const [lookedUp, setLookedUp] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!needsLookup || !productLine || !partNumber) return;
    let alive = true;
    lookupImageNames(productLine, partNumber).then((names) => {
      if (alive) setLookedUp(imageUrlsFor({}, productLine, names));
    });
    return () => {
      alive = false;
    };
  }, [needsLookup, productLine, partNumber]);

  const urls = needsLookup ? (lookedUp ?? []) : initialUrls;
  const src = urls[failed];
  if (needsLookup && lookedUp === null && productLine && partNumber) {
    return <div className="h-full w-full rounded-md bg-gray-50" aria-hidden />;
  }
  if (!src) return <PartImageFallback part={part} partTitle={title} compact={compact} />;

  return (
    <div className="relative h-full w-full">
      <Image
        key={src}
        src={src}
        alt={title}
        fill
        sizes={sizes}
        className={`object-contain transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false);
          setFailed((count) => count + 1);
        }}
      />
    </div>
  );
}
