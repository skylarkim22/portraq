import { describe, it, expect } from "vitest";
import {
  CAGR_EXPLANATION,
  MDD_EXPLANATION,
} from "@/features/templates/templateStyles";

describe("CAGR_EXPLANATION", () => {
  it("CAGR 용어를 설명한다", () => {
    expect(CAGR_EXPLANATION).toContain("CAGR");
  });
});

describe("MDD_EXPLANATION", () => {
  it("MDD 용어를 설명한다", () => {
    expect(MDD_EXPLANATION).toContain("MDD");
  });
});
