export type Scenario = {
  rotationHours: number;
  baselineDays: number;
  cadenceHours: number;
  dutyCycle: number;
  phaseDegrees: number;
  cloudFraction: number;
  cloudCoherenceHours: number;
  snr: number;
  oceanFraction: number;
  glintStrength: number;
  redEdgeStrength: number;
  seed: number;
};

export type Observation = {
  timeHours: number;
  blue: number;
  red: number;
  nir: number;
  cloud: number;
  longitude: number;
};

export type PeriodPoint = { periodHours: number; power: number };

export type BenchmarkResult = {
  observations: Observation[];
  periodogram: PeriodPoint[];
  recoveredPeriodHours: number;
  periodErrorFraction: number;
  aliasRatio: number;
  rotationsCovered: number;
  colorSeparability: number;
  glintContrast: number;
  verdict: "identifiable" | "fragile" | "not identifiable";
  reasons: string[];
};

export const DEFAULT_SCENARIO: Scenario = {
  rotationHours: 23.934,
  baselineDays: 7,
  cadenceHours: 2,
  dutyCycle: 0.72,
  phaseDegrees: 90,
  cloudFraction: 0.55,
  cloudCoherenceHours: 18,
  snr: 18,
  oceanFraction: 0.7,
  glintStrength: 0.24,
  redEdgeStrength: 0.07,
  seed: 42,
};

export const PRESETS: Record<string, Scenario> = {
  "Earth / balanced": DEFAULT_SCENARIO,
  "Sparse HWO visit": { ...DEFAULT_SCENARIO, baselineDays: 2.4, cadenceHours: 4, dutyCycle: 0.48, snr: 10, seed: 8 },
  "Cloud alias trap": { ...DEFAULT_SCENARIO, cloudFraction: 0.78, cloudCoherenceHours: 25, snr: 14, seed: 21 },
  "Crescent glint": { ...DEFAULT_SCENARIO, phaseDegrees: 130, baselineDays: 5, glintStrength: 0.5, seed: 12 },
};

const TAU = Math.PI * 2;

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number): number {
  const u = Math.max(random(), 1e-12);
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

export function lambertPhase(phaseDegrees: number): number {
  const alpha = Math.min(180, Math.max(0, phaseDegrees)) * Math.PI / 180;
  return (Math.sin(alpha) + (Math.PI - alpha) * Math.cos(alpha)) / Math.PI;
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function standardDeviation(values: number[]): number {
  const center = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - center) ** 2)));
}

function leastSquaresPower(times: number[], values: number[], period: number): number {
  const centered = values.map((value) => value - mean(values));
  const variance = centered.reduce((sum, value) => sum + value * value, 0);
  if (variance <= 0) return 0;
  const omega = TAU / period;
  let ss = 0, cc = 0, sc = 0, sy = 0, cy = 0;
  for (let i = 0; i < times.length; i += 1) {
    const s = Math.sin(omega * times[i]);
    const c = Math.cos(omega * times[i]);
    ss += s * s; cc += c * c; sc += s * c;
    sy += s * centered[i]; cy += c * centered[i];
  }
  const determinant = ss * cc - sc * sc;
  if (Math.abs(determinant) < 1e-12) return 0;
  const a = (sy * cc - cy * sc) / determinant;
  const b = (cy * ss - sy * sc) / determinant;
  let fitted = 0;
  for (let i = 0; i < times.length; i += 1) {
    const model = a * Math.sin(omega * times[i]) + b * Math.cos(omega * times[i]);
    fitted += model * model;
  }
  return Math.max(0, Math.min(1, fitted / variance));
}

export function scanPeriods(observations: Observation[], minimum = 6, maximum = 48, steps = 420): PeriodPoint[] {
  const times = observations.map((point) => point.timeHours);
  const color = observations.map((point) => point.nir - point.blue);
  return Array.from({ length: steps }, (_, index) => {
    const periodHours = minimum + (maximum - minimum) * index / (steps - 1);
    return { periodHours, power: leastSquaresPower(times, color, periodHours) };
  });
}

export function simulate(scenario: Scenario): BenchmarkResult {
  const random = mulberry32(scenario.seed);
  const phase = lambertPhase(scenario.phaseDegrees);
  const observations: Observation[] = [];
  const totalHours = scenario.baselineDays * 24;
  const rho = Math.exp(-scenario.cadenceHours / Math.max(scenario.cloudCoherenceHours, 0.1));
  let cloudState = 0;

  for (let time = 0; time <= totalHours + 1e-9; time += scenario.cadenceHours) {
    const visitWindow = 0.5 + 0.5 * Math.sin(TAU * time / 24 + 0.8);
    if (random() > scenario.dutyCycle * (0.55 + 0.45 * visitWindow)) continue;
    cloudState = rho * cloudState + Math.sqrt(Math.max(0, 1 - rho * rho)) * gaussian(random);
    const cloud = Math.min(0.98, Math.max(0.02, scenario.cloudFraction + 0.16 * cloudState));
    const longitude = (360 * time / scenario.rotationHours) % 360;
    const theta = longitude * Math.PI / 180;
    const landPattern = 0.5 + 0.28 * Math.sin(theta - 0.4) + 0.15 * Math.sin(2 * theta + 1.2) + 0.07 * Math.cos(3 * theta);
    const landVisible = Math.min(1, Math.max(0, (1 - scenario.oceanFraction) * 0.55 + landPattern * 0.48));
    const clear = 1 - cloud;
    const crescent = Math.max(0, (scenario.phaseDegrees - 70) / 110);
    const oceanFacing = Math.max(0, Math.cos(theta + 0.7));
    const glint = scenario.glintStrength * crescent ** 1.4 * oceanFacing ** 5 * scenario.oceanFraction * clear;
    const blueTruth = phase * (0.14 + 0.23 * cloud + 0.035 * clear * (1 - landVisible)) + glint * 0.65;
    const redTruth = phase * (0.12 + 0.21 * cloud + 0.095 * clear * landVisible) + glint * 0.82;
    const nirTruth = phase * (0.11 + 0.2 * cloud + (0.11 + scenario.redEdgeStrength) * clear * landVisible) + glint;
    const noiseScale = Math.max(blueTruth, redTruth, nirTruth) / Math.max(scenario.snr, 0.5);
    observations.push({
      timeHours: time,
      blue: Math.max(0, blueTruth + gaussian(random) * noiseScale),
      red: Math.max(0, redTruth + gaussian(random) * noiseScale),
      nir: Math.max(0, nirTruth + gaussian(random) * noiseScale),
      cloud,
      longitude,
    });
  }

  const periodogram = scanPeriods(observations);
  const ranked = [...periodogram].sort((a, b) => b.power - a.power);
  const best = ranked[0] ?? { periodHours: NaN, power: 0 };
  const independentSecond = ranked.find((point) => Math.abs(point.periodHours - best.periodHours) > 1.5) ?? ranked[1] ?? best;
  const aliasRatio = best.power / Math.max(independentSecond.power, 1e-9);
  const periodErrorFraction = Math.abs(best.periodHours - scenario.rotationHours) / scenario.rotationHours;
  const rotationsCovered = totalHours / scenario.rotationHours;
  const colors = observations.map((point) => point.nir - point.blue);
  const colorSeparability = standardDeviation(colors) / Math.max(mean(observations.map((point) => (point.blue + point.red + point.nir) / 3)) / scenario.snr, 1e-9);
  const crescentFactor = Math.max(0, (scenario.phaseDegrees - 70) / 110) ** 1.4;
  const glintContrast = scenario.glintStrength * scenario.oceanFraction * crescentFactor * (1 - scenario.cloudFraction) * scenario.snr;
  const reasons: string[] = [];
  if (observations.length < 18) reasons.push("Too few retained epochs for a stable period search.");
  if (rotationsCovered < 2) reasons.push("The baseline covers fewer than two rotations.");
  if (periodErrorFraction >= 0.1) reasons.push("The strongest recovered period misses the injected rotation by at least 10%.");
  if (aliasRatio < 1.15) reasons.push("A competing cadence/cloud alias has nearly equal power.");
  if (scenario.cloudCoherenceHours / scenario.rotationHours > 0.7 && scenario.cloudFraction > 0.65) reasons.push("Cloud evolution occurs on a rotation-like timescale.");
  let verdict: BenchmarkResult["verdict"] = "identifiable";
  if (reasons.length >= 2 || observations.length < 10) verdict = "not identifiable";
  else if (reasons.length === 1 || colorSeparability < 2.5) verdict = "fragile";
  return { observations, periodogram, recoveredPeriodHours: best.periodHours, periodErrorFraction, aliasRatio, rotationsCovered, colorSeparability, glintContrast, verdict, reasons };
}

export function toCsv(result: BenchmarkResult): string {
  const rows = ["time_hours,blue_flux,red_flux,nir_flux,cloud_fraction,subobserver_longitude_deg"];
  for (const point of result.observations) {
    rows.push([point.timeHours, point.blue, point.red, point.nir, point.cloud, point.longitude].map((value) => value.toFixed(6)).join(","));
  }
  return rows.join("\n");
}
