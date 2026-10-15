# Image Orientation & BBox Rotation-Back Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement deterministic image orientation (PP-LCNet 0/90/180/270) and horizontal projection profile skew measurement (±10°), with exact affine inverse bounding box & rbox mapping in `src/system_a` without LLM angle guessing.

**Architecture:** 
1. Render pages at 80 DPI; detect coarse orientation using PP-LCNet (PaddleOCR `PP-LCNet_x1_0_doc_ori.onnx` via `cv2.dnn` with `onnxruntime` fallback) and fine skew using Horizontal Projection Profile variance.
2. Rotate 80 DPI pages upright before the single classify VLM call (removing rotation estimation from prompt).
3. Render invoice pages at 130 DPI, rotate upright by total angle yielding transformation matrix $M$, and run extract VLM call.
4. Pass all model output boxes through `PageAnswer.region()` using $M_{inv} = \text{cv2.invertAffineTransform}(M)$ to project boxes back to the original unrotated 130 DPI image space, producing standard upright `bbox` and optional oriented `rbox`.

**Tech Stack:** Python 3.11, OpenCV (`opencv-python-headless`), NumPy, PyMuPDF, Pytest.

---

### Task 1: Dependencies, Model Asset & Orientation Detection Module

**Files:**
- Modify: `pyproject.toml`
- Create: `src/system_a/models/PP-LCNet_x1_0_doc_ori.onnx` (and sha256 verification)
- Create: `src/system_a/perception/orientation.py`
- Test: `tests/test_orientation.py`

**Step 1: Write failing test for PP-LCNet loader and label mapping**

Write `tests/test_orientation.py` verifying:
- Model loading via `cv2.dnn` (fallback `onnxruntime`).
- Preprocessing matches official `inference.yml`: resize short 256, center crop 224x224, normalize mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225].
- Label mapping on real document images rotated to 0°, 90°, 180°, 270°.
- Confidence < 0.9 returns $r=0$ and `uncertain=True`.

**Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_orientation.py -v`  
Expected: FAIL (module/model not found).

**Step 3: Implement `orientation.py` model inference and download ONNX asset**

- Add `opencv-python-headless` and `numpy` to `pyproject.toml`.
- Download/place `PP-LCNet_x1_0_doc_ori.onnx` in `src/system_a/models/`.
- Implement `load_orientation_model()` with `cv2.dnn` and fallback `onnxruntime`.
- Implement `detect_coarse_orientation(img_rgb) -> tuple[int, float, bool, str]` returning `(r, confidence, uncertain, runtime_name)`.

**Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_orientation.py -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add pyproject.toml src/system_a/models/ tests/test_orientation.py src/system_a/perception/orientation.py
git commit -m "feat(orientation): implement PP-LCNet coarse orientation detector"
```

---

### Task 2: Horizontal Projection Profile Skew Measurement

**Files:**
- Modify: `src/system_a/perception/orientation.py`
- Modify: `tests/test_orientation.py`

**Step 1: Write failing test for skew measurement**

Add tests to `tests/test_orientation.py`:
- Synthetic document with ±3.0° rotation detected within ±0.2°.
- True horizontal document yields `skew == 0.0`.
- Sparse text document yields `skew == 0.0`.
- Determinism: 10 repeated runs yield identical values.
- Combined `detect_page_orientation(img)`: returns `OrientationResult(r, confidence, uncertain, skew, total, runtime)`.

**Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_orientation.py -k "test_skew" -v`  
Expected: FAIL (`measure_skew` not implemented).

**Step 3: Implement Horizontal Projection Profile**

- Binarize image (grayscale + Otsu/adaptive threshold).
- Search coarse grid $-10.0^\circ$ to $+10.0^\circ$ step $0.5^\circ$.
- Search fine grid around peak $\pm 0.5^\circ$ step $0.1^\circ$.
- If $|\text{skew}| < 0.3^\circ$ or variance peak is flat, return `0.0`.
- Implement `detect_page_orientation(img_rgb)` executing PP-LCNet coarse rotation first, then upright skew measurement, summing to `total`.

**Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_orientation.py -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/system_a/perception/orientation.py tests/test_orientation.py
git commit -m "feat(orientation): implement projection profile skew measurement"
```

---

### Task 3: Affine Image Rotation & Inverse Coordinate Mapping

**Files:**
- Modify: `src/system_a/perception/coords.py`
- Test: `tests/test_coords_rotation.py`

**Step 1: Write failing test for affine image rotation & inverse box mapping**

Write `tests/test_coords_rotation.py` asserting:
- `rotate_image(img, angle)` returns `(rot_img, M)` with white background `(255, 255, 255)`.
- `rotate_box_back(box_norm1000, rot_w, rot_h, orig_w, orig_h, M)` returns `(bbox, rbox)`.
- Invertibility: A box defined on original 130 DPI image rotated by 0°, 90°, 180°, 270°, and ±3° maps back to original position within $\le 2$ pixels.
- Pure 90° rotation without skew yields `rbox[4] == 0.0` and `rbox` matching `bbox`.
- `rbox` format is strictly `[cx, cy, w, h, angle]` normalized to $[0, 1]$ against `(orig_w, orig_h)` with `angle` in $[-45^\circ, +45^\circ]$.

**Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_coords_rotation.py -v`  
Expected: FAIL (`rotate_image` / `rotate_box_back` not found).

**Step 3: Implement `rotate_image` and `rotate_box_back` in `coords.py`**

- `rotate_image(img, angle)`: compute expanded bound, get 2D rotation matrix with translation, apply `cv2.warpAffine` with `borderValue=(255, 255, 255)`.
- `rotate_box_back(box, rot_w, rot_h, orig_w, orig_h, M)`:
  - Convert box to pixel corners $[(x_1, y_1), (x_2, y_1), (x_2, y_2), (x_1, y_2)]$ on rotated image.
  - Invert matrix: $M_{inv} = \text{cv2.invertAffineTransform}(M)$.
  - Multiply corners by $M_{inv}$ to obtain points on original image.
  - Compute axis-aligned bounding box `bbox = [min_x/orig_w, min_y/orig_h, w/orig_w, h/orig_h]`.
  - Compute minimum area bounding box or oriented box `rbox = [cx/orig_w, cy/orig_h, bw/orig_w, bh/orig_h, angle]`.

**Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_coords_rotation.py -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/system_a/perception/coords.py tests/test_coords_rotation.py
git commit -m "feat(coords): implement affine image rotation and inverse box mapping"
```

---

### Task 4: Contracts & Schema Compatibility Updates

**Files:**
- Modify: `src/system_a/domain/contracts.py`
- Modify: `src/system_a/domain/assembler.py`
- Modify: `schemas/result-3.0.schema.json`
- Test: `tests/test_schema_scenarios.py`

**Step 1: Write failing test verifying schema compatibility with optional `rbox`**

Add tests to ensure `Region`, `RegionNode`, and `ocr.elements` accept optional `rbox`, and that `python -X utf8 -m system_a.sandbox.scenarios --schema` validates cleanly.

**Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_ocr_improvements.py -k "rbox" -v`  
Expected: FAIL.

**Step 3: Implement contract and schema changes**

- In `contracts.py`: add optional `rbox: Optional[tuple[float, float, float, float, float]] = None` to `Region` and `RegionNode`.
- In `assembler.py`: copy `region.rbox` to `ocr.elements[i]["rbox"]`.
- In `schemas/result-3.0.schema.json`: add optional `"rbox": {"type": "array", "minItems": 5, "maxItems": 5, "items": {"type": "number"}}` to `ocr.elements.items`.
- Run `python -X utf8 -m system_a.sandbox.scenarios --schema`.

**Step 4: Run test to verify all scenarios pass**

Run: `python -X utf8 -m system_a.sandbox.scenarios --schema`  
Expected: 68/68 PASSED.

**Step 5: Commit**

```bash
git add src/system_a/domain/contracts.py src/system_a/domain/assembler.py schemas/result-3.0.schema.json
git commit -m "feat(schema): add optional rbox to Region, RegionNode and result-3.0 schema"
```

---

### Task 5: Pipeline Integration (`SinglePassPipeline`)

**Files:**
- Modify: `src/system_a/perception/single_pass.py`
- Modify: `config/prompts/single_pass_classify.md`
- Test: `tests/test_single_pass.py`

**Step 1: Write failing test for single-pass orientation pipeline integration**

In `tests/test_single_pass.py`:
- Mock/test `SinglePassPipeline.extract()` with simulated rotated PDF.
- Assert `extra["orientation"][page]` contains `{"r", "confidence", "uncertain", "skew", "total", "runtime"}`.
- Assert all boxes in `reads[p]` are mapped through `PageAnswer.region()` and return correct unrotated bboxes.
- Assert prompt for `single_pass_classify` no longer requests `r` or `rotate_degrees`.

**Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_single_pass.py -k "test_orientation_pipeline" -v`  
Expected: FAIL.

**Step 3: Integrate Orientation & Affine Inversion into `single_pass.py`**

- In `single_pass.py`:
  - Step 1 (80 DPI): Measure `detect_page_orientation()` for all pages.
  - Store results in `extra["orientation"][p]`.
  - Rotate 80 DPI pages upright by `total` angle before passing to `_ask("classify", ...)`.
  - Remove rotation guessing from `config/prompts/single_pass_classify.md`.
  - Step 2 (130 DPI): Render selected invoice pages at 130 DPI, rotate upright using `rotate_image(img, total)` yielding `(rot_img, M)`.
  - In `PageAnswer.region()`: map all bounding boxes back to unrotated original 130 DPI dimensions using `rotate_box_back(..., M)`.
  - Embed model sha256 + runtime in `self.code_version` and perception metadata.

**Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_single_pass.py -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/system_a/perception/single_pass.py config/prompts/single_pass_classify.md tests/test_single_pass.py
git commit -m "feat(perception): integrate code-based orientation and bbox inverse mapping into single-pass pipeline"
```

---

### Task 6: Full Regression Verification & Live Portal Validation

**Files:**
- Update: `docs/plans/task.md`

**Step 1: Run complete engine test suite**

Run: `python -m pytest tests/ -q`  
Expected: 107+ tests pass.

**Step 2: Run complete test-portal test suite**

Run: `python -m pytest src/test-portal -q`  
Expected: 153/153 tests pass.

**Step 3: Run sandbox schema verification**

Run: `python -X utf8 -m system_a.sandbox.scenarios --schema`  
Expected: 68/68 passed with schema valid.

**Step 4: Verify against test documents in Test Portal**

Run check / batch test on DMS-20, DMS-19, DMS-31, DMS-53 to verify:
- Correct upright reading.
- BBoxes align with unrotated original pages in Portal display.
- Orientation metadata populated in result payload.

**Step 5: Commit & update task tracker**

```bash
git add docs/plans/task.md
git commit -m "docs: update task tracker for orientation and bbox rotation implementation"
```
