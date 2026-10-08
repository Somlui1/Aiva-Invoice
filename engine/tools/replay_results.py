"""Replay saved System A results (extraction + Oracle snapshot + recorded AI line matches) through a
code tree, without calling the VLM or Oracle again.

usage: python replay_results.py <src_root> <results_dir> <out.json> [result-3.0.schema.json]
  src_root    folder that contains the system_a package (e.g. "OCR service/system-a-sandbox/src")
  results_dir folder with DMS-*_result.json from a batch run

Oracle: the saved receipt rows are returned for the lookup path that found them in the run.
AI V-07: the saved AI groups are replayed (lines the new logic already paired are skipped).
AI V-05 / V-08: simulators (deterministic) — their verdicts may differ from Qwen.
"""
import glob, json, os, sys
from collections import Counter
from decimal import Decimal

root, rdir, out = sys.argv[1:4]
schema = None
if len(sys.argv) > 4:                       # optional: path to result-3.0.schema.json
    import jsonschema
    schema = jsonschema.Draft202012Validator(json.load(open(sys.argv[4], encoding="utf-8")))
invalid = []
sys.path.insert(0, root)
from system_a.adapters.llm.simulators import SimEntityJudge, SimLineMatcher, SimQtyJudge  # noqa: E402
from system_a.application.orchestrator import Services, validate  # noqa: E402
from system_a.domain.contracts import ExtractionResult, ReceiptRow  # noqa: E402


class Repo:
    """v4: answers every query from the receipt rows the original run saved (any lookup path).

    It can only find a receipt the original run had fetched; a receipt v3 never queried (e.g. DMS-110,
    or the true receipt of a PO-LIST search cut at the row cap) needs a live Oracle run.
    """
    def __init__(s, rows, path): s.rows, s.path = rows, path
    @staticmethod
    def _n(v): return "".join(str(v or "").split()).upper()
    @staticmethod
    def _t(r): return (r.supplier_tax_id or "")[-13:] or None
    def _h(s, r): return {s._n(r.shipment_num), s._n(r.packing_slip), s._n(r.waybill_num)} - {""}
    def _r(s, ok): return list(s.rows) if ok else []
    def rcv_v01(s, po, inv): return s._r(s.path == "RCV-V01")
    def rcv_v02(s, t, inv): return s._r(s.path == "RCV-V02")
    def supplier_tax_by_po(s, po):
        return next((s._t(r) for r in s.rows if r.po_number == po and s._t(r)), None)
    def receipts_by_tax_invoice(s, t, keys):
        want = {s._n(k) for k in keys}
        return [r for r in s.rows if s._t(r) == t and s._h(r) & want]
    def receipts_by_tax_invoice_suffix(s, t, sfx):
        ends = ["/" + s._n(k) for k in sfx]
        return [r for r in s.rows if s._t(r) == t and any(h.endswith(e) for h in s._h(r) for e in ends)]
    def receipts_by_receipt_num(s, t, n):
        return [r for r in s.rows if s._t(r) == t and r.receipt_num == n]
    def receipts_by_po_vendor_invoice(s, po, keys):
        want = {s._n(k) for k in keys}
        vend = {s._t(r) for r in s.rows if r.po_number == po}
        return [r for r in s.rows if vend and s._t(r) in vend and s._h(r) & want]
    def receipts_by_po_list(s, pos): return [r for r in s.rows if r.po_number in set(pos)]


class RecordedLineMatcher:
    """Replays the AI groups of the original run for the lines still open."""
    def __init__(s, groups): s.groups = [g for g in groups if g.get("source") == "ai"]
    def propose(s, inv, rcv):
        open_inv = {d["invoice_line_no"] for d in inv}
        open_rcv = {d["rcv_line_id"] for d in rcv}
        keep = [g for g in s.groups if set(g["invoice_line_nos"]) <= open_inv and set(g["rcv_line_ids"]) <= open_rcv]
        return {"groups": [{"invoice_line_nos": g["invoice_line_nos"], "rcv_line_ids": g["rcv_line_ids"],
                            "level": g["level"], "confidence": g["confidence"], "rationale": g.get("rationale")}
                           for g in keep]}


ROWF = set(ReceiptRow.__dataclass_fields__)


def row(d):
    k = {a: b for a, b in d.items() if a in ROWF}
    for n in ("qty", "unit_price", "line_amount", "qty_billed"):
        if n in k and k[n] is not None:
            k[n] = Decimal(str(k[n]))
    k.setdefault("extra", {})
    return ReceiptRow(**k)


def rf(f, el):
    raw = f.get("raw_value")
    reg = {"page": el["page_no"], "bbox": el["bbox"]} if el and el.get("bbox") else None
    return {"raw": raw, "confidence": f.get("confidence", el.get("confidence") if el else None),
            "agreement": (el or {}).get("agreement", True) if (el or {}).get("agreement") is not None else True,
            "region": reg, "source": "consensus", "null_reason": f.get("null_reason") if raw is None else None}


res, summaries = {}, {}
for p in sorted(glob.glob(os.path.join(rdir, "DMS-*_result.json"))):
    d = json.load(open(p, encoding="utf-8"))
    els = {e["element_id"]: e for e in d["ocr"]["elements"]}
    ex = d["extraction"]
    fields = {k: rf(v, els.get(v["element_id"])) for k, v in ex["fields"].items()}
    lines = [{"line_no": l["line_no"], "cells": {k: rf(c, els.get(f"{l['element_id']}-{k}")) for k, c in l["cells"].items()}}
             for l in ex["lines"]]
    sig = {k: {kk: v.get(kk) for kk in ("present", "confidence", "kind", "region")}
           for k, v in ex["signatures"].items() if k in ("receiver", "deliverer")}
    pk = d["package"]
    e = ExtractionResult.model_validate({
        "package_id": pk["package_id"], "dms_doc_id": pk["dms_doc_id"], "file_sha256": pk["file_sha256"],
        "pages": d["pages"], "documents": d["documents"], "invoice_document_id": ex["invoice_document_id"],
        "pages_complete": pk["pages_complete"], "fields": fields, "lines": lines, "signatures": sig,
        "extra": ex.get("extra") or {},
        "regions": [{"region_id": x["element_id"], "page": x["page_no"], "kind": x.get("region_kind") or "stamp",
                     "text": x.get("raw_value"), "confidence": x.get("confidence"), "bbox": x["bbox"]}
                    for x in d["ocr"]["elements"]
                    if (x.get("region_kind") == "stamp" or x["element_type"] == "stamp") and x.get("bbox")]})
    snap = d.get("oracle_snapshot") or {}
    rows = [row(x) for x in snap.get("receipt_lines") or []]
    groups = (d.get("line_matching") or {}).get("groups") or []
    svc = Services(Repo(rows, snap.get("lookup_path")), RecordedLineMatcher(groups), SimQtyJudge(), SimEntityJudge())
    r = validate(e, svc, request={"validation_id": "replay", "correlation_id": "replay", "idempotency_key": None,
                                  "document_revision": 1, "validation_round": 1})
    k = pk["dms_doc_id"]
    if schema is not None:
        invalid += [(k, e.message[:120]) for e in list(schema.iter_errors(r))[:1]]
    summaries[k] = r.get("summary")
    if os.environ.get("REPLAY_DUMP_DIR"):                      # full result per document
        os.makedirs(os.environ["REPLAY_DUMP_DIR"], exist_ok=True)
        json.dump(r, open(os.path.join(os.environ["REPLAY_DUMP_DIR"], f"{k}_result.json"), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
    res[k] = {"before": d["recommendation"]["value"], "before_codes": d["recommendation"]["exception_codes"],
              "after": r["recommendation"]["value"], "after_codes": r["recommendation"]["exception_codes"],
              "reasons": r["recommendation"]["reasons"], "had_oracle": bool(snap),
              "path_before": snap.get("lookup_path"), "path_after": (r.get("oracle_snapshot") or {}).get("lookup_path"),
              "receipts_after": (r.get("oracle_snapshot") or {}).get("receipt_nums"),
              "invoice_num_after": r["normalized_fields"].get("invoice_num"),
              "query_keys_after": (r.get("oracle_snapshot") or {}).get("query_keys")}
json.dump({"results": res, "summaries": summaries}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("before", Counter(v["before"] for v in res.values()))
print("after ", Counter(v["after"] for v in res.values()))
if schema is not None:
    print("schema invalid:", len(invalid), invalid[:5])
