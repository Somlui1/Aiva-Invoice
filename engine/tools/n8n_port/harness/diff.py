"""Deep diff of two JSON files: python harness/diff.py a.json b.json [max]"""
import json, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')


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


a = json.load(open(sys.argv[1], encoding='utf-8'))
b = json.load(open(sys.argv[2], encoding='utf-8'))
limit = int(sys.argv[3]) if len(sys.argv) > 3 else 40
n = 0
for p, x, y in walk(a, b):
    n += 1
    if n <= limit:
        print('%-58s PY=%s  JS=%s' % (p[:58], json.dumps(x, ensure_ascii=False)[:110], json.dumps(y, ensure_ascii=False)[:110]))
print('TOTAL DIFFS: %d' % n)
