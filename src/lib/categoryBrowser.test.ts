import { describe, expect, it, vi } from "vitest";

import {
  commonPartTypes,
  groupCategoryCounts,
  partSearchTarget,
  partTypesForTitle,
  similarPartTypes,
  splitIntoColumns,
} from "./categoryBrowser";

describe("commonPartTypes", () => {
  it("lists in-stock common repairs in popularity order with merged counts", () => {
    const counts = [
      {
        partType: "Spark Plug",
        title: "Spark Plug",
        category_1: "Ignition",
        count: 4,
      },
      {
        partType: "Differential Bearing",
        title: "Differential Bearing",
        category_1: "Drivetrain",
        count: 30,
      },
      { partType: "rotor", title: "rotor", category_1: "Brake", count: 3 },
      { partType: "Rotor", title: "Rotor", category_1: "Wheel", count: 3 },
      {
        partType: "Brake Pad",
        title: "Brake Pad",
        category_1: "Brake",
        count: 0,
      },
    ];

    expect(commonPartTypes(counts)).toEqual([
      { title: "rotor", count: 6 },
      { title: "Spark Plug", count: 4 },
    ]);
    expect(commonPartTypes(counts, 1)).toEqual([{ title: "rotor", count: 6 }]);
  });
});

describe("similarPartTypes", () => {
  it("keeps ranked order, only in-stock types, and skips ones already shown", () => {
    const counts = [
      {
        partType: "Spark Plug",
        title: "Spark Plug",
        category_1: "Ignition",
        count: 4,
      },
      {
        partType: "Spark Plug Wire Set",
        title: "Spark Plug Wire Set",
        category_1: "Ignition",
        count: 2,
      },
      {
        partType: "Spark Plug Boot",
        title: "Spark Plug Boot",
        category_1: "Ignition",
        count: 1,
      },
      {
        partType: "Spark Plug Boot",
        title: "Spark Plug Boot",
        category_1: "Engine",
        count: 2,
      },
    ];
    const ranked = [
      { title: "Spark Plug" },
      { title: "Spark Plug Tube Seal" },
      { title: "Spark Plug Boot" },
      { title: "Spark Plug Wire Set" },
    ];

    expect(similarPartTypes(ranked, counts, ["spark plug"])).toEqual([
      { title: "Spark Plug Boot", count: 3 },
      { title: "Spark Plug Wire Set", count: 2 },
    ]);
    expect(similarPartTypes(ranked, counts, [], 1)).toEqual([{ title: "Spark Plug", count: 4 }]);
  });
});

describe("partSearchTarget", () => {
  const counts = [
    {
      partType: "4WD Hub Locking Solenoid Connector",
      title: "4WD Hub Locking Solenoid Connector",
      category_1: "Electrical",
      count: 1,
    },
    {
      partType: "CV Axle",
      title: "CV Axle",
      category_1: "Drivetrain",
      count: 10,
    },
  ];
  const resolve = vi.fn((term: string) =>
    term.startsWith("cv") ? { title: "CV Axle", ids: [7] } : null,
  );

  it("fetches exactly the counted part type for an exact title, without fuzzy matching or part numbers", () => {
    expect(partSearchTarget("4wd hub locking solenoid connector", counts, resolve)).toEqual({
      categoryIds: [],
      partNumbers: [],
      partTypes: ["4WD Hub Locking Solenoid Connector"],
    });
    expect(resolve).not.toHaveBeenCalled();
  });

  it("adds the in-stock part type of a fuzzy match", () => {
    expect(partSearchTarget("cv axel 12345", counts, resolve)).toEqual({
      categoryIds: [7],
      partNumbers: ["12345"],
      partTypes: ["CV Axle"],
    });
  });
});

describe("groupCategoryCounts", () => {
  it("groups part types by top-level category, merging duplicate titles and hiding batteries", () => {
    const groups = groupCategoryCounts([
      {
        partType: "Brake Rotor",
        title: "Brake Rotor",
        category_1: "Brake",
        count: 4,
      },
      {
        partType: "Brake Pad",
        title: "Brake Pad",
        category_1: "Brake",
        count: 6,
      },
      {
        partType: "brake pad",
        title: "brake pad",
        category_1: "Brake",
        count: 2,
      },
      {
        partType: "Battery",
        title: "Battery",
        category_1: "Electrical",
        count: 3,
      },
      {
        partType: "Alternator",
        title: "Alternator",
        category_1: "Electrical",
        count: 1,
      },
    ]);

    expect(groups).toEqual([
      {
        title: "Brake",
        count: 12,
        items: [
          { title: "Brake Pad", count: 8 },
          { title: "Brake Rotor", count: 4 },
        ],
      },
      {
        title: "Electrical",
        count: 1,
        items: [{ title: "Alternator", count: 1 }],
      },
    ]);
  });

  it("shows a part type's total across top-level categories, matching what selecting it returns", () => {
    const rows = [
      { partType: "Oil Pan", title: "Oil Pan", category_1: "Engine", count: 1 },
      {
        partType: "Oil Pan",
        title: "Oil Pan",
        category_1: "Transmission",
        count: 2,
      },
    ];

    expect(groupCategoryCounts(rows)).toEqual([
      { title: "Engine", count: 1, items: [{ title: "Oil Pan", count: 3 }] },
      {
        title: "Transmission",
        count: 2,
        items: [{ title: "Oil Pan", count: 3 }],
      },
    ]);
    expect(partTypesForTitle(rows, " oil pan")).toEqual(["Oil Pan"]);
  });
});

describe("splitIntoColumns", () => {
  it("keeps order within columns and fills the shortest column first", () => {
    const items = [{ id: "a", h: 5 }, { id: "b", h: 2 }, { id: "c", h: 2 }, { id: "d", h: 1 }];
    const columns = splitIntoColumns(items, 2, (item) => item.h).map((col) => col.map((i) => i.id));
    expect(columns).toEqual([["a"], ["b", "c", "d"]]);
  });

  it("returns one column for counts below one", () => {
    expect(splitIntoColumns([1, 2], 0, () => 1)).toEqual([[1, 2]]);
  });
});
