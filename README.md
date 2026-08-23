# ExoEarth Cadence Benchmark

**A browser-native injection–recovery laboratory for testing whether sparse, noisy observations of a cloudy Earth analog can support claims about rotation, surface color, or ocean glint.**

[![CI](https://github.com/Biswajit1999/exoearth-cadence-benchmark/actions/workflows/ci.yml/badge.svg)](https://github.com/Biswajit1999/exoearth-cadence-benchmark/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-55d6d2.svg)](LICENSE)
[![Research scope](https://img.shields.io/badge/scope-observing_strategy-ff7849.svg)](docs/METHODS.md)

## The research gap

NASA's Exoplanet Analysis Group has identified a shortage of whole-disk Earth observations at HWO-relevant visible wavelengths, phases below quadrature, and baselines long enough to capture weather across multiple rotations. Meanwhile, published inversions show that clouds dominate much of Earth's disk-integrated variability and that one rotation poorly constrains a surface map.

Powerful forward models and mapping algorithms already exist. What is still difficult to find is a lightweight, reproducible **failure benchmark** that lets an observer ask:

> If the planet's truth were known, would my cadence and noise recover it—or manufacture a plausible alias?

This repository fills that narrower gap. It is not another radiative-transfer code and does not claim a real exoplanet detection.

## What is new here

- A deterministic, browser-native injection–recovery experiment—no notebook or account required.
- Correlated cloud evolution that can deliberately occupy a rotation-like timescale.
- Irregular epoch retention controlled by cadence and duty cycle.
- Three reflected-light bands with land/ocean color contrast, a reduced red edge, and crescent-enhanced glint.
- An explicit period search with truth comparison and independent-alias separation.
- Pass, fragile, and non-identifiable verdicts with human-readable failure reasons.
- CSV and JSON exports for auditability.
- Presets designed around failure modes, not only attractive successful cases.

## Quick start

```bash
git clone https://github.com/Biswajit1999/exoearth-cadence-benchmark.git
cd exoearth-cadence-benchmark
npm install
npm run dev
```

Open the local URL printed by Vite.

## Reproduce and verify

```bash
npm run check
```

The check runs static linting, deterministic science tests, TypeScript validation, and a production build.

## Experiment contract

Every run declares:

| Quantity | Meaning |
|---|---|
| rotation period | injected sidereal modulation timescale |
| baseline | total span of the observing campaign |
| cadence | separation between attempted epochs |
| duty cycle | probability-weighted retention of epochs |
| phase angle | star–planet–observer geometry |
| cloud fraction | mean obscuring/bright cloud coverage |
| cloud coherence | correlation time of evolving cloud structure |
| S/N per epoch | simplified Gaussian precision control |
| ocean fraction | global surface mixture parameter |
| glint strength | reduced crescent specular component |
| random seed | complete nuisance realization identifier |

The output is a known-truth benchmark. A claim passes only when the strongest recovered color period is close to the injected rotation and reasonably separated from an independent alias. Short baselines, sparse schedules, or rotation-like clouds generate explicit warnings.

## Scientific interpretation

The model is deliberately reduced order. It is useful for intuition, observing-strategy stress tests, education, and defining a more complete simulation campaign. It does **not** replace:

- vector radiative transfer;
- a coronagraph or detector noise model;
- a retrieval with calibrated priors;
- a full Bayesian model comparison;
- real DSCOVR/EPIC or EPOXI reductions;
- an HWO exposure-time calculator.

Treat its verdict as a screening result, not a detection significance.

## Falsifiable hypotheses

1. Rotation recovery degrades when the cloud correlation time approaches the injected rotation period.
2. A baseline shorter than two rotations cannot robustly separate surface modulation from weather.
3. Sparse observing windows can create aliases with power comparable to the injected period.
4. Glint evidence becomes fragile when crescent geometry, clear ocean fraction, or per-epoch S/N is insufficient.

These statements can be challenged by sweeping seeds and schedules, replacing the reduced cloud process, and comparing results with real disk-integrated Earth observations.

## Suggested research extensions

- Ingest calibrated DSCOVR/EPIC Level 1B radiances and reproduce published disk integration.
- Replace the heuristic surface harmonics with time-tagged Earth maps.
- Add HWO-like wavelength channels and an instrument-specific covariance model.
- Run ensemble injection–recovery grids and publish completeness surfaces.
- Compare Lomb–Scargle, autocorrelation, Gaussian-process, and sparse-map recovery.
- Add multi-phase scheduling and explicit glint-vs-cloud model comparison.

## Evidence base

- [NASA ExoPAG findings](https://science.nasa.gov/astrophysics/programs/exep/exopag/resources/founding-documents-findings/) — community-stated need for broader whole-disk Earth coverage.
- [Jiang et al. (2018)](https://arxiv.org/abs/1805.05834) — two years of DSCOVR observations used to study rotation, clouds, surface, orbit, and cadence.
- [Fan et al. (2019)](https://arxiv.org/abs/1908.04350) — two-dimensional mapping from disk-integrated Earth light curves.
- [Gu et al. (2020)](https://arxiv.org/abs/2012.10556) — cloud components dominate much of the variability; land/ocean information is weaker.
- [Aizawa et al. (2020)](https://arxiv.org/abs/2004.03941) — sparse modeling and multi-epoch strategies for exo-Earth mapping.
- [Lustig-Yaeger et al. (2019)](https://arxiv.org/abs/1901.05011) — multi-phase mapping as a path to separating ocean glint from clouds.
- [Mettler et al. (2022)](https://academic.oup.com/mnras/article/511/1/440/6501216) — why mapping partially cloudy exoplanets is hard, especially over one rotation.
- [NASA DSCOVR EPIC](https://epic.gsfc.nasa.gov/about/epic) — instrument and calibration context for future real-data ingestion.

See [Research gap](docs/RESEARCH_GAP.md) and [Methods](docs/METHODS.md) for the detailed claim boundaries.

## Repository map

```text
src/science.ts       deterministic forward model and period scan
src/science.test.ts  physical limits and recovery failure tests
src/App.tsx          interactive experiment and accessible exports
docs/                research-gap and method documentation
.github/workflows/   reproducible CI
```

## Citation

If this benchmark helps define an observing-strategy experiment, cite the software using [CITATION.cff](CITATION.cff). Cite the underlying scientific papers separately.

## Contributing

Issues that include a failing seed, schedule, expected physical behavior, and a minimal reproduction are especially valuable. New physical modules should add tests and state their validity range.

## License

MIT. Scientific references and external datasets retain their own licenses and citation requirements.
