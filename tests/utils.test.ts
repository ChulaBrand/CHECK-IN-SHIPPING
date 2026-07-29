import { describe, expect, it } from "vitest";
import { serializeMultiSelect, formText } from "@/lib/utils";

describe("serializeMultiSelect", () => {
  it("joins values with a comma for a readable spreadsheet cell", () => {
    const values = ["Straight / Derechas", "Square / En Cuadro"];
    expect(serializeMultiSelect(values)).toBe(
      "Straight / Derechas, Square / En Cuadro"
    );
  });

  it("serializes an empty list to an empty string", () => {
    expect(serializeMultiSelect([])).toBe("");
  });

  it("drops blank entries", () => {
    expect(serializeMultiSelect(["A", "  ", "B"])).toBe("A, B");
  });
});

describe("formText", () => {
  it("reads a text field from FormData", () => {
    const formData = new FormData();
    formData.set("driverName", "Juan Pérez");
    expect(formText(formData, "driverName")).toBe("Juan Pérez");
  });

  it("returns an empty string for a missing field", () => {
    const formData = new FormData();
    expect(formText(formData, "missingField")).toBe("");
  });
});
