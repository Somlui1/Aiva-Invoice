"""Live-extraction parity: the same fresh OCR result must give the same payload in python and in the port.

  python harness/test_live_exec.py                 # every live/ab_exec_*.json that has the node outputs
  python harness/test_live_exec.py live/ab_exec_450.json

Why this exists: the recorded tape corpus proves the port reproduces the engine on documents the engine
already read.  This proves it on a document the flow OCR'd *after* recording - nothing was recorded for it,
so a port bug (or a node-12 shape change) shows up here first.  Oracle is stubbed to "no rows" on BOTH sides
and the rule AI is off on both sides, so the two runs are comparable; verdict parity with the live run
(which does have Oracle) is not the point - byte parity of the payload is.

live/ and fixtures/ hold real invoice data, so they are gitignored: missing files are reported and skipped.
"""
import io
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PY = sys.executable
sys.path.insert(0, HERE)
from diff_rec import strip_ts, walk                                     # noqa: E402  same drop rules as the payload hash


def compare(exec_file, fields=False):
    base = os.path.splitext(os.path.basename(exec_file))[0]              # ab_exec_450
    stem = base.replace('ab_', 'exec_')                                  # exec_450
    fx_name, tape_name = stem + '.json', stem + '_oracle.json'          # js_exec resolves these under ROOT
    fx_rel, tape_rel, meta_rel = 'fixtures/' + fx_name, 'fixtures/' + tape_name, 'fixtures/' + stem + '_meta.json'
    tape_path = os.path.join(ROOT, 'fixtures', tape_name)
    r = subprocess.run(['node', os.path.join(HERE, 'js_exec.mjs'), exec_file, '--dump-extraction', fx_rel],
                       capture_output=True, text=True, cwd=ROOT)
    if r.returncode:
        return ('skip', 'node side failed: ' + (r.stderr or r.stdout)[-200:])
    fx = json.load(io.open(os.path.join(ROOT, 'fixtures', fx_name), encoding='utf-8'))
    if not os.path.exists(tape_path):                                    # every Oracle lookup answers "no rows"
        io.open(tape_path, 'w', encoding='utf-8').write(json.dumps(
            [{'query_id': 'EMPTY', 'sql': '--', 'csv': 'No rows selected'}] * 14))
    io.open(os.path.join(ROOT, 'fixtures', fx_name[:-5] + '_meta.json'), 'w', encoding='utf-8').write(
        json.dumps({'request': fx['request'], 'models': fx['models']}))

    # --fixture: read the extraction from the dumped file, exactly like the python side below. Without it the
    # two halves consume the same DATA in different KEY ORDER and disagree on ocr.elements ordering.
    js = subprocess.run(['node', os.path.join(HERE, 'js_exec.mjs'), exec_file,
                         '--tape', tape_rel, '--fixture', fx_rel,
                         '--out', 'fixtures/payload_js_' + base + '.json'],
                        capture_output=True, text=True, cwd=ROOT)
    py = subprocess.run([PY, os.path.join(HERE, 'py_full.py'), fx_name, tape_name,
                         'payload_py_' + base + '.json'], capture_output=True, text=True, cwd=ROOT)
    if js.returncode:
        return ('skip', 'node run failed: ' + (js.stderr or js.stdout)[-200:])
    if py.returncode:
        return ('fail', 'python failed: ' + (py.stderr or py.stdout)[-300:])
    def sha_of(text):                                        # '... sha=sha256:abc... rec=HOLD queries=0'
        for line in text.splitlines():
            if 'sha=' in line:
                return line.split('sha=')[1].split()[0].strip()
        return '?'
    jsSha, pySha = sha_of(js.stdout), sha_of(py.stdout)
    if not fields:
        return ('ok' if jsSha == pySha else 'fail'), jsSha + ' vs ' + pySha
    # --fields: name the paths that differ instead of trusting one hash.  Same drop rules as the payload hash
    # (integrity/request/metrics/summary + the evaluated_at/queried_at stamps) - see integrity.excludes.
    jsP = json.load(io.open(os.path.join(ROOT, 'fixtures', 'payload_js_' + base + '.json'), encoding='utf-8'))
    pyP = json.load(io.open(os.path.join(ROOT, 'fixtures', 'payload_py_' + base + '.json'), encoding='utf-8'))
    drop, diff = ('integrity', 'request', 'metrics', 'summary'), []
    walk(strip_ts({k: v for k, v in jsP.items() if k not in drop}),
         strip_ts({k: v for k, v in pyP.items() if k not in drop}), '', diff, 20)
    label = 'field-by-field: identical on every key the payload hash covers'
    if diff:
        label = '%d field(s) DIFFER: %s' % (len(diff), '; '.join('%s js=%r py=%r' % (p, a, b) for p, a, b in diff[:3])[:260])
    return ('ok' if jsSha == pySha and not diff else 'fail'), jsSha + ' vs ' + pySha + '  ' + label


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    fields = '--fields' in sys.argv
    files = args or sorted([os.path.join('live', f) for f in os.listdir(os.path.join(ROOT, 'live'))
                            if f.startswith('ab_exec_') and f.endswith('.json') and 'meta' not in f])
    if not files:
        print('no live/ab_exec_*.json saved yet - nothing to compare (run the flow, then re-run this)')
        return 0
    bad = skipped = 0
    for f in files:
        status, info = compare(f, fields)
        if status == 'skip':
            print('%-30s SKIP  %s' % (f, info[:180])); skipped += 1
            continue
        bad += status == 'fail'
        print('%-30s %-4s %s' % (f, 'OK' if status == 'ok' else 'FAIL', info))
    print('\n%s' % ('LIVE-EXTRACTION PARITY: OK' if not bad else 'PORT AND ENGINE DISAGREE on %d file(s)' % bad))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
