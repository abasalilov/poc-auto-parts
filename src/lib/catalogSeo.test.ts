import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ query: vi.fn() }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

const { imageFolderCheck, pageCount, LIST_PAGE_SIZE } = await import("./catalog");
const { isIndexable } = await import("./indexing");
const { pageWindow, parseCategorySegments, parsePageSegment } = await import("./pagination");
const { brandListPath, itemKey, partTypeListPath, partTypeSlug } = await import("./productUrl");
const { productBreadcrumbs, productDescription } = await import("./productStructuredData");
const { interleaveByType } = await import("./relatedParts");
const { REPAIR_JOBS, relatedPartTypes, storedTitles } = await import("./repairJobs");

describe("imageFolderCheck", () => {
  it("only accepts line codes whose image folder was uploaded", () => {
    const hasImages = imageFolderCheck(["BS", "CE"]);
    expect(hasImages(" BS ")).toBe(true);
    expect(hasImages("S5")).toBe(false);
  });

  it("assumes images exist when the bucket couldn't be listed", () => {
    expect(imageFolderCheck(null)("S5")).toBe(true);
    expect(imageFolderCheck([])("S5")).toBe(true);
  });
});

describe("isIndexable", () => {
  const product = { images: ["a.jpg"], piesDescription: "x".repeat(60), priceCents: 1000 };

  it("needs a photo, a price and a real description", () => {
    expect(isIndexable(product)).toBe(true);
    expect(isIndexable({ ...product, images: [] })).toBe(false);
    expect(isIndexable({ ...product, priceCents: 0 })).toBe(false);
    expect(isIndexable({ ...product, piesDescription: "Control/Trailing Arm, wheel suspension" })).toBe(false);
  });
});

describe("productDescription", () => {
  it("joins title, tagline, notes and PIES copy as sentences, skipping blanks", () => {
    expect(
      productDescription({ title: "WIX Oil Filter 51515", tagline: "", description: "Spin-On", piesDescription: "Lasts." }),
    ).toBe("WIX Oil Filter 51515. Spin-On. Lasts.");
  });
});

describe("list paths", () => {
  it("slugs part types and leaves page 1 off the URL", () => {
    expect(partTypeSlug("Oxygen (O2) Sensor")).toBe("oxygen-o2-sensor");
    expect(partTypeSlug("Wheel Bearing &amp; Hub")).toBe("wheel-bearing-and-hub");
    expect(brandListPath("acdelco")).toBe("/brands/acdelco");
    expect(partTypeListPath("rotor", 3)).toBe("/categories/rotor/3");
    expect(partTypeListPath("rotor", 1, "bosch")).toBe("/categories/rotor/brand/bosch");
    expect(partTypeListPath("rotor", 2, "bosch")).toBe("/categories/rotor/brand/bosch/2");
  });

  it("reads an optional brand and page after the part type", () => {
    expect(parseCategorySegments(undefined)).toEqual({ brand: undefined, page: 1 });
    expect(parseCategorySegments(["3"])).toEqual({ brand: undefined, page: 3 });
    expect(parseCategorySegments(["brand", "bosch"])).toEqual({ brand: "bosch", page: 1 });
    expect(parseCategorySegments(["brand", "bosch", "2"])).toEqual({ brand: "bosch", page: 2 });
    expect(parseCategorySegments(["brand"])).toBeNull();
    expect(parseCategorySegments(["brand", "bosch", "1"])).toBeNull();
    expect(parseCategorySegments(["bosch"])).toBeNull();
  });

  it("keys items by line code and part number", () => {
    expect(itemKey({ lineCode: "bs ", partNumber: "0986424481" })).toBe("BS:0986424481");
  });

  it("only accepts canonical page segments", () => {
    expect(parsePageSegment(undefined)).toBe(1);
    expect(parsePageSegment(["2"])).toBe(2);
    expect(parsePageSegment(["1"])).toBeNull();
    expect(parsePageSegment(["02"])).toBeNull();
    expect(parsePageSegment(["2", "3"])).toBeNull();
    expect(parsePageSegment(["abc"])).toBeNull();
  });

  it("shows the first, last and nearby pages with gaps", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(5, 20)).toEqual([1, null, 3, 4, 5, 6, 7, null, 20]);
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("counts pages, with at least one", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(LIST_PAGE_SIZE)).toBe(1);
    expect(pageCount(LIST_PAGE_SIZE + 1)).toBe(2);
  });
});

describe("productBreadcrumbs", () => {
  it("links the brand and part type only when their pages exist", () => {
    const product = { manufacturer: "BOSCH", category2: "Brake Pad" };
    expect(productBreadcrumbs(product, { brand: "bosch", partType: true })).toEqual([
      { name: "BOSCH", path: "/brands/bosch" },
      { name: "Brake Pad", path: "/categories/brake-pad" },
    ]);
    expect(productBreadcrumbs(product, { brand: null, partType: false })).toEqual([]);
  });
});

describe("repair jobs", () => {
  it("relates brake pads to the rest of a brake job, most related first", () => {
    const related = relatedPartTypes("brake pad");
    expect(related.slice(0, 3)).toEqual(["Rotor", "Caliper", "Disc Brake Hardware Kit"]);
    expect(related).not.toContain("Brake Pad");
  });

  it("merges every job a part type belongs to without duplicates", () => {
    const related = relatedPartTypes("Water Pump");
    expect(related).toEqual(expect.arrayContaining(["Timing Belt", "Thermostat", "Radiator"]));
    expect(new Set(related).size).toBe(related.length);
  });

  it("returns nothing for part types outside any job", () => {
    expect(relatedPartTypes("Brake Bleeder Cap")).toEqual([]);
  });

  it("matches both stored spellings of an ampersand", () => {
    expect(storedTitles(["Wheel Bearing & Hub"])).toEqual(["Wheel Bearing & Hub", "Wheel Bearing &amp; Hub"]);
  });

  it("has no job with a duplicate part type", () => {
    REPAIR_JOBS.forEach((job) => expect(new Set(job.map((t) => t.toLowerCase())).size).toBe(job.length));
  });
});

describe("interleaveByType", () => {
  const card = (partType: string, n: number) => ({
    path: `/parts/x/${partType}-${n}`,
    title: "",
    manufacturer: "X",
    lineCode: "XX",
    partNumber: String(n),
    partType,
    image: "i.jpg",
    priceCents: 100,
  });

  it("takes one of each part type in job order before seconds", () => {
    const cards = [card("Rotor", 1), card("Rotor", 2), card("Rotor", 3), card("Caliper", 1), card("Other", 1)];
    expect(interleaveByType(cards, ["Rotor", "Caliper"], 4).map((c) => c.path)).toEqual([
      "/parts/x/Rotor-1",
      "/parts/x/Caliper-1",
      "/parts/x/Other-1",
      "/parts/x/Rotor-2",
    ]);
  });

  it("drops duplicate products", () => {
    expect(interleaveByType([card("Rotor", 1), card("Rotor", 1)], ["Rotor"])).toHaveLength(1);
  });
});
