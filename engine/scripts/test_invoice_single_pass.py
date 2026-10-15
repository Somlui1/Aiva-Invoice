#!/usr/bin/env python3
"""Two-Step Pipeline for Invoice Extraction & BBox Testing.

Architecture:
Step 1: Fast Multi-Image Classification & Selection (~4-7s)
   - Sends all pages of the document in one request to classify page types.
   - Detects is_invoice (including combined Delivery/Tax Invoice, Receipt/Tax Invoice).
   - Detects is_original vs is_copy (filtering out "สำเนา", "คู่ฉบับ", "COPY", etc.).
   - Prioritizes ORIGINAL invoice pages and discards copies and non-invoice attachments.

Step 2: Focused Single-Page Extraction on Selected Invoice Pages (~10-15s per invoice page)
   - Sends ONLY the selected invoice page(s) individually as a single image.
   - Eliminates multi-image vision spatial compression (BBox Y-axis remains 100% accurate).
   - Extracts all readable bboxes for visual audit and required fields for validation.

Usage:
    python scripts/test_invoice_single_pass.py --doc-id 48
    python scripts/test_invoice_single_pass.py --doc-id 20 --model Qwen3-VL-8B-Instruct
    python scripts/test_invoice_single_pass.py --tag invoice --skip-existing
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import os
import random
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pymupdf as fitz
import requests
from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image, ImageDraw, ImageFont

# Ensure stdout uses UTF-8 on Windows
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

# Load environment
_env_path = ROOT / ".env"
load_dotenv(_env_path)

LITELLM_URL = os.getenv("LITELLM_URL", "http://aiva.aapico.com:4000/v1")
LITELLM_KEY = os.getenv("LITELLM_API_KEY") or os.getenv("LITELLM_KEY", "")
VLM_MODEL = os.getenv("MODEL_VISION") or os.getenv("VLM_MODEL", "nvidia/Qwen3.8-Flash-Next-NVFP4")
PL_URL = os.getenv("PAPERLESS_BASE_URL", "http://dms.aapico.com").rstrip("/")
PL_TOKEN = os.getenv("PAPERLESS_API_TOKEN", "")
CLASSIFY_DPI = int(os.getenv("CLASSIFY_DPI", "80"))
RENDER_DPI = int(os.getenv("RENDER_DPI", "130"))
MAX_TOKENS = int(os.getenv("VLM_MAX_TOKENS", "8000"))
# Step 1 used to be pinned at 4096: a thinking model spends that on its preamble and the JSON never
# arrives, which is what the round logs reported as "Failed to parse valid JSON from VLM response".
CLASSIFY_MAX_TOKENS = int(os.getenv("VLM_MAX_TOKENS_CLASSIFY", "8000"))

COLORS = {
    "header": "#d62728",      # Red
    "supplier": "#ff7f0e",    # Orange
    "customer": "#9467bd",    # Purple
    "table": "#7f7f7f",       # Gray
    "line": "#1f77b4",        # Blue
    "total": "#2ca02c",       # Green
    "payment": "#bcbd22",     # Olive
    "signature": "#e377c2",   # Pink
    "stamp": "#8c564b",       # Brown
    "other": "#17becf",       # Cyan
}

REQUIRED_FIELD_NAMES = [
    "invoice_num", "invoice_date", "po_number", "supplier_name",
    "supplier_tax_id", "customer_name", "customer_tax_id",
    "customer_address", "sub_total", "vat", "grand_total", "currency"
]

THAI_DIGITS_MAP = str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789")

UOM_MAP = {
    "pc": "PC", "pcs": "PC", "piece": "PC", "pieces": "PC", "ชิ้น": "PC", "อัน": "PC", "ลูก": "PC",
    "set": "SET", "sets": "SET", "ชุด": "SET",
    "kg": "KG", "kgs": "KG", "กิโลกรัม": "KG", "กก": "KG", "กก.": "KG",
    "box": "BOX", "กล่อง": "BOX", "ลัง": "BOX",
    "pack": "PACK", "แพ็ค": "PACK", "ห่อ": "PACK",
    "m": "M", "meter": "M", "เมตร": "M", "ม.": "M",
    "lot": "LOT", "งาน": "LOT", "งวด": "LOT"
}


def normalize_text(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    s = str(raw).strip()
    s = re.sub(r"\s+", " ", s)
    return s if s else None


def normalize_tax_id(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    s = str(raw).translate(THAI_DIGITS_MAP)
    d = re.sub(r"\D", "", s)
    return d if d else None


def normalize_number(raw: Optional[str]) -> Optional[float]:
    if raw is None:
        return None
    s = str(raw).translate(THAI_DIGITS_MAP)
    s = re.sub(r"[฿THBบาท\s]", "", s, flags=re.I)
    is_neg = False
    if s.startswith("(") and s.endswith(")"):
        is_neg = True
        s = s[1:-1]
    s = s.replace(",", "")
    m = re.search(r"^-?\d+(?:\.\d+)?", s)
    if m:
        try:
            val = float(m.group(0))
            if is_neg:
                val = -val
            return round(val, 2)
        except ValueError:
            return None
    return None


MONTH_NAME_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    "ม.ค": 1, "ก.พ": 2, "มี.ค": 3, "เม.ย": 4, "พ.ค": 5, "มิ.ย": 6,
    "ก.ค": 7, "ส.ค": 8, "ก.ย": 9, "ต.ค": 10, "พ.ย": 11, "ธ.ค": 12,
    "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4, "พฤษภาคม": 5, "มิถุนายน": 6,
    "กรกฎาคม": 7, "สิงหาคม": 8, "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
}


def normalize_date(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    s = str(raw).translate(THAI_DIGITS_MAP).strip()

    # Match named month: e.g. "4 Sep 2026", "07-SEP-2026", "4 ก.ย. 2569"
    m_named = re.match(r"^(\d{1,2})[-/\s]+([a-zA-Zก-๙.]+)[-/\s]+(\d{2,4})$", s)
    if m_named:
        d = int(m_named.group(1))
        mon_str = m_named.group(2).lower().rstrip(".")
        y = int(m_named.group(3))
        m = None
        for k, v in MONTH_NAME_MAP.items():
            if k.rstrip(".") == mon_str or mon_str.startswith(k[:3]):
                m = v
                break
        if m:
            if y < 100:
                y += 2000
            elif y > 2400:
                y -= 543
            return f"{y:04d}-{m:02d}-{d:02d}"

    s_clean = re.sub(r"[/.]", "-", s)
    m1 = re.match(r"^(\d{1,2})-(\d{1,2})-(\d{2,4})$", s_clean)
    if m1:
        d, m, y = int(m1.group(1)), int(m1.group(2)), int(m1.group(3))
        if y < 100:
            y += 2000
        elif y > 2400:
            y -= 543
        return f"{y:04d}-{m:02d}-{d:02d}"
    m2 = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", s_clean)
    if m2:
        y, m, d = int(m2.group(1)), int(m2.group(2)), int(m2.group(3))
        if y > 2400:
            y -= 543
        return f"{y:04d}-{m:02d}-{d:02d}"
    return s


def normalize_uom(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    s = str(raw).strip()
    s = re.sub(r"^/\s*", "", s).strip()
    return UOM_MAP.get(s.lower(), s.upper())


def normalize_field_value(field_name: str, raw_val: Optional[str]) -> Any:
    if raw_val is None:
        return None
    if field_name in ("sub_total", "vat", "grand_total"):
        return normalize_number(raw_val)
    elif field_name in ("supplier_tax_id", "customer_tax_id"):
        return normalize_tax_id(raw_val)
    elif field_name == "invoice_date":
        return normalize_date(raw_val)
    elif field_name == "currency":
        c = normalize_text(raw_val)
        return "THB" if c and c.upper() in ("THB", "฿", "บาท") else (c.upper() if c else "THB")
    else:
        return normalize_text(raw_val)


# --- Prompt 1: Fast Page Classification (Two-Dimensional) ---
PROMPT_CLASSIFY = """You are a document classifier for Thai and English accounting documents.
Review each page image in order (Image 1 = Page 1 ... Image N = Page N) and classify each page:
1. "page_no": integer (1-indexed page in this PDF)
2. "doc_type": "tax_invoice" | "invoice" | "delivery" | "po" | "other"
   - "tax_invoice": has "ใบกำกับภาษี" / "TAX INVOICE" wording (or combined "ใบส่งของ/ใบกำกับภาษี", "ใบเสร็จรับเงิน/ใบกำกับภาษี").
   - "invoice": has "ใบแจ้งหนี้" / "INVOICE" without tax invoice wording.
   - "delivery": standalone "ใบส่งของ" / "ใบส่งสินค้า" / "DELIVERY ORDER" without tax invoice wording.
   - "po": "ใบสั่งซื้อ" / "PURCHASE ORDER".
   - "other": supporting documents (payment slip, receipt, packing list, etc.).
3. "copy_status": "original" | "copy" | "unknown"
   - "copy": contains copy markings ("สำเนา", "คู่ฉบับ", "COPY", "DUPLICATE", stamped "สำเนา", or watermark "สำเนา"). If another page already has "ต้นฉบับ" / "ORIGINAL" for the same document number, mark duplicate pages as "copy".
   - "original": contains "ต้นฉบับ", "ORIGINAL", or has NO copy marks at all (presumed original).
4. "doc_no_hint": exact printed document/invoice number if visible on this page (or null).
5. "page_marker": printed page position if any (e.g. "1/2", "2/2", "1/1", or null).
6. "rotate_degrees": 0 | 90 | 180 | 270
   - Clockwise degrees needed to rotate this page so the text reads upright horizontally from left to right (0 if already upright, 90 if rotated 90° CCW / lying on left side, 180 if upside down, 270 if rotated 90° CW / lying on right side).

CRITICAL INSTRUCTION:
Output ONLY raw JSON starting with '{' and ending with '}'. Do NOT output any reasoning, analysis, chain of thought, or preamble text.

Return ONLY valid JSON:
{
  "pages": [
    {"page_no": 1, "doc_type": "tax_invoice", "copy_status": "original", "doc_no_hint": "IV260904/003", "page_marker": "1/1", "rotate_degrees": 0}
  ]
}"""


def group_and_select_invoice_pages(
    pages_classification: List[dict]
) -> Tuple[List[int], bool, bool, Dict[int, int]]:
    """
    Groups pages and selects primary invoice page(s).
    Returns: (selected_pages, is_original, multi_invoice_detected, page_rotations)
    """
    page_rotations = {
        int(p.get("page_no", i + 1)): int(p.get("rotate_degrees") or 0)
        for i, p in enumerate(pages_classification)
    }

    inv_pages = [p for p in pages_classification if p.get("doc_type") in ("tax_invoice", "invoice")]
    if not inv_pages:
        return [1], True, False, page_rotations

    hints = set()
    for p in inv_pages:
        h = (p.get("doc_no_hint") or "").strip()
        if h and len(h) >= 3:
            hints.add(h)
    multi_invoice_detected = len(hints) > 1

    orig_invoices = [p for p in inv_pages if p.get("copy_status") == "original"]
    copy_invoices = [p for p in inv_pages if p.get("copy_status") == "copy"]

    if orig_invoices:
        target_list = orig_invoices
        is_orig = True
    elif copy_invoices:
        target_list = copy_invoices
        is_orig = False
    else:
        target_list = inv_pages
        is_orig = True

    if multi_invoice_detected:
        first_hint = (target_list[0].get("doc_no_hint") or "").strip()
        if first_hint:
            selected = [p["page_no"] for p in target_list if (p.get("doc_no_hint") or "").strip() == first_hint]
            if selected:
                return sorted(selected), is_orig, True, page_rotations

    # Deduplicate re-prints: track (doc_no_hint, page_marker)
    seen_markers = set()
    deduped = []
    for p in target_list:
        doc_key = (p.get("doc_no_hint") or "").strip()
        marker = (p.get("page_marker") or "").strip()
        if doc_key and marker:
            key = f"{doc_key}::{marker}"
        elif doc_key:
            key = f"{doc_key}::default"
        else:
            key = None

        if key and key in seen_markers:
            continue
        if key:
            seen_markers.add(key)
        deduped.append(p["page_no"])

    selected = deduped if deduped else [p["page_no"] for p in target_list]
    return sorted(selected) if selected else [1], is_orig, multi_invoice_detected, page_rotations


# --- Prompt 2: Focused Extraction on One Invoice Page (Compact & Extended Schema) ---
PROMPT_EXTRACT = """You are an OCR and key information extraction engine for Thai/English invoices.
This image is ONE INVOICE PAGE (Page {page_no} of the document).

Extract 3 sections from this page:
1. "fields": Required header fields:
   - "invoice_num": เลขที่ใบแจ้งหนี้/ใบกำกับภาษี
   - "invoice_date": วันที่เอกสาร (DD/MM/YYYY or YYYY-MM-DD)
   - "po_number": เลขที่ใบสั่งซื้อ (PO)
   - "supplier_name": ชื่อบริษัทผู้ขาย
   - "supplier_tax_id": เลขประจำตัวผู้เสียภาษี 13 หลักของผู้ขาย
   - "customer_name": ชื่อลูกค้า (เช่น บริษัท อาปิโก ...)
   - "customer_tax_id": เลขประจำตัวผู้เสียภาษีลูกค้า
   - "customer_address": ที่อยู่ลูกค้าที่พิมพ์บนเอกสาร
   - "sub_total": มูลค่าสินค้าก่อนภาษี (ตัวเลข)
   - "vat": ภาษีมูลค่าเพิ่ม 7% (ตัวเลข)
   - "grand_total": จำนวนเงินรวมทั้งสิ้น (ตัวเลข)
   - "currency": สกุลเงิน (e.g. "THB")
   For each field, return: {"raw": "exact printed text", "bbox_2d": [x1, y1, x2, y2]} in 0..1000 scale.
   (If a field is not present on this page, return {"raw": null, "bbox_2d": null}).

2. "line_items": Array of item rows on this page:
   Each row: {
     "line_no": 1,
     "item_code": {"raw": "...", "bbox_2d": [x1,y1,x2,y2]},
     "description": {"raw": "...", "bbox_2d": [x1,y1,x2,y2]},
     "qty": {"raw": "...", "bbox_2d": [x1,y1,x2,y2]},
     "uom": {"raw": "...", "bbox_2d": [x1,y1,x2,y2]},
     "unit_price": {"raw": "...", "bbox_2d": [x1,y1,x2,y2]},
     "amount": {"raw": "...", "bbox_2d": [x1,y1,x2,y2]},
     "line_bbox": [x1, y1, x2, y2]
   }

3. "regions": Structural and audit visual regions on this page:
   Array of: {"type": "table"|"stamp"|"signature"|"other", "label": "items_table"|"company_stamp"|"receiver_signature"|"deliverer_signature", "bbox_2d": [x1,y1,x2,y2]}

CRITICAL INSTRUCTION:
Output ONLY raw JSON starting with '{' and ending with '}'. Do NOT output reasoning or conversational text.

Return ONLY valid JSON:
{
  "fields": {
    "invoice_num": {"raw": "26/2691", "bbox_2d": [722, 138, 852, 152]},
    "invoice_date": {"raw": "02/09/2569", "bbox_2d": [722, 162, 852, 176]},
    "po_number": {"raw": "42052405", "bbox_2d": [48, 272, 222, 318]},
    "supplier_name": {"raw": "บริษัท ไทยเวิร์ธ จำกัด", "bbox_2d": [48, 60, 450, 80]},
    "supplier_tax_id": {"raw": "0105537063173", "bbox_2d": [48, 88, 352, 102]},
    "customer_name": {"raw": "บริษัท อาปิโก ไฮเทค พูลทิง จำกัด", "bbox_2d": [48, 180, 450, 200]},
    "customer_tax_id": {"raw": "0145548001557", "bbox_2d": [48, 205, 350, 220]},
    "customer_address": {"raw": "99/1 ม.1 นิคมอุตสาหกรรมไฮเทค...", "bbox_2d": [48, 220, 500, 235]},
    "sub_total": {"raw": "49215.00", "bbox_2d": [752, 662, 998, 676]},
    "vat": {"raw": "3445.05", "bbox_2d": [602, 722, 998, 736]},
    "grand_total": {"raw": "52660.05", "bbox_2d": [602, 742, 998, 756]},
    "currency": {"raw": "THB", "bbox_2d": [752, 662, 780, 676]}
  },
  "line_items": [
    {
      "line_no": 1,
      "item_code": {"raw": "509-1200-150", "bbox_2d": [48, 380, 200, 395]},
      "description": {"raw": "SOLID CARBIDE BN45 BALLNOSE ENDMILL", "bbox_2d": [205, 380, 600, 395]},
      "qty": {"raw": "3", "bbox_2d": [610, 380, 650, 395]},
      "uom": {"raw": "PCS", "bbox_2d": [655, 380, 700, 395]},
      "unit_price": {"raw": "3794.00", "bbox_2d": [710, 380, 800, 395]},
      "amount": {"raw": "11382.00", "bbox_2d": [810, 380, 990, 395]},
      "line_bbox": [20, 375, 995, 400]
    }
  ],
  "regions": [
    {"type": "table", "label": "items_table", "bbox_2d": [20, 350, 995, 650]},
    {"type": "stamp", "label": "company_stamp", "bbox_2d": [700, 800, 850, 900]},
    {"type": "signature", "label": "receiver_signature", "bbox_2d": [100, 850, 300, 920]}
  ]
}"""

_print_lock = threading.Lock()


def log(*args):
    with _print_lock:
        print(*args, flush=True)


def parse_ids(s: str) -> List[int]:
    out = []
    for part in filter(None, (x.strip() for x in s.split(","))):
        if "-" in part:
            a, b = part.split("-", 1)
            out.extend(range(int(a), int(b) + 1))
        else:
            out.append(int(part))
    return out


def fetch_pdf(doc_id: int) -> Tuple[bytes, dict]:
    cache_dir = ROOT / ".cache" / "downloads"
    cache_dir.mkdir(parents=True, exist_ok=True)
    cached_pdf = cache_dir / f"DMS-{doc_id}.pdf"
    if cached_pdf.exists():
        return cached_pdf.read_bytes(), {"id": doc_id, "title": f"DMS-{doc_id}"}

    headers = {"Authorization": f"Token {PL_TOKEN}", "Accept": "application/json"}
    meta_url = f"{PL_URL}/api/documents/{doc_id}/"
    meta_res = requests.get(meta_url, headers=headers, timeout=30)
    meta_res.raise_for_status()
    meta = meta_res.json()

    dl_url = f"{PL_URL}/api/documents/{doc_id}/download/"
    r = requests.get(dl_url, params={"original": "true"}, headers=headers, timeout=180)
    r.raise_for_status()
    pdf_bytes = r.content
    if not pdf_bytes.startswith(b"%PDF"):
        r2 = requests.get(dl_url, headers=headers, timeout=180)
        if r2.ok and r2.content.startswith(b"%PDF"):
            pdf_bytes = r2.content

    cached_pdf.write_bytes(pdf_bytes)
    return pdf_bytes, meta


def render_pdf_pages(pdf_bytes: bytes, dpi: int = RENDER_DPI) -> List[Tuple[int, Image.Image]]:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for i in range(len(doc)):
        pix = doc[i].get_pixmap(dpi=dpi)
        img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        pages.append((i + 1, img))
    return pages


def detect_coord_mode(boxes: List[List[float]], img_w: int, img_h: int) -> str:
    vals = [float(v) for b in boxes if b and len(b) == 4 for v in b]
    if not vals:
        return "norm1000"
    mx = max(vals)
    if mx <= 1.0:
        return "norm1"
    if mx > 1000:
        return "pixel"
    return "norm1000" if max(img_w, img_h) > 1100 else "pixel"


def to_px(b: List[float], img_w: int, img_h: int, mode: str) -> Tuple[float, float, float, float]:
    x1, y1, x2, y2 = (float(v) for v in b[:4])
    if mode == "norm1000":
        x1, x2 = x1 * img_w / 1000.0, x2 * img_w / 1000.0
        y1, y2 = y1 * img_h / 1000.0, y2 * img_h / 1000.0
    elif mode == "norm1":
        x1, x2, y1, y2 = x1 * img_w, x2 * img_w, y1 * img_h, y2 * img_h
    x1, x2 = sorted((max(0.0, min(float(img_w), x1)), max(0.0, min(float(img_w), x2))))
    y1, y2 = sorted((max(0.0, min(float(img_h), y1)), max(0.0, min(float(img_h), y2))))
    return x1, y1, x2, y2


def px_to_norm_xywh(rect: Tuple[float, float, float, float], img_w: int, img_h: int) -> List[float]:
    x1, y1, x2, y2 = rect
    w, h = max(img_w, 1), max(img_h, 1)
    x, y = max(0.0, min(1.0, x1 / w)), max(0.0, min(1.0, y1 / h))
    return [
        round(x, 4),
        round(y, 4),
        round(max(0.0, min(1.0 - x, (x2 - x1) / w)), 4),
        round(max(0.0, min(1.0 - y, (y2 - y1) / h)), 4)
    ]


def get_font(size: int = 15):
    for f in ("tahoma.ttf", "C:/Windows/Fonts/tahoma.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


def draw_bboxes(img: Image.Image, items: List[dict], coord_mode: str) -> Image.Image:
    out = img.copy()
    draw = ImageDraw.Draw(out, "RGBA")
    f = get_font()
    w, h = img.size

    for it in items:
        box = it.get("bbox_2d")
        if not box or len(box) != 4:
            continue
        try:
            x1, y1, x2, y2 = to_px(box, w, h, coord_mode)
        except Exception:
            continue
        if x2 - x1 < 3 or y2 - y1 < 3:
            continue

        c = COLORS.get(it.get("type"), COLORS["other"])
        draw.rectangle([x1, y1, x2, y2], outline=c, width=3)

        label = str(it.get("label") or it.get("type") or "?")
        text = str(it.get("text") or "")
        tag = f"{label}: {text[:20]}" if text else label

        tw = draw.textlength(tag, font=f)
        ty = y1 - 20 if y1 > 20 else y2 + 2
        draw.rectangle([x1, ty, x1 + tw + 6, ty + 19], fill=c)
        draw.text((x1 + 3, ty + 1), tag, fill="white", font=f)

    return out


def json_candidates(text: str) -> List[str]:
    """Every balanced ``{...}`` region in *text*, longest first (a thinking model puts prose around the JSON)."""
    found: List[str] = []
    for i, ch in enumerate(text):
        if ch != "{":
            continue
        depth, in_str, esc = 0, False, False
        for j in range(i, len(text)):
            c = text[j]
            if in_str:
                if esc:
                    esc = False
                elif c == "\\":
                    esc = True
                elif c == '"':
                    in_str = False
                continue
            if c == '"':
                in_str = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    found.append(text[i:j + 1])
                    break
    seen: set = set()
    uniq = [c for c in found if not (c in seen or seen.add(c))]
    uniq.sort(key=len, reverse=True)
    return uniq


def attempt_max_tokens(base: int, attempt: int) -> int:
    """A thinking model that spends its budget on the preamble needs a bigger second attempt."""
    return base if attempt <= 0 else min(base * (2 ** attempt), 32768)


def _clean_json_response(raw_text: str) -> dict:
    raw_text = re.sub(r"<think(?:ing)?>.*?</think(?:ing)?>", "", raw_text, flags=re.S)
    raw_text = re.sub(r"```(?:json)?", "", raw_text)
    for cand in json_candidates(raw_text):
        for variant in (cand, re.sub(r",\s*([}\]])", r"\1", cand)):   # tolerate a trailing comma
            try:
                obj = json.loads(variant)
            except Exception:
                continue
            if isinstance(obj, dict):
                return obj
    raise ValueError(f"Failed to parse valid JSON from VLM response: {raw_text[:300]}")


def step1_classify_pages(
    client: OpenAI, pdf_bytes: bytes, model: str = VLM_MODEL, dpi: int = CLASSIFY_DPI
) -> Tuple[dict, float]:
    """Step 1: Fast multi-image classification to detect invoice pages, original vs copy, and rotation."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    content: List[dict] = []

    # Qwen/vLLM layout: ALL image_urls FIRST
    for i in range(len(doc)):
        pix = doc[i].get_pixmap(dpi=dpi)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=70)
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}})

    # Followed by text prompt at the end
    instruction = (
        f"{PROMPT_CLASSIFY}\n\nReview the {len(doc)} pages above in order (Image 1 = Page 1 ... Image {len(doc)} = Page {len(doc)})."
    )
    content.append({"type": "text", "text": instruction})

    last_err = None
    for attempt in range(3):
        try:
            t0 = time.time()
            ask = content + ([{"type": "text",
                              "text": "Output ONLY the JSON object. No explanation, no preamble."}]
                             if attempt else [])
            response = client.chat.completions.create(
                model=model,
                temperature=0,
                max_tokens=attempt_max_tokens(CLASSIFY_MAX_TOKENS, attempt),
                messages=[{"role": "user", "content": ask}]
            )
            duration = time.time() - t0
            msg = response.choices[0].message
            raw_text = msg.content or getattr(msg, "reasoning_content", None) or ""
            return _clean_json_response(raw_text), duration
        except Exception as e:
            last_err = e
            if attempt < 2:
                log(f"        [RETRY Step 1 ({attempt + 1}/3)]: {e}")
                time.sleep((attempt + 1) * 2)
    raise last_err


def step2_extract_invoice_page(
    client: OpenAI, page_img: Image.Image, page_no: int, model: str = VLM_MODEL
) -> Tuple[dict, float]:
    """Step 2: Deep extraction on a single invoice page (100% accurate spatial coordinates)."""
    buf = io.BytesIO()
    page_img.save(buf, format="JPEG", quality=90)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    prompt = PROMPT_EXTRACT.replace("{page_no}", str(page_no))
    messages = [{
        "role": "user",
        "content": [
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
            {"type": "text", "text": prompt}
        ]
    }]

    last_err = None
    for attempt in range(3):
        try:
            t0 = time.time()
            msgs = messages if not attempt else [{"role": "user", "content":
                                                  messages[0]["content"]
                                                  + [{"type": "text",
                                                     "text": "Output ONLY the JSON object. No explanation."}]}]
            response = client.chat.completions.create(
                model=model,
                temperature=0,
                max_tokens=attempt_max_tokens(MAX_TOKENS, attempt),
                messages=msgs
            )
            duration = time.time() - t0
            msg = response.choices[0].message
            raw_text = msg.content or getattr(msg, "reasoning_content", None) or ""
            return _clean_json_response(raw_text), duration
        except Exception as e:
            last_err = e
            if attempt < 2:
                log(f"        [RETRY Step 2 ({attempt + 1}/3)]: {e}")
                time.sleep((attempt + 1) * 2)
    raise last_err


DIGIT_CRITICAL_FIELDS = ["invoice_num", "supplier_tax_id", "customer_tax_id", "po_number",
                         "sub_total", "vat", "grand_total"]
RECHECK_MIN_DIGITS = 4
RECHECK_TARGET_H = 90      # a crop this tall is where the model starts reading digits one by one

PROMPT_RECHECK = (
    "You are OCR-ing ONE tight crop taken from a Thai invoice.\n"
    "Read the value printed inside the crop and copy it character by character, digit group by digit "
    "group. Never insert, drop, duplicate or reorder a digit. Keep commas, slashes and hyphens.\n"
    'Answer with ONLY this JSON object: {"raw": "value exactly as printed"}\n'
    'If it cannot be read: {"raw": null}'
)


def crop_zoom(box_h_px: int, target_h: int = RECHECK_TARGET_H) -> int:
    """Integer zoom that lifts a cropped text line to a readable height (never shrink, never past 8x)."""
    if box_h_px <= 0:
        return 1
    return max(1, min(8, target_h // box_h_px))


def digit_recheck_targets(fields: dict) -> List[str]:
    """Fields whose read rests on a long digit string and that have a box to crop."""
    out = []
    for name in DIGIT_CRITICAL_FIELDS:
        field = fields.get(name) or {}
        raw = str(field.get("raw") or "")
        if field.get("bbox") and re.search(r"\d{%d,}" % RECHECK_MIN_DIGITS, raw):
            out.append(name)
    return out


def field_crop(img, bbox_norm, pad_frac: float = 0.012):
    """Crop one field out of the rendered page and zoom it - the same crop path the audit uses."""
    x, y, w, h = (float(v) for v in bbox_norm)
    W, H = img.size
    box = (max(0, int((x - pad_frac) * W)), max(0, int((y - pad_frac * 2) * H)),
           min(W, int((x + w + pad_frac) * W)), min(H, int((y + h + pad_frac * 2) * H)))
    crop = img.crop(box)
    z = crop_zoom(crop.height)
    return crop.resize((max(1, crop.width * z), max(1, crop.height * z)), Image.LANCZOS) if z > 1 else crop


def recheck_digit_field(client: OpenAI, crop_img: Image.Image, name: str, model: str = VLM_MODEL) -> dict:
    buf = io.BytesIO()
    crop_img.convert("RGB").save(buf, "JPEG", quality=92)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    messages = [{"role": "user", "content": [
        {"type": "text", "text": f"Field being read: {name}"},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
        {"type": "text", "text": PROMPT_RECHECK}]}]
    last_err = None
    for attempt in range(3):        # same trap as step 1/2: a thinking preamble eats a small token budget
        try:
            if attempt:
                messages[0]["content"].append({"type": "text",
                                               "text": "Output ONLY the JSON object. No explanation."})
            resp = client.chat.completions.create(model=model, temperature=0,
                                                 max_tokens=attempt_max_tokens(1500, attempt),
                                                 messages=messages)
            msg = resp.choices[0].message
            return _clean_json_response(msg.content or getattr(msg, "reasoning_content", None) or "")
        except Exception as exc:
            last_err = exc
            if attempt < 2:
                time.sleep(1 + attempt)
    raise last_err


def apply_recheck(all_fields: dict, results: dict) -> dict:
    """Attach the second opinion without overwriting the first read.

    Which of the two matches the paper is only known by looking at the paper, and that is the visual
    audit's job; overwriting silently would hide the very disagreement this feature exists to find.
    """
    summary = {"checked": 0, "disagreed": []}
    for name, res in (results or {}).items():
        field = (all_fields or {}).get(name)
        if not field:
            continue
        a = re.sub(r"\D", "", str(field.get("raw") or ""))
        b = re.sub(r"\D", "", str((res or {}).get("raw") or ""))
        agreed = a == b
        field["recheck"] = {"raw": (res or {}).get("raw"), "agreed": agreed, "model": (res or {}).get("model")}
        summary["checked"] += 1
        if not agreed:
            summary["disagreed"].append(name)
    return summary


def process_single_doc(
    client: OpenAI,
    doc_id: int,
    out_dir: Path,
    dpi: int = RENDER_DPI,
    skip_existing: bool = False,
    model: str = VLM_MODEL,
    layout: str = "legacy",
    recheck_digits: bool = False,
) -> dict:
    doc_folder = out_dir / f"DMS-{doc_id}"
    payload_file = ocr_payload_path(out_dir, doc_id, layout)

    if skip_existing and payload_file.exists():
        log(f"[SKIP] DMS-{doc_id} already processed at {payload_file}")
        return {"doc_id": doc_id, "status": "skipped"}

    t0 = time.time()
    log(f"[START] Processing DMS-{doc_id} with {model} (Two-Step Pipeline)...")

    try:
        pdf_bytes, meta = fetch_pdf(doc_id)
        pages = render_pdf_pages(pdf_bytes, dpi=dpi)
        log(f"        Rendered {len(pages)} page(s) for DMS-{doc_id}")

        # === STEP 1: Fast Classification & Grouping ===
        if len(pages) == 1:
            selected_pages = [1]
            is_original = True
            multi_invoice_detected = False
            page_rotations = {1: 0}
            pages_classification = [{"page_no": 1, "doc_type": "tax_invoice", "copy_status": "original", "doc_no_hint": None, "page_marker": "1/1"}]
            t_classify = 0.0
            log(f"        Single page doc -> skipping classify step")
        else:
            classify_res, t_classify = step1_classify_pages(client, pdf_bytes, model=model)
            log(f"        Step 1 Classify finished in {t_classify:.1f}s")
            pages_classification = classify_res.get("pages") or classify_res.get("pages_classification") or []
            selected_pages, is_original, multi_invoice_detected, page_rotations = group_and_select_invoice_pages(pages_classification)

        log(f"        Selected invoice page(s): {selected_pages} (is_original={is_original}, multi_invoice={multi_invoice_detected})")

        payload_file.parent.mkdir(parents=True, exist_ok=True)
        if layout == "round":
            (out_dir / "rendered").mkdir(parents=True, exist_ok=True)
        else:
            doc_folder.mkdir(parents=True, exist_ok=True)
        pages_by_num = {p_no: img for p_no, img in pages}

        # === STEP 2: Deep Extraction per Selected Invoice Page ===
        rendered_png_paths = []
        total_bboxes_count = 0
        all_fields: Dict[str, dict] = {}
        all_line_items: List[dict] = []
        all_regions: List[dict] = []
        step2_times = []

        for p_no in selected_pages:
            img = pages_by_num.get(p_no)
            if not img:
                continue
            rot = int(page_rotations.get(p_no, 0) or 0)
            if rot in (90, 180, 270):
                img = img.rotate(-rot, expand=True)   # fix 2026-10-13: turn the page upright before extract

            extract_res, t_extract = step2_extract_invoice_page(client, img, p_no, model=model)
            step2_times.append(t_extract)
            log(f"        Step 2 Extract on Page {p_no} finished in {t_extract:.1f}s")

            raw_fields_map = extract_res.get("fields") or extract_res.get("required_fields") or {}
            for empty_try in range(2):        # a shell answer parses fine but is not an extraction (DMS-183 run 1)
                if not is_empty_extraction(raw_fields_map):
                    break
                log(f"        [RETRY-EMPTY Page {p_no} ({empty_try + 1}/2)]: the answer carried no value at all")
                extract_res, t_extract = step2_extract_invoice_page(client, img, p_no, model=model)
                step2_times.append(t_extract)
                raw_fields_map = extract_res.get("fields") or extract_res.get("required_fields") or {}
            raw_line_items = extract_res.get("line_items") or []
            raw_regions = extract_res.get("regions") or []

            for _l in raw_line_items:            # measure rows from their own cells (see row_bbox)
                if isinstance(_l, dict):
                    _union = row_bbox(_l)
                    if _union:
                        _l["line_bbox_model"] = _l.get("line_bbox")
                        _l["line_bbox"] = _union

            # Collect all boxes on this page to detect coord mode
            all_boxes_p = []
            for f_obj in raw_fields_map.values():
                if isinstance(f_obj, dict) and f_obj.get("bbox_2d") and len(f_obj["bbox_2d"]) == 4:
                    all_boxes_p.append(f_obj["bbox_2d"])
            for l_obj in raw_line_items:
                if isinstance(l_obj, dict):
                    if l_obj.get("line_bbox") and len(l_obj["line_bbox"]) == 4:
                        all_boxes_p.append(l_obj["line_bbox"])
                    for cell_key in ("item_code", "description", "qty", "uom", "unit_price", "amount"):
                        c_val = l_obj.get(cell_key)
                        if isinstance(c_val, dict) and c_val.get("bbox_2d") and len(c_val["bbox_2d"]) == 4:
                            all_boxes_p.append(c_val["bbox_2d"])
            for r_obj in raw_regions:
                if isinstance(r_obj, dict) and r_obj.get("bbox_2d") and len(r_obj["bbox_2d"]) == 4:
                    all_boxes_p.append(r_obj["bbox_2d"])

            coord_mode = detect_coord_mode(all_boxes_p, img.width, img.height) if all_boxes_p else "norm1000"

            # 1. Build page_items for overlay PNG
            page_items = []
            for fn in REQUIRED_FIELD_NAMES:
                f_val = raw_fields_map.get(fn) or {}
                b_raw = f_val.get("bbox_2d")
                raw_str = f_val.get("raw") if f_val.get("raw") is not None else f_val.get("value")
                if b_raw and len(b_raw) == 4 and raw_str:
                    c_type = "header" if "num" in fn or "date" in fn else "supplier" if "supplier" in fn else "customer" if "customer" in fn else "total"
                    page_items.append({
                        "type": c_type,
                        "label": fn,
                        "text": str(raw_str),
                        "bbox_2d": b_raw
                    })

            for l in raw_line_items:
                l_no = l.get("line_no", 1)
                desc_obj = l.get("description")
                desc_str = desc_obj.get("raw") if isinstance(desc_obj, dict) else str(desc_obj or "")
                amt_obj = l.get("amount")
                amt_str = amt_obj.get("raw") if isinstance(amt_obj, dict) else str(amt_obj or "")
                l_b = l.get("line_bbox")
                if l_b and len(l_b) == 4:
                    page_items.append({
                        "type": "line",
                        "label": f"line_{l_no}",
                        "text": f"{desc_str[:15]} ({amt_str})",
                        "bbox_2d": l_b
                    })

            for r in raw_regions:
                b_raw = r.get("bbox_2d")
                if b_raw and len(b_raw) == 4:
                    page_items.append({
                        "type": r.get("type", "other"),
                        "label": r.get("label", "region"),
                        "text": r.get("label", ""),
                        "bbox_2d": b_raw
                    })

            total_bboxes_count += len(page_items)
            drawn_img = draw_bboxes(img, page_items, coord_mode)
            png_path = rendered_page_path(out_dir, doc_id, p_no, layout)
            drawn_img.save(png_path, "PNG")
            rendered_png_paths.append(png_path.name if layout != "round" else f"rendered/{png_path.name}")
            log(f"        Rendered BBox overlay: {png_path.name} ({len(page_items)} boxes)")

            # 2. Extract & Normalize Header Fields
            for fn in REQUIRED_FIELD_NAMES:
                if fn in all_fields and all_fields[fn].get("raw"):
                    continue
                f_obj = raw_fields_map.get(fn) or {}
                raw_val = f_obj.get("raw") if f_obj.get("raw") is not None else f_obj.get("value")
                b_raw = f_obj.get("bbox_2d")
                bbox_norm = None
                if b_raw and len(b_raw) == 4:
                    px_rect = to_px(b_raw, img.width, img.height, coord_mode)
                    bbox_norm = px_to_norm_xywh(px_rect, img.width, img.height)

                norm_val = normalize_field_value(fn, raw_val)
                all_fields[fn] = {
                    "raw": raw_val,
                    "normalized": norm_val,
                    "bbox": bbox_norm,
                    "page_no": p_no,
                }

            # 3. Extract & Normalize Line Items
            for l in raw_line_items:
                l_no = l.get("line_no", len(all_line_items) + 1)
                l_box_raw = l.get("line_bbox")
                line_bbox_norm = None
                if l_box_raw and len(l_box_raw) == 4:
                    px_rect = to_px(l_box_raw, img.width, img.height, coord_mode)
                    line_bbox_norm = px_to_norm_xywh(px_rect, img.width, img.height)

                item_entry: Dict[str, Any] = {
                    "line_no": l_no,
                    "page_no": p_no,
                    "line_bbox": line_bbox_norm,
                }
                if l.get("line_bbox_model"):
                    item_entry["line_bbox_model"] = l.get("line_bbox_model")

                for cell_key in ("item_code", "description", "qty", "uom", "unit_price", "amount"):
                    cell_data = l.get(cell_key)
                    if isinstance(cell_data, dict):
                        raw_c = cell_data.get("raw") if cell_data.get("raw") is not None else cell_data.get("value")
                        b_c = cell_data.get("bbox_2d")
                    else:
                        raw_c = str(cell_data) if cell_data is not None else None
                        b_c = None

                    c_bbox_norm = None
                    if b_c and len(b_c) == 4:
                        px_c = to_px(b_c, img.width, img.height, coord_mode)
                        c_bbox_norm = px_to_norm_xywh(px_c, img.width, img.height)

                    if cell_key in ("qty", "unit_price", "amount"):
                        norm_c = normalize_number(raw_c)
                    elif cell_key == "uom":
                        norm_c = normalize_uom(raw_c)
                    else:
                        norm_c = normalize_text(raw_c)

                    item_entry[cell_key] = {
                        "raw": raw_c,
                        "normalized": norm_c,
                        "bbox": c_bbox_norm,
                    }

                all_line_items.append(item_entry)

            # 4. Extract Structural Regions
            for r in raw_regions:
                b_raw = r.get("bbox_2d")
                r_bbox_norm = None
                if b_raw and len(b_raw) == 4:
                    px_r = to_px(b_raw, img.width, img.height, coord_mode)
                    r_bbox_norm = px_to_norm_xywh(px_r, img.width, img.height)
                all_regions.append({
                    "type": r.get("type", "other"),
                    "label": r.get("label", "region"),
                    "page_no": p_no,
                    "bbox": r_bbox_norm,
                })

        # Optional second opinion on the fields whose whole value is a long digit string.
        recheck_summary = {"checked": 0, "disagreed": []}
        if recheck_digits and all_fields:
            targets = digit_recheck_targets(all_fields)
            results = {}
            for name in targets:
                page_no = (all_fields[name] or {}).get("page_no")
                img = pages_by_num.get(int(page_no or 0))
                if img is None:
                    continue
                try:
                    got = recheck_digit_field(client, field_crop(img, all_fields[name]["bbox"]), name, model=model)
                    results[name] = {"raw": got.get("raw"), "model": "crop-recheck"}
                except Exception as exc:
                    log(f"        [RECHECK {name} on p{page_no} failed]: {exc}")
            recheck_summary = apply_recheck(all_fields, results)
            if recheck_summary["disagreed"]:
                log(f"        Digit re-check disagreed on: {recheck_summary['disagreed']}")

        # Save validation_payload.json with complete new schema
        validation_payload = {
            "doc_id": doc_id,
            "document_title": meta.get("title") or f"DMS-{doc_id}",
            "is_original": is_original,
            "selected_invoice_pages": selected_pages,
            "multi_invoice_detected": multi_invoice_detected,
            "fields": all_fields,
            "line_items": all_line_items,
            "regions": all_regions,
        }
        # Timing / run metadata for this document
        total_duration = round(time.time() - t0, 2)
        meta_info = {
            "doc_id": doc_id,
            "model": model,
            "pipeline": "two-step",
            "digit_recheck": recheck_summary,
            "total_pages": len(pages),
            "selected_pages": selected_pages,
            "is_original": is_original,
            "multi_invoice_detected": multi_invoice_detected,
            "pages_classification": pages_classification,
            "step1_classify_seconds": round(t_classify, 2),
            "step2_extract_seconds": [round(t, 2) for t in step2_times],
            "total_seconds": total_duration,
            "total_bboxes_drawn": total_bboxes_count,
            "rendered_images": rendered_png_paths,
        }
        if layout == "round":
            validation_payload["meta"] = meta_info
            payload_file.write_text(json.dumps(validation_payload, indent=2, ensure_ascii=False), encoding="utf-8")
            out_folder = payload_file.parent
        else:
            payload_file.write_text(json.dumps(validation_payload, indent=2, ensure_ascii=False), encoding="utf-8")
            (doc_folder / "meta.json").write_text(json.dumps(meta_info, indent=2, ensure_ascii=False), encoding="utf-8")
            out_folder = doc_folder
        doc_folder = out_folder

        log(f"[DONE] DMS-{doc_id} in {total_duration}s (Step1: {t_classify:.1f}s, Step2: {sum(step2_times):.1f}s) -> {doc_folder}")
        return {"doc_id": doc_id, "status": "ok", "seconds": total_duration, "folder": str(doc_folder)}

    except Exception as e:
        log(f"[ERROR] DMS-{doc_id} failed: {e}")
        return {"doc_id": doc_id, "status": "error", "error": str(e)}


def resolve_model_name(name: Optional[str]) -> Tuple[str, str]:
    if not name:
        raw = VLM_MODEL
    else:
        raw = name.strip()
    if "qwen3-vl-8b" in raw.lower() or raw.lower() in ("8b", "qwen-8b"):
        return "Qwen/Qwen3-VL-8B-Instruct", "Qwen3-VL-8B-Instruct"
    if "flash" in raw.lower() or "nvfp4" in raw.lower():
        return "nvidia/Qwen3.8-Flash-Next-NVFP4", "Qwen3.8-Flash-Next-NVFP4"
    clean = raw.split("/")[-1]
    return raw, clean


def list_paperless_docs(tag: str = "invoice", limit: Optional[int] = None) -> List[int]:
    headers = {"Authorization": f"Token {PL_TOKEN}", "Accept": "application/json"}
    url = f"{PL_URL}/api/documents/"
    params = {"page_size": 100, "ordering": "id", "tags__name__iexact": tag}
    ids = []
    while url:
        r = requests.get(url, headers=headers, params=params, timeout=60)
        r.raise_for_status()
        data = r.json()
        for doc in data.get("results", []):
            ids.append(doc["id"])
            if limit and len(ids) >= limit:
                return ids
        url = data.get("next")
        params = None
    return ids


def load_ids_file(path: Path) -> List[int]:
    """Document IDs from a JSON file: either [1,2,3] or {"document_ids"/"ids": [...]}"""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("document_ids") or data.get("ids") or []
    return sorted({int(x) for x in data})


def sample_fixed_subset(ids: List[int], k: int = 50, seed: int = 42) -> List[int]:
    """Deterministic fixed sample. The pool is sorted first, so input order cannot change the result."""
    pool = sorted({int(i) for i in ids})
    return sorted(random.Random(int(seed)).sample(pool, min(int(k), len(pool))))


def missing_pdf_ids(all_ids: List[int], cache_dir: Optional[Path] = None) -> List[int]:
    """IDs that still have no PDF in the local download cache."""
    cache = Path(cache_dir) if cache_dir else (ROOT / ".cache" / "downloads")
    return [i for i in sorted({int(x) for x in all_ids}) if not (cache / f"DMS-{int(i)}.pdf").exists()]


def ocr_payload_path(out_dir: Path, doc_id: int, layout: str = "legacy") -> Path:
    """OCR + coordinate artifact. round layout: one ocr/DMS-<id>.json per document."""
    if layout == "round":
        return Path(out_dir) / "ocr" / f"DMS-{doc_id}.json"
    return Path(out_dir) / f"DMS-{doc_id}" / "validation_payload.json"


def rendered_page_path(out_dir: Path, doc_id: int, page_no: int, layout: str = "legacy") -> Path:
    """BBox overlay artifact. round layout: rendered/DMS-<id>_p<page>_bbox.png."""
    if layout == "round":
        return Path(out_dir) / "rendered" / f"DMS-{doc_id}_p{page_no}_bbox.png"
    return Path(out_dir) / f"DMS-{doc_id}" / f"invoice_p{page_no}.png"


PLAN_MANDATORY_FIELDS = [
    "invoice_num", "invoice_date", "supplier_name", "supplier_tax_id",
    "customer_name", "sub_total", "vat", "grand_total",
]


ROW_CELL_KEYS = ("item_code", "description", "qty", "uom", "unit_price", "amount")


NON_SCORING_FIELDS = {"currency"}     # flipped in 21/49 docs between two identical-code runs and is not a plan field


def row_signature(item: dict) -> tuple:
    """Content identity of a row: its cell text, whitespace-collapsed.

    The model renumbers rows differently between runs (DMS-117 emitted 1,5,8,11,14,18 then 1..6), so
    matching rows by `line_no` invents phantom added/removed rows.
    """
    parts = []
    for key in ROW_CELL_KEYS:
        cell = item.get(key)
        raw = cell.get("raw") if isinstance(cell, dict) else cell
        parts.append(re.sub(r"\s+", " ", str(raw or "").strip()).lower())
    return tuple(parts)


def is_empty_extraction(fields: dict) -> bool:
    """True when the model answered with the shell of a JSON: every field raw null/blank.

    It parses fine, so it used to be scored as an invoice with nothing on it (DMS-183 stability run 1).
    """
    if not fields:
        return True
    for field in fields.values():
        raw = field.get("raw") if isinstance(field, dict) else field
        if str(raw or "").strip():
            return False
    return True


def text_change_is_material(old_raw, new_raw) -> bool:
    """A change matters when the printed digits move, or a value appears/disappears.

    Measured on 49 documents run twice with identical code: wording differences dominate (supplier_name
    57%, customer_name 45%) while digit errors are rare but real (po_number 14%). Only the digits can
    break invoice matching, so only they decide a regression.
    """
    o, n = str(old_raw or "").strip(), str(new_raw or "").strip()
    if bool(o) != bool(n):
        return True
    return [c for c in o if c.isdigit()] != [c for c in n if c.isdigit()]


def diff_round_payloads(old: dict, new: dict, page_dims: Optional[Dict[int, Tuple[int, int]]] = None,
                        move_px: float = 5.0,
                        ignore_fields: Optional[set] = None) -> dict:
    """Compare one document across two rounds.

    Plan section 2: a document "changed" when any character of text differs, or a box moved more than
    5 px (smaller shifts are treated as run-to-run noise). Coordinates in a round payload are
    normalised xywh, so the pixel test needs the page size.
    """
    dims = {int(k): v for k, v in (page_dims or {}).items()}
    text: List[str] = []
    moved: List[str] = []
    added: List[str] = []
    removed: List[str] = []
    renumbered: List[str] = []
    noise_only: List[str] = []
    material: List[str] = []
    cosmetic: List[str] = []
    row_moves: List[str] = []
    gated = set(NON_SCORING_FIELDS) | set(ignore_fields or ())

    def px_rect(bbox, page):
        d = dims.get(int(page or 0))
        if not d or not bbox or len(bbox) != 4:
            return None
        x, y, w, h = (float(v) for v in bbox)
        return (x * d[0], y * d[1], (x + w) * d[0], (y + h) * d[1])

    def shift(a, b):
        if not a or not b:
            return None
        return max(abs(u - v) for u, v in zip(a, b))

    of, nf = old.get("fields") or {}, new.get("fields") or {}
    for name in sorted(set(of) | set(nf)):
        o, n = of.get(name), nf.get(name)
        label = f"field:{name}"
        is_noise = name in gated
        moved_sink = noise_only if is_noise else moved
        if o is None or n is None:
            # A field printed in one run and blank in the other is a text event, not only a box event.
            entry = f"{label}: {(o or {}).get('raw')!r} -> {(n or {}).get('raw')!r}"
            text.append(entry)
            present = n if o is None else o
            if not is_noise and str((present or {}).get("raw") or "").strip():
                (added if o is None else removed).append(label)
            if is_noise:
                noise_only.append(entry)
            elif text_change_is_material((o or {}).get("raw"), (n or {}).get("raw")):
                material.append(entry)
            else:
                cosmetic.append(entry)
            continue
        if str((o or {}).get("raw") or "").strip() != str((n or {}).get("raw") or "").strip():
            entry = f"{label}: {(o or {}).get('raw')!r} -> {(n or {}).get('raw')!r}"
            text.append(entry)
            if is_noise:
                noise_only.append(entry)
            elif text_change_is_material((o or {}).get("raw"), (n or {}).get("raw")):
                material.append(entry)
            else:
                cosmetic.append(entry)
        ob, nb = (o or {}).get("bbox"), (n or {}).get("bbox")
        if bool(ob) != bool(nb):
            entry = f"{label}: grounding {'lost' if not nb else 'gained'}"
            text.append(entry)
            (noise_only if is_noise else material).append(entry)   # a box appearing/vanishing is what this plan scores
            continue
        d = shift(px_rect(ob, (n or {}).get("page_no")), px_rect(nb, (n or {}).get("page_no")))
        if d is not None and d > move_px:
            moved_sink.append(f"{label}: {round(d, 1)}px")

    def lines_by_key(d):
        out = {}
        for l in d.get("line_items") or []:
            out[(int(l.get("page_no") or 0), l.get("line_no"))] = l
        return out

    ol, nl = lines_by_key(old), lines_by_key(new)
    # Pair rows by content first, so a renumbered run does not read as rows added + rows removed.
    new_by_page: Dict[int, List[Any]] = {}
    for key in sorted(nl, key=lambda t: (t[0], str(t[1]))):
        new_by_page.setdefault(key[0], []).append(key)
    used, paired, leftovers_old = set(), [], []
    for key in sorted(ol, key=lambda t: (t[0], str(t[1]))):
        sig = row_signature(ol[key])
        match = None
        if any(sig):
            for cand in new_by_page.get(key[0], []):
                if cand not in used and row_signature(nl[cand]) == sig:
                    match = cand
                    break
        if match is None:
            leftovers_old.append(key)
            continue
        used.add(match)
        paired.append((key, match))
    for key in list(leftovers_old):                      # cell-less payloads: fall back to the row number
        if key in nl and key not in used:
            used.add(key)
            paired.append((key, key))
            leftovers_old.remove(key)
    leftovers_new = [k for page_keys in new_by_page.values() for k in page_keys if k not in used]

    for old_key, new_key in paired:
        o, n = ol[old_key], nl[new_key]
        label = f"line@p{old_key[0]}#{old_key[1]}"
        if old_key != new_key:
            renumbered.append(f"{label} -> #{new_key[1]}")
        d = shift(px_rect(o.get("line_bbox"), old_key[0]), px_rect(n.get("line_bbox"), new_key[0]))
        if d is not None and d > move_px:
            # Deliberate: P1 re-measured every row box, and identical re-runs still shift rows in 29% of
            # documents. Listed, but a row box on its own is not evidence that the document got worse.
            row_moves.append(f"{label}: {round(d, 1)}px")
        for cell in ROW_CELL_KEYS:
            co, cn = o.get(cell) or {}, n.get(cell) or {}
            if str(co.get("raw") or "").strip() != str(cn.get("raw") or "").strip():
                entry = f"{label}.{cell}: {co.get('raw')!r} -> {cn.get('raw')!r}"
                text.append(entry)
                (material if text_change_is_material(co.get("raw"), cn.get("raw")) else cosmetic).append(entry)

    for key in leftovers_old:
        removed.append(f"line@p{key[0]}#{key[1]}")
    for key in leftovers_new:
        added.append(f"line@p{key[0]}#{key[1]}")

    if list(old.get("selected_invoice_pages") or []) != list(new.get("selected_invoice_pages") or []):
        entry = f"selected_pages: {old.get('selected_invoice_pages')} -> {new.get('selected_invoice_pages')}"
        text.append(entry)
        material.append(entry)          # which page is the invoice decides everything downstream

    # Box shifts (field or row) are reported under moved / row_moves but never decide the verdict: measured
    # against identical code they reach p90 = 68 px, so they cannot be attributed to a change.
    return {"changed": bool(material or added or removed), "text": text, "moved": moved,
            "boxes_added": added, "boxes_removed": removed, "renumbered": renumbered,
            "noise_only": noise_only, "material": material, "cosmetic": cosmetic, "row_moves": row_moves}


def row_bbox(item: dict):
    """Row box as the union of the row's own cell boxes, in the VLM's own [x0, y0, x1, y1] space.

    The VLM returns line_bbox as a band that runs from the row down through the empty table body
    (h up to 0.46 of the page), which fails the horizontal-row rule for rows that are really one text
    line. Production grounds the row on its cells (`compute_row_bbox_from_cells`), so the harness must
    measure the same geometry. Returns None when no cell carries a box -> caller keeps the model band.
    """
    rects = []
    for key in ROW_CELL_KEYS:
        cell = item.get(key)
        if not isinstance(cell, dict):
            continue
        box = cell.get("bbox_2d")
        if box and len(box) == 4:
            rects.append([float(v) for v in box])
    if not rects:
        return None
    x0 = min(r[0] for r in rects)
    y0 = min(r[1] for r in rects)
    x1 = max(r[2] for r in rects)
    y1 = max(r[3] for r in rects)
    return [round(x0, 6), round(y0, 6), round(x1, 6), round(y1, 6)]


def crop_rect_norm(img, rect, pad_norm: float = 0.015):
    """Zoom crop of a normalised [x, y, w, h] box, padded and clipped to the page."""
    x, y, w, h = (float(v) for v in rect)
    W, H = img.size
    x0 = max(0, int(round((x - pad_norm) * W)))
    y0 = max(0, int(round((y - pad_norm) * H)))
    x1 = min(W, int(round((x + w + pad_norm) * W)))
    y1 = min(H, int(round((y + h + pad_norm) * H)))
    return img.crop((x0, y0, max(x0 + 1, x1), max(y0 + 1, y1)))


def find_field_box(payload: dict, name: str):
    """Locate one box by name: header field, line_<n>, line_<n>.<cell> or region:<label>."""
    fields = payload.get("fields") or {}
    if name in fields:
        f = fields.get(name) or {}
        return int(f.get("page_no") or 0), (f.get("bbox") or None)
    if name.startswith("line_"):
        tail = name.split("_", 1)[1]
        cell = tail.split(".", 1)[1] if "." in tail else None
        tail = tail.split(".", 1)[0]
        for l in payload.get("line_items") or []:
            if str(l.get("line_no")) != tail:
                continue
            pg = int(l.get("page_no") or 0)
            if cell is None:
                return pg, (l.get("line_bbox") or None)
            c = l.get(cell)
            return pg, (c.get("bbox") if isinstance(c, dict) else None)
    if name.startswith("region:"):
        label = name.split(":", 1)[1]
        for r in payload.get("regions") or []:
            if str(r.get("label")) == label:
                return int(r.get("page_no") or 0), (r.get("bbox") or None)
    return None


def audit_doc(payload: dict, page_dims: Optional[Dict[int, Tuple[int, int]]] = None) -> dict:
    """Automated triage of one round payload.

    It only orders the visual queue (plan section 5: automated checks may prioritise, never replace,
    opening the rendered image). Coordinates in the payload are normalised xywh, so the true row
    aspect ratio needs the page pixel size.
    """
    findings: set = set()
    selected = [int(p) for p in (payload.get("selected_invoice_pages") or [])]
    fields = payload.get("fields") or {}
    lines = payload.get("line_items") or []
    regions = payload.get("regions") or []
    dims = {int(k): v for k, v in (page_dims or {}).items()}

    for fn in PLAN_MANDATORY_FIELDS:
        f = fields.get(fn) or {}
        if not str(f.get("raw") or "").strip():
            findings.add(f"MISSING_FIELD:{fn}")
    if not lines:
        findings.add("NO_LINE_ITEMS")

    boxes: List[Tuple[str, int, Any]] = []
    for fn, f in fields.items():
        if isinstance(f, dict) and f.get("bbox"):
            boxes.append((fn, int(f.get("page_no") or 0), f["bbox"]))
    rows: Dict[int, int] = {}
    for l in lines:
        pg = int(l.get("page_no") or 0)
        lbl = f"line_{l.get('line_no')}"
        if l.get("line_bbox"):
            boxes.append((lbl, pg, l["line_bbox"]))
        rows[pg] = rows.get(pg, 0) + 1
        for cell in ("item_code", "description", "qty", "uom", "unit_price", "amount"):
            c = l.get(cell)
            if isinstance(c, dict) and c.get("bbox"):
                boxes.append((f"{lbl}.{cell}", pg, c["bbox"]))
    for r in regions:
        if isinstance(r, dict) and r.get("bbox"):
            boxes.append((f"region:{r.get('label', 'other')}", int(r.get("page_no") or 0), r["bbox"]))

    seen: Dict[int, set] = {}
    pages_with_boxes: set = set()
    for label, pg, bb in boxes:
        if not (isinstance(bb, (list, tuple)) and len(bb) == 4):
            continue
        pages_with_boxes.add(pg)
        try:
            x, y, w, h = (float(v) for v in bb)
        except (TypeError, ValueError):
            findings.add(f"BAD_BBOX:{label}")
            continue
        if w <= 0 or h <= 0 or x < -0.005 or y < -0.005 or x + w > 1.005 or y + h > 1.005:
            findings.add(f"OOB:{label}")
        if label in seen.setdefault(pg, set()):
            findings.add(f"DUPLICATE:{label}")
        seen[pg].add(label)
        if selected and pg not in selected:
            findings.add(f"BBOX_ON_UNSELECTED_PAGE:{pg}")
        if label.startswith("line_") and "." not in label and w > 0 and h > 0:
            d = dims.get(pg)
            if d:
                ar = (w * d[0]) / (h * d[1])
                if ar < 1.5:
                    findings.add(f"LINE_AR:{label}:{round(ar, 2)}")

    for pg in selected:
        if pg not in pages_with_boxes:
            findings.add(f"NO_BBOX_ON_SELECTED_PAGE:{pg}")

    for p in ((payload.get("meta") or {}).get("pages_classification") or []):
        pno = int(p.get("page_no") or 0)
        if pno in selected:
            continue
        if str(p.get("doc_type", "")).endswith("tax_invoice") and str(p.get("copy_status", "")).lower() == "original":
            findings.add(f"CLASSIFY_SUSPECT:p{pno}_original_invoice_not_selected")

    return {
        "findings": sorted(findings),
        "rows_ocr_per_page": rows,
        "selected_pages": selected,
        "total_pages": (payload.get("meta") or {}).get("total_pages"),
        "boxes_total": len(boxes),
    }


def main():
    parser = argparse.ArgumentParser(description="Two-Step Invoice Extraction & BBox Testing")
    parser.add_argument("--doc-id", type=int, help="Single DMS document ID (e.g. 20)")
    parser.add_argument("--doc-ids", type=str, help="Comma-separated DMS document IDs (e.g. 15,19,20)")
    parser.add_argument("--tag", type=str, default="invoice", help="Paperless tag to query (default: invoice)")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of documents")
    parser.add_argument("--model", type=str, default=None,
                        help="VLM model name (e.g. Qwen3-VL-8B-Instruct or Qwen/Qwen3-VL-8B-Instruct)")
    parser.add_argument("--out-dir", type=Path, default=None,
                        help="Output directory (default: bbox_testing/<model> if --model is set, else bbox_testing)")
    parser.add_argument("--workers", type=int, default=1, help="Concurrency workers (default: 1)")
    parser.add_argument("--dpi", type=int, default=RENDER_DPI, help=f"Render DPI (default: {RENDER_DPI})")
    parser.add_argument("--skip-existing", action="store_true", help="Skip already processed documents")
    parser.add_argument("--ids-file", type=Path, help="JSON file of document IDs (list or {'document_ids': [...]})")
    parser.add_argument("--snapshot-corpus", type=Path, metavar="OUT_JSON",
                        help="Fetch tag doc IDs from Paperless (READ-ONLY), write snapshot JSON, exit")
    parser.add_argument("--make-eval-subset", type=Path, metavar="OUT_JSON",
                        help="Write deterministic fixed sample of --corpus-file as JSON, exit")
    parser.add_argument("--corpus-file", type=Path, help="Input JSON for --make-eval-subset")
    parser.add_argument("--eval-k", type=int, default=50, help="Subset size (default: 50)")
    parser.add_argument("--eval-seed", type=int, default=42, help="Subset seed (default: 42)")
    parser.add_argument("--download-only", action="store_true",
                        help="Download missing PDFs into .cache/downloads (READ-ONLY GET), exit")
    parser.add_argument("--emit-source-images", type=Path, metavar="DIR",
                        help="Write DMS-<id>_p<page>.png into DIR, skip existing, exit")
    parser.add_argument("--layout", choices=["legacy", "round"], default="legacy",
                        help="round = ocr/DMS-<id>.json + rendered/DMS-<id>_p<page>_bbox.png (plan layout)")
    parser.add_argument("--audit-round", type=Path, metavar="ROUND_DIR",
                        help="Triage a finished round dir and write ROUND_DIR/progress.json, exit")
    parser.add_argument("--source-images-dir", type=Path, default=None,
                        help="source_images dir for page pixel sizes (default: bbox_testing/source_images)")
    parser.add_argument("--crop", type=int, metavar="DOC_ID", help="Write one evidence zoom crop into ROUND_DIR/crops/, exit")
    parser.add_argument("--crop-field", type=str,
                        help="Field for --crop (grand_total, line_1, line_1.amount, region:company_stamp)")
    parser.add_argument("--crop-box", type=str, help="Explicit x,y,w,h normalised, instead of --crop-field")
    parser.add_argument("--crop-page", type=int, help="Page for --crop (default: page the field lives on)")
    parser.add_argument("--crop-out", type=str, help="Output file name inside ROUND_DIR/crops/")
    parser.add_argument("--crop-pad", type=float, default=0.015, help="Normalised padding (default 0.015)")
    parser.add_argument("--round-dir", type=Path, help="round_XX dir used by --crop")
    parser.add_argument("--stability-report", type=Path,
                        help="stability_report.json (from --stability): fields proven unstable are excluded "
                             "from the change verdict of --compare-rounds")
    parser.add_argument("--stability", type=Path, metavar="ROUND_DIR",
                        help="Re-run every document of ROUND_DIR --runs times with identical code and report "
                             "per-field instability, exit")
    parser.add_argument("--recheck-digits", action="store_true",
                        help="second VLM pass on a zoomed crop of every long-digit field (invoice_num, tax ids, "
                             "po_number, totals); records fields.<name>.recheck and never overwrites raw")
    parser.add_argument("--runs", type=int, default=2, help="runs per document for --stability")
    parser.add_argument("--stability-limit", type=int, help="only the first N documents for --stability")
    parser.add_argument("--noisy-field-rate", type=float, default=0.20,
                        help="a field is noisy when it differs in at least this share of documents across identical runs")
    parser.add_argument("--compare-rounds", type=Path, nargs=2, metavar=("ROUND_A", "ROUND_B"),
                        help="Diff every document of ROUND_B against ROUND_A (plan section 2 rules), exit")

    args = parser.parse_args()

    model_full, model_folder = resolve_model_name(args.model)
    if args.out_dir is not None:
        out_dir = args.out_dir
    elif args.model:
        out_dir = ROOT / "bbox_testing" / model_folder
    else:
        out_dir = ROOT / "bbox_testing"

    if args.snapshot_corpus:
        ids = sorted(list_paperless_docs(tag=args.tag, limit=args.limit))
        payload = {
            "description": f"READ-ONLY snapshot of every Paperless document carrying tag '{args.tag}'",
            "tag": args.tag,
            "total": len(ids),
            "paperless_query": f"{PL_URL}/api/documents/?tags__name__iexact={args.tag}",
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "document_ids": ids,
        }
        args.snapshot_corpus.parent.mkdir(parents=True, exist_ok=True)
        args.snapshot_corpus.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        log(f"Corpus snapshot: {len(ids)} document(s) with tag '{args.tag}' -> {args.snapshot_corpus}")
        return 0

    if args.make_eval_subset:
        if not args.corpus_file:
            log("--make-eval-subset requires --corpus-file")
            return 2
        pool = load_ids_file(args.corpus_file)
        subset = sample_fixed_subset(pool, k=args.eval_k, seed=args.eval_seed)
        payload = {
            "description": f"Fixed {args.eval_k}-document eval subset, sampled with seed={args.eval_seed}",
            "seed": args.eval_seed,
            "k": args.eval_k,
            "pool_total": len(pool),
            "method": "sorted(unique pool) -> random.Random(seed).sample(pool, k) -> sort result",
            "corpus_file": str(args.corpus_file),
            "document_ids": subset,
        }
        args.make_eval_subset.parent.mkdir(parents=True, exist_ok=True)
        args.make_eval_subset.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        log(f"Eval subset: {len(subset)} of {len(pool)} (seed={args.eval_seed}) -> {args.make_eval_subset}")
        return 0

    doc_ids = []
    if args.audit_round or args.crop or args.compare_rounds or args.stability:
        doc_ids = []
    elif args.doc_id:
        doc_ids = [args.doc_id]
    elif args.doc_ids:
        doc_ids = parse_ids(args.doc_ids)
    elif args.ids_file:
        doc_ids = load_ids_file(args.ids_file)
    else:
        log(f"Fetching document list with tag '{args.tag}' from Paperless...")
        doc_ids = list_paperless_docs(tag=args.tag, limit=args.limit)

    if not doc_ids and not args.audit_round and not args.download_only and not args.crop and not args.compare_rounds and not args.stability:
        log("No documents found. Exiting.")
        return 0

    if args.compare_rounds:
        round_a, round_b = args.compare_rounds
        src_dir = args.source_images_dir or (ROOT / "bbox_testing" / "source_images")
        gated = set(NON_SCORING_FIELDS)
        if args.stability_report and args.stability_report.exists():
            gated |= set(json.loads(args.stability_report.read_text(encoding="utf-8")).get("noisy_fields") or [])
        per_doc: Dict[str, Any] = {}
        for pf in sorted((round_b / "ocr").glob("DMS-*.json")):
            doc = pf.stem
            pa = round_a / "ocr" / f"{doc}.json"
            if not pa.exists():
                per_doc[doc] = {"changed": True, "text": ["new in round B"], "moved": [],
                                "boxes_added": [], "boxes_removed": [], "renumbered": [],
                                "noise_only": [], "material": ["new in round B"], "cosmetic": [],
                                "row_moves": []}
                continue
            dims = {}
            for png in src_dir.glob(f"{doc}_p*.png"):
                try:
                    dims[int(png.stem.rsplit("_p", 1)[1])] = Image.open(png).size
                except (IndexError, ValueError):
                    continue
            d = diff_round_payloads(json.loads(pa.read_text(encoding="utf-8")),
                                    json.loads(pf.read_text(encoding="utf-8")), dims,
                                    ignore_fields=gated)
            d["field_moves"] = [x for x in d["moved"] if x.startswith("field:")]
            d["row_moves"] = d.get("row_moves", []) + [x for x in d["moved"] if x.startswith("line@")]
            d["moved"] = d["field_moves"]
            d["changed"] = bool(d["material"] or d["boxes_added"] or d["boxes_removed"])
            per_doc[doc] = d
        previously_failed = []
        for rf in sorted((round_a / "review").glob("DMS-*.md")):
            body = rf.read_text(encoding="utf-8")
            for line in body.splitlines():
                if line.startswith("ผลสรุป:") and "FAIL" in line:
                    previously_failed.append(rf.stem)
        changed = sorted(k for k, v in per_doc.items() if v["changed"])
        unchanged = sorted(k for k, v in per_doc.items() if not v["changed"])
        not_rerun = sorted({pf.stem for pf in (round_a / "ocr").glob("DMS-*.json")}
                          - {pf.stem for pf in (round_b / "ocr").glob("DMS-*.json")})
        pool = sorted(set(changed) | set(previously_failed))
        k_sample = max(10, -(-len(unchanged) // 5)) if unchanged else 0
        sample = sorted(random.Random(42).sample(unchanged, min(k_sample, len(unchanged)))) if unchanged else []
        cosmetic_only = sorted(k for k, v in per_doc.items() if not v["changed"]
                               and (v.get("cosmetic") or v.get("noise_only") or v.get("renumbered")))
        material_docs = sorted(k for k, v in per_doc.items() if v.get("material"))
        payload = {
            "round_a": round_a.name, "round_b": round_b.name,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "rule": "changed = a printed digit differs, a value appeared/disappeared, the page selection "
                    "moved, a row appeared/disappeared, or a box moved more than 5 px; wording-only "
                    "differences are listed under cosmetic",
            "gated_fields": sorted(gated),
            "docs_compared": len(per_doc), "not_rerun": not_rerun,
            "material_docs": material_docs, "cosmetic_only_docs": cosmetic_only,
            "changed_docs": changed, "unchanged_docs": unchanged,
            "previously_failed": sorted(set(previously_failed)),
            "must_view": pool,
            "sample_of_unchanged": sample,
            "view_queue": sorted(set(pool) | set(sample)),
            "docs": per_doc,
        }
        out = round_b / "round_diff.json"
        out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        log(f"Compare {round_a.name} -> {round_b.name}: {len(per_doc)} doc(s) | material {len(material_docs)} | "
            f"cosmetic-only {len(cosmetic_only)} | changed {len(changed)} | "
            f"unchanged {len(unchanged)} | previously failed {len(set(previously_failed))} | "
            f"not rerun {len(not_rerun)} | view queue {len(payload['view_queue'])} -> {out}")
        return 0

    if args.crop:
        if not args.round_dir:
            log("--crop requires --round-dir")
            return 2
        did = int(args.crop)
        pf = ocr_payload_path(args.round_dir, did, "round")
        payload = json.loads(pf.read_text(encoding="utf-8")) if pf.exists() else {}
        page, rect = args.crop_page, None
        if args.crop_box:
            rect = [float(v) for v in args.crop_box.split(",")]
            pages_sel = payload.get("selected_invoice_pages") or [1]
            page = page or (int(pages_sel[0]) if pages_sel else 1)
        elif args.crop_field:
            found = find_field_box(payload, args.crop_field)
            if not found:
                log(f"--crop-field {args.crop_field}: not found in {pf}")
                return 2
            page, rect = (page or found[0]), found[1]
            if rect is None:
                log(f"--crop-field {args.crop_field}: no bbox stored, use --crop-box x,y,w,h")
                return 2
        else:
            log("--crop needs --crop-field or --crop-box")
            return 2
        src_dir = args.source_images_dir or (ROOT / "bbox_testing" / "source_images")
        src_png = src_dir / f"DMS-{did}_p{page}.png"
        if not src_png.exists():
            log(f"missing source image {src_png}")
            return 2
        img = Image.open(src_png)
        rot = 0
        for p in (payload.get("meta") or {}).get("pages_classification") or []:
            if int(p.get("page_no") or 0) == int(page):
                rot = int(p.get("r") or p.get("rotate_degrees") or 0)
        if rot in (90, 180, 270):
            img = img.rotate(-rot, expand=True)
        crop = crop_rect_norm(img, rect, pad_norm=args.crop_pad)
        if crop.size[0] < 1000:
            factor = min(4.0, 1000.0 / crop.size[0])
            crop = crop.resize((int(crop.size[0] * factor), int(crop.size[1] * factor)), Image.LANCZOS)
        crops_dir = args.round_dir / "crops"
        crops_dir.mkdir(parents=True, exist_ok=True)
        out = crops_dir / (args.crop_out or f"DMS-{did}_{args.crop_field or 'evidence'}.png")
        crop.save(out)
        log(f"crop {src_png.name} box={[round(float(v), 3) for v in rect]} -> {out} {crop.size}")
        return 0

    if args.audit_round:
        round_dir = args.audit_round
        src_dir = args.source_images_dir or (ROOT / "bbox_testing" / "source_images")
        docs: Dict[str, Any] = {}
        for pf in sorted((round_dir / "ocr").glob("DMS-*.json")):
            did = int(pf.stem.split("-")[-1])
            data = json.loads(pf.read_text(encoding="utf-8"))
            dims: Dict[int, Tuple[int, int]] = {}
            for png in sorted(src_dir.glob(f"DMS-{did}_p*.png")):
                try:
                    pno = int(png.stem.rsplit("_p", 1)[1])
                except IndexError:
                    continue
                with Image.open(png) as im:
                    dims[pno] = im.size
            a = audit_doc(data, dims)
            total = int(a.get("total_pages") or (max(dims) if dims else 0))
            unselected = [p for p in range(1, total + 1) if p not in a["selected_pages"]]
            review_md = round_dir / "review" / f"DMS-{did}.md"
            findings = a["findings"]
            docs[f"DMS-{did}"] = {
                "selected_pages": a["selected_pages"],
                "total_pages": a.get("total_pages"),
                "rows_ocr_per_page": a["rows_ocr_per_page"],
                "boxes_total": a["boxes_total"],
                "findings": findings,
                "needs_source_check": any(f.split(":")[0] in
                                          ("MISSING_FIELD", "OOB", "LINE_AR", "DUPLICATE",
                                           "NO_LINE_ITEMS", "BAD_BBOX") for f in findings),
                "unselected_pages": unselected,
                "first_unselected_page_to_view": (unselected[0] if unselected else None),
                "review_written": bool(review_md.exists() and review_md.read_text(encoding="utf-8").strip()),
            }
        pending = [k for k, v in docs.items() if not v["review_written"]]
        progress = {
            "round": round_dir.name,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "docs_scanned": len(docs),
            "inspected": sorted(k for k, v in docs.items() if v["review_written"]),
            "pending_view": pending,
            "triage_order": sorted(pending, key=lambda k: -len(docs[k]["findings"])),
            "docs": docs,
        }
        out = round_dir / "progress.json"
        out.write_text(json.dumps(progress, indent=2, ensure_ascii=False), encoding="utf-8")
        flagged = sum(1 for v in docs.values() if v["findings"])
        log(f"Audit: {len(docs)} doc(s) | {flagged} with automated findings | {len(pending)} awaiting visual review -> {out}")
        return 0

    if args.download_only:
        missing = missing_pdf_ids(doc_ids)
        log(f"PDF cache: {len(doc_ids) - len(missing)}/{len(doc_ids)} present, {len(missing)} missing")
        done = 0
        for did in missing:
            try:
                fetch_pdf(did)
                done += 1
                log(f"  [DL] DMS-{did} ok ({done}/{len(missing)})")
            except Exception as exc:
                log(f"  [DL-FAIL] DMS-{did}: {exc}")
        still_missing = missing_pdf_ids(doc_ids)
        log(f"Downloaded {done}/{len(missing)} -> still missing: {len(still_missing)} {still_missing[:20]}")
        return 0

    if args.emit_source_images:
        img_dir = args.emit_source_images
        img_dir.mkdir(parents=True, exist_ok=True)
        written = skipped = errors = 0
        for did in doc_ids:
            try:
                pdf_bytes, _meta = fetch_pdf(did)
                pages = render_pdf_pages(pdf_bytes, dpi=args.dpi)
            except Exception as exc:
                log(f"  [IMG-FAIL] DMS-{did}: {exc}")
                errors += 1
                continue
            for p_no, img in pages:
                target = img_dir / f"DMS-{did}_p{p_no}.png"
                if target.exists():
                    skipped += 1
                    continue
                img.save(target, "PNG")
                written += 1
        log(f"source_images: written={written} skipped_existing={skipped} errors={errors} -> {img_dir.resolve()}")
        return 0

    log(f"=== Starting Two-Step Invoice Extraction Pipeline ===")
    log(f"Target documents: {len(doc_ids)} ({doc_ids[:10]}{'...' if len(doc_ids) > 10 else ''})")
    log(f"Output directory: {out_dir.resolve()}")
    log(f"Vision Model:     {model_full}")
    log(f"Concurrency:      {args.workers} worker(s)\n")

    client = OpenAI(base_url=LITELLM_URL, api_key=LITELLM_KEY or "dummy")
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.stability:
        round_dir = args.stability
        ids = [int(p.stem.split("-", 1)[1]) for p in sorted((round_dir / "ocr").glob("DMS-*.json"))]
        if args.stability_limit:
            ids = ids[:args.stability_limit]
        src_dir = args.source_images_dir or (ROOT / "bbox_testing" / "source_images")
        log(f"Stability: {len(ids)} document(s) x {args.runs} identical run(s) - this measures the model, not a change")
        for run_no in range(1, args.runs + 1):
            run_dir = round_dir / "stability" / f"run{run_no}"
            run_dir.mkdir(parents=True, exist_ok=True)
            with ThreadPoolExecutor(max_workers=args.workers) as executor:
                futs = [executor.submit(process_single_doc, client, did, run_dir, args.dpi, False,
                                        model_full, "round", args.recheck_digits) for did in ids]
                for fut in as_completed(futs):
                    fut.result()
            log(f"  run {run_no}/{args.runs} complete -> {run_dir}")

        per_doc: Dict[str, Any] = {}
        field_hits: Dict[str, int] = {}
        for did in ids:
            doc = f"DMS-{did}"
            pa = round_dir / "stability" / "run1" / "ocr" / f"{doc}.json"
            pb = round_dir / "stability" / "run2" / "ocr" / f"{doc}.json"
            if not (pa.exists() and pb.exists()):
                continue
            dims = {}
            for png in src_dir.glob(f"{doc}_p*.png"):
                try:
                    dims[int(png.stem.rsplit("_p", 1)[1])] = Image.open(png).size
                except (IndexError, ValueError):
                    continue
            d = diff_round_payloads(json.loads(pa.read_text(encoding="utf-8")),
                                    json.loads(pb.read_text(encoding="utf-8")), dims,
                                    ignore_fields=set(NON_SCORING_FIELDS))
            unstable = set()
            for entry in d["text"] + d["moved"]:
                if entry.startswith("field:"):
                    unstable.add(entry.split(":", 1)[1].split(":")[0])
            per_doc[doc] = {"unstable_fields": sorted(unstable),
                            "rows_renumbered": len(d["renumbered"]),
                            "row_box_moved": bool(d["row_moves"]),
                            "rows_added_or_removed": len(d["boxes_added"]) + len(d["boxes_removed"]),
                            "pages_stable": not any(t.startswith("selected_pages") for t in d["text"])}
            for f in unstable:
                field_hits[f] = field_hits.get(f, 0) + 1
        n_ok = max(len(per_doc), 1)
        rates = {f: round(c / n_ok, 3) for f, c in sorted(field_hits.items(), key=lambda kv: -kv[1])}
        noisy = sorted(f for f, r in rates.items() if r >= args.noisy_field_rate)
        payload = {"round": round_dir.name, "documents_compared": len(per_doc), "runs": args.runs,
                   "model": model_full, "temperature": 0,
                   "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                   "rule": f"a field is noisy when it differs in >= {args.noisy_field_rate:.0%} of documents "
                           f"between two runs of identical code",
                   "instability_rate_by_field": rates, "noisy_fields": noisy,
                   "docs": per_doc}
        out = round_dir / "stability_report.json"
        out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        log(f"Stability over {len(per_doc)} doc(s): noisy fields (>= {args.noisy_field_rate:.0%}) = {noisy} -> {out}")
        log("rates: " + ", ".join(f"{f} {r:.0%}" for f, r in list(rates.items())[:12]))
        return 0

    results = []
    if args.workers <= 1 or len(doc_ids) == 1:
        for did in doc_ids:
            res = process_single_doc(
                client, did, out_dir, dpi=args.dpi, skip_existing=args.skip_existing, model=model_full,
                layout=args.layout, recheck_digits=args.recheck_digits,
            )
            results.append(res)
    else:
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            future_map = {
                executor.submit(
                    process_single_doc, client, did, out_dir, args.dpi, args.skip_existing, model_full,
                    args.layout, args.recheck_digits
                ): did
                for did in doc_ids
            }
            for fut in as_completed(future_map):
                results.append(fut.result())

    # Summary table
    ok_count = sum(1 for r in results if r.get("status") == "ok")
    err_count = sum(1 for r in results if r.get("status") == "error")
    skip_count = sum(1 for r in results if r.get("status") == "skipped")

    log("\n=== Execution Summary ===")
    log(f"Total: {len(results)} | Succeeded: {ok_count} | Skipped: {skip_count} | Errors: {err_count}")
    log(f"Results stored under: {out_dir.resolve()}")
    return 0 if err_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
