import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CatalogListPage from "@/components/catalogListPage";
import { getListPage, getListSummary, getTopLinks, pageCount } from "@/lib/catalog";
import { parsePageSegment } from "@/lib/pagination";
import { brandListPath, partTypeListPath, siteUrl } from "@/lib/productUrl";

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: { brand: string; page?: string[] };
}

const load = async ({ brand: slug, page: segments }: PageProps["params"]) => {
  const page = parsePageSegment(segments);
  if (page === null) return null;
  const summary = await getListSummary({ brand: slug });
  if (!summary || page > pageCount(summary.count)) return null;
  return { slug, name: summary.brandName, count: summary.count, page };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const brand = await load(params);
  if (!brand) return { title: "Brand not found | Parts Pass", robots: { index: false } };
  const suffix = brand.page > 1 ? ` – Page ${brand.page}` : "";
  return {
    title: `${brand.name} Auto Parts${suffix} | Parts Pass`,
    description: `Shop ${brand.count.toLocaleString("en-US")} in-stock ${brand.name} parts at wholesale prices, with vehicle fitment, fast U.S. shipping and 30-day returns.`,
    alternates: { canonical: `${siteUrl()}${brandListPath(brand.slug, brand.page)}` },
  };
}

export default async function BrandPage({ params }: PageProps) {
  const brand = await load(params);
  if (!brand) notFound();
  const [parts, partTypes] = await Promise.all([
    getListPage({ brand: brand.slug }, brand.page),
    getTopLinks({ brand: brand.slug }, "partType"),
  ]);

  return (
    <CatalogListPage
      crumbs={[
        { name: "Brands", path: "/brands" },
        { name: brand.name, path: brandListPath(brand.slug) },
      ]}
      heading={`${brand.name} parts`}
      intro={`${brand.count.toLocaleString("en-US")} in-stock ${brand.name} parts. Open a part to check that it fits your vehicle.`}
      parts={parts}
      page={brand.page}
      pages={pageCount(brand.count)}
      pathFor={(p) => brandListPath(brand.slug, p)}
      chips={{
        heading: `Shop ${brand.name} by part type`,
        links: partTypes.map((type) => ({
          name: type.name,
          count: type.count,
          path: partTypeListPath(type.slug, 1, brand.slug),
        })),
      }}
    />
  );
}
