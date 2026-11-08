import { describe, expect, it, vi } from "vitest";

import engine138 from "./__fixtures__/engine138Categories.json";
import engine7057 from "./__fixtures__/engine7057Categories.json";
import { createEngineCategoryStore } from "./engineCategoryStore";

const fixtures: Record<number, typeof engine7057> = { 7057: engine7057, 138: engine138 };

const createStore = () => {
  const fetchCategories = vi.fn(async (engineId: number) => fixtures[engineId] ?? []);
  return { fetchCategories, store: createEngineCategoryStore(fetchCategories) };
};

const titlesOnlyIn = (a: typeof engine7057, b: typeof engine7057) => {
  const other = new Set(b.map((row) => row.title));
  return a.filter((row) => !other.has(row.title)).map((row) => row.title);
};

describe("engine category store", () => {
  it("fetches each engine's categories once", async () => {
    const { fetchCategories, store } = createStore();
    const first = await store.load("7057");
    const second = await store.load("7057");
    expect(second).toBe(first);
    expect(fetchCategories).toHaveBeenCalledTimes(1);
    expect(fetchCategories).toHaveBeenCalledWith(7057);
  });

  it("only searches the selected engine's categories", async () => {
    const { store } = createStore();
    const only7057 = titlesOnlyIn(engine7057, engine138)[0];
    expect(only7057).toBeTruthy();

    const searcher7057 = await store.load("7057");
    const searcher138 = await store.load("138");
    expect(searcher7057.resolve(only7057)?.title).toBe(only7057);
    expect(searcher138.search(only7057).map((c) => c.title)).not.toContain(only7057);
  });

  it("replaces the category set when switching engines, with nothing stale", async () => {
    const { fetchCategories, store } = createStore();
    await store.load("7057");
    const searcher138 = await store.load("138");
    const engine138Titles = new Set(engine138.map((row) => row.title.replaceAll("&amp;", "&")));

    expect(fetchCategories).toHaveBeenLastCalledWith(138);
    expect(searcher138.categories.every((c) => engine138Titles.has(c.title))).toBe(true);
    expect(searcher138.resolve("brake pad")?.id).toBe(1);
  });

  it("retries after a failed load", async () => {
    const fetchCategories = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(engine7057);
    const store = createEngineCategoryStore(fetchCategories);
    await expect(store.load("7057")).rejects.toThrow("offline");
    await expect(store.load("7057")).resolves.toBeTruthy();
    expect(fetchCategories).toHaveBeenCalledTimes(2);
  });
});
