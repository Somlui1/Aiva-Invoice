"""Deterministic Document Orientation and Skew Measurement.

Combines:
1. PP-LCNet (PP-LCNet_x1_0_doc_ori) via cv2.dnn (fallback onnxruntime) for coarse rotation (0, 90, 180, 270).
2. Horizontal Projection Profile variance for fine skew detection (±10.0°).
No LLM calls, no PDF text layer dependence.
"""
from __future__ import annotations

import dataclasses
import hashlib
from pathlib import Path
from typing import Optional, Tuple

import cv2
import numpy as np

MODEL_FILENAME = "PP-LCNet_x1_0_doc_ori.onnx"
MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / MODEL_FILENAME
MODEL_SHA256 = "10453f80f6f50e8149161aef61b265119471e4010263a82682e5695914236f27"
CONFIDENCE_THRESHOLD = 0.90
LABELS = (0, 90, 180, 270)

_CACHED_NET = None
_CACHED_RUNTIME = None


@dataclasses.dataclass(frozen=True)
class OrientationResult:
    r: int                    #: Coarse orientation in degrees clockwise (0, 90, 180, 270)
    confidence: float         #: Model prediction probability (0.0 .. 1.0)
    uncertain: bool           #: True if confidence < threshold (forced r=0)
    skew: float               #: Fine skew angle in degrees clockwise (±10.0°)
    total: float              #: Combined angle (r + skew)
    runtime: str              #: Runtime used ('cv2.dnn' or 'onnxruntime')


def load_orientation_model() -> Tuple[object, str]:
    """Load PP-LCNet ONNX model via cv2.dnn with onnxruntime fallback."""
    global _CACHED_NET, _CACHED_RUNTIME
    if _CACHED_NET is not None:
        return _CACHED_NET, _CACHED_RUNTIME

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"PP-LCNet orientation model not found at {MODEL_PATH}")

    # 1. Try cv2.dnn
    try:
        net = cv2.dnn.readNetFromONNX(str(MODEL_PATH))
        # Warmup test with dummy tensor
        dummy = np.zeros((1, 3, 224, 224), dtype=np.float32)
        net.setInput(dummy)
        _ = net.forward()
        _CACHED_NET, _CACHED_RUNTIME = net, "cv2.dnn"
        return _CACHED_NET, _CACHED_RUNTIME
    except Exception:
        pass

    # 2. Fallback to onnxruntime
    try:
        import onnxruntime as ort
        sess = ort.InferenceSession(str(MODEL_PATH))
        _CACHED_NET, _CACHED_RUNTIME = sess, "onnxruntime"
        return _CACHED_NET, _CACHED_RUNTIME
    except Exception as e:
        raise RuntimeError(f"Failed to load PP-LCNet model with both cv2.dnn and onnxruntime: {e}") from e


def preprocess_orientation_image(img_rgb: np.ndarray) -> np.ndarray:
    """Preprocess image according to official PP-LCNet_x1_0_doc_ori inference.yml spec.

    1. Resize shorter side to 256
    2. Center crop 224x224
    3. Normalize with ImageNet mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225], scale=1/255.0
    4. Format as NCHW float32
    """
    h, w = img_rgb.shape[:2]
    if w < h:
        new_w, new_h = 256, int(round(h * 256.0 / w))
    else:
        new_h, new_w = 256, int(round(w * 256.0 / h))

    resized = cv2.resize(img_rgb, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    start_y = max(0, (new_h - 224) // 2)
    start_x = max(0, (new_w - 224) // 2)
    cropped = resized[start_y:start_y + 224, start_x:start_x + 224]

    norm = cropped.astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    norm = (norm - mean) / std

    chw = np.transpose(norm, (2, 0, 1))
    return np.expand_dims(chw, 0)


def detect_coarse_orientation(img_rgb: np.ndarray,
                              threshold: float = CONFIDENCE_THRESHOLD) -> Tuple[int, float, bool, str]:
    """Detect coarse orientation 0/90/180/270 using PP-LCNet."""
    net, runtime = load_orientation_model()
    blob = preprocess_orientation_image(img_rgb)

    if runtime == "cv2.dnn":
        net.setInput(blob)
        probs = net.forward()[0]
    else:
        input_name = net.get_inputs()[0].name
        output_name = net.get_outputs()[0].name
        probs = net.run([output_name], {input_name: blob})[0][0]

    cls_idx = int(np.argmax(probs))
    conf = float(probs[cls_idx])
    detected_angle = LABELS[cls_idx]

    if conf < threshold:
        return 0, round(conf, 4), True, runtime
    return detected_angle, round(conf, 4), False, runtime


def measure_skew(img_rgb: np.ndarray) -> float:
    """Measure fine document skew (±10.0°) using Horizontal Projection Profile variance.

    Returns:
        Skew angle in degrees clockwise. If |skew| < 0.3° or sparse/no text, returns 0.0.
    """
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY) if img_rgb.ndim == 3 else img_rgb
    h, w = gray.shape[:2]

    # Crop 5% border margin to eliminate scan edge shadows
    my, mx = int(h * 0.05), int(w * 0.05)
    cropped = gray[my:h - my, mx:w - mx]
    if cropped.size == 0:
        return 0.0

    # Inverted Otsu threshold: text = 255, background = 0
    _, thresh = cv2.threshold(cropped, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Check foreground pixel count: sparse or empty page returns 0.0
    fg_count = np.count_nonzero(thresh)
    if fg_count < 400:
        return 0.0

    ch, cw = thresh.shape[:2]
    center = (cw / 2.0, ch / 2.0)

    # 1. Coarse search: -10.0° to +10.0° in steps of 0.5°
    angles_coarse = np.arange(-10.0, 10.1, 0.5)
    best_coarse = 0.0
    max_var = -1.0
    vars_list = []

    for a in angles_coarse:
        # To test clockwise tilt 'a', we rotate counter-clockwise by 'a' (cv2 angle = +a)
        M = cv2.getRotationMatrix2D(center, float(a), 1.0)
        rot = cv2.warpAffine(thresh, M, (cw, ch), flags=cv2.INTER_NEAREST, borderValue=0)
        proj = np.sum(rot, axis=1, dtype=np.float64)
        v = float(np.var(proj))
        vars_list.append(v)
        if v > max_var:
            max_var = v
            best_coarse = float(a)

    # Check distinctiveness of the variance peak
    min_var = min(vars_list)
    if min_var > 0 and (max_var / min_var) < 1.15:
        return 0.0

    # 2. Fine search: around best_coarse ±0.5° in steps of 0.1°
    angles_fine = np.arange(best_coarse - 0.5, best_coarse + 0.51, 0.1)
    best_fine = best_coarse
    for a in angles_fine:
        M = cv2.getRotationMatrix2D(center, float(a), 1.0)
        rot = cv2.warpAffine(thresh, M, (cw, ch), flags=cv2.INTER_NEAREST, borderValue=0)
        proj = np.sum(rot, axis=1, dtype=np.float64)
        v = float(np.var(proj))
        if v > max_var:
            max_var = v
            best_fine = float(a)

    res = round(float(best_fine), 2)
    return 0.0 if abs(res) < 0.3 else res


def detect_page_orientation(img_rgb: np.ndarray,
                            threshold: float = CONFIDENCE_THRESHOLD) -> OrientationResult:
    """Measure coarse and fine orientation of a page image.

    Sequence:
    1. PP-LCNet determines coarse orientation r (0/90/180/270).
    2. Rotate image upright by coarse orientation r.
    3. Horizontal Projection Profile measures fine skew on the upright image.
    4. total = r + skew.
    """
    r, conf, uncertain, runtime = detect_coarse_orientation(img_rgb, threshold=threshold)

    # Upright image for skew measurement
    if r == 90:
        upright = cv2.rotate(img_rgb, cv2.ROTATE_90_COUNTERCLOCKWISE)
    elif r == 180:
        upright = cv2.rotate(img_rgb, cv2.ROTATE_180)
    elif r == 270:
        upright = cv2.rotate(img_rgb, cv2.ROTATE_90_CLOCKWISE)
    else:
        upright = img_rgb

    skew = measure_skew(upright)
    total = round(float(r) + skew, 2)

    return OrientationResult(
        r=r,
        confidence=conf,
        uncertain=uncertain,
        skew=skew,
        total=total,
        runtime=runtime,
    )
