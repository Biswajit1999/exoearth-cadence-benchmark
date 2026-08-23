# Research gap: stress-testing sparse maps of cloudy Earth analogs

## Gap statement

The Habitable Worlds Observatory is intended to directly characterize potentially habitable planets, but an unresolved Earth is not a static spectrum. Weather, rotation, viewing phase, continents, ocean glint, and sampling windows all change the disk-integrated signal. NASA ExoPAG findings explicitly note missing whole-disk Earth observations at useful visible wavelengths, lower illumination phases, and multi-rotation weather coverage.

The literature contains sophisticated forward models and inverse mapping methods. The missing layer addressed here is an inspectable **benchmark contract** connecting a declared observing schedule to known-truth recovery and failure.

## Landscape matrix

| Existing contribution | What it establishes | Remaining opening used here |
|---|---|---|
| DSCOVR/EPIC Earth time series | rotation, cloud and surface information exist in disk-integrated data | expose schedule/noise failures interactively |
| 2D and sparse exo-cartography | maps can be recovered under stated assumptions | test identifiability before map inversion |
| VPL 3D Earth model | physically rich spectra across phase and time | provide a lightweight planning/null-test layer |
| HWO scene and retrieval tools | end-to-end targets, spectra, and instrument concepts | focus specifically on cadence aliases and cloud timescales |
| glint mapping studies | multiple phases can distinguish glint from clouds | show when the required leverage disappears |

## Research questions

1. How many rotations and retained epochs are required before the injected period dominates aliases?
2. Which combinations of cloud coverage and coherence create false rotation peaks?
3. At what phases does a simplified ocean-glint contrast become measurable rather than merely present?
4. Do conclusions persist across seeds, or depend on one favorable weather realization?

## Non-claims

This project does not establish mission yields, retrieve a real planet map, identify a biosignature, or demonstrate an ocean. It defines a reproducible question that more complete simulators and real Earth data can answer.

## Why it can grow into research

The browser experiment is the front door. A publishable next phase would ingest calibrated DSCOVR radiances, reproduce established analyses, create schedule/noise injections, and report completeness surfaces with uncertainty over weather realizations. The present data model and deterministic seeds are designed to make that extension straightforward.
