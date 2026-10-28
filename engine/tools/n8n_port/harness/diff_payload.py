"""Compare two payloads the way integrity does: drop request/metrics/summary + every timestamp."""
import json, sys
sys.path.reconfigure if hasattr(sys, 'reconfigure') else None
sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def strip(o):
    if isinstance(o, dict): return {k: strip(v) for k, v in o.items() if k not in ('evaluated_at', 'queried_at')}
    if isinstance(o, list): return [strip(x) for x in o]
    return o


def clean(o):
    o = {k: v for k, v in o.items() if k not in ('request', 'metrics', 'summary')}
    o.pop('integrity', None)
    return strip(o)


def walk(a, b, path=''):
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a: yield (path + '/' + k, '<missing>', b[k])
            elif k not in b: yield (path + '/' + k, a[k], '<missing>')
            else: yield from walk(a[k], b[k], path + '/' + k)
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b): yield (path + '/len', len(a), len(b))
        for i, (x, y) in enumerate(zip(a, b)): yield from walk(x, y, path + '/%d' % i)
    elif a != b:
        yield (path, a, b)


pa = json.load(open(sys.argv[1], encoding='utf-8'))
pb = json.load(open(sys.argv[2], encoding='utf-8'))
limit = int(sys.argv[3]) if len(sys.argv) > 3 else 25
print('PY sha  :', pa['integrity']['payload_sha256'])
print('JS sha  :', pb['integrity']['payload_sha256'])
print('SHA EQUAL:', pa['integrity']['payload_sha256'] == pb['integrity']['payload_sha256'])
n = 0
for p, x, y in walk(clean(pa), clean(pb)):
    n += 1
    if n <= limit:
        print('%-52s PY=%s\n%-52s JS=%s' % (p[:52], json.dumps(x, ensure_ascii=False)[:200], '', json.dumps(y, ensure_ascii=False)[:200]))
print('TOTAL DIFFS:', n)

# summary is a view (excluded from the hash) but it still has to be identical
sa, sb = pa.get('summary'), pb.get('summary')
m = 0
for p, x, y in walk(sa, sb, 'summary'):
    m += 1
    if m <= limit:
        print('%-52s PY=%s\n%-52s JS=%s' % (p[:52], json.dumps(x, ensure_ascii=False)[:200], '', json.dumps(y, ensure_ascii=False)[:200]))
print('SUMMARY DIFFS:', m)
