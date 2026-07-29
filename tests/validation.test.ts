import { describe, expect, it } from "vitest";
import { checkInCreateSchema } from "@/lib/validation";

const validCreatePayload = {
  driverName: "Juan Pérez",
  truckOrCompanyName: "Transportes Rustam",
  trailerPlates: "4SJ8919",
  driversLicense: "MX-8827311",
  phoneNumber: "656 123 4567",
  loadingType: "Loading / Cargar",
  unitNumber: "27",
  produceType: "Aguacates",
  produceTypeOther: "",
  loadAccommodation: ["Straight / Derechas"],
  spNumberOrder: "",
  spNumberOrder2: "",
};

describe("checkInCreateSchema", () => {
  it("accepts a fully valid check-in payload", () => {
    const result = checkInCreateSchema.safeParse(validCreatePayload);
    expect(result.success).toBe(true);
  });

  it("rejects an empty payload with missing required fields", () => {
    const result = checkInCreateSchema.safeParse({
      driverName: "",
      truckOrCompanyName: "",
      trailerPlates: "",
      driversLicense: "",
      phoneNumber: "",
      loadingType: "",
      unitNumber: "",
      produceType: "",
      produceTypeOther: "",
      loadAccommodation: [],
      spNumberOrder: "",
      spNumberOrder2: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.driverName?.length).toBeGreaterThan(0);
      expect(fieldErrors.loadingType?.length).toBeGreaterThan(0);
      expect(fieldErrors.produceType?.length).toBeGreaterThan(0);
    }
  });

  it("rejects a loadingType value outside the allowed options", () => {
    const result = checkInCreateSchema.safeParse({
      ...validCreatePayload,
      loadingType: "Sideways",
    });
    expect(result.success).toBe(false);
  });

  it("requires produceTypeOther when produceType is Otro", () => {
    const result = checkInCreateSchema.safeParse({
      ...validCreatePayload,
      produceType: "Otro",
      produceTypeOther: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.produceTypeOther?.length).toBeGreaterThan(0);
    }
  });

  it("accepts Otro when produceTypeOther is filled in", () => {
    const result = checkInCreateSchema.safeParse({
      ...validCreatePayload,
      produceType: "Otro",
      produceTypeOther: "Mangos",
    });
    expect(result.success).toBe(true);
  });
});
