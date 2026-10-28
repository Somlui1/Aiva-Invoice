"""Build the V-06 v2.0 parity fixtures (engine 5.6/5.7 evidence that the two pinned docs do not reach).

  python harness/make_v06_fixtures.py

Source: engine/temp/sigtest/extraction_{empty,nosig,stamp}.json — the QA signature documents built by
temp/sigtest/make_doc.py (synthetic PDFs, banner "QA TEST FIXTURE — NOT A REAL TAX INVOICE", never sent
to Paperless).  They print the same Oracle data as fixture 2 (DMS-15): receipt 5105107699 group
SHIPMENT_NUM SQ26/071249, supplier JAROONRAT tax 0135537003456 — so the fixture-2 Oracle tape replays
unchanged and only the signature layer differs.

What each one proves (engine v5.6 V-06 v2.0 + v5.7 E5/R10):
  empty  two printed boxes, both blank            -> E08 High + E08 Medium, missing_slots both,
                                                     signature_boxes, raw_value "empty", bboxes present
  nosig  the reader saw no signature box at all   -> synthetic element per slot (NOT_PRESENT),
                                                     "(ไม่พบกล่องลายเซ็นบนเอกสาร)", actual="no box",
                                                     bbox_missing_reason carries the id + NOT_PRESENT
  stamp  deliverer box signed + company stamp     -> E08 High for the receiver only, missing_slots=[receiver]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FIX = os.path.join(ROOT, "fixtures")
SRC = os.path.join(os.path.dirname(os.path.dirname(ROOT)), "temp", "sigtest")

CASES = {
    "v06_empty": ("extraction_empty.json", "TEST-SIG-EMPTY", "two empty signature boxes -> E08 High + E08 Medium"),
    "v06_nosig": ("extraction_nosig.json", "TEST-SIG-NOSIG", "no signature box printed -> synthetic elements + NOT_PRESENT"),
    "v06_stamp": ("extraction_stamp.json", "TEST-SIG-STAMP", "company stamp clears the deliverer -> E08 High only"),
}
MODELS = {"line_matcher": "nvidia/Qwen3.8-Flash-Next-NVFP4", "qty_judge": "nvidia/Qwen3.8-Flash-Next-NVFP4",
          "entity_judge": "nvidia/Qwen3.8-Flash-Next-NVFP4", "vision": "nvidia/Qwen3.8-Flash-Next-NVFP4"}


def main() -> int:
    missing = [f for f, _ in ((v[0], v) for v in CASES.values()) if not os.path.exists(os.path.join(SRC, f))]
    if missing:
        print("missing source fixtures in %s: %s" % (SRC, ", ".join(missing)))
        return 1
    for name, (fname, doc, why) in CASES.items():
        ext = json.load(open(os.path.join(SRC, fname), encoding="utf-8"))
        assert ext["invoice_document_id"], fname
        out = {"extraction": ext,
               "portal_refs": {"provenance": "engine/temp/sigtest/%s (synthetic QA fixture, not a customer invoice)" % fname,
                               "dms_doc_id": doc, "what_it_proves": why}}
        with open(os.path.join(FIX, "extraction_%s.json" % name), "w", encoding="utf-8") as fh:
            json.dump(out, fh, ensure_ascii=False, indent=1)
        with open(os.path.join(FIX, "extraction_%s_meta.json" % name), "w", encoding="utf-8") as fh:
            json.dump({"models": MODELS,
                       "request": {"validation_id": "VAL-" + doc, "correlation_id": "corr-" + doc,
                                   "document_revision": 1, "validation_round": 1},
                       "doc": doc, "oracle_tape": "oracle_rows2.json",
                       "tape_note": "same bind values as fixture 2 (invoice SQ26/071249 + supplier tax 0135537003456)"},
                      fh, ensure_ascii=False, indent=1)
        print("fixtures/extraction_%s.json  <- temp/sigtest/%s  (%s)" % (name, fname, why))
    print("\nRun the whole gate with:  python harness/parity.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
