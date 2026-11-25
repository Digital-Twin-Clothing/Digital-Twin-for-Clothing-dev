// S2-HT-03: height conversion and limits (src/lib/height.ts)
import { describe, it, expect } from "vitest";
import { toCm, isValidHeightCm, formatHeight } from "@/lib/height";

describe("toCm", () => {
  it("accepts centimetres inside the allowed range, including both ends", () => {
    expect(toCm({ unit: "cm", cm: "175" })).toBe(175);
    expect(toCm({ unit: "cm", cm: "100" })).toBe(100);
    expect(toCm({ unit: "cm", cm: "250" })).toBe(250);
    expect(toCm({ unit: "cm", cm: "172.46" })).toBe(172.5);
  });

  it("rejects empty, non-numeric and out-of-range centimetres", () => {
    for (const cm of ["", "  ", "abc", "99.9", "250.1", "-170", "Infinity"]) {
      expect(toCm({ unit: "cm", cm })).toBeNull();
    }
  });

  it("converts feet and inches", () => {
    expect(toCm({ unit: "ftin", ft: "5", inch: "9" })).toBe(175.3);
    expect(toCm({ unit: "ftin", ft: "6", inch: "" })).toBe(182.9); // empty inches count as 0
  });

  it("rejects bad feet and inches", () => {
    expect(toCm({ unit: "ftin", ft: "", inch: "9" })).toBeNull();
    expect(toCm({ unit: "ftin", ft: "5", inch: "12" })).toBeNull();
    expect(toCm({ unit: "ftin", ft: "5", inch: "-1" })).toBeNull();
    expect(toCm({ unit: "ftin", ft: "2", inch: "0" })).toBeNull(); // 61 cm, below the minimum
    expect(toCm({ unit: "ftin", ft: "9", inch: "0" })).toBeNull(); // 274 cm, above the maximum
  });
});

describe("isValidHeightCm and formatHeight", () => {
  it("only accepts real numbers in range", () => {
    expect(isValidHeightCm(175)).toBe(true);
    expect(isValidHeightCm(NaN)).toBe(false);
    expect(isValidHeightCm("175")).toBe(false);
    expect(isValidHeightCm(undefined)).toBe(false);
  });

  it("shows both units", () => {
    expect(formatHeight(175.3)).toBe("175.3 cm (5′ 9″)");
    expect(formatHeight(180)).toBe("180 cm (5′ 11″)");
  });
});
