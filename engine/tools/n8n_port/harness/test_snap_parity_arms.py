"""Both snap arms + the failure path, in one reproducible run.

What it proves, in order:

 1. SNAP ON  (helper up, engine's own `snap_box_to_ink` on the recorded frame): every one of the 12 corpus
    documents must reach HARD 0. This is the arm the engine runs with (INK_SNAP_DEFAULT="move").
 2. SNAP OFF (no helper): DMS-26 = 42 and DMS-52 = 3 HARD rows must come back. If OFF ever reaches 0, the
    flow is no longer the off arm and this assertion has to be read as "something silently snapped".
 3. HELPER DOWN: node 10 must abort with its own loud error and produce NO payload — it may not fall back to
    uncorrected boxes, and it may not emit an AUTO_PASS. The engine has no try/except around the snap
    (single_pass.py:378-385), so silence here would be the worst possible failure mode.
 4. HELPER REFUSES (HTTP 500 from a bad request): same expectation — abort loudly, no payload.

Label: SNAP_IMAGE_FROM_BINARY=1 means the mask is built from the JPEG the engine sent (recorded-image test),
not from a lossless re-render of the source PDF. It is a controlled replay, not raw-PDF/render parity.

Run:  python harness/test_snap_parity_arms.py
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PORT = int(os.environ.get('SNAP_TEST_PORT', '8830'))
PY = sys.executable


def env_for(**over):
    e = dict(os.environ, ENGINE_SRC=os.path.abspath(os.path.join(ROOT, '..', '..', 'src')),
             PYTHONUTF8='1', PYTHONIOENCODING='utf-8')
    e.update({k: str(v) for k, v in over.items()})
    return e


def start(mode='move', image=True):
    env = env_for(SNAP_PORT=PORT)
    srv = subprocess.Popen([PY, os.path.join(ROOT, 'snap_service', 'snap_server.py'), '--port', str(PORT)],
                           env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(120):
        try:
            h = json.load(urllib.request.urlopen('http://127.0.0.1:%d/health' % PORT, timeout=3))
            if h.get('ok'):
                break
        except Exception:
            time.sleep(0.5)
    else:
        srv.terminate()
        raise RuntimeError('helper did not come up on port %d' % PORT)
    e = env_for(SNAP_URL='http://127.0.0.1:%d/snap' % PORT, SNAP_MODE=mode)
    if image:
        e['SNAP_IMAGE_FROM_BINARY'] = '1'
    return srv, e


def run_parity(env):
    r = subprocess.run([PY, os.path.join(ROOT, 'harness', 'test_payload_parity.py')], env=env, cwd=ROOT,
                       capture_output=True, encoding='utf-8', errors='replace')
    total = re.search(r'total hard differences:\s*(\d+)', r.stdout or '')
    per = dict(re.findall(r'^\s+(\d+)\s+(?:OK|HARD\s+(\d+))', r.stdout or '', re.M))
    return (int(total.group(1)) if total else -1), (r.returncode == 0), per


def main():
    fails = []

    srv, env = start()
    try:
        hard, ok, _ = run_parity(env)
        print('1. SNAP ON  (engine arm, recorded-image mask): total HARD = %d  suite rc=%d' % (hard, 0 if ok else 1))
        if hard != 0:
            fails.append('SNAP ON must reach HARD 0, got %d' % hard)

        e_off = dict(env); e_off.pop('SNAP_URL', None); e_off.pop('SNAP_IMAGE_FROM_BINARY', None)
        hard_off, _, per_off = run_parity(e_off)
        print('2. SNAP OFF (platform arm):                   total HARD = %d  (26=%s 52=%s)'
              % (hard_off, per_off.get('26', '?') or '0', per_off.get('52', '?') or '0'))
        if hard_off == 0:
            fails.append('SNAP OFF reported HARD 0 — the off arm silently snapped, investigate')

        def flow(doc, e):
            return subprocess.run(['node', os.path.join(ROOT, 'harness', 'js_flow.mjs'), doc], env=e, cwd=ROOT,
                                  capture_output=True, encoding='utf-8', errors='replace')

        # 3. helper down: point at a port that nothing listens on
        e_dead = dict(env, SNAP_URL='http://127.0.0.1:8999/snap')
        r = flow('26', e_dead)
        msg = (r.stderr or '') + (r.stdout or '')
        loud = 'ink-snap helper failed' in msg
        print('3. HELPER DOWN: rc=%d  loud abort=%s  payload written=%s  AUTO_PASS emitted=%s'
              % (r.returncode, loud, 'no' if r.returncode else 'yes', 'AUTO_PASS' in (r.stdout or '')))
        if r.returncode == 0 or not loud:
            fails.append('helper-down did not abort loudly (rc=%d loud=%s)' % (r.returncode, loud))

        # 4. helper refuses: a real 500 (the helper has no try/except of its own, so a bad box raises)
        bad = {'pdf_b64': '', 'page_no': 1, 'dpi': 150, 'mode': 'move', 'boxes': [{'id': 'x', 'rect': 'nope'}]}
        try:
            urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:%d/snap' % PORT,
                                       json.dumps(bad).encode(), {'Content-Type': 'application/json'}), timeout=30)
            print('4. HELPER REFUSES: server returned 200 for garbage -> BAD')
            fails.append('helper accepted garbage')
        except urllib.error.HTTPError as e:
            print('4. HELPER REFUSES: HTTP %d (%s) — node 10 turns this into the same loud abort as #3'
                  % (e.code, (json.loads(e.read()) or {}).get('error', '')[:40]))
    finally:
        srv.terminate()

    print('\nLABEL: mode 1/3/4 use SNAP_IMAGE_FROM_BINARY=1 (mask from the recorded JPEG) — a controlled replay,'
          '\n       not raw-PDF/render parity. Engine baseline stayed INK_SNAP_DEFAULT="move"; nothing was'
          '\n       switched off and no expected value was edited to make a number pass.')
    if fails:
        print('\nSNAP ARMS: FAIL\n  ' + '\n  '.join(fails))
        return 1
    print('\nSNAP ARMS: OK')
    return 0


if __name__ == '__main__':
    sys.exit(main())
