import numpy as np
import pytest

from research.epic_cadence import cadence_summary, color_covariance, thinning_recovery


def test_circular_longitude_gap():
    result = cadence_summary(np.array([0.0, 1.0, 2.0]), np.array([0.0, 120.0, 240.0]))
    assert result["maximum_unobserved_longitude_arc_deg"] == pytest.approx(120.0)


def test_thinning_recovery_linear_signal():
    time = np.arange(7.0)
    rgb = np.column_stack([time, 2 * time, 3 * time])
    result = thinning_recovery(time, rgb, strides=(2,))[0]
    assert result["rgb_rmse"] == pytest.approx(0.0)


def test_color_covariance_identifies_one_dimensional_signal():
    base = np.arange(5.0)
    result = color_covariance(np.column_stack([base, 2 * base, 3 * base]))
    assert result["leading_variance_fraction"] == pytest.approx(1.0)

