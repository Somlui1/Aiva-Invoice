#!/usr/bin/env python3
"""Compare Single-Pass Extraction & BBox Results between two models / runs.

Usage:
    python scripts/compare_bbox_results.py
    python scripts/compare_bbox_results.py --base-dir bbox_testing --target-dir bbox_testing/Qwen3-VL-8B-Instruct
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure stdout uses UTF-8 on Windows
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = Path(__file__).resolve().parents[1]

FIELDS_TO_COMPARE = [
    "invoice_num", "invoice_date", "po_number", "supplier_tax_id", "grand_total"
]


def load_doc_data(folder: Path, doc_id: int) -> Optional[dict]:
    doc_path = folder / f"DMS-{doc_id}"
    payload_file = doc_path / "validation_payload.json"
    meta_file = doc_path / "meta.json"

    if not payload_file.exists():
        return None

    try:
        payload = json.loads(payload_file.read_text(encoding="utf-8"))
    except Exception:
        payload = {}

    try:
        meta = json.loads(meta_file.read_text(encoding="utf-8")) if meta_file.exists() else {}
    except Exception:
        meta = {}

    return {
        "doc_id": doc_id,
        "payload": payload,
        "meta": meta,
    }


def clean_val(v: Any) -> str:
    if v is None:
        return "-"
    s = str(v).strip()
    return s if s else "-"


def compare_runs(base_dir: Path, target_dir: Path) -> int:
    base_docs = set()
    for d in base_dir.glob("DMS-*"):
        if d.is_dir():
            try:
                base_docs.add(int(d.name.replace("DMS-", "")))
            except ValueError:
                pass

    target_docs = set()
    for d in target_dir.glob("DMS-*"):
        if d.is_dir():
            try:
                target_docs.add(int(d.name.replace("DMS-", "")))
            except ValueError:
                pass

    all_docs = sorted(base_docs | target_docs)
    if not all_docs:
        print(f"No documents found in either {base_dir} or {target_dir}")
        return 1

    lines = []
    lines.append(f"# Model Comparison Report: {target_dir.name} vs Base ({base_dir.name})\n")
    lines.append(f"- **Base Directory**: `{base_dir}`")
    lines.append(f"- **Target Directory**: `{target_dir}`")
    lines.append(f"- **Compared Documents**: {len(all_docs)}\n")

    lines.append("| Doc ID | Base Model (Sec) | Target Model (Sec) | BBoxes (Base / Target) | Selected Pages | Core Fields Match |")
    lines.append("|---|---|---|---|---|---|")

    field_diffs = []

    for did in all_docs:
        base_data = load_doc_data(base_dir, did)
        target_data = load_doc_data(target_dir, did)

        if not base_data and not target_data:
            continue

        b_meta = (base_data or {}).get("meta", {})
        t_meta = (target_data or {}).get("meta", {})
        b_pay = (base_data or {}).get("payload", {})
        t_pay = (target_data or {}).get("payload", {})

        b_sec = f"{b_meta.get('vlm_seconds', b_meta.get('total_seconds', '-'))}s" if base_data else "N/A"
        t_sec = f"{t_meta.get('vlm_seconds', t_meta.get('total_seconds', '-'))}s" if target_data else "N/A"

        b_boxes = b_meta.get("total_bboxes_drawn", "-") if base_data else "-"
        t_boxes = t_meta.get("total_bboxes_drawn", "-") if target_data else "-"

        b_pages = str(b_pay.get("selected_invoice_pages", "-")) if base_data else "-"
        t_pages = str(t_pay.get("selected_invoice_pages", "-")) if target_data else "-"
        pages_summary = f"{b_pages} vs {t_pages}" if b_pages != t_pages else b_pages

        # Check required fields
        b_req = b_pay.get("required_fields", {})
        t_req = t_pay.get("required_fields", {})

        match_count = 0
        total_fields = len(FIELDS_TO_COMPARE)
        diff_reasons = []

        for fn in FIELDS_TO_COMPARE:
            bv = clean_val((b_req.get(fn) or {}).get("value"))
            tv = clean_val((t_req.get(fn) or {}).get("value"))

            # Normalize for comparison
            bv_norm = "".join(ch for ch in bv.upper() if ch.isalnum())
            tv_norm = "".join(ch for ch in tv.upper() if ch.isalnum())

            if bv_norm == tv_norm:
                match_count += 1
            else:
                diff_reasons.append(f"{fn}: '{bv}' vs '{tv}'")

        if diff_reasons:
            field_diffs.append((did, diff_reasons))

        match_badge = f"{match_count}/{total_fields}"
        if match_count == total_fields:
            match_badge += "  OK"
        else:
            match_badge += " ⚠️ Diff"

        lines.append(f"| DMS-{did} | {b_sec} | {t_sec} | {b_boxes} / {t_boxes} | {pages_summary} | {match_badge} |")

    if field_diffs:
        lines.append("\n### Detailed Field Differences:\n")
        for did, diffs in field_diffs:
            lines.append(f"**DMS-{did}:**")
            for diff in diffs:
                lines.append(f"- {diff}")

    report_text = "\n".join(lines)
    print("\n" + report_text + "\n")

    # Save to target dir
    out_report = target_dir / "comparison_report.md"
    out_report.write_text(report_text, encoding="utf-8")
    print(f"Report saved to: {out_report}")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Compare Single-Pass Results between models")
    parser.add_argument("--base-dir", type=Path, default=ROOT / "bbox_testing", help="Baseline results dir")
    parser.add_argument("--target-dir", type=Path, default=ROOT / "bbox_testing" / "Qwen3-VL-8B-Instruct",
                        help="Target model results dir")
    args = parser.parse_args()

    return compare_runs(args.base_dir, args.target_dir)


if __name__ == "__main__":
    sys.exit(main())
