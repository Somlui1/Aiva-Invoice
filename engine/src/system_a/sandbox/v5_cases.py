"""S63–S68 — v5 (2026-10-12): unit rules, "price differs / amount equal", deterministic V-08.

Agreed rules (policy.validation.uom_mismatch / milestone_installment: review / ai.v08_mode: logic):
  1. units in different groups, line amount equal          -> E10 (REVIEW)
  2. unit missing on one or both sides, price equal          -> pass (quantity still checked by V-08)
  3. same/unknown unit, price differs, line amount equal     -> E12 (REVIEW)
  4. anything else that differs                              -> unchanged rules (E09/E14/E03 -> HOLD)
All identities are synthetic (see scenarios.py privacy rule).
"""
from __future__ import annotations

from .scenarios import BRACKET, DS, E, GASKET, INV_A, PO_A, SUP_TAX, L, R, Scenario, doc, miss

TAX = "tax_invoice"
RCV = "RCV-0000063001"


def _ds(*rows):
    return DS([E(PO_A, INV_A, list(rows))], {PO_A: SUP_TAX})


def s63() -> Scenario:
    return Scenario("S63", "ใบแจ้งหนี้พิมพ์ PAC ใบรับเป็น Pack -> กลุ่มเดียวกัน -> AUTO_PASS",
                    doc(lines=(L(1, "T1091-000", "OXYGEN IND PACK (47L X 15)", 1, "PAC", "3100.00"),)),
                    _ds(R(PO_A, RCV, 1, "OXYGEN IND PACK", 1, "Pack", "3100.00")), "AUTO_PASS", (),
                    mode=TAX, locked=True, queries=1)


def s64() -> Scenario:
    return Scenario("S64", "หน่วยต่างกลุ่ม BOX/PCS แต่ยอดบรรทัดเท่ากัน 1,200 -> E10 (REVIEW)",
                    doc(lines=(L(1, "ITM-1001", BRACKET, 1, "BOX", "1200.00"),)),
                    _ds(R(PO_A, RCV, 1, BRACKET, 12, "Piece", "100.00")), "REVIEW", ("E10",),
                    mode=TAX, locked=True, queries=1)


def s65() -> Scenario:
    return Scenario("S65", "หน่วยต่างกลุ่ม และยอดบรรทัดไม่ตรง 1,400 vs 1,200 -> E10 + E09 + E03 (HOLD)",
                    doc(lines=(L(1, "ITM-1001", BRACKET, 1, "BOX", "1400.00"),)),
                    _ds(R(PO_A, RCV, 1, BRACKET, 12, "Piece", "100.00")), "HOLD", ("E03", "E09", "E10"),
                    mode=TAX, locked=True, queries=1)


def s66() -> Scenario:
    lines = (L(1, "ITM-1001", BRACKET, 1, "BOX", "1300.00"), L(2, "ITM-2002", GASKET, 1, "BOX", "1100.00"))
    return Scenario("S66", "หน่วยต่างกลุ่ม 2 บรรทัด ยอดเกิน/ขาดหักลบกันพอดี (V-09 ผ่าน) -> E09 รายบรรทัด (HOLD)",
                    doc(lines=lines),
                    _ds(R(PO_A, RCV, 1, BRACKET, 12, "Piece", "100.00"), R(PO_A, RCV, 2, GASKET, 10, "Piece", "120.00")),
                    "HOLD", ("E09", "E10"), mode=TAX, locked=True, queries=1,
                    checks={"rule_results": {"V-09": "pass"}})


def s67() -> Scenario:
    line = L(1, "ITM-1001", BRACKET, 10, "EA", "100.00")
    line["cells"]["uom"] = miss()
    return Scenario("S67", "ไม่มีหน่วยทั้งใบแจ้งหนี้และใบรับ ราคาเท่ากัน -> AUTO_PASS (จำนวนยังตรวจ)",
                    doc(lines=(line,)), _ds(R(PO_A, RCV, 1, BRACKET, 10, "", "100.00")), "AUTO_PASS", (),
                    mode=TAX, locked=True, queries=1, checks={"rule_results": {"V-08": "pass"}})


def s68() -> Scenario:
    return Scenario("S68", "ราคาต่อหน่วยต่าง (1 x 1,000 vs 2 x 500) แต่ยอดเท่ากัน -> E12 (REVIEW) ไม่ใช่ E09/E15",
                    doc(lines=(L(1, "ITM-1001", BRACKET, 1, "SET", "1000.00"),)),
                    _ds(R(PO_A, RCV, 1, BRACKET, 2, "Set", "500.00")), "REVIEW", ("E12",),
                    mode=TAX, locked=True, queries=1)


V5 = [s63(), s64(), s65(), s66(), s67(), s68()]
