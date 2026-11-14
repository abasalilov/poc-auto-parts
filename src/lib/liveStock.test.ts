import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchLiveStock, findSoldOutParts, parseLiveStock } from "./liveStock";

const respond = (instock: unknown) =>
  Promise.resolve(new Response(JSON.stringify({ responseDetail: { instock } })));

describe("live stock", () => {
  beforeEach(() => {
    vi.stubEnv("PA_ENDPOINT", "https://pa.example.com/api");
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends the request as one JSON reqData parameter", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => respond("3"));
    expect(await fetchLiveStock("BS", "BC1058")).toBe(3);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(JSON.parse(url.searchParams.get("reqData") ?? "{}")).toMatchObject({
      line_code: "BS",
      part_number: "BC1058",
      action: "checkStock",
    });
  });

  it("returns null when not configured, erroring or unparseable", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => respond("n/a"));
    expect(await fetchLiveStock("BS", "BC1058")).toBeNull();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.reject(new Error("timeout")));
    expect(await fetchLiveStock("BS", "BC1058")).toBeNull();
    vi.stubEnv("PA_ENDPOINT", "");
    expect(await fetchLiveStock("BS", "BC1058")).toBeNull();
  });

  it("blocks only parts that definitely can't cover the quantity", async () => {
    const stock: Record<string, Promise<Response>> = {
      A: respond("0"),
      B: respond("1"),
      C: respond("5"),
    };
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const reqData = JSON.parse(new URL(String(input)).searchParams.get("reqData") ?? "{}");
      return stock[reqData.part_number] ?? Promise.reject(new Error("down"));
    });
    const parts = ["A", "B", "C", "D"].map((partNumber) => ({
      lineCode: "BS",
      partNumber,
      quantity: 2,
    }));
    expect(await findSoldOutParts(parts)).toEqual(["A", "B"]);
  });

  it("reads stock by warehouse, skipping totals and empty buckets", () => {
    expect(
      parseLiveStock({
        instock: "000000029",
        castock: "000000004",
        frstock: "000000004",
        gastock: "000000001",
        nystock: "000000000",
        alstock: 0,
        venstock: "000000019",
        price: "12.50",
      }),
    ).toEqual({ total: 29, warehouses: { frstock: 4, gastock: 1, venstock: 19 } });
    expect(parseLiveStock({ instock: "n/a" })).toBeNull();
    expect(parseLiveStock(undefined)).toBeNull();
  });
});
