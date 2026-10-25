import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => query(...args) }));

const { getMakesByYear, getModelsByYearMake, getEnginesByModel } = await import(
  "./vehicleQueries"
);

beforeEach(() => {
  query.mockReset();
});

describe("getMakesByYear", () => {
  it("filters by year with a bound parameter", async () => {
    query.mockResolvedValueOnce([{ make: "ACURA" }, { make: "CHRYSLER" }]);
    expect(await getMakesByYear("2011")).toEqual(["ACURA", "CHRYSLER"]);

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/FROM year WHERE title = \?/);
    expect(params).toEqual(["2011"]);
  });

  it("rejects anything that is not a four-digit year", async () => {
    expect(await getMakesByYear("2011' OR 1=1")).toEqual([]);
    expect(await getMakesByYear("")).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});

describe("getModelsByYearMake", () => {
  it("joins through the year row and decodes HTML entities", async () => {
    query.mockResolvedValueOnce([
      { id: 5776, title: "200" },
      { id: 5778, title: "TOWN &amp; COUNTRY" },
    ]);
    expect(await getModelsByYearMake("2011", "CHRYSLER")).toEqual([
      { id: 5776, title: "200" },
      { id: 5778, title: "TOWN & COUNTRY" },
    ]);

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/JOIN model m ON m\.year_id = y\.id/);
    expect(sql).not.toContain("CHRYSLER");
    expect(params).toEqual(["2011", "CHRYSLER"]);
  });

  it("does not query without a year and make", async () => {
    expect(await getModelsByYearMake("2011", "")).toEqual([]);
    expect(await getModelsByYearMake("", "CHRYSLER")).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});

describe("getEnginesByModel", () => {
  it("filters by model id", async () => {
    query.mockResolvedValueOnce([
      { id: 7057, title: "2.4L L4" },
      { id: 7058, title: "3.6L V6" },
    ]);
    expect(await getEnginesByModel(5776)).toEqual([
      { id: 7057, title: "2.4L L4" },
      { id: 7058, title: "3.6L V6" },
    ]);
    expect(query.mock.calls[0][1]).toEqual([5776]);
  });

  it("rejects invalid model ids without querying", async () => {
    expect(await getEnginesByModel(Number("abc"))).toEqual([]);
    expect(await getEnginesByModel(0)).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
