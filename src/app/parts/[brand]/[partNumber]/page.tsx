import type { Metadata } from "next";
import Link from "next/link";
import { cache, Suspense } from "react";
import { notFound } from "next/navigation";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { getListSummary, hasImageFolder } from "@/lib/catalog";
import { isIndexable } from "@/lib/indexing";
import { formatUsd } from "@/lib/pricing";
import {
  getProduct,
  getProductFitment,
  type FitmentGroup,
  type Product,
} from "@/lib/productQueries";
import {
  breadcrumbJsonLd,
  isRemanufactured,
  productBreadcrumbs,
  productDescription,
  productJsonLd,
  serializeJsonLd,
} from "@/lib/productStructuredData";
import { brandListPath, partTypeListPath, partTypeSlug, productUrl } from "@/lib/productUrl";
import { getRelatedParts } from "@/lib/relatedParts";
import { loadParcels, parcelFor } from "@/lib/shippingParcels";
import { isFreightOnly, shipmentCents } from "@/lib/shippingRates";

import BuyBox from "./BuyBox";
import ProductBreadcrumb from "./ProductBreadcrumb";
import ProductGallery from "./ProductGallery";
import RelatedPartsSection from "./RelatedPartsSection";
import YourVehicleFit from "./YourVehicleFit";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: { brand: string; partNumber: string };
}

const getCachedProduct = cache(getProduct);

const loadProduct = async ({ brand, partNumber }: PageProps["params"]) => {
  const product = await getCachedProduct(decodeURIComponent(brand).toLowerCase(), decodeURIComponent(partNumber));
  if (!product || (await hasImageFolder(product.lineCode))) return product;
  return { ...product, images: [] };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await loadProduct(params);
  if (!product) return { title: "Part not found | Parts Pass", robots: { index: false } };

  const url = productUrl(product) ?? undefined;
  const title = `${product.title} | Parts Pass`;
  const description = productDescription(product).slice(0, 160);
  const images = product.images.slice(0, 1).map((src) => ({ url: src, alt: product.title }));

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(isIndexable(product) ? {} : { robots: { index: false, follow: true } }),
    openGraph: { type: "website", title, description, url, siteName: "Parts Pass", images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
  };
}

const Specs = ({ product }: { product: Product }) => {
  const rows: [string, string][] = [
    ["Brand", product.manufacturer],
    ["Part number", product.partNumber],
    ["Category", [product.category1, product.category2].filter(Boolean).join(" › ")],
    ...(product.gtin ? ([["UPC", product.gtin]] as [string, string][]) : []),
    ...(product.description ? ([["Notes", product.description]] as [string, string][]) : []),
    ["Condition", isRemanufactured(product) ? "Remanufactured" : "New"],
  ];
  return (
    <dl className="divide-y divide-gray-200 rounded-lg border border-gray-200 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-3 gap-4 px-4 py-3">
          <dt className="font-medium text-gray-600">{label}</dt>
          <dd className="col-span-2 text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
};

const FITMENT_PREVIEW = 12;

const FitmentRows = ({ groups }: { groups: FitmentGroup[] }) => (
  <ul className="divide-y divide-gray-200">
    {groups.map((group) => (
      <li
        key={`${group.make}-${group.model}`}
        className="flex justify-between gap-4 px-4 py-2.5 text-sm"
      >
        <span className="font-medium text-gray-900">
          {group.make} {group.model}
        </span>
        <span className="text-gray-600">
          {group.yearFrom === group.yearTo ? group.yearFrom : `${group.yearFrom}–${group.yearTo}`}
        </span>
      </li>
    ))}
  </ul>
);

const FitmentHeading = ({ count, partial }: { count?: number; partial?: boolean }) => (
  <h2 className="font-mont text-xl font-bold text-gray-900">
    Vehicle fitment
    {count !== undefined && count > 0 && (
      <span className="ml-2 text-sm font-normal text-gray-600">
        {count}
        {partial ? "+" : ""} model{count === 1 && !partial ? "" : "s"}
      </span>
    )}
  </h2>
);

const Fitment = async ({ partIds }: { partIds: number[] }) => {
  const { groups, partial } = await getProductFitment(partIds);
  const rest = groups.slice(FITMENT_PREVIEW);
  const allLabel = partial ? `Show ${groups.length}+ models` : `Show all ${groups.length} models`;
  return (
    <section id="fitment" className="scroll-mt-24">
      <FitmentHeading count={groups.length} partial={partial} />
      <YourVehicleFit partIds={partIds} />
      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">Fitment details are not available for this part.</p>
      ) : (
        <>
          {partial && (
            <p className="mt-3 text-sm text-gray-600">
              Fits a wide range of vehicles, including those below. Select your vehicle to confirm it
              fits yours.
            </p>
          )}
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <FitmentRows groups={groups.slice(0, FITMENT_PREVIEW)} />
            {rest.length > 0 && (
              <details className="group border-t border-gray-200">
                <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-semibold text-parts-pass-blue group-open:border-b group-open:border-gray-200">
                  <span className="group-open:hidden">{allLabel}</span>
                  <span className="hidden group-open:inline">Show fewer</span>
                </summary>
                <FitmentRows groups={rest} />
              </details>
            )}
          </div>
        </>
      )}
    </section>
  );
};

const FitmentLoading = () => (
  <section id="fitment" className="scroll-mt-24" aria-busy="true">
    <FitmentHeading />
    <div className="mt-4 animate-pulse space-y-px overflow-hidden rounded-lg border border-gray-200">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="flex justify-between px-4 py-3">
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  </section>
);

const RelatedParts = async ({ product }: { product: Product }) => {
  const related = await getRelatedParts(product.partIds, product.category2, product.category1).catch(
    (error) => {
      console.error("[related-parts]", error);
      return null;
    },
  );
  return (
    <RelatedPartsSection
      initial={related}
      partIds={product.partIds}
      partType={product.category2}
      category1={product.category1}
    />
  );
};

/** Whether a list page exists, without failing the product page when the listing can't be read. */
const listExists = (filter: { brand?: string; partType?: string }) =>
  getListSummary(filter)
    .then(Boolean)
    .catch((error) => {
      console.error("[catalog]", error);
      return false;
    });

export default async function ProductPage({ params }: PageProps) {
  const product = await loadProduct(params);
  if (!product) notFound();

  const brand = decodeURIComponent(params.brand).toLowerCase();
  const typeSlug = partTypeSlug(product.category2);
  const [hasBrandPage, hasPartTypePage, parcels] = await Promise.all([
    listExists({ brand }),
    typeSlug ? listExists({ partType: typeSlug }) : false,
    loadParcels([product]),
  ]);
  const crumbs = productBreadcrumbs(product, { brand: hasBrandPage ? brand : null, partType: hasPartTypePage });
  const parcel = parcelFor(parcels, product.lineCode, product.partNumber);
  const shippingCents = isFreightOnly(parcel) ? null : shipmentCents([{ parcel, quantity: 1 }]);

  return (
    <div className="bg-white">
      {product.images.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd(product, shippingCents)) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd(product, crumbs)) }}
      />
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-16 lg:px-8">
        <ProductBreadcrumb crumbs={crumbs} partType={product.category2} partNumber={product.partNumber} />

        <div className="grid gap-8 md:grid-cols-12 md:gap-10 lg:gap-12">
          <div className="md:col-span-7">
            <ProductGallery images={product.images} title={product.title} />
          </div>

          <div className="md:col-span-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-parts-pass-blue">
              {product.manufacturer}
            </p>
            <h1 className="mt-1 font-mont text-2xl font-bold text-gray-900 sm:text-3xl">
              {product.title}
            </h1>
            {product.tagline && <p className="mt-2 text-gray-700">{product.tagline}</p>}
            <p className="mt-1 text-sm text-gray-600">Part # {product.partNumber}</p>

            <div className="mt-6 rounded-xl border border-gray-200 p-5 shadow-sm">
              <BuyBox
                product={{
                  id: product.id,
                  title: product.title,
                  manufacturer: product.manufacturer,
                  partNumber: product.partNumber,
                  lineCode: product.lineCode,
                  partKey: product.partKey,
                  category1: product.category1,
                  category2: product.category2,
                  tagline: product.tagline,
                  image: product.images[0] ?? null,
                  priceCents: product.priceCents,
                  coreCents: product.coreCents,
                  parcel,
                  partIds: product.partIds,
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-12 md:gap-10 lg:gap-12">
          <div className="space-y-10 md:col-span-7">
            {product.piesDescription && (
              <section>
                <h2 className="font-mont text-xl font-bold text-gray-900">About this part</h2>
                <p className="mt-3 leading-relaxed text-gray-700">{product.piesDescription}</p>
              </section>
            )}
            <Suspense fallback={<FitmentLoading />}>
              <Fitment partIds={product.partIds} />
            </Suspense>
          </div>
          <section className="md:col-span-5">
            <h2 className="font-mont text-xl font-bold text-gray-900">Specifications</h2>
            <div className="mt-4">
              <Specs product={product} />
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Price {formatUsd(product.priceCents)} USD. Returns accepted within 30 days of delivery.{" "}
              <Link href="/return-policy" className="underline">
                Return policy
              </Link>
            </p>
            {(hasBrandPage || hasPartTypePage) && (
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {hasBrandPage && (
                  <Link href={brandListPath(brand)} className="text-parts-pass-blue hover:underline">
                    More {product.manufacturer} parts
                  </Link>
                )}
                {hasPartTypePage && (
                  <Link href={partTypeListPath(typeSlug)} className="text-parts-pass-blue hover:underline">
                    All {product.category2} parts
                  </Link>
                )}
              </p>
            )}
          </section>
        </div>

        <Suspense fallback={null}>
          <RelatedParts product={product} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
