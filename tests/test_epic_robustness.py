import numpy as np
import pytest

from research.epic_robustness import (
    leave_one_epoch_color_sensitivity, phase_thinning_audit, stride_phase_envelope,
)


def test_linear_signal_interior_exact_for_all_phases():
    t = np.arange(13.0)
    rgb = np.column_stack((t, 2*t + 1, -t))
    rows = phase_thinning_audit(t, rgb)
    assert len(rows) == 9
    assert all(row["rmse"] < 1e-12 for row in rows)
    assert all(row["scored_interior"] + row["excluded_boundary"] == row["withheld"] for row in rows)


def test_boundary_omissions_are_not_scored_as_extrapolation():
    t = np.arange(7.0)
    rgb = np.column_stack((t*t, t*t, t*t))
    rows = phase_thinning_audit(t, rgb, (3,))
    assert any(row["excluded_boundary"] > 0 for row in rows)
    assert all(row["median_bracket_hours"] == pytest.approx(3) for row in rows)


def test_phase_envelope_uses_all_offsets():
    t = np.arange(13.0)
    rgb = np.column_stack((np.sin(t), np.cos(t), t/13))
    rows = phase_thinning_audit(t, rgb, (2, 3))
    summary = stride_phase_envelope(rows)
    assert [row["n_phases"] for row in summary] == [2, 3]
    assert all(row["range_rmse"] >= 0 for row in summary)


def test_color_jackknife_rank_one():
    t = np.arange(8.0)
    result = leave_one_epoch_color_sensitivity(np.column_stack((t, 2*t, -3*t)))
    assert result["n_deletions"] == 8
    assert result["min_fraction"] == pytest.approx(1)
    assert result["max_fraction"] == pytest.approx(1)


def test_invalid_inputs_rejected():
    with pytest.raises(ValueError):
        phase_thinning_audit([0, 1, 1], np.zeros((3, 3)))
    with pytest.raises(ValueError):
        phase_thinning_audit([0, 1, 2], np.zeros((3, 3)), (1,))
    with pytest.raises(ValueError):
        leave_one_epoch_color_sensitivity(np.ones((6, 3)))
