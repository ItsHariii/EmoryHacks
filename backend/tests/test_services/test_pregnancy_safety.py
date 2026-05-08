"""Pregnancy safety lookup tests.

Pinned to whole-word matching after the substring-bug fix
(Phase 1.7) so 'ham' no longer matches 'graham', 'egg' no longer
matches 'eggplant', etc.
"""
from __future__ import annotations

import pytest

from app.services.pregnancy_safety_service import PregnancySafetyService


@pytest.fixture
def svc(monkeypatch):
    s = PregnancySafetyService()
    s.safety_rules = {
        "ham": {"status": "limited", "notes": "Heat to steaming."},
        "egg": {"status": "limited", "notes": "Avoid raw."},
        "raw egg": {"status": "avoid", "notes": "Salmonella risk."},
        "salmon": {"status": "safe", "notes": "Cooked salmon is safe."},
        "swordfish": {"status": "avoid", "notes": "High mercury."},
    }
    return s


def test_exact_match_wins(svc):
    assert svc.get_safety_status("salmon")["status"] == "safe"


def test_word_boundary_avoids_graham_false_positive(svc):
    """'graham' must NOT pick up the 'ham' rule."""
    result = svc.get_safety_status("graham cracker")
    assert result["status"] == "limited"
    assert result["notes"].startswith("Safety not reviewed")


def test_word_boundary_avoids_eggplant_false_positive(svc):
    """'eggplant' must NOT pick up the 'egg' rule."""
    result = svc.get_safety_status("eggplant parmesan")
    assert result["status"] == "limited"


def test_longest_rule_wins_for_overlapping_keys(svc):
    """'raw egg' must beat 'egg' when both could match."""
    result = svc.get_safety_status("raw egg yolk")
    assert result["status"] == "avoid"
    assert "Salmonella" in result["notes"]


def test_default_for_unknown_ingredient(svc):
    result = svc.get_safety_status("imaginary fruit")
    assert result["status"] == "limited"
    assert "not reviewed" in result["notes"].lower()


def test_check_food_safety_flags_avoid_ingredient(svc):
    overall, notes, items = svc.check_food_safety(
        ingredients=["bread", "swordfish"]
    )
    assert overall == "avoid"
    assert "swordfish" in notes
    assert any(item["safety_status"] == "avoid" for item in items)
