"""The round store: the portal reads and writes ``engine/results/<round>/`` exactly as
``scripts/test_paperless_invoices.py`` leaves it, and produces the same ``summary.json``."""
import json
import pytest
from pathlib import Path
from webapp.store import RoundStore


def test_round_store_list_and_create(tmp_path: Path):
    # Setup initial mock rounds in results directory
    (tmp_path / "paperless_invoices_v5").mkdir()
    (tmp_path / "paperless_invoices_v5" / "DMS-56_result.json").write_text("{}", encoding="utf-8")

    store = RoundStore(results_root=tmp_path, default_round="paperless_invoices_v5")
    rounds = store.list_rounds()
    assert "paperless_invoices_v5" in rounds
    assert store.active_round == "paperless_invoices_v5"

    # Create new round
    new_round = "run_20261009_120000"
    created = store.create_round(new_round)
    assert created.is_dir()
    assert new_round in store.list_rounds()


def test_round_store_save_load_overwrite(tmp_path: Path):
    store = RoundStore(results_root=tmp_path, default_round="round_a")
    store.create_round("round_a")

    # Save DMS-10 result
    payload_1 = {
        "dms_doc_id": "DMS-10",
        "recommendation": {"value": "AUTO_PASS", "max_severity": "None", "exception_codes": []},
        "rule_results": [{"rule_id": "V-01", "result": "pass"}]
    }
    store.save_result(10, payload_1)

    saved_file = tmp_path / "round_a" / "DMS-10_result.json"
    assert saved_file.exists()
    assert store.has_result(10)

    loaded = store.load_result(10)
    assert loaded["recommendation"]["value"] == "AUTO_PASS"

    # Overwrite DMS-10 result
    payload_2 = {
        "dms_doc_id": "DMS-10",
        "recommendation": {"value": "REVIEW", "max_severity": "Low", "exception_codes": ["V02_DIFF"]},
        "rule_results": [{"rule_id": "V-01", "result": "pass"}, {"rule_id": "V-02", "result": "fail"}]
    }
    store.save_result(10, payload_2)
    loaded_2 = store.load_result(10)
    assert loaded_2["recommendation"]["value"] == "REVIEW"


def test_round_store_summary_generation(tmp_path: Path):
    store = RoundStore(results_root=tmp_path, default_round="round_test")
    store.create_round("round_test")

    doc1 = {
        "dms_doc_id": "DMS-1",
        "recommendation": {"value": "AUTO_PASS", "max_severity": "None"},
        "normalized_fields": {"invoice_num": "INV-001", "grand_total": 100.0, "currency": "THB"},
        "rule_results": [{"rule_id": "V-01", "result": "pass"}]
    }
    doc2 = {
        "dms_doc_id": "DMS-2",
        "recommendation": {"value": "HOLD", "max_severity": "High"},
        "normalized_fields": {"invoice_num": "INV-002", "grand_total": 500.0, "currency": "THB"},
        "rule_results": [{"rule_id": "V-01", "result": "fail"}]
    }
    store.save_result(1, doc1)
    store.save_result(2, doc2)

    summary = store.build_and_save_summary(mode="production")
    assert summary["statistics"]["counts"]["AUTO_PASS"] == 1
    assert summary["statistics"]["counts"]["HOLD"] == 1
    assert summary["metadata"]["total_documents"] == 2

    summary_file = tmp_path / "round_test" / "summary.json"
    assert summary_file.is_file()
