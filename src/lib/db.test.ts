import { beforeEach, describe, expect, it, vi } from "vitest";

const poolQuery = vi.fn();

vi.mock("mysql2/promise", () => ({
  default: { createPool: () => ({ query: poolQuery, on: vi.fn() }) },
}));

const { query } = await import("./db");

const tooMany = Object.assign(new Error("Too many connections"), { code: "ER_CON_COUNT_ERROR" });

describe("query", () => {
  beforeEach(() => {
    poolQuery.mockReset();
  });

  it("retries when MySQL is out of connections", async () => {
    poolQuery.mockRejectedValueOnce(tooMany).mockResolvedValueOnce([[{ id: 1 }]]);
    await expect(query("SELECT 1")).resolves.toEqual([{ id: 1 }]);
    expect(poolQuery).toHaveBeenCalledTimes(2);
  });

  it("gives up after a few tries", async () => {
    poolQuery.mockRejectedValue(tooMany);
    await expect(query("SELECT 1")).rejects.toBe(tooMany);
    expect(poolQuery).toHaveBeenCalledTimes(4);
  }, 10000);

  it("doesn't retry other errors", async () => {
    const syntax = Object.assign(new Error("bad sql"), { code: "ER_PARSE_ERROR" });
    poolQuery.mockRejectedValueOnce(syntax);
    await expect(query("SELEC 1")).rejects.toBe(syntax);
    expect(poolQuery).toHaveBeenCalledTimes(1);
  });
});
