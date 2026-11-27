"use client";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

const policyHighlights = [
  { label: "Return Window", value: "30 days from delivery" },
  { label: "Condition", value: "New, unused, and undamaged" },
  { label: "Refund Timing", value: "Within 10 business days" },
  { label: "Support", value: "kim@partspass.app" },
];

const returnPolicySections = [
  {
    title: "Eligibility for Returns and Exchanges",
    description: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <b>Condition:</b> Items must be new, unused, and undamaged.
        </li>
        <li>
          <b>Packaging:</b> Include original packaging, all accessories,
          manuals, and documentation.
        </li>
        <li>
          <b>Electrical/Electronic Parts:</b> Must not have been installed or
          connected.
        </li>
      </ul>
    ),
  },
  {
    title: "Return and Exchange Timeframe",
    description: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          You may initiate a return or exchange within 30 days of the delivery
          date.
        </li>
        <li>
          Requests submitted after this timeframe may be considered at our
          discretion and may be subject to additional fees.
        </li>
      </ul>
    ),
  },
  {
    title: "How the Return Process Works",
    description: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <b>Start the request:</b> Contact customer support at{" "}
          <a className="text-parts-pass-blue" href="mailto:kim@partspass.app">
            kim@partspass.app
          </a>
          .
        </li>
        <li>
          <b>Share details:</b> Provide your order number, item(s), and a brief
          reason for the return or exchange.
        </li>
        <li>
          <b>Receive authorization:</b> Our team will provide a Return
          Merchandise Authorization (RMA) number, if applicable.
        </li>
        <li>
          <b>Pack securely:</b> Use the original packaging and include all
          accessories and documentation. Clearly mark the RMA number on the
          package.
        </li>
        <li>
          <b>Ship with tracking:</b> Use a trackable shipping service. Return
          shipping costs are the customer&apos;s responsibility unless the return
          is due to our error.
        </li>
        <li>
          <b>Processing:</b> Once received and verified, we process refunds or
          exchanges within 10 business days.
        </li>
      </ul>
    ),
  },
  {
    title: "Refunds",
    description: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Refunds are issued to the original payment method used for the
          purchase.
        </li>
        <li>
          Refund amounts exclude shipping fees unless the return is due to an
          error on our part.
        </li>
      </ul>
    ),
  },
  {
    title: "Exclusions",
    description: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          We cannot accept returns or exchanges for used, damaged, or modified
          car parts.
        </li>
        <li>
          Special-order and custom-made parts are not eligible for return or
          exchange unless they are defective or damaged upon arrival.
        </li>
      </ul>
    ),
  },
];

export default function ReturnPolicyPage() {
  return (
    <div className="bg-white">
      <Header />
      <main className="isolate">
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:pt-32 lg:px-8 lg:py-40">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-5">
                <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                  Return Policy
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  We stand behind every order and aim to make returns clear,
                  fair, and straightforward. Review the requirements below
                  before starting a return or exchange request.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {policyHighlights.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-10 lg:col-span-7 lg:mt-0">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
                  <dl className="space-y-3">
                    {returnPolicySections.map((section, idx) => (
                      <Disclosure
                        key={section.title}
                        as="div"
                        defaultOpen={idx === 0}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2"
                      >
                        {({ open }) => (
                          <>
                            <dt>
                              <DisclosureButton className="group flex w-full items-center justify-between py-2 text-left">
                                <span className="text-base font-semibold leading-7 text-gray-900">
                                  {section.title}
                                </span>
                                {open ? (
                                  <MinusIcon
                                    className="h-5 w-5 text-gray-400 group-hover:text-gray-600"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <PlusIcon
                                    className="h-5 w-5 text-gray-400 group-hover:text-gray-600"
                                    aria-hidden="true"
                                  />
                                )}
                              </DisclosureButton>
                            </dt>
                            <DisclosurePanel
                              as="dd"
                              className="pb-3 pr-4 text-sm leading-7 text-gray-600"
                            >
                              <div className="max-w-prose">{section.description}</div>
                            </DisclosurePanel>
                          </>
                        )}
                      </Disclosure>
                    ))}
                  </dl>

                  <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 text-sm leading-7 text-gray-600">
                    We reserve the right to refuse returns or exchanges that do
                    not meet the eligibility criteria outlined in this policy. If you
                    need help, contact our customer support team at{" "}
                    <a className="text-parts-pass-blue" href="mailto:kim@partspass.app">
                      kim@partspass.app
                    </a>
                    .
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
