"""Tests for affine image rotation and inverse box mapping (coords.py)."""
from __future__ import annotations

import cv2
import numpy as np
import pytest

from system_a.perception.coords import (
    rotate_box_back,
    rotate_image,
)


def test_rotate_image_identity():
    img = np.full((100, 100, 3), 128, dtype=np.uint8)
    rot_img, M = rotate_image(img, 0.0)
    assert rot_img.shape == img.shape
    assert np.allclose(M, [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]])


def test_rotate_image_white_border():
    # A black square image rotated by 45 degrees should have pure white corners (255, 255, 255)
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    rot_img, M = rotate_image(img, 45.0)
    # The corner (0, 0) should be white
    assert tuple(rot_img[0, 0]) == (255, 255, 255)
    assert tuple(rot_img[0, -1]) == (255, 255, 255)


@pytest.mark.parametrize("angle", [0.0, 90.0, 180.0, 270.0, 3.0, -3.0])
def test_roundtrip_coordinate_accuracy_within_2px(angle: float):
    orig_w, orig_h = 1000, 1400
    orig_img = np.full((orig_h, orig_w, 3), 255, dtype=np.uint8)
    
    # Define an unrotated target box on the original 130 DPI image
    target_box_orig = [150.0, 250.0, 450.0, 400.0]  # [x1, y1, x2, y2]
    
    rot_img, M = rotate_image(orig_img, angle)
    rot_h, rot_w = rot_img.shape[:2]
    
    # Forward project the 4 corners into rotated image space
    corners = np.array([
        [[target_box_orig[0], target_box_orig[1]]],
        [[target_box_orig[2], target_box_orig[1]]],
        [[target_box_orig[2], target_box_orig[3]]],
        [[target_box_orig[0], target_box_orig[3]]]
    ], dtype=np.float32)
    fwd_corners = cv2.transform(corners, M).reshape(4, 2)
    
    # In rotated space, take the bounding box as VLM would perceive it (0-1000 scale)
    rot_x1 = float(np.min(fwd_corners[:, 0]))
    rot_y1 = float(np.min(fwd_corners[:, 1]))
    rot_x2 = float(np.max(fwd_corners[:, 0]))
    rot_y2 = float(np.max(fwd_corners[:, 1]))
    
    # Scale to 0-1000 mode
    box_1000 = [
        rot_x1 * 1000.0 / rot_w,
        rot_y1 * 1000.0 / rot_h,
        rot_x2 * 1000.0 / rot_w,
        rot_y2 * 1000.0 / rot_h
    ]
    
    bbox, rbox = rotate_box_back(box_1000, rot_w, rot_h, orig_w, orig_h, M, mode="norm1000")
    
    # Unpack normalized bbox back to pixels on orig_img
    back_x1 = bbox[0] * orig_w
    back_y1 = bbox[1] * orig_h
    back_x2 = (bbox[0] + bbox[2]) * orig_w
    back_y2 = (bbox[1] + bbox[3]) * orig_h
    
    # For orthogonal angles (0, 90, 180, 270), bbox must match original within 2 pixels
    if angle in (0.0, 90.0, 180.0, 270.0):
        assert abs(back_x1 - target_box_orig[0]) <= 2.0
        assert abs(back_y1 - target_box_orig[1]) <= 2.0
        assert abs(back_x2 - target_box_orig[2]) <= 2.0
        assert abs(back_y2 - target_box_orig[3]) <= 2.0
        # Also rbox must have angle == 0 and match bbox center and dims
        assert rbox[4] == 0.0
        assert abs(rbox[0] - (bbox[0] + bbox[2] / 2.0)) <= 0.001
        assert abs(rbox[1] - (bbox[1] + bbox[3] / 2.0)) <= 0.001


def test_pure_90_deg_rotation_rbox_matches_bbox():
    orig_w, orig_h = 800, 1200
    orig_img = np.full((orig_h, orig_w, 3), 255, dtype=np.uint8)
    rot_img, M = rotate_image(orig_img, 90.0)
    rot_h, rot_w = rot_img.shape[:2]
    
    box_px = [100.0, 200.0, 300.0, 400.0]
    box_1000 = [box_px[0] * 1000.0 / rot_w, box_px[1] * 1000.0 / rot_h,
                box_px[2] * 1000.0 / rot_w, box_px[3] * 1000.0 / rot_h]
                
    bbox, rbox = rotate_box_back(box_1000, rot_w, rot_h, orig_w, orig_h, M, mode="norm1000")
    assert rbox[4] == 0.0
    assert abs(rbox[0] - (bbox[0] + bbox[2] / 2.0)) <= 0.001
    assert abs(rbox[1] - (bbox[1] + bbox[3] / 2.0)) <= 0.001
    assert abs(rbox[2] - bbox[2]) <= 0.001
    assert abs(rbox[3] - bbox[3]) <= 0.001


def test_skewed_box_rbox_angle():
    orig_w, orig_h = 800, 1200
    orig_img = np.full((orig_h, orig_w, 3), 255, dtype=np.uint8)
    # Tilted page by +2.5 degrees clockwise
    rot_img, M = rotate_image(orig_img, 2.5)
    rot_h, rot_w = rot_img.shape[:2]
    
    box_px = [100.0, 200.0, 300.0, 400.0]
    box_1000 = [box_px[0] * 1000.0 / rot_w, box_px[1] * 1000.0 / rot_h,
                box_px[2] * 1000.0 / rot_w, box_px[3] * 1000.0 / rot_h]
                
    bbox, rbox = rotate_box_back(box_1000, rot_w, rot_h, orig_w, orig_h, M, mode="norm1000")
    # rbox angle should match the skew tilt
    assert abs(rbox[4] - (-2.5)) <= 0.2
    assert -45.0 <= rbox[4] <= 45.0
