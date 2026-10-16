"""Which coordinate frame did the model actually answer in on a rotated page?

Round 3 measured: on DMS-224 (rotate 90) the boxes had the right x and a y compressed to ~0.6-0.7x of the
printed value; on DMS-59 the same class of box drifted the other way.  That smells like the wrong *scale*
per axis, not a wrong rotation.  The payload stores only the final box, but the mapping we applied is
invertible, so the model's raw 0-1000 answer is recoverable:

    stored (orig frame) --M--> rot px --/rot_dims--> raw answer R

Then the only question is: which pair of axis scales puts those recovered boxes on the printed ink?
Every candidate frame is scored with the same ink-coverage measurement used by align.py, on the rotated
(upright) scan - no hand-labelled truth, no model calls.

    python bbox_testing/round_03/rotate_probe.py DMS-224 DMS-59
"""
from __future__ import annotations

import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "..", "src"))

import align                                              # noqa: E402  (ink machinery + frame helpers)
from system_a.perception import coords                    # noqa: E402

SRC = os.path.join(HERE, "..", "source_images")
FIELDS = ("invoice_num", "invoice_date", "supplier_name", "supplier_tax_id", "customer_name",
          "customer_tax_id", "sub_total", "vat", "grand_total")


def mask_of(img):
    g = np.asarray(img.convert("L"))
    th = align.otsu(g)
    return (g < th).astype(np.uint8)                  # ink = 1 (same convention align uses)


def hypotheses(rot_w, rot_h, orig_w, orig_h):
    """candidate (sx, sy) pixel-per-1000-unit scales for the recovered raw answer."""
    big, small = max(rot_w, rot_h), min(rot_w, rot_h)
    return {
        "A rot_dims (what the engine assumes)": (rot_w, rot_h),
        "B square = max(rot)": (big, big),
        "C square = min(rot)": (small, small),
        "D orig_dims": (orig_w, orig_h),
        "E transposed orig": (orig_h, orig_w),
        "F square = max(orig)": (max(orig_w, orig_h), max(orig_w, orig_h)),
    }


def probe(doc):
    o = json.load(open(os.path.join(align.ROUND, "ocr", f"{doc}.json"), encoding="utf-8"))
    cls = {c["page_no"]: c for c in o["meta"]["pages_classification"]}
    page = o["selected_invoice_pages"][0]
    angle = int(cls[page].get("rotate_degrees") or 0)
    img0 = Image.open(os.path.join(SRC, f"{doc}_p{page}.png")).convert("RGB")
    orig_w, orig_h = img0.size
    rot, M = coords.rotate_image(img0, angle)
    rot_w, rot_h = rot.width, rot.height
    mask = mask_of(rot)
    H, W = mask.shape[:2]
    print(f"== {doc}  page {page}  rotate={angle}  orig={orig_w}x{orig_h} rot={rot_w}x{rot_h}")

    recovered = []
    for f in FIELDS:
        v = (o["fields"] or {}).get(f)
        if not v or not v.get("bbox"):
            continue
        x, y, w, h = v["bbox"]
        pts = np.array([[[x * orig_w, y * orig_h], [(x + w) * orig_w, y * orig_h],
                         [(x + w) * orig_w, (y + h) * orig_h], [x * orig_w, (y + h) * orig_h]]], np.float32)
        in_rot = coords.cv2.transform(pts, coords.cv2.invertAffineTransform(M).astype(np.float32))[0]
        rx, ry = in_rot[:, 0].min(), in_rot[:, 1].min()
        rw, rh = in_rot[:, 0].max() - rx, in_rot[:, 1].max() - ry
        raw = [1000.0 * rx / rot_w, 1000.0 * ry / rot_h, 1000.0 * rw / rot_w, 1000.0 * rh / rot_h]
        recovered.append((f, raw))
        print(f"   {f:16s} stored y={y:.3f}  recovered raw x1={raw[0]:6.1f} y1={raw[1]:6.1f} "
              f"w={raw[2]:5.1f} h={raw[3]:5.1f}")
    if not recovered:
        return
    print("   mean ink coverage of the recovered boxes, per candidate frame:")
    for name, (sx, sy) in hypotheses(rot_w, rot_h, orig_w, orig_h).items():
        covs, lows = [], []
        for f, raw in recovered:
            box = (raw[0] * sx / W, raw[1] * sy / H, raw[2] * sx / W, raw[3] * sy / H)
            st, cov_v, cov_h, extra = align.check_box(mask, box)
            covs.append(min(cov_v, cov_h) if cov_v is not None else 0.0)
            lows.append(0.0 if (cov_v or 0) >= 0.8 and (cov_h or 0) >= 0.8 else 1.0)
        print(f"     {name:36s} scale=({sx:5d},{sy:5d})  mean coverage={np.mean(covs):.2f}  "
              f"boxes on value: {len(covs) - int(sum(lows))}/{len(covs)}")


if __name__ == "__main__":
    for d in sys.argv[1:] or ["DMS-224"]:
        probe(d)
