"""Engine 5.6 - V-06 v2.0: any detected mark passes; none -> E08 pointing at the signature box."""
import sys
from decimal import Decimal
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from system_a.domain.contracts import InvoiceDoc, Region, SignatureObs
from system_a.domain.rules import Ctx, v06_signatures
from system_a.perception.single_pass import signature_slot

STD = type("Std", (), {"policy": {"signature": {"min_confidence": 0.8}}})()
SNAP = type("Snap", (), {"found": False, "active": []})()


def _ctx(sigs, complete=True):
    return Ctx(doc=InvoiceDoc("D1", {}, (), sigs, complete), snapshot=SNAP, std=STD)


def test_faint_mark_passes_whatever_the_confidence():
    r = v06_signatures(_ctx({"receiver": SignatureObs(present=True, confidence=0.3),
                             "deliverer": SignatureObs(present=True, confidence=None)}))
    assert r.result == "pass"


def test_empty_box_is_e08_and_points_at_the_box():
    box = Region(page=1, bbox=(0.1, 0.8, 0.3, 0.05))
    r = v06_signatures(_ctx({"receiver": SignatureObs(present=False, region=box),
                             "deliverer": SignatureObs(present=True)}))
    assert r.result == "fail"
    (f,) = r.findings
    assert f.code == "E08" and f.severity == "High" and f.element_ids == ("D1-sig-receiver",)
    assert r.data["signature_boxes"]["receiver"]["page"] == 1
    assert r.data["missing_slots"] == ["receiver"]


def test_unclear_answer_is_not_a_detection():
    r = v06_signatures(_ctx({"receiver": SignatureObs(present=True),
                             "deliverer": SignatureObs(present=None)}))
    assert r.result == "fail" and r.findings[0].severity == "Medium"


def test_no_box_found_is_e08_pointing_at_the_slot_element():
    # v5.7 (E5): the finding always names the slot element; the assembler emits that element for
    # every slot (bbox null) and explains it with bbox_missing_reason, so the Portal shows
    # "no position" with a reason instead of no button.
    r = v06_signatures(_ctx({}))
    assert r.result == "fail" and len(r.findings) == 2
    assert [f.element_ids for f in r.findings] == [("D1-sig-receiver",), ("D1-sig-deliverer",)]
    assert all(f.actual == "no box" and f.expected == "signed" for f in r.findings)
    assert "ไม่พบกล่อง" in r.findings[0].message_th


def test_incomplete_scan_is_still_skipped():
    assert v06_signatures(_ctx({}, complete=False)).result == "not_evaluated"


def test_stamps_map_to_slots():
    assert signature_slot("stamp", "received_stamp") == "receiver"
    assert signature_slot("stamp", "aapico received") == "receiver"
    assert signature_slot("stamp", "company_stamp") == "deliverer"
    assert signature_slot("stamp", "stamp") == "deliverer"
    assert signature_slot("signature_box", "receiver_signature") == "receiver"
    assert signature_slot("signature_box", "authorized_signature") == "deliverer"
    assert signature_slot("signature_box", "something_else") is None


# ---------------------------------------------------- 5.6 follow-up: a mark never looks at confidence
# Owner's ruling (v5.6): "ไม่ต้องใช้ confidence value — ตรวจสอบเจอรอย = ถือว่าเซ็น".
# The stamp fallbacks in normalize are the last place that still read policy.signature.min_confidence.
from types import SimpleNamespace                                    # noqa: E402
from system_a.domain.contracts import RegionNode                    # noqa: E402
from system_a.domain.normalize import _deliverer_from_stamp, _receiver_from_stamp  # noqa: E402


def _ext_with_stamp(label, text="stamped", confidence=0.3):
    rg = RegionNode(region_id="SP-R1", page=1, kind="stamp", label=label, text=text,
                    confidence=confidence, bbox=(0.70, 0.80, 0.20, 0.10))
    return SimpleNamespace(regions=(rg,), documents=[SimpleNamespace(document_id="D1", pages=(1,))],
                           invoice_document_id="D1")


#: production policy has evidence.deliverer_from_stamp on (policy.yaml:100); min_confidence stays in the
#: document only to prove the fallback no longer reads it.
STD_EV = type("Std", (), {"policy": {"signature": {"min_confidence": 0.8},
                                     "evidence": {"deliverer_from_stamp": True}}})()


def test_a_faint_company_stamp_still_counts_as_the_deliverer_mark():
    got = _deliverer_from_stamp(_ext_with_stamp("company_stamp"), STD_EV, {})
    assert got is not None and got.present is True and got.kind == "company_stamp_region"


def test_the_deliverer_stamp_fallback_is_still_switched_off_by_its_policy_flag():
    assert _deliverer_from_stamp(_ext_with_stamp("company_stamp"), STD, {}) is None


def test_a_faint_receiving_stamp_still_counts_as_the_receiver_mark():
    got = _receiver_from_stamp(_ext_with_stamp("received_stamp"), STD, {})
    assert got is not None and got.present is True and got.kind == "received_stamp"


def test_a_slot_that_already_has_a_mark_is_not_overwritten_by_a_stamp():
    box = Region(page=1, bbox=(0.1, 0.8, 0.3, 0.05))
    held = {"deliverer": SignatureObs(present=True, region=box)}
    assert _deliverer_from_stamp(_ext_with_stamp("company_stamp"), STD_EV, held) is None
