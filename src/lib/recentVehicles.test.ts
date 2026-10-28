import { describe, expect, it } from "vitest";

import {
  addRecentVehicle,
  mergeVehicleChoices,
  snapshotFromSavedVehicle,
} from "./recentVehicles";
import type { VehicleSnapshot } from "./vehicleLocalStorage";

const vehicle = (engine: string, model = "F-150"): VehicleSnapshot => ({
  year: "2011",
  make: "FORD",
  model,
  modelName: model,
  engine,
  engineTitle: "3.5L V6",
  modelFirestoreId: "",
});

describe("addRecentVehicle", () => {
  it("moves a repeat to the front and caps the list", () => {
    const list = [vehicle("1"), vehicle("2"), vehicle("3")];
    const next = addRecentVehicle(list, vehicle("2"), 2);
    expect(next.map((v) => v.engine)).toEqual(["2", "1"]);
  });
});

describe("mergeVehicleChoices", () => {
  it("puts saved first, dedupes, and skips the current vehicle", () => {
    const choices = mergeVehicleChoices(
      [vehicle("1"), vehicle("2")],
      [vehicle("2"), vehicle("3"), vehicle("4")],
      vehicle("1"),
    );
    expect(choices.map((v) => v.engine)).toEqual(["2", "3", "4"]);
  });

  it("drops entries without an engine", () => {
    expect(mergeVehicleChoices([{ ...vehicle("1"), engine: null }], [], null)).toEqual([]);
  });
});

describe("snapshotFromSavedVehicle", () => {
  it("maps a Firestore vehicle with a resolved engine", () => {
    expect(
      snapshotFromSavedVehicle({
        year: { label: "2016", title: "2016" },
        make: "HONDA",
        model: "ACCORD",
        engine: { id: 28400, title: "2.4L L4" },
      }),
    ).toEqual({
      year: "2016",
      make: "HONDA",
      model: "ACCORD",
      modelName: "ACCORD",
      engine: "28400",
      engineTitle: "2.4L L4",
      modelFirestoreId: "",
    });
  });

  it("returns null when the engine is missing", () => {
    expect(snapshotFromSavedVehicle({ make: "HONDA", engine: undefined })).toBeNull();
  });
});
