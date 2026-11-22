import { describe, expect, it } from "vitest";

import { checkoutReturnPath } from "./checkoutLines";

describe("checkoutReturnPath", () => {
  it("keeps same-site paths", () => {
    expect(checkoutReturnPath("/parts/wagner/ZD1012A")).toBe("/parts/wagner/ZD1012A");
    expect(checkoutReturnPath("/?search=brake%20pad")).toBe("/?search=brake%20pad");
  });

  it("falls back to the home page for anything that could leave the site", () => {
    for (const path of [undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "cart", 42]) {
      expect(checkoutReturnPath(path)).toBe("/");
    }
  });
});
