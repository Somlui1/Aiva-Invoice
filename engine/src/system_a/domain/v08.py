"""V-08 Quantity — AI decides (OQ-03), code supplies facts and a consistency guard.

``build_payload`` computes every number with Decimal (prompt rule A3).
``guard`` never flips an AI verdict to pass/fail; a disagreement becomes ``manual_review``.
"""
from __future__ import annotations

from collections import Counter
from decimal import Decimal
from typing import Sequence

from .contracts import InvoiceDoc, NLine, ReceiptRow
from .standard import Standard


def build_payload(doc: InvoiceDoc, groups, rows: dict[str, ReceiptRow], std: Standard) -> tuple[dict, dict]:
    lines = {l.line_no: l for l in doc.lines}
    inv_lines, mg, facts, expected = [], [], {}, {}
    for l in doc.lines:
        inv_lines.append({"invoice_line_no": l.line_no, "description": l.v("description") or "",
                          "qty_inv": None if l.v("qty") is None else str(l.v("qty")), "uom_group": l.uom_group})
    for g in groups:
        rcv = [rows[i] for i in g.rcv_line_ids]
        mg.append({"group_id": g.group_id, "relation": g.relation, "match_level": g.level,
                   "invoice_line_nos": list(g.invoice_line_nos),
                   "rcv_lines": [{"rcv_line": r.rcv_line_id, "qty_rcv": str(r.qty),
                                  "uom_group": std.uom_group(r.uom)} for r in rcv]})
        if g.relation == "UNMATCHED":
            for n in g.invoice_line_nos:
                expected[n] = ("not_evaluated", None)
            continue
        uom_mode = str((std.policy.get("validation") or {}).get("v08_uom_mismatch") or "delegate")
        ug = {std.uom_group(r.uom) for r in rcv} | {lines[n].uom_group for n in g.invoice_line_nos}
        if ((std.policy.get("validation") or {}).get("uom_mismatch") or {}).get("unknown_unit_uses_price"):
            comparable = len(ug - {None}) <= 1        # v5: a unit missing on one side does not block qty
        else:
            comparable = len(ug) == 1 and None not in ug
        rsum = sum((r.qty for r in rcv), Decimal(0))
        # Pure numeric arithmetic override: when logic established 1:1, N:1, or 1:N match and amounts/quantities match, UOM is comparable
        if not comparable and (g.source == "logic" or g.level == "M1"):
            if g.relation == "1:1" and len(rcv) == 1:
                l0 = lines[g.invoice_line_nos[0]]
                if (l0.v("qty") == rcv[0].qty and l0.v("amount") is not None and
                        abs(l0.v("amount") - rcv[0].line_amount) <= std.tol("line_math")):
                    comparable = True
            elif g.relation == "N:1" and len(rcv) == 1:
                all_q = [lines[x].v("qty") for x in g.invoice_line_nos]
                all_a = [lines[x].v("amount") for x in g.invoice_line_nos]
                if None not in all_q and None not in all_a:
                    if (sum(all_q, Decimal(0)) == rcv[0].qty and
                            abs(sum(all_a, Decimal(0)) - rcv[0].line_amount) <= std.tol("line_math")):
                        comparable = True
            elif g.relation == "1:N" and len(g.invoice_line_nos) == 1:
                l0 = lines[g.invoice_line_nos[0]]
                tot_ra = sum((r.line_amount for r in rcv), Decimal(0))
                if (l0.v("qty") == rsum and l0.v("amount") is not None and
                        abs(l0.v("amount") - tot_ra) <= std.tol("line_math")):
                    comparable = True

        service_units = {"JOB", "LOT", "เหมา", "งาน", "SERVICE", "ACTIVITY"}
        per = []
        if g.relation == "N:1":
            all_qty = [lines[n].v("qty") for n in g.invoice_line_nos]
            has_none = any(q is None for q in all_qty)
            inv_sum = None if has_none else sum(all_qty, Decimal(0))
            diff = None if inv_sum is None else inv_sum - rsum
            all_a = [lines[x].v("amount") for x in g.invoice_line_nos]
            tot_a = None if (None in all_a or not all_a) else sum(all_a, Decimal(0))
            amt_match = tot_a is not None and len(rcv) == 1 and abs(tot_a - rcv[0].line_amount) <= std.tol("line_math")
            is_service = has_none or any(lines[x].uom_group in service_units for x in g.invoice_line_nos) or any(std.uom_group(r.uom) in service_units for r in rcv)
            for n in g.invoice_line_nos:
                per.append({"invoice_line_no": n, "qty_rcv_compared": str(rsum),
                            "qty_diff": None if diff is None else str(diff)})
                if not comparable:
                    if is_service and amt_match:
                        expected[n] = ("pass", None)
                    else:
                        expected[n] = ("not_evaluated", None) if uom_mode == "delegate" else ("manual_review", None)
                elif diff is None:
                    if is_service and amt_match:
                        expected[n] = ("pass", None)
                    else:
                        expected[n] = ("manual_review", None)
                elif diff == 0:
                    expected[n] = ("pass", None)
                else:
                    expected[n] = ("fail", "E14" if diff > 0 else "E15")
        else:
            for n in g.invoice_line_nos:
                q = lines[n].v("qty")
                cmp_ = rsum if g.relation == "1:N" else rcv[0].qty     # B2 sum lots · B1 per line
                diff = None if q is None else q - cmp_
                per.append({"invoice_line_no": n, "qty_rcv_compared": str(cmp_),
                            "qty_diff": None if diff is None else str(diff)})
                tot_ra = sum((r.line_amount for r in rcv), Decimal(0))
                target_rcv_amt = tot_ra if g.relation == "1:N" else (rcv[0].line_amount if rcv else Decimal(0))
                is_service = (q is None or lines[n].uom_group in service_units or any(std.uom_group(r.uom) in service_units for r in rcv))
                amt_match = (lines[n].v("amount") is not None and abs(lines[n].v("amount") - target_rcv_amt) <= std.tol("line_math"))
                if not comparable:
                    if is_service and amt_match:
                        expected[n] = ("pass", None)
                    else:
                        expected[n] = ("not_evaluated", None) if uom_mode == "delegate" else ("manual_review", None)
                elif diff is None:
                    if is_service and amt_match:
                        expected[n] = ("pass", None)
                    else:
                        expected[n] = ("manual_review", None)
                elif diff == 0:
                    expected[n] = ("pass", None)
                else:
                    expected[n] = ("fail", "E14" if diff > 0 else "E15")
        facts[g.group_id] = {"uom_comparable": comparable, "rcv_qty_sum": str(rsum), "per_line": per}
    return {"INVOICE_LINES": inv_lines, "MATCH_GROUPS": mg, "COMPUTED_FACTS": facts}, expected


def decide(payload: dict, expected: dict) -> list[dict]:
    """v5 logic mode: every line verdict straight from COMPUTED_FACTS (same shape as the AI answer)."""
    inv = {l["invoice_line_no"]: l for l in payload["INVOICE_LINES"]}
    grp = {n: g for g in payload["MATCH_GROUPS"] for n in g["invoice_line_nos"]}
    per = {}
    for g in payload["MATCH_GROUPS"]:
        for p in (payload["COMPUTED_FACTS"].get(g["group_id"]) or {}).get("per_line", []):
            per[p["invoice_line_no"]] = p
    out = []
    for n, (res, code) in sorted(expected.items()):
        g, p, line = grp.get(n) or {}, per.get(n) or {}, inv.get(n) or {}
        msg = None
        if code:
            word = "เกินใบรับ" if code == "E14" else "น้อยกว่าใบรับ"
            msg = (f"บรรทัดที่ {n} (Invoice: {line.get('description') or '-'}): จำนวนวางบิล{word} "
                   f"(Inv: {line.get('qty_inv')}, Rcv: {p.get('qty_rcv_compared')})")[:160]
        if res == "not_evaluated":
            reason = "V-07 ระบุบรรทัดใบรับไม่ได้" if g.get("relation") == "UNMATCHED" else "DELEGATED_TO_V07_E10"
        elif res == "manual_review":
            reason = "หน่วยนับต่างกลุ่มหรือ qty เป็น null"
        elif line.get("qty_inv") is None:
            reason = "service line amount match"
        else:
            reason = "ตาม COMPUTED_FACTS"
        out.append({"invoice_line_no": n, "group_id": g.get("group_id"), "relation": g.get("relation"),
                    "qty_inv": line.get("qty_inv"), "qty_rcv_compared": p.get("qty_rcv_compared"),
                    "qty_diff": p.get("qty_diff"), "result": res, "code": code,
                    "severity": {"E14": "High", "E15": "Medium"}.get(code), "message": msg, "reason": reason})
    return out


def vote(answers: list[dict]) -> tuple[dict, bool]:
    """Self-consistency: per-line majority of (result, code).  Returns (merged, unanimous_or_majority)."""
    if len(answers) == 1:
        return answers[0], True
    by_line: dict[int, list] = {}
    for a in answers:
        for lr in a.get("line_results", []):
            by_line.setdefault(lr["invoice_line_no"], []).append(lr)
    merged, ok = [], True
    for n, lrs in sorted(by_line.items()):
        (key, cnt), = Counter((x["result"], x.get("code")) for x in lrs).most_common(1)
        if cnt * 2 <= len(answers):
            ok = False
            merged.append({**lrs[0], "result": "manual_review", "code": None, "severity": None,
                           "reason": "AI_NO_MAJORITY"})
        else:
            merged.append(next(x for x in lrs if (x["result"], x.get("code")) == key))
    return {"rule_id": "V-08", "line_results": merged}, ok


def guard(ai: dict, expected: dict, enabled: bool = True) -> tuple[list[dict], list[dict]]:
    """Returns (line_results, disagreements)."""
    seen = {lr["invoice_line_no"]: lr for lr in ai.get("line_results", []) if isinstance(lr, dict)}
    out, dis = [], []
    for n, (exp_res, exp_code) in sorted(expected.items()):
        if exp_res == "not_evaluated":
            out.append({"invoice_line_no": n, "result": "not_evaluated", "code": None, "severity": None,
                        "message": None, "reason": "DELEGATED_TO_V07_E10"})
            continue
        lr = seen.get(n)
        if lr is None:
            out.append({"invoice_line_no": n, "result": "manual_review", "code": None, "severity": None,
                        "message": None, "reason": "AI_LINE_MISSING"})
            dis.append({"invoice_line_no": n, "reason": "missing"})
            continue
        if lr.get("code") not in (None, "E14", "E15"):
            lr = {**lr, "result": "manual_review", "code": None, "reason": "AI_INVALID_CODE"}
        if enabled and (lr["result"], lr.get("code")) != (exp_res, exp_code) and lr["result"] != "manual_review":
            dis.append({"invoice_line_no": n, "ai": [lr["result"], lr.get("code")], "facts": [exp_res, exp_code]})
            lr = {**lr, "result": "manual_review", "code": None, "severity": None, "reason": "AI_FACTS_DISAGREE"}
        out.append(lr)
    return out, dis


def validate_unit_price_groups(lines: Sequence[NLine], rcv_rows: Sequence[ReceiptRow], tol: Decimal = Decimal("0.02")) -> list[str]:
    """Group invoice lines and Oracle receipt rows by unit price and validate sum_qty and sum_amount."""
    inv_groups: dict[Decimal, dict] = {}
    for l in lines:
        p = getattr(l, "unit_price", None)
        if p is None and hasattr(l, "v"):
            p = l.v("unit_price")
        q = getattr(l, "qty", None)
        if q is None and hasattr(l, "v"):
            q = l.v("qty")
        a = getattr(l, "amount", None)
        if a is None and hasattr(l, "v"):
            a = l.v("amount")
        if p is None:
            continue
        try:
            dp = Decimal(str(p)).quantize(Decimal("0.01"))
        except Exception:
            continue
        if dp <= 0:
            continue
        entry = inv_groups.setdefault(dp, {"qty": Decimal(0), "amount": Decimal(0), "lines": [], "has_qty": False})
        if q is not None:
            try:
                dq = Decimal(str(q))
                if dq > 0:
                    entry["qty"] += dq
                    entry["has_qty"] = True
            except Exception:
                pass
        try:
            entry["amount"] += Decimal(str(a or 0))
        except Exception:
            pass
        entry["lines"].append(getattr(l, "line_no", None))

    orc_groups: dict[Decimal, dict] = {}
    for r in rcv_rows:
        if r.qty <= 0:
            continue
        p = r.unit_price
        if p is None:
            continue
        try:
            dp = Decimal(str(p)).quantize(Decimal("0.01"))
        except Exception:
            continue
        entry = orc_groups.setdefault(dp, {"qty": Decimal(0), "amount": Decimal(0), "rcv_ids": []})
        entry["qty"] += Decimal(str(r.qty or 0))
        amt = r.line_amount if r.line_amount is not None else (r.qty * r.unit_price)
        entry["amount"] += Decimal(str(amt or 0))
        entry["rcv_ids"].append(r.rcv_line_id)

    errors = []
    for dp, inv in sorted(inv_groups.items()):
        orc = orc_groups.get(dp, {"qty": Decimal(0), "amount": Decimal(0)})
        q_diff = abs(inv["qty"] - orc["qty"])
        a_diff = abs(inv["amount"] - orc["amount"])
        is_mismatch = (q_diff > tol or a_diff > tol) if inv["has_qty"] else (a_diff > tol)
        if is_mismatch:
            errors.append(f"unit_price:{dp:.2f}(qty_inv={inv['qty']},qty_orc={orc['qty']},amt_inv={inv['amount']},amt_orc={orc['amount']})")

    return errors


def evaluate_v08_lines(lines: Sequence[NLine], rcv_rows: Sequence[ReceiptRow], tol: Decimal = Decimal("0.02")) -> list[str]:
    return validate_unit_price_groups(lines, rcv_rows, tol)
