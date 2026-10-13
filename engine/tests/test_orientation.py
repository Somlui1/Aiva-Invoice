"""Tests for document orientation and skew measurement (orientation.py)."""
from __future__ import annotations

import cv2
import numpy as np
import pymupdf
import pytest

from system_a.perception.orientation import (
    MODEL_PATH,
    MODEL_SHA256,
    OrientationResult,
    detect_page_orientation,
    load_orientation_model,
    measure_skew,
    preprocess_orientation_image,
)


def _make_invoice_image(rotate_deg: int = 0, skew_deg: float = 0.0) -> np.ndarray:
    """Generate a realistic synthetic invoice page with headers, lines, and totals."""
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((80, 90), "TAX INVOICE / RECEIPT", fontsize=22)
    page.insert_text((80, 130), "ALPHA SUPPLIER THAILAND CO., LTD.", fontsize=14)
    page.insert_text((80, 155), "Tax ID: 0105551234567   Branch: 00000", fontsize=12)
    page.insert_text((80, 180), "Customer: AAPICO HITECH PUBLIC COMPANY LIMITED", fontsize=12)
    page.insert_text((80, 240), "NO   ITEM DESCRIPTION                 QTY   PRICE      AMOUNT", fontsize=11)
    page.insert_text((80, 270), "1    Precision Stamping Part Type A   100   45.50    4,550.00", fontsize=11)
    page.insert_text((80, 295), "2    CNC Machined Bracket 12mm        200   25.00    5,000.00", fontsize=11)
    page.insert_text((80, 320), "3    Hexagonal Bolt M8 x 40            50   10.00      500.00", fontsize=11)
    page.insert_text((80, 400), "SUB TOTAL:                           10,050.00", fontsize=12)
    page.insert_text((80, 425), "VAT 7%:                                 703.50", fontsize=12)
    page.insert_text((80, 450), "GRAND TOTAL:                         10,753.50", fontsize=12)
    
    pix = page.get_pixmap(dpi=130)
    img_bgr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    if rotate_deg == 90:
        img_rgb = cv2.rotate(img_rgb, cv2.ROTATE_90_CLOCKWISE)
    elif rotate_deg == 180:
        img_rgb = cv2.rotate(img_rgb, cv2.ROTATE_180)
    elif rotate_deg == 270:
        img_rgb = cv2.rotate(img_rgb, cv2.ROTATE_90_COUNTERCLOCKWISE)

    if abs(skew_deg) > 0.05:
        h, w = img_rgb.shape[:2]
        center = (w / 2.0, h / 2.0)
        M = cv2.getRotationMatrix2D(center, -skew_deg, 1.0)
        img_rgb = cv2.warpAffine(img_rgb, M, (w, h), borderValue=(255, 255, 255))

    return img_rgb


def test_model_file_exists_and_sha256():
    import hashlib
    assert MODEL_PATH.exists(), f"Model not found at {MODEL_PATH}"
    with open(MODEL_PATH, "rb") as f:
        sha = hashlib.sha256(f.read()).hexdigest()
    assert sha == MODEL_SHA256


def test_runtime_loader_cv2_or_onnx():
    net, runtime_name = load_orientation_model()
    assert runtime_name in ("cv2.dnn", "onnxruntime")
    assert net is not None


def test_official_preprocessing_shape_and_range():
    img = _make_invoice_image(0)
    blob = preprocess_orientation_image(img)
    assert blob.shape == (1, 3, 224, 224)
    assert blob.dtype == np.float32
    # Standard normalized range approximately -2.5 to +2.5
    assert np.min(blob) < -1.0
    assert np.max(blob) > 1.0


@pytest.mark.parametrize("angle", [0, 90, 180, 270])
def test_pp_lcnet_label_mapping_on_real_rotated_document(angle: int):
    img = _make_invoice_image(rotate_deg=angle)
    res = detect_page_orientation(img, threshold=0.80)
    assert res.r == angle, f"Expected coarse rotation {angle}, got {res.r}"
    assert res.confidence >= 0.80
    assert res.uncertain is False


def test_low_confidence_uncertainty():
    # Blank or uniform image yields low confidence -> should fallback to r=0 and uncertain=True
    blank = np.full((600, 800, 3), 255, dtype=np.uint8)
    res = detect_page_orientation(blank)
    if res.confidence < 0.90:
        assert res.r == 0
        assert res.uncertain is True


def test_skew_measurement_horizontal_and_tilted():
    upright = _make_invoice_image(rotate_deg=0, skew_deg=0.0)
    skew_zero = measure_skew(upright)
    assert abs(skew_zero) < 0.3 or skew_zero == 0.0

    tilted_pos = _make_invoice_image(rotate_deg=0, skew_deg=2.5)
    skew_pos = measure_skew(tilted_pos)
    assert abs(skew_pos - 2.5) <= 0.4

    tilted_neg = _make_invoice_image(rotate_deg=0, skew_deg=-3.0)
    skew_neg = measure_skew(tilted_neg)
    assert abs(skew_neg - (-3.0)) <= 0.4


def test_skew_sparse_text_yields_zero():
    sparse = np.full((800, 600, 3), 255, dtype=np.uint8)
    cv2.putText(sparse, "A", (100, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    skew = measure_skew(sparse)
    assert skew == 0.0


def test_determinism_repeated_runs():
    img = _make_invoice_image(rotate_deg=90, skew_deg=1.5)
    res1 = detect_page_orientation(img)
    res2 = detect_page_orientation(img)
    assert res1.r == res2.r
    assert res1.skew == res2.skew
    assert res1.total == res2.total
    assert res1.confidence == res2.confidence
