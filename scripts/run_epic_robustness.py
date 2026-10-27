"""Reproduce phase-robustness checks on the pinned NASA EPIC JPEG preview manifest."""
from __future__ import annotations

import json
from pathlib import Path

from research.epic_cadence import load_sequence
from research.epic_robustness import (
    leave_one_epoch_color_sensitivity, phase_thinning_audit, stride_phase_envelope,
)


def main() -> None:
    manifest = Path("public/data/epic-2024-01-01.json")
    times, _longitude, rgb = load_sequence(manifest)
    rows = phase_thinning_audit(times, rgb)
    output = {"source": str(manifest), "n_observations": len(times),
              "units": "display-adjusted preview RGB, not calibrated radiance",
              "phase_thinning": rows, "stride_envelope": stride_phase_envelope(rows),
              "color_deletion_sensitivity": leave_one_epoch_color_sensitivity(rgb)}
    target = Path("research/epic-robustness-2026-10-27.json")
    target.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
