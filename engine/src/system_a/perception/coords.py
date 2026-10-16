"""Bounding-box maths shared by perception and the report.

Everything that leaves this module is ``[x, y, w, h]``, origin top-left, normalized 0..1 against the
*rendered page after rotation* — the coordinate system declared in ``contracts.COORDINATE_SYSTEM``.
Qwen returns ``bbox_2d = [x1, y1, x2, y2]`` in a mode that varies per model/answer, so the mode is
detected per page (measured rule from the working prototype ``tests/bbox_testv3.py``).
"""
from __future__ import annotations

import math
from typing import Any, Iterable, Optional, Sequence, Tuple

import cv2
import numpy as np

BBox = tuple[float, float, float, float]
RBox = tuple[float, float, float, float, float]

EMPTY_TEXT = {"", "-", "--", "—", "?", "??", "...", "…", "n/a", "na", "null", "none", "nil", "unknown",
              "unreadable", "illegible", "not readable", "empty", "blank", "not visible", "no text", "[]"}
VISUAL_TYPES = {"signature", "stamp"}
EMPTY_MARKS = {"unsigned", "no signature", "not signed", "no stamp", "empty", "blank", "none"}
MIN_BOX_PX = 4
PARENT_TOLERANCE = 0.01


#: Share of coordinates that may run past 1000 before we stop believing the page answered in 0-1000.
#: A model asked for 0-1000 sometimes lets one stamp box reach 1040; that single outlier must not re-scale
#: every other box on the page (measured on doc 19 page 1: one 1005 value flipped the page to "pixel", every
#: box landed at ~57% of its true height, so each crop re-read sampled blank paper and the fields lost their
#: second reader - which is what actually cost the confidence).
OVER_1000_TOLERANCE = 0.10


def detect_coord_mode(boxes: Sequence[Sequence[float]], img_w: int, img_h: int,
                      forced: str = "auto") -> str:
    """``pixel`` / ``norm1000`` / ``norm1`` - the frame that explains *most* coordinates.

    Decided on the bulk of the coordinates rather than the single largest one, then cross-checked against
    the rendered size: on a page rendered taller than 1000 px, a model that answers in real pixels puts
    most coordinates above 1000, while a model that was asked for 0-1000 overshoots only occasionally.
    """
    if forced and forced != "auto":
        return forced
    vals: list[float] = []
    for b in boxes:
        if not b or len(b) != 4:
            continue
        for v in b:
            try:
                f = float(v)
            except (TypeError, ValueError):
                continue                      # the model sometimes answers [null, null, null, null]
            if not (math.isnan(f) or math.isinf(f)):
                vals.append(f)
    if not vals:
        return "norm1000"
    mx = max(vals)
    if mx <= 1.0:
        return "norm1"
    over = sum(1 for v in vals if v > 1000) / len(vals)
    if mx <= 1000 or over <= OVER_1000_TOLERANCE:
        return "norm1000" if max(img_w, img_h) > 1100 else "pixel"
    return "pixel"


def sanitize_xyxy(box: Sequence[float], tol: float = 0.10) -> Optional[list[float]]:
    """Sanitize normalized or millinorm bounding box [x1, y1, x2, y2].

    Rules:
      1. Length 4 numeric conversion.
      2. Auto-rescale 0..1000 to 0.0..1.0 if any coordinate > 1.5.
      3. Coordinate swapping if x1 > x2 or y1 > y2.
      4. Severe out-of-bounds rejection (< -tol or > 1.0 + tol).
      5. Clamping small tolerance [-tol, 1.0 + tol] -> [0.0, 1.0].
      6. Zero-area rejection (width <= 0.001 or height <= 0.001).
    """
    if box is None or len(box) != 4:
        return None
    try:
        x1, y1, x2, y2 = float(box[0]), float(box[1]), float(box[2]), float(box[3])
    except (TypeError, ValueError):
        return None
    if any(math.isnan(v) or math.isinf(v) for v in (x1, y1, x2, y2)):
        return None

    if any(v > 1.5 for v in (x1, y1, x2, y2)):
        x1, y1, x2, y2 = x1 / 1000.0, y1 / 1000.0, x2 / 1000.0, y2 / 1000.0

    x1, x2 = min(x1, x2), max(x1, x2)
    y1, y2 = min(y1, y2), max(y1, y2)

    if x1 < -tol or y1 < -tol or x2 > 1.0 + tol or y2 > 1.0 + tol:
        return None

    x1 = max(0.0, x1)
    y1 = max(0.0, y1)
    x2 = min(1.0, x2)
    y2 = min(1.0, y2)

    if (x2 - x1) <= 0.001 or (y2 - y1) <= 0.001:
        return None

    return [round(x1, 4), round(y1, 4), round(x2, 4), round(y2, 4)]


def xyxy_px(box: Sequence[float], img_w: int, img_h: int, mode: str) -> tuple[float, float, float, float]:
    """Corner box -> pixel rectangle, sorted and clipped to the image."""
    x1, y1, x2, y2 = (float(v) for v in box[:4])
    if mode == "norm1000":
        x1, x2 = x1 * img_w / 1000.0, x2 * img_w / 1000.0
        y1, y2 = y1 * img_h / 1000.0, y2 * img_h / 1000.0
    elif mode == "norm1":
        x1, x2, y1, y2 = x1 * img_w, x2 * img_w, y1 * img_h, y2 * img_h
    x1, x2 = sorted((min(max(x1, 0.0), img_w), min(max(x2, 0.0), img_w)))
    y1, y2 = sorted((min(max(y1, 0.0), img_h), min(max(y2, 0.0), img_h)))
    return x1, y1, x2, y2


def px_to_xywh(rect: Sequence[float], img_w: int, img_h: int) -> BBox:
    """Pixel rectangle -> normalized ``[x, y, w, h]`` (clamped, 4 decimals)."""
    x1, y1, x2, y2 = rect
    w, h = max(img_w, 1), max(img_h, 1)
    x, y = max(0.0, min(1.0, x1 / w)), max(0.0, min(1.0, y1 / h))
    return (round(x, 4), round(y, 4), round(max(0.0, min(1.0 - x, (x2 - x1) / w)), 4),
            round(max(0.0, min(1.0 - y, (y2 - y1) / h)), 4))


def xyxy_to_xywh(box: Sequence[float], img_w: int, img_h: int, mode: str) -> BBox:
    return px_to_xywh(xyxy_px(box, img_w, img_h, mode), img_w, img_h)


def xywh_to_pt(box: Sequence[float], width_pt: float, height_pt: float) -> tuple[float, float, float, float]:
    """Normalized box -> PDF points (x0, y0, x1, y1); used for cropping and for the HTML overlay."""
    x, y, w, h = (float(v) for v in box[:4])
    return (x * width_pt, y * height_pt, (x + w) * width_pt, (y + h) * height_pt)


def rotate_image(img: Any, angle_cw: float) -> Tuple[Any, np.ndarray]:
    """Rotate image clockwise by angle_cw degrees with white border (borderValue=255).

    Returns:
        (rotated_image, M) where M is the 2x3 affine transformation matrix.
        Supports both numpy ndarray and PIL.Image.Image.
    """
    if abs(angle_cw) < 1e-4:
        identity_m = np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]], dtype=np.float32)
        return img, identity_m

    is_pil = hasattr(img, "convert") and hasattr(img, "size")
    if is_pil:
        img_np = np.array(img.convert("RGB"))
    else:
        img_np = np.asarray(img)

    h, w = img_np.shape[:2]
    rad = math.radians(angle_cw)
    sin_a, cos_a = abs(math.sin(rad)), abs(math.cos(rad))
    new_w = int(math.ceil(h * sin_a + w * cos_a))
    new_h = int(math.ceil(h * cos_a + w * sin_a))

    center = (w / 2.0, h / 2.0)
    # In OpenCV, positive angle rotates counter-clockwise, so -angle_cw rotates clockwise
    M = cv2.getRotationMatrix2D(center, -angle_cw, 1.0)
    M[0, 2] += (new_w / 2.0) - center[0]
    M[1, 2] += (new_h / 2.0) - center[1]

    rot_np = cv2.warpAffine(img_np, M, (new_w, new_h), flags=cv2.INTER_CUBIC,
                            borderValue=(255, 255, 255))

    if is_pil:
        from PIL import Image
        return Image.fromarray(rot_np), M
    return rot_np, M


def rotate_px_box_back(rect_px: Sequence[float], rot_w: int, rot_h: int,
                       orig_w: int, orig_h: int, M: Optional[np.ndarray]) -> Tuple[BBox, RBox]:
    """A rectangle already measured in rotated-image pixels -> the two boxes in the original frame.

    Split out of :func:`rotate_box_back` so a box that was corrected against the page's own ink (see
    :func:`snap_box_to_ink`) travels back through exactly the same maths as an untouched one.
    """
    x1, y1, x2, y2 = (float(v) for v in rect_px[:4])

    if M is None or np.allclose(M, [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]], atol=1e-4):
        bbox = px_to_xywh((x1, y1, x2, y2), orig_w, orig_h)
        cx = round(bbox[0] + bbox[2] / 2.0, 4)
        cy = round(bbox[1] + bbox[3] / 2.0, 4)
        rbox = (cx, cy, bbox[2], bbox[3], 0.0)
        return bbox, rbox

    # 4 corner points on rotated image
    pts_rot = np.array([[[x1, y1]], [[x2, y1]], [[x2, y2]], [[x1, y2]]], dtype=np.float32)
    M_inv = cv2.invertAffineTransform(M)
    pts_orig = cv2.transform(pts_rot, M_inv).reshape(4, 2)

    xs, ys = pts_orig[:, 0], pts_orig[:, 1]
    min_x, max_x = float(np.min(xs)), float(np.max(xs))
    min_y, max_y = float(np.min(ys)), float(np.max(ys))

    bx = round(max(0.0, min(1.0, min_x / orig_w)), 4)
    by = round(max(0.0, min(1.0, min_y / orig_h)), 4)
    bw = round(max(0.0, min(1.0 - bx, (max_x - min_x) / orig_w)), 4)
    bh = round(max(0.0, min(1.0 - by, (max_y - min_y) / orig_h)), 4)
    bbox = (bx, by, bw, bh)

    cx = round(max(0.0, min(1.0, float(np.mean(xs)) / orig_w)), 4)
    cy = round(max(0.0, min(1.0, float(np.mean(ys)) / orig_h)), 4)
    edge_w = float(np.linalg.norm(pts_orig[1] - pts_orig[0])) / orig_w
    edge_h = float(np.linalg.norm(pts_orig[2] - pts_orig[1])) / orig_h

    dx = float(pts_orig[1, 0] - pts_orig[0, 0])
    dy = float(pts_orig[1, 1] - pts_orig[0, 1])
    raw_angle = math.degrees(math.atan2(dy, dx))

    angle = raw_angle
    while angle > 45.0:
        angle -= 90.0
        edge_w, edge_h = edge_h, edge_w
    while angle <= -45.0:
        angle += 90.0
        edge_w, edge_h = edge_h, edge_w

    if abs(angle) < 0.05:
        angle = 0.0
        edge_w, edge_h = bw, bh
        cx, cy = round(bx + bw / 2.0, 4), round(by + bh / 2.0, 4)

    rbox = (cx, cy, round(edge_w, 4), round(edge_h, 4), round(angle, 2))
    return bbox, rbox


def rotate_box_back(box: Sequence[float], rot_w: int, rot_h: int, orig_w: int, orig_h: int,
                    M: Optional[np.ndarray], mode: str = "norm1000") -> Tuple[BBox, RBox]:
    """Corner box predicted on the rotated image (any coordinate frame) -> the two boxes of the original page."""
    return rotate_px_box_back(xyxy_px(box, rot_w, rot_h, mode), rot_w, rot_h, orig_w, orig_h, M)


#: How far a box may be nudged onto a printed line, as a share of the page height (measured Round 3: the
#: boxes drawn from a label sit 15-44 px off their value on a ~1500 px page; the ones 86-120 px off belong to
#: no line at all and are left alone rather than teleported).
INK_MOVE_RATIO = 0.03
#: How much a box may stretch to cover the value it already sits on, as a multiple of its own width.
#: Past that it would be reaching across whitespace into the next column.
INK_GROW_RATIO = 1.8
INK_GAP_PX = 3


def ink_mask(img) -> np.ndarray:
    """``1`` where the page carries ink, ``0`` on paper - Otsu over the page's own grey levels.

    Every box correction is only as honest as this map, so it is derived from the page itself instead of a
    fixed threshold: the same scan may be white paper, cream paper or a shaded form.
    """
    arr = np.asarray(img.convert("L") if hasattr(img, "convert") else img)
    if arr.ndim == 3:
        arr = cv2.cvtColor(np.ascontiguousarray(arr, dtype=np.uint8), cv2.COLOR_RGB2GRAY)
    arr = np.ascontiguousarray(arr, dtype=np.uint8)
    th, _ = cv2.threshold(arr, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return (arr <= th).astype(np.uint8)   # the threshold level itself counts as ink (a two-level scan puts Otsu on the text)


def _ink_bands(mask: np.ndarray, x0: int, x1: int) -> list[tuple[int, int]]:
    """Row bands that carry ink between ``x0`` and ``x1`` - the printed lines under that span."""
    col = mask[:, max(0, x0):max(x0 + 1, x1)].sum(axis=1) > 0
    bands: list[tuple[int, int]] = []
    start = None
    for y, hit in enumerate(col):
        if hit and start is None:
            start = y
        elif not hit and start is not None:
            bands.append((start, y))
            start = None
    if start is not None:
        bands.append((start, len(col)))
    return bands


def snap_box_to_ink(box: Sequence[float], mask: np.ndarray,
                    max_move: Optional[float] = None) -> tuple[tuple[int, int, int, int], str]:
    """Put a pixel box onto the printed line it was meant to cover, and over the whole value.

    Round 3 measured the two ways a box misses: 90 boxes sat on blank paper (drawn from the label, the value
    one row below) and 154 covered only the edge of the value.  Both have the answer written on the page -
    the ink itself.  The box may travel at most ``INK_MOVE_RATIO`` of the page height, and may stretch at
    most ``INK_GROW_RATIO`` times its own width, so a box with nothing under it is reported untouched rather
    than moved somewhere plausible.

    Returns ``((x1, y1, x2, y2), note)`` - ``note`` says what happened, for the evidence trail.
    """
    H, W = mask.shape[:2]
    ax, ay, bx, by = (float(v) for v in box[:4])
    x1, x2 = sorted((max(0.0, min(ax, W)), max(0.0, min(bx, W))))
    y1, y2 = sorted((max(0.0, min(ay, H)), max(0.0, min(by, H))))
    box_h = max(1.0, y2 - y1)
    travel = max(2.0 * box_h, INK_MOVE_RATIO * H) if max_move is None else float(max_move)

    bands = _ink_bands(mask, int(x1), int(x2))
    if not bands:
        return (int(x1), int(y1), int(x2), int(y2)), "unchanged"

    own = next((b for b in bands if b[0] < y2 and b[1] > y1), None)
    note = ""
    if own is None:
        near = min(bands, key=lambda b: min(abs(b[0] - y2), abs(b[1] - y1)))
        gap = min(abs(near[0] - y2), abs(near[1] - y1))
        if gap > travel:
            return (int(x1), int(y1), int(x2), int(y2)), "unchanged"
        own, note = near, f"moved_{int(gap)}px"
        y1, y2 = float(own[0]), float(own[1])

    grown = ""
    inked = mask[max(0, own[0]):max(own[0] + 1, own[1]), :].sum(axis=0) > 0
    runs, start, last = [], None, 0
    for x in range(W):
        if inked[x]:
            if start is None:
                start = x
            last = x
        elif start is not None and x - last > INK_GAP_PX:
            runs.append((float(start), float(last + 1)))
            start = None
    if start is not None:
        runs.append((float(start), float(last + 1)))
    span = next(((a, b) for (a, b) in runs if a < x2 and b > x1), None)
    if span:
        nx1, nx2 = span
        cap = INK_GROW_RATIO * max(1.0, x2 - x1)
        if nx2 - nx1 > cap:                      # too wide to be this value: keep the middle over the box
            cx = (x1 + x2) / 2.0
            nx1, nx2 = cx - cap / 2.0, cx + cap / 2.0
        if nx1 < x1 or nx2 > x2:
            grown = f"grown_{int(nx1)}-{int(nx2)}"
            x1, x2 = nx1, nx2
    note = (note + ("+" if note and grown else "") + grown) or "unchanged"
    return (int(x1), int(y1), int(x2), int(y2)), note


def text_drop_reason(item: dict) -> str | None:
    """Why an item must not be used (``None`` = keep).  Mirrors the tested prototype rules."""
    b = item.get("bbox_2d")
    if not (isinstance(b, (list, tuple)) and len(b) == 4):
        return "bad_bbox"
    try:
        [float(v) for v in b]
    except (TypeError, ValueError):
        return "bad_bbox"
    t = str(item.get("text") if item.get("text") is not None else "").strip()
    if t.lower().replace(".", "").strip() in EMPTY_TEXT or _is_punct_only(t):
        return "no_text"
    if str(item.get("type")) in VISUAL_TYPES and t.lower() in EMPTY_MARKS:
        return None                              # a blank signature/stamp box stays (E08 needs its bbox)
    return None


def _is_punct_only(t: str) -> bool:
    return bool(t) and not any(ch.isalnum() for ch in t)


def _boxes_on_words(boxes, img_w: int, img_h: int, mode: str, words) -> int:
    """How many model boxes land on top of a printed word under this frame (independent geometry check)."""
    hits = 0
    sample = list(words)[:3000]
    for b in list(boxes)[:200]:
        if not isinstance(b, (list, tuple)) or len(b) != 4:
            continue
        x1, y1, x2, y2 = xyxy_px(b, img_w, img_h, mode)
        for w in sample:
            wx, wy, ww, wh = w["bbox"]
            cx, cy = (wx + ww / 2.0) * img_w, (wy + wh / 2.0) * img_h
            if x1 <= cx <= x2 and y1 <= cy <= y2:
                hits += 1
                break
    return hits


def choose_coord_mode(boxes, img_w: int, img_h: int, words=None, forced: str = "auto") -> str:
    """The coordinate frame that puts the model's boxes **on top of the printed words**.

    Magnitude alone cannot tell a 0-1000 answer from a pixel answer: a page rendered 1240x1754 px can show
    ``bbox_2d=[843, 702]`` as "0-1000" or as "pixels", and guessing wrong shrinks every box on the page in
    one direction, so crops and text-layer comparisons silently stop matching. The PDF text layer knows
    where the words really are, so the frame that lands more boxes on words wins; the magnitude heuristic
    is the fallback for pages with no text layer (scans).
    """
    if forced and forced not in ("auto", "words"):
        return forced
    vals = [float(v) for b in boxes if isinstance(b, (list, tuple)) and len(b) == 4 for v in b]
    if not vals:
        return "norm1000"
    if forced == "auto":
        # bbox_testv3 rule, unchanged: <=1 -> norm1, >1000 -> pixel, else norm1000 on a page rendered >1100 px
        mx = max(vals)
        if mx <= 1.0:
            return "norm1"
        if mx > 1000:
            return "pixel"
        return "norm1000" if max(img_w, img_h) > 1100 else "pixel"
    if max(vals) <= 1.05:
        return "norm1"
    if words:                     # "words": the older text-layer vote, opt-in only
        scores = {m: _boxes_on_words(boxes, img_w, img_h, m, words) for m in ("norm1000", "pixel")}
        if max(scores.values()) > 0:
            return max(("norm1000", "pixel"), key=lambda m: (scores[m], m == "norm1000"))
    return detect_coord_mode(boxes, img_w, img_h, forced)


def filter_items(items: Iterable[dict], img_w: int, img_h: int, forced: str = "auto",
                words: Iterable[dict] | None = None) -> tuple[list, list, str]:
    """Split a model answer into kept items and dropped items (with reason) — never silently discarded."""
    kept_pre, dropped = [], []
    for it in items or []:
        if not isinstance(it, dict):
            dropped.append({"raw_item": str(it)[:120], "drop_reason": "not_an_object"})
            continue
        why = text_drop_reason(it)
        (dropped.append({**it, "drop_reason": why}) if why else kept_pre.append(it))
    mode = choose_coord_mode([it.get("bbox_2d") or [] for it in kept_pre], img_w, img_h, words, forced)
    kept = []
    for it in kept_pre:
        x1, y1, x2, y2 = xyxy_px(it["bbox_2d"], img_w, img_h, mode)
        if x2 - x1 < MIN_BOX_PX or y2 - y1 < MIN_BOX_PX:
            dropped.append({**it, "drop_reason": "zero_area_or_out_of_page"})
            continue
        kept.append({**it, "bbox": px_to_xywh((x1, y1, x2, y2), img_w, img_h)})
    return dedupe(kept), dropped, mode


def dedupe(items: list[dict]) -> list[dict]:
    """Same label + same box twice is a model artefact; keep the first (highest stated confidence)."""
    seen, out = set(), []
    for it in sorted(items, key=lambda i: -float(i.get("confidence") or 0)):
        key = (str(it.get("label") or it.get("type")), str(it.get("text")),
              tuple(round(float(v), 3) for v in it["bbox"]))
        if key in seen:
            continue
        seen.add(key)
        out.append(it)
    return out


def union_box(boxes: Iterable[Sequence[float]]) -> BBox | None:
    xs = [b for b in boxes if b and len(b) == 4]
    if not xs:
        return None
    x1 = min(float(b[0]) for b in xs)
    y1 = min(float(b[1]) for b in xs)
    x2 = max(float(b[0]) + float(b[2]) for b in xs)
    y2 = max(float(b[1]) + float(b[3]) for b in xs)
    return (round(x1, 4), round(y1, 4), round(max(0.0, x2 - x1), 4), round(max(0.0, y2 - y1), 4))


def inside(child: Sequence[float], parent: Sequence[float], tol: float = PARENT_TOLERANCE) -> bool:
    x, y, w, h = (float(v) for v in child[:4])
    px, py, pw, ph = (float(v) for v in parent[:4])
    return (x >= px - tol and y >= py - tol and x + w <= px + pw + tol and y + h <= py + ph + tol)


def bbox_problems(elements: Iterable[dict]) -> list[dict]:
    """Sanity gate for §Phase 3.4: range, non-empty size, child inside parent (tolerance 0.01)."""
    problems: list[dict] = []
    by_id = {e.get("element_id"): e for e in elements}
    for e in by_id.values():
        b = e.get("bbox")
        if not b:
            continue
        if len(b) != 4 or any(v is None for v in b) or any(not (0.0 <= float(v) <= 1.0) for v in b):
            problems.append({"element_id": e.get("element_id"), "problem": "out_of_range", "bbox": list(b)})
            continue
        if float(b[2]) <= 0 or float(b[3]) <= 0:
            problems.append({"element_id": e.get("element_id"), "problem": "zero_size", "bbox": list(b)})
            continue
        par = by_id.get(e.get("parent_id")) if e.get("parent_id") else None
        if par and par.get("bbox") and not inside(b, par["bbox"]):
            problems.append({"element_id": e.get("element_id"), "problem": "outside_parent",
                             "parent_id": e.get("parent_id"), "bbox": list(b), "parent_bbox": list(par["bbox"])})
    return problems


# ------------------------------------------------------------------ text-layer helpers
def words_in_box(words: Iterable[dict], box: Sequence[float], tol: float = 0.005) -> list[dict]:
    """Text-layer words whose centre falls inside ``box`` (normalized coordinates)."""
    x, y, w, h = (float(v) for v in box[:4])
    out = []
    for wd in words or []:
        bx, by, bw, bh = (float(v) for v in wd["bbox"][:4])
        cx, cy = bx + bw / 2, by + bh / 2
        if x - tol <= cx <= x + w + tol and y - tol <= cy <= y + h + tol:
            out.append(wd)
    return sorted(out, key=lambda d: (round(d["bbox"][1], 3), d["bbox"][0]))


def split_row_cells(words: Sequence[dict], columns: Sequence[tuple[str, Sequence[float]]]) -> dict[str, dict]:
    """Assign row words to table columns by x-overlap, so cells get real text + real boxes.

    ``columns`` is ``[(column_label, normalized_box_of_the_column_header_or_body), ...]``.
    """
    out: dict[str, dict] = {}
    for label, box in columns:
        picked = [w for w in words if overlaps(w["bbox"], box)]
        if not picked:
            continue
        out[label] = {"text": " ".join(str(w["text"]) for w in picked).strip(),
                      "bbox": union_box([w["bbox"] for w in picked]), "words": [w["word_id"] for w in picked]}
    return out


def overlaps(a: Sequence[float], b: Sequence[float], min_overlap: float = 0.2) -> bool:
    ax, ay, aw, ah = (float(v) for v in a[:4])
    bx, by, bw, bh = (float(v) for v in b[:4])
    ix = max(0.0, min(ax + aw, bx + bw) - max(ax, bx))
    iy = max(0.0, min(ay + ah, by + bh) - max(ay, by))
    area = max(aw * ah, 1e-9)
    return ix * iy / area >= min_overlap


def coord_overflow(items: Iterable[dict], img_w: int, img_h: int, mode: str,
                   tolerance: float = 1.02) -> Optional[dict]:
    """How far the model's coordinates run past the rendered page.

    A model that answers in its own resized pixel grid (not the image we sent) produces boxes outside the
    page; those boxes are dropped by :func:`filter_items`, which without this measurement would look like a
    model that simply did not see the region.  Returned as evidence for the run report, ``None`` when the
    answer fits the page.
    """
    sx = (lambda v: v * img_w / 1000.0) if mode == "norm1000" else \
        (lambda v: v * img_w) if mode == "norm1" else (lambda v: v)
    sy = (lambda v: v * img_h / 1000.0) if mode == "norm1000" else \
        (lambda v: v * img_h) if mode == "norm1" else (lambda v: v)
    max_x = max_y = 0.0
    seen = outside = 0
    for it in items or []:
        box = (it or {}).get("bbox_2d") if isinstance(it, dict) else None
        if not isinstance(box, (list, tuple)) or len(box) != 4:
            continue
        try:
            x1, y1, x2, y2 = (float(v) for v in box)
        except (TypeError, ValueError):
            continue
        seen += 1
        max_x = max(max_x, sx(x1), sx(x2))
        max_y = max(max_y, sy(y1), sy(y2))
        if sx(x2) > img_w * tolerance or sy(y2) > img_h * tolerance:
            outside += 1
    if not seen or outside == 0:
        return None
    return {"mode": mode, "items_total": seen, "items_outside": outside,
            "max_x_px": round(max_x, 1), "max_y_px": round(max_y, 1), "img_w": img_w, "img_h": img_h,
            "implied_scale_x": round(img_w / max_x, 3) if max_x else None,
            "implied_scale_y": round(img_h / max_y, 3) if max_y else None}
