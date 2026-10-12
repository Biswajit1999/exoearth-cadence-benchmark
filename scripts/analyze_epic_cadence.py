"""Generate reproducible diagnostics for one real NASA EPIC day."""
from __future__ import annotations

import csv
import json
from pathlib import Path
import sys

import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from research.epic_cadence import (  # noqa: E402
    cadence_summary,
    color_covariance,
    load_sequence,
    thinning_recovery,
)


def main():
    source = ROOT / "public/data/epic-2024-01-01.json"
    times, longitude, rgb = load_sequence(source)
    cadence = cadence_summary(times, longitude)
    thinning = thinning_recovery(times, rgb)
    color = color_covariance(rgb)
    output = {
        "data_kind": "real NASA DSCOVR/EPIC display-adjusted natural-colour previews",
        "date": "2024-01-01",
        "cadence_and_longitude_coverage": cadence,
        "sparse_cadence_interpolation": thinning,
        "display_rgb_covariance": color,
        "claim_boundary": "Preview RGB values are not calibrated radiances and cannot support biosignature, ocean, vegetation, glint, or exoplanet-detectability claims.",
    }
    (ROOT / "research/epic-cadence-validation.json").write_text(
        json.dumps(output, indent=2), encoding="utf-8"
    )
    with (ROOT / "research/epic-thinning-recovery.csv").open(
        "w", newline="", encoding="utf-8"
    ) as stream:
        writer = csv.DictWriter(stream, fieldnames=list(thinning[0]))
        writer.writeheader()
        writer.writerows(thinning)
    figure, axes = plt.subplots(1, 2, figsize=(11, 4.5), constrained_layout=True)
    for index, label in enumerate(("R", "G", "B")):
        axes[0].plot(times, rgb[:, index], marker="o", label=label)
    axes[0].set(
        xlabel="Hours since first observation",
        ylabel="Display-derived disk mean",
        title="Real EPIC preview sequence",
    )
    axes[0].legend(frameon=False)
    axes[1].plot(
        [row["effective_gap_hours"] for row in thinning],
        [row["rgb_rmse"] for row in thinning],
        marker="o",
        color="#b85d00",
    )
    axes[1].set(
        xlabel="Effective retained cadence (hours)",
        ylabel="Held-out RGB RMSE",
        title="Sparse-cadence interpolation loss",
    )
    figure.suptitle("NASA EPIC one-day cadence validation", fontweight="bold")
    figure.savefig(ROOT / "research/epic-cadence-validation.png", dpi=180)
    plt.close(figure)
    print(json.dumps(cadence, indent=2))


if __name__ == "__main__":
    main()

