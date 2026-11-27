import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ query: vi.fn() }));

const { FEED_COLUMNS, feedHeader, feedRow, merchantFeedItem } = await import("./merchantFeed");

const source = {
  manufacturer: "BOSCH",
  partNumber: "BC1058",
  lineCode: "BOS",
  category1: "Brake",
  category2: "Brake Pad",
  tagline: "QuietCast\tPremium",
  notes: "Front",
  piesDescription: "Ceramic\npads",
  cost: "37.89",
  core: "0",
  upc: "826732951805",
  images: ["https://img/1.jpg", "https://img/2.jpg", "https://img/3.jpg"],
  parcel: { weightLb: 2.1, lengthIn: 7, widthIn: 6, heightIn: 3, fallbackLb: 5 },
};

describe("merchantFeedItem", () => {
  it("maps a product row to Google Merchant attributes", () => {
    const item = merchantFeedItem(source)!;
    expect(item).toMatchObject({
      id: "BOS-BC1058",
      title: "BOSCH Brake Pad BC1058",
      link: "https://www.partspass.app/parts/bosch/BC1058",
      image_link: "https://img/1.jpg",
      additional_image_link: "https://img/2.jpg,https://img/3.jpg",
      availability: "in_stock",
      price: "45.47 USD",
      brand: "BOSCH",
      gtin: "826732951805",
      mpn: "BC1058",
      condition: "new",
      google_product_category: "899",
      product_type: "Brake > Brake Pad",
      shipping: "US:11.99 USD:0:1:1:3",
    });
    expect(item.description).toBe("BOSCH Brake Pad BC1058. QuietCast Premium. Front. Ceramic pads.");
  });

  it("lists remanufactured parts as refurbished", () => {
    expect(merchantFeedItem({ ...source, tagline: "Remanufactured" })!.condition).toBe("refurbished");
    expect(merchantFeedItem({ ...source, notes: "Reman; With Pulley" })!.condition).toBe("refurbished");
    expect(merchantFeedItem({ ...source, tagline: "New; Non-Remanufactured" })!.condition).toBe("new");
  });

  it("drops invalid GTINs and skips items without an image or price", () => {
    expect(merchantFeedItem({ ...source, upc: "123" })!.gtin).toBe("");
    expect(merchantFeedItem({ ...source, images: [] })).toBeNull();
    expect(merchantFeedItem({ ...source, cost: "0" })).toBeNull();
    expect(merchantFeedItem({ ...source, manufacturer: "" })).toBeNull();
    expect(merchantFeedItem({ ...source, parcel: { ...source.parcel, weightLb: 200 } })).toBeNull();
  });
});

describe("feed TSV", () => {
  it("writes one tab-separated cell per column with no embedded tabs or newlines", () => {
    const item = merchantFeedItem(source)!;
    const cells = feedRow({ ...item, title: "A\tB\nC" }).split("\t");
    const header = feedHeader().split("\t");
    expect(header).toHaveLength(FEED_COLUMNS.length);
    expect(header.at(-1)).toBe(
      "shipping(country:price:min_handling_time:max_handling_time:min_transit_time:max_transit_time)",
    );
    expect(header.at(-1)!.slice(1, -1).split(":")).toHaveLength(item.shipping.split(":").length);
    expect(cells).toHaveLength(FEED_COLUMNS.length);
    expect(cells[1]).toBe("A B C");
  });
});
