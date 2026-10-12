# NASA EPIC one-day cadence validation

This analysis uses the 13 real DSCOVR/EPIC observations and exact source
receipts already committed for 2024-01-01. It measures timestamp regularity,
circular sub-spacecraft-longitude coverage, interpolation loss after regular
cadence thinning, and the covariance of the three display-derived RGB traces.

For a thinned series, omitted preview values are predicted by linear
interpolation between retained timestamps and evaluated with held-out RMSE. The
experiment quantifies information loss in this one sequence; it is not an
instrument-noise model or an HWO completeness calculation.

Run `python scripts/analyze_epic_cadence.py`.

The RGB values come from NASA's display-adjusted natural-colour JPEGs, not
calibrated EPIC Level-1B radiances. Their covariance may reflect clouds,
surfaces, rendering, compression, geometry, or mask details. It cannot support
claims about biosignatures, vegetation, oceans, glint, or an unresolved
exoplanet's detectability.

