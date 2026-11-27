import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CatalogListPage, { type ListChip } from "@/components/catalogListPage";
import { getListPage, getListSummary, getTopLinks, pageCount } from "@/lib/catalog";
import { parseCategorySegments } from "@/lib/pagination";
import type { Breadcrumb } from "@/lib/productStructuredData";
import { partTypeListPath, siteUrl } from "@/lib/productUrl";

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: { partType: string; page?: string[] };
}

/** `/categories/<type>[/brand/<brand>][/<page>]`; the brand-narrowed lists aren't indexed. */
const load = async ({ partType: slug, page: segments }: PageProps["params"]) => {
  const parsed = parseCategorySegments(segments);
  if (!parsed) return null;
  const { brand, page } = parsed;
  const summary = await getListSummary({ partType: slug, brand });
  if (!summary || page > pageCount(summary.count)) return null;
  return {
    slug,
    brand: brand ? { slug: brand, name: summary.brandName } : null,
    name: summary.partType,
    category1: summary.category1,
    count: summary.count,
    page,
  };
};

type PartTypeList = NonNullable<Awaited<ReturnType<typeof load>>>;

const listName = (list: PartTypeList, lowerCaseType = false) => {
  const name = lowerCaseType ? list.name.toLowerCase() : list.name;
  return list.brand ? `${list.brand.name} ${name}` : name;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const list = await load(params);
  if (!list) return { title: "Category not found | Parts Pass", robots: { index: false } };
  const suffix = list.page > 1 ? ` – Page ${list.page}` : "";
  const title = `${listName(list)}${suffix} | Parts Pass`;
  const count = list.count.toLocaleString("en-US");
  if (list.brand) {
    return {
      title,
      description: `Shop ${count} in-stock ${listName(list, true)} parts at wholesale prices, with vehicle fitment and 30-day returns.`,
      robots: { index: false, follow: true },
    };
  }
  const brands = (await getTopLinks({ partType: list.slug }, "brand")).slice(0, 3).map((brand) => brand.name);
  return {
    title,
    description: `Shop ${count} in-stock ${list.name.toLowerCase()} parts${
      brands.length ? ` from ${brands.join(", ")} and more` : ""
    } at wholesale prices, with vehicle fitment and 30-day returns.`,
    alternates: { canonical: `${siteUrl()}${partTypeListPath(list.slug, list.page)}` },
  };
}

export default async function PartTypePage({ params }: PageProps) {
  const list = await load(params);
  if (!list) notFound();
  const brandSlug = list.brand?.slug;
  const [parts, brands] = await Promise.all([
    getListPage({ partType: list.slug, brand: brandSlug }, list.page),
    getTopLinks({ partType: list.slug }, "brand"),
  ]);

  const crumbs: Breadcrumb[] = [
    { name: "Categories", path: "/categories" },
    ...(list.category1 ? [{ name: list.category1, path: `/categories#${encodeURIComponent(list.category1)}` }] : []),
    { name: list.name, path: partTypeListPath(list.slug) },
    ...(list.brand ? [{ name: list.brand.name, path: partTypeListPath(list.slug, 1, list.brand.slug) }] : []),
  ];
  const brandChips: ListChip[] = brands.map((brand) => ({
    name: brand.name,
    count: brand.count,
    path: partTypeListPath(list.slug, 1, brand.slug),
    active: brand.slug === brandSlug,
  }));
  if (list.brand && !brandChips.some((chip) => chip.active)) {
    brandChips.push({
      name: list.brand.name,
      count: list.count,
      path: partTypeListPath(list.slug, 1, list.brand.slug),
      active: true,
    });
  }

  return (
    <CatalogListPage
      crumbs={crumbs}
      heading={listName(list)}
      intro={`${list.count.toLocaleString("en-US")} in-stock ${listName(list, true)} parts${
        list.category1 ? ` in ${list.category1}` : ""
      }. Open a part to check that it fits your vehicle.`}
      partType={list.name}
      parts={parts}
      page={list.page}
      pages={pageCount(list.count)}
      pathFor={(p) => partTypeListPath(list.slug, p, brandSlug)}
      chips={{
        heading: "Filter by brand",
        links: [{ name: "All brands", path: partTypeListPath(list.slug), active: !list.brand }, ...brandChips],
      }}
    />
  );
}
