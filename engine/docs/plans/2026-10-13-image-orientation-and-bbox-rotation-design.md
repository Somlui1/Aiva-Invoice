# Image Orientation & BBox Rotation-Back Design

**Date:** 2026-10-13  
**Status:** Approved  
**Target:** `engine/src/system_a`

---

## 1. Problem & Context

1. **Landscape pages rotated incorrectly:** When a document is naturally wide/landscape, VLM classifies it as rotated and commands an unwanted rotation.
2. **Sideways/Upside-down pages mismatch Portal display:** Scanned pages rotated 90°/180°/270° must be rotated upright before VLM extraction; however, bounding boxes returned by VLM currently correspond to the rotated image rather than the unrotated original page displayed by Test Portal.
3. **Slight skew causes cross-row extraction and loose boxes:** Documents scanned with a slight skew (±1° to ±5°) cause VLM bounding boxes to drift outside text lines and risk reading numeric values across table rows.
4. **VLM angle estimation is non-deterministic:** Asking VLM to output rotation angles yields inconsistent results between runs.

---

## 2. Core Solution Architecture

Orientation and skew are measured deterministically using computer vision code (no AI LLM calls, no PDF text layer dependence):

```
PDF
 ├── ① Render all pages at 80 DPI (for orientation measurement & classify)
 ├── ② Measure angles via code:
 │     1. PP-LCNet (coarse orientation: 0, 90, 180, 270)
 │     2. Rotate image upright by coarse orientation r
 │     3. Horizontal Projection Profile (fine skew: ±10.0°, coarse 0.5° + fine 0.1°)
 │     4. total_angle = r + skew
 ├── ③ Classify (1 VLM multi-image call on upright 80 DPI pages, prompt without 'r')
 ├── ④ Extract (1 VLM call per selected invoice page, rendered at 130 DPI rotated by total_angle)
 └── ⑤ Invert BBox & RBox via PageAnswer.region():
       Rotate 4 box corners back using M_inv = invertAffineTransform(M)
       - bbox: upright axis-aligned [x, y, w, h] (normalized against original unrotated 130 DPI image)
       - rbox: oriented [cx, cy, w, h, angle] (normalized against original unrotated 130 DPI image)
```

---

## 3. Detailed Component Specifications

### 3.1 Model Preprocessing & Inference (`PP-LCNet_x1_0_doc_ori`)

Preprocessing parameters are strictly loaded from `inference.yml` of `PP-LCNet_x1_0_doc_ori`:

* **Model Name:** `PP-LCNet_x1_0_doc_ori`
* **Storage Location:** `src/system_a/models/PP-LCNet_x1_0_doc_ori.onnx`
* **Official Preprocessing Spec:**
  * **Resize:** Resize shorter side to `256` (`resize_short: 256`)
  * **Crop:** Center crop to `224 × 224`
  * **Color Order:** RGB (CHW format)
  * **Normalization:** 
    $$\text{normalized} = \left(\frac{\text{pixel}}{255.0} - \text{mean}\right) / \text{std}$$
    $$\text{mean} = [0.485, 0.456, 0.406], \quad \text{std} = [0.229, 0.224, 0.225]$$
* **Label Mapping:**
  * Classes: `['0', '90', '180', '270']`
  * Meaning: The rotation angle of the input image (clockwise).
  * Threshold: Confidence $\ge 0.90$. If confidence $< 0.90$, fallback to $r = 0$ with `uncertain = True`.

### 3.2 Runtime Selection & Cache Integrity

* **Selection Strategy:** Try `cv2.dnn.readNetFromONNX()` first. If loading or forward inference fails, fallback to `onnxruntime.InferenceSession`.
* **Runtime Recording:** Selected runtime (`cv2.dnn` or `onnxruntime`) is recorded in metadata:
  ```python
  extra["orientation"][page_no] = {
      "r": r,
      "confidence": round(confidence, 3),
      "uncertain": uncertain,
      "skew": round(skew, 2),
      "total": round(total, 2),
      "runtime": runtime_name,
  }
  ```
* **Cache Key Integrity:** Model file's `sha256` hash and `runtime` are added to the perception engine cache key and code version hash.

### 3.3 Horizontal Projection Profile Skew Measurement

* **Input:** Image uprighted by coarse orientation $r$.
* **Algorithm:**
  1. Grayscale & adaptive thresholding / Otsu binarization (foreground text = 1, background = 0).
  2. Coarse search: $-10.0^\circ$ to $+10.0^\circ$ in steps of $0.5^\circ$.
  3. Fine search: around coarse peak $\pm 0.5^\circ$ in steps of $0.1^\circ$.
  4. Objective: Maximize horizontal row projection variance $\text{Var}\left(\sum_x \text{row}(y)\right)$.
  5. Threshold: If $|\text{skew}| < 0.3^\circ$ or variance peak is indistinct (sparse text/no text), $\text{skew} = 0.0$.
* **Exclusions:** No Hough line transform, no MinAreaRect (avoids stamp/logo/signature distortions).

### 3.4 Image Rotation & Affine Transformation

* **Forward Rotation Function:** `rotate_image(img, total_angle) -> (rotated_img, M)`
  * Computes bounding rectangle size for rotation without clipping.
  * `M = cv2.getRotationMatrix2D(center, -total_angle, 1.0)` with translation adjustment.
  * `rotated_img = cv2.warpAffine(img, M, (new_w, new_h), borderValue=(255, 255, 255))` (pure white background).
* **Inverse Transformation Matrix:**
  * $M_{inv} = \text{cv2.invertAffineTransform}(M)$.

### 3.5 BBox & RBox Inverse Mapping (`PageAnswer.region`)

All boxes (header fields, line items, table cells, folded rows, signatures, stamps) pass through `PageAnswer.region()`:

1. **Pixel Frame:**
   * $W_{orig}, H_{orig}$ = pixel dimensions of the 130 DPI image **before rotation** (never PDF points).
   * $W_{rot}, H_{rot}$ = pixel dimensions of the 130 DPI image **after rotation**.
2. **Coordinate Transformation:**
   * VLM box $[x_1, y_1, x_2, y_2]$ (0–1000) $\rightarrow$ converted to pixel rectangle on rotated image.
   * 4 corner points in pixel: $[(x_1, y_1), (x_2, y_1), (x_2, y_2), (x_1, y_2)]$.
   * Multiply each corner point by $M_{inv}$ to obtain 4 corners on original image: $[(X_i, Y_i)]_{i=1}^4$.
3. **Standard `bbox` (Axis-Aligned):**
   * $x = \min(X_i) / W_{orig}$, $y = \min(Y_i) / H_{orig}$
   * $w = (\max(X_i) - \min(X_i)) / W_{orig}$, $h = (\max(Y_i) - \min(Y_i)) / H_{orig}$
   * Clamped to $[0.0, 1.0]$.
4. **Oriented `rbox`:**
   * Format: $[cx, cy, w, h, \text{angle}]$
   * $cx = \text{center}_x / W_{orig}$, $cy = \text{center}_y / H_{orig}$
   * $w = \text{width} / W_{orig}$, $h = \text{height} / H_{orig}$
   * $\text{angle}$: degrees, positive = clockwise, constrained to $[-45^\circ, +45^\circ]$.
   * For pure $90^\circ/180^\circ/270^\circ$ rotation without skew: $\text{angle} = 0.0$ and $rbox$ center/dimensions match $bbox$.

---

## 4. Contracts & Schema Compatibility

* **Domain Contract (`contracts.py`):**
  Add optional `rbox: Optional[tuple[float, float, float, float, float]] = None` to `Region` and `RegionNode`.
* **Assembler (`assembler.py`):**
  Copy `region.rbox` to `ocr.elements[i]["rbox"]`.
* **Result Schema (`schemas/result-3.0.schema.json`):**
  Add optional property to `ocr.elements.items`:
  ```json
  "rbox": {
    "type": "array",
    "minItems": 5,
    "maxItems": 5,
    "items": {"type": "number"}
  }
  ```
* **Safety Gate:**
  * Orientation values must NOT alter `pages_complete`, rules `V-01` through `V-09`, or create new error codes.
  * All 68 sandbox scenarios under `python -X utf8 -m system_a.sandbox.scenarios --schema` must continue to pass.

---

## 5. Verification & Test Plan

1. **Geometric Invertibility Test:**
   * Test page rotated by $0^\circ, 90^\circ, 180^\circ, 270^\circ$ and $\pm 3^\circ$.
   * Inverse transformed bbox corners must match original positions within $\le 2$ pixels at 130 DPI.
2. **True Landscape Test:**
   * Real landscape document page must yield `total = 0.0`.
3. **Sparse Text Test:**
   * Document page with minimal or no text must yield `skew = 0.0`.
4. **Determinism Test:**
   * 10 repeated runs on the same document must yield identical angle values.
5. **Real-Document Label Mapping Test:**
   * Real invoice pages manually rotated to 0°, 90°, 180°, 270° tested against the production runtime to verify class index mapping.
6. **Pure 90° Rotation Test:**
   * Document rotated $90^\circ$ with $0^\circ$ skew must yield `rbox.angle == 0.0` and `rbox` matching `bbox`.
7. **Regression Test Suite:**
   * 107/107 engine unit tests pass.
   * 153/153 test-portal tests pass.
   * 68/68 sandbox scenarios pass with valid schema.
