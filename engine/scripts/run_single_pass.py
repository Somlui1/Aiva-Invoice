#!/usr/bin/env python3
"""Run the v5 single-pass perception on DMS documents (successor of scripts/test_invoice_single_pass.py).

    python scripts/run_single_pass.py --doc-ids 15,19,20            # extraction + bbox overlay only
    python scripts/run_single_pass.py --doc-ids 48 --validate       # + System A validation (Oracle MCP)
    python scripts/run_single_pass.py --ids-file config/benchmark_3call_ids.json --validate --workers 2

Output per document: bbox_testing/single_pass/DMS-<id>/{extraction.json, result.json, invoice_p<N>.png}
Every bbox is drawn, including rows excluded from validation (grey) and folded rows (cyan).
"""
from __future__ import annotations

import argparse
import io
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from system_a.envfile import load_env  # noqa: E402

load_env()
from system_a.container import Settings, build_paperless, build_perception, build_services  # noqa: E402

COLORS = {"field": "#d62728", "line": "#1f77b4", "occurrence": "#ff7f0e", "excluded": "#7f7f7f",
          "folded": "#17becf", "signature_box": "#e377c2", "stamp": "#8c564b", "table": "#2ca02c",
          "other": "#bcbd22"}


def overlay(pdf: bytes, ext, page_no: int, dpi: int, out: Path) -> None:
    import fitz
    from PIL import Image, ImageDraw
    with fitz.open(stream=pdf, filetype="pdf") as doc:
        pix = doc[page_no - 1].get_pixmap(dpi=dpi)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    rot = next((p.rotation for p in ext.pages if p.page_no == page_no), 0)
    if rot:
        img = img.rotate(-rot, expand=True)
    d = ImageDraw.Draw(img)
    W, H = img.size

    def box(b, color, label):
        x, y, w, h = b
        d.rectangle([x * W, y * H, (x + w) * W, (y + h) * H], outline=color, width=3)
        d.text((x * W + 2, max(0, y * H - 12)), str(label)[:40], fill=color)

    for name, f in ext.fields.items():
        if f.region and f.region.page == page_no:
            box(f.region.bbox, COLORS["field"], f"{name}: {f.raw}")
    for ln in ext.lines:
        if ln.region and ln.region.page == page_no:
            box(ln.region.bbox, COLORS["line"], f"line_{ln.line_no}")
    for r in ext.regions:
        if r.page != page_no:
            continue
        lab = str(r.label or "")
        key = ("excluded" if lab.startswith("excluded_row") else "folded" if lab == "folded_row"
               else "occurrence" if lab.startswith("occurrence") else r.kind)
        box(r.bbox, COLORS.get(key, COLORS["other"]), lab)
    img.save(out, "PNG")


def run_one(doc_id: int, s: Settings, out_root: Path, validate_too: bool) -> dict:
    folder = out_root / f"DMS-{doc_id}"
    folder.mkdir(parents=True, exist_ok=True)
    try:
        pdf = build_paperless(s).download(doc_id)
        pipe = build_perception(s)
        ext = pipe.extract(pdf, package_id=f"PKG-{doc_id}", dms_doc_id=str(doc_id))
        (folder / "extraction.json").write_text(ext.model_dump_json(indent=2), encoding="utf-8")
        for p in ext.extra.get("invoice_pages") or []:
            overlay(pdf, ext, p, s.extract_dpi, folder / f"invoice_p{p}.png")
        row = {"doc_id": doc_id, "status": "ok", "pages": ext.extra["invoice_pages"], "lines": len(ext.lines),
               "excluded_rows": len(ext.extra["excluded_rows"]), "pages_complete": ext.pages_complete,
               "seconds": round(pipe.stats["ms"] / 1000, 1)}
        if validate_too:
            from system_a.application.orchestrator import validate
            res = validate(ext, build_services(s), request={
                "validation_id": f"SP-{doc_id}", "correlation_id": f"sp-{doc_id}", "idempotency_key": None,
                "document_revision": 1, "validation_round": 1})
            (folder / "result.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
            row.update(recommendation=res["recommendation"]["value"],
                       codes=",".join(res["recommendation"]["exception_codes"]))
        print(json.dumps(row, ensure_ascii=False), flush=True)
        return row
    except Exception as e:
        print(f"[ERROR] DMS-{doc_id}: {type(e).__name__}: {e}", flush=True)
        return {"doc_id": doc_id, "status": "error", "error": f"{type(e).__name__}: {e}"}


def main() -> int:
    ap = argparse.ArgumentParser(description="System A v5 single-pass perception runner")
    ap.add_argument("--doc-ids", help="comma separated, ranges allowed: 15,19,20-24")
    ap.add_argument("--ids-file", type=Path, help="JSON with document_ids (e.g. config/benchmark_3call_ids.json)")
    ap.add_argument("--out-dir", type=Path, default=ROOT / "bbox_testing" / "single_pass")
    ap.add_argument("--validate", action="store_true", help="also run System A validation (needs Oracle)")
    ap.add_argument("--workers", type=int, default=1)
    a = ap.parse_args()
    ids: list[int] = []
    if a.doc_ids:
        for part in filter(None, (x.strip() for x in a.doc_ids.split(","))):
            lo, _, hi = part.partition("-")
            ids += list(range(int(lo), int(hi) + 1)) if hi else [int(lo)]
    if a.ids_file:
        ids += [int(x) for x in json.loads(a.ids_file.read_text(encoding="utf-8"))["document_ids"]]
    if not ids:
        ap.error("give --doc-ids or --ids-file")
    s = replace(Settings(), mode="production", perception_engine="single_pass")
    a.out_dir.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=max(1, a.workers)) as ex:
        rows = list(ex.map(lambda i: run_one(i, s, a.out_dir, a.validate), ids))
    (a.out_dir / "summary.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    bad = sum(r["status"] != "ok" for r in rows)
    print(f"\n{len(rows) - bad}/{len(rows)} ok -> {a.out_dir}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
