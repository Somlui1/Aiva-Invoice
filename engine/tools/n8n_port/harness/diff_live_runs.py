"""เทียบ payload result/3.0 ของ 2 execution (live, เอกสารเดียวกัน) ว่าต่างกันที่ path ไหนบ้าง
และจัดหมวดว่าต่างแบบ "OCR jitter" (bbox/ข้อความที่โมเดลอ่าน) หรือ "logic เปลี่ยน" (ซึ่งห้ามเกิด)

usage: python harness/diff_live_runs.py <spill_A.txt> <spill_B.txt> [node_name]
"""
import json, io, re, sys


def first_json_with(t, needle):
    for m in re.finditer(r'\{"', t):
        st, d, k = m.start(), 0, m.start()
        while k < len(t):
            if t[k] == '{': d += 1
            elif t[k] == '}':
                d -= 1
                if d == 0: break
            k += 1
        try: o = json.loads(t[st:k + 1])
        except Exception: continue
        if needle in t[st:k + 1]: return o
    return None


def payload_of(spill, node):
    t = io.open(spill, encoding='utf-8', errors='ignore').read()
    o = first_json_with(t, '"runData"')
    runs = o['data']['resultData']['runData'][node]
    item = runs[0]['data']['main'][0][0]
    j = item['json']
    p = j.get('result') or j.get('engine')            # node 21 ใช้ result, node 22 ใช้ engine
    return p, j


def walk(a, b, path='', out=None):
    if out is None: out = []
    if type(a) is not type(b):
        out.append((path, 'TYPE', str(type(a)), str(type(b)))); return out
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a: out.append((path + '.' + k, 'MISSING_IN_A', None, '…'))
            elif k not in b: out.append((path + '.' + k, 'MISSING_IN_B', '…', None))
            else: walk(a[k], b[k], path + '.' + k, out)
    elif isinstance(a, list):
        if len(a) != len(b): out.append((path + '.[]', 'LEN', len(a), len(b)))
        for i, (x, y) in enumerate(zip(a, b)): walk(x, y, path + '[%d]' % i, out)
    elif a != b:
        out.append((path, 'VALUE', str(a)[:60], str(b)[:60]))
    return out


IGNORE_PREFIX = ('.request', '.metrics')   # ตัว timestamp/sha จัดการต่างหากด้านล่าง
# เหมือนที่ payload ทำ: integrity.excludes = [request, metrics, summary, *evaluated_at, *queried_at]
IGNORE_KEYS = {'evaluated_at', 'queried_at', 'completed_at', 'payload_sha256'}


def strip_ignored(obj):
    """ลอกคีย์ timestamp/ออกก่อนเทียบ (มิฉะนั้นเทียบแล้วมีแต่ noise ที่ไม่ได้เกี่ยวกับ parity)"""
    if isinstance(obj, dict):
        return {k: strip_ignored(v) for k, v in obj.items() if k not in IGNORE_KEYS}
    if isinstance(obj, list):
        return [strip_ignored(v) for v in obj]
    return obj



def classify(p):
    if re.search(r'\.bbox(\[|$|_)|bbox_2d|\.bboxes', p): return 'OCR bbox jitter'
    # description ที่โมเดลอ่าน ถูกส่งต่อเข้า normalized_fields / summary / message_th = ผล OCR ทั้งสิ้น
    if re.search(r'raw_value|\.raw\b|normalized_value|description|handwritten|items_by_page|occurrences|message_th|\.message$', p):
        return 'OCR text jitter (ลามไป message/normalized_fields)'
    return 'OTHER (ตองอธิบายได)'


def main():
    sa, sb = sys.argv[1], sys.argv[2]
    node_a = sys.argv[3] if len(sys.argv) > 3 else None
    node_b = sys.argv[4] if len(sys.argv) > 4 else node_a
    if not node_a:
        print('ต้องระบุ node name (เช่น "21 Validate (port)")'); sys.exit(2)
    pa, ja = payload_of(sa, node_a)
    pb, jb = payload_of(sb, node_b)
    print('sha A =', ja.get('port', {}).get('payload_sha256') or ja.get('payload_sha256'))
    print('sha B =', jb.get('port', {}).get('payload_sha256') or jb.get('payload_sha256'))

    diffs = [d for d in walk(strip_ignored({k: v for k, v in pa.items() if not k.startswith(('request', 'metrics', 'integrity'))}),
                             strip_ignored({k: v for k, v in pb.items() if not k.startswith(('request', 'metrics', 'integrity'))}),
                             '')]
    buckets = {}
    for d in diffs:
        buckets.setdefault(classify(d[0]), []).append(d)

    # ---- ชั้นการตัดสินใจ: ต้องเหมือน 100% ----
    keys = ['rule_results', 'exceptions', 'evidence', 'recommendation', 'line_matching',
            'oracle_snapshot', 'normalized_fields', 'summary', 'pages', 'documents', 'package', 'contract', 'versions']
    print('\n=== ชั้นที่ "ต้องเท่ากัน" ถ้าย้ายงานถูกต้อง ===')
    bad = 0
    for k in keys:
        A = json.dumps(strip_ignored(pa.get(k)), sort_keys=True, ensure_ascii=False)
        B = json.dumps(strip_ignored(pb.get(k)), sort_keys=True, ensure_ascii=False)
        same = A == B
        if not same:   # ชี้ว่า path ไหนในชั้นนี้ที่ทำให้ต่าง
            inner = [x for x in walk(strip_ignored(pa.get(k)), strip_ignored(pb.get(k)), k)]
            print('  %-18s ต่าง %d path: %s' % (k, len(inner), '; '.join('%s %r->%r' % (p[:44], str(x)[:34], str(y)[:34]) for p, _t, x, y in inner[:2])))
            bad += 1
            continue
        print('  %-18s เหมือนกัน' % k)
    print('\n=== สรุปความต่างทั้งหมด (นอก request/metrics/integrity) ===')
    print('รวม %d path' % len(diffs))
    for cat, items in sorted(buckets.items()):
        print('\n  [%s] %d path' % (cat, len(items)))
        for p, kind, x, y in items[:6]:
            print('    %-58s %-12s %r -> %r' % (p[:58], kind, x, y))
        if len(items) > 6: print('    ... อีก %d' % (len(items) - 6))
    print('\nสรุป: %s' % ('logic เหมือน 100%%, ต่างเฉพาะชั้น OCR (%d path) = VLM nondeterminism' % len(diffs)
                          if bad == 0 else 'มี %d ชั้นที่ต่าง ควรหยุดตรวจสอบ' % bad))


main()
