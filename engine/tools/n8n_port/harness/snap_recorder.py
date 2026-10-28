"""Log exactly what the canvas sends to the snap helper, then answer 500.

node 10's error only says "status code 500", so before guessing whether it is a chunked body, a truncated
base64, or an unexpected key, record the real request once and replay it locally.

Run:  python harness/snap_recorder.py --port 8780   (writes live/snap_request_capture.json)
"""
import argparse, json, os, io
from http.server import BaseHTTPRequestHandler, HTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'live', 'snap_request_capture.json')

class H(BaseHTTPRequestHandler):
    def do_POST(self):
        te = (self.headers.get('Transfer-Encoding') or '').lower()
        if 'chunked' in te:
            data = b''
            while True:
                line = self.rfile.readline().strip()
                if not line: continue
                n = int(line, 16)
                if n == 0:
                    self.rfile.readline(); break
                data += self.rfile.read(n); self.rfile.readline()
        else:
            data = self.rfile.read(int(self.headers.get('Content-Length') or 0))
        keys, shapes = {}, None
        try:
            j = json.loads(data.decode())
            keys = {k: (len(v) if isinstance(v, str) else (len(v) if isinstance(v, list) else v))
                    for k, v in j.items()}
            shapes = (j.get('boxes') or [{}])[0]
        except Exception as e:
            keys = {'parse_error': str(e)[:200], 'head': data[:120].decode('utf-8', 'replace')}
        io.open(OUT, 'w', encoding='utf-8').write(json.dumps(
            {'headers': dict(self.headers), 'body_len': len(data), 'keys_len_or_val': keys,
             'first_box': shapes, 'json_head': data[:400].decode('utf-8', 'replace')}, indent=1))
        print('captured body_len=%d -> %s' % (len(data), OUT))
        body = json.dumps({'ok': False, 'error': 'recorder: captured, refusing'}).encode()
        self.send_response(500); self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
    def log_message(self, *a): pass

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--port', type=int, default=8780)
    a = ap.parse_args()
    print('recorder on %d' % a.port)
    HTTPServer(('0.0.0.0', a.port), H).serve_forever()
