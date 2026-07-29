import { describe, expect, it } from "vitest";
import {
  serializeMultiSelect,
  parseMultiSelect,
  formatDateTime,
  toDateTimeLocalValue,
} from "@/lib/utils";

describe("multi-select serialization", () => {
  it("round-trips a list of values through serialize and parse", () => {
    const values = ["Straight / Derechas", "Square / En Cuadro"];
    const serialized = serializeMultiSelect(values);
    expect(serialized).toBe("Straight / Derechas,Square / En Cuadro");
    expect(parseMultiSelect(serialized)).toEqual(values);
  });

  it("serializes an empty list to null", () => {
    expect(serializeMultiSelect([])).toBeNull();
  });

  it("drops blank entries when serializing", () => {
    expect(serializeMultiSelect(["A", "  ", "B"])).toBe("A,B");
  });

  it("parses null/undefined back to an empty array", () => {
    expect(parseMultiSelect(null)).toEqual([]);
    expect(parseMultiSelect(undefined)).toEqual([]);
    expect(parseMultiSelect("")).toEqual([]);
  });
});

describe("date formatting", () => {
  it("formats a null date as an em dash", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  it("formats a datetime-local input value back from a Date", () => {
    const date = new Date(2026, 6, 29, 14, 5); // 2026-07-29 14:05 local time
    expect(toDateTimeLocalValue(date)).toBe("2026-07-29T14:05");
  });

  it("returns an empty string for a missing date in toDateTimeLocalValue", () => {
    expect(toDateTimeLocalValue(null)).toBe("");
  });
});
