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
from system_a.perception.single_pass import (SinglePassPipeline, admit_rows, classify_row, ink_snap_mode,
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


def _printed_ink_box(pdf: bytes, dpi: int) -> tuple[int, int, int, int, int, int]:
    """(r0, r1, c0, c1, page height, page width) around the only ink on the sheet - the value's own extent."""
    import io

    import numpy as np
    from PIL import Image

    from system_a.perception.coords import ink_mask
    with fitz.open(stream=pdf, filetype="pdf") as doc:
        img = Image.open(io.BytesIO(doc[0].get_pixmap(dpi=dpi).tobytes("png"))).convert("RGB")
    mask = ink_mask(img)
    rows = np.flatnonzero(mask.any(axis=1))
    cols = np.flatnonzero(mask.any(axis=0))
    return int(rows.min()), int(rows.max()) + 1, int(cols.min()), int(cols.max()) + 1, mask.shape[0], mask.shape[1]


ONE_PAGE = {"pages": [{"p": 1, "t": "tax_invoice", "c": "original", "n": INV, "m": "1/1", "r": 0, "h": []}]}


def _answer_a_box_above_the_value(top: int) -> dict:
    """The model read the right number and drew its box one line too high, 16 px of blank paper between.

    Round 3's dominant defect (90 boxes on blank paper), and inside the snap's own travel budget, so the two
    arms differ by geometry only - never by what was read.
    """
    return {"fields": {"grand_total": {"raw": "3,317.00", "bbox_2d": [100, top - 36, 400, top - 16]}},
            "line_items": [], "regions": [], "handwritten_refs": []}


def _run_snap_arm(ink_snap):
    """One arm of the A/B: same bytes, same page, same model answer - only the switch differs.

    ``ink_snap`` takes the R4-3c boolean or one of R4-9's knob names (``both``/``move``/``grow``/``off``).
    """
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


# ------------------------------------------------- R4-9: the two knobs of the snap are measured separately
# R4-3c's paired A/B blamed the whole correction for a net -2 pp, but it never separated the two things the
# code does: MOVE a box that sits on blank paper, and GROW a box over the ink run it already touches.  The
# measured damage was all grow ("grown" fired on ~45% of boxes and spilled into the neighbouring column)
# while the measured profit was all move (the 5 empty boxes).  A knob that cannot be switched on its own
# cannot be measured on its own, and an unmeasured knob is what got us here.
def _run_knob_arm(mode: str):
    """The same page and the same model answer, with only the knob setting changed."""
    return _run_snap_arm(mode)

def test_the_move_arm_lands_the_box_on_the_value_without_widening_it():
    """Move only, on the failure R4-3a was written for: a narrow box drawn above the value.

    The box must end up on the printed line and keep exactly the width the model drew - widening is the
    other knob's job, and it is the one R4-3c measured as damaging.
    """
    pdf = _pdf_with_a_printed_value()
    dpi = 100
    r0, r1, c0, c1, h, _w_px = _printed_ink_box(pdf, dpi)
    narrow = [c0 + (c1 - c0) // 4, r0 - 36, c0 + 3 * (c1 - c0) // 4, r0 - 16]   # above the line, too narrow
    answer = {"fields": {"grand_total": {"raw": "3,317.00", "bbox_2d": narrow}},
              "line_items": [], "regions": [], "handwritten_refs": []}
    got = {}
    for mode in ("off", "move", "both"):
        client = FakeClient(classify=ONE_PAGE, extract=answer)
        ext = SinglePassPipeline(client, "fake-vl", dpi=dpi, coord="pixel",
                                ink_snap=mode).extract(pdf, package_id="P", dms_doc_id="D")
        got[mode] = ext.fields["grand_total"].region.bbox
    _ox, oy, ow, _oh = got["off"]
    assert oy + got["off"][3] < r0 / h, "the off arm must still be above the printed line"
    mx, my, mw, mh = got["move"]
    assert my >= r0 / h - 2e-3 and my + mh <= r1 / h + 2e-3, f"move must land the box on the value, got {got}"
    assert abs(mw - ow) < 1e-6 and abs(mx - got["off"][0]) < 1e-6, \
        f"the move arm must not widen the box: drew {ow} at x={got['off'][0]}, delivered {mw} at x={mx}"
    assert got["both"][2] > mw + 1e-6, f"the grow knob must be the one that widens, both arm = {got['both']}"


def test_the_grow_arm_widens_a_box_that_clips_the_value_and_the_move_arm_does_not():
    """The grow knob's own job: a box on the right line but too narrow gets the whole printed run."""
    pdf = _pdf_with_a_printed_value()
    dpi = 100
    r0, r1, c0, c1, h, w_px = _printed_ink_box(pdf, dpi)
    inside = [c0, r0 + 1, c0 + 3 * (c1 - c0) // 4, r1 - 1]   # on the line, missing its last quarter
    # (deliberately not narrower than that: the snap is capped at INK_GROW_RATIO x its own width, so a box
    # far narrower than the value is *allowed* to stop short - this asserts the promise, not more than it)
    answer = {"fields": {"grand_total": {"raw": "3,317.00", "bbox_2d": inside}},
              "line_items": [], "regions": [], "handwritten_refs": []}
    out = {}
    for mode in ("off", "move", "grow", "both"):
        client = FakeClient(classify=ONE_PAGE, extract=answer)
        ext = SinglePassPipeline(client, "fake-vl", dpi=dpi, coord="pixel",
                                ink_snap=mode).extract(pdf, package_id="P", dms_doc_id="D")
        out[mode] = ext.fields["grand_total"].region.bbox
    x, y, ww, hh = out["off"]
    assert out["move"] == out["off"], f"the move arm touched a box already on the line: {out}"
    for mode in ("grow", "both"):
        gx, _gy, gw, _gh = out[mode]
        assert gw > ww, f"{mode} must widen the box over the printed run, got {out}"
        assert gx * w_px <= c0 + 1 and (gx + gw) * w_px >= c1 - 1, \
            f"{mode} must cover the printed ink {c0}-{c1}px, delivered {out[mode]}"
    assert abs(out["grow"][1] - y) < 1e-9 and abs(out["grow"][3] - hh) < 1e-9, \
        f"the grow arm must not move a box that is on the right line, got {out}"


def test_a_box_the_snap_leaves_alone_is_delivered_exactly_as_the_model_drew_it():
    """An unchanged correction must not re-measure the box it decided not to touch.

    ``snap_box_to_ink`` works in whole pixels, and handing a box through it and back re-quantises the
    model's fractional coordinates to the pixel - up to 1 px of drift on a box the correction did not
    change.  That is not cosmetic: the paired A/B of R4-9 counted two verdicts flipping (one fixed, one
    broken) on a corpus where the knob moved nothing at all, and this 1 px truncation was the only thing
    that had touched those boxes.  A measurement arm, and a production path, must differ only where the
    correction actually acts.
    """
    pdf = _pdf_with_a_printed_value()
    dpi = 100
    r0, r1, c0, c1, h, w_px = _printed_ink_box(pdf, dpi)
    # the model's own box, already covering the printed value with a hair to spare, expressed where models
    # express it (norm1000) - which lands it on a fractional pixel, like any real answer does
    drawn = [(c0 - 0.4) / w_px * 1000, (r0 - 0.4) / h * 1000,
             (c1 + 0.4) / w_px * 1000, (r1 + 0.4) / h * 1000]
    answer = {"fields": {"grand_total": {"raw": "3,317.00", "bbox_2d": drawn}},
              "line_items": [], "regions": [], "handwritten_refs": []}
    got = {}
    for mode in ("off", "both"):
        client = FakeClient(classify=ONE_PAGE, extract=answer)
        ext = SinglePassPipeline(client, "fake-vl", dpi=dpi,
                                ink_snap=mode).extract(pdf, package_id="P", dms_doc_id="D")
        got[mode] = ext.fields["grand_total"].region.bbox
    assert got["off"] == got["both"], \
        f"a box nobody corrected drifted by {max(abs(a - b) for a, b in zip(got['off'], got['both']))} " \
        f"of the page: {got}"


def test_the_payload_names_the_knobs_that_produced_it():
    """A run must record which knob setting made it, or the arms cannot be told apart after the fact."""
    for mode, active in (("both", True), ("move", True), ("grow", True), ("off", False)):
        ext, _ = _run_knob_arm(mode)
        assert ext.extra["ink_snap_mode"] == mode, ext.extra
        assert ext.extra["ink_snap"] is active, f"{mode}: ink_snap must stay the boolean it was before R4-9"


def test_the_grow_arm_never_moves_a_box_off_the_line_the_model_chose():
    """Grow only: a box with no ink under it stays where it was drawn - grow has nothing to grow over.

    This is what separates R4-9's two verdicts.  R4-3c measured that the boxes which got worse were all
    widened, and widening is what a grow arm does; if a grow arm also moved boxes, the two faults could
    not be told apart again.
    """
    grew, f = _run_knob_arm("grow")
    drawn, _ = _run_knob_arm("off")
    assert grew.fields["grand_total"].region.bbox == drawn.fields["grand_total"].region.bbox, \
        "the grow arm moved a box: the knobs are not independent"
    assert grew.fields["grand_total"].raw == "3,317.00"


def test_the_environment_names_a_knob_and_an_unusable_name_falls_back_to_the_shipped_default(monkeypatch):
    """What ships is what the measurement supported, not what was written first.

    R4-3a shipped both knobs without measuring either.  R4-9's paired A/B priced them separately on two
    replications: move fixed 3 boxes and broke none (-1.3 pp, and empty boxes 2.4% -> 0%), grow fixed 5 and
    broke 13 (+1.7 pp in both replications, with no gain on the empty-box ruler it was written for).  So the
    default is the knob with evidence behind it, and a typo in the environment cannot silently lose the
    correction - an unusable name resolves to the same default production runs.
    """
    monkeypatch.delenv("PERCEPTION_INK_SNAP", raising=False)
    assert SinglePassPipeline(FakeClient(), "fake-vl").snap_mode == "move"
    assert SinglePassPipeline(FakeClient(), "fake-vl").ink_snap is True
    for raw, mode in (("move", "move"), ("GROW", "grow"), ("0", "off"), ("off", "off"), ("both", "both"),
                      ("nonsense", "move"), ("gro", "move")):
        monkeypatch.setenv("PERCEPTION_INK_SNAP", raw)
        assert SinglePassPipeline(FakeClient(), "fake-vl").snap_mode == mode, raw
    monkeypatch.setenv("PERCEPTION_INK_SNAP", "0")
    assert SinglePassPipeline(FakeClient(), "fake-vl").ink_snap is False
    assert ink_snap_mode(True) == "both" and ink_snap_mode(False) == "off", \
        "the R4-3c spellings stay exact: True means both knobs, not the default"


def test_every_knob_combination_gets_its_own_perception_cache_entry():
    """Three arms, three identities: a move-arm run may not read a both-arm payload from cache."""
    versions = {m: SinglePassPipeline(FakeClient(), "fake-vl", ink_snap=m).code_version
                for m in ("both", "move", "grow", "off")}
    assert len(set(versions.values())) == 4, versions
    assert SinglePassPipeline(FakeClient(), "fake-vl", ink_snap=True).code_version == versions["both"]
    assert SinglePassPipeline(FakeClient(), "fake-vl", ink_snap=False).code_version == versions["off"]


# ------------------------------------------- R4-9: a corrected cell must not escape the box of its own row
# The engine has an invariant that two rounds of audit measured at 0 breaks (R3-9: "the row box contains its
# own cells"), and the snap breaks it by construction: only the cells are corrected, never the row.  These
# two tests are the whole repair - follow the cells the model put in the row, and only those.
def _pdf_with_two_printed_lines() -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((300, 700), "12")
    page.insert_text((380, 700), "1,234.00")
    page.insert_text((300, 780), "99")
    page.insert_text((380, 780), "9,999.00")
    return doc.tobytes()


def _page_mask(pdf: bytes, dpi: int):
    import io

    from PIL import Image

    from system_a.perception.coords import ink_mask
    with fitz.open(stream=pdf, filetype="pdf") as doc:
        img = Image.open(io.BytesIO(doc[0].get_pixmap(dpi=dpi).tobytes("png"))).convert("RGB")
    return ink_mask(img)


def _bands(lines: list[bool]) -> list[tuple[int, int]]:
    """Contiguous runs of True, as (start, end) - the printed rows or words of a page."""
    out, start, prev = [], None, None
    for i, on in enumerate(lines):
        if on and start is None:
            start = prev = i
        elif on:
            prev = i
        elif start is not None:
            out.append((start, prev + 1))
            start = None
    if start is not None:
        out.append((start, prev + 1))
    return out


def _ink_rows(pdf: bytes, dpi: int) -> list[tuple[int, int]]:
    """The printed rows of a page, top to bottom, as the engine's own mask sees them."""
    return _bands([bool(v) for v in _page_mask(pdf, dpi).any(axis=1)])


def _ink_cols(pdf: bytes, dpi: int, r0: int, r1: int) -> list[tuple[int, int]]:
    """The words printed inside one row band, left to right."""
    mask = _page_mask(pdf, dpi)
    return _bands([bool(v) for v in mask[r0:r1].any(axis=0)])


def _row_answer(pdf: bytes, dpi: int, band: tuple[int, int], amount_band=None) -> dict:
    """One table row, drawn a line above where it is printed, in the units the pipeline reads by default.

    Every box is derived from the page's own ink (not from a typed-in coordinate), so the snap's travel
    budget is the only thing separating the arms: the cells start inside the row box and the row box stays
    where the model drew it.
    """
    mask = _page_mask(pdf, dpi)
    h, w = mask.shape[:2]
    sx, sy = 1000 / w, 1000 / h
    words = _ink_cols(pdf, dpi, band[0], band[1])
    qty_c, amt_c = words[0], words[-1]
    top = band[0]
    a_top = amount_band[0] - 20 if amount_band else top - 36
    def norm(x0, y0, x1, y1):
        return [x0 * sx, y0 * sy, x1 * sx, y1 * sy]
    return {"fields": {}, "regions": [], "handwritten_refs": [],
            "line_items": [{"line_no": 1,
                            "description": {"raw": "OXYGEN 47L", "bbox_2d": norm(10, top - 36, 10 + 150, top - 16)},
                            "qty": {"raw": "12", "bbox_2d": norm(qty_c[0] - 4, top - 36, qty_c[1] + 4, top - 16)},
                            "amount": {"raw": "1,234.00", "bbox_2d": norm(amt_c[0] - 4, a_top,
                                                                          amt_c[1] + 4, a_top + 20)},
                            "line_bbox": norm(6, top - 40, w - 6, top - 12)}]}


def _row_and_cells(ink_snap, pdf: bytes, dpi: int, answer: dict):
    client = FakeClient(classify=ONE_PAGE, extract=answer)
    ext = SinglePassPipeline(client, "fake-vl", dpi=dpi,
                            ink_snap=ink_snap).extract(pdf, package_id="P", dms_doc_id="D")
    line = ext.lines[0]
    return line.region.bbox, {k: v.region.bbox for k, v in line.cells.items() if v.region}


def _pdf_with_a_rule_and_a_value() -> bytes:
    """A form row: a thin rule printed across the page, and the value it belongs to printed below it."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.draw_line((50, 683), (545, 683), width=0.8)
    page.insert_text((72, 700), "3,317.00")
    return doc.tobytes()


def test_a_box_between_a_rule_and_its_value_is_delivered_on_the_value_not_the_rule():
    """The same failure through the whole pipeline, on a real rendered page.

    The model read the number correctly and drew its box in the gap between the form's underline and the
    digits.  The nearest ink is the rule, so the correction as shipped lands the box on a printed line that
    carries no text at all - four pixels of drift onto furniture, while the value it was meant to cover sits
    sixteen pixels away.  This is also why ``moved`` looked almost useless on dense forms: on a box that
    overlaps a rule, the rule *is* the "own line", and the box is reported as already correct.
    """
    pdf = _pdf_with_a_rule_and_a_value()
    dpi = 100
    bands = _ink_rows(pdf, dpi)
    assert len(bands) >= 2, f"the fixture needs a rule and printed digits: {bands}"
    rule = bands[0]
    value = max(bands[1:], key=lambda b: b[1] - b[0])       # the digits, not a comma's tail below them
    words = _ink_cols(pdf, dpi, value[0], value[1])
    mask = _page_mask(pdf, dpi)
    h, w = mask.shape[:2]
    drawn = [(words[0][0] - 6) / w * 1000, (value[0] - 36) / h * 1000,
             (words[-1][1] + 6) / w * 1000, (value[0] - 16) / h * 1000]
    assert rule[0] >= value[0] - 16 and rule[1] <= value[0], \
        f"fixture: the rule must lie between the drawn box (ends at {value[0] - 16}) and its value {value}: {rule}"
    client = FakeClient(classify=ONE_PAGE, extract={"fields": {"grand_total": {"raw": "3,317.00",
                                                                            "bbox_2d": drawn}},
                                                   "line_items": [], "regions": [], "handwritten_refs": []})
    ext = SinglePassPipeline(client, "fake-vl", dpi=dpi, ink_snap="move").extract(pdf, package_id="P",
                                                                                 dms_doc_id="D")
    x, y, _w2, hh = ext.fields["grand_total"].region.bbox
    assert y >= value[0] / h - 2e-3 and y + hh <= value[1] / h + 2e-3, \
        (f"the box must be delivered on the printed value {value}, got y {y:.4f}..{y + hh:.4f} "
         f"(the rule it would otherwise land on is at {rule[0] / h:.4f})")


def test_a_box_carrying_no_value_is_left_where_the_model_drew_it():
    """The correction's customer is a box that carries a value; a box holding "-" has none to recover.

    DMS-159's ``vat`` is the only box the whole R4-13 measurement made worse: the model read ``-`` (nothing
    printed there), its box fell on blank paper, and the snap walked it 11 px down onto a real line - a line
    holding somebody else's digits.  Re-cutting that crop does not recover a value; it hands the reader a
    number that was never in the field, a worse failure than the empty box it "fixed".

    The engine already refuses to deliver a field that read "-" (`_raw` nullifies it), so the field half of
    this is a pin against someone changing that.  The cell half is the live hazard: a NOT_PRESENT cell keeps
    its region in the delivered payload, and today it keeps a *corrected* region - a box moved onto print that
    does not belong to it.  The control at the end is the point of the whole feature: a box with a real number
    in it is still corrected, on the same page, from the same model answer.
    """
    pdf = _pdf_with_a_printed_value()
    dpi = 100
    top, bottom, h = _printed_rows(pdf, dpi)
    drawn = [100, top - 36, 400, top - 16]
    answer = {"fields": {"grand_total": {"raw": "-", "bbox_2d": list(drawn)}},
              "line_items": [{"line_no": 1,
                              "item_code": {"raw": "A1", "bbox_2d": list(drawn)},
                              "description": {"raw": "thing"},
                              "qty": {"raw": "-", "bbox_2d": list(drawn)},
                              "uom": {"raw": "ea"},
                              "unit_price": {"raw": "1.00", "bbox_2d": list(drawn)},
                              "amount": {"raw": "1.00", "bbox_2d": list(drawn)}}],
              "regions": [], "handwritten_refs": []}
    client = FakeClient(classify=ONE_PAGE, extract=answer)
    ext = SinglePassPipeline(client, "fake-vl", dpi=dpi, coord="pixel", ink_snap="move").extract(
        pdf, package_id="P", dms_doc_id="D")

    assert "grand_total" not in ext.fields, "a field that read '-' is not a value the engine delivers"
    cell = ext.lines[0].cells["qty"]
    assert cell.raw is None and cell.region is not None, "a NOT_PRESENT cell keeps its region in the payload"
    y, hh = cell.region.bbox[1], cell.region.bbox[3]
    assert abs(y - (top - 36) / h) < 2e-3 and abs(y + hh - (top - 16) / h) < 2e-3, \
        f"a box with no value in it must not be walked onto a line, got {cell.region.bbox} (drawn {drawn})"
    money = ext.lines[0].cells["unit_price"]
    assert money.raw == "1.00" and money.region.bbox[1] >= top / h - 2e-3, \
        f"a cell that carries a number is still corrected, got {money.region.bbox}"


def _contained(cell, row) -> float:
    ix = max(0.0, min(cell[0] + cell[2], row[0] + row[2]) - max(cell[0], row[0]))
    iy = max(0.0, min(cell[1] + cell[3], row[1] + row[3]) - max(cell[1], row[1]))
    return ix * iy / max(1e-9, cell[2] * cell[3])


def test_a_cell_that_was_snapped_onto_its_line_stays_inside_the_box_of_its_row():
    """R3-9 measured 0 breaks of this invariant over 50 documents; R4-9's paired A/B measured 6.

    The snap corrects cells and never the row, so a cell that travels to its printed line leaves the row box
    behind it - and the audit's row/cell check reports the row as broken.  The row has to follow the cells it
    was drawn around, otherwise fixing the cell breaks the row for free.
    """
    pdf = _pdf_with_two_printed_lines()
    dpi = 100
    band = _ink_rows(pdf, dpi)[0]
    row, cells = _row_and_cells("move", pdf, dpi, _row_answer(pdf, dpi, band))
    assert cells, "the row must have delivered its cells"
    for name, box in cells.items():
        assert _contained(box, row) >= 0.95, \
            f"{name} {tuple(round(v, 4) for v in box)} escaped its own row {tuple(round(v, 4) for v in row)}"


def test_the_row_follows_only_the_cells_the_model_placed_in_it():
    """The repair must not turn a far-away cell into a giant row box.

    A cell the model drew somewhere else (another row, another page area) is a model problem, and the honest
    report is the row box as drawn plus an audit flag - not a row box inflated to swallow it.
    """
    pdf = _pdf_with_two_printed_lines()
    dpi = 100
    bands = _ink_rows(pdf, dpi)
    assert len(bands) >= 2, "the fixture needs two printed lines"
    h = _page_mask(pdf, dpi).shape[0]
    answer = _row_answer(pdf, dpi, bands[0], amount_band=bands[1])   # amount belongs to the row below
    drawn_row, drawn_cells = _row_and_cells("off", pdf, dpi, answer)
    moved_row, cells = _row_and_cells("move", pdf, dpi, answer)
    assert cells["amount"] != drawn_cells["amount"], "the fixture needs the stray cell to be corrected somewhere"
    assert moved_row[1] + moved_row[3] < bands[1][0] / h, \
        (f"the row box reached down to the printed line its cells were not drawn on: "
         f"row {tuple(round(v, 4) for v in moved_row)}, next line starts at {bands[1][0] / h:.4f}")
    assert moved_row[1] + moved_row[3] > drawn_row[1] + drawn_row[3], \
        "its own corrected cells must still have been followed (that is the other test's job)"


def test_select_invoice_pages_preserves_multipage_continuation():
    pages = [
        {"page_no": 1, "doc_type": "tax_invoice", "copy_status": "original", "doc_no_hint": "INV-101", "page_marker": None},
        {"page_no": 2, "doc_type": "tax_invoice", "copy_status": "original", "doc_no_hint": "INV-101", "page_marker": None},
    ]
    res = select_invoice_pages(pages)
    assert res["selected"] == [1, 2]

