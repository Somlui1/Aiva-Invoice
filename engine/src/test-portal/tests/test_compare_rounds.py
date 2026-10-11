"""Comparing two rounds of the same documents: what got better, what got worse, and which rule moved."""
import pytest
from pathlib import Path
from unittest.mock import MagicMock
from webapp.store import RoundStore
from webapp.service import DocumentService, compare_verdicts, verdict_rank


def test_the_hierarchy_the_comparison_is_founded_on():
    """The order is the tester's: an AUTO_PASS needed nobody, a SYSTEM_ERROR needed an engineer."""
    assert [verdict_rank(v) for v in ("AUTO_PASS", "REVIEW", "MANUAL_REVIEW", "HOLD", "SYSTEM_ERROR", "FAILED")] \
        == [5, 4, 3, 2, 1, 1]
    assert verdict_rank("AUTO_PASS ") == 5 and verdict_rank(None) == 0 and verdict_rank("WAT") == 0


def test_compare_verdicts_ranking():
    assert compare_verdicts("MANUAL_REVIEW", "AUTO_PASS") == "improved"
    assert compare_verdicts("HOLD", "AUTO_PASS") == "improved"
    assert compare_verdicts("AUTO_PASS", "HOLD") == "regressed"
    assert compare_verdicts("AUTO_PASS", "AUTO_PASS") == "unchanged"
    assert compare_verdicts("SYSTEM_ERROR", "MANUAL_REVIEW") == "improved"


def test_compare_rounds_diff(tmp_path: Path):
    store = RoundStore(results_root=tmp_path, default_round="r1")
    store.create_round("r1")
    store.create_round("r2")

    # Doc 1: MANUAL_REVIEW -> AUTO_PASS (improved)
    store.set_active_round("r1")
    store.save_result(1, {
        "dms_doc_id": "DMS-1",
        "recommendation": {"value": "MANUAL_REVIEW"},
        "normalized_fields": {"invoice_num": "INV-1"},
        "rule_results": [{"rule_id": "V-08", "result": "fail"}]
    })
    store.set_active_round("r2")
    store.save_result(1, {
        "dms_doc_id": "DMS-1",
        "recommendation": {"value": "AUTO_PASS"},
        "normalized_fields": {"invoice_num": "INV-1"},
        "rule_results": [{"rule_id": "V-08", "result": "pass"}]
    })

    # Doc 2: AUTO_PASS -> HOLD (regressed)
    store.set_active_round("r1")
    store.save_result(2, {
        "dms_doc_id": "DMS-2",
        "recommendation": {"value": "AUTO_PASS"},
        "normalized_fields": {"invoice_num": "INV-2"},
        "rule_results": [{"rule_id": "V-01", "result": "pass"}]
    })
    store.set_active_round("r2")
    store.save_result(2, {
        "dms_doc_id": "DMS-2",
        "recommendation": {"value": "HOLD"},
        "normalized_fields": {"invoice_num": "INV-2"},
        "rule_results": [{"rule_id": "V-01", "result": "fail"}]
    })

    svc = DocumentService(MagicMock(docs=[]), MagicMock(), store)
    diff = svc.compare_rounds("r1", "r2")

    assert diff["aggregate"]["AUTO_PASS"]["diff"] == 0  # +1 (doc 1) -1 (doc 2)
    assert diff["aggregate"]["improved_count"] == 1
    assert diff["aggregate"]["regressed_count"] == 1

    cases = {c["doc_id"]: c for c in diff["cases"]}
    assert cases[1]["delta"] == "improved"
    assert cases[1]["rule_changes"] == [{"rule_id": "V-08", "base": "fail", "target": "pass"}]
    assert cases[2]["delta"] == "regressed"


def test_documents_that_only_one_round_found_are_reported(tmp_path: Path):
    """A document that appears in one round only is a fact about the run, not something to average away."""
    store = RoundStore(results_root=tmp_path, default_round="a")
    store.create_round("a")
    store.create_round("b")
    store.set_active_round("a")
    store.save_result(10, {"dms_doc_id": "DMS-10", "recommendation": {"value": "HOLD"},
                           "rule_results": [{"rule_id": "V-01", "result": "fail"}]})
    store.save_result(11, {"dms_doc_id": "DMS-11", "recommendation": {"value": "AUTO_PASS"},
                           "rule_results": [{"rule_id": "V-01", "result": "pass"}]})
    store.set_active_round("b")
    store.save_result(11, {"dms_doc_id": "DMS-11", "recommendation": {"value": "AUTO_PASS"},
                           "rule_results": [{"rule_id": "V-01", "result": "pass"}]})
    store.save_result(12, {"dms_doc_id": "DMS-12", "recommendation": {"value": "REVIEW"},
                           "rule_results": [{"rule_id": "V-01", "result": "manual_review"}]})

    svc = DocumentService(MagicMock(docs=[]), MagicMock(), store)
    diff = svc.compare_rounds("a", "b")

    cases = {c["doc_id"]: c for c in diff["cases"]}
    assert cases[10]["delta"] == "removed" and cases[10]["target_recommendation"] is None
    assert cases[11]["delta"] == "unchanged" and cases[11]["rule_changes"] == []
    assert cases[12]["delta"] == "added"
    assert diff["aggregate"]["removed_count"] == 1 and diff["aggregate"]["added_count"] == 1
    assert diff["aggregate"]["unchanged_count"] == 1
    assert diff["aggregate"]["HOLD"]["base"] == 1 and diff["aggregate"]["HOLD"]["target"] == 0
    assert diff["aggregate"]["HOLD"]["diff"] == -1
    assert diff["aggregate"]["documents"] == 3
    # comparing a round with itself is the honest zero line
    same = svc.compare_rounds("b", "b")
    assert same["aggregate"]["unchanged_count"] == 2 and same["aggregate"]["improved_count"] == 0

