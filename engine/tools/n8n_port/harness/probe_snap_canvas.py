"""Can the n8n execution environment actually reach the snap helper? Probe it; never assume it.

The offline proof (harness/test_snap_parity_arms.py) runs the helper on this machine, so it says nothing about
whether the canvas can call it. This script answers that on the real draft:

  1. start the helper on 0.0.0.0 so anything on the LAN can reach it,
  2. optionally ask Windows to allow inbound TCP on that port (needs the right to do it; the script prints
     whether the rule was actually added — a firewall refusal is a legitimate, reportable finding),
  3. push the repo node code to the DRAFT and set node 00's snap_url/snap_mode/snap_timeout_ms,
  4. execute the draft once (same harness the earlier live runs used),
  5. read node 10's `read.snap` (mode/moved/boxes) or its error,
  6. restore node 00 byte-for-byte and stop the helper.

Reachable  -> node 10 reports mode=move with boxes>0, and the canvas ran the engine's mask over its OWN
             150 DPI render (raw-PDF path, not the recorded JPEG).
Unreachable-> node 10 aborts loudly with "ink-snap helper failed". That is a test-environment limit, not a
             flow defect: production stays untouched, and the offline arms stay the parity evidence.

Run:  python harness/probe_snap_canvas.py [--port 8765] [--doc 89]
"""
import glob
import io
import json
import os
import socket
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from mcp_client import Mcp                                       # noqa: E402
import push_v59 as P                                             # noqa: E402

CFG = '00 CONFIG (single point)'


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def my_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))                          # no packets leave; just picks the route
        return s.getsockname()[0]
    except Exception:
        return socket.gethostbyname(socket.gethostname())
    finally:
        s.close()


def set_cfg(s, url, port, remove=False):
    wf = s.call('get_workflow_details', {'workflowId': P.WF})['workflow']
    nodes = {n['name']: n for n in wf['nodes']}
    cur = nodes[CFG]['parameters']['assignments']['assignments']
    keep = [a for a in cur if a['name'] not in
            ('snap_url', 'snap_mode', 'snap_timeout_ms', 'snap_image_from_binary')]
    add = [] if remove else [
        {'id': 'snap_url', 'name': 'snap_url', 'type': 'string', 'value': url},
        {'id': 'snap_mode', 'name': 'snap_mode', 'type': 'string', 'value': 'move'},
        {'id': 'snap_timeout_ms', 'name': 'snap_timeout_ms', 'type': 'number', 'value': port},
        {'id': 'snap_image_from_binary', 'name': 'snap_image_from_binary', 'type': 'boolean',
         'value': os.environ.get('SNAP_PROBE_IMAGE_MODE', '1') == '1'}]
    r = s.call('update_workflow', {'workflowId': P.WF, 'operations': [
        {'type': 'setNodeParameter', 'nodeName': CFG, 'path': '/assignments/assignments',
         'value': keep + add}]})
    back = {n['name']: n for n in s.call('get_workflow_details', {'workflowId': P.WF})['workflow']['nodes']}
    names = [a['name'] for a in back[CFG]['parameters']['assignments']['assignments']]
    return r.get('saved'), names, [a for a in back[CFG]['parameters']['assignments']['assignments']
                                   if a['name'].startswith('snap_')]


def newest_exec():
    return max(glob.glob(os.path.join(ROOT, 'live', 'ab_exec_*.json')), key=os.path.getmtime)


def node10_from(exec_path):
    d = json.load(io.open(exec_path, encoding='utf-8'))
    rd = ((d.get('data') or d).get('resultData') or {}).get('runData') or {}
    for name, runs in rd.items():
        if not name.startswith('10 '):
            continue
        for run in reversed(runs):
            if run.get('error'):
                return 'ERROR', str((run.get('error') or {}).get('message'))[:300]
            for br in ((run.get('data') or {}).get('main') or []):
                for it in (br if isinstance(br, list) else (br or {}).get('items') or []):
                    sn = ((it.get('json') or {}).get('read') or {}).get('snap')
                    if sn is not None:
                        return 'SNAP', json.dumps({k: v for k, v in sn.items() if k != 'map'},
                                                  ensure_ascii=False) + ' map=%d' % len((sn or {}).get('map') or [])
        return 'NO-SNAP', 'node 10 ran but emitted no snap block'
    return 'ABSENT', 'node 10 did not run (execution data has no such node)'


def main():
    port = int(arg('--port', '8765'))
    ip = my_ip()
    url = 'http://%s:%d/snap' % (ip, port)
    print('workstation IP %s -> helper URL %s' % (ip, url))

    fw = subprocess.run(['netsh', 'advfirewall', 'firewall', 'add', 'rule', 'name=snap-helper-test',
                         'dir=in', 'action=allow', 'protocol=TCP', 'localport=%d' % port],
                        capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('firewall rule attempt rc=%d: %s' % (fw.returncode, ((fw.stdout or '') + (fw.stderr or '')).strip()[:120]))

    env = dict(os.environ, ENGINE_SRC=os.path.abspath(os.path.join(ROOT, '..', '..', 'src')),
               SNAP_HOST='0.0.0.0', SNAP_PORT=str(port), PYTHONUTF8='1')
    log_path = os.path.join(ROOT, 'live', 'snap_probe_server.log')
    log = io.open(log_path, 'wb')
    skip_helper = os.environ.get('SNAP_PROBE_SKIP_HELPER') == '1'   # recorder mode: something else owns the port                       # the canvas error says only "500"; the traceback is here
    helper = None if skip_helper else subprocess.Popen(
        [sys.executable, os.path.join(ROOT, 'snap_service', 'snap_server.py'),
         '--port', str(port), '--host', '0.0.0.0'], env=env, stdout=log, stderr=log)
    s = Mcp()
    try:
        time.sleep(2.0)
        print('helper listening locally:', subprocess.run(
            ['python', '-c', 'import urllib.request,json;print(json.load(urllib.request.urlopen(%r,timeout=3))["ok"]'
             % ('http://127.0.0.1:%d/health' % port)], capture_output=True, text=True).stdout.strip())
        print('pushing repo node code to draft (push_v59.py) ...')
        p = subprocess.run([sys.executable, os.path.join(ROOT, 'harness', 'push_v59.py')], env=env, cwd=ROOT,
                           capture_output=True, text=True, encoding='utf-8', errors='replace')
        print('  ' + ((p.stdout or '').strip().splitlines() or ['(no output)'])[-1])
        saved, names, snapcfg = set_cfg(s, url, 25000)
        print('node 00 now carries:', json.dumps([{k: a[k] for k in ('name', 'value')} for a in snapcfg]))
        print('executing the draft (live_v58_test.py) ...')
        r = subprocess.run([sys.executable, os.path.join(ROOT, 'harness', 'live_v58_test.py')], env=env, cwd=ROOT,
                           capture_output=True, text=True, encoding='utf-8', errors='replace')
        print('\n'.join((r.stdout or '').strip().splitlines()[-8:]))
        kind, info = node10_from(newest_exec())
        print('\nNODE 10 ON CANVAS -> %s  %s' % (kind, info))
        print('VERDICT:', 'REACHABLE — the canvas ran the engine snap over its own render'
              if kind == 'SNAP' else 'NOT REACHABLE from the canvas (%s) — report as a test-environment limit' % kind)
    finally:
        saved, names, snapcfg = set_cfg(s, '', 0, remove=True)
        print('restored node 00: snap_* assignments left =', snapcfg)
        if helper: helper.terminate()
        log.close()
        try:
            print('HELPER LOG (last 900 chars):')
            print(io.open(log_path, encoding='utf-8', errors='replace').read()[-900:])
        except Exception as e:
            print('helper log unreadable:', e)
        subprocess.run(['netsh', 'advfirewall', 'firewall', 'delete', 'rule', 'name=snap-helper-test'],
                       capture_output=True, text=True)


if __name__ == '__main__':
    main()
