import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => query(...args) }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

const {
  clean,
  cleanDescription,
  findProductPathByPartKey,
  getProduct,
  getProductFitment,
  groupFitment,
  partFitsEngine,
  toGtin,
} = await import(
  "./productQueries"
);
const { productJsonLd } = await import("./productStructuredData");
const { brandSlug, productPath } = await import("./productUrl");
const { sellPriceCents } = await import("./pricing");

beforeEach(() => {
  query.mockReset();
});

describe("product urls", () => {
  it("slugs brands and normalizes part numbers", () => {
    expect(brandSlug("AC DELCO")).toBe("ac-delco");
    expect(brandSlug("A&amp;I")).toBe("a-and-i");
    expect(productPath({ manufacturer: "BOSCH", partNumber: "bc1058" })).toBe("/parts/bosch/BC1058");
    expect(productPath({ manufacturer: "", partNumber: "X" })).toBeNull();
  });
});

describe("clean", () => {
  it("turns double-encoded lists without semicolons into sentences", () => {
    expect(
      clean(
        "TRAN MNT LT, &ampltul&ampgt&ampltli&ampgtAnchor 3435&amplt/li&ampgt&ampltli&ampgtChemlock&amp#174 bonding agent&amplt/li&ampgt&amplt/ul&ampgt, FORD 13-20",
      ),
    ).toBe("TRAN MNT LT, Anchor 3435. Chemlock® bonding agent, FORD 13-20");
  });

  it("decodes Windows punctuation codes and entities missing their semicolon", () => {
    expect(clean("Bosch&#146s pads &#151known for &quotquiet&quot stops at 300&#176C")).toBe(
      "Bosch’s pads —known for \"quiet\" stops at 300°C",
    );
    expect(clean("Bosch&ampaposs best pads")).toBe("Bosch's best pads");
    expect(clean("Brake &amp; Wheel Hub")).toBe("Brake & Wheel Hub");
  });

  it("keeps punctuation and text that only looks like markup", () => {
    expect(clean("<p>Fits e.g., sedans.</p><p>Coupes</p>")).toBe("Fits e.g., sedans. Coupes");
    expect(clean("Pressure &ltNR 5 psi")).toBe("Pressure <NR 5 psi");
    expect(clean("Lamp <b>bright</b><br/>12V")).toBe("Lamp bright. 12V");
  });
});

describe("cleanDescription", () => {
  it("drops sentences the supplier repeated and the restated opening of a run-on", () => {
    expect(
      cleanDescription(
        "Anchor 3435. This mount supports the transmission and dampens vibration. Rubber is natural and SBR., FORD 13-20, This mount supports the transmission and dampens vibration, Anchor 3435 This mount supports the transmission and dampens vibration Steel fasteners are grade 5, Rubber is natural and SBR.",
      ),
    ).toBe(
      "Anchor 3435. This mount supports the transmission and dampens vibration. Rubber is natural and SBR., FORD 13-20, Steel fasteners are grade 5",
    );
  });

  it("keeps each vehicle's bracketed qualifiers and openings that continue mid-sentence", () => {
    const qualifiers =
      "1991 Ford Mustang (Qualifier: Head Bolts Not Included, Premium Valve Stem Seals Included) 1989 Ford Ranger (Qualifier: Head Bolts Not Included, Premium Valve Stem Seals Included)";
    expect(cleanDescription(qualifiers)).toBe(qualifiers);
    const paint =
      "Each unit is electrostatically painted with automotive grade paint, ensuring a long finish., Each unit is electrostatically painted with automotive grade paint to protect the unit.";
    expect(cleanDescription(paint)).toBe(paint);
  });

  it("keeps vehicles that repeat under a different make", () => {
    const text = "Chevrolet K1500 Suburban 1999-1992, K2500 1991-1988, GMC K1500 1999-1988, K1500 Suburban 1999-1992, K2500 1991-1988";
    expect(cleanDescription(text)).toBe(text);
  });

  it("keeps short fragments and openings that continue a different sentence", () => {
    const text =
      "Pentosin FFL2 Double Clutch Transmission Fluid formulated for DSG trans, Meets VW spec. TL 521 82., Pentosin FFL2 Double Clutch Transmission Fluid is specially formulated for Audi, Fluid meets spec. TL 521 82.";
    expect(cleanDescription(text)).toBe(text);
  });
});

describe("sellPriceCents", () => {
  it("adds 20% markup to cost plus the core charge", () => {
    expect(sellPriceCents("31.57", "0")).toBe(3788);
    expect(sellPriceCents("10.00", "5.00")).toBe(1700);
  });
});

describe("toGtin", () => {
  it("accepts valid GTINs and strips zero padding", () => {
    expect(toGtin("028851239875")).toBe("028851239875");
    expect(toGtin("0028851239875")).toBe("0028851239875");
    expect(toGtin("000000028851239875")).toBe("00028851239875");
  });

  it("rejects bad check digits, wrong lengths and blanks", () => {
    expect(toGtin("028851239876")).toBeNull();
    expect(toGtin("12345")).toBeNull();
    expect(toGtin(null)).toBeNull();
    expect(toGtin("000000000000")).toBeNull();
  });
});

describe("groupFitment", () => {
  it("merges makes and models that only differ by HTML entities", () => {
    const rows = [
      { make: "FORD", model: "F-150", year_from: 2009, year_to: 2014 },
      { make: "MERCEDES-BENZ", model: "C230", year_from: 2003, year_to: 2005 },
      { make: "MERCEDES-BENZ", model: "C230", year_from: "2006", year_to: "2007" },
    ] as any;
    expect(groupFitment(rows)).toEqual([
      { make: "FORD", model: "F-150", yearFrom: "2009", yearTo: "2014" },
      { make: "MERCEDES-BENZ", model: "C230", yearFrom: "2003", yearTo: "2007" },
    ]);
  });
});

describe("getProductFitment and partFitsEngine", () => {
  it("skips the query without part ids", async () => {
    expect(await getProductFitment([])).toEqual({ groups: [], partial: false });
    expect(await partFitsEngine([], 1)).toBe(false);
    expect(query).not.toHaveBeenCalled();
  });

  it("reads a fixed number of fitment rows in index order", async () => {
    query
      .mockResolvedValueOnce([{ make: "Ford", model: "F-150", year_from: 2009, year_to: 2014 }])
      .mockResolvedValueOnce([{ n: 3 }]);
    expect(await getProductFitment([11, 10])).toEqual({
      groups: [{ make: "Ford", model: "F-150", yearFrom: "2009", yearTo: "2014" }],
      partial: false,
    });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/ORDER BY eccp\.part_id, eccp\.id\s+LIMIT 500\b/);
    expect(sql).toMatch(/MAX_EXECUTION_TIME\(15000\)/);
    expect(params).toEqual([[10, 11]]);
  });

  it("flags the list as partial when the part has more rows than the cap", async () => {
    query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ n: 501 }]);
    expect((await getProductFitment([10])).partial).toBe(true);
    expect(query.mock.calls[1][0]).toMatch(/LIMIT 501\b/);
  });

  it("checks fit starting from the engine", async () => {
    query.mockResolvedValueOnce([]);
    await partFitsEngine([10], 1);
    expect(query.mock.calls[0][0]).toMatch(/FROM engine_x_category_1 ec\s+STRAIGHT_JOIN/);
  });

  it("checks a single engine", async () => {
    query.mockResolvedValueOnce([{ 1: 1 }]);
    expect(await partFitsEngine([10, 11], 28400)).toBe(true);
    expect(query.mock.calls[0][1]).toEqual([[10, 11], 28400]);
    query.mockResolvedValueOnce([]);
    expect(await partFitsEngine([10], 1)).toBe(false);
  });
});

describe("findProductPathByPartKey", () => {
  it("maps an in-stock legacy part key to the product path", async () => {
    query.mockResolvedValueOnce([{ manufacturer: "BOSCH", part_number: "BC1058" }]);
    expect(await findProductPathByPartKey("6128547")).toBe("/parts/bosch/BC1058");
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/Quantity_Total > 0/);
    expect(params).toEqual(["6128547"]);
  });

  it("returns null when the part is gone or out of stock", async () => {
    query.mockResolvedValueOnce([]);
    expect(await findProductPathByPartKey("1")).toBeNull();
  });
});

describe("getProduct", () => {
  const partRow = {
    id: 10,
    manufacturer: "BOSCH",
    part_number: "BC1058",
    partkey: "6128547",
    tagline: "QuietCast; Ceramic",
    description: "Front",
    category_1: "Brake &amp; Wheel Hub",
    category_2: "Brake Pad",
    pa_line_code: "BS",
    Cost: "31.57",
    Core_Charge: "0.00",
    UPC: "028851239875",
  };

  it("rejects malformed part numbers without querying", async () => {
    expect(await getProduct("bosch", "BC1058'; DROP")).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it("returns null when the brand slug does not match", async () => {
    query.mockResolvedValueOnce([partRow]);
    expect(await getProduct("wagner", "BC1058")).toBeNull();
  });

  it("builds an in-stock product with images and structured data", async () => {
    query
      .mockResolvedValueOnce([partRow, { ...partRow, id: 11, category_2: "Brake Pad Set" }])
      .mockResolvedValueOnce([{ ImageName: "BS_BC1058_Bac.jpg" }, { ImageName: "BS_BC1058_Fro.jpg" }])
      .mockResolvedValueOnce([{ descriptions: "Bosch&ampaposs best pads" }]);

    const product = await getProduct("bosch", "bc1058");
    expect(product).toMatchObject({
      partIds: [10, 11],
      title: "BOSCH Brake Pad BC1058",
      category1: "Brake & Wheel Hub",
      priceCents: 3788,
      gtin: "028851239875",
      piesDescription: "Bosch's best pads",
    });
    expect(product?.images[0]).toMatch(/\/BS\/BS_BC1058_Fro\.jpg$/);

    const [baseSql, baseParams] = query.mock.calls[0];
    expect(baseSql).toMatch(/Quantity_Total > 0/);
    expect(baseParams).toEqual(["BC1058"]);
    expect(query).toHaveBeenCalledTimes(3);

    const ld = productJsonLd(product!, 799);
    expect(ld.offers).toMatchObject({
      price: "37.88",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      shippingDetails: {
        shippingRate: { value: "7.99" },
        deliveryTime: {
          handlingTime: { minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: { minValue: 1, maxValue: 3, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: { returnFees: "https://schema.org/ReturnFeesCustomerResponsibility" },
    });
    expect(ld.url).toBe("https://www.partspass.app/parts/bosch/BC1058");
    expect(productJsonLd(product!, null).offers).not.toHaveProperty("shippingDetails");
  });
});
