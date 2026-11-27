import Link from "next/link";

import CatalogVehicleBar from "@/components/catalogVehicleBar";
import Footer from "@/components/footer";
import Header from "@/components/header";
import PartCardGrid from "@/components/partCardGrid";
import type { ListedPart } from "@/lib/catalog";
import { pageWindow } from "@/lib/pagination";
import type { Breadcrumb } from "@/lib/productStructuredData";

export interface ListChip {
  name: string;
  path: string;
  count?: number;
  active?: boolean;
}

interface CatalogListPageProps {
  crumbs: Breadcrumb[];
  heading: string;
  intro: string;
  /** Part type for the "show only … for my vehicle" link; brand lists link to all the vehicle's parts. */
  partType?: string;
  parts: ListedPart[];
  page: number;
  pages: number;
  pathFor: (page: number) => string;
  chips: { heading: string; links: ListChip[] };
}

const Pagination = ({ page, pages, pathFor }: Pick<CatalogListPageProps, "page" | "pages" | "pathFor">) => {
  if (pages <= 1) return null;
  const linkClass = "rounded-md border border-gray-300 px-3 py-1.5 hover:border-parts-pass-blue";
  return (
    <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm">
      {page > 1 && (
        <Link href={pathFor(page - 1)} rel="prev" className={linkClass}>
          Previous
        </Link>
      )}
      {pageWindow(page, pages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-1 text-gray-400" aria-hidden>
            …
          </span>
        ) : p === page ? (
          <span key={p} aria-current="page" className="rounded-md bg-parts-pass-blue px-3 py-1.5 text-white">
            {p}
          </span>
        ) : (
          <Link key={p} href={pathFor(p)} className={linkClass}>
            {p}
          </Link>
        ),
      )}
      {page < pages && (
        <Link href={pathFor(page + 1)} rel="next" className={linkClass}>
          Next
        </Link>
      )}
    </nav>
  );
};

/** Shared layout for the brand and part type lists. */
export default function CatalogListPage({
  crumbs,
  heading,
  intro,
  partType,
  parts,
  page,
  pages,
  pathFor,
  chips,
}: CatalogListPageProps) {
  return (
    <div className="bg-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-600">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-parts-pass-blue">
                Home
              </Link>
            </li>
            {crumbs.map((crumb) => (
              <li key={crumb.path}>
                <span aria-hidden>›</span>{" "}
                <Link href={crumb.path} className="hover:text-parts-pass-blue">
                  {crumb.name}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <h1 className="font-mont text-2xl font-bold text-gray-900 sm:text-3xl">
          {heading}
          {page > 1 && <span className="ml-2 text-base font-normal text-gray-500">Page {page}</span>}
        </h1>
        <p className="mt-2 max-w-3xl text-gray-700">{intro}</p>

        <CatalogVehicleBar partType={partType} />

        {chips.links.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-900">{chips.heading}</h2>
            <ul className="mt-2 flex flex-wrap gap-2 text-sm">
              {chips.links.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    aria-current={link.active ? "page" : undefined}
                    className={
                      link.active
                        ? "inline-block rounded-full border border-parts-pass-blue bg-parts-pass-blue px-3 py-1 text-white"
                        : "inline-block rounded-full border border-gray-300 px-3 py-1 text-gray-700 hover:border-parts-pass-blue hover:text-parts-pass-blue"
                    }
                  >
                    {link.name}
                    {link.count !== undefined && (
                      <span className={`text-xs ${link.active ? "text-blue-100" : "text-gray-500"}`}> ({link.count})</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8">
          <PartCardGrid parts={parts} />
        </div>
        <Pagination page={page} pages={pages} pathFor={pathFor} />
      </main>
      <Footer />
    </div>
  );
}
