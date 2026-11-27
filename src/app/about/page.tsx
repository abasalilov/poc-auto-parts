import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BanknotesIcon,
  CheckBadgeIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import Footer from "@/components/footer";
import Header from "@/components/header";
import LogoCarousel from "@/components/logoCarousel";
import AutoWorldImg from "../../../public/autoworld-white.png";
import DisruptImg from "../../../public/disrupt-logo-2021-svg-1-.png";
import PhoenixBusImg from "../../../public/phoenix-logo-1.png";
import PhoenixMagImg from "../../../public/phx-mag-white.png";

export const metadata: Metadata = {
  title: "About Parts Pass | Built by mechanics",
  description:
    "Parts Pass was started by a mechanic with 17+ years in auto repair to make finding the right part faster and more affordable.",
};

const stats = [
  { value: "2M+", label: "parts available" },
  { value: "25+", label: "U.S. warehouses" },
  { value: "1,000+", label: "orders fulfilled" },
  { value: "3–5 days", label: "typical delivery" },
];

const reasons = [
  {
    icon: WrenchScrewdriverIcon,
    title: "Shop-grade parts",
    body: "The same brands repair shops and dealerships install, not off-brand knockoffs.",
  },
  {
    icon: BanknotesIcon,
    title: "Wholesale pricing",
    body: "We buy direct from the distributor, so you pay up to 40% less than retail.",
  },
  {
    icon: CheckBadgeIcon,
    title: "Fit checked for your vehicle",
    body: "Pick your year, make, model and engine, and we only show parts listed to fit it.",
  },
  {
    icon: TruckIcon,
    title: "Ships from U.S. warehouses",
    body: "Orders ship from the warehouse that has your part in stock, with 30-day returns.",
  },
];

const pressLinks = [
  {
    href: "https://www.automotiveworld.com/special-reports/future-of-vehicle-ownership/",
    alt: "Automotive World",
    src: AutoWorldImg,
  },
  {
    href: "https://disruptmagazine.com/parts-pass-revolutionizing-the-automotive-industry-with-a-digital-marketplace-for-auto-parts/",
    alt: "Disrupt Magazine",
    src: DisruptImg,
  },
  {
    href: "https://www.bizjournals.com/phoenix/inno/stories/news/2023/04/05/parts-pass-launches-car-parts-app.html",
    alt: "Phoenix Business Journal",
    src: PhoenixBusImg,
  },
  {
    href: "https://www.phoenixmag.com/2023/03/22/local-app-caters-to-diy-mechanics-and-project-car-enthusiasts/",
    alt: "Phoenix Magazine",
    src: PhoenixMagImg,
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      <Header />
      <main className="isolate">
        <section className="bg-parts-pass-blue">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
            <p className="font-mont text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              About Parts Pass
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Built by mechanics. Priced for everyone.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90">
              The right part for your vehicle, from the brands shops trust, at wholesale prices.
            </p>
          </div>
          <div className="border-t border-white/15 bg-black/10">
            <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-6 py-8 sm:grid-cols-4 lg:px-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-sm text-white/80">{stat.label}</dt>
                  <dd className="font-mont mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Started in the shop, not a boardroom
            </h2>
            <div className="mt-6 space-y-4 text-base leading-7 text-gray-700 sm:text-lg sm:leading-8">
              <p>
                After 17+ years in the automotive repair industry, our founder knew how much time
                goes into tracking down the right part, and how much of the price is retail markup.
              </p>
              <p>
                So we built Parts Pass: a simple way for anyone to find the exact part for their
                vehicle and order it at the price a shop would pay.
              </p>
              <p>
                Whether you&apos;re doing your first brake job or running a busy bay, we want
                getting parts to be the easy part.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Why Parts Pass</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {reasons.map((reason) => (
                <div key={reason.title}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-parts-pass-blue/10">
                    <reason.icon className="h-6 w-6 text-parts-pass-blue" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-gray-900">{reason.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{reason.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="press" className="bg-parts-pass-blue">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <h2 id="press" className="text-3xl font-bold tracking-tight text-white">
                As seen on Good Morning Arizona
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/90">
                Parts Pass has been featured on TV and in the press for making car parts easier to
                find and buy.
              </p>
              <ul className="mt-8 grid max-w-md grid-cols-2 items-center gap-x-10 gap-y-8 sm:grid-cols-4 sm:gap-x-8">
                {pressLinks.map((press) => (
                  <li key={press.alt}>
                    <Link href={press.href} target="_blank" rel="noopener noreferrer">
                      <Image alt={press.alt} src={press.src} className="max-h-10 w-full object-contain" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-black/20 shadow-lg">
              <iframe
                className="h-full w-full"
                src="https://www.youtube-nocookie.com/embed/qKHPebaFjkM"
                title="Parts Pass on Good Morning Arizona"
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        <section className="bg-parts-pass-green">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <h2 className="font-mont text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Brands you already know
            </h2>
            <LogoCarousel />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-6 pt-16 sm:pt-20 lg:px-8">
          <div className="flex flex-col items-start gap-6 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Ready to find your part?
              </h2>
              <p className="mt-2 text-base text-gray-600">
                Select your vehicle to see parts that fit.
              </p>
            </div>
            <Link
              href="/"
              className="font-mont inline-flex shrink-0 items-center justify-center rounded-lg bg-parts-pass-blue px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-parts-pass-green"
            >
              Find parts
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
