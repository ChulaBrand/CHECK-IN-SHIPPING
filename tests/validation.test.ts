import { describe, expect, it } from "vitest";
import { buildFieldSchemas } from "@/lib/validation";
import { emptyAnswers, getActiveSteps } from "@/lib/wizardSteps";

const fieldSchemas = buildFieldSchemas("en");

describe("buildFieldSchemas", () => {
  it("translates error messages per locale", () => {
    const en = buildFieldSchemas("en").phoneNumber.safeParse("123");
    const es = buildFieldSchemas("es").phoneNumber.safeParse("123");
    expect(en.success).toBe(false);
    expect(es.success).toBe(false);
    if (!en.success && !es.success) {
      expect(en.error.issues[0]?.message).toMatch(/digits/i);
      expect(es.error.issues[0]?.message).toMatch(/dígitos/i);
    }
  });
});

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

  it("requires at least one produceTypes option", () => {
    expect(fieldSchemas.produceTypes.safeParse([]).success).toBe(false);
    expect(fieldSchemas.produceTypes.safeParse(["Papaya"]).success).toBe(
      true
    );
    expect(
      fieldSchemas.produceTypes.safeParse(["Papaya", "Otro"]).success
    ).toBe(true);
  });

  describe("phoneNumber", () => {
    it("rejects fewer than 10 digits", () => {
      expect(fieldSchemas.phoneNumber.safeParse("123456789").success).toBe(
        false
      );
    });

    it("rejects more than 10 digits", () => {
      expect(fieldSchemas.phoneNumber.safeParse("12345678901").success).toBe(
        false
      );
    });

    it("accepts exactly 10 digits, formatted or not", () => {
      expect(fieldSchemas.phoneNumber.safeParse("1234567890").success).toBe(
        true
      );
      expect(
        fieldSchemas.phoneNumber.safeParse("(123) 456-7890").success
      ).toBe(true);
    });
  });

  describe("spNumberOrder2", () => {
    it("accepts a single 6-digit number", () => {
      expect(fieldSchemas.spNumberOrder2.safeParse("123456").success).toBe(
        true
      );
    });

    it("accepts several 6-digit numbers separated by space, /, - or _", () => {
      expect(
        fieldSchemas.spNumberOrder2.safeParse("123456/234567").success
      ).toBe(true);
      expect(
        fieldSchemas.spNumberOrder2.safeParse("123456 234567 345678")
          .success
      ).toBe(true);
      expect(
        fieldSchemas.spNumberOrder2.safeParse("123456-234567_345678")
          .success
      ).toBe(true);
    });

    it("rejects numbers that aren't exactly 6 digits", () => {
      expect(fieldSchemas.spNumberOrder2.safeParse("12345").success).toBe(
        false
      );
      expect(fieldSchemas.spNumberOrder2.safeParse("1234567").success).toBe(
        false
      );
      expect(
        fieldSchemas.spNumberOrder2.safeParse("123456/23456").success
      ).toBe(false);
    });

    it("rejects letters", () => {
      expect(fieldSchemas.spNumberOrder2.safeParse("ABCDEF").success).toBe(
        false
      );
    });
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

  it("follows the Unloading branch: unit number, produce types", () => {
    const ids = getActiveSteps({
      ...emptyAnswers,
      loadingType: "Unloading / Descargar",
    }).map((s) => s.id);
    expect(ids.slice(4)).toEqual(["unitNumber", "produceTypes"]);
  });

  it("inserts the produceTypeOther step only when Otro is checked", () => {
    const withoutOtro = getActiveSteps({
      ...emptyAnswers,
      loadingType: "Unloading / Descargar",
      produceTypes: ["Aguacates"],
    }).map((s) => s.id);
    expect(withoutOtro).not.toContain("produceTypeOther");

    const withOtro = getActiveSteps({
      ...emptyAnswers,
      loadingType: "Unloading / Descargar",
      produceTypes: ["Aguacates", "Otro"],
    }).map((s) => s.id);
    expect(withOtro).toContain("produceTypeOther");
  });
});
