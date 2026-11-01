import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => query(...args) }));

const { getEngineCategories, searchEngineParts } = await import("./partSearchQueries");

beforeEach(() => {
  query.mockReset();
});

describe("getEngineCategories", () => {
  it("filters by engine with a bound parameter", async () => {
    query.mockResolvedValueOnce([
      { id: 1, title: "Brake Pad", category_1: "Brake &amp; Wheel Hub" },
    ]);
    const rows = await getEngineCategories(7057);

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/WHERE ec\.engine_id = \?/);
    expect(sql).not.toContain("7057");
    expect(params).toEqual([7057]);
    expect(rows).toEqual([{ id: 1, title: "Brake Pad", category_1: "Brake &amp; Wheel Hub" }]);
  });

  it("rejects invalid engine ids without querying", async () => {
    expect(await getEngineCategories(Number("7057; DROP TABLE part"))).toEqual([]);
    expect(await getEngineCategories(-1)).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});

describe("searchEngineParts", () => {
  it("queries parts by engine and category ids and stringifies ids like the old index", async () => {
    query.mockResolvedValueOnce([
      { id: 10762531, engine_id: 7057, category_2_id: 1, category_2: "Brake Pad" },
    ]);
    const hits = await searchEngineParts({ engineId: 7057, categoryIds: [1] });

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/FROM vw_parts vp\s+WHERE vp\.engine_id = \? AND vp\.category_2_id IN \(\?\)/);
    expect(params).toEqual([7057, [1], 200]);
    expect(hits).toEqual([
      { id: "10762531", engine_id: "7057", category_2_id: "1", category_2: "Brake Pad" },
    ]);
  });

  it("puts exact part-number matches first and de-duplicates", async () => {
    query.mockImplementation(async (sql: string) =>
      sql.includes("part_number IN")
        ? [{ id: 2, part_number: "AD0868" }]
        : [{ id: 1, part_number: "BC1058" }, { id: 2, part_number: "AD0868" }],
    );
    const hits = await searchEngineParts({
      engineId: 7057,
      categoryIds: [1],
      partNumbers: ["ad0868", "'; DROP TABLE part; --"],
    });

    const partNumberCall = query.mock.calls.find(([sql]) => sql.includes("part_number IN"));
    expect(partNumberCall?.[1]).toEqual([7057, ["AD0868"], 200]);
    expect(hits.map((hit) => hit.id)).toEqual(["2", "1"]);
  });

  it("queries exact part type titles", async () => {
    query.mockResolvedValueOnce([{ id: 5, category_2: "Oil Pan" }]);
    const hits = await searchEngineParts({ engineId: 7057, categoryIds: [], partTypes: ["Oil Pan", " "] });

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/WHERE vp\.engine_id = \? AND vp\.category_2 IN \(\?\)/);
    expect(params).toEqual([7057, ["Oil Pan"], 200]);
    expect(hits.map((hit) => hit.id)).toEqual(["5"]);
  });

  it("does nothing without categories or part numbers", async () => {
    expect(await searchEngineParts({ engineId: 7057, categoryIds: [] })).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
