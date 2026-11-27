"use client";

import { useState } from "react";
import { MagnifyingGlassPlusIcon } from "@heroicons/react/24/outline";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import PartImageFallback from "@/components/PartImageFallback";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const visible = images.filter((src) => !failed.has(src));
  const activeIndex = visible.length === 0 ? 0 : Math.min(active, visible.length - 1);
  const current = visible[activeIndex];

  const markFailed = (src: string) =>
    setFailed((prev) => new Set(prev).add(src));

  return (
    <div>
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-200 bg-white md:aspect-square">
        {current ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`View larger image of ${title}`}
            className="relative h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-parts-pass-blue"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current}
              alt={title}
              width={800}
              height={800}
              fetchPriority="high"
              className="h-full w-full object-contain p-6"
              onError={() => markFailed(current)}
            />
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-gray-200 bg-white/95 p-2 text-gray-700 shadow-sm">
              <MagnifyingGlassPlusIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          </button>
        ) : (
          <PartImageFallback partTitle={title} />
        )}
      </div>
      {visible.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Product images">
          {visible.map((src, index) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={src === current ? "true" : undefined}
                className={`aspect-square w-full overflow-hidden rounded-md border bg-white ${
                  src === current
                    ? "border-parts-pass-blue ring-2 ring-parts-pass-blue"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  width={120}
                  height={120}
                  loading="lazy"
                  className="h-full w-full object-contain p-1"
                  onError={() => markFailed(src)}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      {visible.length > 0 && (
        <Lightbox
          open={open}
          close={() => setOpen(false)}
          index={activeIndex}
          slides={visible.map((src) => ({ src, alt: title }))}
          plugins={[Zoom]}
          zoom={{ scrollToZoom: true, maxZoomPixelRatio: 3 }}
          carousel={{ finite: true }}
          styles={{ root: { zIndex: 2147483647 } }}
          render={
            visible.length > 1
              ? undefined
              : { buttonPrev: () => null, buttonNext: () => null }
          }
          on={{ view: ({ index }) => setActive(index) }}
        />
      )}
    </div>
  );
}
