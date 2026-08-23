import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DEFAULT_SCENARIO, PRESETS, simulate, toCsv, type Scenario } from "./science";

const WIDTH = 760;
const HEIGHT = 250;

function pathFor(values: number[], minimum: number, maximum: number): string {
  const span = Math.max(maximum - minimum, 1e-9);
  return values.map((value, index) => {
    const x = 42 + index * (WIDTH - 64) / Math.max(values.length - 1, 1);
    const y = 18 + (maximum - value) * (HEIGHT - 48) / span;
    return `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function LightCurveChart({ result }: { result: ReturnType<typeof simulate> }) {
  const all = result.observations.flatMap((point) => [point.blue, point.red, point.nir]);
  const minimum = Math.min(...all, 0);
  const maximum = Math.max(...all, 1e-5);
  const series = [
    { label: "Blue 450 nm", key: "blue" as const, className: "line-blue" },
    { label: "Red 650 nm", key: "red" as const, className: "line-red" },
    { label: "NIR 850 nm", key: "nir" as const, className: "line-nir" },
  ];
  return <figure className="chart-card">
    <figcaption><span>Disk-integrated light curve</span><small>relative reflected flux · retained epochs</small></figcaption>
    <div className="legend">{series.map((item) => <span key={item.key}><i className={item.className} />{item.label}</span>)}</div>
    <svg className="chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Three-band light curve containing ${result.observations.length} epochs.`}>
      <title>Three-band simulated reflected-light time series</title>
      {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="42" x2={WIDTH - 22} y1={18 + line * 50} y2={18 + line * 50} className="grid-line" />)}
      {series.map((item) => <path key={item.key} d={pathFor(result.observations.map((point) => point[item.key]), minimum, maximum)} className={`series ${item.className}`} />)}
    </svg>
    <details><summary>Accessible data summary</summary><p>The simulation retained {result.observations.length} epochs. The strongest color-period peak is {result.recoveredPeriodHours.toFixed(2)} hours, compared with the injected {result.observations.length ? "rotation" : "unknown input"}.</p></details>
  </figure>;
}

function PeriodChart({ result, injected }: { result: ReturnType<typeof simulate>; injected: number }) {
  const maximum = Math.max(...result.periodogram.map((point) => point.power), 1e-5);
  const injectedX = 42 + (injected - 6) * (WIDTH - 64) / 42;
  return <figure className="chart-card">
    <figcaption><span>Injection–recovery periodogram</span><small>sinusoidal least-squares power · 6–48 h</small></figcaption>
    <div className="legend"><span><i className="line-power" />Color modulation</span><span><i className="line-truth" />Injected truth</span></div>
    <svg className="chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Periodogram peaks at ${result.recoveredPeriodHours.toFixed(2)} hours; injected period is ${injected.toFixed(2)} hours.`}>
      <title>Period recovery compared with injected rotation</title>
      {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="42" x2={WIDTH - 22} y1={18 + line * 50} y2={18 + line * 50} className="grid-line" />)}
      <path d={pathFor(result.periodogram.map((point) => point.power), 0, maximum)} className="series line-power" />
      <line x1={injectedX} x2={injectedX} y1="18" y2={HEIGHT - 30} className="truth-marker" />
      <text x="42" y={HEIGHT - 8}>6 h</text><text x={WIDTH - 48} y={HEIGHT - 8}>48 h</text>
    </svg>
  </figure>;
}

type RangeProps = { label: string; value: number; minimum: number; maximum: number; step: number; unit?: string; onChange: (value: number) => void };
function Range({ label, value, minimum, maximum, step, unit = "", onChange }: RangeProps) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return <label className="control" htmlFor={id}>
    <span>{label}<output>{value}{unit}</output></span>
    <input id={id} type="range" min={minimum} max={maximum} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </label>;
}

function download(name: string, text: string, type: string) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([text], { type }));
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export function App() {
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const reducedMotion = useReducedMotion();
  const result = useMemo(() => simulate(scenario), [scenario]);
  const set = <K extends keyof Scenario>(key: K, value: Scenario[K]) => setScenario((current) => ({ ...current, [key]: value }));
  const verdictClass = result.verdict.replace(" ", "-");
  return <>
    <header className="topbar"><a href="#main" className="wordmark"><span>EXOEARTH</span> / CADENCE BENCHMARK</a><nav aria-label="Page sections"><a href="#experiment">Experiment</a><a href="#method">Method</a><a href="https://github.com/Biswajit1999/exoearth-cadence-benchmark">GitHub</a></nav></header>
    <main id="main">
      <section className="hero">
        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}>
          <p className="eyebrow">HWO PRECURSOR · INJECTION / RECOVERY · NULL TEST</p>
          <h1>When does a pale blue dot tell the truth?</h1>
          <p className="lede">Stress-test claims about rotation, surface color, and ocean glint before sparse observations turn weather into a world map.</p>
          <div className="hero-actions"><a className="button primary" href="#experiment">Run the benchmark</a><a className="button secondary" href="#method">Read assumptions</a></div>
        </motion.div>
        <aside className="claim-card"><span>Live verdict</span><strong className={verdictClass}>{result.verdict}</strong><p>{result.reasons[0] ?? "The injected rotation survives the declared cadence, noise, and cloud process."}</p></aside>
      </section>

      <section id="experiment" className="workspace" aria-labelledby="experiment-title">
        <div className="section-heading"><div><p className="eyebrow">01 / DECLARE THE OBSERVATION</p><h2 id="experiment-title">Cadence laboratory</h2></div><button className="text-button" onClick={() => setScenario(DEFAULT_SCENARIO)}>Reset Earth</button></div>
        <div className="preset-row" aria-label="Benchmark presets">{Object.entries(PRESETS).map(([name, preset]) => <button key={name} onClick={() => setScenario(preset)}>{name}</button>)}</div>
        <div className="lab-grid">
          <aside className="controls-panel">
            <h3>Observation design</h3>
            <Range label="Baseline" value={scenario.baselineDays} minimum={1} maximum={30} step={0.5} unit=" d" onChange={(value) => set("baselineDays", value)} />
            <Range label="Cadence" value={scenario.cadenceHours} minimum={0.5} maximum={8} step={0.5} unit=" h" onChange={(value) => set("cadenceHours", value)} />
            <Range label="Duty cycle" value={Math.round(scenario.dutyCycle * 100)} minimum={20} maximum={100} step={1} unit="%" onChange={(value) => set("dutyCycle", value / 100)} />
            <Range label="S/N per epoch" value={scenario.snr} minimum={3} maximum={60} step={1} onChange={(value) => set("snr", value)} />
            <Range label="Phase angle" value={scenario.phaseDegrees} minimum={20} maximum={150} step={1} unit="°" onChange={(value) => set("phaseDegrees", value)} />
            <h3>Planet nuisance model</h3>
            <Range label="Cloud fraction" value={Math.round(scenario.cloudFraction * 100)} minimum={5} maximum={90} step={1} unit="%" onChange={(value) => set("cloudFraction", value / 100)} />
            <Range label="Cloud coherence" value={scenario.cloudCoherenceHours} minimum={2} maximum={72} step={1} unit=" h" onChange={(value) => set("cloudCoherenceHours", value)} />
            <Range label="Ocean fraction" value={Math.round(scenario.oceanFraction * 100)} minimum={10} maximum={95} step={1} unit="%" onChange={(value) => set("oceanFraction", value / 100)} />
            <Range label="Glint strength" value={scenario.glintStrength} minimum={0} maximum={0.7} step={0.01} onChange={(value) => set("glintStrength", value)} />
            <Range label="Random seed" value={scenario.seed} minimum={1} maximum={100} step={1} onChange={(value) => set("seed", value)} />
          </aside>
          <div className="results-panel">
            <div className="metric-grid">
              <article><span>Recovered rotation</span><strong>{result.recoveredPeriodHours.toFixed(2)} h</strong><small>truth {scenario.rotationHours.toFixed(2)} h</small></article>
              <article><span>Fractional error</span><strong>{(result.periodErrorFraction * 100).toFixed(1)}%</strong><small>pass threshold &lt; 10%</small></article>
              <article><span>Alias separation</span><strong>{result.aliasRatio.toFixed(2)}×</strong><small>best / competing peak</small></article>
              <article><span>Epochs / rotations</span><strong>{result.observations.length} / {result.rotationsCovered.toFixed(1)}</strong><small>retained / covered</small></article>
            </div>
            <LightCurveChart result={result} />
            <PeriodChart result={result} injected={scenario.rotationHours} />
            <div className="export-row"><button className="button primary" onClick={() => download("exoearth-observations.csv", toCsv(result), "text/csv")}>Export observations CSV</button><button className="button secondary" onClick={() => download("exoearth-run.json", JSON.stringify({ scenario, result }, null, 2), "application/json")}>Export reproducibility JSON</button></div>
          </div>
        </div>
      </section>

      <section id="method" className="method-section">
        <div><p className="eyebrow">02 / DO NOT OVER-INTERPRET</p><h2>A benchmark, not a planet retrieval.</h2><p>This reduced-order model combines a Lambert phase function, a longitudinal surface mixture, correlated cloud evolution, crescent-enhanced glint, irregular retention, Gaussian measurement noise, and a declared period scan. It asks whether the known injected truth can be recovered.</p></div>
        <div className="method-grid">
          <article><span>Claim tested</span><h3>Rotation is identifiable</h3><p>Pass only when the leading color-period peak is within 10% of truth and sufficiently separated from an independent alias.</p></article>
          <article><span>Null mechanism</span><h3>Clouds imitate geography</h3><p>Cloud coherence near one rotation and short baselines deliberately create plausible but incorrect peaks.</p></article>
          <article><span>Falsification</span><h3>Vary seed and schedule</h3><p>A robust observing design should pass across nuisance realizations—not just the attractive default seed shown here.</p></article>
        </div>
        <p className="scope-note"><strong>Scientific scope:</strong> this is a transparent planning benchmark. It is not a radiative-transfer model, exposure-time calculator, or evidence that any observed exoplanet has oceans, continents, vegetation, or life.</p>
      </section>
    </main>
    <footer><span>Open methods · deterministic seeds · exportable evidence</span><span>Built for falsifiable observing strategy</span></footer>
  </>;
}
