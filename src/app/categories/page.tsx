import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { getPartTypes } from "@/lib/catalog";
import { partTypeListPath, siteUrl } from "@/lib/productUrl";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Auto Parts Categories | Parts Pass",
  description: "Shop in-stock auto parts by category: brakes, suspension, engine, cooling, electrical and more.",
  alternates: { canonical: `${siteUrl()}/categories` },
};

export default async function CategoriesPage() {
  const partTypes = await getPartTypes();
  const groups = new Map<string, typeof partTypes>();
  partTypes.forEach((type) => {
    const group = type.category1 || "Other";
    groups.set(group, [...(groups.get(group) ?? []), type]);
  });
  const sorted = Array.from(groups).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="bg-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <h1 className="font-mont text-2xl font-bold text-gray-900 sm:text-3xl">Shop by category</h1>
        <p className="mt-2 text-gray-700">Every part type we have in stock, grouped by system.</p>
        <nav aria-label="Systems" className="mt-6 flex flex-wrap gap-2 text-sm">
          {sorted.map(([group]) => (
            <a
              key={group}
              href={`#${encodeURIComponent(group)}`}
              className="rounded-full border border-gray-300 px-3 py-1 text-gray-700 hover:border-parts-pass-blue"
            >
              {group}
            </a>
          ))}
        </nav>
        <div className="mt-8 space-y-10">
          {sorted.map(([group, list]) => (
            <section key={group} id={encodeURIComponent(group)} className="scroll-mt-24">
              <h2 className="border-b border-gray-200 pb-1 font-mont text-lg font-bold text-gray-900">{group}</h2>
              <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {list.map((type) => (
                  <li key={type.slug}>
                    <Link href={partTypeListPath(type.slug)} className="text-gray-700 hover:text-parts-pass-blue">
                      {type.name}
                    </Link>{" "}
                    <span className="text-xs text-gray-500">({type.count.toLocaleString("en-US")})</span>
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
