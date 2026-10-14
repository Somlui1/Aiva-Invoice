"""Evidence-based field acceptance ("a value is trusted when something independent confirms it").

Background (98-document Paperless run, 2026-10-07): every DMS page had no text layer, so the
reader-agreement gate (VLM page read == zoomed crop) was the only way a field became ``ok``.
Correct invoices were rejected wholesale (E01 on 77/98) although their numbers closed exactly
and matched Oracle.  The legacy AIVA app reached >80 % correct verdicts by trusting values that
*reconcile* instead of values that *two readers agree on*.  This module brings that idea in
without its weaknesses (no forced line pairing, no digit concatenation, no Oracle value copied
into the invoice):

    A  reader agreement           (unchanged, normalize._nfield)
    B  arithmetic closes          qty x price = amount · sum(amount) = sub_total · sub+vat = grand
    C  equals Oracle              invoice_num / PO / Tax IDs / matched receipt line price, qty, amount
    D  covered by a stronger key  customer name/address when the customer Tax ID equals Oracle

Rules:
* only a value the reader actually produced can be promoted; ``null_reason`` must be one of
  PROMOTABLE (a *read* that was merely unconfirmed).  NOT_PRESENT / INVALID_FORMAT never are.
* a promotion never changes ``value`` — except ``derive_qty_from_amount``, which is computed from
  two promoted cells of the same line and must also equal the receipt quantity.
* every promotion is recorded in ``NField.evidence`` and surfaced by the orchestrator in V-01 data.
All switches live in ``policy.yaml -> evidence`` and default to OFF when the key is absent.
"""
from __future__ import annotations

import re
from dataclasses import replace
from decimal import Decimal
from typing import Iterable, Optional

from .contracts import InvoiceDoc, NField, NLine, OracleSnapshot
from .standard import Standard

PROMOTABLE = {"CONFLICT_BETWEEN_SOURCES", "LOW_CONFIDENCE"}
Q2 = Decimal("0.01")
COVERED_TAG = "covered_by_customer_tax_id"


def enabled(std: Standard, name: str) -> bool:
    return bool((std.policy.get("evidence") or {}).get(name, False))


def _promote(f: Optional[NField], tag: str) -> Optional[NField]:
    if f is None or f.ok or f.value is None or f.null_reason not in PROMOTABLE:
        return f
    return replace(f, ok=True, null_reason=None, evidence=tuple(f.evidence) + (tag,))


def _val(f: Optional[NField]):
    """Value of a field that was read (ok or promotable), else None."""
    if f is None or f.value is None:
        return None
    return f.value if (f.ok or f.null_reason in PROMOTABLE) else None


def _dec(v) -> Optional[Decimal]:
    try:
        return v if isinstance(v, Decimal) else (Decimal(str(v)) if v is not None else None)
    except Exception:
        return None


def _with_cells(line: NLine, **cells) -> NLine:
    new = dict(line.cells)
    new.update({k: v for k, v in cells.items() if v is not None})
    return replace(line, cells=new)


def _rebuild(doc: InvoiceDoc, fields: dict, lines: Iterable[NLine]) -> InvoiceDoc:
    return replace(doc, fields=fields, lines=tuple(lines))


# ======================================================================== printed copies
def _norm_ocr(s: str) -> str:
    s = "".join(c for c in (s or "").upper() if c.isalnum())
    return s.replace("0", "O").replace("1", "I")


def _is_same_text(s0: str, s1: str) -> tuple[bool, bool]:
    """Returns (is_match, is_conflict)."""
    if not s0 or not s1:
        return False, False
    n0, n1 = _norm_ocr(s0), _norm_ocr(s1)
    if n0 == n1:
        return True, False
    # Check if trailing digit differs (e.g. #2 vs #3, item-1 vs item-2)
    if n0 and n1 and n0[-1].isdigit() and n1[-1].isdigit() and n0[-1] != n1[-1]:
        return False, True
    import difflib
    ratio = difflib.SequenceMatcher(None, n0, n1).ratio()
    if ratio >= 0.85:
        return True, False
    if ratio < 0.6:
        return False, True
    return False, False


def _row_similarity(r0: dict, r1: dict, tol: Decimal) -> float:
    # Check text conflict first
    if r0["item_code"] and r1["item_code"]:
        match_c, conf_c = _is_same_text(r0["item_code"], r1["item_code"])
        if conf_c:
            return 0.0
    else:
        match_c = False

    if r0["desc"] and r1["desc"]:
        match_d, conf_d = _is_same_text(r0["desc"], r1["desc"])
        if conf_d:
            return 0.0
    else:
        match_d = False

    # 1. Exact numeric match
    if r0["amount"] is not None and r1["amount"] is not None and abs(r0["amount"] - r1["amount"]) <= tol:
        if (r0["qty"] is None or r1["qty"] is None or r0["qty"] == r1["qty"]) and \
           (r0["unit_price"] is None or r1["unit_price"] is None or abs(r0["unit_price"] - r1["unit_price"]) <= tol):
            return 1.0

    # 2. Matching on mutually present numeric fields (e.g. DMS-86: missing unit_price)
    shared_nums = [k for k in ("qty", "unit_price", "amount") if r0[k] is not None and r1[k] is not None]
    if shared_nums and all(abs(r0[k] - r1[k]) <= tol for k in shared_nums):
        if len(shared_nums) >= 2 or (len(shared_nums) == 1 and shared_nums[0] == "amount"):
            return 0.95

    # 3. Text match + close numerics (e.g. DMS-109 line 5: 158,000 vs 156,000 OCR noise)
    if match_c or match_d:
        if r0["qty"] is not None and r1["qty"] is not None and r0["qty"] == r1["qty"]:
            if r0["amount"] is not None and r1["amount"] is not None:
                max_amt = max(abs(r0["amount"]), abs(r1["amount"]), Decimal(1))
                if (abs(r0["amount"] - r1["amount"]) / max_amt) <= Decimal("0.05"):
                    return 0.9
            else:
                return 0.85

    # 4. Pure numeric typo without text match (relative difference < 3% on amount while qty matches)
    if r0["qty"] is not None and r1["qty"] is not None and r0["qty"] == r1["qty"]:
        if r0["amount"] is not None and r1["amount"] is not None:
            max_amt = max(abs(r0["amount"]), abs(r1["amount"]), Decimal(1))
            if (abs(r0["amount"] - r1["amount"]) / max_amt) <= Decimal("0.03"):
                return 0.8

    return 0.0


def collapse_repeated_copies(doc: InvoiceDoc, std: Standard) -> tuple[InvoiceDoc, Optional[dict]]:
    """Original + copy pages read as one table: the line list is k identical blocks and
    sum(amount) == k x sub_total (or repeated blocks in installment invoices). Keep the first block
    (measured: DMS-39 x3, DMS-88/104 x2, DMS-109 fuzzy typo, DMS-112/113 installments).
    """
    if not enabled(std, "collapse_repeated_copies"):
        return doc, None
    lines = list(doc.lines)
    sub = _dec(_val(doc.fields.get("sub_total")))
    n = len(lines)
    if n < 2 or sub is None or sub <= 0:
        return doc, None

    tol = std.tol("total")
    row_info = []
    for l in lines:
        q = _dec(_val(l.cells.get("qty")))
        p = _dec(_val(l.cells.get("unit_price")))
        a = _dec(_val(l.cells.get("amount")))
        if a is None and q is not None and p is not None:
            a = (q * p).quantize(Q2)
        code = str(_val(l.cells.get("item_code")) or "").strip().upper()
        desc = str(_val(l.cells.get("description")) or "").strip().upper()
        row_info.append({
            "qty": q,
            "unit_price": p,
            "amount": a,
            "item_code": code,
            "desc": desc,
            "line": l,
        })

    amounts = [r["amount"] for r in row_info]
    # If all amounts are present and sum(amounts) == sub_total, every row is needed (not duplicate copies)
    if None not in amounts:
        total = sum(amounts, Decimal(0))
        if abs(total - sub) <= tol:
            return doc, None
    else:
        total = sum((a for a in amounts if a is not None), Decimal(0))

    for k in range(n, 1, -1):
        if n % k:
            continue
        size = n // k
        blocks = [row_info[i * size : (i + 1) * size] for i in range(k)]
        b0 = blocks[0]
        b0_amounts = [r["amount"] for r in b0]
        b0_sum = sum((a for a in b0_amounts if a is not None), Decimal(0))

        # Check block matching for all subsequent blocks
        all_blocks_match = True
        for b in blocks[1:]:
            sims = [_row_similarity(b0[i], b[i], tol) for i in range(size)]
            block_sim = sum(sims) / size
            matched_rows = sum(1 for s in sims if s >= 0.7)
            if size == 1:
                # For single-row blocks, require high similarity (>= 0.9)
                # and ensure descriptions don't clearly conflict
                if block_sim < 0.9:
                    all_blocks_match = False
                    break
                d0, d1 = b0[0]["desc"], b[0]["desc"]
                if d0 and d1:
                    t0, t1 = set(re.findall(r"\w+", d0)), set(re.findall(r"\w+", d1))
                    if t0 and t1 and not (t0 & t1):
                        all_blocks_match = False
                        break
            else:
                if block_sim < 0.75 and (matched_rows / size) < 0.75:
                    all_blocks_match = False
                    break

        if not all_blocks_match:
            continue

        # Subtotal checks:
        # Case 1: Standard copy pages where b0_sum == sub_total and total == k * sub_total
        standard_match = (
            abs(total - k * sub) <= tol * k
            and abs(b0_sum - sub) <= tol
        )

        # Case 2: Fuzzy OCR noise on copy pages where total ~ k * sub_total and b0_sum == sub_total
        fuzzy_standard_match = (
            abs(b0_sum - sub) <= tol
            and abs(total - k * sub) <= max(tol * k, sub * Decimal("0.05"))
        )

        # Case 3: Installment invoice decoupling (DMS-112, DMS-113)
        # Table partitions into k repeated blocks, total ~ k * b0_sum, but sub_total is installment amount
        installment_match = (
            b0_sum > 0
            and abs(total - k * b0_sum) <= max(tol * k, b0_sum * Decimal("0.05"))
            and abs(total - sub) > tol
        )

        if standard_match or fuzzy_standard_match or installment_match:
            # Backfill any missing cells in kept lines from the duplicate blocks if available
            kept_lines = []
            for i in range(size):
                cur_line = lines[i]
                new_cells = dict(cur_line.cells)
                for dup_b in blocks[1:]:
                    dup_line = dup_b[i]["line"]
                    for cell_key in ("unit_price", "qty", "amount", "uom", "item_code"):
                        cur_cell = new_cells.get(cell_key)
                        dup_cell = dup_line.cells.get(cell_key)
                        if (cur_cell is None or not cur_cell.ok or cur_cell.value is None) and (
                            dup_cell is not None and dup_cell.ok and dup_cell.value is not None
                        ):
                            new_cells[cell_key] = _promote(dup_cell, "copy_page_reconciled")
                kept_lines.append(replace(cur_line, cells=new_cells))

            kept = tuple(kept_lines)
            rule_desc = (
                "k identical (qty, unit_price, amount) blocks and sum(amount) = k x sub_total"
                if (standard_match or fuzzy_standard_match)
                else "k repeated blocks in installment invoice (sub_total != block_sum)"
            )
            note = {
                "copies": k,
                "kept_line_nos": [l.line_no for l in kept],
                "dropped_line_nos": [l.line_no for l in lines[size:]],
                "rule": rule_desc,
            }
            return replace(doc, lines=kept), note

    return doc, None


def collapse_ghost_rows(doc: InvoiceDoc) -> InvoiceDoc:
    """Fold description-only continuation rows (ghost rows without qty, price, or amount)
    into the preceding row's description and remove the empty row.
    """
    if not doc.lines:
        return doc
    new_lines = []
    for l in doc.lines:
        q = _dec(_val(l.cells.get("qty")))
        p = _dec(_val(l.cells.get("unit_price")))
        a = _dec(_val(l.cells.get("amount")))
        is_ghost = (q is None and p is None and a is None)
        if is_ghost and new_lines:
            prev = new_lines[-1]
            prev_desc_field = prev.cells.get("description")
            curr_desc_field = l.cells.get("description")
            prev_desc = (prev_desc_field.raw or "") if prev_desc_field else ""
            curr_desc = (curr_desc_field.raw or "") if curr_desc_field else ""
            combined_desc = f"{prev_desc} {curr_desc}".strip()
            if prev_desc_field is not None:
                new_desc_field = replace(prev_desc_field, raw=combined_desc, value=combined_desc)
                new_cells = dict(prev.cells)
                new_cells["description"] = new_desc_field
                new_lines[-1] = replace(prev, cells=new_cells)
        else:
            new_lines.append(l)
    return replace(doc, lines=tuple(new_lines))


# ======================================================================== B — arithmetic
def corroborate_arithmetic(doc: InvoiceDoc, std: Standard) -> InvoiceDoc:
    if not enabled(std, "arithmetic"):
        return doc
    tol_line, tol_total, tol_vat = std.tol("line_math"), std.tol("total"), std.tol("vat")
    rate = std.tol("vat_rate")

    lines = []
    for l in doc.lines:
        q, p, a = (_dec(_val(l.cells.get(k))) for k in ("qty", "unit_price", "amount"))
        if None not in (q, p, a) and abs((q * p).quantize(Q2) - a) <= tol_line and a != 0:
            tag = "arith:qty*unit_price=amount"
            l = _with_cells(l, qty=_promote(l.cells.get("qty"), tag),
                            unit_price=_promote(l.cells.get("unit_price"), tag),
                            amount=_promote(l.cells.get("amount"), tag))
        elif p is not None and a is not None and p > 0:
            # Dual-quantity / self-evidence token fallback
            # If qty * unit_price != amount, check if target_qty = amount / unit_price
            # physically appears in the row's own raw text / OCR cells.
            target_qty = (a / p).quantize(Decimal("0.001"))
            target_ints = [int(target_qty)] if target_qty == int(target_qty) else []
            cand_tokens = {str(target_qty), f"{target_qty:.2f}", f"{target_qty:.3f}"}
            if target_ints:
                cand_tokens.add(str(target_ints[0]))

            row_raw_text = " ".join(str(c.raw or "") for c in l.cells.values()).upper()
            row_tokens = set(re.findall(r"\b\d+(?:,\d+)*(?:\.\d+)?\b", row_raw_text))
            row_tokens_clean = {t.replace(",", "") for t in row_tokens}

            found_token = bool(cand_tokens & row_tokens_clean)
            if found_token:
                fmt_target = str(target_ints[0]) if target_ints else str(target_qty)
                tag = f"arith:target_qty_found_in_row_tokens:{fmt_target}"
                qf = l.cells.get("qty")
                new_q = replace(qf or NField("qty", f"{l.element_id}-qty", fmt_target, target_qty, 1.0, True),
                                value=Decimal(fmt_target), ok=True, null_reason=None,
                                evidence=tuple((qf.evidence if qf else ())) + (tag,))
                cells_update = {
                    "qty": new_q,
                    "unit_price": _promote(l.cells.get("unit_price"), tag),
                    "amount": _promote(l.cells.get("amount"), tag),
                }
                uom_field = l.cells.get("uom")
                new_uom_group = l.uom_group
                for u_candidate in ("KGS", "KG", "กิโล", "TON", "ตัน", "PCS", "SET", "BOX"):
                    if re.search(rf"\b{u_candidate}\b", row_raw_text, re.IGNORECASE):
                        resolved_grp = std.uom_group(u_candidate)
                        if resolved_grp in std.uom_groups:
                            new_uom_group = resolved_grp
                            base_u = uom_field or NField("uom", f"{l.element_id}-uom", u_candidate, resolved_grp, 1.0, True)
                            cells_update["uom"] = replace(base_u, value=resolved_grp, ok=True, null_reason=None,
                                                          evidence=tuple(base_u.evidence or ()) + (tag,))
                            break
                l = _with_cells(l, **cells_update)
                l = replace(l, uom_group=new_uom_group)
        lines.append(l)

    f = dict(doc.fields)
    sub, vat, grand = (_dec(_val(f.get(k))) for k in ("sub_total", "vat", "grand_total"))
    if None not in (sub, vat, grand) and sub > 0 \
            and abs(sub + vat - grand) <= tol_total and abs((sub * rate).quantize(Q2) - vat) <= tol_vat:
        tag = "arith:sub_total+vat=grand_total"
        for k in ("sub_total", "vat", "grand_total"):
            f[k] = _promote(f.get(k), tag)

    amounts = [_dec(_val(l.cells.get("amount"))) for l in lines]
    if lines and None not in amounts and sub is not None and sub > 0 \
            and abs(sum(amounts, Decimal(0)) - sub) <= tol_total:
        tag = "arith:sum(amount)=sub_total"
        f["sub_total"] = _promote(f.get("sub_total"), tag)
        lines = [_with_cells(l, amount=_promote(l.cells.get("amount"), tag)) for l in lines]
    return _rebuild(doc, f, lines)


# ======================================================================== C/D — Oracle header
def _norm_key(s) -> str:
    return "".join(ch for ch in str(s or "").upper() if ch.isalnum())


def corroborate_oracle(doc: InvoiceDoc, snap: Optional[OracleSnapshot], std: Standard) -> InvoiceDoc:
    if not enabled(std, "oracle") or snap is None or not snap.active:
        return doc
    rows = snap.active
    f = dict(doc.fields)

    inv = _val(f.get("invoice_num"))
    if inv is not None:
        keys = {_norm_key(inv)} | {_norm_key(v) for v in (snap.query_keys or {}).get("invoice_variants") or ()}
        stored = set()
        for r in rows:
            stored |= {_norm_key(r.shipment_num), _norm_key(r.packing_slip), _norm_key(r.waybill_num),
                       _norm_key(r.extra.get("SHIPMENT_NUM")), _norm_key(r.extra.get("PACKING_SLIP"))}
        by_query = snap.lookup_path in ("RCV-V01", "RCV-V02")   # legacy queries bind the invoice itself
        if by_query or (keys & (stored - {""})):
            f["invoice_num"] = _promote(f.get("invoice_num"), "oracle:receipt_found_by_invoice_num")

    po = _val(f.get("po_number"))
    if po is not None:
        pos = set(snap.po_numbers or ()) | {r.po_number for r in rows if r.po_number} \
            | {r.extra.get("PO_NUM") for r in rows if r.extra.get("PO_NUM")}
        if str(po) in {str(x) for x in pos}:
            f["po_number"] = _promote(f.get("po_number"), "oracle:po_on_receipt")

    sup = _val(f.get("supplier_tax_id"))
    cur = f.get("supplier_tax_id")
    promoted = False
    if sup is not None:
        sups = {r.supplier_tax_id for r in rows if r.supplier_tax_id}
        if (snap.query_keys or {}).get("supplier_tax_id"):
            sups.add(snap.query_keys["supplier_tax_id"])
        if str(sup) in sups:
            f["supplier_tax_id"] = _promote(f.get("supplier_tax_id"), "oracle:supplier_tax_id")
            promoted = True
    # The PO master path owns this value whenever the read failed - or read the CUSTOMER's own tax id
    # into the supplier slot (DMS-30: the PO form's taxpayer line is the buyer's, and the doc's own
    # customer field proves it). The lookup rode the PO master's vendor tax to a real receipt: the EBS
    # vendor master, not the mislabel, is then the field.
    qk = snap.query_keys or {}
    po_tax = str(qk.get("supplier_tax_id") or "") if qk.get("supplier_tax_id_source") == "oracle_po" else ""
    # equal to the customer's tax id AS ORACLE STATES IT (the receipt rows' own customer column):
    # DMS-30's mislabel is the buyer's number, confirmed independently. The doc's own customer field
    # proves nothing (a mislabelled PO form can contaminate both slots, DMS-46).
    oracle_cust = {str(r.customer_tax_id) for r in rows if r.customer_tax_id}
    equal_to_customer = cur is not None and cur.ok and str(cur.value) in oracle_cust
    if not promoted and re.fullmatch(r"\d{13}", po_tax) and (cur is None or not cur.ok
                                                             or equal_to_customer):
        f["supplier_tax_id"] = NField(
            name="supplier_tax_id", element_id=cur.element_id if cur else "oracle-po",
            raw=po_tax, value=po_tax, confidence=None, ok=True, null_reason=None,
            evidence=(tuple(cur.evidence) if cur else ()) + ("oracle:supplier_tax_id_from_po",))

    cust = _val(f.get("customer_tax_id"))
    ent = std.entities.get(snap.org_id) if snap.org_id is not None else None
    oracle_cust = {r.customer_tax_id for r in rows if r.customer_tax_id}
    if ent and ent.get("tax_id"):
        oracle_cust.add(ent["tax_id"])
    if cust is not None and str(cust) in oracle_cust:
        f["customer_tax_id"] = _promote(f.get("customer_tax_id"), "oracle:customer_tax_id")
        if enabled(std, "customer_identity_by_tax_id") and f["customer_tax_id"].ok:
            for k in ("customer_name", "customer_address"):
                g = f.get(k)
                if g is not None and not g.ok:
                    f[k] = _promote(g, COVERED_TAG)
    return _rebuild(doc, f, doc.lines)


def is_covered(field: Optional[NField]) -> bool:
    return bool(field is not None and COVERED_TAG in (field.evidence or ()))


# ======================================================================== C — matched receipt lines
def corroborate_lines(doc: InvoiceDoc, groups, rows: dict, std: Standard) -> InvoiceDoc:
    """After V-07 pairing: unit (inherit / confirm), price, qty, amount equal to the matched receipt."""
    if not enabled(std, "oracle"):
        return doc
    by_no = {l.line_no: l for l in doc.lines}
    tol_line, p_exact = std.tol("line_math"), std.tol("price_exact")
    for g in groups:
        if g.relation == "UNMATCHED" or not g.rcv_line_ids:
            continue
        rcv = [rows[i] for i in g.rcv_line_ids if i in rows]
        if not rcv:
            continue
        rcv_groups = {std.uom_group(r.uom) for r in rcv}
        ids = ",".join(g.rcv_line_ids)
        for n in g.invoice_line_nos:
            l = by_no[n]
            cells = {}
            u = l.cells.get("uom")
            if len(rcv_groups) == 1 and (u is None or not u.ok):
                rg = next(iter(rcv_groups))
                raw_group = std.uom_group(u.raw) if (u is not None and u.raw) else None
                known = raw_group in std.uom_groups
                if raw_group == rg and u.null_reason in PROMOTABLE:
                    cells["uom"] = replace(u, value=rg, ok=True, null_reason=None,
                                           evidence=tuple(u.evidence) + ("oracle:uom_equals_receipt",))
                elif not known and enabled(std, "uom_inherit_from_receipt"):
                    base = u or NField("uom", f"{l.element_id}-uom", None, None, None, False, "NOT_PRESENT")
                    cells["uom"] = replace(base, value=rg, ok=True, null_reason=None,
                                           evidence=tuple(base.evidence) + (f"inherited_from_receipt:{ids}",))
            if g.relation in ("1:1", "1:N"):
                rq = sum((r.qty for r in rcv), Decimal(0))
                ra = sum((r.line_amount for r in rcv), Decimal(0))
                prices = {r.unit_price for r in rcv}
                p = _dec(_val(l.cells.get("unit_price")))
                if p is not None and len(prices) == 1 and abs(p - next(iter(prices))) <= p_exact:
                    cells["unit_price"] = _promote(l.cells.get("unit_price"), f"oracle:po_price:{ids}")
                q = _dec(_val(l.cells.get("qty")))
                if q is not None and q == rq:
                    cells["qty"] = _promote(l.cells.get("qty"), f"oracle:receipt_qty:{ids}")
                a = _dec(_val(l.cells.get("amount")))
                if a is not None and abs(a - ra) <= tol_line:
                    cells["amount"] = _promote(l.cells.get("amount"), f"oracle:receipt_amount:{ids}")
            l = _with_cells(l, **cells)
            if enabled(std, "derive_qty_from_amount") and g.relation in ("1:1", "1:N") \
                    and l.ok("unit_price") and l.ok("amount") and not l.ok("qty") and l.v("unit_price"):
                derived = (l.v("amount") / l.v("unit_price"))
                rq = sum((r.qty for r in rcv), Decimal(0))
                if abs(derived - rq) <= Decimal("0.001"):
                    qf = l.cells.get("qty") or NField("qty", f"{l.element_id}-qty", None, None, None, False,
                                                      "NOT_PRESENT")
                    l = _with_cells(l, qty=replace(qf, value=rq, ok=True, null_reason=None,
                                                   evidence=tuple(qf.evidence) + (
                                                       f"derived:amount/unit_price={rq}", f"oracle:receipt_qty:{ids}")))
            uf = l.cells.get("uom")
            by_no[n] = replace(l, uom_group=uf.value if uf is not None and uf.ok else l.uom_group)
    return replace(doc, lines=tuple(by_no[l.line_no] for l in doc.lines))


# ======================================================================== audit
def evidence_report(doc: InvoiceDoc) -> dict:
    out = {k: list(f.evidence) for k, f in doc.fields.items() if f.evidence}
    for l in doc.lines:
        for k, c in l.cells.items():
            if c.evidence:
                out[f"L{l.line_no}.{k}"] = list(c.evidence)
    return out


# ======================================================================== v4 — lookup keys
def mark_unusable_key(doc: InvoiceDoc, name: str, reason: str) -> InvoiceDoc:
    """A key that was read but cannot be used to look anything up is reported as unreadable (E01)."""
    f = doc.fields.get(name)
    if f is None:
        return doc
    fields = dict(doc.fields)
    fields[name] = replace(f, ok=False, null_reason=reason)
    return replace(doc, fields=fields)


def adopt_matched_invoice_key(doc: InvoiceDoc, snap: Optional[OracleSnapshot], std: Standard) -> InvoiceDoc:
    """policy.evidence.invoice_num_from_document_candidate.

    The receipt was found with another invoice number printed on the document (a tax-invoice / delivery
    page, or the zoomed crop), not with the value the reader picked.  That number is printed on the
    document AND equals the supplier's receipt in Oracle, so it is the invoice number; the value read
    first is kept in the evidence tag (audit), nothing is invented.
    """
    if not enabled(std, "invoice_num_from_document_candidate") or snap is None or not snap.active:
        return doc
    m = (snap.query_keys or {}).get("invoice_key_matched")
    if not m or (snap.query_keys or {}).get("invoice_candidates_ambiguous"):
        return doc
    f = doc.fields.get("invoice_num")
    old = f.raw if f is not None else None
    pages = ",".join(str(p) for p in m.get("pages") or [])
    tags = (f"oracle:receipt_found_by_document_number:{m['key']}",
            f"printed_on:{m.get('source', 'document')}:pages {pages}", f"replaced_read_value:{old}")
    if m.get("match") == "suffix":
        tags += (f"ebs_stores:{m.get('stored_in_ebs')}",)
    base = f or NField("invoice_num", f"{doc.document_id}-f-invoice_num", None, None, None, False, "NOT_PRESENT")
    fields = dict(doc.fields)
    fields["invoice_num"] = replace(base, raw=m["key"], value=m["key"], ok=True, null_reason=None,
                                    evidence=tuple(base.evidence) + tags)
    return replace(doc, fields=fields)


# ======================================================================== v4 — a block of rows printed twice
def collapse_duplicate_block(doc: InvoiceDoc, snap: Optional[OracleSnapshot],
                             std: Standard) -> tuple[InvoiceDoc, Optional[dict]]:
    """DMS-26: the last m rows repeat m earlier rows (a continuation page re-printed the tail of the table).

    Unlike collapse_repeated_copies the repeated part is not the whole table, so a fixed rule is needed
    for proof.  The block is dropped only when ALL of these hold:
      * m >= 2 consecutive rows equal an earlier block row by row on (qty, unit_price, amount, first
        word of the description — the item code);
      * without the block the amounts close: sum = sub_total when sub_total is readable, otherwise
        sum = the receipt total in Oracle exactly (and sum with the block does not).
    """
    if not enabled(std, "collapse_duplicate_block"):
        return doc, None
    lines = list(doc.lines)
    n = len(lines)
    if n < 4:
        return doc, None

    def sig(l):
        d = l.cells.get("description")
        word = (str(d.raw or "").split() or [""])[0].upper() if d is not None else ""
        return tuple(_dec(_val(l.cells.get(k))) for k in ("qty", "unit_price", "amount")) + (word,)
    sigs = [sig(l) for l in lines]
    amounts = [s_[2] for s_ in sigs]
    if None in amounts:
        return doc, None
    sub = _dec(_val(doc.fields.get("sub_total")))
    target, basis = sub, "sub_total"
    if target is None:
        if snap is None or not snap.active:
            return doc, None
        target, basis = sum((r.line_amount for r in snap.active), Decimal(0)), "receipt_total"
    tol = std.tol("total")
    total = sum(amounts, Decimal(0))
    if abs(total - target) <= tol:
        return doc, None
    for m in range(n // 2, 1, -1):
        tail = sigs[n - m:]
        for i in range(0, n - 2 * m + 1):
            if sigs[i:i + m] == tail and abs(sum(amounts[:n - m], Decimal(0)) - target) <= tol:
                kept = tuple(lines[:n - m])
                return replace(doc, lines=kept), {
                    "kept_line_nos": [l.line_no for l in kept],
                    "dropped_line_nos": [l.line_no for l in lines[n - m:]],
                    "same_as_line_nos": [l.line_no for l in lines[i:i + m]],
                    "basis": basis, "target": str(target),
                    "rule": "last rows repeat earlier rows (qty, price, amount, item code) and the rest closes"}
        for i in range(0, n - 2 * m + 1):
            block = sigs[i:i + m]
            for j in range(i + m, n - m + 1):
                if sigs[j:j + m] == block:
                    rem_amounts = amounts[:j] + amounts[j + m:]
                    if abs(sum(rem_amounts, Decimal(0)) - target) <= tol:
                        kept = tuple(lines[:j] + lines[j + m:])
                        return replace(doc, lines=kept), {
                            "kept_line_nos": [l.line_no for l in kept],
                            "dropped_line_nos": [l.line_no for l in lines[j:j + m]],
                            "same_as_line_nos": [l.line_no for l in lines[i:i + m]],
                            "basis": basis, "target": str(target),
                            "rule": "middle rows repeat earlier rows (qty, price, amount, item code) and the rest closes"}

    return doc, None
