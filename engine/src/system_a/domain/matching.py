"""V-07 line resolution: M1 by logic, M3/M4/M5 proposed by AI (OQ-08), then validated by logic.

The AI is the primary matcher for everything that is not a unique 1:1 price match.
Guardrails do not override its judgement; they only reject references to lines that
do not exist / are reused / form N:M groups — those become ``manual_review``.
"""
from __future__ import annotations

import itertools
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

from .contracts import InvoiceDoc, ReceiptRow
from .ports import LineMatcherAI
from .standard import Standard

LEVEL_CONF = {"M1": 1.0, "M3": 0.90, "M4": 0.85, "M5": 0.80}



@dataclass(frozen=True)
class MatchGroup:
    group_id: str
    relation: str                 # 1:1 | 1:N | N:1 | UNMATCHED
    level: str                    # M1 | M3 | M4 | M5 | NONE
    invoice_line_nos: tuple
    rcv_line_ids: tuple
    confidence: float
    source: str                   # logic | ai | guardrail
    rationale: Optional[str] = None


def _uom_ok(l, r, std: Standard) -> bool:
    """Units comparable for pairing.  v5 (validation.uom_mismatch.unknown_unit_uses_price): a unit missing
    on either side does not exclude the pair - the price decides (V-07)."""
    rg = std.uom_group(r.uom)
    if l.uom_group is None or rg == l.uom_group:
        return True
    return not rg and bool(((std.policy.get("validation") or {}).get("uom_mismatch") or {})
                           .get("unknown_unit_uses_price"))


def _price_eq(a, b, std: Standard) -> bool:
    return a is not None and b is not None and abs(a - b) <= std.tol("price_exact")


def line_po(line, rows) -> Optional[str]:
    """First PO printed on the line that Oracle also returned for this invoice (else None)."""
    known = {r.po_number for r in rows if r.po_number}
    return next((p for p in getattr(line, "po_refs", ()) if p in known), None)


def _key(s) -> str:
    return "".join(ch for ch in str(s or "").upper() if ch.isalnum())


def _code_on_line(line, r) -> bool:
    code = _key(r.item_code or (r.extra or {}).get("ITEM_CODE"))
    if len(code) < 6:
        return False
    text = _key(line.cells.get("description").raw if line.cells.get("description") is not None else "") + \
        _key(line.cells.get("item_code").raw if line.cells.get("item_code") is not None else "")
    return code in text


def _values_equal(l, r, std: Standard) -> bool:
    q, p, a = l.v("qty"), l.v("unit_price"), l.v("amount")
    if None in (q, p, a):
        return False
    return (_price_eq(p, r.unit_price, std) and q == r.qty and abs(a - r.line_amount) <= std.tol("line_math")
            and _uom_ok(l, r, std))


def _narrow(l, cands, rows):
    """Tie-breaks in order; each is applied only when it keeps at least one candidate."""
    po = line_po(l, rows)
    if len(cands) > 1 and po:
        cands = [r for r in cands if r.po_number == po] or cands
    if len(cands) > 1:
        by_code = [r for r in cands if _code_on_line(l, r)]
        cands = by_code or cands
    return cands


def _numeric_match(l, r, std: Standard) -> bool:
    """True when (qty, unit_price, amount) all equal the receipt line within arithmetic tolerance,
    regardless of UOM or description."""
    q, p, a = l.v("qty"), l.v("unit_price"), l.v("amount")
    if None in (q, p, a):
        return False
    return (_price_eq(p, r.unit_price, std) and q == r.qty and abs(a - r.line_amount) <= std.tol("line_math"))


def _exact_numeric_pair(l, inv: dict, rcv: dict, rows, std: Standard):
    cands = _narrow(l, [r for r in rcv.values() if _numeric_match(l, r, std)], rows)
    if not cands:
        return None
    if len(cands) == 1:
        r = cands[0]
        back = _narrow_inv(r, [x for x in inv.values() if _numeric_match(x, r, std)], rows)
        return r if back == [l] else None
    # Interchangable identical lines: if candidate count equals matching invoice lines, pair first
    back = [x for x in inv.values() if _numeric_match(x, cands[0], std)]
    if len(cands) == len(back):
        return cands[0]
    return None


def _find_n_to_1_match(inv: dict, rcv: dict, rows, std: Standard):
    """N invoice lines with the same unit price aggregating to 1 receipt line."""
    for rid, r in list(rcv.items()):
        cands = [l for l in inv.values()
                 if _price_eq(l.v("unit_price"), r.unit_price, std)
                 and l.v("qty") is not None and l.v("amount") is not None]
        if r.po_number:
            po_cands = [l for l in cands if line_po(l, rows) in (None, r.po_number)]
            if po_cands:
                cands = po_cands
        if len(cands) < 2:
            continue
        tot_q = sum((l.v("qty") for l in cands), Decimal(0))
        tot_a = sum((l.v("amount") for l in cands), Decimal(0))
        if tot_q == r.qty and abs(tot_a - r.line_amount) <= std.tol("line_math"):
            return [l.line_no for l in cands], rid
        if len(cands) <= 10:
            found = []
            for k in range(2, len(cands)):
                for sub in itertools.combinations(cands, k):
                    sq = sum((x.v("qty") for x in sub), Decimal(0))
                    sa = sum((x.v("amount") for x in sub), Decimal(0))
                    if sq == r.qty and abs(sa - r.line_amount) <= std.tol("line_math"):
                        found.append([x.line_no for x in sub])
            if len(found) == 1:
                return found[0], rid
    return None, None


def _find_1_to_n_match(inv: dict, rcv: dict, rows, std: Standard):
    """1 invoice line aggregating to N receipt lines with the same unit price."""
    for n, l in list(inv.items()):
        q, p, a = l.v("qty"), l.v("unit_price"), l.v("amount")
        if None in (q, p, a):
            continue
        cands = [r for r in rcv.values() if _price_eq(p, r.unit_price, std)]
        po = line_po(l, rows)
        if po:
            po_cands = [r for r in cands if r.po_number in (None, po)]
            if po_cands:
                cands = po_cands
        if len(cands) < 2:
            continue
        tot_q = sum((r.qty for r in cands), Decimal(0))
        tot_a = sum((r.line_amount for r in cands), Decimal(0))
        if tot_q == q and abs(tot_a - a) <= std.tol("line_math"):
            return n, [r.rcv_line_id for r in cands]
        if len(cands) <= 10:
            found = []
            for k in range(2, len(cands)):
                for sub in itertools.combinations(cands, k):
                    sq = sum((x.qty for x in sub), Decimal(0))
                    sa = sum((x.line_amount for x in sub), Decimal(0))
                    if sq == q and abs(sa - a) <= std.tol("line_math"):
                        found.append([x.rcv_line_id for x in sub])
            if len(found) == 1:
                return n, found[0]
    return None, None


def _exact_value_pair(l, inv: dict, rcv: dict, rows, std: Standard):
    cands = _narrow(l, [r for r in rcv.values() if _values_equal(l, r, std)], rows)
    if len(cands) != 1:
        return None
    r = cands[0]
    back = _narrow_inv(r, [x for x in inv.values() if _values_equal(x, r, std)], rows)
    return r if back == [l] else None


def _narrow_inv(r, lines, rows):
    if len(lines) > 1 and r.po_number:
        lines = [x for x in lines if line_po(x, rows) in (None, r.po_number)] or lines
        lines = [x for x in lines if line_po(x, rows) == r.po_number] or lines
    if len(lines) > 1:
        lines = [x for x in lines if _code_on_line(x, r)] or lines
    return lines


def _tie_reason(l, r, rows) -> str:
    bits = []
    if line_po(l, rows) == r.po_number and r.po_number:
        bits.append(f"PO {r.po_number}")
    if _code_on_line(l, r):
        bits.append(f"ITEM {r.item_code or (r.extra or {}).get('ITEM_CODE')}")
    return " + ".join(bits) or "คู่เดียวที่ตัวเลขตรง"


def inv_payload(doc: InvoiceDoc, rows=()) -> list[dict]:
    out = _inv_payload(doc)
    for d, l in zip(out, doc.lines):
        po = line_po(l, rows)
        if po:
            d["po_number"] = po                    # only when confirmed by Oracle: legacy prompt unchanged
    return out


def _inv_payload(doc: InvoiceDoc) -> list[dict]:
    return [{"invoice_line_no": l.line_no, "item_code": l.v("item_code"), "description": l.v("description"),
             "qty": str(l.v("qty")) if l.v("qty") is not None else None, "uom": l.v("uom"), "uom_group": l.uom_group,
             "unit_price": str(l.v("unit_price")) if l.v("unit_price") is not None else None,
             "amount": str(l.v("amount")) if l.v("amount") is not None else None} for l in doc.lines]


def rcv_payload(rows, std: Standard) -> list[dict]:
    """Receipt lines for the V-07 AI matcher.  ``po_number`` / ``item_code`` (AIVA-SYSA-ORA-01) are added
    only when Oracle returned them, so a single-PO legacy prompt is unchanged."""
    out = []
    for r in rows:
        d = {"rcv_line_id": r.rcv_line_id, "item": r.item, "qty": str(r.qty), "uom": r.uom,
             "uom_group": std.uom_group(r.uom), "unit_price": str(r.unit_price), "line_amount": str(r.line_amount)}
        if r.po_number:
            d["po_number"] = r.po_number
        if r.item_code:
            d["item_code"] = r.item_code
        out.append(d)
    return out


def resolve(doc: InvoiceDoc, active: tuple[ReceiptRow, ...], std: Standard,
            ai: Optional[LineMatcherAI]) -> tuple[list[MatchGroup], dict]:
    groups: list[MatchGroup] = []
    trace: dict = {"ai_rejected": [], "ai_called": False}
    inv = {l.line_no: l for l in doc.lines}
    rcv = {r.rcv_line_id: r for r in active}
    gid = lambda: f"G{len(groups) + 1}"

    # ---- M1 (logic): Pure numeric 1:1 match (qty, price, amount match; UOM/description agnostic)
    for n, l in sorted(inv.items()):
        if n not in inv:
            continue
        r = _exact_numeric_pair(l, inv, rcv, active, std)
        if r is None:
            continue
        groups.append(MatchGroup(gid(), "1:1", "M1", (n,), (r.rcv_line_id,), 1.0, "logic",
                                 "ราคา/จำนวน/ยอดตรง + " + _tie_reason(l, r, active)))
        inv.pop(n), rcv.pop(r.rcv_line_id)

    # ---- M1 (logic): price equals exactly one receipt line, mutually unique, same UOM group
    for n, l in list(inv.items()):
        p = l.v("unit_price")
        # a line whose unit was not printed/read (uom_group None) is not excluded: the unit is
        # inherited from the receipt afterwards (domain/evidence.corroborate_lines)
        cands = [r for r in rcv.values() if _price_eq(p, r.unit_price, std)
                 and _uom_ok(l, r, std)]
        if len(cands) > 1:
            # 1 invoice -> several POs: the PO printed on the line decides between equal prices
            po = line_po(l, active)
            if po:
                cands = [r for r in cands if r.po_number == po]
        if len(cands) != 1:
            continue
        r = cands[0]
        rivals = [x for x in inv.values() if x.line_no != n and _price_eq(x.v("unit_price"), r.unit_price, std)]
        if rivals and r.po_number and line_po(l, active) == r.po_number:
            # a rival with the same price but a different confirmed PO cannot claim this receipt line
            rivals = [x for x in rivals if line_po(x, active) in (None, r.po_number)]
        if rivals:
            continue
        groups.append(MatchGroup(gid(), "1:1", "M1", (n,), (r.rcv_line_id,), 1.0, "logic", "ราคาตรงบรรทัดเดียว"))
        inv.pop(n), rcv.pop(r.rcv_line_id)

    # ---- M1 by exact values + item code (logic) — policy.matching.m1_exact_values_item_code
    if (std.policy.get("matching") or {}).get("m1_exact_values_item_code", False):
        for n, l in sorted(inv.items()):
            if n not in inv:
                continue
            r = _exact_value_pair(l, inv, rcv, active, std)
            if r is None:
                continue
            groups.append(MatchGroup(gid(), "1:1", "M1", (n,), (r.rcv_line_id,), 1.0, "logic",
                                     "ราคา/จำนวน/ยอดตรง + " + _tie_reason(l, r, active)))
            inv.pop(n), rcv.pop(r.rcv_line_id)

    # ---- N:1 (logic): multiple invoice lines aggregate to 1 receipt line of same price
    while True:
        ins, rid = _find_n_to_1_match(inv, rcv, active, std)
        if not ins:
            break
        groups.append(MatchGroup(gid(), "N:1", "M1", tuple(sorted(ins)), (rid,), 1.0, "logic",
                                 "รวมหลายบรรทัดวางบิลตรง 1 บรรทัดใบรับ (ราคาเท่ากัน)"))
        for n in ins:
            inv.pop(n)
        rcv.pop(rid)

    # ---- 1:N (logic): 1 invoice line aggregates to multiple receipt lines of same price
    while True:
        n, rids = _find_1_to_n_match(inv, rcv, active, std)
        if not n:
            break
        groups.append(MatchGroup(gid(), "1:N", "M1", (n,), tuple(rids), 1.0, "logic",
                                 "1 บรรทัดวางบิลตรงหลายบรรทัดใบรับ (ราคาเท่ากัน)"))
        inv.pop(n)
        for rid in rids:
            rcv.pop(rid)


    # ---- M3/M4/M5 (AI primary)
    if inv and rcv and ai is not None:
        trace["ai_called"] = True
        sub = InvoiceDoc(doc.document_id, doc.fields, tuple(inv.values()), doc.signatures, doc.pages_complete)
        out = ai.propose(inv_payload(sub, active), rcv_payload(list(rcv.values()), std)) or {}
        for g in out.get("groups", []):
            ins = [int(x) for x in g.get("invoice_line_nos", [])]
            rids = [str(x) for x in g.get("rcv_line_ids", [])]
            lvl = g.get("level", "M5")
            why = None
            if not ins or not rids:
                why = "empty_group"
            elif not set(ins) <= inv.keys() or not set(rids) <= rcv.keys():
                why = "unknown_or_reused_line"
            elif len(ins) > 1 and len(rids) > 1:
                why = "n_to_m_not_allowed"
            elif lvl not in ("M3", "M4", "M5"):
                why = "invalid_level"
            if why:
                trace["ai_rejected"].append({"proposal": g, "reason": why})
                continue
            rel = "1:1" if len(ins) == len(rids) == 1 else ("1:N" if len(ins) == 1 else "N:1")
            conf = float(g.get("confidence", LEVEL_CONF[lvl]))
            groups.append(MatchGroup(gid(), rel, lvl, tuple(ins), tuple(rids), conf, "ai", g.get("rationale")))
            for n in ins:
                inv.pop(n)
            for i in rids:
                rcv.pop(i)

    # ---- leftovers
    for n in sorted(inv):
        groups.append(MatchGroup(gid(), "UNMATCHED", "NONE", (n,), (), 0.0,
                                 "guardrail" if trace["ai_rejected"] else ("ai" if trace["ai_called"] else "logic")))
    trace["unmatched_rcv_line_ids"] = sorted(rcv)
    return groups, trace


def price_check(inv_price: Decimal, rcv_price: Decimal, std: Standard) -> str:
    d = abs(inv_price - rcv_price)
    if d <= std.tol("price_exact"):
        return "pass"
    if rcv_price > 0 and d / rcv_price <= std.tol("price_pct") and d <= std.tol("price_abs"):
        return "within_tolerance"
    return "over_tolerance"
