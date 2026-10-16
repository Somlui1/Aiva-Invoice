#!/usr/bin/env python3
"""Render BBoxes onto PDF pages and export to PNG images with text-layer alignment audit.

Features:
- Takes result JSON (from results/<round>/DMS-<id>_result.json) and source PDF (from .cache/downloads/).
- Overlays BBoxes with color-coded categories:
    * Green: Core header fields (invoice_num, grand_total, po_number, etc.)
    * Blue: Table rows / line item cells
    * Orange: Other layout elements
    * Red: Problematic / degenerate / out-of-bounds boxes
- Exports high-resolution PNG images for visual inspection.
- Evaluates text-layer coverage and alignment: checks whether model bboxes accurately
  enclose the actual words from the PDF text layer.

Usage:
    python scripts/render_debug_bboxes.py --doc-id 20
    python scripts/render_debug_bboxes.py --all --results-dir results/eval_3call_loop
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pymupdf as fitz

# Ensure stdout uses UTF-8 on Windows
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from system_a.perception.coords import words_in_box, bbox_problems

CORE_FIELDS = {
    "invoice_num", "invoice_date", "po_number", "supplier_name",
    "supplier_tax_id", "customer_name", "customer_tax_id",
    "sub_total", "vat", "grand_total", "currency"
}

COLOR_HEADER = (0.0, 0.75, 0.2)     # Green
COLOR_TABLE = (0.1, 0.45, 0.95)     # Blue
COLOR_OTHER = (0.9, 0.55, 0.1)     # Orange
COLOR_ERROR = (0.95, 0.1, 0.1)     # Red


def render_document(
    doc_id: int,
    results_dir: Path,
    pdf_dir: Path,
    out_dir: Path,
    dpi: int = 150,
) -> dict:
    """Render a single document's BBoxes to PNG and report alignment metrics."""
    res_path = results_dir / f"DMS-{doc_id}_result.json"
    pdf_path = pdf_dir / f"DMS-{doc_id}.pdf"

    if not res_path.exists():
        return {"doc_id": doc_id, "status": "missing_result", "path": str(res_path)}
    if not pdf_path.exists():
        return {"doc_id": doc_id, "status": "missing_pdf", "path": str(pdf_path)}

    res_data = json.loads(res_path.read_text(encoding="utf-8"))
    doc = fitz.open(pdf_path)

    elements = (res_data.get("ocr") or {}).get("elements") or []
    problems = bbox_problems(elements)
    bad_elem_ids = {p.get("element_id") for p in problems}

    # Group elements by page_no (1-indexed)
    by_page: Dict[int, List[dict]] = {}
    for el in elements:
        p_no = el.get("page_no", 1)
        by_page.setdefault(p_no, []).append(el)

    out_dir.mkdir(parents=True, exist_ok=True)
    rendered_images: List[str] = []
    field_alignments: List[dict] = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        p_no = page_idx + 1
        page_elems = by_page.get(p_no, [])

        pw, ph = page.rect.width, page.rect.height

        # Extract words from text layer for alignment calculation
        # word tuple: (x0, y0, x1, y1, word_text, block_no, line_no, word_no)
        raw_words = page.get_text("words")
        norm_words = []
        for w in raw_words:
            norm_words.append({
                "text": w[4],
                "bbox": [w[0] / pw, w[1] / ph, (w[2] - w[0]) / pw, (w[3] - w[1]) / ph]
            })

        for el in page_elems:
            el_type = el.get("element_type")
            if el_type == "page":
                continue

            box = el.get("bbox")
            if not box or len(box) != 4:
                continue

            x, y, w, h = (float(v) for v in box)
            is_bad = el.get("element_id") in bad_elem_ids or w <= 0 or h <= 0
            field_name = el.get("field_name") or ""

            # Determine color
            if is_bad:
                color = COLOR_ERROR
            elif field_name in CORE_FIELDS or el_type == "field":
                color = COLOR_HEADER
            elif "cell" in str(el_type) or "line" in str(el_type):
                color = COLOR_TABLE
            else:
                color = COLOR_OTHER

            # Rect coordinates on page
            rect = fitz.Rect(x * pw, y * ph, (x + w) * pw, (y + h) * ph)
            page.draw_rect(rect, color=color, width=1.5)

            # Label on top
            label = field_name or el_type or ""
            val = str(el.get("raw_value") or el.get("normalized_value") or "")
            label_text = f"{label}: {val[:25]}" if val else label
            if label_text:
                page.insert_text(
                    fitz.Point(rect.x0, max(8.0, rect.y0 - 2.0)),
                    label_text,
                    fontsize=7,
                    color=color,
                )

            # Text-layer coverage audit for fields
            if field_name:
                covered_words = words_in_box(norm_words, box, tol=0.01)
                covered_text = "".join(cw["text"] for cw in covered_words).strip()
                val_clean = "".join(ch for ch in val if ch.isalnum()).upper()
                cov_clean = "".join(ch for ch in covered_text if ch.isalnum()).upper()

                overlap_ok = bool(val_clean and (val_clean in cov_clean or cov_clean in val_clean))
                field_alignments.append({
                    "field_name": field_name,
                    "page_no": p_no,
                    "bbox": [round(v, 4) for v in box],
                    "extracted_value": val,
                    "text_layer_found": covered_text[:40],
                    "overlap_ok": overlap_ok,
                })

        # Save rendered page pixmap
        pix = page.get_pixmap(dpi=dpi)
        img_name = f"DMS-{doc_id}_p{p_no}.png"
        img_path = out_dir / img_name
        pix.save(img_path)
        rendered_images.append(str(img_path))

    return {
        "doc_id": doc_id,
        "status": "ok",
        "pages_rendered": len(rendered_images),
        "images": rendered_images,
        "bbox_problems": len(problems),
        "field_alignments": field_alignments,
    }


def main():
    parser = argparse.ArgumentParser(description="Render BBoxes on PDF and audit alignment")
    parser.add_argument("--doc-id", type=int, help="Single DMS doc ID (e.g. 20)")
    parser.add_argument("--all", action="store_true", help="Process all available result files")
    parser.add_argument("--results-dir", type=Path, default=ROOT / "results" / "eval_3call_loop",
                        help="Results directory containing DMS-<id>_result.json")
    parser.add_argument("--pdf-dir", type=Path, default=ROOT / ".cache" / "downloads",
                        help="Directory containing downloaded DMS-<id>.pdf")
    parser.add_argument("--out-dir", type=Path, default=None,
                        help="Output directory for rendered PNGs (default: <results-dir>/debug_bboxes)")
    parser.add_argument("--dpi", type=int, default=150, help="Rendering DPI (default 150)")
    args = parser.parse_args()

    out_dir = args.out_dir or (args.results_dir / "debug_bboxes")

    if args.doc_id:
        doc_ids = [args.doc_id]
    elif args.all:
        doc_ids = []
        for f in sorted(args.results_dir.glob("DMS-*_result.json")):
            stem = f.stem.replace("_result", "")
            try:
                doc_ids.append(int(stem.replace("DMS-", "")))
            except ValueError:
                continue
    else:
        print("Please provide --doc-id <id> or --all", file=sys.stderr)
        return 1

    print(f"Rendering BBoxes for {len(doc_ids)} document(s)...")
    print(f"Results dir: {args.results_dir}")
    print(f"Output dir:  {out_dir}\n")

    summary = []
    for doc_id in doc_ids:
        report = render_document(doc_id, args.results_dir, args.pdf_dir, out_dir, dpi=args.dpi)
        summary.append(report)
        if report.get("status") == "ok":
            aligns = report.get("field_alignments", [])
            ok_count = sum(1 for a in aligns if a.get("overlap_ok"))
            tot_count = len(aligns)
            print(f"✓ DMS-{doc_id}: Rendered {report['pages_rendered']} page(s) | "
                  f"BBox text-layer overlap: {ok_count}/{tot_count} fields OK | "
                  f"Problems: {report['bbox_problems']}")
        else:
            print(f"✗ DMS-{doc_id}: {report.get('status')}")

    # Write summary audit json
    audit_path = out_dir / "alignment_audit.json"
    audit_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nAlignment audit report saved to: {audit_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
