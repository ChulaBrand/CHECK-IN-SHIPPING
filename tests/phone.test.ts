import { describe, expect, it } from "vitest";
import { extractPhoneDigits, formatPhoneMask } from "@/lib/phone";

describe("extractPhoneDigits", () => {
  it("keeps only digits", () => {
    expect(extractPhoneDigits("(656) 123-4567")).toBe("6561234567");
  });

  it("caps at 10 digits", () => {
    expect(extractPhoneDigits("123456789012345")).toBe("1234567890");
  });

  it("returns empty string for no digits", () => {
    expect(extractPhoneDigits("___")).toBe("");
  });
});

describe("formatPhoneMask", () => {
  it("shows all placeholders when empty", () => {
    expect(formatPhoneMask("")).toBe("(___) ___-____");
  });

  it("fills in digits as they're typed, left to right", () => {
    expect(formatPhoneMask("6")).toBe("(6__) ___-____");
    expect(formatPhoneMask("656")).toBe("(656) ___-____");
    expect(formatPhoneMask("6561234")).toBe("(656) 123-4___");
  });

  it("shows the full number with no placeholders once complete", () => {
    expect(formatPhoneMask("6561234567")).toBe("(656) 123-4567");
  });

  it("ignores non-digit characters and extra digits past 10", () => {
    expect(formatPhoneMask("656-123-456789")).toBe("(656) 123-4567");
  });
});
