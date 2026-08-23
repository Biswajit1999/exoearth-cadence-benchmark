# Methods and validity envelope

## Forward model

At time `t`, the sub-observer longitude advances with the injected rotation period. A small harmonic longitude map controls the visible land fraction. Blue, red, and near-infrared reflectances combine ocean, land, cloud, and a reduced vegetation-edge term.

The illuminated fraction uses the Lambert phase function

```text
Φ(α) = [sin α + (π - α) cos α] / π.
```

Glint is an intentionally simplified crescent-enhanced, ocean-facing term. It is not a Fresnel or vector radiative-transfer calculation.

## Weather process

Cloud variability follows a seeded first-order correlated process with

```text
ρ = exp(-Δt / τcloud).
```

This gives the nuisance process a declared coherence time. It is not a general circulation model and does not reproduce Earth's complete cloud statistics.

## Observing window and noise

Attempted epochs are separated by the chosen cadence. A seeded, daily-modulated retention probability creates an irregular schedule with the requested mean duty-cycle behavior. Independent Gaussian noise is then applied to each band using the declared per-epoch S/N scale.

## Period recovery

The benchmark scans 420 trial periods from 6 to 48 hours. At each period, it solves a two-component sinusoidal least-squares model for the `NIR - blue` color series. The reported power is the fitted variance divided by total centered variance.

The alias ratio compares the strongest peak with the strongest competitor more than 1.5 hours away. This exclusion is a pragmatic resolution rule, not an analytic false-alarm probability.

## Verdict

The benchmark records warnings for insufficient epochs, fewer than two rotations, period error of at least 10%, weak alias separation, and rotation-like cloud evolution. Multiple warnings produce a non-identifiable verdict. One warning or weak color modulation produces a fragile verdict.

## Reproducibility

All pseudo-random terms derive from the displayed integer seed. JSON export records the complete scenario and result. Unit tests cover phase-function limits, exact seeded determinism, successful high-information recovery, and failure of a sparse cloud-dominated case.

## Known limitations

- heuristic longitudinal geography;
- three broad proxy bands rather than instrument response curves;
- independent Gaussian measurement noise;
- no speckles, exozodiacal background, detector systematics, or spectral covariance;
- no obliquity, season, evolving surface, polarization, moons, or rings;
- reduced glint physics;
- no Bayesian evidence or trial-corrected false-alarm probability.

Those limitations are visible by design. The tool should make a question sharper, not make a weak claim look precise.
