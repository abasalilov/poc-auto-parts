"use client";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

const faqSections = [
  {
    title: "Company Background",
    items: [
      {
        question: "Where is Parts Pass located?",
        answer:
          "Parts Pass is a proud, locally-owned business headquartered in Phoenix, Arizona, founded by an experienced automotive professional with a passion for simplifying the car repair process. We also operate through multiple U.S. warehouse locations to serve customers nationwide.",
      },
      {
        question: "Is Parts Pass a legitimate U.S. business?",
        answer:
          "Yes, Parts Pass Inc. is a registered corporation that started operations in late 2022 and maintains a professional business profile with the Better Business Bureau (BBB).",
      },
      {
        question: "How can I be sure I'm buying quality parts?",
        answer:
          "We offer over 2 million quality replacement parts at wholesale prices through our own network of 25 professional distribution center locations across the country to ensure you receive reliable components. Because we operate as a shipping-first business without retail storefront overhead, we're able to keep prices low.",
      },
    ],
  },
  {
    title: "Shipping & Sourcing",
    items: [
      {
        question: "Where do my parts ship from?",
        answer:
          "To ensure the fastest delivery, all orders ship directly from one of our multiple U.S.-based distribution center locations, meaning your parts never cross international borders before reaching you.",
      },
      {
        question: "How fast will I receive my order?",
        answer:
          "Because we utilize a vast network of U.S. distribution center locations, we are able to offer 3-5 day delivery on most orders, with many customers receiving their parts even sooner.",
      },
      {
        question: "Do you offer tracking for my shipment?",
        answer:
          "Yes, once your order is processed through our network, you will receive a tracking number so you can monitor your delivery in real-time.",
      },
      {
        question: "Are these parts the same quality as what the dealership uses?",
        answer:
          "Our U.S. distribution center network provides the same quality parts used by local shops and dealerships, ensuring every part meets or exceeds original equipment specifications for your specific make and model.",
      },
    ],
  },
  {
    title: "Reliability & Guarantees",
    items: [
      {
        question: "How do I know the part will fit my vehicle?",
        answer:
          "Simply enter your vehicle's year, make, and model into our search tool to filter for parts guaranteed to fit your car. Our system cross-references your vehicle specs against a massive database of OEM and aftermarket fitment data to ensure you get the right part the first time.",
      },
      {
        question: "What is your return policy if a part doesn't work out?",
        answer:
          "We stand by our products; you can easily start a return through our support portal if the part is not exactly what you needed.",
      },
      {
        question: "Is my payment information secure?",
        answer:
          "Absolutely; we use industry-standard encryption and secure payment gateways to protect your data, and we never sell your personal information to third parties.",
      },
      {
        question: "Do these parts come with a warranty?",
        answer:
          "Yes, all parts ordered through Parts Pass come with a standard 30-day warranty to give you peace of mind with every purchase.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <Header />
      <main className="isolate">
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:pt-32 lg:px-8 lg:py-40">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-5">
                <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">Frequently asked questions</h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Can’t find the answer you’re looking for? Reach out to our{" "}
                  <a href="https://share.hsforms.com/1b4LSoip1SD60ZvNq7_OAFwda913" className="font-semibold text-indigo-600 hover:text-indigo-500">
                    customer support
                  </a>{" "}
                  team.
                </p>
              </div>
              <div className="mt-10 lg:col-span-7 lg:mt-0">
                <div className="space-y-8">
                  {faqSections.map((section) => (
                    <section key={section.title} className="rounded-xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
                      <h3 className="text-lg font-semibold leading-8 text-gray-900">
                        {section.title}
                      </h3>
                      <dl className="mt-4 space-y-3">
                        {section.items.map((faq, idx) => (
                          <Disclosure
                            key={faq.question}
                            as="div"
                            defaultOpen={idx === 0}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2"
                          >
                            {({ open }) => (
                              <>
                                <dt>
                                  <DisclosureButton className="group flex w-full items-center justify-between py-2 text-left">
                                    <span className="text-base font-semibold leading-7 text-gray-900">
                                      {faq.question}
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
                                <DisclosurePanel as="dd" className="pb-3 pr-6 text-sm leading-7 text-gray-600">
                                  <p className="max-w-prose">{faq.answer}</p>
                                </DisclosurePanel>
                              </>
                            )}
                          </Disclosure>
                        ))}
                      </dl>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
