import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import Footer from "@/components/footer";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "Page not found | Parts Pass",
};

export default function NotFound() {
  return (
    <div className="bg-white">
      <Header />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:py-28">
        <p className="text-sm font-semibold uppercase tracking-wide text-parts-pass-blue">404</p>
        <h1 className="font-mont mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-4 text-base leading-7 text-gray-600">
          The part or page you&apos;re looking for may have moved or is no longer available. Pick
          your vehicle and search to find parts that fit.
        </p>
        <Link
          href="/"
          className="font-mont mt-8 inline-flex items-center gap-2 rounded-md bg-parts-pass-blue px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-parts-pass-blue-light"
        >
          <MagnifyingGlassIcon className="h-5 w-5" aria-hidden />
          Search for parts
        </Link>
      </main>
      <Footer />
    </div>
  );
}
