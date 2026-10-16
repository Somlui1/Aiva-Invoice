"""Health metrics for the final census (prompt 1.6.0 + targeted 300 DPI retry), read out of the payloads.

Companion to ffr_score.py: that tool answers the box question with the historical ruler.  This one answers the
questions the new rules raised, and every figure is a count of payloads, not an impression:

  * did the targeted retry fire, how often, and did it win  - and did it cost more than one call per document
  * did the tax id rule end up with fewer delivered values it cannot accept than R6-14 measured (25 documents)
  * how many reads are still geometry-less (NO_GEOMETRY), how many pages were re-adjudicated
  * which documents the page-type gate never sent to the model, and which delivered nothing
  * do the three ambiguity documents deliver the number the owner ruled

  python bbox_testing/round_06/final_stats.py
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

from system_a.domain.normalize import Invalid, tax_id                   # noqa: E402

ARM = "final"
FIELDS = ("invoice_num", "invoice_date", "supplier_name", "supplier_tax_id", "customer_name",
          "customer_tax_id", "po_number", "grand_total")
AMBIGUITY = {159: "INV-2026-0802", 236: "422", 237: "422", 175: "2213666606"}


def fails(value):
    if value in (None, ""):
        return None
    try:
        tax_id(str(value))
        return None
    except Invalid as e:
        return str(e)
    except Exception as e:                                              # pragma: no cover
        return type(e).__name__


def load(arm_dir: Path):
    out = {}
    for p in arm_dir.glob("DMS-*/extraction.json"):
        out[int(p.parent.name.split("-")[1])] = json.loads(p.read_text(encoding="utf-8"))
    return out


def main() -> int:
    pay = load(HERE / ARM / "run1")
    old = load(HERE / "repB")
    if not pay:
        print(f"no payloads under {ARM}/run1")
        return 1

    calls = retry_fired = retry_ok = 0
    reasons, flag_docs, tax_bad, no_geo, adj_docs, gate_drop, empty, perr = {}, [], {}, [], [], [], [], []
    for did, j in sorted(pay.items()):
        ex = j.get("extra") or {}
        calls += len(ex.get("calls") or [])
        for r in ex.get("taxid_retry") or []:
            retry_fired += 1
            retry_ok += 1 if r.get("accepted") else 0
            reasons[r.get("reason")] = reasons.get(r.get("reason"), 0) + 1
        if ex.get("format_warnings"):
            flag_docs.append(did)
        f = j.get("fields") or {}
        for name in ("supplier_tax_id", "customer_tax_id"):
            why = fails((f.get(name) or {}).get("raw"))
            if why:
                tax_bad.setdefault(did, []).append((name, (f.get(name) or {}).get("raw"), why))
        for pg, msg in (ex.get("page_errors") or {}).items():
            if str(msg).startswith("NO_GEOMETRY"):
                no_geo.append(did)
            perr.append((did, pg, str(msg)[:90]))
        if ex.get("adjudication"):
            adj_docs.append(did)
        sel = ex.get("invoice_pages") or []
        if not sel:
            gate_drop.append(did)
        if not f:
            empty.append(did)

    docs_with_tax = [d for d, j in pay.items()
                     if any((j.get("fields") or {}).get(k) and ((j["fields"][k] or {}).get("raw"))
                            for k in ("supplier_tax_id", "customer_tax_id"))]
    values = sum(1 for j in pay.values() for k in ("supplier_tax_id", "customer_tax_id")
                 if ((j.get("fields") or {}).get(k) or {}).get("raw"))

    print(f"{ARM}: {len(pay)} documents, {calls} vision calls recorded")
    print(f"  targeted retry: fired on {retry_fired} documents ({100 * retry_fired / len(pay):.1f}%), "
          f"accepted {retry_ok}, refused {retry_fired - retry_ok}  reasons={reasons}")
    print(f"  format_warnings still on the payload: {len(flag_docs)} documents {flag_docs[:12]}")
    print(f"  tax id values delivered: {values} across {len(docs_with_tax)} documents; "
          f"rejected by the rule: {sum(len(v) for v in tax_bad.values())} values in {len(tax_bad)} documents")
    print(f"    (R6-14 measured the same figure on the old prompt at 25 documents / 56 reads)")
    for d, items in sorted(tax_bad.items())[:12]:
        print(f"     DMS-{d}: " + "; ".join(f"{n}={v!r} {w}" for n, v, w in items))
    print(f"  NO_GEOMETRY reads: {len(no_geo)} {sorted(set(no_geo))}")
    print(f"  second-look adjudication: {len(adj_docs)} documents {adj_docs[:14]}")
    print(f"  documents the gate sent nothing to extract: {len(gate_drop)} {gate_drop[:30]}")
    print(f"  documents that delivered no field at all: {len(empty)} {empty}")
    print(f"  page_errors entries: {len(perr)}")
    for d, pg, m in perr[:12]:
        print(f"     DMS-{d} p{pg}: {m}")

    print("\n  ambiguity ruling on the real corpus run:")
    for did, want in sorted(AMBIGUITY.items()):
        got = (((pay.get(did) or {}).get("fields") or {}).get("invoice_num") or {}).get("raw")
        oldv = (((old.get(did) or {}).get("fields") or {}).get("invoice_num") or {}).get("raw")
        print(f"     DMS-{did}: wanted {want!r} -> delivered {got!r} "
              f"({'OK' if (got or '').strip() == want else 'NOT the ruled number'}); repB said {oldv!r}")

    moved = []
    for did in sorted(set(pay) & set(old)):
        for k in FIELDS:
            a = (((old.get(did) or {}).get("fields") or {}).get(k) or {}).get("raw")
            b = (((pay.get(did) or {}).get("fields") or {}).get(k) or {}).get("raw")
            if (a or None) != (b or None):
                moved.append((did, k, a, b))
    print(f"\n  key-field values that changed since repB (extract@1.3.0, no retry): {len(moved)} field reads "
          f"over {len({m[0] for m in moved})} documents")
    for m in moved[:20]:
        print(f"     DMS-{m[0]} {m[1]}: {m[2]!r} -> {m[3]!r}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
