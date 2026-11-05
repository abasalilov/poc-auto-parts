import { describe, expect, it } from "vitest";

import { sortParts } from "./sortParts";

const parts = [
  { id: "a", price: "30.00", manufacturer: "Moog", partNumber: "K80" },
  { id: "b", price: "10.50", manufacturer: "Bosch", partNumber: "BC1058" },
  { id: "c", price: "", manufacturer: "Akebono", partNumber: "ACT1" },
  { id: "d", price: "20", manufacturer: "Wagner", partNumber: "ZD-1012" },
];

const ids = (list: { id: string }[]) => list.map((part) => part.id);

describe("sortParts", () => {
  it("sorts by price with unpriced parts last, or by brand", () => {
    expect(ids(sortParts(parts, "price-asc", "brake pad"))).toEqual(["b", "d", "a", "c"]);
    expect(ids(sortParts(parts, "price-desc", "brake pad"))).toEqual(["a", "d", "b", "c"]);
    expect(ids(sortParts(parts, "brand-asc", "brake pad"))).toEqual(["c", "b", "a", "d"]);
  });

  it("puts a searched part number first regardless of sort", () => {
    expect(ids(sortParts(parts, "price-asc", "zd1012"))).toEqual(["d", "b", "a", "c"]);
  });

  it("does not mutate the input", () => {
    sortParts(parts, "price-asc", "");
    expect(ids(parts)).toEqual(["a", "b", "c", "d"]);
  });
});
