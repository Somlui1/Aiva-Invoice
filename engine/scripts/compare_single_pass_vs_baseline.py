#!/usr/bin/env python3
"""Compare Single-Pass benchmark results (bbox_testing/single_pass) against baseline (results/run_20261011)."""
from __future__ import annotations

import argparse
import json
import sys
from decimal import Decimal
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[1]

FIELDS = ("invoice_num", "po_number", "supplier_tax_id", "grand_total", "sub_total")
VERDICT_RANK = {"AUTO_PASS": 0, "REVIEW": 1, "MANUAL_REVIEW": 2, "HOLD": 3, "SYSTEM_ERROR": 4}


def clean_num(v) -> Optional[Decimal]:
    if v is None:
        return None
    s = str(v).replace(",", "").strip()
    try:
        return Decimal(s)
    except Exception:
        return None


def extract_info(res: dict) -> dict:
    rec = res.get("recommendation") or {}
    verdict = rec.get("value") or (res.get("summary", {}).get("decision", {}).get("status")) or "UNKNOWN"
    codes = sorted(rec.get("exception_codes") or (res.get("summary", {}).get("decision", {}).get("exception_codes") or []))

    # normalized fields
    norm = res.get("normalized_fields") or {}
    inv = (res.get("summary") or {}).get("invoice") or {}

    def get_f(name: str):
        raw_val = norm.get(name)
        if isinstance(raw_val, dict):
            val = raw_val.get("value")
        else:
            val = raw_val
        if val is not None:
            return str(val)
        return inv.get(name)

    po = get_f("po_number")
    if not po and inv.get("po_numbers"):
        po = ",".join(str(x) for x in inv["po_numbers"])

    lines = res.get("line_items") or (res.get("summary") or {}).get("lines") or []
    lines_count = len(lines)
    if lines_count == 0:
        lines_count = len(res.get("ocr", {}).get("elements", []))

    return {
        "verdict": verdict,
        "codes": codes,
        "invoice_num": get_f("invoice_num"),
        "po_number": po,
        "supplier_tax_id": get_f("supplier_tax_id"),
        "sub_total": get_f("sub_total"),
        "grand_total": get_f("grand_total"),
        "lines": lines_count,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids-file", type=Path, default=ROOT / "config" / "benchmark_3call_ids.json")
    ap.add_argument("--target-dir", type=Path, default=ROOT / "bbox_testing" / "single_pass")
    ap.add_argument("--baseline-dir", type=Path, default=ROOT / "results" / "run_20261011")
    ap.add_argument("--fallback-dir", type=Path, default=ROOT / "results" / "paperless_invoices_v5")
    a = ap.parse_args()

    ids = json.loads(a.ids_file.read_text(encoding="utf-8"))["document_ids"]

    rows = []
    matches = 0
    improved = 0
    regressed = 0
    different = 0

    print(f"\n{'Doc ID':<8} | {'Baseline Verdict':<15} | {'Single-Pass Verdict':<20} | {'Status':<12} | {'Codes (Base -> SP)':<22} | {'Grand Total':<20} | {'Lines (Base->SP)'}")
    print("-" * 125)

    for doc_id in ids:
        base_file = a.baseline_dir / f"DMS-{doc_id}_result.json"
        if not base_file.exists():
            base_file = a.fallback_dir / f"DMS-{doc_id}_result.json"

        target_file = a.target_dir / f"DMS-{doc_id}" / "result.json"
        if not target_file.exists():
            # maybe flat
            target_file = a.target_dir / f"DMS-{doc_id}_result.json"

        if not target_file.exists():
            print(f"DMS-{doc_id:<4} | [MISSING TARGET FILE: {target_file}]")
            continue

        base_res = json.loads(base_file.read_text(encoding="utf-8")) if base_file.exists() else {}
        target_res = json.loads(target_file.read_text(encoding="utf-8"))

        b_info = extract_info(base_res) if base_res else {"verdict": "N/A", "codes": [], "lines": 0}
        t_info = extract_info(target_res)

        b_v = b_info["verdict"]
        t_v = t_info["verdict"]

        b_rank = VERDICT_RANK.get(b_v, 5)
        t_rank = VERDICT_RANK.get(t_v, 5)

        if b_v == t_v:
            diff_label = "MATCH"
            matches += 1
        elif t_rank < b_rank:
            diff_label = "IMPROVED"
            improved += 1
        elif t_rank > b_rank:
            diff_label = "REGRESSED"
            regressed += 1
        else:
            diff_label = "CHANGED"
            different += 1

        b_codes_str = ",".join(b_info["codes"]) or "-"
        t_codes_str = ",".join(t_info["codes"]) or "-"
        codes_cmp = f"{b_codes_str} -> {t_codes_str}"

        gt_b = b_info.get("grand_total") or "-"
        gt_t = t_info.get("grand_total") or "-"
        gt_cmp = f"{gt_b} | {gt_t}"

        lines_cmp = f"{b_info['lines']} -> {t_info['lines']}"

        print(f"DMS-{doc_id:<4} | {b_v:<15} | {t_v:<20} | {diff_label:<12} | {codes_cmp:<22} | {gt_cmp:<20} | {lines_cmp}")
        rows.append({
            "doc_id": doc_id,
            "baseline": b_info,
            "single_pass": t_info,
            "diff_label": diff_label,
        })

    print("-" * 125)
    print(f"Total: {len(rows)} docs | Match: {matches} | Improved: {improved} | Regressed: {regressed} | Changed: {different}\n")

    out_file = a.target_dir / "comparison_vs_run_20261011.json"
    out_file.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved detailed comparison to {out_file}")


if __name__ == "__main__":
    main()
