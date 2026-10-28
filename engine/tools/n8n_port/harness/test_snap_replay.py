"""Does the ENGINE's own snap, run on the recorded frame, reproduce the engine's recorded boxes?

Why this exists: the flow-side parity harness buckets bbox rows as "SNAP-move?" without proving it. This
script isolates the question at perception level, with no n8n and no flow code in the loop:

  1. take the VLM's RAW answer for a page from fixtures/rec/<doc>_ai_tape.json (the same bytes the engine
     parsed) and the frame the engine sent (the tape's image),
  2. convert the raw boxes to px exactly like `Page._px` (coords.xyxy_px),
  3. correct them with `coords.snap_box_to_ink` over `strip_rules(ink_mask(frame))` — the engine's call,
     in the engine's knob setting (INK_SNAP_DEFAULT="move"),
  4. compare against the box the engine PUBLISHED for that field/cell (`_engine_payload.json` /
     `_extraction.json`).

Two different results, and the difference matters:
  * reproduced  -> the flow's remaining bbox diffs really are the snap arm, and the helper path is the fix;
  * NOT reproduced -> the 42/3 "HARD" rows on DMS-26/52 are NOT explained by the snap alone, so nobody may
    close them by switching a snap on. The usual reason is the mask source: the engine masks the LOSSLESS
    render, the tape only holds the q90 JPEG it sent.

Run:  python harness/test_snap_replay.py 26 52
"""
import io
import json
import re
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.abspath(os.path.join(ROOT, '..', '..', 'src')))
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from system_a.perception import single_pass as SP                     # noqa: E402
from system_a.perception.coords import (ink_mask, strip_rules, snap_box_to_ink, xyxy_px)  # noqa: E402

CELLS = ('item_code', 'description', 'qty', 'uom', 'unit_price', 'amount')
FIELDS = ('invoice_num', 'invoice_date', 'po_number', 'supplier_name', 'supplier_tax_id', 'customer_name',
          'customer_tax_id', 'customer_address', 'sub_total', 'vat', 'grand_total', 'currency')


def load(doc):
    tape = json.load(io.open(os.path.join(ROOT, 'fixtures', 'rec', '%s_ai_tape.json' % doc), encoding='utf-8'))
    extr = json.load(io.open(os.path.join(ROOT, 'fixtures', 'rec', '%s_extraction.json' % doc), encoding='utf-8'))
    return tape, extr


def page_of_request(part_text):
    """Which page a recorded request belongs to — from the prompt text, never from tape order."""
    # "…for ONE page of a Thai/English invoice / tax invoice (page 1 of the document)." is ONE line, and it
    # mentions "page" twice — splitting on the first "page " yields "ONE page …" and no digit at all.
    m = re.search(r'page\s+(\d+)\s+of', part_text or '', re.I)
    return int(m.group(1)) if m else None


def images_and_answers(tape):
    """(page_no, jpeg bytes, raw answer dict) - one tape entry IS the pair (body=request, text=answer).

    Page identity comes from the prompt text ("(page N of the document)"), never from tape order, and the
    answer is un-fenced the way decodeAnswer does it - the tape stores what the model sent, fence included.
    Skipping either step makes every recorded read look unparsable (that is what made early runs print
    "checked=0").
    """
    import base64
    out = {}
    for e in tape:
        if 'extract' not in str(e.get('key') or '').lower():
            continue
        txt, imgs = '', []
        for m in ((e.get('body') or {}).get('messages') or []):
            c = m.get('content')
            if isinstance(c, str):
                txt += c
            elif isinstance(c, list):
                for part in c:
                    if not isinstance(part, dict):
                        continue
                    if part.get('type') == 'text':
                        txt += part.get('text', '')
                    elif part.get('type') == 'image_url':
                        imgs.append(part.get('image_url', {}).get('url', ''))
        raw = (e.get('text') or '').strip()
        raw = re.sub(r'^```[a-zA-Z]*\s*', '', raw)
        raw = re.sub(r'```\s*$', '', raw).strip()
        raw = raw[:raw.rfind('}') + 1]
        try:
            ans = json.loads(raw)
        except Exception:
            continue
        pno = page_of_request(txt)
        if pno is None or not imgs or not isinstance(ans, dict):
            continue
        out[pno] = (base64.b64decode(imgs[0].split(',', 1)[1]), ans)
    return out


def published_boxes(extr, page_no):
    """What the engine published, keyed the same way the snap loop keys: field names and line cells."""
    from PIL import Image
    res = {}
    flds = extr.get('fields') or {}
    it = flds.items() if isinstance(flds, dict) else [(str(f.get('field_name')), f) for f in flds]
    for name, f in it:
        if not isinstance(f, dict):
            continue
        reg = f.get('region') or {}
        if reg.get('page') is not None and reg.get('page') != page_no:
            continue
        bb = f.get('bbox') or reg.get('bbox')
        if bb:
            res['field:' + str(name)] = bb
    for ln in (extr.get('lines') or []):
        # a line object carries NO page key of its own (keys are line_no/region/cells) — the page lives on the
        # cell's region. Filtering on ln['page'] silently dropped every line, which is how cells ended up
        # reported as "untested" instead of measured.
        for k, c in (ln.get('cells') or {}).items():
            if isinstance(c, dict):
                reg = c.get('region') or {}
                if reg.get('page') is not None and reg.get('page') != page_no:
                    continue
                bb = c.get('bbox') or reg.get('bbox')
                if bb:
                    res['cell:%s.%s' % (ln.get('line_no'), k)] = bb
    return res


def main():
    docs = sys.argv[1:] or ['26', '52']
    mode = SP.ink_snap_mode(None)                      # what the engine runs with today (no env override)
    print('engine snap baseline = %s (INK_SNAP_DEFAULT=%s, env=%r)'
          % (mode, SP.INK_SNAP_DEFAULT, os.environ.get(SP.INK_SNAP_ENV)))
    move, grow = mode in ('both', 'move'), mode in ('both', 'grow')
    from PIL import Image
    for doc in docs:
        tape, extr = load(doc)
        pages = images_and_answers(tape)
        agree = differ = untested = moved_ct = 0
        rows = []
        for pno, (jpeg, ans) in sorted(pages.items(), key=lambda kv: (kv[0] is None, kv[0])):
            if pno is None:
                continue
            img = Image.open(io.BytesIO(jpeg)).convert('RGB')
            mask = strip_rules(ink_mask(img))
            W, H = img.width, img.height
            want = published_boxes(extr, pno)
            pairs = [(('field:' + k), (ans.get('fields') or {}).get(k)) for k in FIELDS]
            # the row geometry the rules argue about (DMS-26's line 14) is grown from the CELLS, and the
            # engine snaps exactly those cells (single_pass.py:408) - so cells must be measured, not skipped.
            for i, row in enumerate(ans.get('line_items') or []):
                if not isinstance(row, dict):
                    continue
                no = row.get('line_no', i + 1)
                pairs += [('cell:%s.%s' % (no, k), row.get(k)) for k in CELLS]
            for name, cell in pairs:
                rb = (cell or {}).get('bbox_2d') if isinstance(cell, dict) else None
                if not rb or name not in want:
                    untested += 1
                    continue
                rect = xyxy_px(rb, W, H, 'auto' if max(map(float, rb)) <= 1.0 else 'norm1000')
                fixed, note = snap_box_to_ink(rect, mask, move=move, grow=grow)
                rect = fixed if note != 'unchanged' else rect
                if note != 'unchanged':
                    moved_ct += 1
                got = [round(rect[0] / W, 4), round(rect[1] / H, 4),
                       round((rect[2] - rect[0]) / W, 4), round((rect[3] - rect[1]) / H, 4)]
                pub = [round(float(v), 4) for v in want[name][:4]]
                same = all(abs(a - b) <= 0.004 for a, b in zip(got, pub))
                agree += same
                differ += (not same)
                if not same and len(rows) < 8:
                    rows.append((name, note, got, pub))
        print('DMS-%s  frame=%s  fields checked=%d  reproduced=%d  NOT reproduced=%d  moved-by-snap=%d  untested=%d'
              % (doc, 'tape jpeg', agree + differ, agree, differ, moved_ct, untested))
        for r in rows:
            print('    %-28s note=%-14s snap=%s engine=%s' % (r[0], r[1], r[2], r[3]))
    print('\nRead: "reproduced" = the engine snap on the RECORDED IMAGE lands on the box the engine published.')
    print("Anything NOT reproduced means the diff is not closed by turning a snap on — the mask source (lossless")
    print('render vs q90 JPEG) or something else is in play, and it must stay an open finding.')


if __name__ == '__main__':
    main()
