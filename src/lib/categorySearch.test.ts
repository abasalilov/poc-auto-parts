import { describe, expect, it } from "vitest";

import engine7057 from "./__fixtures__/engine7057Categories.json";
import {
  createCategorySearcher,
  decodeHtmlEntities,
  extractPartNumberCandidates,
  groupCategories,
} from "./categorySearch";

const searcher = createCategorySearcher(engine7057);
const titles = (query: string, limit = 5) =>
  searcher.search(query, limit).map((category) => category.title);

describe("category fuzzy search (engine 7057 categories)", () => {
  it.each([
    ["Brake Pad"],
    ["brake pad"],
    ["brk pad"],
    ["break pad"],
    ["brake p"],
    ["Brake Pads"],
  ])("%s -> Brake Pad", (query) => {
    const [top] = searcher.search(query);
    expect(top.title).toBe("Brake Pad");
    expect(top.id).toBe(1);
  });

  it.each([
    ["brake rotor", "Rotor"],
    ["alternator", "Alternator / Generator"],
    ["oil filter", "Oil Filter"],
    ["spark plug", "Spark Plug"],
    ["Ingition Coil", "Ignition Coil"],
    ["Wheel Bearing & Hub", "Wheel Bearing & Hub"],
    ["o2 sensor", "Oxygen (O2) Sensor"],
  ])("%s -> %s", (query, expected) => {
    expect(searcher.resolve(query)?.title).toBe(expected);
  });

  it("ranks the exact title ahead of longer titles containing it", () => {
    const ranked = titles("brk pad", 10);
    const brakePad = ranked.indexOf("Brake Pad");
    expect(brakePad).toBe(0);
    expect(ranked.indexOf("Brake Pad Drag Reduction Clip")).toBeGreaterThan(brakePad);
    expect(ranked.indexOf("Caliper, Rotor & Brake Pad Kit")).toBeGreaterThan(brakePad);
  });

  it("ranks exact title, then normalized match, above fuzzy matches", () => {
    const [exact] = searcher.search("Oil Filter");
    const [normalized] = searcher.search("oil filters");
    const [fuzzy] = searcher.search("oil filtr");
    expect(exact.title).toBe("Oil Filter");
    expect(normalized.title).toBe("Oil Filter");
    expect(fuzzy.title).toBe("Oil Filter");
    expect(exact.score).toBeGreaterThan(normalized.score);
    expect(normalized.score).toBeGreaterThan(fuzzy.score);
  });

  it("does not return excessive or unrelated categories", () => {
    const results = searcher.search("brk pad");
    expect(results.length).toBeLessThanOrEqual(10);
    results.forEach((category) => expect(category.title).toMatch(/brake.*(pad|pedal)/i));
    expect(searcher.search("spark plug").every((c) => /spark plug/i.test(c.title))).toBe(true);
    expect(searcher.search("zzzzqqq")).toEqual([]);
  });

  it("returns nothing for an empty query", () => {
    expect(searcher.search("")).toEqual([]);
    expect(searcher.search("   ")).toEqual([]);
    expect(searcher.resolve("")).toBeNull();
  });

  it("presents decoded titles and still matches them", () => {
    const kit = searcher.search("caliper rotor brake pad kit")[0];
    expect(kit.title).toBe("Caliper, Rotor & Brake Pad Kit");
    expect(kit.id).toBe(4360041);
    expect(searcher.categories.some((c) => c.title.includes("&amp;"))).toBe(false);
  });
});

describe("groupCategories", () => {
  it("merges duplicate titles and keeps every category_2 id", () => {
    const grouped = groupCategories([
      { id: 11533571, title: "Air Dam", category_1: "Body" },
      { id: 65232, title: "Air Dam", category_1: "Body" },
      { id: 1, title: "Brake Pad", category_1: "Brake &amp; Wheel Hub" },
    ]);
    expect(grouped).toEqual([
      { id: 65232, ids: [65232, 11533571], title: "Air Dam", category1: ["Body"] },
      { id: 1, ids: [1], title: "Brake Pad", category1: ["Brake & Wheel Hub"] },
    ]);
  });

  it("covers duplicate ids in the real engine data", () => {
    const airDam = searcher.resolve("air dam");
    expect(airDam?.ids).toEqual([65232, 11533571]);
  });
});

describe("helpers", () => {
  it("decodes HTML entities", () => {
    expect(decodeHtmlEntities("Caliper, Rotor &amp; Brake Pad Kit")).toBe(
      "Caliper, Rotor & Brake Pad Kit",
    );
    expect(decodeHtmlEntities("A &quot;B&quot; &#39;C&#39; &unknown;")).toBe(
      "A \"B\" 'C' &unknown;",
    );
  });

  it("extracts part-number-like tokens", () => {
    expect(extractPartNumberCandidates("BOSCH Brake Pad BC1058")).toEqual(["BC1058"]);
    expect(extractPartNumberCandidates("ad0868 14d1285chf1")).toEqual([
      "AD0868",
      "14D1285CHF1",
    ]);
    expect(extractPartNumberCandidates("brake pad")).toEqual([]);
  });
});
