#!/usr/bin/env python3
"""Ink-snap helper for the n8n flow — it runs the ENGINE's own correction, nothing else.

Why this exists
---------------
The engine corrects every field/cell box against the page's printed ink inside `Page._px`
(`single_pass.py:372-385`) using `coords.snap_box_to_ink` over a mask built by
`strip_rules(ink_mask(rot_img))` (single_pass.py:1070).  A Code node on n8n cannot decode pixels,
so the flow had no way to run that correction and was permanently the engine's `snap=off` arm.

This service is the chosen fix: the flow sends the page it is working on, and the correction is done
by the engine's own imported functions.  Nothing here reimplements the algorithm:

  * image      — rendered by `SinglePassPipeline._render` (PyMuPDF pixmap -> PIL RGB) at the same DPI
                 the engine used, rotated by `coords.rotate_image` with the same clockwise angle, so
                 the mask is built over the same pixels the engine's mask was built over
                 (NOT over the JPEG the VLM saw — the engine masks the lossless render, line 1070).
  * frame      — the response carries orig_w/orig_h/rot_w/rot_h so a caller can prove its boxes live
                 in the frame this mask was made from; a mismatch is refused, not snapped anyway.
  * algorithm  — `snap_box_to_ink(rect, mask, move=..., grow=...)`, called with the same knob pair the
                 engine derives from `ink_snap_mode`.  The returned `note` is passed through untouched:
                 adoption ("if note != 'unchanged'") is the CALLER's job because that rule lives in
                 `_px`, and re-quantising an untouched box would move it up to 1 px (R4-9's control arm).
  * errors     — the engine has no try/except around the snap, so neither does this: an exception
                 becomes HTTP 500 with the traceback tail and the flow must fail loudly.  A silent
                 "snap=off" fallback here would be exactly the failure the owner forbade.

Baseline (do not change it to make parity pass): INK_SNAP_DEFAULT = "move", PERCEPTION_INK_SNAP unset
in the engine (`single_pass.py:771-772`), which is why every recorded payload says
`extra.ink_snap = true, extra.ink_snap_mode = "move"`.

Run:  python snap_service/snap_server.py --port 8765 [--engine-src ../..]
Test: python harness/snap_helper.py            (starts it, /health, a snap call, a failure call)
"""
import argparse
import base64
import hashlib
import io
import json
import os
import sys
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE_SRC = os.path.abspath(os.environ.get('ENGINE_SRC') or os.path.join(HERE, '..', '..', 'src'))
if ENGINE_SRC not in sys.path:
    sys.path.insert(0, ENGINE_SRC)

import fitz                                            # engine's own PDF reader (single_pass.py:977)
from system_a.perception import single_pass as SP       # INK_SNAP_*, SinglePassPipeline._render
from system_a.perception.coords import (ink_mask, strip_rules, rotate_image, snap_box_to_ink)

def _sha(path):
    with open(path, 'rb') as fh:
        return hashlib.sha256(fh.read()).hexdigest()


COORDS_SHA = _sha(os.path.join(ENGINE_SRC, 'system_a', 'perception', 'coords.py'))
SP_SHA = _sha(os.path.join(ENGINE_SRC, 'system_a', 'perception', 'single_pass.py'))

CACHE = {}                       # (sha256(pdf), page_no, dpi, rotate) -> mask, so a document costs one render


def build_mask(pdf_bytes, page_no, dpi, rotate_degrees):
    """The engine's mask, from the engine's own render + rotate calls."""
    key = (hashlib.sha256(pdf_bytes).hexdigest(), int(page_no), int(dpi), int(rotate_degrees))
    if key in CACHE:
        return CACHE[key]
    with fitz.open(stream=pdf_bytes, filetype='pdf') as doc:
        orig = SP.SinglePassPipeline._render(doc[int(page_no) - 1], int(dpi))
        if int(rotate_degrees):
            rot, _M = rotate_image(orig, int(rotate_degrees))
        else:
            rot, _M = orig, None
        mask = strip_rules(ink_mask(rot))              # single_pass.py:1070, same call order
        info = {'orig_w': orig.width, 'orig_h': orig.height, 'rot_w': rot.width, 'rot_h': rot.height}
    CACHE.clear()                                      # one document at a time on a test box
    CACHE[key] = (mask, info)
    return CACHE[key]


def mask_from_image(img_bytes):
    """Mask the exact bytes the caller hands over (the offline harness has only the JPEG the VLM saw).

    Documented deviation, not a shortcut: the engine masks the lossless render (single_pass.py:1070), so a mask
    built from the q90 JPEG can differ from the engine's by a pixel near a stroke edge. The live flow does NOT
    use this path — the canvas has the source PDF, so it renders the way the engine does. Measured effect is
    reported by harness/test_payload_parity.py runs that set SNAP_IMAGE_FROM_BINARY=1.
    """
    from PIL import Image
    img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    return strip_rules(ink_mask(img)), {'orig_w': img.width, 'orig_h': img.height,
                                        'rot_w': img.width, 'rot_h': img.height, 'source': 'image_b64'}


def do_snap(req):
    """{pdf_b64 | image_b64, page_no, dpi, rotate_degrees, mode, boxes:[{id,rect}]} -> corrections."""
    mode = SP.ink_snap_mode(req.get('mode', None))     # engine's parser: a typo keeps the shipped default
    dpi = req.get('dpi')
    if req.get('image_b64'):
        mask, info = mask_from_image(base64.b64decode(req['image_b64']))
    else:
        if not dpi:
            raise ValueError('pdf mode needs dpi (the engine masks the render at the extract DPI)')
        pdf = base64.b64decode(req['pdf_b64'])
        mask, info = build_mask(pdf, req['page_no'], int(dpi), int(req.get('rotate_degrees') or 0))
    move, grow = mode in ('both', 'move'), mode in ('both', 'grow')
    out = []
    for b in req.get('boxes') or []:
        rect = [int(v) for v in b['rect']]
        corrected, note = snap_box_to_ink(rect, mask, move=move, grow=grow)
        out.append({'id': b.get('id'), 'in': rect, 'out': [int(v) for v in corrected], 'note': note})
    return {'ok': True, 'mode': mode, 'page_no': int(req['page_no']), 'dpi': int(dpi or 0),
            'rotate_degrees': int(req.get('rotate_degrees') or 0), 'frame': info,
            'moved': sum(1 for o in out if o['note'] != 'unchanged'), 'boxes': out}


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/health':
            return self._send(200, {'ok': True, 'service': 'engine-ink-snap',
                                    'engine_src': ENGINE_SRC, 'default_mode': SP.INK_SNAP_DEFAULT,
                                    'modes': list(SP.INK_SNAP_MODES),
                                    'env_mode': os.environ.get(SP.INK_SNAP_ENV),
                                    'coords_sha256': COORDS_SHA, 'single_pass_sha256': SP_SHA})
        return self._send(404, {'ok': False, 'error': 'no route ' + self.path})

    def read_body(self):
        """n8n's HTTP client streams large bodies (a page render is megabytes) and may omit Content-Length in
        favour of chunked transfer. Reading only Content-Length made every big canvas call look like an empty
        body and came back as a 500 — so chunked bodies are decoded here, and both paths are exercised."""
        te = (self.headers.get('Transfer-Encoding') or '').lower()
        if 'chunked' in te:
            data = b''
            while True:
                line = self.rfile.readline().strip()
                if not line:
                    continue
                n = int(line, 16)
                if n == 0:
                    self.rfile.readline()
                    break
                data += self.rfile.read(n)
                self.rfile.readline()
            return data
        return self.rfile.read(int(self.headers.get('Content-Length') or 0))

    def do_POST(self):
        if self.path != '/snap':
            return self._send(404, {'ok': False, 'error': 'no route ' + self.path})
        try:
            body = self.read_body()
            if not body:
                raise ValueError('empty request body (Content-Length missing and not chunked?)')
            req = json.loads(body.decode())
            return self._send(200, do_snap(req))
        except Exception as e:                          # engine has no try/except here -> loud 500
            return self._send(500, {'ok': False, 'error': type(e).__name__ + ': ' + str(e)[:300],
                                    'trace': traceback.format_exc()[-800:]})

    def log_message(self, *a):                          # keep the test output readable
        pass


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=int(os.environ.get('SNAP_PORT', 8765)))
    ap.add_argument('--host', default=os.environ.get('SNAP_HOST', '127.0.0.1'))
    a = ap.parse_args()
    sys.stderr.write('ink-snap helper on http://%s:%d  (engine %s, mode=%s)\n'
                     % (a.host, a.port, ENGINE_SRC, SP.INK_SNAP_DEFAULT))
    ThreadingHTTPServer((a.host, a.port), Handler).serve_forever()
