"""เทียบ node 12 ที่อยู่บน n8n จริง กับฉบับที่ generator สร้าง
 separates 'โค้ด' ออกจาก 'ข้อความไทย': ตัด non-ASCII ทิ้งแล้วเทียบ skeleton
 (ใน node นี้ข้อความไทยอยู่ใน string literal/comment เท่านั้น)

usage: python harness/check_node12_drift.py <spill.txt>
"""
import json, io, re, sys, hashlib, difflib

spill = sys.argv[1]
t = io.open(spill, encoding='utf-8', errors='ignore').read()
live = None
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
    if 'nodes' in o and 'connections' in o:
        live = o.get('workflow', o); break
L = {n['name']: n for n in live['nodes']}
live12 = L['12 Build final JSON + images']['parameters']['jsCode']
gen12 = io.open('n8n_nodes/12_patched.js', encoding='utf-8').read()


def skeleton(src):
    """เหลือเฉพาะ ASCII = โครงโค้ด + identifier + ตัวเลข (ข้อความไทยหายไปทั้งหมด)"""
    return [re.sub(r'[^\x00-\x7f]+', '', l) for l in src.splitlines()]


g, l = skeleton(gen12), skeleton(live12)
same = g == l
print('บรรทัดทั้งหมด        : generated=%d live=%d' % (len(g), len(l)))
print('skeleton (เฉพาะโค้ด) ตรงกัน = %s' % same)
if not same:
    for d in difflib.unified_diff(g, l, 'generated', 'live', lineterm='', n=0):
        print(d[:220])
print('skeleton md5 : gen=%s live=%s' % (hashlib.md5('\n'.join(g).encode()).hexdigest()[:12],
                                          hashlib.md5('\n'.join(l).encode()).hexdigest()[:12]))

# ค่าที่มีผลกับผลลัพธ์จริง (ไม่ใช่ข้อความอธิบาย)
must = {
    "annotation optional": 'let annotated = null;' in live12,
    "pageAnnotated ternary": 'const pageAnnotated = annotated ? await this.helpers.prepareBinaryData' in live12,
    "annotated_bytes ternary": 'annotated_bytes: annotated ? annotated.length : null' in live12,
    "images.overlay": 'overlay: s10.overlay || []' in live12,
    "images.img_w": 'img_w: s10.img_w' in live12,
    "images.img_h": 'img_h: s10.img_h' in live12,
    "binary conditional": 'binary: pageAnnotated ? { page_original: pageOriginal, annotated: pageAnnotated } : { page_original: pageOriginal }' in live12,
    "contract": "'aiva.system_a.result'" in live12 and "version: '3.0'" in live12,
    "reads CONFIG/05/10/04/09": all(x in live12 for x in ['$(\'00 CONFIG (single point)\')', '$(\'05 Parse classify pick invoice pages\')',
                                                          '$(\'10 Bbox math pixels + sanitize\')', '$(\'04 VLM step 1 classify pages\')',
                                                          '$(\'09 VLM step 2 extract bbox\')']),
}
print()
for k, v in must.items():
    print('  %-26s %s' % (k, 'OK' if v else 'MISSING!!'))
print('\nสรุป: %s' % ('โค้ดตรงกันทุกตัวอักษร (ต่างแค่ข้อความไทย)' if same and all(must.values())
                     else 'ต้องมีข้อผิดปกติ'))
