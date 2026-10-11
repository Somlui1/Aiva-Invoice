"""S46–S62 — v4 (ORA-02 findings, 2026-10-07).

The receipt is found by the invoice only (TAX-INV), with every key the document itself carries:
the read invoice number, other invoice numbers printed on invoice/delivery pages, the EBS book prefix
("1819/157446") and the receipt number the receiver wrote.  PO-LIST is off.  Plus the milestone split
and the duplicated row block.  All identities are synthetic (see scenarios.py privacy rule).
"""
from __future__ import annotations

from .scenarios import (BRACKET, BUYER_TAX, DS, E, INV_A, PO_A, SUP_TAX, L, R, Scenario, doc, miss, tax_id_of)

TAX = "tax_invoice"
RCV = "RCV-0000046001"
RNUM = "50220099380"                      # synthetic receipt number with an Org-352 shape (502 + 11 digits)


def _with_extra(d: dict, items_by_page: dict, types: dict) -> dict:
    d = dict(d)
    d["extra"] = {"items_by_page": items_by_page, "doc_type_by_page": types}
    return d


def _one(inv_on_receipt: str, *, tax=SUP_TAX, rnum=RCV, columns=None, qty=10, price="100.00", **row):
    e = E(PO_A, inv_on_receipt, [R(PO_A, rnum, 1, BRACKET, qty, "EA", price, **row)], tax=tax)
    if columns:
        e["invoice_columns"] = columns
    return DS([e], {PO_A: SUP_TAX})


LINE = (L(1, "ITM-1001", BRACKET, 10, "EA", "100.00"),)


def s46() -> Scenario:
    return Scenario("S46", "เลข Invoice มีจุด IV.26/0144 (DMS-110) -> ค้นได้ตรงตัว -> AUTO_PASS (v3: ไม่ค้น -> E05)",
                    doc(lines=LINE, invoice="IV.26/0144"), _one("IV.26/0144"), "AUTO_PASS", (),
                    mode=TAX, locked=True, queries=1, checks={"lookup_path": "TAX-INV"})


def s47() -> Scenario:
    return Scenario("S47", "พิมพ์ IM3031 แต่ EBS เก็บ 'IM 3031' (DMS-111) -> เทียบแบบตัดช่องว่าง -> AUTO_PASS",
                    doc(lines=LINE, invoice="IM3031"), _one("IM 3031"), "AUTO_PASS", (),
                    mode=TAX, locked=True, queries=1, checks={"lookup_path": "TAX-INV"})


def s48() -> Scenario:
    return Scenario("S48", "Tax ID ผู้ขายใน EBS มีเลข 2 นำหน้า (DMS-38) -> เทียบ 13 หลักท้าย -> AUTO_PASS",
                    doc(lines=LINE), _one(INV_A, tax="2" + SUP_TAX), "AUTO_PASS", (),
                    mode=TAX, locked=True, queries=1, checks={"lookup_path": "TAX-INV"})


def s49() -> Scenario:
    d = _with_extra(doc(lines=LINE, invoice="OSP-260901084646"),
                    {"1": [{"label": "doc_no", "text": "OSP-260901084646"}],
                     "2": [{"label": "doc_no", "text": "เลขที่ SBX6909/0142"}],
                     "3": [{"label": "doc_no", "text": "Invoice No: SBX6909/0142"}]},
                    {"1": "osp", "2": "tax_invoice", "3": "delivery_note"})
    return Scenario("S49", "อ่านเลขใบสั่งงาน OSP แทนเลขใบกำกับ (DMS-40) แต่หน้าใบกำกับพิมพ์ SBX6909/0142 -> พบ -> AUTO_PASS",
                    d, _one("SBX6909/0142"), "AUTO_PASS", (), mode=TAX, locked=True, queries=1,
                    checks={"lookup_path": "TAX-INV", "invoice_num": "SBX6909/0142"})


def s50() -> Scenario:
    d = _with_extra(doc(lines=LINE),
                    {"2": [{"label": "invoice_ref", "text": "SBX-OTHER-77"}]}, {"2": "tax_invoice"})
    ds = DS([E(PO_A, INV_A, [R(PO_A, RCV, 1, BRACKET, 10, "EA", "100.00")]),
             E(PO_A, "SBX-OTHER-77", [R(PO_A, "RCV-0000050002", 1, BRACKET, 10, "EA", "100.00")])], {PO_A: SUP_TAX})
    return Scenario("S50", "เลขที่อ่านได้พบใบรับ A และเลขอื่นบนเอกสารพบใบรับ B -> เลือกใบของเลขที่อ่านได้เท่านั้น -> AUTO_PASS",
                    d, ds, "AUTO_PASS", (), mode=TAX, locked=True, queries=1,
                    checks={"lookup_path": "TAX-INV", "invoice_num": INV_A})


def _handwritten(sub=None):
    return _with_extra(doc(lines=LINE, invoice="SBX-MISREAD-1", sub=sub),
                       {"1": [{"label": "handwriting", "text": RNUM}]}, {"1": "tax_invoice"})


def s51() -> Scenario:
    return Scenario("S51", "เลข Invoice ไม่พบ แต่เลขใบรับเขียนมือ + ผู้ขาย + ยอดตรง -> พบใบรับ -> MANUAL_REVIEW (ตรวจเลข Invoice) ตรวจกฎต่อครบ",
                    _handwritten(), _one("SBX-REAL-1", rnum=RNUM), "MANUAL_REVIEW", (), mode=TAX, locked=True,
                    queries=3, checks={"lookup_path": "RCV-BY-NUM",
                                       "rule_results": {"V-04": "manual_review", "V-07": "pass", "V-09": "pass"}})


def s52() -> Scenario:
    return Scenario("S52", "เลขใบรับเขียนมือพบใบรับ แต่ยอดไม่ตรง sub_total -> ไม่ยอมรับ -> MANUAL_REVIEW (ไม่พบ)",
                    _handwritten(), _one("SBX-REAL-1", rnum=RNUM, qty=9), "MANUAL_REVIEW", (), mode=TAX,
                    locked=True, queries=3, checks={"lookup_path": None, "rule_results": {"V-04": "manual_review"}})


def s53() -> Scenario:
    return Scenario("S53", "OCR อ่าน Tax ID ผู้ขายเป็นของผู้ซื้อ (DMS-36/72) -> ไม่ใช้ -> หา Tax ID จาก PO -> AUTO_PASS",
                    doc(lines=LINE, supplier_tax=BUYER_TAX), _one(INV_A), "AUTO_PASS", (), mode=TAX, locked=True,
                    queries=2, checks={"lookup_path": "TAX-INV"})


def s54() -> Scenario:
    return Scenario("S54", "ค้นทุกเลขบนเอกสารแล้วไม่พบใบรับ -> MANUAL_REVIEW (v3: E05 HOLD)",
                    doc(lines=LINE, invoice="SBX-NOT-THERE"), _one("SBX-OTHER"), "MANUAL_REVIEW", (),
                    mode=TAX, locked=True, queries=1, checks={"rule_results": {"V-04": "manual_review"}})


def _milestone():
    lines = (L(1, "", "DIE SET C/F RH 70%", 1, "SET", "42000.00"),)
    ds = _one(INV_A, qty="0.7", price="60000")
    ds["receipts"][0]["rows"][0]["UOM"] = "SET"
    ds["receipts"][0]["rows"][0]["ITEM"] = "DIE SET C/F RH"
    return doc(lines=lines), ds


def s55() -> Scenario:
    d, ds = _milestone()
    return Scenario("S55", "งวด 70%: ใบแจ้งหนี้ 1 SET x 42,000 / ใบรับ 0.7 SET x 60,000 ยอดเท่ากัน -> MANUAL_REVIEW (ไม่ใช่ E09/E14)",
                    d, ds, "MANUAL_REVIEW", (), mode=TAX, locked=True, queries=1,
                    checks={"rule_results": {"V-07": "manual_review", "V-09": "pass"}},
                    policy={"validation": {"milestone_installment": "manual_review"}})


def s56() -> Scenario:
    d, ds = _milestone()
    return Scenario("S56", "เหมือน S55 แต่ปิด milestone_installment -> พฤติกรรมเดิม E09 + E14 (HOLD)",
                    d, ds, "HOLD", ("E09", "E14"), mode=TAX, locked=True, queries=1,
                    policy={"validation": {"milestone_installment": "off"}})


def _dup_block():
    rows = [L(i, f"ITM-{i}00{i}", f"ITM-{i}00{i} PART {i}", i, "EA", f"{10 * i}.00") for i in range(1, 5)]
    tail = [L(5, "ITM-3003", "ITM-3003 PART 3", 3, "EA", "30.00"), L(6, "ITM-4004", "ITM-4004 PART 4", 4, "EA", "40.00")]
    total = sum(i * 10 * i for i in range(1, 5))                                         # 300.00
    d = doc(lines=tuple(rows + tail), sub=f"{total:.2f}", vat="21.00", grand=f"{total + 21:.2f}",
            fields={"sub_total": miss("NOT_A_NUMBER")})
    ds = DS([E(PO_A, INV_A, [R(PO_A, RCV, i, f"PART {i}", i, "EA", f"{10 * i}.00") for i in range(1, 5)])],
            {PO_A: SUP_TAX})
    return d, ds


def s57() -> Scenario:
    d, ds = _dup_block()
    return Scenario("S57", "แถวท้ายตารางพิมพ์ซ้ำ 2 แถว (DMS-26) sub_total อ่านไม่ได้ -> ตัดเมื่อยอดที่เหลือ = ใบรับ -> E01 อย่างเดียว",
                    d, ds, "REVIEW", ("E01",), mode=TAX, locked=True, queries=1)


def s58() -> Scenario:
    return Scenario("S58", "แบบ S29 (ใบรับคีย์เลขอื่น) แต่ v4 ปิด PO-LIST -> ไม่เดาจากประวัติ PO -> MANUAL_REVIEW",
                    doc(lines=LINE),
                    DS([E(PO_A, "OTHER-REF-9", [R(PO_A, RCV, 1, BRACKET, 10, "EA", "100.00")])], {PO_A: SUP_TAX}),
                    "MANUAL_REVIEW", (), mode=TAX, locked=True, queries=1, checks={"lookup_path": None})


def s59() -> Scenario:
    wrong = tax_id_of("321654987012")
    return Scenario("S59", "Tax ID ผู้ขายจาก OCR ผิด (สลับ/อ่านผิด, DMS-45/58) TAX-INV ไม่พบ -> ใช้ผู้ขายของ PO -> AUTO_PASS",
                    doc(lines=LINE, supplier_tax=wrong), _one(INV_A), "AUTO_PASS", (), mode=TAX, locked=True,
                    queries=3, checks={"lookup_path": "TAX-INV"})


def s60() -> Scenario:
    ds = _one("IM 3031", tax=None)
    ds["receipts"][0]["vendor"] = "VENDOR-SBX-1"
    ds["po_supplier"] = {}                                # EBS keeps no Tax ID for this supplier
    return Scenario("S60", "ผู้ขายไม่มี Tax ID ใน EBS (DMS-111) -> ค้นเลข Invoice กับผู้ขายของ PO (INV-BY-PO-VENDOR) -> AUTO_PASS",
                    doc(lines=LINE, invoice="IM3031"), ds, "AUTO_PASS", (), mode=TAX, locked=True, queries=3,
                    checks={"lookup_path": "INV-BY-PO-VENDOR"})


def _book_prefix(qty=10):
    d = _with_extra(doc(lines=LINE, invoice=PO_A),
                    {"2": [{"label": "doc_no", "text": "157446"}]}, {"2": "tax_invoice"})
    return d, _one("1819/157446", qty=qty)


def s61() -> Scenario:
    d, ds = _book_prefix()
    return Scenario("S61", "อ่านเลข PO เป็นเลข Invoice (DMS-96) แต่หน้า 2 พิมพ์ 157446 และ EBS เก็บ 1819/157446 + ยอดตรง -> AUTO_PASS",
                    d, ds, "AUTO_PASS", (), mode=TAX, locked=True, queries=2,
                    checks={"lookup_path": "TAX-INV-SUFFIX", "invoice_num": "157446"})


def s62() -> Scenario:
    d, ds = _book_prefix(qty=9)
    return Scenario("S62", "เหมือน S61 แต่ยอดใบรับไม่ตรง sub_total -> ไม่ยอมรับ -> MANUAL_REVIEW + E01 (เลข Invoice = เลข PO)",
                    d, ds, "MANUAL_REVIEW", ("E01",), mode=TAX, locked=True, queries=2,
                    checks={"lookup_path": None})


V4 = [s46(), s47(), s48(), s49(), s50(), s51(), s52(), s53(), s54(), s55(), s56(), s57(), s58(), s59(), s60(),
      s61(), s62()]
