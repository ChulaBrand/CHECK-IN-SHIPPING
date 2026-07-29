import { describe, expect, it } from "vitest";
import { fieldSchemas } from "@/lib/validation";
import { emptyAnswers, getActiveSteps } from "@/lib/wizardSteps";

describe("fieldSchemas", () => {
  it("rejects empty required text fields", () => {
    expect(fieldSchemas.firstName.safeParse("").success).toBe(false);
    expect(fieldSchemas.phoneNumber.safeParse("   ").success).toBe(false);
  });

  it("accepts filled-in required text fields", () => {
    expect(fieldSchemas.firstName.safeParse("Juan").success).toBe(true);
  });

  it("rejects a loadingType value outside the allowed options", () => {
    expect(fieldSchemas.loadingType.safeParse("Sideways").success).toBe(false);
  });

  it("accepts a valid loadingType option", () => {
    expect(
      fieldSchemas.loadingType.safeParse("Loading / Cargar").success
    ).toBe(true);
  });

  it("requires at least one loadAccommodation option", () => {
    expect(fieldSchemas.loadAccommodation.safeParse([]).success).toBe(false);
    expect(
      fieldSchemas.loadAccommodation.safeParse(["Straight / Derechas"])
        .success
    ).toBe(true);
  });
});

describe("getActiveSteps branching", () => {
  it("defaults to the Loading branch before loadingType is answered", () => {
    const ids = getActiveSteps(emptyAnswers).map((s) => s.id);
    expect(ids).toEqual([
      "name",
      "phone",
      "truck",
      "loadingType",
      "trailerPlates",
      "driversLicense",
      "spNumberOrder2",
      "loadAccommodation",
    ]);
  });

  it("follows the Loading branch: plates, license, order #, accommodation", () => {
    const ids = getActiveSteps({
      ...emptyAnswers,
      loadingType: "Loading / Cargar",
    }).map((s) => s.id);
    expect(ids.slice(4)).toEqual([
      "trailerPlates",
      "driversLicense",
      "spNumberOrder2",
      "loadAccommodation",
    ]);
  });

  it("follows the Unloading branch: unit number, produce type", () => {
    const ids = getActiveSteps({
      ...emptyAnswers,
      loadingType: "Unloading / Descargar",
    }).map((s) => s.id);
    expect(ids.slice(4)).toEqual(["unitNumber", "produceType"]);
  });

  it("inserts the produceTypeOther step only when produceType is Otro", () => {
    const withoutOtro = getActiveSteps({
      ...emptyAnswers,
      loadingType: "Unloading / Descargar",
      produceType: "Aguacates",
    }).map((s) => s.id);
    expect(withoutOtro).not.toContain("produceTypeOther");

    const withOtro = getActiveSteps({
      ...emptyAnswers,
      loadingType: "Unloading / Descargar",
      produceType: "Otro",
    }).map((s) => s.id);
    expect(withOtro).toContain("produceTypeOther");
  });
});
