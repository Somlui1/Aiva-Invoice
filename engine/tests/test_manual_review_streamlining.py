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


def test_v06_still_flags_receiver_when_no_oracle_receipt():
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
    snapshot = type("Snapshot", (), {"found": False, "active": []})()
    std = type("Std", (), {"policy": {"signature": {"min_confidence": 0.8}}})()
    c = Ctx(doc=doc, snapshot=snapshot, std=std)
    
    res = v06_signatures(c)
    assert res.result == "manual_review"


def test_v06_waives_unsure_receiver_when_oracle_receipt_confirmed():
    """DMS-20: a faint receiver stamp on a paper whose Oracle receipt proves receiving cannot
    hold the invoice in manual review - the receipt is the receiving record."""
    doc = InvoiceDoc(
        document_id="D1",
        fields={},
        lines=(),
        signatures={
            "receiver": SignatureObs(present=True, confidence=0.55),
            "deliverer": SignatureObs(present=True, confidence=0.9),
        },
        pages_complete=True,
    )
    snapshot = type("Snapshot", (), {"found": True, "active": [1]})()
    std = type("Std", (), {"policy": {"signature": {"min_confidence": 0.8}}})()
    c = Ctx(doc=doc, snapshot=snapshot, std=std)

    res = v06_signatures(c)
    assert res.result == "pass"
    assert res.data.get("waived_slots") == ["receiver"]


def test_v05_demotes_address_uncertainty_to_medium_e07_when_tax_id_matches():
    from system_a.domain.contracts import NField
    from system_a.domain.rules import v05_customer
    
    doc = InvoiceDoc(
        document_id="D1",
        fields={
            "customer_tax_id": NField(name="customer_tax_id", element_id="F1", raw="0107539000052", value="0107539000052", confidence=0.99, ok=True),
            "customer_name": NField(name="customer_name", element_id="F2", raw="บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)", value="บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)", confidence=0.99, ok=True),
            "customer_address": NField(name="customer_address", element_id="F3", raw="99 หมู่ 1 ไม่ทราบตำบล", value="99 หมู่ 1 ไม่ทราบตำบล", confidence=0.99, ok=True),
            "supplier_tax_id": NField(name="supplier_tax_id", element_id="F4", raw="0123456789012", value="0123456789012", confidence=0.99, ok=True),
        },
        lines=(),
        signatures={},
        pages_complete=True,
    )
    snapshot = type("Snapshot", (), {
        "found": True,
        "active": [ReceiptRow(org_id=101, receipt_num="R1", receiver="WH", line=1, item="A", qty=Decimal(1), uom="PCS", unit_price=Decimal(10), line_amount=Decimal(10))],
        "org_id": 101,
        "receipt_nums": ["R1"],
    })()
    entities = {
        101: {
            "status": "active",
            "tax_id": "0107539000052",
            "name_th": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",
            "name_en": "AAPICO Hitech PLC",
            "addr_th": "99 หมู่ 1 นิคมอุตสาหกรรมไฮเทค ต.บ้านหว้า อ.บางปะอิน จ.พระนครศรีอยุธยา 13160",
            "short": "AH",
        }
    }
    ai_mock = type("AIMock", (), {
        "parse_address": lambda self, addr: {"confidence": 0.65, "house_no": "99", "postal_code": None}
    })()
    std = type("Std", (), {
        "entities": entities,
        "policy": {
            "ai": {
                "v05_address_ai_enabled": True,
                "v05_name_min_confidence": 0.85,
            },
            "evidence": {},
        }
    })()
    c = Ctx(doc=doc, snapshot=snapshot, std=std, entity_ai=ai_mock, ai_trace={})
    res = v05_customer(c)
    assert res.result == "fail"  # NOT manual_review!
    assert len(res.findings) == 1
    assert res.findings[0].code == "E07"
    assert res.findings[0].severity == "Medium"
    assert "AI ไม่มั่นใจเรื่องที่อยู่ลูกค้า" in res.findings[0].message_th


def test_v07_v08_milestone_installment_exact_amount_matches():
    import copy
    from system_a.domain.standard import load_standard
    from system_a.domain.contracts import NLine, NField
    from system_a.domain.matching import MatchGroup
    from system_a.domain.rules import v07_line_match, v08_quantity

    std = copy.deepcopy(load_standard())
    std.policy.setdefault("validation", {})["milestone_installment"] = "exact_amount_pass"
    
    # 1 SET x 42,000 = 42,000
    line1 = NLine(
        line_no=1,
        element_id="L1",
        cells={
            "qty": NField(name="qty", element_id="L1-q", raw="1", value=Decimal("1"), confidence=0.99, ok=True),
            "unit_price": NField(name="unit_price", element_id="L1-p", raw="42000", value=Decimal("42000"), confidence=0.99, ok=True),
            "amount": NField(name="amount", element_id="L1-a", raw="42000", value=Decimal("42000"), confidence=0.99, ok=True),
            "uom": NField(name="uom", element_id="L1-u", raw="SET", value="SET", confidence=0.99, ok=True),
            "description": NField(name="description", element_id="L1-d", raw="Part A 70%", value="Part A 70%", confidence=0.99, ok=True),
        },
        uom_group="SET",
    )
    doc = InvoiceDoc(
        document_id="D1",
        fields={},
        lines=(line1,),
        signatures={},
        pages_complete=True,
    )
    # Receipt: 0.7 SET x 60,000 = 42,000
    rcv_row = ReceiptRow(
        org_id=101, receipt_num="R1", receiver="WH", line=1, item="Part A",
        qty=Decimal("0.7"), uom="SET", unit_price=Decimal("60000"), line_amount=Decimal("42000")
    )
    snapshot = type("Snapshot", (), {
        "found": True,
        "active": [rcv_row],
        "rows": [rcv_row],
        "org_id": 101,
        "receipt_nums": ["R1"],
    })()
    group = MatchGroup(
        group_id="G1",
        relation="1:1",
        level="M1",
        invoice_line_nos=(1,),
        rcv_line_ids=("R1-1",),
        confidence=1.0,
        source="logic",
    )
    ai_mock = type("QtyAIMock", (), {
        "judge": lambda self, payload: {
            "rule_id": "V-08",
            "line_results": [{"invoice_line_no": 1, "result": "pass", "code": None, "severity": None, "message": None}]
        }
    })()
    c = Ctx(doc=doc, snapshot=snapshot, std=std, groups=[group], match_trace={}, qty_ai=ai_mock, ai_trace={})
    res_v07 = v07_line_match(c)
    assert res_v07.result == "pass"

    res_v08 = v08_quantity(c)
    assert res_v08.result == "pass"


def test_v08_uom_mismatch_delegates_to_v07_e10_without_manual_review():
    import copy
    from system_a.domain.standard import load_standard
    from system_a.domain.contracts import NLine, NField
    from system_a.domain.matching import MatchGroup
    from system_a.domain.rules import v07_line_match, v08_quantity
    from system_a.domain.recommendation import recommend

    std = copy.deepcopy(load_standard())
    std.policy.setdefault("validation", {})["v08_uom_mismatch"] = "delegate"
    
    # Line 1: UOM is KG vs receipt EA
    line1 = NLine(
        line_no=1,
        element_id="L1",
        cells={
            "qty": NField(name="qty", element_id="L1-q", raw="10", value=Decimal("10"), confidence=0.99, ok=True),
            "unit_price": NField(name="unit_price", element_id="L1-p", raw="10", value=Decimal("10"), confidence=0.99, ok=True),
            "amount": NField(name="amount", element_id="L1-a", raw="100", value=Decimal("100"), confidence=0.99, ok=True),
            "uom": NField(name="uom", element_id="L1-u", raw="KG", value="KG", confidence=0.99, ok=True),
            "description": NField(name="description", element_id="L1-d", raw="Part B", value="Part B", confidence=0.99, ok=True),
        },
        uom_group="KG",
    )
    doc = InvoiceDoc(
        document_id="D1",
        fields={},
        lines=(line1,),
        signatures={},
        pages_complete=True,
    )
    rcv_row = ReceiptRow(
        org_id=101, receipt_num="R1", receiver="WH", line=1, item="Part B",
        qty=Decimal("10"), uom="EA", unit_price=Decimal("10"), line_amount=Decimal("100")
    )
    snapshot = type("Snapshot", (), {
        "found": True,
        "active": [rcv_row],
        "rows": [rcv_row],
        "org_id": 101,
        "receipt_nums": ["R1"],
    })()
    group = MatchGroup(
        group_id="G1",
        relation="1:1",
        level="M1",
        invoice_line_nos=(1,),
        rcv_line_ids=("R1-1",),
        confidence=1.0,
        source="logic",
    )
    ai_mock = type("QtyAIMock", (), {
        "judge": lambda self, payload: {
            "rule_id": "V-08",
            "line_results": [{"invoice_line_no": 1, "result": "manual_review", "code": None, "severity": None, "message": None}]
        }
    })()
    c = Ctx(doc=doc, snapshot=snapshot, std=std, groups=[group], match_trace={}, qty_ai=ai_mock, ai_trace={})
    res_v07 = v07_line_match(c)
    assert res_v07.result == "fail"
    assert any(f.code == "E10" and f.severity == "Medium" for f in res_v07.findings)

    res_v08 = v08_quantity(c)
    assert res_v08.result != "manual_review"

    rec = recommend([res_v07, res_v08], [])
    assert rec["value"] == "REVIEW"



