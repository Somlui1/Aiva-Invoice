"""Rebuild an aiva.extraction/2.0 from a stored result/3.0 payload (inverse of the assembler).

  python harness/make_fixture2.py [DMS-15]   -> fixtures/extraction2.json
Used as scenario 2 (a document whose receipt IS found), so STEP 3 is exercised for real.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE = os.path.dirname(os.path.dirname(ROOT))
FIX = os.path.join(ROOT, 'fixtures')
sys.path.insert(0, os.path.join(ENGINE, 'src'))
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from system_a.domain.contracts import ExtractionResult            # noqa: E402
from system_a.domain.contracts import OracleInputRejected         # noqa: E402  (import check)

doc_name = sys.argv[1] if len(sys.argv) > 1 else 'DMS-15'
run_dir = os.path.join(ENGINE, 'results', 'run_20261016_165044_v5.5')
P = json.load(open(os.path.join(run_dir, f'{doc_name}_result.json'), encoding='utf-8'))
els = {e['element_id']: e for e in P['ocr']['elements']}


def region_of(eid):
    e = els.get(eid) or {}
    if not e.get('bbox'):
        return None
    return {"page": e['page_no'], "bbox": e['bbox'], "rbox": e.get('rbox')}


def raw_field(eid, rf, default_source='vlm'):
    e = els.get(eid) or {}
    sr = e.get('source_reference') or {}
    raw = rf.get('raw_value')
    return {"raw": raw, "confidence": rf.get('confidence'), "agreement": sr.get('agreement', True),
            "region": region_of(eid), "word_ids": sr.get('word_ids') or [], "source": sr.get('source') or default_source,
            "null_reason": None if raw is not None else 'NOT_PRESENT'}


ext = {
    "contract": "aiva.extraction/2.0",
    "package_id": P['package']['package_id'], "dms_doc_id": P['package']['dms_doc_id'],
    "file_sha256": P['package']['file_sha256'],
    "pages": P['pages'], "documents": P['documents'],
    "invoice_document_id": P['extraction']['invoice_document_id'],
    "pages_complete": P['package']['pages_complete'],
    "fields": {k: raw_field(v['element_id'], v) for k, v in P['extraction']['fields'].items()},
    "lines": [{"line_no": l['line_no'], "region": region_of(l['element_id']),
               "cells": {k: raw_field(f"{l['element_id']}-{k}", c) for k, c in l['cells'].items()}}
              for l in P['extraction']['lines']],
    "signatures": {k: {"present": v['present'], "confidence": v['confidence'], "kind": v['kind'], "region": v['region']}
                   for k, v in (P['extraction'].get('signatures') or {}).items()},
    "words": [],
    "regions": [{"region_id": e['element_id'], "page": e['page_no'],
                 "kind": (e.get('source_reference') or {}).get('region_kind') or e['element_type'],
                 "label": e.get('field_name'), "text": e.get('raw_value'), "confidence": e.get('confidence'),
                 "bbox": e['bbox'] or [0, 0, 0, 0], "rbox": e.get('rbox'), "parent_id": e.get('parent_id')}
                for e in P['ocr']['elements']
                if (e.get('source_reference') or {}).get('region_kind')],
    "extra": P['extraction'].get('extra') or {},
    "extractor": (P['ocr']['elements'][0].get('source_reference') or {}).get('extractors') or {},
}
ExtractionResult.model_validate(ext)
json.dump({"extraction": ext, "portal_refs": {"document_revision": 1, "validation_round": 1}},
          open(os.path.join(FIX, 'extraction2.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump({"models": P['versions']['models'], "request": {k: P['request'][k] for k in
           ('validation_id', 'correlation_id', 'document_revision', 'validation_round') if k in P['request']},
           "reference_sha": P['integrity']['payload_sha256'], "doc": doc_name},
          open(os.path.join(FIX, 'fixture2_meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"extraction2.json ({doc_name}): pages={len(ext['pages'])} lines={len(ext['lines'])} "
      f"fields={len(ext['fields'])} regions={len(ext['regions'])} sigs={list(ext['signatures'])}")
print("stored v5.5 sha:", P['integrity']['payload_sha256'])
