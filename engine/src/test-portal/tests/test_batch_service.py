"""The batch half of the service: many documents at once, into the active round, and a stop that works."""
import time
import pytest
from pathlib import Path
from unittest.mock import MagicMock
from webapp.store import RoundStore
from webapp.service import DocumentService


class MockCatalog:
    def __init__(self, count=10):
        self.docs = [MagicMock(id=i, title=f"Doc {i}", file_name=f"dms_{i}.pdf",
                               mime="application/pdf", file_class="invoice",
                               tagged=["invoice"], pages_total=1, page_numbers=[1],
                               created="2026-01-01", correspondent=None,
                               dms_url=f"http://test/{i}") for i in range(1, count + 1)]

    def get(self, doc_id):
        for d in self.docs:
            if d.id == doc_id:
                return d
        raise KeyError(doc_id)

    def viewer_url(self, doc_id):
        return f"/view/{doc_id}"


class MockRunner:
    name = "inprocess"

    def run(self, doc_id: int, *, run: int):
        time.sleep(0.01)
        return {
            "dms_doc_id": f"DMS-{doc_id}",
            "pages": [{"width_pt": 600, "height_pt": 800, "rotation": 0, "page_type": "invoice"}],
            "ocr": {"elements": []},
            "recommendation": {"value": "AUTO_PASS", "max_severity": "None", "exception_codes": []},
            "normalized_fields": {"invoice_num": f"INV-{doc_id}", "grand_total": 100.0 * doc_id, "currency": "THB"},
            "rule_results": [{"rule_id": "V-01", "result": "pass"}]
        }

    def health(self):
        return {"engine": "inprocess", "ok": True}


def wait_batch(svc, timeout=10.0):
    t0 = time.time()
    while time.time() - t0 < timeout:
        if not svc.batch_status()["running"]:
            return svc.batch_status()
        time.sleep(0.02)
    raise AssertionError("the batch never finished")


def test_batch_service_execution(tmp_path: Path):
    store = RoundStore(results_root=tmp_path, default_round="batch_test")
    store.create_round("batch_test")
    catalog = MockCatalog(count=5)
    runner = MockRunner()

    svc = DocumentService(catalog, runner, store, workers=10, mode="production")

    # Start batch
    res = svc.start_batch(doc_ids=[1, 2, 3, 4, 5], skip_existing=False, concurrency=5)
    assert res["status"] == "started"
    assert res["total"] == 5

    # Wait for completion
    st = wait_batch(svc)
    assert not st["running"]
    assert st["completed"] == 5
    assert st["errors"] == 0

    # Check results exist
    for doc_id in [1, 2, 3, 4, 5]:
        assert store.has_result(doc_id)
    svc.shutdown()


def test_batch_service_stop(tmp_path: Path):
    store = RoundStore(results_root=tmp_path, default_round="stop_test")
    store.create_round("stop_test")
    catalog = MockCatalog(count=20)
    runner = MockRunner()

    svc = DocumentService(catalog, runner, store, workers=2, mode="production")
    svc.start_batch(doc_ids=list(range(1, 21)), skip_existing=False, concurrency=2)
    time.sleep(0.02)
    svc.stop_batch()
    time.sleep(0.1)

    st = svc.batch_status()
    assert not st["running"]
    assert st["stopped"] is True
    svc.shutdown()
