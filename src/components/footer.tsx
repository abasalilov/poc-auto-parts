"use client";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useState } from "react";
import partsPassHeader from "../../public/parts_pass_logo_white.png";

const navigation = {
  company: [
    { name: "About", href: "/about" },
    { name: "FAQs", href: "/faq" },
  ],
  support: [
    {
      name: "Contact",
      href: "https://share.hsforms.com/1b4LSoip1SD60ZvNq7_OAFwda913",
    },
    {
      name: "Start A Return",
      href: "https://share.hsforms.com/1A8Q1Wh7RTbeLCyzEol_1XQda913",
    },
    { name: "Delete Account", href: "/delete-account" },
  ],
  legal: [
    { name: "Return Policy", href: "/return-policy" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms-of-use" },
  ],
  search: [
    { name: "Find A Part", href: "/" },
    { name: "Shop By Brand", href: "/brands" },
    { name: "Shop By Category", href: "/categories" },
  ],
  social: [
    {
      name: "Facebook",
      href: "https://www.facebook.com/PartsPass/",
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/partspass/",
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/channel/UC7icJJe7itEyK4RVbxhKOSA",
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: "TikTok",
      href: "https://www.tiktok.com/@partspass",
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
        </svg>
      ),
    },
  ],
};

/** `flush` drops the top margin, for pages that end in a section with the same blue background. */
export default function Footer({ flush = false }: { flush?: boolean }) {
  const [isReturnPopupOpen, setIsReturnPopupOpen] = useState(false);

  const openReturnPopup = () => {
    setIsReturnPopupOpen(true);
  };

  const closeReturnPopup = () => {
    setIsReturnPopupOpen(false);
  };

  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {`<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5KFXNCWD" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`}
      </Script>
      <footer
        aria-labelledby="footer-heading"
        className={`bg-parts-pass-blue ${flush ? "border-t border-white/10" : "mt-10"}`}
      >
        <h2 id="footer-heading" className="sr-only">
          Footer
        </h2>
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-8 sm:pt-12 lg:px-8 lg:pt-16">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-6">
              <Image
                className="h-7 w-auto"
                src={partsPassHeader}
                alt="Parts Pass"
              />
              <div className="space-y-0.5 text-sm text-white/90">
                <p>Parts Pass LLC</p>
                <p>610 E. Bell Rd, STE 2-2324</p>
                <p>Phoenix, AZ 85022</p>
              </div>
              <p className="text-sm text-white/80 leading-snug">
                Providing new quality parts at wholesale prices.
              </p>
              <div className="flex gap-4">
                {navigation.social.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <span className="sr-only">{item.name}</span>
                    <item.icon aria-hidden="true" className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wider text-white pb-2 border-b border-white/20">
                    Company
                  </h3>
                  <ul role="list" className="mt-4 space-y-4">
                    {navigation.company.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-sm leading-6 text-white/80 hover:text-white transition-colors"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-base font-bold uppercase tracking-wider text-white pb-2 border-b border-white/20">
                    Support
                  </h3>
                  <ul role="list" className="mt-4 space-y-4">
                    {navigation.support.map((item) => (
                      <li key={item.name}>
                        {item.name === "Contact" ? (
                          <button
                            onClick={() => window.LiveChatWidget?.call("maximize")}
                            className="text-sm leading-6 text-white/80 hover:text-white cursor-pointer transition-colors"
                          >
                            {item.name}
                          </button>
                        ) : item.name === "Start A Return" ? (
                          <button
                            onClick={openReturnPopup}
                            className="text-sm leading-6 text-white/80 hover:text-white cursor-pointer transition-colors"
                          >
                            {item.name}
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            className="text-sm leading-6 text-white/80 hover:text-white transition-colors"
                          >
                            {item.name}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wider text-white pb-2 border-b border-white/20">
                    Search
                  </h3>
                  <ul role="list" className="mt-4 space-y-4">
                    {navigation.search.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-sm leading-6 text-white/80 hover:text-white transition-colors"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-base font-bold uppercase tracking-wider text-white pb-2 border-b border-white/20">
                    Legal
                  </h3>
                  <ul role="list" className="mt-4 space-y-4">
                    {navigation.legal.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-sm leading-6 text-white/80 hover:text-white transition-colors"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
          <div className="mt-8 border-t border-parts-pass-green pt-6 sm:mt-10 lg:mt-12">
            <p className="text-xs leading-5 text-white">
              &copy; 2024 Parts Pass, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Return Popup Modal */}
      {isReturnPopupOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="relative bg-white w-full h-full overflow-hidden">
            {/* Close Button - Absolutely positioned over iframe */}
            <button
              onClick={closeReturnPopup}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Modal Content */}
            <div className="p-0 h-full">
              <iframe 
                sandbox="allow-scripts allow-popups allow-forms allow-same-origin" 
                width="100%" 
                height="100%" 
                style={{border: "0"}} 
                src="https://forms.helpdesk.com?licenseID=1240857385&contactFormID=994a0920-1a11-4638-82e6-172bf969b881"
                title="Return Form"
              >
                Your browser does not allow embedded content.
              </iframe>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
