import { describe, expect, it } from "vitest";
import manifest from "../public/data/epic-2024-01-01.json";

describe("bundled NASA EPIC archive", () => {
  it("contains ordered observations with complete provenance", () => {
    expect(manifest.records).toBe(13);
    expect(manifest.observations).toHaveLength(manifest.records);

    const timestamps = manifest.observations.map((observation) =>
      Date.parse(`${observation.date.replace(" ", "T")}Z`),
    );
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));

    for (const observation of manifest.observations) {
      expect(observation.sourceUrl).toMatch(/^https:\/\/epic\.gsfc\.nasa\.gov\/archive\/natural\//);
      expect(observation.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(observation.diskRgbPreview).toHaveLength(3);
      expect(observation.diskPixelFraction).toBeGreaterThan(0);
    }
  });

  it("marks display RGB as non-radiometric", () => {
    expect(manifest.scientificWarning).toContain("not calibrated Level-1B radiance");
    expect(manifest.level1bArchive).toContain("DSCOVR_EPIC_L1B_3");
  });
});
