"""Cadence and sparse-recovery diagnostics for the real EPIC preview sequence."""
from __future__ import annotations

from datetime import datetime
import json
from pathlib import Path

import numpy as np


def load_sequence(path: str | Path):
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    observations = payload["observations"]
    times = np.array([datetime.fromisoformat(row["date"]).timestamp() for row in observations])
    times = (times - times[0]) / 3600
    longitude = np.mod([row["centroidLongitude"] for row in observations], 360.0)
    rgb = np.asarray([row["diskRgbPreview"] for row in observations], dtype=float)
    return times, np.asarray(longitude), rgb


def cadence_summary(times_hours: np.ndarray, longitude_deg: np.ndarray) -> dict[str, float | int]:
    gaps = np.diff(times_hours)
    sorted_longitude = np.sort(longitude_deg)
    circular_gaps = np.diff(np.r_[sorted_longitude, sorted_longitude[0] + 360])
    return {
        "observations": int(times_hours.size),
        "baseline_hours": float(np.ptp(times_hours)),
        "median_gap_minutes": float(np.median(gaps) * 60),
        "maximum_gap_minutes": float(np.max(gaps) * 60),
        "gap_mad_seconds": float(np.median(np.abs(gaps - np.median(gaps))) * 3600),
        "maximum_unobserved_longitude_arc_deg": float(np.max(circular_gaps)),
    }


def thinning_recovery(times_hours: np.ndarray, rgb: np.ndarray, strides=(2, 3, 4)):
    """Interpolate omitted epochs from regularly thinned retained sequences."""
    rows = []
    for stride in strides:
        retained = np.arange(times_hours.size) % stride == 0
        omitted = ~retained
        if retained.sum() < 2:
            continue
        prediction = np.column_stack(
            [
                np.interp(times_hours[omitted], times_hours[retained], rgb[retained, band])
                for band in range(3)
            ]
        )
        residual = prediction - rgb[omitted]
        rows.append(
            {
                "stride": int(stride),
                "retained": int(retained.sum()),
                "omitted": int(omitted.sum()),
                "effective_gap_hours": float(stride * np.median(np.diff(times_hours))),
                "rgb_rmse": float(np.sqrt(np.mean(residual**2))),
                "maximum_absolute_rgb_error": float(np.max(np.abs(residual))),
            }
        )
    return rows


def color_covariance(rgb: np.ndarray) -> dict[str, list[float] | float]:
    centered = rgb - np.mean(rgb, axis=0)
    covariance = np.cov(centered, rowvar=False, ddof=1)
    eigenvalues = np.linalg.eigvalsh(covariance)[::-1]
    return {
        "channel_standard_deviation": np.std(rgb, axis=0, ddof=1).tolist(),
        "correlation_matrix": np.corrcoef(rgb, rowvar=False).tolist(),
        "covariance_eigenvalues": eigenvalues.tolist(),
        "leading_variance_fraction": float(eigenvalues[0] / np.sum(eigenvalues)),
    }

