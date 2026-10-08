"""v4 — the keys a receipt can be found with, taken from the document itself.

ORA-02 (2026-10-07) measured why the Tax ID + Invoice lookup missed receipts that exist:

* the reader picked the wrong printed number as ``invoice_num`` although the true number is printed on
  another invoice page (DMS-40: work-order ``OSP-…`` vs tax invoice ``ED6909/0142`` on pages 2/4/5;
  DMS-47: delivery slip ``A-0008`` vs ``IV2609057``; DMS-64: ``3126090`` truncated, ``312609020165``
  on pages 1-3);
* the receiver writes the EBS ``RECEIPT_NUM`` on the document (``50220043380``, ``530336911``), which
  equals the receipt in every readable case.

Nothing here decides anything.  It only lists candidates, each with where it was printed; Oracle finding
a receipt with one of them (same supplier) is the evidence, and the caller records which one matched.
"""
from __future__ import annotations

import re
from collections import Counter
from typing import Iterable, Optional

from ..domain.normalize import thai_to_arabic
from .invoice_variants import safe_invoice

_TOKEN = re.compile(r"[A-Za-z0-9][A-Za-z0-9/\-_.]*")
_LABEL_WORDS = re.compile(r"^(NO|NUMBER|INVOICE|TAX|DOC|REF|DOCUMENT|DATE|PO|PAGE|BILL|ORDER|RECEIPT|"
                          r"RECEIVING|SHIPPING|PSC|PURCHASE|CONFIRM|WORK|REV)\.?:?$", re.I)
_DATE3 = re.compile(r"^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})$")


def norm_key(s) -> str:
    """Comparison form of an invoice number: Thai digits -> Arabic, no spaces, upper case."""
    return re.sub(r"\s+", "", thai_to_arabic(str(s or ""))).upper()


def _is_date(k: str) -> bool:
    """dd/mm/yyyy, dd/mm/yy or yyyy/mm/dd with a real day and month ("69/09/0059" is not a date)."""
    m = _DATE3.match(k)
    if not m:
        return False
    a, b, c = m.groups()
    if len(a) == 4:
        y, mo, d = int(a), int(b), int(c)
        return 1 <= mo <= 12 and 1 <= d <= 31 and (1900 <= y <= 2100 or 2400 <= y <= 2700)
    d, mo = int(a), int(b)
    if not (1 <= d <= 31 and 1 <= mo <= 12):
        return False
    return len(c) == 2 or (len(c) == 4 and (1900 <= int(c) <= 2100 or 2400 <= int(c) <= 2700))


def _tokens(text: str) -> list[str]:
    """Identifier-shaped tokens of one printed region ("เลขที่ ED6909/0142", "Ref: X|43031517")."""
    out = []
    for part in re.split(r"[|,;]", thai_to_arabic(str(text or ""))):
        part = part.strip()
        whole = norm_key(re.sub(r"^[^A-Za-z0-9]*", "", part))
        toks = [t.rstrip(".:-") for t in _TOKEN.findall(part)]
        toks = [t for t in toks if t and not _LABEL_WORDS.match(t)]
        out += toks
        # "TAX INV.69-09-007": the printed number contains a space; the joined form is a candidate too
        if whole and whole not in out and 1 < len(toks) <= 3 and len(whole) <= 40:
            out.append(whole)
    return out


def _usable(tok: str, exclude: set, not_shapes=()) -> bool:
    k = norm_key(tok)
    if not k or k in exclude or not safe_invoice(k) or not re.search(r"\d", k):
        return False
    digits = re.sub(r"\D", "", k)
    if k.isdigit() and len(k) in (8, 13):          # a PO / Tax ID printed next to the number
        return False
    if digits in exclude and len(digits) >= 8:     # "PO.43029104": the PO number with its label
        return False
    if k.isdigit() and any(k.startswith(pre) and len(k) == ln for pre, ln in not_shapes):
        return False                               # a RECEIPT_NUM, not an invoice number
    if _is_date(k) or len(digits) < 3:
        return False
    return True


def document_candidates(extra: dict, primary: Optional[str], *, page_types: Iterable[str],
                        labels: Iterable[str], exclude: Iterable[str] = (),
                        crop_alternates: bool = True, receipt_patterns: Iterable[dict] = ()) -> list[dict]:
    """Other invoice numbers printed on invoice-type pages, most frequent first.

    ``[{"key": "ED6909/0142", "pages": [2, 4, 5], "labels": ["doc_no", "invoice_ref"]}, ...]``
    """
    extra = extra or {}
    types = {str(t).lower() for t in page_types}
    want = tuple(str(l).lower() for l in labels)
    page_type = {str(k): str(v).lower() for k, v in (extra.get("doc_type_by_page") or {}).items()}
    ex = {norm_key(x) for x in exclude if x} | ({norm_key(primary)} if primary else set())
    shapes = [(str(p["prefix"]), int(p["length"])) for p in receipt_patterns or () if p.get("prefix")]
    seen: dict[str, dict] = {}
    count: Counter = Counter()
    for page, items in sorted((extra.get("items_by_page") or {}).items(), key=lambda kv: int(kv[0])):
        if page_type.get(str(page)) not in types:
            continue
        for it in items or []:
            label = str(it.get("label") or "").lower()
            if not label.startswith(want):
                continue
            for tok in _tokens(it.get("text")):
                if not _usable(tok, ex, shapes):
                    continue
                k = norm_key(tok)
                d = seen.setdefault(k, {"key": k, "pages": [], "labels": [], "source": "document"})
                if int(page) not in d["pages"]:
                    d["pages"].append(int(page))
                if label not in d["labels"]:
                    d["labels"].append(label)
                count[k] += 1
    # "076" + "3792" printed as two doc_no regions of one page = "076/3792" in EBS (DMS-76): the joined form
    # is one more candidate, only for doc_no-labelled numeric parts of the same page.
    for page, items in (extra.get("items_by_page") or {}).items():
        if page_type.get(str(page)) not in types:
            continue
        parts = [norm_key(it.get("text")) for it in items or []
                 if str(it.get("label") or "").lower().startswith("doc_no")]
        parts = [p for p in parts if p.isdigit() and 3 <= len(p) <= 8]
        for a, b in zip(parts, parts[1:]):
            k = f"{a}/{b}"
            if k not in seen and _usable(k, ex, shapes):
                seen[k] = {"key": k, "pages": [int(page)], "labels": ["doc_no+doc_no"], "source": "joined"}
    if crop_alternates:
        for c in extra.get("crop_reads") or []:
            if c.get("field") != "invoice_num":
                continue
            for raw in (c.get("crop"), c.get("vlm")):
                for tok in _tokens(raw):
                    if _usable(tok, ex, shapes) and norm_key(tok) not in seen:
                        k = norm_key(tok)
                        seen[k] = {"key": k, "pages": [c.get("page")], "labels": ["crop_reread"],
                                   "source": "crop"}
                        count[k] += 1
    return sorted(seen.values(), key=lambda d: (-count[d["key"]], min(p or 0 for p in d["pages"]), d["key"]))


def receipt_num_candidates(extra: dict, patterns: Iterable[dict], limit: int = 2) -> list[dict]:
    """RECEIPT_NUM-shaped tokens printed/written anywhere on the document, most frequent first.

    Only an exact full-length token with a configured ORG prefix counts ("5022004338?" is not one)."""
    pats = [(str(p["prefix"]), int(p["length"])) for p in patterns or () if p.get("prefix") and p.get("length")]
    if not pats:
        return []
    found: dict[str, dict] = {}
    count: Counter = Counter()
    rx = re.compile(r"(?<![0-9])([0-9]{6,15})(?![0-9])")
    for page, items in sorted(((extra or {}).get("items_by_page") or {}).items(), key=lambda kv: int(kv[0])):
        for it in items or []:
            text = re.sub(r"\s+", "", thai_to_arabic(str(it.get("text") or "")))
            for m in rx.finditer(text):
                n = m.group(1)
                if not any(n.startswith(pre) and len(n) == ln for pre, ln in pats):
                    continue
                d = found.setdefault(n, {"receipt_num": n, "pages": [], "labels": []})
                if int(page) not in d["pages"]:
                    d["pages"].append(int(page))
                lab = str(it.get("label") or "")
                if lab not in d["labels"]:
                    d["labels"].append(lab)
                count[n] += 1
    ranked = sorted(found.values(), key=lambda d: (-count[d["receipt_num"]], min(d["pages"]), d["receipt_num"]))
    return ranked[:max(0, int(limit))]
