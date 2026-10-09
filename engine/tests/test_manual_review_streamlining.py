import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from decimal import Decimal
import pytest
from system_a.domain.rules import v06_signatures, Ctx, RuleOutcome
from system_a.domain.contracts import InvoiceDoc, SignatureObs, ReceiptRow

def test_v06_waives_deliverer_when_oracle_receipt_confirmed():
    doc = InvoiceDoc(
        document_id="D1",
        fields={},
        lines=(),
        signatures={
            "receiver": SignatureObs(present=True, confidence=0.9),
            "deliverer": SignatureObs(present=None, confidence=0.5),
        },
        pages_complete=True,
    )
    # Confirmed Oracle receipt exists
    snapshot = type("Snapshot", (), {"found": True, "active": [ReceiptRow(org_id=1, receipt_num="R1", receiver="WH", line=1, item="A", qty=Decimal(1), uom="PCS", unit_price=Decimal(10), line_amount=Decimal(10))]})()
    std = type("Std", (), {"policy": {"signature": {"min_confidence": 0.8}}})()
    c = Ctx(doc=doc, snapshot=snapshot, std=std)
    
    res = v06_signatures(c)
    assert res.result == "pass"
    assert "Oracle" in (res.detail or "")


def test_v06_still_flags_receiver_when_receiver_unsure():
    doc = InvoiceDoc(
        document_id="D1",
        fields={},
        lines=(),
        signatures={
            "receiver": SignatureObs(present=None, confidence=0.5),
            "deliverer": SignatureObs(present=True, confidence=0.9),
        },
        pages_complete=True,
    )
    snapshot = type("Snapshot", (), {"found": True, "active": [1]})()
    std = type("Std", (), {"policy": {"signature": {"min_confidence": 0.8}}})()
    c = Ctx(doc=doc, snapshot=snapshot, std=std)
    
    res = v06_signatures(c)
    assert res.result == "manual_review"
