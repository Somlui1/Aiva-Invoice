"""The browser half, proven for real: the actual ``webapp/static/app.js`` is run over real screen models.

``test_ui_static.py`` can only read app.js as text. This executes it — in a sandbox with the smallest DOM it
touches — and calls the panel functions with the view model the server sends for each fixture, then asserts on
the ``EVIDENCE`` line ``tests/probe_render.js`` prints per shape. That is where a typo in a template, a field
the model never carries, or a review row the filter hides by accident would show up. Skipped without node,
which the portal itself does not need.
"""
import copy
import json
import shutil
import subprocess
from pathlib import Path

import pytest

from webapp.view import build_view

ROOT = Path(__file__).resolve().parent.parent            # src/test-portal
NODE = shutil.which("node") or shutil.which("node.exe")
pytestmark = pytest.mark.skipif(NODE is None, reason="node is not installed")


def render(tmp_path, **views):
    """Draw each view model through app.js and return {shape: the evidence it produced}."""
    out = tmp_path / "views"
    out.mkdir()
    for name, v in views.items():
        (out / f"view_{name}.json").write_text(json.dumps(v, ensure_ascii=False), encoding="utf-8")
    done = subprocess.run([NODE, "tests/probe_render.js", str(out)], cwd=str(ROOT), capture_output=True,
                          text=True, encoding="utf-8", errors="replace", shell=False)   # the labels are Thai
    assert done.returncode == 0, done.stdout + done.stderr
    return {e["shape"]: e for e in (json.loads(line[len("EVIDENCE "):])
                                    for line in done.stdout.splitlines() if line.startswith("EVIDENCE "))}


def test_the_table_draws_every_row_of_both_lists(tmp_path, extra_rcv_payload, orphan_payload):
    ev = render(tmp_path, extra=build_view(extra_rcv_payload), orphan=build_view(orphan_payload))
    v_extra, v_orph = build_view(extra_rcv_payload), build_view(orphan_payload)

    assert ev["extra"]["oracle_ids"] == [o["id"] for o in v_extra["oracle_lines"]["items"]]
    assert ev["extra"]["invoice_descs"] == [l["desc"] for l in v_extra["lines"]["items"]]
    assert ev["extra"]["rows"] == 3 and ev["extra"]["pairs"] == 2          # the row V-07 left over is drawn too
    assert ev["extra"]["unclaimed"] == [extra_rcv_payload["line_matching"]["unmatched_rcv_line_ids"][0]]

    assert ev["orphan"]["rows"] == 3 and ev["orphan"]["pairs"] == 2        # an invoice line with no pair keeps it
    assert ev["orphan"]["alone"] == [orphan_payload["normalized_fields"]["items"][-1]["line_no"]]
    assert len(ev["orphan"]["oracle_ids"]) == 2 and len(ev["orphan"]["invoice_descs"]) == 3
    assert ev["orphan"]["chips"] == ["ทั้งหมด", "เฉพาะที่ต้องตรวจ"]      # the tester can narrow the view


def test_every_row_that_needs_review_survives_the_review_filter(tmp_path, extra_rcv_payload, qty_zero_payload,
                                                                orphan_payload, hold_payload):
    ev = render(tmp_path, extra=build_view(extra_rcv_payload), zero=build_view(qty_zero_payload),
                orphan=build_view(orphan_payload), none=build_view(hold_payload))
    assert "qty = 0 — System A ไม่ใช้จับคู่" in ev["zero"]["labels"]      # labelled with the reason, not blanked
    assert ev["zero"]["lone"] == ev["zero"]["unclaimed"] and ev["zero"]["flagged"] == 1
    for shape in ("extra", "zero", "orphan", "none"):
        e = ev[shape]
        assert e["flagged"] >= len(e["lone"]) + len(e["alone"]), f"{shape}: a row to review is filtered out"
    assert ev["none"]["rows"] == len(ev["none"]["invoice_descs"]) == 2 and ev["none"]["oracle_ids"] == []


def test_a_row_the_ai_proposed_and_the_rules_refused_is_drawn_with_its_reason(tmp_path, payload):
    """The sandbox never proposes and refuses in one run, so the payload is cut to the shape V-08 would leave."""
    p = copy.deepcopy(payload)
    rid = p["oracle_snapshot"]["receipt_lines"][1]["rcv_line_id"]
    p["line_matching"]["groups"] = [g for g in p["line_matching"]["groups"] if rid not in g["rcv_line_ids"]]
    p["line_matching"]["ai_rejected"] = [{"proposal": {"rcv_line_ids": [rid], "invoice_line_nos": [2]},
                                         "reason": "qty ไม่ตรงตามที่ PO อนุมัติ"}]
    ev = render(tmp_path, rejected=build_view(p))
    assert ev["rejected"]["oracle_status"][1] == "ai_rejected"
    assert "AI เสนอ แล้วถูกกฎปฏิเสธ" in ev["rejected"]["labels"]
    assert rid in ev["rejected"]["oracle_ids"] and rid in ev["rejected"]["lone"]   # refused, and still on screen


def test_the_panel_is_painted_from_the_model_alone(tmp_path, payload):
    ev = render(tmp_path, clean=build_view(payload))
    assert ev["clean"]["rows"] == 2 and ev["clean"]["pairs"] == 2 and ev["clean"]["flagged"] == 0
    assert ev["clean"]["oracle_status"] == ["matched", "matched"]
