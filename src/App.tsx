import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PRESETS, simulate } from "./science";

type EpicObservation = {
  identifier: string; date: string; centroidLatitude: number; centroidLongitude: number;
  diskRgbPreview: [number, number, number]; diskPixelFraction: number; thumbnail: string;
  sourceUrl: string; sourceSha256: string;
};
type EpicManifest = {
  dataset: string; date: string; records: number; generatedAt: string; apiUrl: string;
  level1bArchive: string; credit: string; scientificWarning: string; observations: EpicObservation[];
};
const WIDTH = 900;
const HEIGHT = 260;
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const utcHours = (date: string) => Date.parse(`${date.replace(" ", "T")}Z`) / 3_600_000;

function unwrap(longitudes: number[]): number[] {
  const output = [longitudes[0]];
  for (let index = 1; index < longitudes.length; index += 1) {
    let value = longitudes[index];
    while (value - output[index - 1] > 180) value -= 360;
    while (value - output[index - 1] < -180) value += 360;
    output.push(value);
  }
  return output;
}

function regressionPeriod(records: EpicObservation[]): number {
  const x = records.map((record) => utcHours(record.date) - utcHours(records[0].date));
  const y = unwrap(records.map((record) => record.centroidLongitude));
  const xMean = x.reduce((a, b) => a + b, 0) / x.length;
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  const slope = x.reduce((sum, value, index) => sum + (value - xMean) * (y[index] - yMean), 0) /
    x.reduce((sum, value) => sum + (value - xMean) ** 2, 0);
  return 360 / Math.abs(slope);
}

function medianCadence(records: EpicObservation[]): number {
  const gaps = records.slice(1).map((record, index) => utcHours(record.date) - utcHours(records[index].date)).sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}

function chartPath(values: number[], minimum: number, maximum: number): string {
  return values.map((value, index) => {
    const x = 58 + index * (WIDTH - 92) / Math.max(1, values.length - 1);
    const y = 24 + (maximum - value) * (HEIGHT - 70) / Math.max(1e-8, maximum - minimum);
    return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function ObservationChart({ records }: { records: EpicObservation[] }) {
  const series = [
    { label: "R preview", index: 0, className: "red" },
    { label: "G preview", index: 1, className: "green" },
    { label: "B preview", index: 2, className: "blue" },
  ];
  const values = records.flatMap((record) => record.diskRgbPreview);
  const minimum = Math.min(...values) * 0.98;
  const maximum = Math.max(...values) * 1.02;
  return <figure className="observation-chart">
    <figcaption><div><span className="figure-index">FIGURE 01</span><h2>Whole-disk colour variability</h2></div><p>Display-derived diagnostic · not Level-1B radiance</p></figcaption>
    <div className="chart-legend">{series.map((item) => <span key={item.label}><i className={item.className} />{item.label}</span>)}</div>
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Disk-integrated red, green and blue preview values across thirteen DSCOVR EPIC observations.">
      <title>DSCOVR EPIC whole-disk preview colour time series</title>
      {[0, 1, 2, 3].map((row) => <line key={row} x1="58" x2={WIDTH - 34} y1={30 + row * 58} y2={30 + row * 58} className="gridline" />)}
      {series.map((item) => <path key={item.label} className={`data-line ${item.className}`} d={chartPath(records.map((record) => record.diskRgbPreview[item.index]), minimum, maximum)} />)}
      {records.map((record, index) => <text key={record.identifier} x={58 + index * (WIDTH - 92) / (records.length - 1)} y={HEIGHT - 14}>{record.date.slice(11, 16)}</text>)}
    </svg>
    <details><summary>View accessible observation table</summary><table><thead><tr><th>UTC</th><th>Red</th><th>Green</th><th>Blue</th><th>Centroid longitude</th></tr></thead><tbody>{records.map((record) => <tr key={record.identifier}><td>{record.date}</td>{record.diskRgbPreview.map((value, index) => <td key={index}>{value.toFixed(5)}</td>)}<td>{record.centroidLongitude.toFixed(2)}°</td></tr>)}</tbody></table></details>
  </figure>;
}

export function App() {
  const [manifest, setManifest] = useState<EpicManifest | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    fetch(asset("data/epic-2024-01-01.json"))
      .then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .then(setManifest).catch((reason: Error) => setError(reason.message));
  }, []);
  const active = manifest?.observations[activeIndex];
  const metrics = useMemo(() => manifest ? {
    cadence: medianCadence(manifest.observations), period: regressionPeriod(manifest.observations),
    longitude: Math.abs(unwrap(manifest.observations.map((record) => record.centroidLongitude)).at(-1)! - manifest.observations[0].centroidLongitude),
  } : null, [manifest]);
  const counterfactuals = useMemo(() => Object.entries(PRESETS).map(([name, scenario]) => ({ name, scenario, result: simulate(scenario) })), []);

  return <>
    <header className="mission-header"><a className="mission-mark" href="#archive"><span>BLUE MARBLE</span><b>NULL TEST</b></a><nav aria-label="Primary"><a href="#archive">Archive sequence</a><a href="#analysis">Analysis</a><a href="#provenance">Provenance</a><a href="https://github.com/Biswajit1999/exoearth-cadence-benchmark">Source</a></nav></header>
    <main>
      <section className="editorial-hero"><p className="issue">OBSERVATION NOTE 001 · 2024-01-01 · SUN–EARTH L1</p><h1>Earth,<br />reduced to a point.</h1><div className="hero-deck"><p>Thirteen real DSCOVR/EPIC frames. One terrestrial rotation. A provenance-first test of what survives when a living planet becomes an unresolved light curve.</p><a href="#archive">Enter the archive ↓</a></div></section>
      {error && <section className="load-error" role="alert"><h2>Archive bundle unavailable</h2><p>{error}. Run the documented NASA data builder to regenerate it.</p></section>}
      {!manifest && !error && <section className="loading" aria-live="polite">Reading checksummed NASA observation manifest…</section>}
      {manifest && active && metrics && <>
        <section id="archive" className="archive-stage"><div className="earth-stage"><AnimatePresence mode="wait"><motion.img key={active.identifier} src={asset(active.thumbnail)} alt={`NASA DSCOVR EPIC full-disk Earth at ${active.date} UTC`} initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /></AnimatePresence><div className="image-stamp"><span>NASA / DSCOVR / EPIC</span><span>{active.date} UTC</span></div></div><aside className="frame-record"><span className="frame-number">FRAME {String(activeIndex + 1).padStart(2, "0")} / {manifest.records}</span><h2>{active.date.slice(11, 16)}<small>UTC</small></h2><dl><div><dt>Sub-observer latitude</dt><dd>{active.centroidLatitude.toFixed(3)}°</dd></div><div><dt>Sub-observer longitude</dt><dd>{active.centroidLongitude.toFixed(3)}°</dd></div><div><dt>Disk pixel fraction</dt><dd>{(active.diskPixelFraction * 100).toFixed(2)}%</dd></div><div><dt>Source integrity</dt><dd><code>{active.sourceSha256.slice(0, 12)}</code></dd></div></dl><a href={active.sourceUrl}>Open original NASA JPEG ↗</a></aside></section>
        <section className="filmstrip" aria-label="Observation frames">{manifest.observations.map((record, index) => <button key={record.identifier} className={index === activeIndex ? "active" : ""} onClick={() => setActiveIndex(index)} aria-pressed={index === activeIndex}><img src={asset(record.thumbnail)} alt="" /><span>{record.date.slice(11, 16)}</span></button>)}</section>
        <section className="fact-band" aria-label="Dataset summary"><article><span>Frames</span><strong>{manifest.records}</strong><p>NASA observations with SHA-256 source hashes</p></article><article><span>Median cadence</span><strong>{metrics.cadence.toFixed(2)} h</strong><p>actual timestamp separation</p></article><article><span>Longitude swept</span><strong>{metrics.longitude.toFixed(1)}°</strong><p>unwrapped EPIC centroid metadata</p></article><article><span>Linear period</span><strong>{metrics.period.toFixed(2)} h</strong><p>from longitude versus UTC regression</p></article></section>
        <section id="analysis" className="analysis-layout"><ObservationChart records={manifest.observations} /><aside className="reading-note"><span>READING NOTE</span><h2>Clouds are the signal and the contaminant.</h2><p>The natural-colour frames reveal genuine evolving morphology. Their JPEG colours have been display-adjusted by NASA, so this graph is a pipeline audit—not calibrated photometry.</p><p>The publishable extension repeats disk integration on EPIC Level-1B radiances and injects HWO window functions into those measured time series.</p></aside></section>
        <section className="counterfactual-section"><header><span>COUNTERFACTUAL BENCHMARK</span><h2>Now damage the observation.</h2><p>The reduced model is retained as a controlled falsification layer, visually and methodologically separated from the archive data.</p></header><div className="scenario-ledger">{counterfactuals.map(({ name, scenario, result }, index) => <article key={name}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{name}</h3><p>{scenario.baselineDays} d · {scenario.cadenceHours} h cadence · {Math.round(scenario.cloudFraction * 100)}% cloud</p></div><strong className={result.verdict.replaceAll(" ", "-")}>{result.verdict}</strong><dl><div><dt>Recovered</dt><dd>{result.recoveredPeriodHours.toFixed(2)} h</dd></div><div><dt>Error</dt><dd>{(result.periodErrorFraction * 100).toFixed(1)}%</dd></div><div><dt>Alias</dt><dd>{result.aliasRatio.toFixed(2)}×</dd></div></dl></article>)}</div></section>
        <section id="provenance" className="provenance-section"><header><span>DATA LINEAGE</span><h2>Every pixel has a route home.</h2></header><ol><li><b>01</b><div><strong>NASA EPIC API</strong><p>{manifest.apiUrl}</p></div></li><li><b>02</b><div><strong>Source JPEG + SHA-256</strong><p>Original bytes hashed before local derivation.</p></div></li><li><b>03</b><div><strong>Disk mask + preview RGB</strong><p>Deterministic builder in <code>scripts/build_epic_day.py</code>.</p></div></li><li><b>04</b><div><strong>Science upgrade path</strong><p><a href={manifest.level1bArchive}>EPIC Level-1B radiance archive ↗</a></p></div></li></ol><div className="warning-box"><strong>Validity boundary</strong><p>{manifest.scientificWarning} NASA imagery credit: {manifest.credit}. No biosignature, ocean, vegetation, or habitability claim is made from this bundle.</p></div></section>
      </>}
    </main>
    <footer><span>DATASET BUILD: {manifest ? new Date(manifest.generatedAt).toISOString().slice(0, 10) : "—"}</span><span>OPEN METHODS · CHECKSUMMED INPUTS · FALSIFIABLE OUTPUTS</span></footer>
  </>;
}
