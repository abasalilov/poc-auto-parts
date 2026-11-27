import type { Product } from "@/lib/productQueries";
import { brandListPath, partTypeListPath, partTypeSlug, productUrl, siteUrl } from "@/lib/productUrl";
import { HANDLING_DAYS, TRANSIT_DAYS } from "@/lib/shippingRates";

export const RETURN_DAYS = 30;

type DescriptionSource = Pick<Product, "title" | "tagline" | "description" | "piesDescription">;

/** Title, tagline, the part's own notes (position, options, VIN) and the PIES marketing copy. */
export const productDescription = (product: DescriptionSource) =>
  [`${product.title}.`, product.tagline, product.description, product.piesDescription]
    .filter(Boolean)
    .map((part) => (/[.!?]$/.test(part) ? part : `${part}.`))
    .join(" ")
    .slice(0, 5000);

const REMANUFACTURED = /\b(reman|remanufactured|rebuilt|refurbished)\b/i;
const NOT_REMANUFACTURED = /\bnon[- ]?(reman|remanufactured)\b/i;

/** Remanufactured parts must be listed as refurbished, not new, on Google. */
export const isRemanufactured = (product: Pick<Product, "tagline" | "description">) => {
  const text = `${product.tagline} ${product.description}`;
  return REMANUFACTURED.test(text) && !NOT_REMANUFACTURED.test(text);
};

const dollars = (cents: number) => (cents / 100).toFixed(2);

const BUSINESS_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const businessDays = ({ min, max }: { min: number; max: number }) => ({
  "@type": "QuantitativeValue",
  minValue: min,
  maxValue: max,
  unitCode: "DAY",
});

/** `shippingCents` is the price for one unit, or null for freight-only parts. */
export const productJsonLd = (product: Product, shippingCents: number | null) => {
  const url = productUrl(product);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.title,
    description: productDescription(product),
    sku: `${product.lineCode}-${product.partNumber}`,
    mpn: product.partNumber,
    ...(product.gtin ? { gtin: product.gtin } : {}),
    brand: { "@type": "Brand", name: product.manufacturer },
    category: [product.category1, product.category2].filter(Boolean).join(" > "),
    ...(product.images.length ? { image: product.images } : {}),
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: dollars(product.priceCents),
      availability: "https://schema.org/InStock",
      itemCondition: isRemanufactured(product)
        ? "https://schema.org/RefurbishedCondition"
        : "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Parts Pass" },
      ...(shippingCents !== null
        ? {
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: {
                "@type": "MonetaryAmount",
                value: dollars(shippingCents),
                currency: "USD",
              },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
              deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: businessDays(HANDLING_DAYS),
                transitTime: businessDays(TRANSIT_DAYS),
                businessDays: {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: BUSINESS_DAYS.map((day) => `https://schema.org/${day}`),
                },
              },
            },
          }
        : {}),
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: RETURN_DAYS,
        returnMethod: "https://schema.org/ReturnByMail",
        // Customers pay their own return shipping unless we made the error (see /return-policy).
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      },
    },
  };
};

export interface Breadcrumb {
  name: string;
  path: string;
}

/** Brand and part type crumbs, each only when that listing page exists. */
export const productBreadcrumbs = (
  product: Pick<Product, "manufacturer" | "category2">,
  { brand, partType }: { brand?: string | null; partType?: boolean },
): Breadcrumb[] => [
  ...(brand ? [{ name: product.manufacturer, path: brandListPath(brand) }] : []),
  ...(partType && product.category2
    ? [{ name: product.category2, path: partTypeListPath(partTypeSlug(product.category2)) }]
    : []),
];

export const breadcrumbJsonLd = (product: Product, crumbs: Breadcrumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { name: "Home", item: siteUrl() },
    ...crumbs.map((crumb) => ({ name: crumb.name, item: `${siteUrl()}${crumb.path}` })),
    { name: product.title, item: productUrl(product) },
  ].map((crumb, index) => ({ "@type": "ListItem", position: index + 1, ...crumb })),
});

/** Escapes `<` so product text can never close the surrounding script tag. */
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
