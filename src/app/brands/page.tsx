import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { getBrands } from "@/lib/catalog";
import { brandListPath, siteUrl } from "@/lib/productUrl";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Auto Parts Brands | Parts Pass",
  description: "Shop in-stock auto parts by brand at wholesale prices, with vehicle fitment and 30-day returns.",
  alternates: { canonical: `${siteUrl()}/brands` },
};

const initial = (name: string) => (/^[a-z]/i.test(name) ? name[0].toUpperCase() : "#");

export default async function BrandsPage() {
  const brands = await getBrands();
  const groups = new Map<string, typeof brands>();
  brands.forEach((brand) => {
    const letter = initial(brand.name);
    groups.set(letter, [...(groups.get(letter) ?? []), brand]);
  });

  return (
    <div className="bg-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <h1 className="font-mont text-2xl font-bold text-gray-900 sm:text-3xl">Shop by brand</h1>
        <p className="mt-2 text-gray-700">
          The brands repair shops install, in stock in U.S. warehouses. Pick a brand to see its parts.
        </p>
        <div className="mt-8 space-y-8">
          {Array.from(groups, ([letter, list]) => (
            <section key={letter}>
              <h2 className="border-b border-gray-200 pb-1 font-mont text-lg font-bold text-gray-900">{letter}</h2>
              <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
                {list.map((brand) => (
                  <li key={brand.slug}>
                    <Link href={brandListPath(brand.slug)} className="text-gray-700 hover:text-parts-pass-blue">
                      {brand.name}
                    </Link>{" "}
                    <span className="text-xs text-gray-500">({brand.count.toLocaleString("en-US")})</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
