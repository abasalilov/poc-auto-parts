import { sellPriceCents } from "@/lib/pricing";
import { clean, toGtin } from "@/lib/productQueries";
import { isRemanufactured, productDescription } from "@/lib/productStructuredData";
import { productUrl } from "@/lib/productUrl";
import { HANDLING_DAYS, isFreightOnly, shipmentCents, TRANSIT_DAYS, type Parcel } from "@/lib/shippingRates";

/** Google product taxonomy: Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts. */
export const GOOGLE_PRODUCT_CATEGORY = "899";
const MAX_ADDITIONAL_IMAGES = 10;

export const FEED_COLUMNS = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "additional_image_link",
  "availability",
  "price",
  "brand",
  "gtin",
  "mpn",
  "condition",
  "google_product_category",
  "product_type",
  "shipping",
] as const;

export type FeedItem = Record<(typeof FEED_COLUMNS)[number], string>;

export interface FeedSource {
  manufacturer: unknown;
  partNumber: string;
  lineCode: string;
  category1: unknown;
  category2: unknown;
  tagline: unknown;
  /** The part's own notes: position, options, VIN or date ranges. */
  notes: unknown;
  piesDescription: unknown;
  cost: unknown;
  core: unknown;
  upc: unknown;
  images: string[];
  parcel: Parcel;
}

const dollars = (cents: number) => `${(cents / 100).toFixed(2)} USD`;

/** Returns null for items Google would disapprove (no landing page, image or price) or that can't be bought online. */
export const merchantFeedItem = (source: FeedSource): FeedItem | null => {
  const manufacturer = clean(source.manufacturer);
  const link = productUrl({ manufacturer, partNumber: source.partNumber });
  const priceCents = sellPriceCents(source.cost, source.core);
  if (!link || source.images.length === 0 || priceCents <= 0 || isFreightOnly(source.parcel)) return null;

  const category1 = clean(source.category1);
  const category2 = clean(source.category2);
  const title = [manufacturer, category2, source.partNumber].filter(Boolean).join(" ");
  const text = { tagline: clean(source.tagline), description: clean(source.notes) };

  return {
    id: `${source.lineCode}-${source.partNumber}`,
    title: title.slice(0, 150),
    description: productDescription({ title, ...text, piesDescription: clean(source.piesDescription) }),
    link,
    image_link: source.images[0],
    additional_image_link: source.images.slice(1, MAX_ADDITIONAL_IMAGES + 1).join(","),
    availability: "in_stock",
    price: dollars(priceCents),
    brand: manufacturer,
    gtin: toGtin(source.upc) ?? "",
    mpn: source.partNumber,
    condition: isRemanufactured(text) ? "refurbished" : "new",
    google_product_category: GOOGLE_PRODUCT_CATEGORY,
    product_type: [category1, category2].filter(Boolean).join(" > "),
    shipping: [
      "US",
      dollars(shipmentCents([{ parcel: source.parcel, quantity: 1 }])),
      HANDLING_DAYS.min,
      HANDLING_DAYS.max,
      TRANSIT_DAYS.min,
      TRANSIT_DAYS.max,
    ].join(":"),
  };
};

const tsvCell = (value: string) => value.replace(/[\t\r\n]+/g, " ").trim();

/** Without named sub-attributes Google reads shipping as country:region:service:price only. */
const HEADER_NAMES: Partial<Record<(typeof FEED_COLUMNS)[number], string>> = {
  shipping: "shipping(country:price:min_handling_time:max_handling_time:min_transit_time:max_transit_time)",
};

export const feedHeader = () => FEED_COLUMNS.map((column) => HEADER_NAMES[column] ?? column).join("\t");

export const feedRow = (item: FeedItem) => FEED_COLUMNS.map((column) => tsvCell(item[column])).join("\t");
