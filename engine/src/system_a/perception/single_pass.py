"""Single-pass perception (v5.1, 2026-10-13): DMS PDF -> ExtractionResult.

Replaces ``VisionPipeline`` on the production path (``PERCEPTION_ENGINE=single_pass``, the default);
``vision_pipeline.py`` is untouched and still selectable with ``PERCEPTION_ENGINE=vision``.

    Step 1  classify  ONE multi-image call at low DPI for EVERY document, single pages included (type /
                      copy / doc no / page marker / rotation / hand-written numbers).  No coordinates are
                      taken from this call, so multi-image spatial compression does not matter here.
    Step 2  extract   ONE call per selected invoice page, single image, rotated upright first.
    Step 3  adapter   pure code (no LLM): row admission, header/total field choice, occurrences, regions.

Principles
  * One reader is reported honestly: every value has ``agreement=False`` and ``confidence=None``; values are
    accepted by domain/evidence.py (arithmetic closes / Oracle confirms), never by re-reading.
  * Nothing is guessed and nothing is deleted: a row that is not an item (empty / header / total line /
    stray text) is excluded from validation but kept, with its bbox, as a RegionNode and in
    ``extra["excluded_rows"]``.  A continuation row is folded into the previous item's description and its
    own bbox is kept in ``extra["folded_rows"]``.
  * Classification failure is never papered over: no page is read, ``pages_complete=False`` and the
    reason is in ``extra["selection"]["classify_failed"]`` (E01 -> REVIEW, nothing cached).
  * Raw text only: numbers, dates and units are normalised by domain/normalize.py (Decimal), not here.
"""
from __future__ import annotations

import base64
import hashlib
import io
import os
import re
import statistics
import time
from typing import Optional

import numpy as np

from ..domain.contracts import (DocumentInfo, ExtractionResult, PageInfo, RawField, RawLine, Region,
                                RegionNode, SignatureObs)
from ..domain.normalize import thai_to_arabic
from ..domain.standard import load_prompt
from .coords import (choose_coord_mode, INK_RULES_VERSION, ink_mask, is_placeholder, rotate_box_back, rotate_image,
                     rotate_px_box_back, strip_rules,
                    sanitize_xyxy, snap_box_to_ink, xyxy_px, xyxy_to_xywh)
from .orientation import MODEL_SHA256, OrientationResult

ENGINE = "single-pass/1.2.0"
PROMPTS = ("single_pass_classify", "single_pass_extract")

HEADER_FIELDS = ("invoice_num", "invoice_date", "po_number", "supplier_name", "supplier_tax_id",
                 "customer_name", "customer_tax_id", "customer_address", "currency")
TOTAL_FIELDS = ("sub_total", "vat", "grand_total")          # taken from the LAST page that prints them
ALL_FIELDS = HEADER_FIELDS + TOTAL_FIELDS
OCCURRENCE_FIELDS = ("invoice_num", "po_number", "supplier_tax_id", "customer_tax_id")
#: occurrence -> label understood by application/invoice_keys.document_candidates
OCCURRENCE_LABEL = {"invoice_num": "doc_no", "po_number": "po_number",
                    "supplier_tax_id": "supplier_tax_id", "customer_tax_id": "customer_tax_id"}
CELLS = ("item_code", "description", "qty", "uom", "unit_price", "amount")
NUMBER_CELLS = ("qty", "unit_price", "amount")

TYPE_TO_PAGE = {"tax_invoice": "TAX_INVOICE", "invoice": "INVOICE", "delivery": "DELIVERY_NOTE",
                "po": "PO", "other": "SUPPORTING"}
TYPE_TO_DOCTYPE = {"tax_invoice": "tax_invoice", "invoice": "invoice", "delivery": "delivery_note",
                   "po": "purchase_order", "other": "other"}
INVOICE_TYPES = ("tax_invoice", "invoice")
SIGNATURE_SLOT = {"receiver_signature": "receiver", "received_stamp": "receiver",
                  "deliverer_signature": "deliverer"}
REGION_KIND = {"table": "table", "stamp": "stamp", "signature": "signature_box"}

_HEADER_ROW = re.compile(r"DESCRIPTION|QUANTITY|UNIT\s*PRICE|AMOUNT|รายการสินค้า|รายการ$|จำนวนเงิน|ราคาต่อหน่วย|"
                         r"รหัสสินค้า|^หน่วย$|^UNIT$|^ITEM$|^NO\.?$|^ลำดับ$", re.I)
_TOTAL_ROW = re.compile(r"SUB\s*-?\s*TOTAL|GRAND\s*TOTAL|TOTAL|VAT|รวม|ภาษี|ยอดยก|CARRIED|BROUGHT|ส่วนลด|DISCOUNT|"
                        r"ค่าขนส่ง|DELIVERY\s*CHARGE", re.I)
_MARKER = re.compile(r"^\s*(\d+)\s*/\s*(\d+)\s*$")
# The same page count the paper writes in words: "Page 1 of 2", "หน้า 2 จาก 2".  Read as no marker at all,
# a document loses its printed length - pages_complete then says "complete" and nothing bounds it.
_MARKER_WORD = re.compile(r"^\s*(?:page|หน้า|แผ่น|ฉบับ)?\s*(\d+)\s*(?:of|จาก)\s*"
                         r"(?:page|หน้า|แผ่น|ฉบับ)?\s*(\d+)\s*$", re.IGNORECASE)


# ============================================================================ small helpers (pure)
def norm_key(s) -> str:
    """Comparison form of a document number (Thai digits -> Arabic, no spaces/punctuation, upper)."""
    return "".join(ch for ch in thai_to_arabic(str(s or "")).upper() if ch.isalnum())


def _raw(cell) -> Optional[str]:
    v = cell.get("raw", cell.get("text", cell.get("value"))) if isinstance(cell, dict) else cell
    if v is None:
        return None
    t = str(v).strip()
    return t if t and t.lower() not in ("null", "none", "-", "n/a") else None


def _box(cell) -> Optional[list]:
    b = cell.get("bbox_2d") if isinstance(cell, dict) else None
    if isinstance(b, (list, tuple)) and len(b) == 4:
        try:
            return [float(v) for v in b]
        except (TypeError, ValueError):
            return None
    return None


def compute_row_bbox_from_cells(cells: dict, table_bbox: Optional[list] = None) -> Optional[list[float]]:
    """Compute horizontal row bounding box from cell union with median outlier filtering."""
    if not isinstance(cells, dict):
        return None
    boxes = []
    y_centers = []
    for k, v in cells.items():
        if k in ("line_bbox", "line_no"):
            continue
        b = None
        if isinstance(v, dict):
            b = v.get("bbox_2d") or v.get("bbox")
        elif isinstance(v, (list, tuple)) and len(v) == 4:
            b = v
        if b is not None:
            sb = sanitize_xyxy(b)
            if sb:
                boxes.append(sb)
                y_centers.append((sb[1] + sb[3]) / 2.0)
    if not boxes:
        return None
    med_y = statistics.median(y_centers)
    kept = [b for b, yc in zip(boxes, y_centers) if abs(yc - med_y) <= 0.05]
    if not kept:
        return None
    min_x = min(b[0] for b in kept)
    min_y = min(b[1] for b in kept)
    max_x = max(b[2] for b in kept)
    max_y = max(b[3] for b in kept)
    if table_bbox is not None:
        st = sanitize_xyxy(table_bbox)
        if st:
            min_x = min(min_x, st[0])
            max_x = max(max_x, st[2])
    return [round(min_x, 4), round(min_y, 4), round(max_x, 4), round(max_y, 4)]


def validate_line_bbox(box: Optional[list[float]]) -> bool:
    """Validate that line_bbox is a plausible horizontal row (aspect ratio >= 1.5, w >= 0.45, h <= 0.25)."""
    if box is None:
        return False
    sb = sanitize_xyxy(box)
    if not sb:
        return False
    w = sb[2] - sb[0]
    h = sb[3] - sb[1]
    if h <= 0:
        return False
    aspect = w / h
    return bool(aspect >= 1.5 and w >= 0.45 and h <= 0.25)


def parse_marker(m) -> Optional[tuple[int, int]]:
    hit = _MARKER.match(str(m or "")) or _MARKER_WORD.match(str(m or ""))
    if not hit:
        return None
    a, b = int(hit.group(1)), int(hit.group(2))
    return (a, b) if 1 <= a <= b else None


def normalize_classify(raw: dict, n_pages: int) -> list[dict]:
    """Classify answer (short or long keys) -> one entry per page; a page the model skipped is 'other'."""
    out: dict[int, dict] = {}
    for i, e in enumerate((raw or {}).get("pages") or []):
        if not isinstance(e, dict):
            continue
        try:
            p = int(e.get("p") or e.get("page_no") or e.get("page") or i + 1)
        except (TypeError, ValueError):
            continue
        t = str(e.get("t") or e.get("doc_type") or "other").strip().lower()
        t = t if t in TYPE_TO_PAGE else ("tax_invoice" if "tax" in t else "other")
        c = str(e.get("c") or e.get("copy_status") or "original").strip().lower()
        try:
            r = int(e.get("r") if e.get("r") is not None else e.get("rotate_degrees") or 0)
        except (TypeError, ValueError):
            r = 0
        hw = e.get("h") if isinstance(e.get("h"), list) else []
        out[p] = {"page_no": p, "doc_type": t, "copy_status": "copy" if c == "copy" else "original",
                  "doc_no_hint": _raw(e.get("n") if "n" in e else e.get("doc_no_hint")),
                  "page_marker": _raw(e.get("m") if "m" in e else e.get("page_marker")),
                  "rotate_degrees": r if r in (0, 90, 180, 270) else 0,
                  "handwritten": [str(x).strip() for x in hw if str(x or "").strip()]}
    return [out.get(p) or {"page_no": p, "doc_type": "other", "copy_status": "original", "doc_no_hint": None,
                           "page_marker": None, "rotate_degrees": 0, "handwritten": [], "missing_in_answer": True}
            for p in range(1, n_pages + 1)]


# ============================================================================ page selection (pure)
def select_invoice_pages(pages: list[dict]) -> dict:
    """Which pages are THE invoice.  Never drops a page that carries content no other page has.

    * invoice pages = tax_invoice / invoice
    * a page is a re-print only when another kept page has the same (document number, page marker);
      the copy/original word on the page decides nothing by itself (a stamped continuation sheet stays)
    * several different document numbers (after norm_key) -> ``multi_invoice``: the first number's pages are
      read; every other number stays an occurrence so Oracle arbitrates (ambiguous -> MANUAL_REVIEW)
    * printed markers that do not cover 1..b -> ``pages_complete = False`` (E01, never a silent pass)
    * a page numbered past the printed length (``b``) is not this document, even when it quotes the same
      document number; inside that range a page keeps its rows whether or not it printed a marker
    * no invoice page at all -> nothing is read, ``pages_complete = False`` (no guessing page 1)
    """
    taxes = [p for p in pages if p["doc_type"] == "tax_invoice"]
    invoices = [p for p in pages if p["doc_type"] == "invoice"]
    inv = taxes if taxes else (invoices if invoices else [])
    info: dict = {"invoice_pages_seen": [p["page_no"] for p in inv], "dropped": [], "multi_invoice": False,
                  "doc_numbers": [], "no_invoice_page": False, "pages_complete": True, "marker_gaps": None}
    if not inv:
        info.update(no_invoice_page=True, pages_complete=False, selected=[])
        return info
    keys = []
    for p in inv:
        k = norm_key(p.get("doc_no_hint"))
        if len(k) >= 3 and k not in keys:
            keys.append(k)
    info["doc_numbers"] = keys
    target = inv
    if len(keys) > 1:
        info["multi_invoice"] = True
        target = [p for p in inv if norm_key(p.get("doc_no_hint")) in (keys[0], "")]
        info["dropped"] += [{"page": p["page_no"], "reason": "other_document_number",
                             "doc_no_hint": p.get("doc_no_hint")} for p in inv if p not in target]
    ordered = sorted(target, key=lambda p: (p["copy_status"] == "copy", p["page_no"]))   # originals first
    seen, kept = set(), []
    for p in ordered:
        marker = parse_marker(p.get("page_marker"))
        doc_k = norm_key(p.get("doc_no_hint"))
        key = (doc_k, marker) if marker else None
        if key and key in seen:
            info["dropped"].append({"page": p["page_no"], "reason": "reprint_same_number_and_marker",
                                    "doc_no_hint": p.get("doc_no_hint"), "page_marker": p.get("page_marker")})
            continue
        # Prune duplicate copy sheet when an original sheet with the same doc_no is already kept without markers
        if marker is None and len(doc_k) >= 3 and p.get("copy_status") == "copy":
            has_orig = any(norm_key(x.get("doc_no_hint")) == doc_k and x.get("copy_status") != "copy"
                           for x in target if x["page_no"] in kept)
            if has_orig:
                info["dropped"].append({"page": p["page_no"], "reason": "copy_sheet_of_existing_original",
                                        "doc_no_hint": p.get("doc_no_hint")})
                continue
        if key:
            seen.add(key)
        kept.append(p["page_no"])
    kept.sort()

    # What the paper prints about its own length is the authority on how long this document is.  A sheet
    # numbered past that length cannot be part of it, even when it quotes the same document number - and a
    # sheet inside the range keeps its rows even if it printed no marker of its own (that case is a marker
    # gap, reported through ``marker_gaps``, not a reason to throw money away).  DMS-159: pages printed
    # ``Page 1 of 2`` / ``Page 2 of 2``, page 6 quoted the same number and added a 16,500.00 row on top of
    # a subtotal the paper had already closed.
    printed = [m for m in (parse_marker(p.get("page_marker")) for p in target if p["page_no"] in kept) if m]
    if printed:
        beyond = max(b for _a, b in printed)
        reading = []
        for p in target:
            if p["page_no"] not in kept:
                continue
            if p["page_no"] <= beyond or parse_marker(p.get("page_marker")):
                reading.append(p["page_no"])
            else:
                info["dropped"].append({"page": p["page_no"], "reason": "unmarked_page_beyond_printed_count",
                                        "printed_pages": beyond, "doc_no_hint": p.get("doc_no_hint")})
        kept = sorted(reading)

    markers = [m for m in (parse_marker(p.get("page_marker")) for p in target if p["page_no"] in kept) if m]
    if markers:
        total = max(m[1] for m in markers)
        gaps = [i for i in range(1, total + 1) if i not in {m[0] for m in markers}]
        if gaps:
            info.update(pages_complete=False, marker_gaps=gaps)
    info["selected"] = kept
    return info


# ============================================================================ rows (pure)
def classify_row(row: dict) -> str:
    """item | continuation | empty | header | total_line  (decided from the printed text only)."""
    nums = [_raw(row.get(k)) for k in NUMBER_CELLS]
    desc = " ".join(t for t in (_raw(row.get("item_code")), _raw(row.get("description"))) if t)
    uom = _raw(row.get("uom"))
    if not any(nums) and not desc and not uom:
        return "empty"
    has_digit = any(n and re.search(r"\d", thai_to_arabic(n)) for n in nums)
    joined = " ".join(t for t in [desc, uom] + nums if t)
    if not has_digit and _HEADER_ROW.search(joined):
        return "header"
    if _TOTAL_ROW.search(desc or "") and not _raw(row.get("qty")) and not _raw(row.get("unit_price")):
        return "total_line"
    if not any(nums):
        return "continuation"
    return "item"


def admit_rows(rows_by_page: list[tuple[int, list]]) -> tuple[list[dict], list[dict], list[dict]]:
    """Rows of every selected page -> (items, folded, excluded).  Items are renumbered 1..n over the document."""
    items, folded, excluded = [], [], []
    for page, rows in rows_by_page:
        for idx, row in enumerate(rows or [], start=1):
            if not isinstance(row, dict):
                continue
            status = classify_row(row)
            rec = {"page": page, "page_line_no": row.get("line_no") or idx, "row": row, "status": status}
            if status == "item":
                items.append(rec)
            elif status == "continuation" and items and items[-1]["page"] == page:
                prev = items[-1]["row"]
                extra_txt = " ".join(t for t in (_raw(row.get("item_code")), _raw(row.get("description"))) if t)
                d = dict(prev.get("description")) if isinstance(prev.get("description"), dict) else {}
                d["raw"] = ((_raw(prev.get("description")) or "") + " " + extra_txt).strip()
                d.setdefault("bbox_2d", _box(row.get("description")))
                prev["description"] = d
                folded.append({**rec, "into_page_line_no": items[-1]["page_line_no"], "text": extra_txt})
            else:
                excluded.append({**rec, "status": "orphan_text" if status == "continuation" else status})
    for i, it in enumerate(items, start=1):
        it["line_no"] = i
    return items, folded, excluded


# ============================================================================ adapter (pure)
class PageAnswer:
    """One extract answer + dimensions before/after rotation + transformation matrix M."""

    def __init__(self, page_no: int, orig_w: int, orig_h: int,
                 rot_w: Optional[int] = None, rot_h: Optional[int] = None,
                 M: Optional[np.ndarray] = None, answer: Optional[dict] = None,
                 coord: str = "norm1000", mask: Optional[np.ndarray] = None,
                 snap: bool | str = True):
        self.page_no = page_no
        if answer is None and isinstance(rot_w, dict):
            # Backward compatibility with (page_no, w, h, answer, coord)
            answer = rot_w
            coord = rot_h if isinstance(rot_h, str) else "norm1000"
            rot_w, rot_h, M = orig_w, orig_h, None
        if rot_w is None:
            rot_w, rot_h = orig_w, orig_h
        self.orig_w, self.orig_h = orig_w, orig_h
        self.rot_w, self.rot_h = rot_w, rot_h
        self.M = M
        self.w, self.h = orig_w, orig_h
        self.answer = answer or {}
        self.mask = mask          # ink map of the page as it was sent, for box corrections
        self.snap_mode = ink_snap_mode(snap)      # both / move / grow / off - see R4-9 below
        self.snap_boxes = self.snap_mode != "off"  # False = the arm that delivers the model's boxes untouched
        boxes = [b for b in (_box(v) for v in (self.answer.get("fields") or {}).values()) if b]
        for r in self.answer.get("line_items") or []:
            if isinstance(r, dict):
                boxes += [b for b in [_box({"bbox_2d": r.get("line_bbox")})] + [_box(r.get(k)) for k in CELLS] if b]
        boxes += [b for b in (_box(r) for r in self.answer.get("regions") or []) if b]
        self.coord = choose_coord_mode(boxes, rot_w, rot_h, None, coord) if coord in ("auto", "words") else coord

    def _px(self, b, snap: bool = False):
        """A model box -> a pixel rect in the frame the page was sent in, optionally corrected against ink."""
        if not b:
            return None
        mode = "norm1" if max(float(v) for v in b) <= 1.0 else self.coord
        rect = xyxy_px(b, self.rot_w, self.rot_h, mode)
        if snap and self.snap_boxes and self.mask is not None:
            corrected, note = snap_box_to_ink(rect, self.mask,
                                             move=self.snap_mode in ("both", "move"),
                                             grow=self.snap_mode in ("both", "grow"))
            if note != "unchanged":
                rect = corrected
            # untouched stays untouched: the correction works in whole pixels, so adopting its answer when
            # it acted on nothing would re-quantise the model's own box by up to 1 px (see R4-9's control arm)
        return rect

    def region(self, b, snap: bool = False, contains: tuple = ()) -> Optional[Region]:
        """A model box -> a page region.  ``snap`` corrects a field/cell box against the page's own ink.

        The page's own ``snap_mode`` has the final say, so one run is one arm: a measurement run that
        switched the correction off cannot have a single box quietly corrected anyway.

        ``contains`` are the boxes this region is the frame of - a row's cells - given in the model's own
        units and corrected by the same rule the cells themselves get.  A row that was drawn around a cell
        must still contain it after the cell is corrected: only cells are snapped, so without this the
        correction would break, for free, the one invariant two audit rounds measured at zero breaks.
        A box the model never placed inside this one is not adopted (it stays a model problem to report).
        """
        rect = self._px(b, snap)
        if rect is None:
            return None
        if contains:
            frame = self._px(b) or rect
            for cell in contains:
                drawn, moved = self._px(cell), self._px(cell, snap=True)
                if drawn is None or moved is None:
                    continue
                if drawn[1] >= frame[3] or drawn[3] <= frame[1]:      # not in this row to begin with
                    continue
                rect = (min(rect[0], moved[0]), min(rect[1], moved[1]),
                        max(rect[2], moved[2]), max(rect[3], moved[3]))
        bbox, rbox = rotate_px_box_back(rect, self.rot_w, self.rot_h, self.orig_w, self.orig_h, self.M)
        if bbox[2] <= 0 or bbox[3] <= 0:
            return None
        return Region(page=self.page_no, bbox=bbox, rbox=rbox)


def _rf(cell, page: PageAnswer) -> RawField:
    raw = _raw(cell)
    # A box only deserves correcting if it carries something to recover.  A cell that read "-" (or nothing) is
    # delivered with its region, and correcting that region walks the crop onto a neighbour's digits - which
    # is how R4-13's only regression happened (DMS-159 vat, raw "-", moved 11 px onto another value's line).
    snap = not is_placeholder(raw)
    if raw is None:
        return RawField(raw=None, confidence=None, agreement=True,
                        region=page.region(_box(cell), snap=snap) if cell else None,
                        source="ocr", null_reason="NOT_PRESENT")
    # one reader: agreement False -> the domain needs independent evidence (arithmetic / Oracle) to accept it
    return RawField(raw=raw, confidence=None, agreement=False, region=page.region(_box(cell), snap=snap),
                    source="vlm")


def _present(v) -> Optional[bool]:
    t = str(v or "").strip().lower()
    if t in ("signed", "stamped", "present", "true", "yes"):
        return True
    if t in ("empty", "blank", "false", "no", "unsigned"):
        return False
    return None


def drop_reprint_pages(reads: dict, selected: list[int]) -> tuple[list[int], list[dict]]:
    """Drop pages that repeat another page's rows and totals - the same sheet printed again.

    :func:`select_invoice_pages` keeps every page whose printed marker differs, because a stamped
    continuation sheet has to survive that decision; the price of that safety is a document handed over as
    four identical sheets (DMS-134, round 4: one ``ENERGIZER … 231.00`` row read three times under a single
    231.00 subtotal).  Comparing what was actually extracted is the check selection could not make - it
    only becomes possible after the pages have been read.

    A page that came back with no rows is never dropped: that may be the sheet carrying the stamp and the
    signatures, and its evidence is worth more than the duplicate rows it cannot have.
    """
    kept: list[int] = []
    seen: dict[tuple, int] = {}
    reprints: list[dict] = []
    for p in selected:
        answer = getattr(reads.get(p), "answer", None) or {}
        head, rows = _page_signature(answer)
        if not rows:
            kept.append(p)
            continue
        key = (head, rows)
        if key in seen:
            reprints.append({"page": p, "same_as_page": seen[key], "rows": len(rows),
                             "invoice_num": _raw((answer.get("fields") or {}).get("invoice_num"))})
            continue
        seen[key] = p
        kept.append(p)
    return kept, reprints


def _page_signature(answer: dict) -> tuple:
    """The two things that say "this is the same sheet": the header totals and the row cells."""
    f = (answer or {}).get("fields") or {}
    head = tuple(norm_key(_raw(f.get(k))) for k in ("invoice_num", "sub_total", "vat", "grand_total"))
    rows: list[tuple] = []
    for row in (answer or {}).get("line_items") or []:
        if not isinstance(row, dict):
            continue
        cells = tuple(norm_key(_raw(row.get(k))) for k in CELLS)
        if any(cells):
            rows.append(cells)
    return head, tuple(rows)


def build_extraction(*, package_id: str, dms_doc_id: str, sha: str, page_infos: list[PageInfo],
                     classified: list[dict], selection: dict, reads: dict[int, PageAnswer],
                     page_errors: dict, calls: list, model: str, prompt_version: str,
                     timings: dict, page_orientations: Optional[dict] = None,
                     ink_snap: bool = True, snap_mode: Optional[str] = None) -> ExtractionResult:
    snap_mode = snap_mode or INK_SNAP_DEFAULT     # the payload has to say which knobs made it
    selected = [p for p in selection["selected"] if p in reads]
    selected, reprint_pages = drop_reprint_pages(reads, selected)
    # ---------------------------------------------------------------- fields
    fields: dict[str, RawField] = {}
    field_page: dict[str, int] = {}
    for name in ALL_FIELDS:
        for p in (list(reversed(selected)) if name in TOTAL_FIELDS else selected):
            cell = (reads[p].answer.get("fields") or {}).get(name)
            if _raw(cell) is not None:
                fields[name], field_page[name] = _rf(cell, reads[p]), p
                break
    # ---------------------------------------------------------------- occurrences / handwriting -> candidates
    items_by_page: dict[str, list] = {}
    regions: list[RegionNode] = []
    rid = 0

    def add_region(page: PageAnswer, kind: str, label: str, text, b) -> Optional[str]:
        nonlocal rid
        reg = page.region(b)
        if reg is None:
            return None
        rid += 1
        regions.append(RegionNode(region_id=f"SP-R{rid:03d}", page=page.page_no, kind=kind, label=label,
                                  text=None if text is None else str(text)[:500], confidence=None,
                                  bbox=reg.bbox, rbox=reg.rbox))
        return f"SP-R{rid:03d}"

    for p in selected:
        pg, lst = reads[p], items_by_page.setdefault(str(p), [])
        occ = pg.answer.get("occurrences") or {}
        for name in OCCURRENCE_FIELDS:
            entries = [e for e in (occ.get(name) or []) if isinstance(e, dict) and _raw(e)]
            primary = (pg.answer.get("fields") or {}).get(name)
            if _raw(primary) and not any(norm_key(_raw(e)) == norm_key(_raw(primary)) for e in entries):
                entries.append({"raw": _raw(primary), "label_text": "", "bbox_2d": _box(primary)})
            for e in entries:
                reg = pg.region(_box(e))
                lst.append({"type": "header", "label": OCCURRENCE_LABEL[name], "text": _raw(e),
                            "label_text": _raw(e.get("label_text")), "bbox": reg.bbox if reg else None,
                            "source": "single_pass_occurrence"})
                add_region(pg, "other", f"occurrence:{name}", _raw(e), _box(e))
        for h in pg.answer.get("handwritten_refs") or []:
            if isinstance(h, dict) and _raw(h):
                reg = pg.region(_box(h))
                lst.append({"type": "other", "label": "handwriting", "text": _raw(h),
                            "bbox": reg.bbox if reg else None})
                add_region(pg, "other", "handwriting", _raw(h), _box(h))
    # hand-written numbers seen by classify on pages that were NOT extracted (e.g. a delivery note):
    # text only, no bbox (classify coordinates are not trusted) - used as RCV-BY-NUM candidates
    for c in classified:
        if c["page_no"] in selected:
            continue
        for h in c.get("handwritten") or []:
            items_by_page.setdefault(str(c["page_no"]), []).append(
                {"type": "other", "label": "handwriting", "text": h, "bbox": None, "source": "classify"})
    # ---------------------------------------------------------------- rows
    items, folded, excluded = admit_rows([(p, reads[p].answer.get("line_items") or []) for p in selected])
    lines = []
    for it in items:
        pg, row = reads[it["page"]], it["row"]
        cells = {k: _rf(row.get(k), pg) for k in CELLS if row.get(k) is not None}
        raw_box = _box({"bbox_2d": row.get("line_bbox")})
        effective_box = None
        if validate_line_bbox(raw_box):
            effective_box = sanitize_xyxy(raw_box)
        else:
            table_bbox = None
            for r in (pg.answer.get("regions") or []):
                if isinstance(r, dict) and (r.get("label") == "items_table" or r.get("type") == "table"):
                    tb = _box(r)
                    if tb:
                        table_bbox = tb
                        break
            cand = compute_row_bbox_from_cells(row, table_bbox=table_bbox)
            if validate_line_bbox(cand):
                effective_box = cand
        row_region = pg.region(effective_box, contains=tuple(
            b for b in (_box(row.get(k)) for k in CELLS if row.get(k) is not None) if b)) if effective_box else None
        lines.append(RawLine(line_no=it["line_no"], region=row_region, cells=cells))
    for ex in excluded:
        txt = " | ".join(t for t in (_raw(ex["row"].get(k)) for k in CELLS) if t)
        ex["region_id"] = add_region(reads[ex["page"]], "other", f"excluded_row:{ex['status']}", txt,
                                     _box({"bbox_2d": ex["row"].get("line_bbox")}))
    for fo in folded:
        fo["region_id"] = add_region(reads[fo["page"]], "other", "folded_row", fo["text"],
                                     _box({"bbox_2d": fo["row"].get("line_bbox")}))
    # ---------------------------------------------------------------- regions / signatures
    sig_votes: dict[str, list] = {"receiver": [], "deliverer": []}
    for p in selected:
        pg = reads[p]
        for r in pg.answer.get("regions") or []:
            if not isinstance(r, dict):
                continue
            label = str(r.get("label") or r.get("type") or "region").strip().lower()
            kind = REGION_KIND.get(str(r.get("type") or "").lower(), "other")
            present = _present(r.get("present"))
            text = ({True: "stamped" if kind == "stamp" else "signed", False: "empty"}.get(present, "unclear")
                    if kind in ("stamp", "signature_box") else r.get("label"))
            add_region(pg, kind, label, text, _box(r))
            slot = SIGNATURE_SLOT.get(label)
            if slot:
                sig_votes[slot].append((present, pg.region(_box(r)), label))
    signatures = {}
    for slot, votes in sig_votes.items():
        if votes:
            pick = (next((v for v in votes if v[0] is True), None) or next((v for v in votes if v[0] is False), None)
                    or votes[0])
            signatures[slot] = SignatureObs(present=pick[0], confidence=None, kind=pick[2], region=pick[1])
    # ---------------------------------------------------------------- pages / documents
    by_page = {c["page_no"]: c for c in classified}
    pages = tuple(pi.model_copy(update={"page_type": TYPE_TO_PAGE.get(by_page.get(pi.page_no, {}).get("doc_type"),
                                                                      "UNKNOWN")}) for pi in page_infos)
    docs = [DocumentInfo(document_id="D1", document_type="INVOICE", pages=tuple(selected))]
    run: list[int] = []
    for p in [pi.page_no for pi in page_infos if pi.page_no not in selected] + [None]:
        t_prev = by_page.get(run[-1], {}).get("doc_type") if run else None
        if run and (p is None or p != run[-1] + 1 or by_page.get(p, {}).get("doc_type") != t_prev):
            docs.append(DocumentInfo(document_id=f"D{len(docs) + 1}",
                                     document_type=TYPE_TO_PAGE.get(t_prev, "UNKNOWN"), pages=tuple(run)))
            run = []
        if p is not None:
            run.append(p)
    complete = (bool(selection.get("pages_complete")) and bool(selected)
                and not any(str(p) in page_errors for p in selection["selected"]))
    return ExtractionResult(
        package_id=package_id, dms_doc_id=dms_doc_id, file_sha256=sha, pages=pages, documents=tuple(docs),
        invoice_document_id="D1", pages_complete=complete, fields=fields, lines=tuple(lines),
        signatures=signatures, regions=tuple(regions),
        extra={
            "engine": ENGINE, "selection": selection, "classify": classified,
            "items_by_page": items_by_page,
            "doc_type_by_page": {str(c["page_no"]): TYPE_TO_DOCTYPE.get(c["doc_type"], "other") for c in classified},
            "field_page": field_page,
            "lines_meta": [{"line_no": it["line_no"], "page": it["page"], "page_line_no": it["page_line_no"]}
                           for it in items],
            "folded_rows": [{k: v for k, v in f.items()} for f in folded],
            "excluded_rows": [{k: v for k, v in e.items()} for e in excluded],
            "reprint_pages": reprint_pages,
            "coord_mode_by_page": {str(p): reads[p].coord for p in reads},
            "ink_snap": bool(ink_snap),        # which arm of the R4-3c A/B produced this payload
            "ink_snap_mode": snap_mode,        # and which of its two knobs R4-9 left switched on
            "orientation": {str(p): {"r": o.r, "confidence": o.confidence, "uncertain": o.uncertain,
                                     "skew": o.skew, "total": o.total, "runtime": o.runtime}
                            for p, o in (page_orientations or {}).items()},
            "page_errors": page_errors, "calls": calls, "timings_ms": timings,
            "invoice_pages": list(selected),
        },
        extractor={"vlm": model, "prompts": prompt_version, "pipeline": ENGINE, "consensus": "single-read+evidence"})


#: R4-3c: the ink snap must be measurable, and a measurement needs an arm where it is switched off.  The
#: environment decides the default so a batch run picks its arm without any code or Settings change;
#: PERCEPTION_INK_SNAP=0 (also off/false/no) measures the raw model boxes on the same documents.
#: R4-9: the correction is two actions, not one - MOVE a box that sits on blank paper, GROW a box over the
#: run it already touches.  They were shipped together in R4-3a and measured together in R4-3c, which is how
#: a net-negative knob ended up in production: paired on two replications, move fixed 3 boxes and broke none
#: (and removed every empty box), grow fixed 5 and broke 13.  So the shipped default is ``move``, and the
#: environment can name any of them: PERCEPTION_INK_SNAP=move / grow / both / off.
INK_SNAP_ENV = "PERCEPTION_INK_SNAP"
INK_SNAP_OFF = ("0", "off", "false", "no")
INK_SNAP_MODES = ("both", "move", "grow", "off")
INK_SNAP_DEFAULT = "move"


def ink_snap_mode(value, default: str = INK_SNAP_DEFAULT) -> str:
    """The knob setting a bool or a name asks for.  Anything unrecognised keeps the shipped default.

    ``True``/``False`` are the R4-3c spellings and stay exact (all knobs / none); ``None`` means "whatever
    the environment says", which the caller resolves.  An unusable name is not an off switch: silently
    losing the correction would be the worst possible way to read a typo.
    """
    if isinstance(value, bool):
        return "both" if value else "off"
    raw = str(value if value is not None else "").strip().lower()
    if raw in INK_SNAP_MODES:
        return raw
    if raw in INK_SNAP_OFF:
        return "off"
    if not raw:
        return default
    return default


def ink_snap_from_env(default: str = INK_SNAP_DEFAULT) -> str:
    """The knob setting an environment asks for (unset or nonsense keeps the shipped default)."""
    raw = (os.getenv(INK_SNAP_ENV) or "").strip().lower()
    return ink_snap_mode(raw, default=default) if raw else default


# ============================================================================ the pipeline (LLM IO)
class SinglePassPipeline:
    """Same public surface as ``VisionPipeline``: ``extract(pdf, package_id=, dms_doc_id=)``.

    ``client`` is ``adapters.llm.litellm_client.LiteLLMClient`` (``chat_json(..., images=, layout="v3",
    enable_thinking=, max_tokens=, json_mode=)``, ``last_usage``, ``last_salvaged``).
    """

    def __init__(self, client, model: str, *, dpi: int = 150, classify_dpi: int = 80, max_pages: int = 12,
                 max_tokens: int = 8000, coord: str = "norm1000", json_mode: bool = False,
                 thinking: Optional[bool] = False, ink_snap: Optional[bool] = None):
        self.client, self.model = client, model
        self.dpi, self.classify_dpi, self.max_pages = dpi, classify_dpi, max_pages
        self.max_tokens, self.coord, self.json_mode, self.thinking = max_tokens, coord, json_mode, thinking
        self.snap_mode = ink_snap_from_env() if ink_snap is None else ink_snap_mode(ink_snap)
        self.ink_snap = self.snap_mode != "off"   # R4-3c's boolean, still the payload's "was anything corrected"
        self.prompts = {n: load_prompt(n) for n in PROMPTS}
        self.prompt_version = "+".join(self._pid(n) for n in PROMPTS)
        with open(__file__, "rb") as fh:
            # the snap arm is part of the identity: it changes the boxes this pipeline delivers, and
            # process_pdf.py hashes code_version into the perception cache key
            self.code_version = hashlib.sha256(fh.read() + MODEL_SHA256.encode()
                                               + f"|ink_snap={self.snap_mode}|ink_rules={INK_RULES_VERSION}".encode()).hexdigest()[:12]
        self.calls: list[dict] = []
        self.stats: dict = {}

    def _pid(self, name: str) -> str:
        m = re.search(r"prompt_id:\s*([a-z0-9_-]+)\s+version:\s*([0-9.]+)", self.prompts[name][:200])
        return f"{m.group(1)}@{m.group(2)}" if m else f"{name}@unversioned"

    @staticmethod
    def _render(page, dpi: int, rotate: int = 0):
        from PIL import Image
        img = Image.open(io.BytesIO(page.get_pixmap(dpi=dpi).tobytes("png"))).convert("RGB")
        return img.rotate(-rotate, expand=True) if rotate else img        # PIL rotates counter-clockwise

    @staticmethod
    def _data_url(img, quality: int = 90) -> str:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    def _ask(self, kind: str, page, text: str, images: list[str], max_tokens: int) -> dict:
        t0 = time.time()
        entry = {"kind": kind, "page": page, "model": self.model}
        kw = {"images": images, "layout": "v3", "temperature": 0.0, "max_tokens": max_tokens,
              "json_mode": self.json_mode}
        if self.thinking is not None:          # None -> leave the server default untouched
            kw["enable_thinking"] = self.thinking
        try:
            out = self.client.chat_json(self.model, "", text, **kw)
        except Exception as e:
            self.calls.append({**entry, "ok": False, "ms": round((time.time() - t0) * 1000),
                               "error": f"{type(e).__name__}: {str(e)[:200]}"})
            raise
        self.calls.append({**entry, "ok": True, "ms": round((time.time() - t0) * 1000),
                           "salvaged": bool(getattr(self.client, "last_salvaged", False)),
                           "usage": dict(getattr(self.client, "last_usage", {}) or {})})
        return out if isinstance(out, dict) else {}

    def extract(self, pdf: bytes, *, package_id: str, dms_doc_id: str) -> ExtractionResult:
        import fitz
        self.calls = []
        t_all = time.time()
        sha = "sha256:" + hashlib.sha256(pdf).hexdigest()
        timings: dict = {}
        page_errors: dict = {}
        with fitz.open(stream=pdf, filetype="pdf") as doc:
            n = min(len(doc), self.max_pages)
            # ---------------- step 1: render unrotated 80 DPI pages & classify
            t0 = time.time()
            img_80_urls = []
            for i in range(n):
                pg = doc[i]
                img_80 = self._render(pg, self.classify_dpi)
                img_80_urls.append(self._data_url(img_80, quality=70))

            text = self.prompts["single_pass_classify"] + \
                f"\n\nThere are {n} images: Image 1 = page 1 ... Image {n} = page {n}."
            try:
                classified = normalize_classify(self._ask("classify", None, text, img_80_urls, 160 * n + 400), n)
                selection = select_invoice_pages(classified)
            except Exception as e:             # never guess which pages are the invoice
                page_errors["classify"] = f"{type(e).__name__}: {str(e)[:200]}"
                classified = [{"page_no": i + 1, "doc_type": "other", "copy_status": "original",
                               "doc_no_hint": None, "page_marker": None, "rotate_degrees": 0, "handwritten": []}
                              for i in range(n)]
                selection = {"selected": [], "pages_complete": False,
                             "classify_failed": page_errors["classify"],
                             "dropped": [], "multi_invoice": False, "doc_numbers": [], "no_invoice_page": True,
                             "marker_gaps": None, "invoice_pages_seen": []}
            page_orientations: dict[int, OrientationResult] = {}
            for c_entry in classified:
                p_no = c_entry["page_no"]
                r_val = int(c_entry.get("rotate_degrees") or 0)
                page_orientations[p_no] = OrientationResult(
                    r=r_val, confidence=1.0, uncertain=False, skew=0.0, total=float(r_val), runtime="vlm_classify"
                )
            timings["classify_ms"] = round((time.time() - t0) * 1000)
            if len(doc) > self.max_pages:
                selection.update(pages_complete=False, truncated_at=self.max_pages)
            # ---------------- step 2: extract, one upright page per call
            reads: dict[int, PageAnswer] = {}
            t0 = time.time()
            for p in selection["selected"]:
                ori = page_orientations.get(p) or OrientationResult(0, 1.0, False, 0.0, 0.0, "vlm_classify")
                orig_img = self._render(doc[p - 1], self.dpi)
                orig_w, orig_h = orig_img.width, orig_img.height
                if ori.total != 0:
                    rot_img, M = rotate_image(orig_img, ori.total)
                else:
                    rot_img, M = orig_img, None
                rot_w, rot_h = rot_img.width, rot_img.height
                text = self.prompts["single_pass_extract"].replace("{page_no}", str(p))
                try:
                    ans = self._ask("extract", p, text, [self._data_url(rot_img)], self.max_tokens)
                    if getattr(self.client, "last_salvaged", False):
                        page_errors[str(p)] = "TRUNCATED_JSON_SALVAGED"
                except Exception as e:
                    page_errors[str(p)] = f"{type(e).__name__}: {str(e)[:200]}"
                    ans = {}
                reads[p] = PageAnswer(p, orig_w, orig_h, rot_w, rot_h, M, ans, self.coord,
                                      mask=strip_rules(ink_mask(rot_img)), snap=self.snap_mode)
            timings["extract_ms"] = round((time.time() - t0) * 1000)
            infos = []
            for i in range(len(doc)):
                pg = doc[i]
                w, h = round(pg.rect.width, 2), round(pg.rect.height, 2)
                ori = page_orientations.get(i + 1)
                r_deg = ori.r if ori else 0
                infos.append(PageInfo(page_no=i + 1, width_pt=w, height_pt=h, rotation=r_deg, render_dpi=self.dpi))
        timings["total_ms"] = round((time.time() - t_all) * 1000)
        ext = build_extraction(package_id=package_id, dms_doc_id=dms_doc_id, sha=sha, page_infos=infos,
                               classified=classified, selection=selection, reads=reads, page_errors=page_errors,
                               calls=list(self.calls), model=self.model, prompt_version=self.prompt_version,
                               timings=timings, page_orientations=page_orientations, ink_snap=self.ink_snap,
                               snap_mode=self.snap_mode)
        self.stats = {"calls": len(self.calls), "ok": sum(1 for c in self.calls if c["ok"]),
                      "failed": sum(1 for c in self.calls if not c["ok"]), "ms": timings["total_ms"],
                      "pages": len(infos), "selected": selection["selected"], "lines": len(ext.lines),
                      "excluded_rows": len(ext.extra["excluded_rows"]), "folded_rows": len(ext.extra["folded_rows"])}
        return ext
