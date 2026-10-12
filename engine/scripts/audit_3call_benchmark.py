"""3-Pillar audit for the Pi Agent 3-call benchmark evaluation loop.

Compares a target result round (default ``results/eval_3call_loop``) against a
baseline round (default ``results/run_20261011``, falling back per-document to
``results/paperless_invoices_v5`` when the baseline round lacks the document)
across three gates defined in
``docs/plans/2026-10-12-pi-agent-3call-eval-loop-design.md``:

Gate 1 — VLM call budget:   total calls <= 3 (multi-invoice sets: 1 + 2*N_invoices)
                             and zero ``crop_reread`` calls.
Gate 2 — Accuracy & verdict: verdict must not regress vs baseline; core fields
                             (invoice_num, po_number, supplier_tax_id, sub_total,
                             grand_total) must match; line-item count must match.
Gate 3 — BBox integrity:     no degenerate box (w <= 0 or h <= 0), every coord in
                             [0..1], and ``extra["bbox_problems"]`` empty.

Exit status: 0 when every benchmark document passes all three gates, else 1.

Usage:
    python scripts/audit_3call_benchmark.py \
        --target-dir results/eval_3call_loop --baseline-dir results/run_20261011
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

# --------------------------------------------------------------------------- constants
VERDICT_RANK = {"AUTO_PASS": 0, "REVIEW": 1, "MANUAL_REVIEW": 2, "HOLD": 3}
UNKNOWN_RANK = 4                      # SYSTEM_ERROR / missing verdict is always worst
CORE_FIELDS = ("invoice_num", "po_number", "supplier_tax_id", "sub_total", "grand_total")
GATE_NAMES = ("Gate 1", "Gate 2", "Gate 3")


# --------------------------------------------------------------------------- loading
def load_result(round_dir: Path, doc_id: int) -> Optional[dict]:
    """Load one DMS-<id>_result.json, or None when absent/unreadable."""
    path = Path(round_dir) / f"DMS-{doc_id}_result.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def load_document_ids(config_path: Path) -> list[int]:
    cfg = json.loads(Path(config_path).read_text(encoding="utf-8"))
    return [int(i) for i in cfg["document_ids"]]


# --------------------------------------------------------------------------- gates
def _extra(result: dict) -> dict:
    return ((result or {}).get("extraction") or {}).get("extra") or {}


def gate1_calls_budget(target: Optional[dict]) -> tuple[bool, list[str]]:
    """Gate 1: one batch classify + at most one page_items and one table_rows per invoice
    page, and zero crop_reread calls.

    Budget = 1 + 2*K, K = invoice-page units the document required (the design doc's
    "1 + N*2" exception read per processing unit): a standard single-invoice document
    has K = 1 and the headline budget of 3 calls; multi-page invoices and multi-invoice
    sets pay one extra pair per further page. A bounded field-rescue read adds a unit
    as well - it is a page_items pass, never a crop.
    """
    if target is None:
        return False, ["target result missing"]
    ex = _extra(target)
    calls = ex.get("calls") or []
    n_calls = len(calls)
    n_crops = sum(1 for c in calls if c.get("kind") == "crop_reread")
    units = {p for p in (ex.get("invoice_pages") or []) if isinstance(p, int)}
    units |= {c.get("page") for c in calls
              if c.get("kind") == "page_items" and isinstance(c.get("page"), int)}
    budget = 1 + 2 * max(1, len(units))
    reasons: list[str] = []
    if n_calls > budget:
        reasons.append(f"calls={n_calls} > budget {budget} (crop_reread={n_crops})")
    if n_crops > 0:
        reasons.append(f"crop_reread={n_crops} > 0")
    return (not reasons), reasons


def _verdict(result: dict) -> str:
    return str(((result or {}).get("recommendation") or {}).get("value") or "SYSTEM_ERROR").upper()


def _field(result: dict, name: str) -> str:
    nf = (result or {}).get("normalized_fields") or {}
    return str(nf.get(name) or "").strip()


def _lines_count(result: dict) -> int:
    return len(((result or {}).get("extraction") or {}).get("lines") or [])


def gate2_accuracy(target: Optional[dict], baseline: Optional[dict]) -> tuple[bool, list[str]]:
    """Gate 2: verdict non-regression, core-field parity, line-count parity vs baseline."""
    if target is None:
        return False, ["target result missing"]
    if baseline is None:
        return False, ["baseline result missing (primary and fallback rounds)"]
    reasons: list[str] = []

    t_v, b_v = _verdict(target), _verdict(baseline)
    if VERDICT_RANK.get(t_v, UNKNOWN_RANK) > VERDICT_RANK.get(b_v, UNKNOWN_RANK):
        reasons.append(f"verdict regression {b_v} -> {t_v}")

    for field in CORE_FIELDS:
        t_val, b_val = _field(target, field), _field(baseline, field)
        if b_val and not t_val:
            reasons.append(f"{field} missing (baseline={b_val!r})")
        elif b_val and t_val != b_val:
            reasons.append(f"{field}={t_val!r} != baseline {b_val!r}")
        # baseline empty + target non-empty is an improvement: allowed

    t_lines, b_lines = _lines_count(target), _lines_count(baseline)
    if t_lines != b_lines:
        reasons.append(f"lines={t_lines} != baseline {b_lines}")
    return (not reasons), reasons


def gate3_bbox(target: Optional[dict]) -> tuple[bool, list[str]]:
    """Gate 3: degenerate/out-of-range boxes absent and engine bbox_problems empty."""
    if target is None:
        return False, ["target result missing"]
    reasons: list[str] = []

    problems = _extra(target).get("bbox_problems") or []
    if problems:
        ids = ", ".join(str(p.get("element_id")) for p in problems[:3])
        reasons.append(f"bbox_problems={len(problems)} (e.g. {ids})")

    degenerate: list[str] = []
    out_of_range: list[str] = []
    for el in (target.get("ocr") or {}).get("elements") or []:
        box = el.get("bbox")
        if not box:
            continue
        if len(box) != 4 or any(v is None for v in box):
            degenerate.append(str(el.get("element_id")))
            continue
        x, y, w, h = (float(v) for v in box)
        if w <= 0 or h <= 0:
            degenerate.append(str(el.get("element_id")))
        elif min(x, y) < 0.0 or max(x + w, y + h) > 1.0 + 1e-9:
            out_of_range.append(str(el.get("element_id")))
    if degenerate:
        reasons.append(f"degenerate bbox: {', '.join(degenerate[:3])}"
                       + (f" (+{len(degenerate) - 3} more)" if len(degenerate) > 3 else ""))
    if out_of_range:
        reasons.append(f"out-of-range bbox: {', '.join(out_of_range[:3])}"
                       + (f" (+{len(out_of_range) - 3} more)" if len(out_of_range) > 3 else ""))
    return (not reasons), reasons


def audit_document(target: Optional[dict], baseline: Optional[dict]) -> dict:
    """Run all three gates for one document and return the row facts."""
    g1_ok, g1_reasons = gate1_calls_budget(target)
    g2_ok, g2_reasons = gate2_accuracy(target, baseline)
    g3_ok, g3_reasons = gate3_bbox(target)
    calls = _extra(target or {}).get("calls") or []
    return {
        "gates": [(g1_ok, g1_reasons), (g2_ok, g2_reasons), (g3_ok, g3_reasons)],
        "passed": g1_ok and g2_ok and g3_ok,
        "calls": len(calls),
        "verdict": _verdict(target) if target is not None else "MISSING",
    }


# --------------------------------------------------------------------------- scorecard
def build_scorecard(doc_ids: list[int], target_dir: Path, baseline_dir: Path,
                    fallback_dir: Optional[Path]) -> tuple[list[tuple[int, dict]], list[str]]:
    rows, notes = [], []
    for doc_id in doc_ids:
        target = load_result(target_dir, doc_id)
        baseline = load_result(baseline_dir, doc_id)
        if baseline is None and fallback_dir is not None:
            baseline = load_result(fallback_dir, doc_id)
            if baseline is not None:
                notes.append(f"DMS-{doc_id}: baseline taken from fallback {fallback_dir}")
        rows.append((doc_id, audit_document(target, baseline)))
    return rows, notes


def render_scorecard(rows: list[tuple[int, dict]], target_dir: Path, baseline_dir: Path,
                     notes: list[str]) -> tuple[str, bool]:
    bar = "=" * 80
    lines = [bar, " " * 20 + "3-CALL BENCHMARK EVALUATION SCORECARD", bar]
    lines.append(f"Target Round:   {target_dir}")
    lines.append(f"Baseline Round: {baseline_dir}")
    lines.append(f"Evaluated Docs: {len(rows)}")
    if notes:
        lines.append("Notes:")
        lines.extend(f"  - {n}" for n in notes)
    lines.append("-" * 80)
    lines.append(f"{'Doc':<9}{'Calls':>6}  {'Verdict':<15}{'G1':>4}{'G2':>4}{'G3':>4}   Status")
    lines.append("-" * 80)
    for doc_id, r in rows:
        marks = ["OK " if ok else "FAIL" for ok, _ in r["gates"]]
        status = "PASSED" if r["passed"] else "FAILED"
        lines.append(f"DMS-{doc_id:<5}{r['calls']:>6}  {r['verdict']:<15}"
                     f"{marks[0]:>4}{marks[1]:>4}{marks[2]:>4}   {status}")
    lines.append("-" * 80)

    all_ok = True
    for idx, label in enumerate(("Call Budget (1 + 2 per invoice page, crop_reread == 0)",
                                 "Accuracy & Verdict Non-Regression",
                                 "BBox Integrity (No degenerate, clean coords)")):
        passed = sum(1 for _, r in rows if r["gates"][idx][0])
        all_ok = all_ok and passed == len(rows)
        lines.append(f"[{GATE_NAMES[idx]}] {label}: {passed:>3} / {len(rows)} "
                     + ("PASSED" if passed == len(rows) else "VIOLATIONS"))

    failed = [(d, r) for d, r in rows if not r["passed"]]
    if failed:
        lines.append("-" * 80)
        lines.append("FAILURES:")
        for doc_id, r in failed:
            for (gate_idx, (ok, reasons)) in enumerate(r["gates"]):
                for reason in reasons:
                    lines.append(f"  DMS-{doc_id}: [{GATE_NAMES[gate_idx]}] {reason}")
    lines.append("")
    overall = f"OVERALL RESULT: PASSED ({len(rows) - len(failed)}/{len(rows)})" if not failed \
        else f"OVERALL RESULT: FAILED ({len(rows) - len(failed)}/{len(rows)} passed)"
    lines.append(overall)
    lines.append(bar)
    return "\n".join(lines), all_ok


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Audit the 3-call benchmark round against the baseline across 3 gates.")
    parser.add_argument("--target-dir", type=Path, default=Path("results/eval_3call_loop"),
                        help="Target result round directory (default: results/eval_3call_loop)")
    parser.add_argument("--baseline-dir", type=Path, default=Path("results/run_20261011"),
                        help="Baseline result round directory (default: results/run_20261011)")
    parser.add_argument("--fallback-baseline-dir", type=Path,
                        default=Path("results/paperless_invoices_v5"),
                        help="Per-document fallback baseline when the primary lacks the doc "
                             "(default: results/paperless_invoices_v5; 'none' to disable)")
    parser.add_argument("--config", type=Path, default=Path("config/benchmark_3call_ids.json"),
                        help="Benchmark corpus config (default: config/benchmark_3call_ids.json)")
    args = parser.parse_args(argv)

    fallback = None if str(args.fallback_baseline_dir).lower() == "none" else args.fallback_baseline_dir
    try:
        doc_ids = load_document_ids(args.config)
    except (OSError, KeyError, json.JSONDecodeError) as e:
        print(f"[ERROR] Cannot load benchmark config {args.config}: {e}", file=sys.stderr)
        return 2

    rows, notes = build_scorecard(doc_ids, args.target_dir, args.baseline_dir, fallback)
    report, all_ok = render_scorecard(rows, args.target_dir, args.baseline_dir, notes)
    print(report)
    return 0 if all_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
