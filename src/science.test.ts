import { describe, expect, it } from "vitest";
import { DEFAULT_SCENARIO, lambertPhase, simulate } from "./science";

describe("physical and numerical invariants", () => {
  it("implements the Lambert phase limits", () => {
    expect(lambertPhase(0)).toBeCloseTo(1, 10);
    expect(lambertPhase(180)).toBeCloseTo(0, 10);
    expect(lambertPhase(90)).toBeCloseTo(1 / Math.PI, 8);
  });

  it("is deterministic for a declared seed", () => {
    expect(simulate(DEFAULT_SCENARIO)).toEqual(simulate(DEFAULT_SCENARIO));
  });

  it("recovers rotation in a high-information experiment", () => {
    const result = simulate({ ...DEFAULT_SCENARIO, baselineDays: 12, cadenceHours: 1, dutyCycle: 0.95, cloudFraction: 0.2, snr: 80, seed: 4 });
    expect(result.periodErrorFraction).toBeLessThan(0.1);
    expect(result.observations.length).toBeGreaterThan(100);
  });

  it("reports a sparse cloud-dominated case as fragile or worse", () => {
    const result = simulate({ ...DEFAULT_SCENARIO, baselineDays: 1.4, cadenceHours: 6, dutyCycle: 0.3, cloudFraction: 0.85, cloudCoherenceHours: 24, snr: 5, seed: 2 });
    expect(result.verdict).not.toBe("identifiable");
  });
});
