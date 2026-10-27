"""Leakage-safe EPIC preview-cadence diagnostics; never calibrated photometry."""
from __future__ import annotations

import numpy as np


def phase_thinning_audit(times_hours, rgb, strides=(2, 3, 4)):
    """Vary thinning stride AND phase; score only bracketed withheld epochs.

    Linear interpolation outside the retained time range is forbidden: the
    first/last omitted epochs are reported as unscored boundary exclusions.
    """
    t = np.asarray(times_hours, dtype=float)
    y = np.asarray(rgb, dtype=float)
    if t.ndim != 1 or y.shape != (len(t), 3) or len(t) < 3:
        raise ValueError("expected >=3 timestamps and three RGB channels")
    if not np.isfinite(t).all() or not np.isfinite(y).all() or np.any(np.diff(t) <= 0):
        raise ValueError("times must increase strictly and all values must be finite")
    rows = []
    for stride in strides:
        if not isinstance(stride, (int, np.integer)) or stride < 2:
            raise ValueError("strides must be integers >=2")
        for phase in range(stride):
            retained = np.arange(len(t)) % stride == phase
            if retained.sum() < 2:
                continue
            withheld = ~retained
            interior = withheld & (t > t[retained].min()) & (t < t[retained].max())
            if not interior.any():
                continue
            left_idx = np.searchsorted(t[retained], t[interior], side="right") - 1
            right_idx = left_idx + 1
            bracket_gap = t[retained][right_idx] - t[retained][left_idx]
            prediction = np.column_stack([
                np.interp(t[interior], t[retained], y[retained, b]) for b in range(3)
            ])
            residual = prediction - y[interior]
            rows.append({
                "stride": int(stride), "phase": int(phase),
                "retained": int(retained.sum()), "withheld": int(withheld.sum()),
                "scored_interior": int(interior.sum()),
                "excluded_boundary": int(withheld.sum() - interior.sum()),
                "median_bracket_hours": float(np.median(bracket_gap)),
                "rmse": float(np.sqrt(np.mean(residual**2))),
                "max_absolute_error": float(np.max(np.abs(residual))),
            })
    return rows


def stride_phase_envelope(rows):
    """Report phase sensitivity without treating correlated phases as replicates."""
    summary = []
    for stride in sorted({row["stride"] for row in rows}):
        subset = [row for row in rows if row["stride"] == stride]
        errors = [row["rmse"] for row in subset]
        summary.append({"stride": stride, "n_phases": len(subset),
                        "min_rmse": min(errors), "max_rmse": max(errors),
                        "range_rmse": max(errors) - min(errors)})
    return summary


def leave_one_epoch_color_sensitivity(rgb):
    """Jackknife deletion sensitivity of RGB covariance's leading eigenfraction.

    Returns a range, NOT a confidence interval; previews are time-correlated.
    """
    y = np.asarray(rgb, dtype=float)
    if y.ndim != 2 or y.shape[1] != 3 or len(y) < 5 or not np.isfinite(y).all():
        raise ValueError("expected >=5 finite three-channel epochs")
    fractions = []
    for i in range(len(y)):
        subset = np.delete(y, i, axis=0)
        eigenvalues = np.linalg.eigvalsh(np.cov(subset, rowvar=False))
        total = eigenvalues.sum()
        if total <= 0:
            raise ValueError("zero covariance; fraction undefined")
        fractions.append(float(eigenvalues[-1] / total))
    return {"n_deletions": len(fractions), "min_fraction": min(fractions),
            "max_fraction": max(fractions), "range_fraction": max(fractions) - min(fractions)}
