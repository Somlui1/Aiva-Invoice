"""Python side of the differential tests: normalize + SQL rendering of the SAME fixture.

  python harness/py_side.py            -> fixtures/py_norm.json, fixtures/py_sql.json
Compared against the JS port by harness/diff.py.
"""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'src'))
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FIX = os.path.join(ROOT, 'fixtures')

from system_a.domain.contracts import ExtractionResult, ReceiptRow  # noqa: E402
from system_a.domain.standard import load_standard                  # noqa: E402
from system_a.domain.normalize import normalize                     # noqa: E402
from system_a.adapters.oracle.mcp_repository import McpSqlClient, OracleMcpRepository  # noqa: E402

ext = ExtractionResult.model_validate(json.load(open(os.path.join(FIX, 'extraction.json'), encoding='utf-8'))['extraction'])
std = load_standard()
doc, meta = normalize(ext, std)


def rg(r):
    if r is None: return None
    return {"page": r["page"] if isinstance(r, dict) else r.page,
            "bbox": [float(x) for x in (r["bbox"] if isinstance(r, dict) else r.bbox)],
            "rbox": None}


def nf(f):
    return {"name": f.name, "element_id": f.element_id, "raw": f.raw,
            "value": None if f.value is None else str(f.value), "confidence": f.confidence,
            "ok": f.ok, "null_reason": f.null_reason, "evidence": list(f.evidence)}


out = {
    "fields": {k: nf(v) for k, v in sorted(doc.fields.items())},
    "lines": [{"line_no": l.line_no, "element_id": l.element_id, "uom_group": l.uom_group,
               "po_refs": list(l.po_refs), "region": rg(l.region),
               "cells": {k: nf(v) for k, v in sorted(l.cells.items())}} for l in doc.lines],
    "signatures": {k: {"present": v.present, "confidence": v.confidence, "kind": v.kind, "region": rg(v.region)}
                   for k, v in sorted((doc.signatures or {}).items())},
    "pages_complete": doc.pages_complete, "document_id": doc.document_id, "meta": meta,
}
json.dump(out, open(os.path.join(FIX, 'py_norm.json'), 'w', encoding='utf-8'), default=str, sort_keys=True, indent=1)


class Captor:
    """Stands in for the ORDS endpoint: records the rendered SQL, answers 'no rows'."""
    def __init__(self): self.text = ""

    def post(self, *a, **k):
        self.text = k["json"]["params"]["arguments"]["sql"]
        raise _NoMore()


class _NoMore(Exception):
    pass


class QuietClient(McpSqlClient):
    def __init__(self, caps): self.audit_caps = caps; self.token = ""; self.url = "x"; self.retries = 0

    def run(self, sql, *, database="default"):
        self.last = sql
        return ""


policy = std.policy["oracle"]
client = QuietClient(None)
repo = OracleMcpRepository(client, row_cap=policy["row_cap"], match_columns=policy["lookup"]["invoice_match_columns"],
                           row_caps=policy.get("row_caps"))
SQL_ARGS = [("rcv_v01", ("42052615", "TLP-IV-69-09-0025")), ("supplier_tax_by_po", ("42052615",)),
            ("rcv_v02", ("0105549023741", "TLP-IV-69-09-0025")),
            ("receipts_by_tax_invoice", ("0105549023741", ("TLP-IV-69-09-0025", "TLP-IV-69-09-0025".replace("/", ""), "TLP-IV-69-09-0025".replace(".", "")))),
            ("receipts_by_tax_invoice_suffix", ("0105549023741", ("TLP-IV-69-09-0025",))),
            ("receipts_by_po_vendor_invoice", ("42052615", ("TLP-IV-69-09-0025",))),
            ("receipts_by_receipt_num", ("0105549023741", "50220043380")),
            ("receipts_by_po_list", (("42052615",),))]
for name, args in SQL_ARGS:
    try:
        getattr(repo, name)(*args)
    except Exception:
        pass
json.dump([{"query_id": e["query_id"], "binds": {k: (list(v) if isinstance(v, (list, tuple)) else (str(v) if not isinstance(v, (str, int, float, bool)) and v is not None else v)) for k, v in e["binds"].items()}, "sql": e["sql"]}
           for e in repo.audit], open(os.path.join(FIX, 'py_sql.json'), 'w', encoding='utf-8'), indent=1)
print("py_norm.json + py_sql.json written (sql entries: %d)" % len(repo.audit))
