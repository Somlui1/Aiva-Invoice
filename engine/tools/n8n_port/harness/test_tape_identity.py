"""Per-call identity of the recorded AI tapes: which answer belongs to which page, and does the engine agree.

Why: DMS-129 could not be used as parity evidence because its tape and its extraction contradicted each other —
the tape's page-3 request (key `single-pass-extract version: 1.7.0|735a8b95|1|...`, body prompt "page 3 of the
document") came back with ELEVEN field boxes, while the engine's own extraction says
extra.page_errors["3"] = "NO_GEOMETRY: 17 values read, none with a usable box".
Both statements cannot be true. Offline parity for that document is therefore meaningless, and the only honest
move is to make the contradiction machine-checkable for every document instead of finding it by hand.

Each recorded tape entry carries its own identity — key = "<kind> version: X|hash|n_images|<body prefix>", body
= the exact request. The page a response belongs to is therefore read from the PROMPT TEXT, never from tape
order. This test asserts four things per document, and reports them as evidence rather than opinions:

  (1) entry count  : classify + one entry per extract call recorded in extra.calls (other kinds, e.g.
                     v05-entity, are counted separately and excluded)
  (2) page identity: the page numbers parsed out of the extract prompts, in tape order, equal the page numbers
                     in extra.calls (kind == extract) — this is what harness/make_scenario.py trusts
  (3) box usability: a page whose answer has NO usable box is exactly a page the engine marked NO_GEOMETRY,
                     and a page whose answer HAS boxes must not be marked NO_GEOMETRY
  (4) reprint check: a page dropped as a reprint must have an answer identical to the page it duplicates

Run:  cd engine/tools/n8n_port && python harness/test_tape_identity.py [doc ...]
"""
import glob
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REC = os.path.join(ROOT, "fixtures", "rec")
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PAGE_RE = re.compile(r"page\s+(\d+)\s+of", re.I)
NULLS = ("", "null", "none", "-", "n/a")
fails, contradictions = [], []


sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(ROOT)), "src"))
from system_a.perception.single_pass import _page_signature as page_signature      # noqa: E402  the engine's own


def usable_boxes(answer):
    """How many values in this answer carry a 4-number box (the engine's _box test, applied to raw JSON)."""
    n = 0
    fields = (answer.get("fields") or {})
    for cell in fields.values():
        if isinstance(cell, dict) and isinstance(cell.get("bbox_2d"), list) and len(cell["bbox_2d"]) == 4:
            n += 1
    for row in answer.get("line_items") or []:
        for k, v in (row or {}).items():
            if isinstance(v, dict) and isinstance(v.get("bbox_2d"), list) and len(v["bbox_2d"]) == 4:
                n += 1
    for lst in (answer.get("occurrences") or {}).values():
        for v in lst or []:
            if isinstance(v, dict) and isinstance(v.get("bbox_2d"), list) and len(v["bbox_2d"]) == 4:
                n += 1
    for r in answer.get("regions") or []:
        if isinstance(r, dict) and isinstance(r.get("bbox_2d"), list) and len(r["bbox_2d"]) == 4:
            n += 1
    return n


def decode_answer(text):
    """Strict JSON, else brace-matching salvage — the same order the engine's ANSWER-DECODE uses.

    Some recorded answers are truncated model output (DMS-116 is one), which is exactly what the engine's
    salvage path exists for. Reporting it separately keeps "we could not read this answer" from being silently
    counted as "this answer has no boxes".
    """
    t = re.sub(r"^\s*```(?:json)?\s*|\s*```\s*$", "", str(text or ""), flags=re.I | re.M).strip()
    try:
        return json.loads(t), None
    except Exception:
        pass
    start = t.find("{")
    if start >= 0:
        depth = 0
        in_str = esc = False
        for i in range(start, len(t)):
            ch = t[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
                continue
            if ch == '"':
                in_str = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(re.sub(r",(\s*[}\]])", r"", t[start:i + 1])), "salvaged"
                    except Exception:
                        break
    return {}, "unparseable"


def entry_pages(entries):
    out = []
    for e in entries:
        body = e.get("body")
        b = body if isinstance(body, str) else json.dumps(body or {}, ensure_ascii=False)
        m = PAGE_RE.findall(b)
        out.append(int(m[-1]) if m else None)          # the extract prompt ends with "page N of the document"
    return out


CURRENT = ["?"]


def check(cond, msg):
    print(("  OK   " if cond else "  FAIL ") + ("DMS-%s: " % CURRENT[0]) + msg)
    if not cond:
        fails.append("DMS-%s: %s" % (CURRENT[0], msg))


def run(doc):
    CURRENT[0] = doc
    tape = json.load(io.open(os.path.join(REC, "%s_ai_tape.json" % doc), encoding="utf-8"))
    entries = tape if isinstance(tape, list) else tape.get("entries") or []
    ext = json.load(io.open(os.path.join(REC, "%s_extraction.json" % doc), encoding="utf-8"))
    ex = ext.get("extra") or {}
    calls = ex.get("calls") or []
    kinds_tape = [str(e.get("key") or "").split()[0] for e in entries]
    n_cls_tape = sum(1 for k in kinds_tape if k.endswith("classify"))
    n_ext_tape = sum(1 for k in kinds_tape if k.endswith("extract"))
    n_other = len(entries) - n_cls_tape - n_ext_tape
    n_cls_call = sum(1 for c in calls if c.get("kind") == "classify")
    ext_calls = [c for c in calls if c.get("kind") == "extract"]

    print("\n== DMS-%s  tape=%d entries (classify=%d extract=%d other=%s) | extra.calls classify=%d extract=%d"
          % (doc, len(entries), n_cls_tape, n_ext_tape,
             sorted({k for k in kinds_tape if not (k.endswith("classify") or k.endswith("extract"))}) or "-",
             n_cls_call, len(ext_calls)))

    check(n_cls_tape == max(n_cls_call, 1), "one classify entry per classify call")
    check(n_ext_tape == len(ext_calls),
          "%d extract entries for %d extract calls recorded in extra.calls" % (n_ext_tape, len(ext_calls)))

    pages = [p for p in entry_pages([e for e in entries if str(e.get("key") or "").endswith("extract")
                                     or "extract" in str(e.get("key") or "").split()[0]])]
    want = [c.get("page") for c in ext_calls]
    if n_ext_tape:
        check(pages == want, "extract pages parsed from the PROMPT TEXT %s equal extra.calls pages %s" % (pages, want))

    # (3) box usability vs page_errors
    perr = ex.get("page_errors") or {}
    nogeom = sorted(int(p) for p, v in perr.items() if str(v).startswith("NO_GEOMETRY"))
    answers, salvage = [], []
    for e in entries:
        if "extract" not in str(e.get("key") or "").split()[0]:
            continue
        obj, note = decode_answer(e["text"])
        answers.append(obj)
        salvage.append(note)
    boxy = {p: usable_boxes(a) for p, a in zip(pages, answers)}
    print("   usable boxes per read page: %s | engine NO_GEOMETRY pages: %s" % (boxy, nogeom or "-"))
    if any(salvage):
        print("   answer decode: %s" % ", ".join("page %s=%s" % (p, n or "strict") for p, n in zip(pages, salvage)))
    folded = {r.get("page") for r in (ex.get("reprint_pages") or [])}
    for p, n in sorted(boxy.items()):
        if n == 0:
            check(p in nogeom, "page %s came back with no usable box and the engine says NO_GEOMETRY for it" % p)
        elif p in nogeom and p in folded:
            # Not a contradiction after all, and this is worth writing down: the answer HAS boxes, but the page
            # was folded into another sheet as a reprint BEFORE elements were built, so nothing ends up LOCATED
            # on it — and the engine's NO_GEOMETRY test (single_pass.py:713-728) counts LOCATED values, not
            # boxes in the answer. DMS-129 is exactly this, and the port now reports the same message.
            print("   page %s: %d boxes in the answer, NO_GEOMETRY reported — legitimate: the page was folded "
                  "into a reprint, so no value is located on it" % (p, n))
        elif p in nogeom and salvage[pages.index(p)] != "unparseable":
            contradictions.append(
                "DMS-%s: page %s answer carries %d usable boxes but extra.page_errors says "
                "NO_GEOMETRY: %s  -> this document cannot be used as parity evidence"
                % (doc, p, n, perr[str(p)]))
            print("   !! CONTRADICTION  page %s: answer has %d usable boxes, engine says NO_GEOMETRY" % (p, n))

    # (4) a dropped reprint must really repeat the page it is folded into — measured the way the ENGINE
    # measures it (single_pass._page_signature: header totals + row cells), NOT by byte equality. Two scans of
    # the same sheet differ in a stamp, a handwriting blob or the order of regions; what makes them the same
    # sheet is the numbers.
    for rp in ex.get("reprint_pages") or []:
        p1, p2 = rp.get("page"), rp.get("same_as_page")
        if p1 in pages and p2 in pages:
            sig1, sig2 = page_signature(answers[pages.index(p1)]), page_signature(answers[pages.index(p2)])
            print("   reprint: page %s folded into page %s (%s rows, invoice %r) — signature equal: %s"
                  % (p1, p2, rp.get("rows"), rp.get("invoice_num"), sig1 == sig2))
            check(sig1 == sig2, "page %s repeats page %s on header totals and row cells (the engine's own test)"
                  % (p1, p2))
        else:
            print("   reprint: page %s folded into page %s — one of them is not in the tape, not checkable here"
                  % (p1, p2))
    return bool(contradictions)


def main():
    docs = sys.argv[1:] or sorted({os.path.basename(f).split("_")[0]
                                   for f in glob.glob(os.path.join(REC, "*_ai_tape.json"))})
    for doc in docs:
        run(doc)
    print("\n" + "=" * 100)
    if contradictions:
        print("TAPE/EXTRACTION CONTRADICTIONS (these documents are NOT usable as parity evidence):")
        for c in contradictions:
            print("  - " + c)
    print("checked %d documents | assertion failures: %d | contradictions: %d"
          % (len(docs), len(fails), len(contradictions)))
    print("TAPE IDENTITY: " + ("PASS" if not fails else "FAIL (%d)" % len(fails)))
    return 1 if fails else 0


sys.exit(main())
