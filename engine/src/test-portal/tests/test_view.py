"""The screen model: the payload System A returns in, the browser out - nothing invented on the way.

Every assertion here compares the screen against the **same bytes in the payload**, because that is the whole
point of the portal: what is drawn is what System A decided.  The fixtures are genuine ``result/3.0`` payloads
made by System A's own ``orchestrator.validate()`` in sandbox mode - see ``synth.py``.
"""
from collections import Counter
import copy

import pytest

import synth
from webapp.view import COLORS, DEFAULT_TYPES, ELEMENT_TYPES, PayloadError, build_view, element_view, text_of


# --------------------------------------------------------------------------- what goes in
def test_a_result_3_0_payload_becomes_a_screen_and_nothing_else_is_claimed(payload):
    from system_a.application.assembler import CONTRACT, SCHEMA_VERSION

    v = build_view(payload)
    assert v["contract"] == payload["contract"] == CONTRACT == "aiva.system_a.result/3.0"
    # The screen echoes whatever version System A stamped - so compare against System A's own constant,
    # not a number written here (schema went 3.0 -> 3.1 with the additive evidence rows of v5.7).
    assert v["versions"] == payload["versions"] and v["versions"]["schema"] == SCHEMA_VERSION
    assert v["versions"]["standard"].startswith("6.6") and v["versions"]["ruleset"]
    assert set(v["versions"]["models"]) == {"line_matcher", "qty_judge", "entity_judge"}
    assert set(v["versions"]["prompts"]) == {"V-05", "V-07", "V-08"}
    assert v["package"] == payload["package"]
    assert v["package"]["coordinate_system"]["bbox_format"] == "[x, y, w, h]"
    assert v["package"]["coordinate_system"]["origin"] == "top-left"      # the UI's assumption, stated by System A
    assert v["request"]["validation_id"] == payload["request"]["validation_id"]
    assert v["integrity"] == payload["integrity"]
    assert v["metrics"] == payload["metrics"]
    assert v["recommendation"]["value"] == "AUTO_PASS" and v["cls"] == "ok" and v["incomplete"] is False
    assert v["seconds"] == round(payload["metrics"]["duration_ms"]["total_ms"] / 1000, 2)
    assert v["documents"][0]["id"] == payload["documents"][0]["document_id"]
    assert v["counts"]["elements"] == len(payload["ocr"]["elements"])     # every element is accounted for


def test_a_payload_that_is_not_result_3_0_is_refused(payload):
    for bad in (dict(payload, contract="aiva.system_a.result/2.0"), {k: v for k, v in payload.items() if k != "contract"}):
        with pytest.raises(PayloadError, match="result/3.0"):
            build_view(bad)


def test_a_payload_missing_part_of_the_contract_is_refused(payload):
    for key in ("versions", "pages", "ocr", "normalized_fields", "rule_results"):
        broken = {k: v for k, v in payload.items() if k != key}
        with pytest.raises(PayloadError, match="incomplete result/3.0"):
            build_view(broken)


def test_an_ordinary_object_is_not_a_payload():
    for bad in (None, [], "contract"):
        with pytest.raises(PayloadError):
            build_view(bad)


# --------------------------------------------------------------------------- boxes
def test_every_box_is_exactly_one_element_of_the_payload_at_the_coordinates_it_gave(payload, elements):
    v = build_view(payload)
    assert len(v["elements"]) == len(elements)
    for eid, box in v["elements"].items():
        e = elements[eid]
        assert box["bbox"] == e["bbox"], eid                                # never moved, scaled or rounded
        assert box["type"] == e["element_type"] and box["page"] == e["page_no"]
        assert box["field"] == e["field_name"] and box["raw"] == e["raw_value"]
        assert box["value"] == e["normalized_value"] and box["conf"] == e["confidence"]
        assert box["parent"] == e["parent_id"] and box["source_ref"] == e["source_reference"]
        assert box["has_bbox"] is True


def test_a_box_says_what_the_payload_said_and_falls_back_to_the_field_it_carries():
    assert text_of({"raw_value": "1,337.50", "normalized_value": "1337.50"}) == "1,337.50"
    assert text_of({"raw_value": None, "normalized_value": "2026-01-02"}) == "2026-01-02"
    assert text_of({"raw_value": "", "normalized_value": False, "field_name": "signatures.sender"}) == "signatures.sender"
    assert text_of({"element_id": "X1", "element_type": "word"}) == "X1"
    assert element_view({"element_id": "X1", "element_type": "word", "bbox": [0, 0, 1, 1]})["has_bbox"] is True
    for no_box in ({}, {"bbox": None}, {"bbox": [0, 0, 1]}, {"bbox": "0,0,1,1"}):
        assert element_view(dict(no_box, element_id="X1"))["has_bbox"] is False


def test_the_kinds_of_boxes_that_exist_are_the_kinds_the_payload_holds(payload):
    v = build_view(payload)
    assert Counter(e["type"] for e in v["elements"].values()) == Counter(
        x["element_type"] for x in payload["ocr"]["elements"])
    assert set(v["types"]) == {x["element_type"] for x in payload["ocr"]["elements"]}
    assert v["types_default"] == [t for t in DEFAULT_TYPES if t in v["types"]]
    assert set(COLORS) == set(ELEMENT_TYPES) and set(v["colors"]) == set(COLORS)


def test_each_page_carries_its_own_geometry_and_the_elements_that_are_on_it(payload):
    v = build_view(payload)
    assert len(v["pages"]) == len(payload["pages"]) == v["counts"]["pages"] == 1
    page, src = v["pages"][0], payload["pages"][0]
    assert (page["page"], page["width_pt"], page["height_pt"]) == (src["page_no"], src["width_pt"], src["height_pt"])
    assert page["rotation"] == src["rotation"] and page["render_dpi"] == src["render_dpi"]
    assert page["page_type"] == src["page_type"] and page["ocr_quality"] == src["ocr_quality"]
    assert sorted(page["elements"]) == sorted(x["element_id"] for x in payload["ocr"]["elements"] if x["page_no"] == 1)
    assert all(e["page"] == page["page"] for e in v["elements"].values() if e["id"] in page["elements"])


def test_elements_are_reachable_as_themselves_as_well(payload):
    """The UI looks an element up by id alone - a ref must not depend on which page is open."""
    v = build_view(payload)
    for eid, box in v["elements"].items():
        assert v["elements"][eid] is box and box["id"] == eid


def test_an_element_on_a_page_the_payload_never_described_is_still_shown(payload):
    p = dict(payload)
    p["pages"] = []
    v = build_view(p)
    assert [q["page"] for q in v["pages"]] == [1]
    assert v["pages"][0]["width_pt"] is None and v["pages"][0]["elements"]
    assert v["counts"]["no_bbox"] == 0                                     # its boxes still exist


def test_an_element_without_a_box_is_counted_not_invented(payload):
    p = dict(payload)
    els = [dict(e) for e in payload["ocr"]["elements"]]
    els[0]["bbox"] = None
    els[1].pop("bbox")
    p["ocr"] = dict(payload["ocr"], elements=els)
    v = build_view(p)
    assert v["counts"]["no_bbox"] == 2
    assert v["counts"]["boxes"] == len(v["elements"]) - 2
    assert sum(len(q["elements"]) for q in v["pages"]) == len(v["elements"])   # still listed, never drawn


# --------------------------------------------------------------------------- final values
def test_the_final_fields_are_the_payloads_and_point_at_the_element_each_was_read_from(payload):
    v = build_view(payload)
    nf = payload["normalized_fields"]
    got = {f["key"]: f for f in v["final"]["items"]}
    assert set(got) == {"invoice_num", "invoice_date", "po_number", "supplier_name", "supplier_tax_id",
                        "currency", "sub_total", "vat", "grand_total"}
    for key in got:
        assert got[key]["value"] == nf[key], key                           # exactly what System A decided
    assert got["invoice_num"]["refs"] == ["D1-f-invoice_num"]
    assert got["grand_total"]["refs"] == ["D1-f-grand_total"]
    assert got["supplier_tax_id"]["refs"] == ["D1-f-supplier_tax_id"]
    for r in v["final"]["refs"]:
        assert r in v["elements"] and v["elements"][r]["has_bbox"]
    assert v["final"]["summary"] == nf["items_summary"] and v["final"]["summary"]["line_count"] == 2
    assert v["final"]["buyer"]["tax_id"] == nf["customer_tax_id"]
    assert v["final"]["source"] == "normalized_fields"


def test_a_final_value_the_reading_never_found_is_shown_as_missing(payload):
    p = dict(payload)
    nf = dict(payload["normalized_fields"], po_number=None)
    p["normalized_fields"] = dict(nf, items=nf["items"])
    p["ocr"] = dict(payload["ocr"], elements=[e for e in payload["ocr"]["elements"]
                                              if e["element_id"] != "D1-f-po_number"])
    v = build_view(p)
    po = {f["key"]: f for f in v["final"]["items"]}["po_number"]
    assert po["value"] is None and po["refs"] == []                        # no box is claimed for it


# --------------------------------------------------------------------------- lines
def test_each_final_line_is_the_payloads_and_carries_the_element_behind_it(payload):
    v = build_view(payload)
    items = payload["normalized_fields"]["items"]
    assert len(v["lines"]["items"]) == len(items)
    for l, it in zip(v["lines"]["items"], items):
        assert (l["no"], l["desc"], l["qty"], l["uom"]) == (it["line_no"], it["description"], it["qty"], it["uom"])
        assert l["unit_price"] == it["unit_price"] and l["amount"] == it["amount"]
        assert l["page"] == it["page_no"] and l["bbox"] == it["bbox"]
        assert l["ref"] == it["element_id"] in v["elements"]
        assert l["cells_ok"] == it["cells_ok"] and l["line_math"] == it["line_math"]
    assert v["lines"]["refs"] == [i["element_id"] for i in items]
    assert v["lines"]["ai_rejected"] == payload["line_matching"]["ai_rejected"]
    assert v["lines"]["unmatched_rcv_line_ids"] == payload["line_matching"]["unmatched_rcv_line_ids"]
    assert v["lines"]["source"] == "normalized_fields.items + line_matching.groups"


def test_a_line_carries_the_group_system_a_matched_it_to(payload):
    v = build_view(payload)
    groups = {g["group_id"]: g for g in payload["line_matching"]["groups"]}
    for l in v["lines"]["items"]:
        g = next(g for g in groups.values() if l["no"] in g["invoice_line_nos"])
        assert l["match"]["group_id"] == g["group_id"] and l["match"]["level"] == g["level"]
        assert l["match"]["relation"] == g["relation"] and l["match"]["rcv_line_ids"] == g["rcv_line_ids"]
        assert l["match"]["source"] == g["source"] and l["match"]["rationale"] == g["rationale"]


def test_lines_the_ai_rejected_are_listed_not_silently_dropped(payload):
    p = dict(payload)
    lm = dict(payload["line_matching"], ai_rejected=[{"line_no": 2, "reason": "ต่างชนิดกัน"}],
               unmatched_rcv_line_ids=["RCV-9"])
    p["line_matching"] = lm
    v = build_view(p)
    assert v["lines"]["ai_rejected"] == [{"line_no": 2, "reason": "ต่างชนิดกัน"}]
    assert v["lines"]["unmatched_rcv_line_ids"] == ["RCV-9"]
    assert {x["kind"] for x in v["lines"]["extra"]} == {"ai_rejected", "unmatched_rcv_line"}
    assert v["counts"]["elements"] == len(payload["ocr"]["elements"])      # the invoice itself is untouched


# --------------------------------------------------------------------------- signatures, Oracle, verdict
def test_signatures_come_from_the_signature_elements_of_the_payload(payload):
    v = build_view(payload)
    src = {e["field_name"].split(".")[-1]: e for e in payload["ocr"]["elements"] if e["element_type"] == "signature"}
    assert {s["slot"] for s in v["signatures"]} == set(src)
    for s in v["signatures"]:
        e = src[s["slot"]]
        assert s["present"] == e["normalized_value"] and s["conf"] == e["confidence"] and s["page"] == e["page_no"]
        assert s["refs"] == [e["element_id"]]


def test_the_verdict_shows_the_rules_the_payload_lists_with_their_own_results(payload):
    v = build_view(payload)
    assert [r["id"] for r in v["rules"]] == [r["rule_id"] for r in payload["rule_results"]]
    assert all(r["result"] == "pass" for r in v["rules"])
    assert [r["result"] for r in v["rules"]] == [r["result"] for r in payload["rule_results"]]
    assert all(r["version"] for r in v["rules"]) and all("data" in r for r in v["rules"])
    assert v["recommendation"]["codes"] == []


def test_what_oracle_answered_is_reported_as_the_payload_records_it(payload):
    v = build_view(payload)
    o = payload["oracle_snapshot"]
    assert v["receipt"]["queried"] is True and v["receipt"]["path"] == o["lookup_path"]
    assert v["receipt"]["receipt_nums"] == o["receipt_nums"] and v["receipt"]["po_numbers"] == o["po_numbers"]
    assert v["receipt"]["receiver"] == o["receiver"] and v["receipt"]["fingerprint"] == o["fingerprint"]
    assert v["receipt"]["matched_on"] == o["matched_on_column"]
    assert v["receipt"]["query_keys"]["invoice_num"] == payload["normalized_fields"]["invoice_num"]
    assert v["receipt"]["unknown"] is False


# --------------------------------------------------------------------------- the two lists, side by side
def test_the_oracle_half_of_the_table_is_the_payload_s_own_receipt_lines(payload):
    v = build_view(payload)
    src = payload["oracle_snapshot"]["receipt_lines"]
    o = v["oracle_lines"]
    assert o["queried"] is True and o["source"].startswith("oracle_snapshot")
    assert [x["id"] for x in o["items"]] == [r["rcv_line_id"] for r in src]          # same rows, same order
    for got, row in zip(o["items"], src):
        assert (got["item"], got["qty"], got["uom"], got["unit_price"], got["amount"]) == (
            row["item"], row["qty"], row["uom"], row["unit_price"], row["line_amount"])
        assert got["receipt"] == row["receipt_num"] and got["line"] == row["line"]
        assert got["po_number"] == (row.get("po_number") or (row.get("extra") or {}).get("PO_NUM"))
    assert o["counts"]["rows"] == len(src) == 2


def test_the_screen_adds_no_number_of_its_own_to_an_oracle_row(extra_rcv_payload):
    v = build_view(extra_rcv_payload)
    src = {r["rcv_line_id"]: r for r in extra_rcv_payload["oracle_snapshot"]["receipt_lines"]}
    for o in v["oracle_lines"]["items"]:
        row = src[o["id"]]
        for key in ("item", "qty", "uom", "unit_price", "line_amount"):
            assert o[{"line_amount": "amount"}.get(key, key)] == row[key], key
        assert o["source"] == "oracle_snapshot"                                  # it really came from the snapshot
        assert o["status"] in ("matched", "ai_rejected", "invoice_has_no_line", "qty_zero", "unmatched")


def test_every_oracle_row_names_the_invoice_lines_the_payload_joined_it_to(extra_rcv_payload):
    v = build_view(extra_rcv_payload)
    groups = extra_rcv_payload["line_matching"]["groups"]
    want = {rid: sorted(g["invoice_line_nos"]) for g in groups for rid in g["rcv_line_ids"]}
    for o in v["oracle_lines"]["items"]:
        assert o["line_nos"] == want.get(o["id"], [])                           # the group's own line numbers
        assert [x["group_id"] for x in o["groups"]] == [g["group_id"] for g in groups
                                                        if o["id"] in g["rcv_line_ids"]]


def test_a_receipt_row_the_invoice_cannot_claim_is_listed_and_counted(extra_rcv_payload):
    v = build_view(extra_rcv_payload)
    lone = extra_rcv_payload["line_matching"]["unmatched_rcv_line_ids"]
    assert len(lone) == 1
    got = [o for o in v["oracle_lines"]["items"] if o["status"] != "matched"]
    assert [o["id"] for o in got] == [lone[0]]                                  # exactly what V-07 left over
    assert got[0]["item"] == "SYNTH LEFTOVER VALVE" and got[0]["line_nos"] == []
    assert v["oracle_lines"]["counts"] == {"rows": 3, "matched": 2, "rejected": 0, "unclaimed": 1, "qty_zero": 0}


def test_a_row_that_cannot_be_matched_because_its_qty_is_zero_says_so(qty_zero_payload):
    v = build_view(qty_zero_payload)
    zero = [o for o in v["oracle_lines"]["items"] if o["status"] == "qty_zero"]
    assert [o["item"] for o in zero] == ["SYNTH CANCELLED LINE"] and zero[0]["qty"] == "0"
    assert v["oracle_lines"]["counts"]["qty_zero"] == 1 and v["oracle_lines"]["counts"]["unclaimed"] == 0
    # and that label is the truth: System A really kept the row out of the match, not even as a leftover
    assert all("RCV-0000010001-3" not in g["rcv_line_ids"] for g in qty_zero_payload["line_matching"]["groups"])
    assert qty_zero_payload["line_matching"]["unmatched_rcv_line_ids"] == []


def test_an_invoice_line_with_nothing_to_match_against_keeps_its_row_with_an_empty_right_half(orphan_payload):
    v = build_view(orphan_payload)
    assert len(v["lines"]["items"]) == 3 and len(v["oracle_lines"]["items"]) == 2
    last = v["lines"]["items"][-1]
    assert last["desc"] == "SYNTH ORPHAN PART" and last["oracle"] == []
    assert last["match"]["relation"] == "UNMATCHED" and last["match"]["level"] == "NONE"
    assert all(l["oracle"] for l in v["lines"]["items"][:2])


def test_the_invoice_half_carries_its_own_pair_and_its_quantity_verdict(payload):
    v = build_view(payload)
    src = {i["line_no"]: i for i in payload["normalized_fields"]["items"]}
    for l in v["lines"]["items"]:
        s = src[l["no"]]
        assert l["item_code"] == s["item_code"] and l["uom_group"] == s["uom_group"]
        assert l["qty_check"] == s["qty_check"]                                 # V-08's own verdict, untouched
        assert [p["id"] for p in l["oracle"]] == [r["rcv_line_id"]
                                                  for r in (s["match"] or {}).get("receipt") or []]
        assert all(p["source"] in ("oracle_snapshot", "line_matching") for p in l["oracle"])
    assert v["lines"]["items"][0]["qty_check"]["result"] == "pass"


def test_an_oracle_that_answered_nothing_leaves_the_right_half_empty(hold_payload):
    v = build_view(hold_payload)
    assert v["oracle_lines"]["items"] == [] and v["oracle_lines"]["counts"]["rows"] == 0
    assert all(l["oracle"] == [] for l in v["lines"]["items"])                  # nothing paired, on every line
    assert {"queried", "path", "receipt_nums", "po_numbers"} <= set(v["receipt"])   # the header line is intact


def test_a_row_the_ai_proposed_and_the_rules_refused_is_labelled_as_such(payload):
    """V-08 may propose a receipt row a rule then refuses; the table has to say so, not call it matched."""
    p = copy.deepcopy(payload)
    rid = p["oracle_snapshot"]["receipt_lines"][1]["rcv_line_id"]
    p["line_matching"]["groups"] = [g for g in p["line_matching"]["groups"] if rid not in g["rcv_line_ids"]]
    p["line_matching"]["ai_rejected"] = [{"proposal": {"rcv_line_ids": [rid], "invoice_line_nos": [2]},
                                         "reason": "qty ไม่ตรงตามที่ PO อนุมัติ"}]
    v = build_view(p)
    row = [o for o in v["oracle_lines"]["items"] if o["id"] == rid][0]
    assert row["status"] == "ai_rejected" and row["ai_rejected"] == "qty ไม่ตรงตามที่ PO อนุมัติ"
    assert row["line_nos"] == [] and row["groups"] == []               # no group claims it any more
    assert v["oracle_lines"]["counts"]["rejected"] == 1
    # the invoice line still shows the pair V-08 proposed, because items[].match.receipt still names that row
    assert rid in [x["id"] for x in v["lines"]["items"][1]["oracle"]]


def test_a_reference_to_a_row_oracle_never_answered_is_shown_as_a_reference_only(payload):
    """items[].match.receipt can name a row the Oracle list has not: the screen shows the id, not invented values."""
    p = copy.deepcopy(payload)
    ghost = "RCV-9999999999-9"
    p["normalized_fields"]["items"][0]["match"]["receipt"].append({"rcv_line_id": ghost, "po_number": "50000001"})
    v = build_view(p)
    pair = [x for x in v["lines"]["items"][0]["oracle"] if x["id"] == ghost][0]
    assert pair["source"] == "line_matching" and pair["status"] == "outside_receipt"
    assert pair["item"] is None and pair["qty"] is None and pair["receipt"] is None   # nothing but the reference
    assert pair["po_number"] == "50000001"                              # what the thin copy really does carry
    assert ghost not in [o["id"] for o in v["oracle_lines"]["items"]]   # it is not passed off as an Oracle row


def test_search_covers_the_words_of_the_oracle_rows(extra_rcv_payload):
    v = build_view(extra_rcv_payload)
    assert "SYNTH LEFTOVER VALVE" in v["search"]["oracle_text"]
    assert "SYNTH LEFTOVER VALVE" not in v["search"]["elements_text"]            # it lives only in the Oracle list



# --------------------------------------------------------------------------- when System A says no
def test_a_hold_is_shown_as_an_error_with_the_reasons_and_the_elements_that_caused_it(hold_payload):
    v = build_view(hold_payload)
    assert v["recommendation"]["value"] == "HOLD" and v["cls"] == "error"
    assert v["recommendation"]["halted_by"] == hold_payload["recommendation"]["halted_by"]
    assert v["recommendation"]["codes"] == hold_payload["recommendation"]["exception_codes"]
    exc, src = v["exceptions"][0], hold_payload["exceptions"][0]
    assert (exc["id"], exc["code"], exc["name"], exc["severity"], exc["rule_id"]) == (
        src["exception_id"], src["code"], src["name"], src["severity"], src["rule_id"])
    assert exc["detail"] and v["rec"] == "HOLD"
    assert exc["refs"] and all(r in v["elements"] for r in exc["refs"])
    ev = {e["evidence_id"]: e for e in hold_payload["evidence"]}[src["evidence_ids"][0]]
    assert exc["refs"] == [r for r in ev["related_element_ids"] if r in v["elements"]]
    failed = [r for r in v["rules"] if r["result"] != "pass"]
    assert {r["id"] for r in failed} >= {"V-04"} and any(r["halted_by"] for r in failed)
    assert sum(1 for r in v["rules"] if r["result"] == "pass") < 9         # the run really did stop early


def test_evidence_pointing_at_an_element_the_payload_does_not_carry_is_reported(hold_payload):
    p = dict(hold_payload)
    p["ocr"] = dict(hold_payload["ocr"],
                    elements=[e for e in hold_payload["ocr"]["elements"] if e["element_id"] != "D1-f-invoice_num"])
    v = build_view(p)
    exc = v["exceptions"][0]
    assert exc["refs"] == ["D1-f-supplier_tax_id"]                         # only the element that still exists
    assert any("D1-f-invoice_num" in n for n in exc["missing_refs"])       # and the gap is said out loud


def test_a_system_error_makes_the_result_incomplete_and_is_shown_in_full(payload):
    p = dict(payload, system_errors=[{"stage": "step3", "kind": "InternalMismatch", "detail": "items != lines"}])
    v = build_view(p)
    assert v["incomplete"] is True and v["cls"] == "partial" and v["rec"] == "ผลไม่ครบ"
    assert v["dropped"] == p["system_errors"]
    assert v["recommendation"]["value"] == payload["recommendation"]["value"]     # its own verdict is kept too


# --------------------------------------------------------------------------- search
def test_search_finds_the_text_that_is_in_the_payload(payload):
    v = build_view(payload)
    assert "BRACKET ASSY" in v["search"]["elements_text"]
    assert payload["normalized_fields"]["supplier_name"] in v["search"]["fields_text"]
    assert "BRACKET ASSY" in v["search"]["lines_text"] and "1000.00" in v["search"]["lines_text"]
    assert "V-01 pass" in v["search"]["rules_text"]
    ids = v["search"]["phrases"]["BRACKET ASSY"]
    assert set(ids) <= set(v["elements"]) and all(v["elements"][i]["has_bbox"] for i in ids)
    assert "D1-L1-description" in ids and "D1-L1" in ids


def test_search_text_is_capped_so_a_huge_page_cannot_stall_the_browser(payload):
    p = dict(payload)
    els = [dict(e, raw_value=("ย" * 400)) for e in payload["ocr"]["elements"]]
    p["ocr"] = dict(payload["ocr"], elements=els)
    v = build_view(p)
    assert len(v["search"]["elements_text"]) <= 5000
    assert all(len(k) <= 240 for k in v["search"]["phrases"])
    assert len(v["search"]["phrases"]) <= 60


def test_a_field_value_that_is_not_a_string_does_not_break_the_search_text(payload):
    p = dict(payload, normalized_fields=dict(payload["normalized_fields"], vat=1337, po_number=50000001))
    v = build_view(p)
    assert v["counts"]["elements"] == len(payload["ocr"]["elements"])
    assert "50000001" not in v["search"]["fields_text"]                     # only text is searched, nothing coerced
    assert v["final"]["items"][2]["value"] == 50000001                      # the value itself is still shown
