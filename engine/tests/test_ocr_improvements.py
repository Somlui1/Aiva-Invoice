"""OCR / bbox improvements (perception) and the normalised item list (result contract).

Each test names the measured case it protects (DMS-xx = results/paperless_invoices).
"""
import io
import json
import sys
from decimal import Decimal
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from system_a.domain.contracts import RawField, RawLine, Region  # noqa: E402
from system_a.domain.normalize import Invalid, date_iso  # noqa: E402
from system_a.perception.text_layer import layer_unreliable  # noqa: E402
from system_a.perception import vision_pipeline as vp  # noqa: E402


# ----------------------------------------------------------------------------------------------- bbox_testv3 alignment
def test_layer_unreliable():
    assert layer_unreliable("ษั ท อ ไป โก ไฮ เท ค ท ู ล ล ิ ่ ง vida")
    assert not layer_unreliable("TEL: (AUTO) (038) 545 999")
    assert not layer_unreliable(None)


@pytest.mark.parametrize("mx,w,h,mode", [(0.9, 1240, 1754, "norm1"), (998, 1240, 1754, "norm1000"),
                                         (1240, 1240, 1754, "pixel"), (900, 1000, 1000, "pixel")])
def test_coordinate_rule_is_bbox_testv3(mx, w, h, mode):
    from system_a.perception.coords import choose_coord_mode
    words = [{"bbox": (0.1, 0.1, 0.05, 0.01)}] * 5          # the text layer must not influence the decision
    assert choose_coord_mode([[1, 1, mx, mx / 2]], w, h, words) == mode


def test_v3_message_layout():
    """One user message, image first, prompt after it, no system message, no response_format (bbox_testv3)."""
    from system_a.adapters.llm.litellm_client import LiteLLMClient
    c = LiteLLMClient("http://x", "k")
    sent = {}
    c._post = lambda body: (sent.update(body), '{"items": []}')[1]
    c.chat_json("m", "SYSTEM PROMPT", "do it", images=["data:image/png;base64,AA"], json_mode=False, layout="v3")
    msgs = sent["messages"]
    assert len(msgs) == 1 and msgs[0]["role"] == "user" and "response_format" not in sent
    assert msgs[0]["content"][0]["type"] == "image_url" and msgs[0]["content"][1]["text"].startswith("SYSTEM PROMPT")


def test_paperless_downloads_the_original_first():
    import httpx
    from system_a.adapters.paperless.reader import PaperlessReader
    seen = []

    def h(req):
        seen.append(str(req.url))
        return httpx.Response(200, content=b"%PDF-1.4 original")
    r = PaperlessReader("http://dms", "t", transport=httpx.MockTransport(h))
    assert r.download(15) == b"%PDF-1.4 original" and "original=true" in seen[0]


def test_paperless_falls_back_to_archive_when_original_is_an_image():
    import httpx
    from system_a.adapters.paperless.reader import PaperlessReader

    def h(req):
        return httpx.Response(200, content=b"\xff\xd8jpeg" if "original" in str(req.url) else b"%PDF archive")
    assert PaperlessReader("http://dms", "t", transport=httpx.MockTransport(h)).download(1) == b"%PDF archive"


def test_cells_use_the_page_read_row_box():
    read = vp.PageRead(page_no=1, items=[{"label": "line_1", "bbox": (0.05, 0.33, 0.9, 0.02)},
                                         {"label": "line_2", "bbox": (0.05, 0.36, 0.9, 0.02)}])
    assert vp.row_box_from_page(read, (0.04, 0.332, 0.91, 0.018)) == (0.05, 0.33, 0.9, 0.02)
    assert vp.row_box_from_page(read, (0.04, 0.50, 0.91, 0.018)) is None


# ----------------------------------------------------------------------------------------------- values
@pytest.mark.parametrize("raw,iso", [("08/07/2026", "2026-07-08"), ("04/09/26", "2026-09-04"),
                                     ("2026/09/02", "2026-09-02"), ("02/09/2569", "2026-09-02"),
                                     ("01/09/69", "2026-09-01")])
def test_date_formats(raw, iso):
    """DMS-21 (dd/mm/yy) and DMS-24 (yyyy/mm/dd) were DATE_FORMAT errors."""
    assert date_iso(raw) == iso


def test_bad_date_is_still_rejected():
    with pytest.raises(Invalid):
        date_iso("31/13/2026")


def test_date_pattern_takes_the_whole_year():
    """DMS-24: "9290186640/ 2026/09/02" was cut to 26/09/02 (-> 2002-09-26)."""
    assert vp.extract_value("invoice_date", "9290186640/ 2026/09/02")[0] == "2026/09/02"


def test_shapes():
    assert vp.shape_ok("customer_tax_id", "0-1455-48001-55-7") and not vp.shape_ok("customer_tax_id", "13160")
    assert vp.shape_ok("po_number", "40117545-975") and not vp.shape_ok("po_number", "A002")
    assert vp.shaped_value("sub_total", "ร ว ม 49,215.00 ‘4") == "49,215.00"


def test_strip_label():
    assert vp.strip_label("customer_name", "ชื่อผู้ซื้อ SOLD TO บริษัท อาปิโก จำกัด") == "บริษัท อาปิโก จำกัด"
    both = "POLAR STAR ENGINEERING (THAILAND) CO.,LTD. (Head Office) บริษัท โพลาร์ สตาร์ จำกัด"
    assert vp.strip_label("supplier_name", both) == both          # bilingual name, not a label
    assert vp.strip_label("customer_address", "ที่อยู่ บริษัท x") == "ที่อยู่ บริษัท x"


def test_grand_total_prefers_the_largest_amount_on_the_page():
    opts = [(1, {"text": "TOTAL / BAHT 49,215.00", "confidence": 0.9}),
            (1, {"text": "GRAND TOTAL 52,660.05", "confidence": 0.9})]
    assert vp.pick_candidate("grand_total", opts, 1)[1]["text"].endswith("52,660.05")


def test_shape_valid_candidate_wins():
    opts = [(1, {"text": "13160", "confidence": 0.99}), (1, {"text": "Tax ID 0145548001557", "confidence": 0.8})]
    assert vp.pick_candidate("customer_tax_id", opts, 1)[1]["text"].endswith("0145548001557")


def _rf(raw, agree=True, conf=0.96, page=1, bbox=(0.5, 0.5, 0.1, 0.01)):
    return RawField(raw=raw, confidence=conf, agreement=agree, region=Region(page=page, bbox=bbox))


def test_reconcile_grand_total():
    """DMS-20: grand_total = 49,215.00 (the sub-total) -> E03; 52,660.05 is printed on the invoice."""
    fields = {"sub_total": _rf("49,215.00"), "vat": _rf("3,445.05"), "grand_total": _rf("49,215.00")}
    cands = {"grand_total": [(1, {"text": "TOTAL / BAHT 49,215.00", "bbox": (0.6, 0.69, 0.3, 0.01)}),
                             (2, {"text": "GRAND TOTAL 52,660.05", "bbox": (0.9, 0.74, 0.07, 0.015)})]}
    log = []
    vp.reconcile_grand_total(fields, cands, log)
    assert fields["grand_total"].raw == "52,660.05" and fields["grand_total"].region.page == 2 and log


def test_po_from_lines():
    """DMS-15: po_number = customer code A002; the item rows print 40117545-975."""
    read = vp.PageRead(page_no=1, items=[{"label": "line_1", "text": "40117545-975 NM-A002-ED029-0001 BRACKET 50 PCS 4.42 221.00",
                                          "bbox": (0.01, 0.345, 0.9, 0.02)}])
    fields = {"po_number": _rf("A002")}
    log = []
    layers = {1: {"words": [{"text": "40117545-975", "bbox": (0.03, 0.346, 0.08, 0.01)}]}}
    vp.po_from_lines(fields, {1: read}, [1], log, layers)
    assert fields["po_number"].raw == "40117545-975" and fields["po_number"].agreement and fields["po_number"].source == "derived"


def test_po_from_lines_does_not_guess_between_two_pos():
    read = vp.PageRead(page_no=1, items=[{"label": "line_1", "text": "40117545-1 X", "bbox": (0, 0, 1, 0.01)},
                                         {"label": "line_2", "text": "40117546-2 Y", "bbox": (0, 0.1, 1, 0.01)}])
    fields = {"po_number": _rf("A002")}
    vp.po_from_lines(fields, {1: read}, [1], [])
    assert fields["po_number"].raw == "A002"


def test_corroborate_rows_units_and_totals():
    """DMS-15/19/21/24: cells marked CONFLICT only because the layer read "50 PCS" as "OPCS"."""
    cells = {"qty": _rf("50", agree=False, conf=0.7), "uom": _rf("PCS", agree=False, conf=0.7),
             "unit_price": _rf("4.42"), "amount": _rf("221.00")}
    lines = [RawLine(line_no=1, cells=cells)]
    fields = {"sub_total": _rf("221.00", agree=False, conf=0.7), "vat": _rf("15.47"), "grand_total": _rf("236.47")}
    out = vp.corroborate(fields, lines, {"PCS"})
    assert lines[0].cells["qty"].agreement and lines[0].cells["uom"].agreement and fields["sub_total"].agreement
    assert len(out) == 2


def test_corroborate_never_hides_an_arithmetic_error():
    cells = {"qty": _rf("10", agree=False, conf=0.7), "unit_price": _rf("100.00"), "amount": _rf("1,200.00")}
    lines = [RawLine(line_no=1, cells=cells)]
    vp.corroborate({}, lines, set())
    assert lines[0].cells["qty"].agreement is False


@pytest.mark.parametrize("text,exp", [
    ("1 LOCATING KEY : B-LK 20-60 #94A01,94A04 1 PCS 62.00 62.00", ("1", "PCS", "62.00", "62.00")),
    ("1 FL G05 95 x 220 x 250 2 PCS 83.08 6,950.00 13,900.00", ("2", "PCS", "6,950.00", "13,900.00")),
    ("จำนวน 30 PC 596.40 THB 17,892.00", ("30", "PC", "596.40", "17,892.00")),
])
def test_cells_from_row_text(text, exp):
    c = vp.cells_from_row_text(text)
    assert (c["qty"], c["uom"], c["unit_price"], c["amount"]) == exp


def test_wrapped_description_joins_the_item_above():
    """DMS-22: "( Project:AHD_AS ..., Task:07.2 - DFG0011022A )" became an item with 4 NOT_PRESENT cells."""
    read = vp.PageRead(page_no=5, items=[
        {"label": "line_1", "text": "10 SPOOL RETAINER : B-CSRE 16-70-S20 4 PCS 344.00 1,376.00", "bbox": (0.05, 0.53, 0.87, 0.013)},
        {"label": "line_2", "text": "( Project:AHD_AS (P703 BUNDLE 1.6), Task:07.2 - DFG0011022A )", "bbox": (0.1, 0.556, 0.35, 0.031)}])
    rows = vp.rows_from_line_items(read)
    assert len(rows) == 1 and "Project" in rows[0]["cells"]["description"]["text"] and rows[0]["cells"]["amount"]["text"] == "1,376.00"


def _row(q, p, a):
    return ({"qty": _rf(q), "unit_price": _rf(p), "amount": _rf(a)}, None)


def test_printed_copy_is_dropped_even_with_noise():
    """DMS-24 (date in the number region, "596.40 THB") and DMS-22 (number read as 1690s0082, a delivery-order copy)."""
    rows1 = [_row("30", "596.40", "17,892.00"), _row("2", "62.00", "124.00")]
    rows2 = [_row("30", "596.40 THB", "17,892.00"), ({"description": _rf("( Project x )")}, None),
             _row("2", "62.00", "124.00")]
    read1 = vp.PageRead(page_no=1, items=[{"label": "doc_no", "text": "9290186640/ 2026/09/02"}])
    read2 = vp.PageRead(page_no=2, items=[{"label": "doc_no", "text": "9290186640"}])
    kept, notes = vp.drop_duplicate_copies({1: rows1, 2: rows2}, {1: "TAX_INVOICE", 2: "DELIVERY_NOTE"},
                                           {1: vp.page_identity(read1), 2: vp.page_identity(read2)})
    assert len(kept) == 2 and notes[0]["same_as_page"] == 1


def test_different_invoices_are_never_merged():
    rows = [_row("1", "1.00", "1.00"), _row("2", "1.00", "2.00")]
    r1 = vp.PageRead(page_no=1, items=[{"label": "doc_no", "text": "IV-0001"}])
    r2 = vp.PageRead(page_no=2, items=[{"label": "doc_no", "text": "IV-0777"}])
    kept, _ = vp.drop_duplicate_copies({1: rows, 2: list(rows)}, {1: "INVOICE", 2: "INVOICE"},
                                       {1: vp.page_identity(r1), 2: vp.page_identity(r2)})
    assert len(kept) == 4


# ----------------------------------------------------------------------------------------------- full pipeline
class FakeVlm:
    """A model that answers page reads and table reads in a 0-1000 grid."""

    def __init__(self):
        self.last_usage, self.last_salvaged = {}, False

    def chat_json(self, model, system, user, *, images=None, **kw):
        if "Classify" in user:
            return {"page_type": "tax_invoice", "is_copy": False}
        if "Digitise" in user:
            return {"rows": [{"line_no": 1, "bbox_2d": [40, 330, 950, 350], "cells": {
                "description": {"text": "BRACKET ASSY", "bbox_2d": [80, 330, 300, 350]},
                "qty": {"text": "10", "bbox_2d": [520, 330, 560, 350]},
                "uom": {"text": "PCS", "bbox_2d": [570, 330, 620, 350]},
                "unit_price": {"text": "100.00", "bbox_2d": [650, 330, 740, 350]},
                "amount": {"text": "1,000.00", "bbox_2d": [800, 330, 900, 350]}}}]}
        if "crop" in user:
            return {"raw": None}
        return {"doc_type": "tax_invoice", "items": [
            {"type": "header", "label": "doc_no", "text": "IV690900285", "bbox_2d": [600, 100, 760, 115], "confidence": 0.95},
            {"type": "header", "label": "doc_date", "text": "04/09/69", "bbox_2d": [600, 120, 700, 135], "confidence": 0.95},
            {"type": "header", "label": "po_number", "text": "PO 50000001", "bbox_2d": [600, 140, 760, 155], "confidence": 0.95},
            {"type": "total", "label": "sub_total", "text": "1,000.00", "bbox_2d": [800, 700, 900, 715], "confidence": 0.95},
            {"type": "total", "label": "vat", "text": "70.00", "bbox_2d": [800, 720, 900, 735], "confidence": 0.95},
            {"type": "total", "label": "grand_total", "text": "1,070.00", "bbox_2d": [800, 740, 900, 755], "confidence": 0.95},
            {"type": "line", "label": "line_1", "text": "1 BRACKET ASSY 10 PCS 100.00 1,000.00", "bbox_2d": [40, 330, 950, 350]}]}


def _pdf():
    import fitz
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    put = lambda x, y, t: page.insert_text((x * 595, y * 842), t, fontsize=9)
    put(0.640, 0.112, "IV690900285"); put(0.655, 0.134, "04/09/69"); put(0.655, 0.156, "PO 50000001")
    put(0.10, 0.355, "1 BRACKET ASSY"); put(0.55, 0.355, "10 PCS"); put(0.68, 0.355, "100.00"); put(0.83, 0.355, "1,000.00")
    put(0.83, 0.712, "1,000.00"); put(0.84, 0.732, "70.00"); put(0.83, 0.752, "1,070.00")
    out = doc.tobytes()
    doc.close()
    return out


@pytest.fixture(scope="module")
def ext():
    pipe = vp.VisionPipeline(FakeVlm(), "fake", do_crops=False)
    return pipe.extract(_pdf(), package_id="PKG-T", dms_doc_id="T-1")


def test_pipeline_keeps_qwens_boxes(ext):
    """Boxes are Qwen's own (0-1000 -> normalised), never moved onto the text layer."""
    b = ext.fields["invoice_num"].region.bbox
    assert b == (0.6, 0.1, 0.16, 0.015)
    assert "bbox_refinement" not in ext.extra


def test_pipeline_cells_carry_the_row_box(ext):
    row = ext.lines[0].region.bbox
    assert row == (0.04, 0.33, 0.91, 0.02) and ext.lines[0].cells["amount"].region.bbox == row


def test_pipeline_page_type_is_published(ext):
    """All pages of DMS-15..25 were published as UNKNOWN: the classification never reached PageInfo."""
    assert ext.pages[0].page_type == "TAX_INVOICE"


def test_pipeline_cells_line_up_and_validate(ext):
    from system_a.domain.normalize import normalize
    from system_a.domain.standard import load_standard
    doc, _ = normalize(ext, load_standard())
    l1 = doc.lines[0]
    assert l1.v("qty") == Decimal("10") and l1.v("amount") == Decimal("1000.00") and l1.ok("uom")
    assert doc.v("invoice_date") == "2026-09-04" and doc.v("grand_total") == Decimal("1070.00")


def test_result_has_the_normalised_item_list(ext):
    """Requirement: normalized data carries the checked invoice item list."""
    from system_a.application.orchestrator import validate
    from system_a.container import Settings, build_services
    res = validate(ext, build_services(Settings(mode="sandbox", ai_mode="sim"), oracle_dataset={}),
                   request={"validation_id": "T", "correlation_id": "T", "idempotency_key": None,
                            "document_revision": 1, "validation_round": 1})
    items = res["normalized_fields"]["items"]
    assert len(items) == 1
    it = items[0]
    assert (it["qty"], it["uom"], it["unit_price"], it["amount"]) == ("10", "PCS", "100.00", "1000.00")
    assert it["line_math"] == {"qty_x_unit_price": "1000.00", "amount": "1000.00", "diff": "0.00", "ok": True}
    assert it["bbox"] and it["page_no"] == 1 and it["cells_ok"]["amount"] is True
    summ = res["normalized_fields"]["items_summary"]
    assert summ["line_count"] == 1 and summ["sum_amount"] == "1000.00" and summ["sum_vs_sub_total_diff"] == "0.00"
    json.dumps(res)                                                     # serialisable


def test_standard_uom_groups_include_trip_and_book():
    from system_a.domain.standard import load_standard
    std = load_standard()
    assert std.uom_group("TRIP") == "TRIP"
    assert std.uom_group("เที่ยว") == "TRIP"
    assert std.uom_group("TP") == "TRIP"
    assert std.uom_group("BOOK") == "BOOK"
    assert std.uom_group("เล่ม") == "BOOK"


def test_cells_from_row_text_dual_quantities():
    t1 = "MB3B-41111K34/35-A WSS-M1A367-A45 FILL FLR TNL REINF RH/LH 2.00x940.00xC 667877 1 3,006 49.940 KG 150,119.64"
    c1 = vp.cells_from_row_text(t1)
    assert c1 is not None
    assert c1["qty"].replace(",", "") == "3006"
    assert c1["uom"] == "KG"
    assert c1["unit_price"] == "49.940"
    assert c1["amount"] == "150,119.64"

    t2 = "MB3B-41111K34/35-A WSS-M1A367-A45 FILL FLR TNL REINF RH/LH 2.00x940.00xC 667877 1 2,906 49.940 KG 145,125.64"
    c2 = vp.cells_from_row_text(t2)
    assert c2 is not None
    assert c2["qty"].replace(",", "") == "2906"
    assert c2["uom"] == "KG"
    assert c2["unit_price"] == "49.940"
    assert c2["amount"] == "145,125.64"


def test_rows_from_line_items_does_not_merge_rows_with_money():
    read = vp.PageRead(page_no=1, items=[
        {"label": "line_1", "text": "PART A 1 PCS 100.00 100.00", "bbox": (0.01, 0.25, 0.9, 0.05)},
        {"label": "line_2", "text": "PART B 1 PCS 100.00 100.00", "bbox": (0.01, 0.35, 0.9, 0.05)},
    ])
    rows = vp.rows_from_line_items(read)
    assert len(rows) == 2


def test_rows_from_line_items_preserves_unparsed_row_with_money():
    # line_2 has money 200.00 but unusual format that doesn't parse into tail cells
    read = vp.PageRead(page_no=1, items=[
        {"label": "line_1", "text": "PART A 1 PCS 100.00 100.00", "bbox": (0.01, 0.25, 0.9, 0.05)},
        {"label": "line_2", "text": "PART B SPECIAL 200.00 EXTRA", "bbox": (0.01, 0.35, 0.9, 0.05)},
    ])
    rows = vp.rows_from_line_items(read)
    assert len(rows) == 2
    assert "PART B" in rows[1]["cells"]["description"]["text"]


def test_merge_duplicate_rows_preserves_distinct_items_with_same_price():
    rows = [
        {"line_no": 1, "bbox": (0.01, 0.25, 0.9, 0.04), "cells": {
            "description": {"text": "PART 001"}, "qty": {"text": "1"}, "unit_price": {"text": "100.00"}, "amount": {"text": "100.00"}}},
        {"line_no": 2, "bbox": (0.01, 0.35, 0.9, 0.04), "cells": {
            "description": {"text": "PART 002"}, "qty": {"text": "1"}, "unit_price": {"text": "100.00"}, "amount": {"text": "100.00"}}},
    ]
    kept, notes = vp.merge_duplicate_rows(rows, page=1)
    assert len(kept) == 2


def test_merge_duplicate_rows_preserves_distinct_items_even_if_bboxes_overlap():
    rows = [
        {"line_no": 1, "bbox": (0.01, 0.25, 0.9, 0.08), "cells": {
            "description": {"text": "ITEM 1 BHA62147 F002"}, "qty": {"text": "1"}, "unit_price": {"text": "100.00"}, "amount": {"text": "100.00"}}},
        {"line_no": 2, "bbox": (0.01, 0.28, 0.9, 0.08), "cells": {
            "description": {"text": "ITEM 2 BHA62147 F003"}, "qty": {"text": "1"}, "unit_price": {"text": "100.00"}, "amount": {"text": "100.00"}}},
    ]
    kept, notes = vp.merge_duplicate_rows(rows, page=1)
    assert len(kept) == 2


def test_v08_n_to_1_group_passes_when_sum_matches():
    from decimal import Decimal
    from system_a.domain.contracts import InvoiceDoc, NField, NLine, ReceiptRow
    from system_a.domain.matching import MatchGroup
    from system_a.domain.standard import load_standard
    from system_a.domain.v08 import build_payload

    l1 = NLine(1, "D1-L1", {"description": NField("description", "d1", "A", "A", 1.0, True, None),
                           "qty": NField("qty", "q1", "3006", Decimal("3006"), 1.0, True, None)}, "KG", ())
    l2 = NLine(2, "D1-L2", {"description": NField("description", "d2", "B", "B", 1.0, True, None),
                           "qty": NField("qty", "q2", "2906", Decimal("2906"), 1.0, True, None)}, "KG", ())
    doc = InvoiceDoc("D1", {}, (l1, l2), {}, True)
    r1 = ReceiptRow(176, "RCV1", "Rec", 1, "Item", Decimal("5912"), "Kilogram", Decimal("49.94"), Decimal("295245.28"), {})
    group = MatchGroup(group_id="G1", relation="N:1", level="M3", invoice_line_nos=(1, 2), rcv_line_ids=("RCV1-1",), confidence=0.9, source="ai", rationale="Matched")

    payload, expected = build_payload(doc, [group], {"RCV1-1": r1}, load_standard())
    assert expected[1][0] == "pass"
    assert expected[2][0] == "pass"


def test_po_prefix_normalization_and_consensus():
    v1, _, _ = vp.extract_value("po_number", "PO42052739")
    v2, _, _ = vp.extract_value("po_number", "42052739")
    assert v1 == "42052739"
    assert v2 == "42052739"
    winner, conf, agree, source, null_r = vp.consensus("PO42052739", None, "42052739", 0.95)
    assert agree is True
    assert winner == "42052739"
    assert null_r is None


def test_po_corroboration_from_line_items():
    fields = {"po_number": vp.RawField(raw="42052739", confidence=0.7, agreement=False, region=None, source="vlm", null_reason=None)}
    reads = {1: vp.PageRead(page_no=1, items=[
        {"label": "line_1", "text": "ITEM A PO42052739 1 PCS 100.00 100.00", "bbox": (0.1, 0.2, 0.8, 0.05)}
    ])}
    log = []
    vp.po_from_lines(fields, reads, [1], log)
    assert fields["po_number"].agreement is True
    assert fields["po_number"].confidence >= 0.96
    assert fields["po_number"].null_reason is None


def test_priority_crop_order_allocates_budget():
    order = vp.field_crop_priority(["customer_address", "po_number", "customer_name", "invoice_num"])
    assert order.index("invoice_num") < order.index("customer_address")
    assert order.index("po_number") < order.index("customer_address")


def test_header_scoping_ignores_attachment_doc_no():
    options = [
        (2, {"label": "doc_no", "text": "42052739", "confidence": 0.95, "bbox": (0.1, 0.1, 0.2, 0.05)})
    ]
    page, it = vp.pick_candidate("invoice_num", options, first_invoice=1, invoice_pages=[1])
    assert page is None
    assert it is None


def test_ghost_rows_auto_fold_into_preceding_description():
    rows = [
        {"line_no": 1, "bbox": (0.01, 0.20, 0.9, 0.05), "cells": {
            "description": {"text": "PART A MAIN"}, "qty": {"text": "2"}, "unit_price": {"text": "50.00"}, "amount": {"text": "100.00"}}},
        {"line_no": 2, "bbox": (0.01, 0.26, 0.9, 0.04), "cells": {
            "description": {"text": "EXTRA SPECIFICATION CONTINUED"}, "qty": {}, "unit_price": {}, "amount": {}}},
    ]
    folded = vp.fold_ghost_rows(rows)
    assert len(folded) == 1
    assert "EXTRA SPECIFICATION CONTINUED" in folded[0]["cells"]["description"]["text"]


def test_date_iso_supports_english_and_thai_month_names():
    from system_a.domain.normalize import date_iso
    assert date_iso("4 Sep 2026") == "2026-09-04"
    assert date_iso("07-SEP-2026") == "2026-09-07"
    assert date_iso("15 October 2026") == "2026-10-15"
    assert date_iso("1 ม.ค. 2569") == "2026-01-01"
    assert date_iso("31 ส.ค. 69") == "2026-08-31"


def test_split_number_supports_thai_dash_currency():
    from decimal import Decimal
    from system_a.domain.normalize import split_number
    num, unit = split_number("3,000.-")
    assert num == Decimal("3000.00")
    num2, _ = split_number("15,500-")
    assert num2 == Decimal("15500.00")
    num3, u3 = split_number("300.- /PCS")
    assert num3 == Decimal("300.00")
    assert u3 == "PCS"


def test_receiving_stamp_maps_to_receiver_signature():
    assert "received_stamp" in vp.SIGNATURE_LABELS
    assert vp.SIGNATURE_LABELS["received_stamp"] == "receiver"
    read_p2 = vp.PageRead(page_no=2, items=[
        {"type": "stamp", "label": "received_stamp", "text": "stamped", "bbox": [0.268, 0.528, 0.204, 0.072], "confidence": 0.9}
    ])
    pipe = vp.VisionPipeline(FakeVlm(), "fake", do_crops=False)
    ctx = vp._Ctx(pdf=b"", infos={1: None, 2: None}, pngs={}, layers={})
    fields, sigs, regions, _ = pipe._fields(ctx, {2: read_p2}, [1])
    assert "receiver" in sigs
    assert sigs["receiver"].present is True
    assert sigs["receiver"].confidence == 0.9
    assert sigs["receiver"].region.page == 2
    assert tuple(sigs["receiver"].region.bbox) == (0.268, 0.528, 0.204, 0.072)


def test_reconcile_grand_total_when_duplicated_subtotal():
    # Case DMS-46: sub_total = 6400.00, vat = 448.00, grand_total read as 6400.00
    fields = {"sub_total": _rf("6,400.00"), "vat": _rf("448.00"), "grand_total": _rf("6,400.00")}
    cands = {"grand_total": []}
    log = []
    vp.reconcile_grand_total(fields, cands, log)
    assert fields["grand_total"].raw == "6,848.00"
    assert fields["grand_total"].agreement is True
    assert log


def test_collapse_duplicate_block_middle_block():
    from system_a.domain.contracts import InvoiceDoc, NField, NLine
    from system_a.domain.evidence import collapse_duplicate_block
    from system_a.domain.standard import load_standard

    def make_line(n, desc, amt):
        return NLine(n, f"L{n}", {
            "description": NField("description", f"L{n}-d", desc, desc, 1.0, True, None),
            "qty": NField("qty", f"L{n}-q", "1", Decimal("1"), 1.0, True, None),
            "unit_price": NField("unit_price", f"L{n}-p", str(amt), Decimal(str(amt)), 1.0, True, None),
            "amount": NField("amount", f"L{n}-a", str(amt), Decimal(str(amt)), 1.0, True, None),
        }, "PCS", ())

    # Middle block duplicated: L1, L2, then duplicated L3(same as L1), L4(same as L2), then L5
    # Subtotal is 100 + 200 + 300 = 600
    l1 = make_line(1, "ITEM_A", 100)
    l2 = make_line(2, "ITEM_B", 200)
    l3 = make_line(3, "ITEM_A", 100) # dup of L1
    l4 = make_line(4, "ITEM_B", 200) # dup of L2
    l5 = make_line(5, "ITEM_C", 300)

    doc = InvoiceDoc("D1", {"sub_total": NField("sub_total", "f-sub", "600.00", Decimal("600.00"), 1.0, True, None)},
                     (l1, l2, l3, l4, l5), {}, True)
    std = load_standard()
    collapsed, note = collapse_duplicate_block(doc, None, std)
    assert note is not None
    assert [l.line_no for l in collapsed.lines] == [1, 2, 5]


def test_multi_grid_table_rows_fallback_to_page_items():
    """DMS-102: Multi-grid invoice where table_rows digitized the upper customer/PO grid (Y=0.20)
    instead of the actual goods table (Y=0.33). Rows must fallback to page-read items and not float above header.
    """
    # Page read has table_header at Y=0.295, and two lines at Y=0.335 and Y=0.385
    read = vp.PageRead(page_no=1, items=[
        {"type": "table", "label": "table_header", "bbox": (0.075, 0.295, 0.83, 0.025), "text": "PRODUCT CODE QUANTITY DESCRIPTION AMOUNT"},
        {"type": "line", "label": "line_1", "bbox": (0.135, 0.335, 0.805, 0.045), "text": "L3590 1 38.00 LOWER DIE FC 300 47.00/KG 1,786.00"},
        {"type": "line", "label": "line_2", "bbox": (0.135, 0.385, 0.805, 0.025), "text": "L3591 1 136.00 UPPER DIE FC 300 47.00/KG 6,392.00"},
    ])

    # Mock VLM that returns table_rows in upper grid (Y=0.20, above header)
    class FakeMultiGridVlm:
        def chat_json(self, model, system, user, *, images=None, **kw):
            return {
                "table_bbox": [8, 165, 992, 245],
                "columns": [{"label": "description", "bbox_2d": [532, 167, 814, 185]},
                            {"label": "amount", "bbox_2d": [1000, 167, 1000, 185]}],  # zero width column
                "rows": [
                    {"line_no": 1, "bbox_2d": [8, 202, 992, 216], "cells": {
                        "description": {"text": "LOWER DIE FC 300", "bbox_2d": [532, 204, 992, 215]},
                        "qty": {"text": "38.00", "bbox_2d": [411, 204, 492, 215]},
                        "amount": {"text": "1,786.00", "bbox_2d": [1000, 204, 1000, 215]}  # zero width cell
                    }},
                    {"line_no": 2, "bbox_2d": [8, 220, 992, 234], "cells": {
                        "description": {"text": "UPPER DIE FC 300", "bbox_2d": [532, 221, 992, 232]},
                        "qty": {"text": "136.00", "bbox_2d": [411, 221, 492, 232]},
                        "amount": {"text": "6,392.00", "bbox_2d": [1000, 221, 1000, 232]}
                    }}
                ]
            }

    pipe = vp.VisionPipeline(FakeMultiGridVlm(), "fake", do_crops=False)
    from system_a.domain.contracts import PageInfo
    ctx = vp._Ctx(
        pdf=b"",
        pngs={1: b"fake"},
        infos={1: PageInfo(page_no=1, width_pt=595, height_pt=842)},
        layers={1: {"text": "", "words": []}}
    )

    lines, regions, errors, source, notes = pipe._lines(ctx, {1: read}, [1])

    # Rows MUST NOT be above table header (Y >= 0.295)
    assert lines[0].region.bbox[1] >= 0.295
    assert lines[1].region.bbox[1] >= 0.295
    # Row boxes must match page lines
    assert lines[0].region.bbox == (0.135, 0.335, 0.805, 0.045)
    assert lines[1].region.bbox == (0.135, 0.385, 0.805, 0.025)
    # Cell boxes must carry row box and not be zero width
    assert lines[0].cells["amount"].region.bbox[2] > 0
    assert lines[0].cells["amount"].region.bbox == lines[0].region.bbox

    # Table region T1-001 must not be floating above header
    t_reg = next((r for r in regions if r.region_id == "T1-001"), None)
    if t_reg:
        assert t_reg.bbox[1] >= 0.295 or abs(t_reg.bbox[1] - 0.295) < 0.01


def test_degenerate_bbox_sanitized_in_assembler():
    """BBoxes with zero width or zero height must be sanitized to None in ocr.elements."""
    from system_a.application.assembler import build_elements
    from system_a.domain.contracts import ExtractionResult, InvoiceDoc, NField, NLine, PageInfo, RawField, RawLine, Region

    rf_zero = RawField(raw="100.00", confidence=0.9, agreement=True, region=Region(page=1, bbox=(1.0, 0.20, 0.0, 0.01)))
    rl = RawLine(line_no=1, region=Region(page=1, bbox=(0.1, 0.3, 0.8, 0.05)), cells={"amount": rf_zero})
    nl = NLine(1, "D1-L1", {"amount": NField("amount", "D1-L1-amount", "100.00", Decimal("100.00"), 0.9, True, None)}, "PCS", ())

    ext = ExtractionResult(
        package_id="P1", dms_doc_id="DMS-102", file_sha256="abc",
        pages=[PageInfo(page_no=1, width_pt=595, height_pt=842)], documents=[], invoice_document_id="D1",
        pages_complete=True, fields={}, lines=[rl], signatures={}, words=[], regions=()
    )
    doc = InvoiceDoc("D1", {}, (nl,), {}, True)
    els = build_elements(ext, doc)

    # D1-L1-amount had zero width (0.0) -> its bbox in elements MUST be None!
    assert els["D1-L1-amount"]["bbox"] is None


def test_is_cacheable_rejects_transport_errors():
    """is_cacheable must reject extractions that suffered network drops or have all empty fields."""
    from system_a.domain.contracts import ExtractionResult, PageInfo, RawField
    from system_a.perception.cache import is_cacheable

    # Case 1: Incomplete pages
    ext_incomplete = ExtractionResult(
        package_id="P1", dms_doc_id="D1", file_sha256="sha",
        pages=[PageInfo(page_no=1, width_pt=595, height_pt=842)], documents=[], invoice_document_id="D1",
        pages_complete=False, fields={}, lines=[], signatures={}, words=[], regions=()
    )
    assert is_cacheable(ext_incomplete) is False

    # Case 2: ConnectError / getaddrinfo failed in page_errors
    ext_transport_err = ExtractionResult(
        package_id="P1", dms_doc_id="D1", file_sha256="sha",
        pages=[PageInfo(page_no=1, width_pt=595, height_pt=842)], documents=[], invoice_document_id="D1",
        pages_complete=True, fields={}, lines=[], signatures={}, words=[], regions=(),
        extra={"page_errors": {"1": "AITransportError: ConnectError: [Errno 11001] getaddrinfo failed"}}
    )
    assert is_cacheable(ext_transport_err) is False

    # Case 3: Empty fields when document has pages
    ext_empty_fields = ExtractionResult(
        package_id="P1", dms_doc_id="D1", file_sha256="sha",
        pages=[PageInfo(page_no=1, width_pt=595, height_pt=842)], documents=[], invoice_document_id="D1",
        pages_complete=True,
        fields={"invoice_num": RawField(raw=None, null_reason="NOT_PRESENT")},
        lines=[], signatures={}, words=[], regions=()
    )
    assert is_cacheable(ext_empty_fields) is False

    # Case 4: Valid extraction with complete pages and extracted fields
    ext_valid = ExtractionResult(
        package_id="P1", dms_doc_id="D1", file_sha256="sha",
        pages=[PageInfo(page_no=1, width_pt=595, height_pt=842)], documents=[], invoice_document_id="D1",
        pages_complete=True,
        fields={"invoice_num": RawField(raw="INV-001", confidence=0.95)},
        lines=[], signatures={}, words=[], regions=()
    )
    assert is_cacheable(ext_valid) is True


def test_perception_cache_save_skips_uncacheable(tmp_path):
    """PerceptionCache.save must never persist uncacheable/corrupted extraction results."""
    from system_a.domain.contracts import ExtractionResult, PageInfo
    from system_a.perception.cache import PerceptionCache

    cache = PerceptionCache(tmp_path)
    ext_poisoned = ExtractionResult(
        package_id="P1", dms_doc_id="D1", file_sha256="sha_poison",
        pages=[PageInfo(page_no=1, width_pt=595, height_pt=842)], documents=[], invoice_document_id="D1",
        pages_complete=False, fields={}, lines=[], signatures={}, words=[], regions=(),
        extra={"page_errors": {"1": "ConnectError: getaddrinfo failed"}}
    )

    saved_path = cache.save("test_key", ext_poisoned)
    assert saved_path is None
    assert not (tmp_path / "test_key.json").exists()


def test_perception_cache_load_rejects_poisoned_file(tmp_path):
    """PerceptionCache.load must reject and remove corrupted files on disk."""
    from system_a.domain.contracts import ExtractionResult, PageInfo
    from system_a.perception.cache import PerceptionCache

    cache = PerceptionCache(tmp_path)
    ext_poisoned = ExtractionResult(
        package_id="P1", dms_doc_id="D1", file_sha256="sha_disk",
        pages=[PageInfo(page_no=1, width_pt=595, height_pt=842)], documents=[], invoice_document_id="D1",
        pages_complete=False, fields={}, lines=[], signatures={}, words=[], regions=(),
        extra={"page_errors": {"1": "ConnectError: getaddrinfo failed"}}
    )
    # Manually write poisoned file to disk
    p = tmp_path / "corrupted_key.json"
    p.write_text(ext_poisoned.model_dump_json(), encoding="utf-8")
    assert p.exists()

    loaded = cache.load("corrupted_key", "sha_disk")
    assert loaded is None
    assert cache.rejected == 1
    assert not p.exists()  # Poisoned file was unlinked


def test_classify_batch_selects_invoice_originals():
    """Every invoice-type page enters the processed set; copies are decided later by their own content title."""
    from system_a.perception.vision_pipeline import select_invoice_pages
    pages_info = [
        {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": 0.95},
        {"page": 2, "page_type": "TAX_INVOICE", "is_copy": True, "confidence": 0.90},
        {"page": 3, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.88},
    ]
    selected = select_invoice_pages(pages_info)
    assert selected == [1, 2], f"Expected all invoice-type pages, got {selected}"


def test_classify_batch_falls_back_to_copy_when_no_original():
    """When no original invoice exists, copies are used as fallback."""
    from system_a.perception.vision_pipeline import select_invoice_pages
    pages_info = [
        {"page": 1, "page_type": "TAX_INVOICE", "is_copy": True, "confidence": 0.90},
        {"page": 2, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.88},
    ]
    selected = select_invoice_pages(pages_info)
    assert selected == [1], f"Expected [1] (copy fallback), got {selected}"


def test_classify_batch_multi_invoice_all_originals():
    """Multiple distinct invoices: all original invoice pages are selected."""
    from system_a.perception.vision_pipeline import select_invoice_pages
    pages_info = [
        {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": 0.95},
        {"page": 2, "page_type": "INVOICE", "is_copy": False, "confidence": 0.92},
        {"page": 3, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.88},
    ]
    selected = select_invoice_pages(pages_info)
    assert selected == [1, 2], f"Expected [1, 2], got {selected}"


def test_classify_batch_no_invoice_falls_back_to_page1():
    """When no page is classified as invoice, page 1 is used as fallback."""
    from system_a.perception.vision_pipeline import select_invoice_pages
    pages_info = [
        {"page": 1, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.88},
        {"page": 2, "page_type": "SUPPORTING", "is_copy": False, "confidence": 0.80},
    ]
    selected = select_invoice_pages(pages_info)
    assert selected == [1], f"Expected [1] (fallback to page 1), got {selected}"


def test_copy_detection_from_text_layer():
    """Text layer keywords corroborate is_copy detection."""
    from system_a.perception.vision_pipeline import text_layer_is_copy
    assert text_layer_is_copy("บริษัท ABC สำเนา") is True
    assert text_layer_is_copy("CUSTOMER COPY") is True
    assert text_layer_is_copy("DUPLICATE") is True
    assert text_layer_is_copy("คู่ฉบับ") is True
    assert text_layer_is_copy("TAX INVOICE original") is False
    assert text_layer_is_copy("ใบกำกับภาษี") is False


def test_classify_batch_method_execution():
    from unittest.mock import MagicMock
    from system_a.perception.vision_pipeline import VisionPipeline

    mock_client = MagicMock()
    mock_client.chat_json.return_value = {
        "pages": [
            {"page": 2, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.85},
            {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": 0.95},
        ]
    }
    vp = VisionPipeline(mock_client, "test-model", invoice_first=True)
    res = vp._classify_batch({1: b"png1", 2: b"png2"})

    assert len(res) == 2
    assert res[0]["page"] == 1
    assert res[0]["page_type"] == "TAX_INVOICE"
    assert res[0]["is_copy"] is False
    assert res[1]["page"] == 2
    assert res[1]["page_type"] == "DELIVERY_NOTE"
    assert len(vp.calls) == 1
    assert vp.calls[0]["kind"] == "classify_batch"
    assert vp.calls[0]["ok"] is True


def test_extract_invoice_first_limits_calls_to_three():
    """On a 2-page doc (page 1=TAX_INVOICE, page 2=DELIVERY_NOTE), invoice_first makes exactly 3 VLM calls."""
    import fitz
    from system_a.perception.vision_pipeline import VisionPipeline

    doc = fitz.open()
    p1 = doc.new_page(width=595, height=842)
    p1.insert_text((100, 100), "TAX INVOICE IV690900285", fontsize=9)
    p2 = doc.new_page(width=595, height=842)
    p2.insert_text((100, 100), "DELIVERY NOTE DN001", fontsize=9)
    pdf_bytes = doc.tobytes()
    doc.close()

    class FakeBatchVlm:
        def __init__(self):
            self.last_usage, self.last_salvaged = {}, False

        def chat_json(self, model, system, user, *, images=None, **kw):
            if "Classify these" in user:
                return {
                    "pages": [
                        {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": 0.95},
                        {"page": 2, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.90},
                    ]
                }
            if "Digitise" in user:
                return {"rows": [{"line_no": 1, "bbox_2d": [40, 330, 950, 350], "cells": {
                    "description": {"text": "BRACKET ASSY", "bbox_2d": [80, 330, 300, 350]},
                    "qty": {"text": "10", "bbox_2d": [520, 330, 560, 350]},
                    "amount": {"text": "1,000.00", "bbox_2d": [80, 330, 900, 350]}}}]}
            return {"doc_type": "tax_invoice", "items": [
                {"type": "header", "label": "doc_no", "text": "IV690900285", "bbox_2d": [600, 100, 760, 115]},
                {"type": "header", "label": "po_number", "text": "40111111", "bbox_2d": [600, 120, 760, 135]},
                {"type": "header", "label": "supplier_tax_id", "text": "0123456789012",
                 "bbox_2d": [60, 160, 400, 180]},
                {"type": "header", "label": "customer_tax_id", "text": "0107545000179",
                 "bbox_2d": [60, 200, 400, 220]},
                {"type": "total", "label": "sub_total", "text": "1,000.00", "bbox_2d": [800, 700, 900, 715]},
                {"type": "total", "label": "vat", "text": "70.00", "bbox_2d": [800, 720, 900, 735]},
                {"type": "total", "label": "grand_total", "text": "1,070.00", "bbox_2d": [800, 740, 900, 755]},
                {"type": "line", "label": "line_1", "text": "1 BRACKET ASSY 10 1,000.00", "bbox_2d": [40, 330, 950, 350]}]}

    pipe = VisionPipeline(FakeBatchVlm(), "fake-model", do_crops=False, invoice_first=True)
    ext = pipe.extract(pdf_bytes, package_id="PKG-INV-1", dms_doc_id="DMS-INV-1")

    assert ext.invoice_document_id == "D1"
    assert ext.extra["invoice_pages"] == [1]
    # Page 1 has items; Page 2 was NOT read for items
    assert len(ext.extra["items_by_page"]["1"]) > 0
    assert len(ext.extra["items_by_page"]["2"]) == 0
    # Calls: 1 classify_batch + 1 page_items (page 1) + 1 table_rows (page 1) = 3 calls
    assert len(pipe.calls) == 3
    kinds = [c["kind"] for c in pipe.calls]
    assert kinds == ["classify_batch", "page_items", "table_rows"]


# ---------------------------------------------------------------- 3-call eval loop fixes (loop 2)
def test_select_invoice_pages_keeps_every_invoice_sheet_including_named_duplicates():
    """The classify's duplicate claims never remove a sheet: true reprints cost nothing at the fold,
    wrongly-named continuation sheets (DMS-26/27) would cost the document its real item rows."""
    from system_a.perception.vision_pipeline import select_invoice_pages
    pages_info = [
        {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "duplicate_of": None, "confidence": 0.95},
        {"page": 2, "page_type": "TAX_INVOICE", "is_copy": True, "duplicate_of": None, "confidence": 0.90},
        {"page": 3, "page_type": "TAX_INVOICE", "is_copy": True, "duplicate_of": 1, "confidence": 0.92},
        {"page": 4, "page_type": "DELIVERY_NOTE", "is_copy": False, "duplicate_of": None, "confidence": 0.88},
    ]
    assert select_invoice_pages(pages_info) == [1, 2, 3]


def test_copy_or_delivery_titled_demotes_copy_and_delivery_pages():
    """A page's own content title decides: COPY-prefixed or tax-less titles carry header evidence but no table."""
    from system_a.perception.vision_pipeline import copy_or_delivery_titled

    def items(*titles):
        return [{"type": "header", "label": "doc_title", "text": t} for t in titles]

    assert copy_or_delivery_titled(items("COPY TAX INVOICE/DELIVERY ORDER")) is False   # copy-stamped but tax-worded: the fold decides (DMS-26 p2 lesson)
    assert copy_or_delivery_titled(items("COPY INVOICE/DELIVERY ORDER")) is False        # DMS-22 p3 - rows fold away
    assert copy_or_delivery_titled(items("ใบส่งสินค้า DELIVERY ORDER")) is True           # DMS-33 p4: no tax wording at all
    assert copy_or_delivery_titled(items("คู่ฉบับใบกำกับภาษี")) is False                    # stamped duplicate of a TAX INVOICE - read it
    assert copy_or_delivery_titled(items("TAX INVOICE /DELIVERY ORDER /INVOICE")) is False  # DMS-26 p3
    assert copy_or_delivery_titled(items("ต้นฉบับใบกำกับภาษี /ใบส่งของ /ใบแจ้งหนี้ TAX INV")) is False
    assert copy_or_delivery_titled(items("ใบกำกับภาษี/สำเนาใบส่งสินค้า/สำเนาใบเสร็จรับเงิน")) is False  # DMS-15 combined
    assert copy_or_delivery_titled(items()) is False                        # no title -> keep
    assert copy_or_delivery_titled([{"type": "header", "label": "doc_no", "text": "IV1"}]) is False


def test_pick_field_reading_secondary_only_fills_or_rescues_gaps():
    """Header fields prefer the processed invoice pages; secondary (copy/rescued) pages fill a missing
    field and may only rescue an identifier whose primary reading lacks the printed shape."""
    from system_a.perception.vision_pipeline import pick_field_reading

    def opt(page, label, text, conf=0.9):
        return page, {"label": label, "text": text, "bbox": [0.1, 0.2, 0.3, 0.02], "confidence": conf}

    # missing on the primary pages -> taken from the secondary page (DMS-22 totals on a copy sheet)
    primary = []                       # no sub_total candidate printed on the invoice sheets
    secondary = [opt(3, "sub_total", "30,541.32")]
    page, it = pick_field_reading("sub_total", primary, secondary, first_invoice=1)
    assert page == 3 and it["text"] == "30,541.32"

    # printed on both -> the primary page wins
    primary2 = [opt(1, "sub_total", "30,541.32")]
    page, it = pick_field_reading("sub_total", primary2, secondary, first_invoice=1)
    assert page == 1

    # identifier with a label-mixed primary reading is rescued by a shaped secondary reading (DMS-30)
    primary3 = [opt(1, "supplier_tax_id", "เลขประจำตัวผู้เสียภาษี 010556004925")]
    secondary3 = [opt(2, "supplier_tax_id", "0105556094925")]
    page, it = pick_field_reading("supplier_tax_id", primary3, secondary3, first_invoice=1)
    assert page == 2

    # but a PO whose primary reading lacks the shape is NOT replaced by a secondary reading -
    # the derivation from the item rows owns that repair (DMS-33's misread PO lived on a copy page)
    primary4 = [opt(1, "po_number", "40118928139")]
    secondary4 = [opt(4, "po_number", "0118928139")]
    page, it = pick_field_reading("po_number", primary4, secondary4, first_invoice=1)
    assert page == 1


def test_extract_demotes_delivery_titled_page_from_lines_but_keeps_its_fields():
    """A selected page whose own title carries no tax wording is dropped from the table pass yet still
    supplies header fields the original page does not print (a COPY-stamped title stays in the table
    pass - only the fold decides its rows)."""
    import fitz
    from system_a.perception.vision_pipeline import VisionPipeline

    doc = fitz.open()
    for i in range(2):
        p = doc.new_page(width=595, height=842)
        p.insert_text((100, 100), f"PAGE {i + 1}", fontsize=9)
    pdf_bytes = doc.tobytes()
    doc.close()

    class FakeCopyVlm:
        def __init__(self):
            self.last_usage, self.last_salvaged = {}, False
            self.page_reads = 0

        def chat_json(self, model, system, user, *, images=None, **kw):
            if "Classify these" in user:
                return {"pages": [
                    {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": 0.95},
                    {"page": 2, "page_type": "TAX_INVOICE", "is_copy": True, "confidence": 0.90}]}
            if "Digitise" in user:
                return {"rows": [{"line_no": 1, "bbox_2d": [40, 330, 950, 350], "cells": {
                    "description": {"text": "BOLT", "bbox_2d": [80, 330, 300, 350]},
                    "qty": {"text": "2", "bbox_2d": [520, 330, 560, 350]},
                    "amount": {"text": "200.00", "bbox_2d": [80, 330, 900, 350]}}}]}
            self.page_reads += 1
            if self.page_reads == 1:
                return {"doc_type": "tax_invoice", "items": [
                    {"type": "header", "label": "doc_title", "text": "TAX INVOICE",
                     "bbox_2d": [60, 40, 400, 60]},
                    {"type": "header", "label": "doc_no", "text": "IV1", "bbox_2d": [600, 100, 760, 115]},
                    {"type": "header", "label": "po_number", "text": "40111111", "bbox_2d": [600, 120, 760, 135]},
                    {"type": "header", "label": "supplier_name", "text": "บริษัท เอ บี ซี จำกัด",
                     "bbox_2d": [60, 60, 400, 90]},
                    {"type": "header", "label": "customer_name", "text": "บริษัท อัปโก้ จำกัด",
                     "bbox_2d": [60, 150, 400, 180]},
                    {"type": "header", "label": "supplier_address", "text": "99 บางนา",
                     "bbox_2d": [60, 90, 400, 110]},
                    {"type": "header", "label": "customer_address", "text": "100 อโศก",
                     "bbox_2d": [60, 180, 400, 200]},
                    {"type": "header", "label": "customer_tax_id", "text": "0107545000179",
                     "bbox_2d": [60, 210, 400, 230]},
                    {"type": "header", "label": "supplier_tax_id", "text": "0123456789012",
                     "bbox_2d": [60, 240, 400, 260]},
                    {"type": "header", "label": "invoice_date", "text": "01/09/2569",
                     "bbox_2d": [600, 140, 760, 155]},
                    {"type": "line", "label": "line_1", "text": "1 BOLT 2 200.00",
                     "bbox_2d": [40, 330, 950, 350]}]}
            return {"doc_type": "tax_invoice", "items": [
                {"type": "header", "label": "doc_title", "text": "ใบส่งสินค้า / DELIVERY ORDER",
                 "bbox_2d": [60, 40, 400, 60]},
                {"type": "total", "label": "sub_total", "text": "200.00", "bbox_2d": [700, 700, 900, 715]},
                {"type": "total", "label": "vat", "text": "14.00", "bbox_2d": [700, 720, 900, 735]},
                {"type": "total", "label": "grand_total", "text": "214.00", "bbox_2d": [700, 740, 900, 755]}]}

    pipe = VisionPipeline(FakeCopyVlm(), "fake-model", do_crops=False, invoice_first=True)
    ext = pipe.extract(pdf_bytes, package_id="PKG-C", dms_doc_id="DMS-C")
    assert ext.extra["invoice_pages"] == [1], f"delivery-titled page must leave the table set: {ext.extra['invoice_pages']}"
    assert ext.fields["sub_total"].raw == "200.00"       # totals still come from the copy sheet
    assert ext.fields["grand_total"].raw == "214.00"
    kinds = [c["kind"] for c in pipe.calls]
    assert kinds.count("page_items") == 2 and kinds.count("table_rows") == 1
    assert "crop_reread" not in kinds


def test_classify_batch_parses_receiver_stamp_flags():
    """_classify_batch keeps the VLM's per-page receiver-stamp observation."""
    from unittest.mock import MagicMock
    from system_a.perception.vision_pipeline import VisionPipeline

    mock_client = MagicMock()
    mock_client.chat_json.return_value = {
        "pages": [
            {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": 0.95,
             "has_receiver_stamp": False},
            {"page": 2, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.90,
             "has_receiver_stamp": True},
        ]
    }
    pipe = VisionPipeline(mock_client, "test-model", invoice_first=True)
    res = pipe._classify_batch({1: b"png1", 2: b"png2"})
    assert res[0]["has_receiver_stamp"] is False
    assert res[1]["has_receiver_stamp"] is True


def test_reconcile_copy_flags_keyword_does_not_override_vlm():
    """A text-layer stamp keyword annotates but never flips the VLM's visual copy judgement."""
    from system_a.perception.vision_pipeline import reconcile_copy_flags
    batch = [
        {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": 0.95},
        {"page": 2, "page_type": "TAX_INVOICE", "is_copy": True, "confidence": 0.90},
    ]
    layers = {1: {"text": "ต้นฉบับใบกำกับภาษี เอกสารออกเป็นชุด"}, 2: {"text": ""}}
    out = reconcile_copy_flags(batch, layers)
    assert out[0]["is_copy"] is False and out[0]["keyword_copy"] is True
    assert out[1]["is_copy"] is True


def test_synthesize_stamp_items_only_when_no_real_receiver():
    """A classify-detected receiving stamp on an unprocessed page becomes a receiver signature item,
    but only when the processed pages did not already yield a real receiver signature."""
    from system_a.perception.vision_pipeline import synthesize_stamp_items, PageRead

    reads = {1: PageRead(page_no=1, items=[]), 2: PageRead(page_no=2, items=[])}
    batch = [{"page": 2, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.9,
              "has_receiver_stamp": True}]
    assert synthesize_stamp_items(reads, batch, selected=[1]) == 1
    labels = [it["label"] for it in reads[2].items]
    assert labels == ["received_stamp"]

    reads2 = {1: PageRead(page_no=1, items=[{"type": "header", "label": "receiver_signature",
                                             "text": "signed", "bbox": [0.1, 0.1, 0.1, 0.1]}]),
              2: PageRead(page_no=2, items=[])}
    assert synthesize_stamp_items(reads2, batch, selected=[1]) == 0

    # a stamped page that WAS processed must not be synthesized (its page_items is the authority)
    reads3 = {1: PageRead(page_no=1, items=[]), 2: PageRead(page_no=2, items=[])}
    assert synthesize_stamp_items(reads3, batch, selected=[1, 2]) == 0


def test_majority_identifier_prefers_repeated_shaped_value():
    """A digit-misread on one page loses to the same 13-digit tax id printed on two other pages."""
    from system_a.perception.vision_pipeline import majority_identifier

    def opt(page, text):
        return page, {"label": "supplier_tax_id", "text": text, "bbox": [0.1, 0.1, 0.2, 0.02]}
    options = [opt(1, "0105540008838"), opt(2, "0105540008888"), opt(3, "0105540008888")]
    page, it = majority_identifier("supplier_tax_id", options)
    assert page == 2 and it["text"] == "0105540008888"

    # no repeated value -> no majority -> fall back to the regular picker
    tie = [opt(1, "0105540008838"), opt(2, "0105540008888")]
    assert majority_identifier("supplier_tax_id", tie) is None

    # values without the field's printed shape never vote (12-digit misread)
    junk = [opt(1, "เลขประจำตัวผู้เสียภาษี 010556004925"), opt(2, "เลข 010556004925")]
    assert majority_identifier("supplier_tax_id", junk) is None


def test_pick_candidate_shape_first_for_identifiers():
    """For tax-id/PO identifiers a well-shaped reading on a later page beats a label-mixed first page."""
    from system_a.perception.vision_pipeline import pick_candidate

    opts = [(1, {"label": "supplier_tax_id", "text": "เลขประจำตัวผู้เสียภาษี 010556004925",
                 "bbox": [0.1, 0.2, 0.4, 0.02], "confidence": 0.9}),
            (2, {"label": "supplier_tax_id", "text": "0105556094925",
                 "bbox": [0.1, 0.3, 0.3, 0.02], "confidence": 0.7})]
    page, it = pick_candidate("supplier_tax_id", opts, first_invoice=1, invoice_pages=[1, 2])
    assert page == 2, f"shape-OK reading must beat first-page garbage, got page {page}"


def test_po_semantic_fix_prefers_customer_order_label():
    """DMS-24: a po read from 'เลขที่สั่งซื้อภายใน' (internal order) is replaced by the value printed
    under the customer purchase-order label 'เลขที่ใบสั่งซื้อ'."""
    from system_a.domain.contracts import RawField, Region
    from system_a.perception.vision_pipeline import po_semantic_fix

    fields = {"po_number": RawField(raw="50688296", confidence=0.96, agreement=True,
                                    region=Region(page=1, bbox=[0.1, 0.2, 0.3, 0.02]), source="vlm")}
    candidates = [
        (1, {"label": "po_number", "text": "เลขที่สั่งซื้อภายใน/ วันที่ 50688296/ 2026-08-18"}),
        (1, {"label": "invoice_ref", "text": "เลขที่ใบสั่งซื้อ/วันที่ 42052615 / 2026-08-18"}),
    ]
    log = []
    po_semantic_fix(fields, candidates, log)
    assert fields["po_number"].raw == "42052615"
    assert log and log[0]["field"] == "po_number" and log[0]["rule"] == "customer purchase-order label"

    # when the current reading is not the internal-order one, nothing is touched
    fields2 = {"po_number": RawField(raw="42052615", confidence=0.96, agreement=True,
                                     region=Region(page=1, bbox=[0.1, 0.2, 0.3, 0.02]), source="vlm")}
    po_semantic_fix(fields2, candidates, [])
    assert fields2["po_number"].raw == "42052615"


def test_field_rescue_reads_next_pages_until_missing_found():
    """A missing critical identifier triggers at most a bounded page_items rescue on unprocessed pages."""
    import fitz
    from system_a.perception.vision_pipeline import VisionPipeline

    doc = fitz.open()
    for i in range(3):
        p = doc.new_page(width=595, height=842)
        p.insert_text((100, 100), f"PAGE {i + 1} TAX INVOICE IV1", fontsize=9)
    pdf_bytes = doc.tobytes()
    doc.close()

    class FakeRescueVlm:
        def __init__(self):
            self.last_usage, self.last_salvaged = {}, False
            self.page_reads = 0

        def chat_json(self, model, system, user, *, images=None, **kw):
            if "Classify these" in user:
                return {"pages": [
                    {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": 0.95},
                    {"page": 2, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.90},
                    {"page": 3, "page_type": "PO", "is_copy": False, "confidence": 0.90}]}
            if "Digitise" in user:
                return {"rows": [{"line_no": 1, "bbox_2d": [40, 330, 950, 350], "cells": {
                    "description": {"text": "BOLT", "bbox_2d": [80, 330, 300, 350]},
                    "qty": {"text": "2", "bbox_2d": [520, 330, 560, 350]},
                    "amount": {"text": "200.00", "bbox_2d": [80, 330, 900, 350]}}}]}
            self.page_reads += 1
            if self.page_reads == 1:      # page 1: full header but no supplier_tax_id
                return {"doc_type": "tax_invoice", "items": [
                    {"type": "header", "label": "doc_no", "text": "IV1", "bbox_2d": [600, 100, 760, 115]},
                    {"type": "header", "label": "po_number", "text": "40111111", "bbox_2d": [600, 120, 760, 135]},
                    {"type": "header", "label": "supplier_name", "text": "บริษัท เอ บี ซี จำกัด",
                     "bbox_2d": [60, 60, 400, 90]},
                    {"type": "header", "label": "customer_name", "text": "บริษัท อัปโก้ จำกัด",
                     "bbox_2d": [60, 150, 400, 180]},
                    {"type": "header", "label": "supplier_address", "text": "99 บางนา",
                     "bbox_2d": [60, 90, 400, 110]},
                    {"type": "header", "label": "customer_address", "text": "100 อโศก",
                     "bbox_2d": [60, 180, 400, 200]},
                    {"type": "header", "label": "customer_tax_id", "text": "0107545000179",
                     "bbox_2d": [60, 210, 400, 230]},
                    {"type": "header", "label": "invoice_date", "text": "01/09/2569",
                     "bbox_2d": [600, 140, 760, 155]},
                    {"type": "total", "label": "sub_total", "text": "200.00", "bbox_2d": [700, 700, 900, 715]},
                    {"type": "total", "label": "vat", "text": "14.00", "bbox_2d": [700, 720, 900, 735]},
                    {"type": "total", "label": "grand_total", "text": "214.00", "bbox_2d": [700, 740, 900, 755]},
                    {"type": "line", "label": "line_1", "text": "1 BOLT 2 200.00", "bbox_2d": [40, 330, 950, 350]}]}
            # rescue read (page 2): carries the supplier_tax_id
            return {"doc_type": "tax_invoice", "items": [
                {"type": "header", "label": "supplier_tax_id", "text": "0123456789012",
                 "bbox_2d": [60, 100, 400, 120]}]}

    pipe = VisionPipeline(FakeRescueVlm(), "fake-model", do_crops=False, invoice_first=True)
    ext = pipe.extract(pdf_bytes, package_id="PKG-R", dms_doc_id="DMS-R")
    assert ext.fields["supplier_tax_id"].raw == "0123456789012"
    kinds = [c["kind"] for c in pipe.calls]
    assert kinds.count("page_items") == 2, f"rescue must spend exactly one extra page_items, got {kinds}"
    assert "crop_reread" not in kinds
    assert ext.extra["invoice_pages"] == [1]      # selection unchanged; rescue is logged separately
    assert [r["page"] for r in ext.extra["field_rescue"]] == [2]









# ---------------------------------------------------------------- Loop 4: markers, dashed tax, hints, oracle rewrite
from system_a.perception.vision_pipeline import (  # noqa: E402
    select_invoice_pages, pick_field_reading, pick_candidate, extract_value, shape_ok)


def test_page_marker_is_parsed_by_classify():
    """_classify_batch keeps the printed page position (used to refute bogus duplicate claims)."""
    from unittest.mock import MagicMock
    from system_a.perception.vision_pipeline import VisionPipeline

    client = MagicMock()
    client.chat_json.return_value = {"pages": [
        {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "page_marker": "2/4",
         "duplicate_of": None, "has_receiver_stamp": False, "confidence": .95}]}
    pipe = VisionPipeline(client, "test-model", invoice_first=True)
    res = pipe._classify_batch({1: b"png1"})
    assert res[0]["page_marker"] == "2/4"


def test_page_marker_never_removes_a_sheet():
    """Marker-equal named duplicates are STILL read (DMS-26 p2 / DMS-27 p3 print a repeated position yet
    carry real rows); the fold, not the selection, decides what a true reprint contributes."""
    entries = [
        {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "duplicate_of": None,
         "page_marker": "1/4"},
        {"page": 2, "page_type": "TAX_INVOICE", "is_copy": True, "duplicate_of": 1,
         "page_marker": "2/4"},
        {"page": 3, "page_type": "TAX_INVOICE", "is_copy": True, "duplicate_of": 1,
         "page_marker": "1/4"},
        {"page": 4, "page_type": "TAX_INVOICE", "is_copy": True, "duplicate_of": 1,
         "page_marker": None},
    ]
    assert select_invoice_pages(entries) == [1, 2, 3, 4]


def test_extract_accepts_dash_formatted_thai_tax_id():
    """0-1455-48001-54-9 is a printed Thai tax ID: extract keeps it verbatim, shape accepts it."""
    printed = "เลขประจำตัวผู้เสียภาษี TAX ID : 0-1455-48001-54-9"
    v = extract_value("supplier_tax_id", printed)[0]
    assert v == "0-1455-48001-54-9"
    assert shape_ok("supplier_tax_id", v)


def test_tax_worded_candidate_beats_bare_number():
    """A tax number printed under TAX ID wording outranks a shape-valid bare number from an
    earlier page (DMS-46: the p1 number is not the supplier tax id; the PO sheet states it)."""
    bare = (1, {"text": "0145555000137", "confidence": .9, "bbox": [1, 1, 2, 2]})
    worded = (3, {"text": "TAX ID : 0-1455-48001-54-9", "confidence": .9, "bbox": [1, 1, 2, 2]})
    page, it = pick_field_reading("supplier_tax_id", [bare], [worded], 1)
    assert page == 3
    page, it = pick_candidate("supplier_tax_id", [bare, worded], 1)
    assert page == 3


def _loop4_pdf(pages_text):
    import fitz
    doc = fitz.open()
    for i, t in enumerate(pages_text):
        p = doc.new_page(width=595, height=842)
        p.insert_text((60, 100 + i * 30), t, fontsize=9)
    b = doc.tobytes()
    doc.close()
    return b


def test_weak_tax_triggers_rescue_and_worded_reading_wins(monkeypatch):
    """A bare (un-worded) tax number on the invoice sheet is weak evidence: the bounded rescue reads
    the PO sheet and the TAX-ID-worded reading becomes the field (DMS-46)."""
    from system_a.perception.vision_pipeline import VisionPipeline

    pdf_bytes = _loop4_pdf(["PAGE 1 INVOICE IV69-0410", "PAGE 2 PURCHASE ORDER 43043106"])

    class FakeTaxVlm:
        def __init__(self):
            self.last_usage, self.last_salvaged = {}, False
            self.page_reads = 0

        def chat_json(self, model, system, user, *, images=None, **kw):
            if "Classify these" in user:
                return {"pages": [
                    {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": .95,
                     "prints_tax_id": False},
                    {"page": 2, "page_type": "PO", "is_copy": False, "confidence": .95,
                     "prints_tax_id": True}]}
            if "Digitise" in user:
                return {"rows": []}
            self.page_reads += 1
            if self.page_reads == 1:                       # invoice sheet: a bare number, no wording
                return {"doc_type": "invoice", "items": [
                    {"type": "header", "label": "doc_no", "text": "IV69-0410", "bbox_2d": [60, 90, 400, 105]},
                    {"type": "header", "label": "doc_title", "text": "ใบส่งสินค้า / ใบกำกับภาษี INVOICE / TAX INVOICE",
                     "bbox_2d": [60, 60, 400, 88]},
                    {"type": "header", "label": "supplier_name", "text": "บริษัท จารุณรัตน์ ผลิตภัณฑ์ จำกัด",
                     "bbox_2d": [60, 120, 400, 145]},
                    {"type": "header", "label": "customer_name", "text": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",
                     "bbox_2d": [60, 150, 400, 175]},
                    {"type": "header", "label": "customer_tax_id", "text": "0107545000179",
                     "bbox_2d": [60, 180, 400, 200]},
                    {"type": "header", "label": "supplier_tax_id", "text": "0145555000137",
                     "bbox_2d": [60, 210, 400, 230]},
                    {"type": "total", "label": "sub_total", "text": "6,470.00", "bbox_2d": [700, 700, 900, 715]},
                    {"type": "total", "label": "vat", "text": "386.50", "bbox_2d": [700, 720, 900, 735]},
                    {"type": "total", "label": "grand_total", "text": "6,856.50", "bbox_2d": [700, 740, 900, 755]}]}
            return {"doc_type": "purchase_order", "items": [   # PO sheet states the real supplier TAX ID
                {"type": "header", "label": "supplier_tax_id",
                 "text": "เลขประจำตัวผู้เสียภาษี TAX ID : 0-1455-48001-54-9", "bbox_2d": [60, 100, 420, 122]}]}

    pipe = VisionPipeline(FakeTaxVlm(), "fake-model", do_crops=False, invoice_first=True)
    ext = pipe.extract(pdf_bytes, package_id="PKG-T", dms_doc_id="DMS-T")
    assert [r["page"] for r in ext.extra["field_rescue"]] == [2]
    assert "supplier_tax_id" in ext.extra["field_rescue"][0]["fields"]
    assert ext.fields["supplier_tax_id"].raw == "0-1455-48001-54-9"
    assert "crop_reread" not in [c["kind"] for c in pipe.calls]


def test_corroborate_oracle_rewrites_failed_supplier_tax_from_po_master():
    """Tax field unreadable + a receipt confirmed through the PO with the vendor tax resolved from
    the PO master (source oracle_po) -> the master value becomes the field (tagged)."""
    from system_a.domain.evidence import corroborate_oracle
    from system_a.domain.contracts import InvoiceDoc, NField, OracleSnapshot, ReceiptRow

    def mk():
        return InvoiceDoc(document_id="D1", fields={"supplier_tax_id": NField(
            name="supplier_tax_id", element_id="F1", raw="เลขประจำตัวผู้เสียภาษี 010556004925",
            value="010556004925", confidence=.7, ok=False,
            null_reason="TAX_ID_NOT_13_DIGITS")}, lines=(), signatures={}, pages_complete=True)
    row = ReceiptRow(org_id=176, receipt_num="R1", receiver=None, line=1, item="A",
                     qty=Decimal(1), uom="PCS", unit_price=Decimal(1), line_amount=Decimal(1),
                     supplier_tax_id="0105556094925")
    snap = OracleSnapshot(queried_at="x", lookup_path="RCV-V02",
                          query_keys={"supplier_tax_id": "0105556094925",
                                      "supplier_tax_id_source": "oracle_po"},
                          rows=(row,), row_cap_hit=False, calls=[])
    std = type("Std", (), {"policy": {"evidence": {"oracle": True}}, "entities": {}})()
    out = corroborate_oracle(mk(), snap, std)
    fld = out.fields["supplier_tax_id"]
    assert fld.ok and fld.value == "0105556094925"
    assert "oracle:supplier_tax_id_from_po" in fld.evidence

    # source 'ocr' (value came from OUR read) must never rewrite anything
    snap_ocr = OracleSnapshot(queried_at="x", lookup_path="RCV-V02",
                              query_keys={"supplier_tax_id": "010556004925",
                                          "supplier_tax_id_source": "ocr"},
                              rows=(row,), row_cap_hit=False, calls=[])
    out2 = corroborate_oracle(mk(), snap_ocr, std)
    assert not out2.fields["supplier_tax_id"].ok


def test_corroborate_oracle_keeps_ok_tax_field_untouched():
    from system_a.domain.evidence import corroborate_oracle
    from system_a.domain.contracts import InvoiceDoc, NField, OracleSnapshot, ReceiptRow
    doc = InvoiceDoc(document_id="D1", fields={"supplier_tax_id": NField(
        name="supplier_tax_id", element_id="F1", raw="0105556094925", value="0105556094925",
        confidence=.9, ok=True)}, lines=(), signatures={}, pages_complete=True)
    row = ReceiptRow(org_id=176, receipt_num="R1", receiver=None, line=1, item="A",
                     qty=Decimal(1), uom="PCS", unit_price=Decimal(1), line_amount=Decimal(1),
                     supplier_tax_id="0145555000137")
    snap = OracleSnapshot(queried_at="x", lookup_path="RCV-V02",
                          query_keys={"supplier_tax_id": "0145555000137",
                                      "supplier_tax_id_source": "oracle_po"},
                          rows=(row,), row_cap_hit=False, calls=[])
    std = type("Std", (), {"policy": {"evidence": {"oracle": True}}, "entities": {}})()
    out = corroborate_oracle(doc, snap, std)
    assert out.fields["supplier_tax_id"].value == "0105556094925"


# ------------------------------------------------- Loop 5: dashed-first tax, oracle party fix, money usability
def test_worded_secondary_beats_bare_primary_and_worded_primary_beats_worded_secondary():
    """Tiered tax picking: no invoice sheet states the taxpayer line -> the PO sheet's worded reading
    answers (DMS-46); once an invoice sheet states it with wording, a worded (even dashed) secondary
    reading cannot outrank it (DMS-19: a PO form's TAX line is the buyer's own); and a value two sheets
    reprint identically settles the field before any worded single reading (majority first)."""
    bare_primary = (1, {"text": "0145555000137", "confidence": .9, "bbox": [1, 1, 2, 2]})
    worded_secondary = (3, {"text": "เลขประจำตัวผู้เสียภาษี TAX ID : 0-1455-48001-54-9",
                            "confidence": .9, "bbox": [1, 1, 2, 2]})
    page, _it = pick_field_reading("supplier_tax_id", [bare_primary], [worded_secondary], 1)
    assert page == 3
    worded_primary = (1, {"text": "เลขประจำตัวผู้เสียภาษี 0115538001783", "confidence": .9,
                          "bbox": [1, 1, 2, 2]})
    worded_secondary2 = (4, {"text": "เลขประจำตัวผู้เสียภาษี TAX ID : 0-1455-48001-55-7",
                             "confidence": .9, "bbox": [1, 1, 2, 2]})
    page, _it = pick_field_reading("supplier_tax_id", [worded_primary], [worded_secondary2], 1)
    assert page == 1
    twin1 = (1, {"text": "0115538001783", "confidence": .9, "bbox": [1, 1, 2, 2]})
    twin2 = (2, {"text": "เลขประจำตัวผู้เสียภาษี 0115538001783", "confidence": .9, "bbox": [1, 1, 2, 2]})
    page, _it = pick_field_reading("supplier_tax_id", [twin1], [twin2, worded_secondary2], 1)
    assert page == 1     # repeated value wins before the worded-secondary tier is consulted


def test_corroborate_overwrites_supplier_tax_equal_to_customer_tax_via_po_master():
    """A supplier tax that EQUALS the customer's tax id is not the supplier (DMS-30: the PO form's
    taxpayer line is the buyer's own). When the lookup rode the PO master to a receipt
    (source oracle_po), the master value replaces the mislabelled field."""
    from system_a.domain.evidence import corroborate_oracle
    from system_a.domain.contracts import InvoiceDoc, NField, OracleSnapshot, ReceiptRow
    doc = InvoiceDoc(document_id="D1", fields={
        "supplier_tax_id": NField(name="supplier_tax_id", element_id="F1", raw="0-1075-45000-17-9",
                                  value="0107545000179", confidence=.9, ok=True),
        "customer_tax_id": NField(name="customer_tax_id", element_id="F2", raw="0107545000179",
                                  value="0107545000179", confidence=.9, ok=True)},
        lines=(), signatures={}, pages_complete=True)
    row = ReceiptRow(org_id=101, receipt_num="R1", receiver=None, line=1, item="A",
                     qty=Decimal(1), uom="PCS", unit_price=Decimal(1), line_amount=Decimal(1),
                     supplier_tax_id="0105556094925", customer_tax_id="0107545000179")
    snap = OracleSnapshot(queried_at="x", lookup_path="RCV-V02",
                          query_keys={"supplier_tax_id": "0105556094925",
                                      "supplier_tax_id_source": "oracle_po"},
                          rows=(row,), row_cap_hit=False, calls=[])
    std = type("Std", (), {"policy": {"evidence": {"oracle": True}}, "entities": {}})()
    out = corroborate_oracle(doc, snap, std)
    fld = out.fields["supplier_tax_id"]
    assert fld.ok and fld.value == "0105556094925"
    assert "oracle:supplier_tax_id_from_po" in fld.evidence


def test_corroborate_never_rewrites_a_supplier_tax_oracle_does_not_call_the_customer():
    """DMS-46: the printed PO form states the supplier's TAX ID and the doc's own (contaminated)
    customer field equals it - the EBS receipt rows do NOT name that number as the customer, so the
    read stands: the PO master's different tax id must not overwrite a corroborated printed field."""
    from system_a.domain.evidence import corroborate_oracle
    from system_a.domain.contracts import InvoiceDoc, NField, OracleSnapshot, ReceiptRow
    doc = InvoiceDoc(document_id="D1", fields={
        "supplier_tax_id": NField(name="supplier_tax_id", element_id="F1", raw="0-1455-48001-54-9",
                                  value="0145548001549", confidence=.9, ok=True),
        "customer_tax_id": NField(name="customer_tax_id", element_id="F2", raw="0145548001549",
                                  value="0145548001549", confidence=.9, ok=True)},
        lines=(), signatures={}, pages_complete=True)
    row = ReceiptRow(org_id=176, receipt_num="R1", receiver=None, line=1, item="A",
                     qty=Decimal(1), uom="PCS", unit_price=Decimal(1), line_amount=Decimal(1),
                     supplier_tax_id="0145555000137", customer_tax_id="0107545000179")
    snap = OracleSnapshot(queried_at="x", lookup_path="TAX-INV",
                          query_keys={"supplier_tax_id": "0145555000137",
                                      "supplier_tax_id_source": "oracle_po"},
                          rows=(row,), row_cap_hit=False, calls=[])
    std = type("Std", (), {"policy": {"evidence": {"oracle": True}}, "entities": {}})()
    out = corroborate_oracle(doc, snap, std)
    assert out.fields["supplier_tax_id"].value == "0145548001549"


def test_corroborate_keeps_distinct_supplier_tax_even_when_po_master_exists():
    from system_a.domain.evidence import corroborate_oracle
    from system_a.domain.contracts import InvoiceDoc, NField, OracleSnapshot, ReceiptRow
    doc = InvoiceDoc(document_id="D1", fields={
        "supplier_tax_id": NField(name="supplier_tax_id", element_id="F1", raw="0105537063173",
                                  value="0105537063173", confidence=.9, ok=True),
        "customer_tax_id": NField(name="customer_tax_id", element_id="F2", raw="0145548001557",
                                  value="0145548001557", confidence=.9, ok=True)},
        lines=(), signatures={}, pages_complete=True)
    row = ReceiptRow(org_id=101, receipt_num="R1", receiver=None, line=1, item="A",
                     qty=Decimal(1), uom="PCS", unit_price=Decimal(1), line_amount=Decimal(1),
                     supplier_tax_id="0999999999999")
    snap = OracleSnapshot(queried_at="x", lookup_path="RCV-V02",
                          query_keys={"supplier_tax_id": "0999999999999",
                                      "supplier_tax_id_source": "oracle_po"},
                          rows=(row,), row_cap_hit=False, calls=[])
    std = type("Std", (), {"policy": {"evidence": {"oracle": True}}, "entities": {}})()
    out = corroborate_oracle(doc, snap, std)
    assert out.fields["supplier_tax_id"].value == "0105537063173"


def test_unshaped_primary_amount_falls_to_secondary_reading():
    """'GRAND TOTAL BAHT (ถ้ามี...)' is not a usable reading of an amount: the secondary sheet's
    real number answers (DMS-20, the page reader caught a label box)."""
    garbage = (1, {"text": "GRAND TOTAL BAHT (ถ้ามีหนังสือหักภาษี)", "confidence": .9,
                   "bbox": [1, 1, 2, 2]})
    real = (2, {"text": "52,660.05", "confidence": .9, "bbox": [1, 1, 2, 2]})
    page, it = pick_field_reading("grand_total", [garbage], [real], 1)
    assert page == 2 and it["text"] == "52,660.05"


def test_named_duplicate_stamped_sheet_is_read_and_its_totals_are_used():
    """A stamped copy-named sheet is READ anyway (selection never drops content): its totals answer the
    header the original sheet does not print, and no rescue pass is needed (DMS-24)."""
    from system_a.perception.vision_pipeline import VisionPipeline

    pdf_bytes = _loop4_pdf(["PAGE 1 TAX INVOICE IV9", "PAGE 2 STAMPED COPY SHEET"])

    class FakeMoneyVlm:
        def __init__(self):
            self.last_usage, self.last_salvaged = {}, False
            self.page_reads = 0

        def chat_json(self, model, system, user, *, images=None, **kw):
            if "Classify these" in user:
                return {"pages": [
                    {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": .95,
                     "page_marker": "1/1"},
                    {"page": 2, "page_type": "TAX_INVOICE", "is_copy": True, "duplicate_of": 1,
                     "page_marker": "1/1", "has_receiver_stamp": True, "confidence": .9}]}
            if "Digitise" in user:
                return {"rows": []}
            self.page_reads += 1
            if self.page_reads == 1:      # no amounts, supplier tax with its wording printed
                return {"doc_type": "tax_invoice", "items": [
                    {"type": "header", "label": "doc_no", "text": "IV9", "bbox_2d": [60, 90, 400, 105]},
                    {"type": "header", "label": "doc_title", "text": "ใบกำกับภาษี TAX INVOICE",
                     "bbox_2d": [60, 60, 400, 88]},
                    {"type": "header", "label": "supplier_name", "text": "บริษัท เอ บี ซี จำกัด",
                     "bbox_2d": [60, 120, 400, 145]},
                    {"type": "header", "label": "customer_name", "text": "บริษัท อัปโก้ จำกัด",
                     "bbox_2d": [60, 150, 400, 175]},
                    {"type": "header", "label": "customer_tax_id", "text": "0107545000179",
                     "bbox_2d": [60, 180, 400, 200]},
                    {"type": "header", "label": "supplier_tax_id",
                     "text": "เลขประจำตัวผู้เสียภาษี 0105556094925", "bbox_2d": [60, 210, 400, 230]}]}
            return {"doc_type": "tax_invoice", "items": [   # the stamped sheet carries the totals
                {"type": "total", "label": "sub_total", "text": "1,000.00", "bbox_2d": [700, 700, 900, 715]},
                {"type": "total", "label": "vat", "text": "70.00", "bbox_2d": [700, 720, 900, 735]},
                {"type": "total", "label": "grand_total", "text": "1,070.00", "bbox_2d": [700, 740, 900, 755]}]}

    pipe = VisionPipeline(FakeMoneyVlm(), "fake-model", do_crops=False, invoice_first=True)
    ext = pipe.extract(pdf_bytes, package_id="PKG-M", dms_doc_id="DMS-M")
    assert ext.extra["invoice_pages"] == [1, 2]           # selection keeps the named duplicate
    assert ext.extra["field_rescue"] == []                # it was read outright - nothing to rescue
    assert ext.fields["grand_total"].raw == "1,070.00"
    assert ext.extra["classify"] and ext.extra["classify"][1]["duplicate_of"] == 1


def test_po_derivation_replaces_unsupported_shape_valid_po():
    """A shape-valid 8-digit PO that the item rows never print is not the PO when EXACTLY one PO is
    (DMS-33: the text layer's internal doc number beat the real PO; the rows print 40118928(+139))."""
    from system_a.perception.vision_pipeline import po_from_lines
    from system_a.domain.contracts import RawField, Region
    fields = {"po_number": RawField(raw="34000183", confidence=0.6, agreement=False,
                                    region=Region(page=1, bbox=[1, 1, 2, 2]), source="consensus",
                                    null_reason="CONFLICT_BETWEEN_SOURCES")}

    class R:
        items = [{"type": "line", "label": "line_1", "text": "BOLT 10 40118928139 5",
                  "bbox": [40, 330, 950, 350]}]
    log: list = []
    po_from_lines(fields, {1: R()}, [1], log, {})
    assert fields["po_number"].raw == "40118928"
    assert log and log[-1]["derived"] == "40118928"
