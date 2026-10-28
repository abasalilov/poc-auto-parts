import { describe, expect, it } from "vitest";

import { bodyTypeForModel } from "./vehicleBodyType";

describe("bodyTypeForModel", () => {
  it.each([
    ["F-150", "pickup"],
    ["Silverado 1500", "pickup"],
    ["1500", "pickup"],
    ["4RUNNER", "suv"],
    ["Grand Cherokee", "suv"],
    ["CR-V", "suv"],
    ["ODYSSEY", "minivan"],
    ["TRANSIT CONNECT", "minivan"],
    ["TRANSIT", "van"],
    ["E-350", "van"],
    ["MUSTANG", "coupe"],
    ["FIT", "hatchback"],
    ["C5500 KODIAK", "pickup"],
    ["HIACE", "van"],
    ["RX-8", "coupe"],
    ["POLICE INTERCEPTOR UTILITY", "suv"],
    ["UP!", "hatchback"],
    ["ACCORD", "sedan"],
    ["", "sedan"],
  ])("%s is a %s", (model, type) => {
    expect(bodyTypeForModel(model)).toBe(type);
  });

  it("matches whole words only", () => {
    expect(bodyTypeForModel("FITNESS")).toBe("sedan");
    expect(bodyTypeForModel("MXL")).toBe("sedan");
  });
});
