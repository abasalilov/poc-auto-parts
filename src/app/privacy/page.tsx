"use client";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

const privacyPolicy = [
  {
    title: "Privacy Policy Overview",
    description: (
      <p>
        This Privacy Policy explains how Parts Pass collects, uses, and shares
        your information when you use our mobile application and related
        services (the &quot;Service&quot;). If you have questions, contact us at{" "}
        <a className="text-parts-pass-blue" href="mailto:admin@partspass.app">
          admin@partspass.app
        </a>
        .
      </p>
    ),
  },
  {
    title: "Changes to This Privacy Policy",
    description: (
      <p>
        We may update this Privacy Policy at any time. Changes become effective
        seven days after posting the revised policy on our website or upon your
        acceptance through a confirmation mechanism. It is your responsibility
        to review this policy regularly. Continued use of the Service after
        changes become effective constitutes acceptance of the updated policy.
      </p>
    ),
  },
  {
    title: "Information Collection and Use",
    description: (
      <p>
        We collect and use information to operate, improve, and secure the
        Service and to support your orders and account activity.
      </p>
    ),
  },
  {
    title: "Third-Party Services",
    description: (
      <p>
        Our Service may include links to third-party websites or services.
        These are provided for your convenience, and we do not endorse or
        assume responsibility for them. Your use of third-party services is
        governed by their own terms and policies, not ours.
      </p>
    ),
  },
  {
    title: "Account Creation and Security",
    description: (
      <p>
        When creating an account, you agree to maintain the confidentiality of
        your login information and are responsible for all activity under your
        account. Notify us immediately if you suspect unauthorized access.
        Contact us at{" "}
        <a className="text-parts-pass-blue" href="mailto:kim@partspass.app">
          kim@partspass.app
        </a>{" "}
        if you discover a security breach.
      </p>
    ),
  },
  {
    title: "Parts Pass Materials",
    description: (
      <p>
        We own or license all materials provided through the Service, including
        logos, designs, text, graphics, and other content. You may use these
        materials for personal, non-commercial purposes only. Unauthorized use
        may result in termination of your access to the Service.
      </p>
    ),
  },
  {
    title: "Hyperlinks and Third-Party Content",
    description: (
      <p>
        You may link to our homepage, but you may not frame or use our
        trademarks without permission. We do not control third-party content
        linked through our Service and are not responsible for its accuracy or
        quality.
      </p>
    ),
  },
  {
    title: "Legal Liability",
    description: (
      <p>{`The Service and its content are provided "as is," without warranties of any kind. We disclaim all warranties, whether express or implied. We are not liable for any damages arising from your use of the Service. Our total liability is limited to the amount you paid for the Service.`}</p>
    ),
  },
  {
    title: "Indemnification",
    description: (
      <p>
        You agree to indemnify and hold us harmless from any claims arising
        from your use of the Service, including any violations of these Terms.
      </p>
    ),
  },
  {
    title: "Governing Law and Jurisdiction",
    description: (
      <p>
        These Terms are governed by the laws of the State of Arizona, Maricopa
        County. Any disputes are resolved in the courts of Arizona, and you
        consent to personal jurisdiction in those courts. You agree not to
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
        We welcome your feedback. By providing feedback, you grant us the right
        to use it freely.
      </p>
    ),
  },
  {
    title: "Contact Information",
    description: (
      <p>
        For questions or comments, please contact us at{" "}
        <a className="text-parts-pass-blue" href="https://www.partspass.app">
          www.partspass.app
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <Header />
      <main className="isolate">
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:pt-32 lg:px-8 lg:py-40">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-5">
                <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                  Privacy Policy
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  This Privacy Policy explains how Parts Pass collects, uses,
                  and protects information when you use our mobile application
                  and related services.
                </p>
              </div>
              <div className="mt-10 lg:col-span-7 lg:mt-0">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
                  <dl className="space-y-3">
                    {privacyPolicy.map((section, idx) => (
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
