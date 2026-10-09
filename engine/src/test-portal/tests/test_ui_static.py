"""The browser half, checked as text: every box it draws must come out of the payload the server sent.

There is no headless browser in this environment, so these tests read ``app.js`` / ``index.html`` and check them
against the server they talk to - the endpoints, the field names of the screen model, the ids of the controls.
"""
import pathlib
import re

from webapp.view import DEFAULT_TYPES

HERE = pathlib.Path(__file__).resolve().parents[1]
JS = (HERE / "webapp" / "static" / "app.js").read_text(encoding="utf-8")
HTML = (HERE / "webapp" / "static" / "index.html").read_text(encoding="utf-8")
CODE = JS.split("*/", 1)[1]                                   # everything after the file's header comment


def js_paths():
    """Every ``/api/...`` path the script uses - concatenation, ``${id}`` and all - with variables as ``{}``."""
    out = set()
    for line in JS.splitlines():
        if "/api" not in line:
            continue
        s = line
        while re.search(r"'\s*\+\s*[a-z][\w.]*\s*\+\s*'", s):          # 'a' + id + 'b'  ->  'a{b'
            s = re.sub(r"'\s*\+\s*[a-z][\w.]*\s*\+\s*'", "\x00", s, count=1)
        s = re.sub(r"'\s*\+\s*(?:[a-z][\w.]*|encodeURIComponent\()", "\x00'", s)   # 'a' + id  ->  'a{'
        for m in re.findall(r"/api[^\s'\"`\\]+", s):
            out.add(re.sub(r"\$\{[^}]*\}", "{}", m).replace("\x00", "{}").split("?")[0].rstrip("/"))
    return out


def test_every_control_the_script_reaches_for_exists():
    wanted = set(re.findall(r"\$\('([a-z]+)'\)", JS))
    have = set(re.findall(r"id=([a-z]+)", HTML))
    assert wanted and wanted <= have, f"app.js wants {sorted(wanted - have)}"


def test_the_script_calls_only_endpoints_the_server_has(client):
    routes = {r.path.replace("{doc_id}", "{}").replace("{page}", "{}")
              for r in client.app.routes if r.path.startswith("/api")}
    called = js_paths()
    assert called, "the script calls nothing"
    assert called <= routes, f"app.js calls {sorted(called - routes)}"
    assert {"/api/meta", "/api/documents", "/api/documents/refresh", "/api/search"} <= called
    assert any(p.endswith("/process") for p in called) and any(p.endswith("/result") for p in called)
    assert any(p.endswith("/payload") for p in called) and any(p.endswith("/extraction") for p in called)
    assert any(p.endswith("/pdf") for p in called) and any(p.endswith("/image") for p in called)


def test_boxes_are_drawn_from_the_payload_and_are_not_moved_or_guessed():
    for field in ("elements", "bbox", "has_bbox", "raw", "conf", "data-ref", "element_id"):
        assert field in CODE, field
    # a box is placed with the four numbers of the payload element, on a page sized by the payload's own geometry
    assert "= e.bbox;" in CODE and "left:${(x * 100)" in CODE and "width:${(w * 100)" in CODE
    assert "aspect-ratio:${full.width_pt}/${full.height_pt}" in CODE and "full.rotation" in CODE
    assert "page_type" in CODE
    for invented in ("iou", "bbox_norm", "items_by_page", "kept[", "matchElement"):
        assert invented not in CODE.lower(), invented           # no matching by guess, no second coordinate system


def test_the_paths_that_were_removed_stay_removed():
    for gone in ("/api/replay", "/api/placeholder", "/api/demo", "items_by_page", "kept",
                 "perception", "<svg", "bbox_norm", "replay"):
        assert gone not in JS, gone
    assert "'/api/batch'" not in JS                # the old demo endpoint; the new ones are /api/batch/start etc.
    for gone in ("replay", "demo"):
        assert gone not in HTML, gone


def test_the_element_types_come_from_the_server_and_are_remembered_locally(client):
    m = client.get("/api/meta").json()
    assert set(DEFAULT_TYPES) <= set(m["element_types"]) and set(m["default_types"]) <= set(m["element_types"])
    assert "META.element_types" in CODE and "default_types" in CODE      # the script hard-codes no type name
    assert "v.types" in CODE                                            # which types this document has = the payload
    assert "localStorage" in JS and "aiva.sysA" in JS                   # the user's toggles survive a reload
    assert "data-t=" in CODE and "SHOW.has(" in CODE and "writeTypes()" in CODE
    assert "#1f77b4" not in JS                                          # no colour is hard-coded in the script either


def test_a_failure_is_shown_as_the_failure_system_a_gave():
    assert "traceback" in CODE and "<details" in CODE and "<pre>" in CODE
    assert "source_error" in CODE                              # a DMS that cannot serve its file is said too
    assert "src_err" in CODE


def test_it_starts_a_run_then_polls_and_can_forget_a_result():
    assert "setTimeout" in CODE and "'POST'" in CODE or "method: 'POST'" in CODE
    assert "DELETE" in CODE                                    # forget(doc_id)
    assert "Esc" in CODE or "keydown" in CODE                  # the pinned box can be closed


def test_page_numbers_are_used_as_the_numbers_the_server_sends(client):
    """The server sends ``pages`` as bare numbers; using them as objects asked for ``/pages/undefined/image``."""
    row = client.get("/api/documents").json()[0]
    assert row["pages"] and all(type(n) is int for n in row["pages"]), row["pages"]
    assert "const pageNums = m =>" in CODE
    assert "pageNums(m).map(page => ({ page }))" in CODE        # the page list is normalised before any url
    assert "m.pages && m.pages.length" not in CODE              # the old line that produced "undefined"
    assert "api.img(m.id, p.page)" in CODE                      # built from the normalised value only
    assert "const nums = pageNums(m);" in CODE.split("function docHtml")[1]   # the jump links use them too


def test_a_document_with_no_stored_result_is_asked_for_only_once():
    """A result that is not there answers 409 - asking again on every repaint is just noise for both sides."""
    assert "probed: false" in CODE and "if (r.probed) return;" in CODE and "r.probed = true" in CODE
    assert "r.probed = false" in CODE.split("function applyServer")[1]        # a run that finished is fetched
    assert "probed: true" in CODE.split("async function forget")[1]           # and forgetting does not re-ask


def test_the_state_row_is_read_with_the_keys_the_server_uses():
    row = {"id": 1, "state": "done", "run": 1, "recommendation": "AUTO_PASS"}
    assert "recommendation" in row                              # service._public() sends this name...
    assert "m.recommendation" in CODE                           # ...so the script must not read "m.rec"
    assert "r.rec = m.rec;" not in CODE


def test_the_three_columns_are_the_list_the_preview_and_the_result():
    ids = re.findall(r"<div id=(\w+)", HTML)
    assert ids.index("side") < ids.index("main") < ids.index("panel"), ids      # left / middle / right
    css = HTML.split("<style>")[1].split("</style>")[0]
    for col, rule in (("#side", "width:270px"), ("#main", "flex:1 1 auto"), ("#panel", "border-left")):
        assert col in css and rule in css.split(col, 1)[1][:200], col
    assert "#panel:empty{display:none}" in css                        # no result yet -> no empty column
    body = CODE.split("function docHtml(m)")[1].split("function paintPanel")[0]
    assert "panelHtml" not in body                                    # not stacked under the pages any more
    assert "$('panel')" in CODE
    assert "paintPanel(m)" in CODE.split("function apply()")[1]
    assert "paintPanel(m)" in CODE.split("function refresh(id)")[1]
    assert ', #panel [data-ref="' in CODE            # a result row still lights its own box


def test_the_result_column_shows_the_payload_only_and_asks_for_nothing_more():
    paint = CODE.split("function paintPanel(m)")[1].split("\n}")[0]
    assert "panelHtml(m)" in paint and "api." not in paint           # one paint, no extra request
    assert "counts || {}).elements" in paint


def test_the_comparison_table_shows_both_lists_and_works_out_nothing_of_its_own():
    """The Oracle ↔ invoice table shows the payload's two lists; the joining and the verdicts are System A's."""
    body = CODE.split("function cmpHtml(v)")[1].split("\nfunction ")[0]
    row = CODE.split("function cmpRowHtml(v, l, o)")[1].split("\nfunction ")[0]
    both = body + row
    assert "v.oracle_lines" in body and "(v.lines || {}).items" in body      # the two lists, from the server model
    for path in ("normalized_fields.items", "oracle_snapshot.receipt_lines", "line_matching.groups"):
        assert path in body, path                                    # the screen says where each half came from
    for x in ("api.", "fetch(", "XMLHttpRequest"):                    # and it is already in the view it has
        assert x not in both, x
    for computed in ("parseFloat", "Number(", "Math.", "reduce("):   # no arithmetic, no diff invented here
        assert computed not in both, computed
    assert "l.qty_check" in row and "l.match" in row and "o.status" in row   # only System A's own verdicts
    assert "refAttr(v, l.ref)" in row                                 # an invoice row still lights its own box
    assert 'data-cmp' in body and "writeCmp()" in CODE and "initCmp()" in CODE   # the tester can narrow the view
    assert "cmp-need" in CODE and ".cmp.need" in HTML                 # and the narrowing is done in CSS


# ------------------------------------------------------------------ rounds, batches, summary, comparison
def test_the_round_and_batch_controls_are_in_the_page():
    for el in ("round_sel", "btn_new_round", "btn_batch", "btn_stop", "skip_existing", "concurrency",
               "btn_summary", "btn_compare", "modal_summary", "modal_compare", "batch_bar", "batch_fill",
               "batch_txt", "cmp_base", "cmp_target", "cmp_body", "sm_body"):
        assert f"id={el}" in HTML, el
    css = HTML.split("<style>")[1].split("</style>")[0]
    assert ".modal{display:none" in css and ".modal.on{display:flex}" in css    # shut until the tester asks
    assert "#batch_bar{display:none" in css and "#batch_bar.on{display:" in css  # and no strip with no batch
    assert "td.d-up" in css and "td.d-down" in css                    # better / worse is readable at a glance
    assert ".v-AUTO_PASS" in css and ".v-MANUAL_REVIEW" in css        # one colour per verdict, in the page too


def test_the_script_drives_the_round_and_batch_endpoints():
    called = js_paths()
    assert {"/api/rounds", "/api/rounds/create", "/api/rounds/select", "/api/rounds/summary",
            "/api/rounds/summary/rebuild", "/api/rounds/compare",
            "/api/batch/start", "/api/batch/stop", "/api/batch/status"} <= called, sorted(called)
    assert "$('round_sel')" in CODE and "$('btn_new_round')" in CODE and "$('btn_batch')" in CODE
    assert "$('btn_stop')" in CODE and "$('skip_existing').checked" in CODE
    assert "$('concurrency').value" in CODE
    assert "JSON.stringify" in CODE                                   # the body those endpoints ask for
    assert "$('btn_batch').disabled = true" in CODE                   # one batch at a time, said with the button


def test_switching_round_clears_every_view_of_the_round_before_it():
    """A result the browser kept belongs to the round it was read from - showing it in another round is a lie."""
    assert "round: ROUNDS.active" in CODE                             # a cached case says where it came from
    assert "c.round !== ROUNDS.active" in CODE                        # and is not shown anywhere else
    body = CODE.split("function resetForRound")[1].split("\nfunction ")[0]
    assert "view: null" in body and "probed: false" in body            # every document is asked again, in the new round


def test_the_batch_progress_and_the_row_marks_are_the_servers_counts():
    seg = CODE.split("function applyBatch")[1].split("\nfunction ")[0]
    for k in ("total", "processed", "completed", "errors", "cancelled", "skipped", "running", "percent"):
        assert k in seg, k
    assert "style.width" in seg and "%'" in seg                        # the strip is a bar of that percentage
    assert "batchPoll" in CODE and "setTimeout" in CODE.split("function batchPoll")[1].split("\nfunction ")[0]
    assert "r.b = " in seg                                             # the list row of each document is marked too
    assert "data-ck" in CODE and "SEL" in CODE                          # the tester picks which documents to run


def test_the_summary_modal_shows_the_servers_summary_and_nothing_else():
    seg = CODE.split("function summaryHtml")[1].split("async function showSummary")[0]
    for k in ("metadata", "statistics", "counts", "rules", "cases", "rule_id", "rule_results",
             "pass", "fail", "manual_review", "not_evaluated", "recommendation", "doc_id", "elapsed_s"):
        assert k in seg, k
    for x in ("api.", "fetch("):                                       # one paint, no extra request
        assert x not in seg, x
    assert "api.summaryRebuild" in CODE                                # the button that folds it again


def test_the_compare_modal_shows_only_the_verdicts_the_server_computed():
    seg = CODE.split("function compareHtml")[1].split("\nfunction ")[0]
    for k in ("aggregate", "cases", "delta", "base", "target", "improved_count", "regressed_count",
              "unchanged_count", "added_count", "removed_count", "base_recommendation",
              "target_recommendation", "rule_changes", "diff"):
        assert k in seg, k
    for chip in ("เฉพาะที่เปลี่ยน", "ทั้งหมด", "ดีขึ้น", "แย่ลง"):   # chips: only what moved / all / better / worse
        assert chip in seg, chip
    for invented in ("parseFloat", "Number(", "Math.", "reduce(", "sort("):
        assert invented not in seg, invented          # the counting, the ranking and the order are the server's
    assert "data-open" in seg                                          # a row opens that document in the portal
