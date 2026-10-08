"""STEP 2 receipt lookup.

Two modes, chosen by ``policy.oracle.lookup.mode``:

* ``legacy_po_invoice`` (X-01, pre AIVA-SYSA-ORA-01 — unchanged byte for byte)
    RCV-V01 (PO + Invoice) -> PO-SUPPLIER -> RCV-V02 (Tax from Oracle + Invoice)

* ``tax_invoice`` (AIVA-SYSA-ORA-01, legacy ``OracleMCPClient`` behaviour made safe)
    1. invoice spellings from config (``oracle.lookup.invoice_variants``)
    2. Supplier Tax ID = OCR value when readable + checksum-valid, else PO-SUPPLIER (Oracle)
    3. TAX-INV : Tax ID + any spelling, matched against SHIPMENT_NUM / PACKING_SLIP / WAYBILL
                 -> every receipt line of this invoice, across every PO and every receipt
    4. PO-LIST : fallback by the header PO when step 3 found nothing (``po_list_fallback``)

Business misses (nothing found, unsafe key) return an empty snapshot -> V-04 E05.  Technical
failures raise ``OracleTechnicalError`` -> SYSTEM_ERROR, never E05.  Results are memoised per
round and the number of queries is capped by ``oracle.max_queries_per_round``.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from ..domain.contracts import OracleInputRejected, OracleSnapshot, OracleTechnicalError
from ..domain.normalize import Invalid, tax_id
from ..domain.ports import OracleRepository
from .invoice_variants import build_variants

LEGACY_MODE, TAX_MODE = "legacy_po_invoice", "tax_invoice"
MODES = (LEGACY_MODE, TAX_MODE)
DEFAULT_MATCH_COLUMNS = ("SHIPMENT_NUM", "PACKING_SLIP", "WAYBILL_AIRBILL_NUM")
_TAX_SHAPE = re.compile(r"^\d{13}$")
_PO_SHAPE = re.compile(r"^\d{8}$")
# ReceiptRow attribute that carries each receipt-header column
_COLUMN_ATTR = {"SHIPMENT_NUM": "shipment_num", "PACKING_SLIP": "packing_slip", "WAYBILL_AIRBILL_NUM": "waybill_num"}


class QueryBudgetExceeded(OracleTechnicalError):
    """More Oracle queries than ``max_queries_per_round`` were requested (a code defect, not data)."""


def lookup_mode(policy: dict) -> str:
    """The configured mode; a Standard without the key behaves as before ORA-01."""
    mode = str(((policy.get("oracle") or {}).get("lookup") or {}).get("mode") or LEGACY_MODE)
    if mode not in MODES:
        raise OracleTechnicalError(f"UNKNOWN_LOOKUP_MODE:{mode}")
    return mode


def valid_supplier_tax(value: object) -> Optional[str]:
    """13 digits with a valid Thai check digit, else None (never queried with a bad Tax ID)."""
    s = str(value or "").strip()
    if not _TAX_SHAPE.match(s):
        return None
    try:
        return tax_id(s)
    except Invalid:
        return None


class OracleSession:
    def __init__(self, repo: OracleRepository, row_cap: int, *, max_queries: Optional[int] = None,
                 lookup_cfg: Optional[dict] = None, row_caps: Optional[dict] = None):
        self.repo, self.row_cap, self.calls, self._memo = repo, row_cap, 0, {}
        self.row_caps = {str(k): int(v) for k, v in (row_caps or {}).items()}     # v4: per query id
        self.rejected: list[dict] = []
        self.max_queries = max_queries
        self.cfg = dict(lookup_cfg or {})
        self.trace: list[str] = []                      # query ids in execution order (audit + tests)

    def _call(self, name, fn, *args):
        key = (name, args)
        if key not in self._memo:
            if self.max_queries is not None and self.calls >= self.max_queries:
                raise QueryBudgetExceeded(f"QUERY_BUDGET_EXCEEDED:{self.max_queries}")
            self.calls += 1
            self.trace.append(name)
            try:
                self._memo[key] = fn(*args)
            except OracleInputRejected as e:                     # key shape rejected: never queried Oracle
                self.rejected.append({"query_id": name, "reason": str(e),
                                      "args": [str(a) for a in args]})
                raise
            except OracleTechnicalError:
                raise
            except Exception as e:  # any driver error is technical, never business
                raise OracleTechnicalError(f"{type(e).__name__}: {e}") from e
        return self._memo[key]

    # ------------------------------------------------------------------ legacy (unchanged)
    def lookup(self, po_number: str, invoice_num: str) -> OracleSnapshot:
        keys = {"po_number": po_number, "invoice_num": invoice_num}
        rows, path = self._call("RCV-V01", self.repo.rcv_v01, po_number, invoice_num), "RCV-V01"
        if not rows:
            tax = self._call("PO-SUPPLIER", self.repo.supplier_tax_by_po, po_number)
            if tax:
                keys["supplier_tax_id"] = tax
                rows2 = self._call("RCV-V02", self.repo.rcv_v02, tax, invoice_num)
                if rows2:
                    rows, path = rows2, "RCV-V02"
        return OracleSnapshot(queried_at=datetime.now(timezone.utc).isoformat(), lookup_path=path if rows else None,
                              query_keys=keys, rows=tuple(rows), row_cap_hit=len(rows) >= self.row_cap,
                              calls=self.calls)

    # ------------------------------------------------------------------ AIVA-SYSA-ORA-01
    def lookup_tax_invoice(self, invoice_num: Optional[str], *, ocr_supplier_tax_id: Optional[str] = None,
                           po_number: Optional[str] = None, invoice_candidates=(), receipt_candidates=(),
                           customer_tax_id: Optional[str] = None, sub_total: Optional[Decimal] = None,
                           total_tol: Decimal = Decimal("0.50")) -> OracleSnapshot:
        """Tax ID + Invoice across every PO.  ``ocr_supplier_tax_id`` / ``po_number`` may be None.

        v4 order (each step only when the previous ones found nothing):
          1. TAX-INV with every spelling of the read invoice number AND of the other invoice numbers
             printed on the document (``invoice_candidates``) — one query;
          2. the same keys for the vendor of the printed PO when the OCR Tax ID found nothing;
          3. TAX-INV-SUFFIX: header ends in "/<printed number>", accepted only when amount = sub_total;
          4. RCV-BY-NUM with the receipt number written on the document (supplier + amount must agree);
          5. PO-LIST, only when ``po_list_fallback`` is switched back on (v4 default: off).
        """
        specs = self.cfg.get("invoice_variants") or ()
        limit = int(self.cfg.get("max_invoice_keys") or 12)
        po = po_number if po_number and _PO_SHAPE.match(str(po_number)) else None
        keys: dict = {"invoice_num": invoice_num, "invoice_variants": [], "po_number": po,
                      "supplier_tax_id": None, "supplier_tax_id_source": None}
        if invoice_num and po and self.cfg.get("reject_invoice_equal_po") \
                and _norm(invoice_num).lstrip("PO.") == po:
            keys["invoice_num_rejected"] = {"value": invoice_num, "reason": "equals po_number"}
            invoice_num = None
        primary = build_variants(invoice_num, specs) if invoice_num else []
        keys["invoice_variants"] = primary
        owner: dict[str, str] = {}                     # spelling -> candidate key ("" = the read invoice_num)
        for v in primary:
            owner.setdefault(_norm(v), "")
        cands = [dict(c) for c in invoice_candidates or ()]
        for c in cands:
            for v in build_variants(c["key"], specs):
                if len(owner) >= limit:
                    break
                owner.setdefault(_norm(v), c["key"])
        all_keys = list(owner)
        if cands:
            keys["invoice_candidates"] = cands
        rcands = [dict(r) for r in receipt_candidates or ()]
        if not all_keys and not rcands:
            # An invoice number that cannot become a safe SQL literal is never sent (no PO fallback
            # either: without the invoice key a PO-wide search would return unrelated receipts).
            keys["invoice_rejected"] = True
            return self._snapshot(keys, [], None, all_keys)
        if not primary and invoice_num:
            keys["invoice_rejected"] = True              # the read number itself was unusable

        tax, source = None, None
        if self.cfg.get("use_ocr_supplier_tax_id", True):
            tax = valid_supplier_tax(ocr_supplier_tax_id)
            if tax and self.cfg.get("reject_supplier_tax_equal_customer") and customer_tax_id \
                    and tax == str(customer_tax_id).strip():
                # v4: the buyer's own Tax ID read into the supplier field (DMS-36/45/72/93)
                keys["supplier_tax_id_rejected"] = {"value": tax, "reason": "equals customer_tax_id"}
                tax = None
            source = "ocr" if tax else None
        if tax is None and po:
            from_oracle = self._call("PO-SUPPLIER", self.repo.supplier_tax_by_po, po)
            tax = valid_supplier_tax(from_oracle)           # NUM_1099 / foreign IDs are not queried
            source = "oracle_po" if tax else None
            if from_oracle and not tax:
                keys["supplier_tax_id_unusable"] = str(from_oracle)
        keys.update(supplier_tax_id=tax, supplier_tax_id_source=source)

        rows, path = [], None
        rcv_tax = tax
        if tax and all_keys:
            found = list(self._call("TAX-INV", self.repo.receipts_by_tax_invoice, tax, tuple(all_keys)))
            rows = self._keep_invoice_receipts(found, owner, cands, keys, sub_total, total_tol)
            path = "TAX-INV" if rows else None
        if not rows and all_keys and po and source == "ocr" and self.cfg.get("supplier_from_po_on_miss", False):
            # v4: the OCR Tax ID found nothing.  It may be the buyer's own ID or the two Tax IDs swapped
            # (DMS-45/93), one digit misread (DMS-58), or EBS keeps no Tax ID for the supplier (DMS-111).
            # The supplier is then the vendor of the printed PO — still the invoice key, never PO history.
            from_oracle = self._call("PO-SUPPLIER", self.repo.supplier_tax_by_po, po)
            po_tax = valid_supplier_tax(from_oracle)
            rcv_tax = po_tax or tax
            if po_tax and po_tax != tax:
                found = list(self._call("TAX-INV", self.repo.receipts_by_tax_invoice, po_tax, tuple(all_keys)))
                rows = self._keep_invoice_receipts(found, owner, cands, keys, sub_total, total_tol)
                if rows:
                    keys["supplier_tax_id_ocr_unmatched"] = tax
                    tax, source, path = po_tax, "oracle_po", "TAX-INV"
                    keys.update(supplier_tax_id=tax, supplier_tax_id_source=source)
            elif not po_tax:
                found = list(self._call("INV-BY-PO-VENDOR", self.repo.receipts_by_po_vendor_invoice, po,
                                        tuple(all_keys)))
                rows = self._keep_invoice_receipts(found, owner, cands, keys, sub_total, total_tol)
                if rows:
                    keys["supplier_tax_id_ocr_unmatched"] = tax
                    keys["supplier_from_po_vendor"] = {"po_number": po, "oracle_tax_id": from_oracle}
                    path = "INV-BY-PO-VENDOR"
        if not rows and rcv_tax and self.cfg.get("invoice_suffix_match", False):
            rows, path = self._suffix_lookup(rcv_tax, invoice_num, cands, keys, sub_total, total_tol)
        if not rows and rcv_tax and rcands and self.cfg.get("receipt_num_lookup", False):
            tried = []
            limit_r = int(self.cfg.get("receipt_num_max_candidates") or 2)
            for rc in rcands[:limit_r]:
                got = list(self._call("RCV-BY-NUM", self.repo.receipts_by_receipt_num, rcv_tax, rc["receipt_num"]))
                act = [r for r in got if r.qty > 0]
                total = sum((r.line_amount for r in act), Decimal(0))
                ok = bool(act) and sub_total is not None and abs(total - sub_total) <= total_tol
                why = ("accepted: supplier + amount equal" if ok else "no receipt for this supplier" if not act
                       else "sub_total unreadable" if sub_total is None else
                       f"amount differs: receipt {total} vs sub_total {sub_total}")
                tried.append({**rc, "rows": len(got), "receipt_total": str(total), "accepted": ok, "reason": why})
                if ok:
                    rows, path = got, "RCV-BY-NUM"
                    break
            keys["receipt_num_lookup"] = tried
        if not rows and po and self.cfg.get("po_list_fallback", True):
            rows = list(self._call("PO-LIST", self.repo.receipts_by_po_list, (po,)))
            path = "PO-LIST" if rows else None
        if rcands and path != "RCV-BY-NUM":
            # audit only: the receiver's handwritten number against the receipt that was found
            got_n = {r.receipt_num for r in rows}
            keys["receipt_num_candidates"] = [{**rc, "equals_found_receipt": rc["receipt_num"] in got_n}
                                              for rc in rcands]
        return self._snapshot(keys, rows, path, all_keys)

    def _suffix_lookup(self, tax, invoice_num, cands, keys, sub_total, tol):
        """v4.1: EBS kept a book prefix the document does not print ("1819/157446" for 157446).
        Only numeric keys without "/" (>= invoice_suffix_min_digits), and only one receipt whose total
        equals sub_total — anything else is not accepted."""
        mind = int(self.cfg.get("invoice_suffix_min_digits") or 4)
        pool = ([invoice_num] if invoice_num else []) + [c["key"] for c in cands]
        sfx = []
        for k in pool:
            k = _norm(k)
            if k and "/" not in k and k.isalnum() and sum(ch.isdigit() for ch in k) >= mind and k not in sfx:
                sfx.append(k)
        if not sfx or sub_total is None:
            return [], None
        found = list(self._call("TAX-INV-SUFFIX", self.repo.receipts_by_tax_invoice_suffix, tax, tuple(sfx)))
        by_rcv: dict = {}
        for r in found:
            by_rcv.setdefault(r.receipt_num, []).append(r)
        ok = []
        for n, rs in by_rcv.items():
            total = sum((r.line_amount for r in rs if r.qty > 0), Decimal(0))
            if abs(total - sub_total) <= tol:
                ok.append(n)
        info = {"suffixes": sfx, "receipts_found": sorted(by_rcv), "accepted": ok[:1] if len(ok) == 1 else [],
                "rule": "header ends in /<printed number>, same supplier, receipt total = sub_total"}
        keys["invoice_suffix_match"] = info
        if len(ok) != 1:
            return [], None
        rows = by_rcv[ok[0]]
        heads = {_norm(getattr(r, a, None)) for r in rows for a in ("shipment_num", "packing_slip", "waybill_num")}
        key = next((s for s in sfx if any(h.endswith("/" + s) for h in heads)), sfx[0])
        stored = next((h for h in heads if h.endswith("/" + key)), None)
        src = next((c for c in cands if _norm(c["key"]) == key), {"key": key, "source": "read_invoice_num"})
        keys["invoice_key_matched"] = {**src, "key": key, "stored_in_ebs": stored, "receipts": ok,
                                       "match": "suffix"}
        return rows, "TAX-INV-SUFFIX"

    @staticmethod
    def _keep_invoice_receipts(found, owner, cands, keys, sub_total, tol):
        """Which receipts of the TAX-INV answer belong to this invoice.

        A receipt keyed with the read invoice number always wins.  Otherwise a receipt keyed with another
        number printed on the document is kept when exactly one such number matched (or exactly one whose
        receipt total equals sub_total); several -> kept but marked ambiguous (V-04 manual_review).
        """
        if not found or not any(owner.values()):
            return found                                    # no document candidates: v3 behaviour
        by_rcv: dict = {}
        for r in found:
            by_rcv.setdefault(r.receipt_num, []).append(r)

        def who(rs):
            heads = {_norm(getattr(r, a, None)) for r in rs for a in ("shipment_num", "packing_slip", "waybill_num")}
            hit = [owner[h] for h in heads if h in owner]
            if not hit:
                return ""                                    # header not returned: treat as the read number
            return "" if "" in hit else sorted(hit)[0]
        tag = {n: who(rs) for n, rs in by_rcv.items()}
        if "" in tag.values():
            keep = [n for n, t in tag.items() if t == ""]
        else:
            matched = sorted(set(tag.values()))
            if len(matched) > 1 and sub_total is not None:
                tot = {k: sum((r.line_amount for n, t in tag.items() if t == k for r in by_rcv[n] if r.qty > 0),
                              Decimal(0)) for k in matched}
                equal = [k for k in matched if abs(tot[k] - sub_total) <= tol]
                matched = equal if len(equal) == 1 else matched
            if len(matched) > 1:
                keys["invoice_candidates_ambiguous"] = matched
            keep = [n for n, t in tag.items() if t in matched]
            info = next((c for c in cands if c["key"] == matched[0]), {"key": matched[0]})
            keys["invoice_key_matched"] = {**info, "receipts": sorted(keep)}
        aside = sorted(n for n in by_rcv if n not in keep)
        if aside:
            keys["receipts_set_aside"] = aside
        return [r for r in found if r.receipt_num in set(keep)]

    def _snapshot(self, keys: dict, rows: list, path: Optional[str], variants: list) -> OracleSnapshot:
        cap = self.row_caps.get(path or "", self.row_cap)
        return OracleSnapshot(queried_at=datetime.now(timezone.utc).isoformat(), lookup_path=path,
                              query_keys=keys, rows=tuple(rows), row_cap_hit=len(rows) >= cap,
                              calls=self.calls,
                              po_numbers=tuple(sorted({r.po_number for r in rows if r.po_number})),
                              matched_on_column=matched_column(rows, variants, self.cfg.get("invoice_match_columns")))


def _norm(v) -> str:
    """UPPER(REPLACE(col, ' ', '')) — the comparison TAX-INV makes on the receipt header."""
    return "".join(str(v or "").split()).upper()


def matched_column(rows, variants, columns=None) -> Optional[str]:
    """First configured receipt column whose value equals one of the invoice spellings."""
    want = {_norm(v) for v in variants or ()}
    for col in columns or DEFAULT_MATCH_COLUMNS:
        attr = _COLUMN_ATTR.get(str(col).upper())
        if attr and any(_norm(getattr(r, attr, None)) in want for r in rows):
            return str(col).upper()
    return None
