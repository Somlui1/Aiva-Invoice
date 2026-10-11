# Streamlining MANUAL_REVIEW into REVIEW and AUTO_PASS Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate false `MANUAL_REVIEW` triggers across Rules V-06, V-05, V-07, and V-08 so that verified invoices with matching Oracle receipts and amounts promote cleanly to `AUTO_PASS` or `REVIEW`.

**Architecture:** Update domain rules in `src/system_a/domain/rules.py` and `src/system_a/domain/v08.py` to:
1. Waive deliverer signatures in V-06 when Oracle EBS confirms the warehouse receipt.
2. Demote unconfident customer addresses in V-05 to Medium `E07` (yielding `REVIEW`) when Tax ID and Name are verified.
3. Allow exact-amount milestone installments in V-07 and V-08 to pass when line amounts equal receipt amounts 100%.
4. Remove redundant `manual_review` overrides in V-08 for UOM mismatches, letting Rule V-07's Medium `E10` govern the `REVIEW` verdict.

**Tech Stack:** Python 3.11, pytest, Decimal arithmetic, System A Domain Verification Engine.

---

### Task 1: Rule V-06 Deliverer Signature Waiver on Confirmed Receipt

**Files:**
- Modify: `src/system_a/domain/rules.py:136-153`
- Create: `tests/test_manual_review_streamlining.py`

**Step 1: Write the failing test**

```python
import pytest
from decimal import Decimal
from system_a.domain.rules import v06_signatures, Ctx, RuleOutcome
from system_a.domain.contracts import InvoiceDoc, SignatureObs

def test_v06_waives_deliverer_when_oracle_receipt_confirmed():
    doc = InvoiceDoc(document_id="D1", pages_complete=True,
                     signatures={"receiver": SignatureObs(present=True, confidence=0.9),
                                 "deliverer": SignatureObs(present=None, confidence=0.5)})
    # Snapshot has confirmed receipt
    snapshot = type("Snapshot", (), {"found": True, "active": [1]})()
    std = type("Std", (), {"policy": {"signature": {"min_confidence": 0.8}}})()
    c = Ctx(doc=doc, snapshot=snapshot, std=std)
    res = v06_signatures(c)
    assert res.result == "pass"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_manual_review_streamlining.py -k test_v06_waives_deliverer_when_oracle_receipt_confirmed -v`
Expected: FAIL with `AssertionError: assert 'manual_review' == 'pass'`

**Step 3: Write minimal implementation**

In `src/system_a/domain/rules.py`:
In `v06_signatures(c: Ctx)`:
If Oracle receipt exists (`getattr(c.snapshot, "found", False) and bool(getattr(c.snapshot, "active", []))`) and `unsure == ["deliverer"]` and not `out`:
Waive deliverer signature and return `_ok("V-06", detail="ยืนยันการรับของจากใบรับสินค้าใน Oracle EBS")`.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_manual_review_streamlining.py -k test_v06_waives_deliverer_when_oracle_receipt_confirmed -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/domain/rules.py tests/test_manual_review_streamlining.py
git commit -m "feat(rules): waive deliverer signature in V-06 when Oracle receipt confirmed"
```

---

### Task 2: Rule V-05 Address AI Uncertainty Demotion to Medium E07

**Files:**
- Modify: `src/system_a/domain/rules.py:311-326`
- Test: `tests/test_manual_review_streamlining.py`

**Step 1: Write the failing test**

```python
def test_v05_demotes_address_uncertainty_to_medium_e07_when_tax_id_matches():
    # Tax ID and Name match, but address confidence < 0.85
    # Must emit finding with code E07, severity Medium, result fail (so document becomes REVIEW), NOT manual_review
    ...
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_manual_review_streamlining.py -k test_v05_demotes_address_uncertainty -v`
Expected: FAIL

**Step 3: Write minimal implementation**

In `src/system_a/domain/rules.py`:
In `v05_customer()`:
When `data.get("tax_id_match") is True` and `float(r.get("confidence", 0)) < th`:
Do not return `RuleOutcome("V-05", "manual_review", ...)`.
Instead, append `_f(c, "E07", "V-05", "AI ไม่มั่นใจเรื่องที่อยู่ลูกค้า", "Medium", ...)` to findings and continue.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_manual_review_streamlining.py -k test_v05_demotes_address_uncertainty -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/domain/rules.py tests/test_manual_review_streamlining.py
git commit -m "feat(rules): demote uncertain customer address in V-05 to Medium E07"
```

---

### Task 3: Rule V-07 & V-08 Milestone Installment Exact-Amount Matching

**Files:**
- Modify: `src/system_a/domain/rules.py:404-411, 452-456`
- Modify: `src/system_a/domain/v08.py:35-50`
- Test: `tests/test_manual_review_streamlining.py`

**Step 1: Write the failing test**

```python
def test_v07_v08_milestone_installment_exact_amount_matches():
    # Invoice line: 1 SET x 42,000 = 42,000
    # Receipt line: 0.7 SET x 60,000 = 42,000
    # Exact amount diff == 0.00 -> both V-07 and V-08 pass
    ...
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_manual_review_streamlining.py -k test_v07_v08_milestone_installment -v`
Expected: FAIL

**Step 3: Write minimal implementation**

In `src/system_a/domain/rules.py`:
If all installments have `diff == 0.00` and `sub_total == receipt_total`:
Mark V-07 as pass (`_ok("V-07", installments=installments)`).
In `v08_quantity()`:
Do not force `results` to `manual_review` when amounts match; evaluate against the installment ratio.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_manual_review_streamlining.py -k test_v07_v08_milestone_installment -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/domain/rules.py src/system_a/domain/v08.py tests/test_manual_review_streamlining.py
git commit -m "feat(matching): pass milestone installment lines when exact amount matches"
```

---

### Task 4: Rule V-08 UOM Mismatch Delegation to Rule V-07 E10

**Files:**
- Modify: `src/system_a/domain/v08.py:31-48, 86-103`
- Test: `tests/test_manual_review_streamlining.py`

**Step 1: Write the failing test**

```python
def test_v08_uom_mismatch_delegates_to_v07_e10_without_manual_review():
    # Line has different UOM group (e.g. SET vs KG)
    # V-08 should mark not_evaluated / skip (halted_by V-07), allowing V-07's E10 Medium to yield REVIEW
    ...
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_manual_review_streamlining.py -k test_v08_uom_mismatch_delegates -v`
Expected: FAIL

**Step 3: Write minimal implementation**

In `src/system_a/domain/v08.py`:
When `not comparable`:
Instead of `expected[n] = ("manual_review", None)`, set `expected[n] = ("not_evaluated", None)` with halt reason `"V-07 UOM Mismatch"`.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_manual_review_streamlining.py -k test_v08_uom_mismatch_delegates -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/domain/v08.py tests/test_manual_review_streamlining.py
git commit -m "feat(rules): delegate UOM mismatch in V-08 to V-07 E10 without manual review"
```

---

### Task 5: Full Regression & Target DMS Verification

**Files:**
- Test: Entire pytest test suite & sandbox scenarios
- Update: `docs/plans/task.md`

**Step 1: Run full pytest suite**

Run: `pytest -q`
Expected: All tests pass.

**Step 2: Run sandbox golden scenarios**

Run: `python -m system_a.sandbox.scenarios --schema`
Expected: 62/62 scenarios pass with zero drift.

**Step 3: Verify target documents**

Run:
```bash
python scripts/test_paperless_invoices.py --doc-id 20 --out-dir results/test_run
python scripts/test_paperless_invoices.py --doc-id 72 --out-dir results/test_run
python scripts/test_paperless_invoices.py --doc-id 120 --out-dir results/test_run
```
Expected:
- `DMS-20`: Upgrades from `MANUAL_REVIEW` $\rightarrow$ **`AUTO_PASS`** (deliverer signature waived).
- `DMS-72`: Upgrades from `MANUAL_REVIEW` $\rightarrow$ **`AUTO_PASS`** (installment exact amount matched).
- `DMS-120`: Remains safely in **`MANUAL_REVIEW`** (no receipt in EBS).

**Step 4: Update task.md and commit**

```bash
git add docs/plans/task.md
git commit -m "test(regression): verify streamlined manual review rules on target documents"
```
