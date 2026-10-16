"""Single-pass perception (v5.1) end to end WITHOUT an LLM.

The fake client has EXACTLY the signature of adapters/llm/litellm_client.LiteLLMClient.chat_json, so an
argument the real client does not accept fails here too.
Run:  cd src && python -m pytest ../tests/test_single_pass.py -q
"""
from __future__ import annotations

import inspect
from typing import Optional

import fitz

from system_a.adapters.llm.litellm_client import LiteLLMClient
from system_a.application.orchestrator import validate
from system_a.container import Settings, build_services
from system_a.domain.standard import load_standard
from system_a.perception.single_pass import (SinglePassPipeline, admit_rows, classify_row,
                                              select_invoice_pages)
from system_a.sandbox.scenarios import tax_id_of

SUP_TAX = tax_id_of("123456789012")
ENT = load_standard().entities[433]
INV, PO = "SBX126100111", "44601234"
REQ = {"validation_id": "T", "correlation_id": "T", "idempotency_key": None, "document_revision": 1,
       "validation_round": 1}


def _pdf(pages: int = 3, landscape_first: bool = False) -> bytes:
    doc = fitz.open()
    for i in range(pages):
        w, h = (842, 595) if (landscape_first and i == 0) else (595, 842)
        doc.new_page(width=w, height=h).insert_text((72, 72), f"page {i + 1}")
    return doc.tobytes()


def V(raw, box=(100, 100, 200, 120)):
    return {"raw": raw, "bbox_2d": list(box)}


CLASSIFY3 = {"pages": [{"p": 1, "t": "tax_invoice", "c": "original", "n": INV, "m": "1/1", "r": 0, "h": []},
                       {"p": 2, "t": "tax_invoice", "c": "copy", "n": INV, "m": "1/1", "r": 0, "h": []},
                       {"p": 3, "t": "delivery", "c": "original", "n": "DO-1", "m": None, "r": 0,
                        "h": ["50220099380"]}]}
EXTRACT = {
    "fields": {"invoice_num": V(INV, (820, 88, 880, 98)), "invoice_date": V("03.10.2026"),
               "po_number": V(PO, (560, 335, 610, 345)), "supplier_name": V("SYNTHETIC GAS CO., LTD."),
               "supplier_tax_id": V(SUP_TAX), "customer_name": V(ENT["name_en"]),
               "customer_tax_id": V(ENT["tax_id"]), "customer_address": V(ENT["addr_en"]),
               "sub_total": V("3,100.00", (930, 640, 995, 650)), "vat": V("217.00", (930, 660, 995, 670)),
               "grand_total": V("3,317.00", (930, 680, 995, 690)), "currency": V(None)},
    "occurrences": {"invoice_num": [{"raw": INV, "label_text": "INVOICE NO", "bbox_2d": [820, 88, 880, 98]},
                                    {"raw": "126100111", "label_text": "", "bbox_2d": [150, 335, 200, 345]}],
                    "po_number": [{"raw": PO, "label_text": "PO No.", "bbox_2d": [560, 335, 610, 345]}]},
    "line_items": [
        {"line_no": 1, "description": V("DESCRIPTION"), "uom": V("UNIT"), "qty": V("QUANTITY"),
         "amount": V("AMOUNT"), "line_bbox": [65, 400, 1000, 420]},                              # header
        {"line_no": 2, "item_code": V("T1091-000"), "description": V("Oxygen IND Pack (47L x 15)"),
         "qty": V("1"), "uom": V("PAC"), "unit_price": V("3,100.00"), "amount": V("3,100.00"),
         "line_bbox": [65, 425, 1000, 440]},
        {"line_no": 3, "description": V("REF PO 44601234"), "line_bbox": [65, 442, 1000, 452]},   # continuation
        {"line_no": 4, "line_bbox": [65, 455, 1000, 470]},                                        # empty
        {"line_no": 5, "description": V("ค่าขนส่ง / DELIVERY CHARGE"), "line_bbox": [600, 620, 1000, 632]}],
    "regions": [{"type": "table", "label": "items_table", "bbox_2d": [65, 395, 1000, 610]},
                {"type": "signature", "label": "receiver_signature", "present": "signed", "bbox_2d": [120, 860, 330, 900]},
                {"type": "signature", "label": "deliverer_signature", "present": "signed", "bbox_2d": [430, 860, 640, 900]}],
    "handwritten_refs": []}


class FakeClient:
    """Same chat_json signature as LiteLLMClient (no **kwargs)."""

    def __init__(self, classify=CLASSIFY3, fail_classify=False, extract=None):
        self.classify, self.fail_classify = classify, fail_classify
        self.extract = EXTRACT if extract is None else extract
        self.asked, self.sizes = [], []
        self.last_usage, self.last_salvaged = {}, False

    def chat_json(self, model: str, system: str, user: str, *, temperature: float = 0.0,
                  enable_thinking: Optional[bool] = None, images: list[str] | None = None,
                  max_tokens: Optional[int] = None, json_mode: bool = True, layout: str = "system") -> dict:
        kind = "classify" if "classify every page" in user else "extract"
        self.asked.append((kind, len(images or []), enable_thinking))
        if kind == "classify" and self.fail_classify:
            raise RuntimeError("AIResponseError: simulated")
        if kind == "extract":
            import base64, io
            from PIL import Image
            self.sizes.append(Image.open(io.BytesIO(base64.b64decode(images[0].split(",", 1)[1]))).size)
        return self.classify if kind == "classify" else self.extract


def _oracle():
    row = {"ORG_ID": 433, "RECEIPT_NUM": "RCV-0000070001", "RECEIVER": "SMITH J.", "LINE": 1,
           "ITEM": "OXYGEN IND PACK", "QTY": "1", "UOM": "Pack", "UNIT_PRICE": "3100.00", "LINE_AMOUNT": "3100.00",
           "PO_NUM": PO}
    return {"receipts": [{"po_number": PO, "invoice_num": INV, "supplier_tax_id": SUP_TAX, "rows": [row]}],
            "po_supplier": {PO: SUP_TAX}}


def test_fake_matches_real_signature():
    assert inspect.signature(FakeClient.chat_json) == inspect.signature(LiteLLMClient.chat_json)


def test_rows_are_classified_not_deleted():
    kinds = [classify_row(r) for r in EXTRACT["line_items"]]
    assert kinds == ["header", "item", "continuation", "empty", "total_line"]
    items, folded, excluded = admit_rows([(1, [dict(r) for r in EXTRACT["line_items"]])])
    assert [i["line_no"] for i in items] == [1] and len(folded) == 1 and len(excluded) == 3


def test_selection_keeps_continuation_copy_and_flags_gaps():
    sel = select_invoice_pages([
        {"page_no": 1, "doc_type": "tax_invoice", "copy_status": "original", "doc_no_hint": "A-1", "page_marker": "1/2"},
        {"page_no": 2, "doc_type": "tax_invoice", "copy_status": "copy", "doc_no_hint": "A 1", "page_marker": "2/2"},
        {"page_no": 3, "doc_type": "tax_invoice", "copy_status": "copy", "doc_no_hint": "A-1", "page_marker": "1/2"}])
    assert sel["selected"] == [1, 2] and sel["pages_complete"] and not sel["multi_invoice"]
    gap = select_invoice_pages([{"page_no": 1, "doc_type": "tax_invoice", "copy_status": "original",
                                 "doc_no_hint": "A-1", "page_marker": "1/2"}])
    assert gap["pages_complete"] is False and gap["marker_gaps"] == [2]
    none = select_invoice_pages([{"page_no": 1, "doc_type": "delivery", "copy_status": "original",
                                  "doc_no_hint": None, "page_marker": None}])
    assert none["selected"] == [] and none["pages_complete"] is False


def test_end_to_end_auto_pass():
    client = FakeClient()
    ext = SinglePassPipeline(client, "fake-vl").extract(_pdf(), package_id="PKG-T", dms_doc_id="DMS-T")
    assert [a[:2] for a in client.asked] == [("classify", 3), ("extract", 1)]   # copy + delivery not read
    assert all(a[2] is False for a in client.asked)                                # thinking off by default
    assert ext.extra["selection"]["selected"] == [1] and ext.pages_complete
    assert len(ext.lines) == 1 and "REF PO" in ext.lines[0].cells["description"].raw
    labels = [r.label for r in ext.regions]
    assert sum(l.startswith("excluded_row:") for l in labels) == 3 and "folded_row" in labels
    assert any(i["text"] == "50220099380" for i in ext.extra["items_by_page"]["3"])  # handwriting, unread page
    svc = build_services(Settings(mode="sandbox"), oracle_dataset=_oracle())
    res = validate(ext, svc, std=load_standard(), request=REQ)
    assert res["recommendation"]["value"] == "AUTO_PASS", res["recommendation"]


def test_single_page_is_classified_and_rotated():
    one = {"pages": [{"p": 1, "t": "tax_invoice", "c": "original", "n": INV, "m": None, "h": [], "r": 90}]}
    client = FakeClient(classify=one)
    ext = SinglePassPipeline(client, "fake-vl").extract(_pdf(1, landscape_first=True), package_id="P", dms_doc_id="D")
    assert [a[:2] for a in client.asked] == [("classify", 1), ("extract", 1)]
    w, h = client.sizes[0]
    assert h > w                                            # scan was turned upright before extract
    assert ext.pages[0].rotation == 90
    assert ext.pages[0].width_pt == 842 and ext.pages[0].height_pt == 595
    assert ext.extra["orientation"]["1"]["total"] == 90.0


def test_classify_failure_reads_nothing_and_never_passes():
    client = FakeClient(fail_classify=True)
    ext = SinglePassPipeline(client, "fake-vl").extract(_pdf(), package_id="P", dms_doc_id="D")
    assert [a[0] for a in client.asked] == ["classify"]   # no page read on a guess
    assert ext.pages_complete is False and ext.extra["selection"]["classify_failed"]
    res = validate(ext, build_services(Settings(mode="sandbox"), oracle_dataset=_oracle()),
                   std=load_standard(), request=REQ)
    assert res["recommendation"]["value"] != "AUTO_PASS"


def test_orientation_and_rbox_integration():
    one = {"pages": [{"p": 1, "t": "tax_invoice", "c": "original", "n": INV, "m": "1/1", "h": [], "r": 90}]}
    client = FakeClient(classify=one)
    ext = SinglePassPipeline(client, "fake-vl").extract(_pdf(1), package_id="P", dms_doc_id="D")
    
    # 1. Orientation metadata
    ori_meta = ext.extra["orientation"]["1"]
    assert ori_meta["r"] == 90
    assert ori_meta["total"] == 90.0
    assert ori_meta["runtime"] == "vlm_classify"
    assert ori_meta["uncertain"] is False

    # 2. Field regions have valid bbox and rbox
    inv_field = ext.fields["invoice_num"]
    assert inv_field.region is not None
    assert inv_field.region.bbox is not None
    assert len(inv_field.region.bbox) == 4
    assert inv_field.region.rbox is not None
    assert len(inv_field.region.rbox) == 5
    assert inv_field.region.rbox[4] == 0.0  # pure 90 deg rotation -> rbox angle == 0

    # 3. Line item regions
    assert len(ext.lines) >= 1
    assert ext.lines[0].region.rbox is not None

    # 4. Region nodes have rbox
    assert len(ext.regions) > 0
    assert all(r.rbox is not None for r in ext.regions if r.bbox)


def test_select_invoice_pages_drops_named_copy_with_same_doc_no():
    pages = [
        {"page_no": 1, "doc_type": "tax_invoice", "copy_status": "original", "doc_no_hint": "INV-101", "page_marker": None},
        {"page_no": 2, "doc_type": "tax_invoice", "copy_status": "copy", "doc_no_hint": "INV-101", "page_marker": None},
    ]
    res = select_invoice_pages(pages)
    assert res["selected"] == [1]
    assert len(res["dropped"]) == 1
    assert res["dropped"][0]["reason"] == "copy_sheet_of_existing_original"


# ------------------------------------------------------------------ R4-3c: the ink snap must be switchable
def _pdf_with_a_printed_value() -> bytes:
    """One page carrying a single printed value low on the sheet - a box above it is on blank paper."""
    doc = fitz.open()
    doc.new_page(width=595, height=842).insert_text((72, 700), "3,317.00")
    return doc.tobytes()


def _printed_rows(pdf: bytes, dpi: int, x0: int = 100, x1: int = 400) -> tuple[int, int, int]:
    """(first ink row, row after the last ink row, page height in px) of that value, per the engine's own mask."""
    import io

    import numpy as np
    from PIL import Image

    from system_a.perception.coords import ink_mask
    with fitz.open(stream=pdf, filetype="pdf") as doc:
        img = Image.open(io.BytesIO(doc[0].get_pixmap(dpi=dpi).tobytes("png"))).convert("RGB")
    mask = ink_mask(img)
    rows = np.flatnonzero(mask[:, x0:x1].any(axis=1))
    return int(rows.min()), int(rows.max()) + 1, mask.shape[0]


ONE_PAGE = {"pages": [{"p": 1, "t": "tax_invoice", "c": "original", "n": INV, "m": "1/1", "r": 0, "h": []}]}


def _answer_a_box_above_the_value(top: int) -> dict:
    """The model read the right number and drew its box one line too high, 16 px of blank paper between.

    Round 3's dominant defect (90 boxes on blank paper), and inside the snap's own travel budget, so the two
    arms differ by geometry only - never by what was read.
    """
    return {"fields": {"grand_total": {"raw": "3,317.00", "bbox_2d": [100, top - 36, 400, top - 16]}},
            "line_items": [], "regions": [], "handwritten_refs": []}


def _run_snap_arm(ink_snap: bool):
    """One arm of the A/B: same bytes, same page, same model answer - only the switch differs."""
    pdf = _pdf_with_a_printed_value()
    dpi = 100
    top, bottom, h = _printed_rows(pdf, dpi)
    client = FakeClient(classify=ONE_PAGE, extract=_answer_a_box_above_the_value(top))
    ext = SinglePassPipeline(client, "fake-vl", dpi=dpi, coord="pixel",
                             ink_snap=ink_snap).extract(pdf, package_id="P", dms_doc_id="D")
    return ext, {"top": top, "bottom": bottom, "h": h, "drawn": (top - 36, top - 16)}


def test_the_snap_off_arm_delivers_the_box_the_model_drew():
    """The A/B of R4-3c needs a run where nothing is corrected: the box the model drew, as drawn.

    Without an off switch the only comparison available was engine-vs-harness (different pipeline, different
    round), which the record already refuses to call an A/B.
    """
    ext, f = _run_snap_arm(ink_snap=False)
    _x, y, _w, hh = ext.fields["grand_total"].region.bbox
    drawn_y1, drawn_y2 = f["drawn"]
    assert abs(y - drawn_y1 / f["h"]) < 2e-3 and abs(y + hh - drawn_y2 / f["h"]) < 2e-3, \
        f"the box the model drew must survive untouched, got {ext.fields['grand_total'].region.bbox}"
    assert y + hh < f["top"] / f["h"], "the off arm must not be corrected onto the value"
    assert ext.fields["grand_total"].raw == "3,317.00"
    assert ext.extra["ink_snap"] is False


def test_the_snap_on_arm_moves_that_same_box_onto_the_printed_value():
    """The other arm, on the same bytes and the same answer: the box ends up on the printed line."""
    ext, f = _run_snap_arm(ink_snap=True)
    _x, y, _w, hh = ext.fields["grand_total"].region.bbox
    assert y >= f["top"] / f["h"] - 2e-3 and y + hh <= f["bottom"] / f["h"] + 2e-3, \
        f"expected the box inside {f['top']}-{f['bottom']}, got {ext.fields['grand_total'].region.bbox}"
    assert ext.extra["ink_snap"] is True, "the payload must say which arm produced it, or the two runs are deniable"


def test_the_snap_is_on_by_default_and_the_environment_switches_it_off(monkeypatch):
    """Production keeps the correction; a measurement run switches it off without touching code."""
    assert SinglePassPipeline(FakeClient(), "fake-vl").ink_snap is True
    monkeypatch.setenv("PERCEPTION_INK_SNAP", "0")
    assert SinglePassPipeline(FakeClient(), "fake-vl").ink_snap is False
    monkeypatch.setenv("PERCEPTION_INK_SNAP", "1")
    assert SinglePassPipeline(FakeClient(), "fake-vl").ink_snap is True


def test_the_two_snap_arms_may_not_share_a_perception_cache_entry():
    """A cached on-arm payload served to an off-arm run would fake the entire A/B.

    ``process_pdf.py`` keys the perception cache on model + prompt + options + ``pipeline=code_version``; the
    snap changes the boxes stored in that payload and appears in none of them, so the arm has to be part of
    the pipeline identity or one arm silently reads the other's answer.
    """
    on = SinglePassPipeline(FakeClient(), "fake-vl", ink_snap=True).code_version
    off = SinglePassPipeline(FakeClient(), "fake-vl", ink_snap=False).code_version
    assert on != off, "both arms claim the same pipeline identity - a cache hit would cross the arms"


def test_select_invoice_pages_preserves_multipage_continuation():
    pages = [
        {"page_no": 1, "doc_type": "tax_invoice", "copy_status": "original", "doc_no_hint": "INV-101", "page_marker": None},
        {"page_no": 2, "doc_type": "tax_invoice", "copy_status": "original", "doc_no_hint": "INV-101", "page_marker": None},
    ]
    res = select_invoice_pages(pages)
    assert res["selected"] == [1, 2]

