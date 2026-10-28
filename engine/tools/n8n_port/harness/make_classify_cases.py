"""harness/make_classify_cases.py - สร้าง input+expected สำหรับเทียบ node 05 กับ python

  $PY harness/make_classify_cases.py        # เขียน fixtures/classify_cases.json (input + คำตอบของ python)

node เทส (harness/test_classify_select.mjs) จะรันโค้ด node 05 จริงด้วย input ชุดเดียวกัน แล้วต้องได้
pages_classification + selection เหมือน python ทุก key  เคสทั้งหมดสังเคราะห์ขึ้นให้คลุมกติกาที่
select_invoice_pages ใช้ (tax/invoice ผสม, หลายเลขที่, สำเนา, marker ขาด, ไม่มีหน้า invoice, p หาย)
"""
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'src'))
for line in open(os.path.join(ROOT, '..', '..', '.env'), encoding='utf-8'):
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.strip().split('=', 1)
        os.environ.setdefault(k, v)
from system_a.perception.single_pass import normalize_classify, select_invoice_pages  # noqa: E402

CASES = [
    ("one tax invoice page", {"pages": [{"p": 1, "t": "tax_invoice", "c": "original", "n": "BMS-001", "m": "1/1", "h": [], "r": 0}]}),
    ("tax wins over invoice", {"pages": [{"p": 1, "t": "invoice", "n": "INV-9"}, {"p": 2, "t": "tax_invoice", "n": "INV-9", "m": "2/2"}]}),
    ("delivery note only -> fallback first page", {"pages": [{"p": 1, "t": "delivery", "n": "DN-1"}, {"p": 2, "t": "other"}]}),
    ("two invoice numbers -> keep the first", {"pages": [
        {"p": 1, "t": "tax_invoice", "n": "INV-A", "m": "1/2"}, {"p": 2, "t": "tax_invoice", "n": "INV-A", "m": "2/2"},
        {"p": 3, "t": "tax_invoice", "n": "INV-B", "m": "1/1"}]}),
    ("copy sheet dropped when original exists", {"pages": [
        {"p": 1, "t": "tax_invoice", "c": "original", "n": "INV-C", "m": "1/1"},
        {"p": 2, "t": "tax_invoice", "c": "copy", "n": "INV-C", "m": "1/1"}]}),
    ("same number+marker reprint dropped", {"pages": [
        {"p": 1, "t": "tax_invoice", "n": "INV-D", "m": "1/2"}, {"p": 2, "t": "tax_invoice", "n": "INV-D", "m": "1/2"}]}),
    ("unmarked page beyond printed count dropped", {"pages": [
        {"p": 1, "t": "tax_invoice", "n": "INV-E", "m": "1/1"}, {"p": 2, "t": "tax_invoice", "n": "INV-E"}]}),
    ("marker gap -> pages_complete false", {"pages": [
        {"p": 1, "t": "tax_invoice", "n": "INV-F", "m": "1/3"}, {"p": 3, "t": "tax_invoice", "n": "INV-F", "m": "3/3"}]}),
    ("missing p -> index+1, rotate kept", {"pages": [{"t": "tax_invoice", "n": "INV-G", "r": 90},
                                                     {"t": "tax_invoice", "n": "INV-G", "r": 270}]}),
    ("zero/empty p falls through like python 'or'", {"pages": [{"p": 0, "t": "tax_invoice", "n": "INV-H"},
                                                               {"p": "", "t": "tax_invoice", "n": "INV-H"}]}),
    ("thai digits + thai marker", {"pages": [{"p": 1, "t": "Tax Invoice", "n": "เลขที่ ๑๒๓", "m": "๑/๒"},
                                             {"p": 2, "t": "tax_invoice", "n": "เลขที่ ๑๒๓", "m": "๒/๒"}]}),
    ("garbage type + handwritten kept", {"pages": [{"p": 1, "t": "ใบกำกับภาษี", "n": "INV-I", "h": ["12", " ลงชื่อ"], "r": 135}]}),
    ("empty answer", {}),
    ("rotate only on invoice page", {"pages": [{"p": 1, "t": "other", "r": 90}, {"p": 2, "t": "tax_invoice", "n": "INV-J", "r": 180}]}),
]
out = []
for name, raw in CASES:
    n = max([int(e.get("p") or 0) for e in raw.get("pages", []) if isinstance(e, dict)] or [len(raw.get("pages", [])) or 1])
    n = max(n, len(raw.get("pages", [])) or 1)
    pages = normalize_classify(raw, n)
    sel = select_invoice_pages(pages)
    out.append({"name": name, "n_pages": n, "raw": raw,
                "pages_classification": pages, "selection": sel,
                "selected": sel["selected"], "invoice_page": (sel["selected"] or [1])[0]})
p = os.path.join(ROOT, 'fixtures', 'classify_cases.json')
io.open(p, 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=1))
print("wrote %s (%d cases)" % (p, len(out)))
