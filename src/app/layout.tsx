import type { Metadata } from "next";
import { Montserrat, Work_Sans } from "next/font/google";
import "@stripe/stripe-js";
import { GoogleAnalytics } from "@next/third-parties/google";

import "./globals.css";
import MetaPageViewTracker from "@/components/MetaPageViewTracker";
import Providers from "./providers";
import Script from "next/script";

const montserrat = Montserrat({
  variable: "--mont-font",
  subsets: ["latin"],
});

const workSans = Work_Sans({ variable: "--work-font", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Parts Pass",
  description: "Find auto parts at great prices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const siteUrl = (
    configuredSiteUrl && !configuredSiteUrl.includes("cloudfunctions.net")
      ? configuredSiteUrl
      : "https://www.partspass.app"
  ).replace(/\/$/, "");

  return (
    <html lang="en" className={`${montserrat.variable} ${workSans.variable}`}>
      <head>
        <meta property="og:logo" content={`${siteUrl}/parts_pass_logo_white.png`} />
        <meta name="facebook-domain-verification" content="uetlxmdj8ijtfo981bkiwl5g1d1cw8" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>

        {metaPixelId && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
          `}
            </Script>
            <MetaPageViewTracker />
          </>
        )}
      </body>
      {/* make env var, use a test version ga4window interface */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
