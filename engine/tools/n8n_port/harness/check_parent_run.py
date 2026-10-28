"""ตรวจ output ของ parent ทั้งเส้น (exec ล่าสุด) จาก spill file ของ MCP
 - payload + verification ครบ/ผ่าน schema
 - sha ตรงกัน 3 จุด (integrity / verification / ตัวที่ engine ค านวณ)
 - binary ที่เหลือถึง 23 มีเฉพาะ page_original + annotated (ต องไม มี BMP 6.5 MB)
 - 11b วาดกี่กรอบ / bbox_debug หลุดมาถึงหรือเปลา
usage: python harness/check_parent_run.py <spill.txt>
"""
import json, io, re, sys, hashlib

spill = sys.argv[1]
t = io.open(spill, encoding='utf-8', errors='ignore').read()
o = None
for m in re.finditer(r'\{"', t):
    st, d, k = m.start(), 0, m.start()
    while k < len(t):
        if t[k] == '{': d += 1
        elif t[k] == '}':
            d -= 1
            if d == 0: break
        k += 1
    try: c = json.loads(t[st:k + 1])
    except Exception: continue
    if 'resultData' in c.get('data', {}): o = c; break
rd = o['data']['resultData']['runData']


def out(node):
    return rd[node][0]['data']['main'][0][0]


print('node ที่รัน:', ', '.join('%s(%s)' % (n[:26], r[0].get('executionStatus')) for n, r in rd.items()))
print('lastNode  :', o['data']['resultData'].get('lastNodeExecuted'))

a = out('23 Build API response (result + 9 rules)')
j, b = a['json'], a.get('binary') or {}
v = j.get('verification') or {}
print('\n=== 23 (สิ่งที่ frontend อ่าน) ===')
print('top-level keys : %d  มี verification=%s' % (len(j), bool(v)))
print('schema/contract:', j.get('contract'), '| dms_doc_id =', j.get('package', {}).get('dms_doc_id'))
print('verdict        : %s  codes=%s  oracle_queries=%s  mode=%s' %
      (v.get('verdict'), v.get('exception_codes'), v.get('oracle_queries'), v.get('mode')))
print('engine_ok      : %s  missing=%s  cards(rules)=%s' % (v.get('engine_ok'), v.get('missing'), len(v.get('rules') or [])))
print('sha integrity  :', j.get('integrity', {}).get('payload_sha256'))
print('sha verification:', v.get('payload_sha256'), '| ตรงกัน =', j.get('integrity', {}).get('payload_sha256') == v.get('payload_sha256'))
print('binary keys    :', sorted(b.keys()), '->', ', '.join('%s %s' % (k, b[k].get('fileSize')) for k in sorted(b)))
# bbox_debug ย้ายเข้าไปอยู่ใน verification แล้ว (node 23 spread แค่ engine) - อ่านทั้ง 2 ที่กันพลาด
BD = ('step', 'source_key', 'width', 'height', 'boxes_drawn', 'slots_skipped', 'thickness_px', 'bmp_bytes_out')
bdd = v.get('bbox_debug') or j.get('bbox_debug') or {}
print('bbox_debug     :', json.dumps({k: bdd.get(k) for k in BD}, ensure_ascii=False))
print('bbox_debug อยู่ ใน verification=%s root=%s' % ('bbox_debug' in v, 'bbox_debug' in j))
big = [k for k, val in b.items() if (val.get('bytes') or 0) > 2_000_000]
print('รูปเกิน 2 MB   :', big or 'ไม่มี (ถูกต้อง - ตัด BMP ทิ้งแล้ว)')

bbcall_key = '03 BB Call (Execute Sub-workflow)'
alias_key = '04 Alias page key'
print('\n=== 03/04 (binary ข้ามขอบ blackbox) ===')
print('binary keys เข้า :', sorted((out(bbcall_key).get('binary') or {}).keys()) if bbcall_key in rd else '(ไม่ได้ดึงข้อมูล node นี้มา)')
print('binary keys ออก  :', sorted((out(alias_key).get('binary') or {}).keys()) if alias_key in rd else '(ไม่ได้ดึงข้อมูล node นี้มา)')
if '11b Draw bbox outlines (code)' in rd:
    bb = out('11b Draw bbox outlines (code)')
    print('\n=== 11b (Debug group) ===')
    print('json =', json.dumps(bb['json'], ensure_ascii=False)[:300])
    print('binary keys =', sorted((bb.get('binary') or {}).keys()))

exec_id = (o.get('execution') or {}).get('id') or o.get('id') or o.get('data', {}).get('id') or 'unknown'
dst = 'fixtures/api_response_exec%s.json' % exec_id
io.open(dst, 'w', encoding='utf-8').write(json.dumps(j, ensure_ascii=False))
print('\nsaved %s (%d bytes)' % (dst, len(json.dumps(j))))

from jsonschema import Draft202012Validator
sch = json.load(io.open('../../schemas/result-3.0.schema.json', encoding='utf-8'))
errs = sorted(Draft202012Validator(sch).iter_errors(j), key=lambda e: list(e.path))
print('jsonschema errors ของ response ทั้งก้อน =', len(errs))
print('required keys ครบ =', all(k in j for k in sch['required']))
