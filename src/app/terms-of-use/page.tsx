"use client";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

const prohibitedUseItems = [
  "Disrupt or interfere with the Service or other users' enjoyment of the Service.",
  "Misrepresent your identity or affiliation with any person or entity.",
  "Collect or store personal information about other users.",
  "Harass, intimidate, or threaten other users.",
  "Use the Service if you are under 13 years of age.",
  "Circumvent any security measures or restrictions of the Service.",
];

const tosPolicy = [
  {
    title: "Last Revised: 09.22.2022",
    description: (
      <p>{`These Terms of Service ("Terms") govern your access to and use of the Parts Pass mobile application and related services (the "Service"). Please read these Terms carefully before using the Service.`}</p>
    ),
  },
  {
    title: "Acceptance of Terms",
    description: (
      <p>
        By accessing or using the Service, you agree to be bound by these
        Terms. If you do not agree to these Terms, please do not use the
        Service. If you have any questions or concerns about these Terms, please
        contact us at{" "}
        <a className="text-parts-pass-blue" href="mailto:admin@partspass.app">
          admin@partspass.app
        </a>
      </p>
    ),
  },
  {
    title: "Changes to These Terms",
    description: (
      <p>
        We may modify these Terms at any time. Changes will be effective seven days
        after posting the revised Terms on our website or upon your acceptance
        via a confirmation mechanism. It is your responsibility to review these
        Terms regularly. Continued use of the Service after changes become
        effective constitutes your acceptance of the new Terms.
      </p>
    ),
  },

  {
    title: "Third-Party Services",
    description: (
      <p>
        Our Service may include links to third-party websites or services. These
        are provided for your convenience, and we do not endorse or assume
        responsibility for them. Your use of third-party services is governed by
        their own terms and policies, not ours.
      </p>
    ),
  },
  {
    title: "Account Creation and Security",
    description: (
      <p>
        When creating an account, you agree to maintain the confidentiality of
        your login information and are responsible for all activities under your
        account. Notify us immediately if you suspect unauthorized access.
        Contact us at{" "}
        <a className="text-parts-pass-blue" href="mailto:kim@partspass.app">
          kim@partspass.app
        </a>{" "}
        if you discover any security breaches.
      </p>
    ),
  },
  {
    title: "Your Content & Conduct",
    description: (
      <div>
        <p>
          You are responsible for the content you post and the orders you place
          through the Service. You agree not to use the Service in ways that
          could harm others, interfere with the Service, or violate any laws.
          Specifically, you agree not to:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {prohibitedUseItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: "Parts Pass Materials",
    description: (
      <p>
        We own or license all materials on the Service, including logos,
        designs, text, graphics, and other content, which are protected by
        intellectual property laws. You may not use these materials except as
        expressly permitted by us.
      </p>
    ),
  },
  {
    title: "Hyperlinks and Third-Party Content",
    description: (
      <p>
        You may link to our homepage but may not frame or use our
        trademarks without permission. We do not control third-party content
        linked through our Service and are not responsible for its accuracy or
        quality.
      </p>
    ),
  },
  {
    title: "Legal Liability",
    description: (
      <p>{`The Service and its content are provided "as is," without warranties of any kind. We disclaim all warranties, whether express or implied. We are not liable for any damages arising from your use of the Service. Our total liability is limited to the amount you paid for the Service`}.</p>
    ),
  },
  {
    title: "Indemnification",
    description: (
      <p>
        You agree to indemnify and hold us harmless from any claims arising out
        of your use of the Service, including any violations of these Terms.
      </p>
    ),
  },
  {
    title: "Governing Law and Jurisdiction",
    description: (
      <p>
        These Terms are governed by the laws of the State of Arizona, Maricopa
        County. Any disputes will be resolved in the courts of Arizona, and you
        consent to personal jurisdiction in these courts. You agree not to
        participate in class actions or class arbitrations against us.
      </p>
    ),
  },
  {
    title: "Termination",
    description: (
      <p>
        We may suspend or terminate your access to the Service if you violate
        these Terms.
      </p>
    ),
  },
  {
    title: "Entire Agreement",
    description: (
      <p>
        These Terms constitute the entire agreement between you and Parts Pass
        regarding your use of the Service, superseding any prior agreements.
      </p>
    ),
  },
  {
    title: "Feedback",
    description: (
      <p>
        We welcome your feedback. By providing feedback, you grant us the rights
        to use it freely.
      </p>
    ),
  },
  {
    title: "Questions & Contact Information",
    description: (
      <p>
        For questions or comments, please contact us at{" "}
        <a className="text-parts-pass-blue" href="https://www.partspass.app">
          www.partspass.app
        </a>
      </p>
    ),
  },
];

export default function TermsOfUsePage() {
  return (
    <div className="bg-white">
      <Header />
      <main className="isolate">
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:pt-32 lg:px-8 lg:py-40">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-5">
                <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                  Terms of Service
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  These Terms of Service govern your access to and use of the
                  Parts Pass mobile application and related services.
                </p>
                <p className="mt-2 text-sm text-gray-500">Last Revised: 09.22.2022</p>
              </div>
              <div className="mt-10 lg:col-span-7 lg:mt-0">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
                  <dl className="space-y-3">
                    {tosPolicy.map((section, idx) => (
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
