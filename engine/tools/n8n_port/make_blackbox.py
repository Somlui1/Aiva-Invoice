#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""ประกอบ workflow "blackbox" (Stage 1-3 + envelope + validate + report) เป็นไฟล์ JSON ให้ Import ใน n8n

เหตุผลที่ต้องเป็นไฟล์: node 21 มี jsCode 260,072 ตัวอักษร ส่งผ่าน MCP/API ไม่ได้
แต่ n8n UI import ไฟล์ได้สบาย -> ไม่ต้องมีใครพิมพ์ 260 KB

input  : parent ส่ง { doc_id: <int> }   (binary ข้ามขอบขาเข้าไม่ได้ - พิสูจน์แล้ว exec 396)
output : 1 item = {ผล report ของ 22 + engine: payload result/3.0 + overlay/img_w/img_h} + binary.page_original

usage: python make_blackbox.py
"""
import json, io, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DUMP = os.path.join(HERE, 'parent_dump.json')
NODE21 = os.path.join(HERE, 'dist', 'node21_inline.js')
OUT = os.path.join(HERE, 'blackbox.json')

BB_NAME = 'DMS Invoice OCR + Validate (BLACKBOX Stage 1-3)'
TRIGGER = 'BB TRIGGER (doc_id from parent)'

# ลำดับสายใน blackbox (11a/11b/11c ไม่อยู่ที่นี่ - ย้ายไป parent เป็น Debug group)
CHAIN = [
    '00 CONFIG (single point)',
    'Get a document',
    '02 PDF to JPEG 80 DPI (classify)',
    '03 Build classify request',
    '04 VLM step 1 classify pages',
    '05 Parse classify pick invoice pages',
    '06 PDF to JPEG 150 DPI',
    '07 Rotate invoice page upright',
    '08 Build extract request',
    '09 VLM step 2 extract bbox',
    '10 Bbox math pixels + sanitize',
    '12 Build final JSON + images',
]
N21 = '21 Validate (port)'
N22 = '22 Verification report (9 rules)'

# trigger สำรอง: executeWorkflowTrigger รัน manual ไม่ได้ (MCP/编辑器) จึงมี Manual Trigger คู่ไว้
# เทสต์ blackbox เดี่ยว ๆ ได้ โดยไม่กระทบสายจริง (parent เรียกผ่าน BB TRIGGER เท่านั้น) -> เก็บไว้ถาวร
MANUAL = '00 MANUAL TEST (doc_id=89)'


def sub(text, old, new, who, expect=1):
    """แก้ jsCode แบบเงียบไม่ได้: ถ้าหาไม่เจอหรือเจอเกินจำนวนที่กำหนด = fail ทันที"""
    n = text.count(old)
    if n != expect:
        sys.exit('PATCH FAIL [%s]: found %d occurrence(s) of %r, expected %d' % (who, n, old[:70], expect))
    return text.replace(old, new)


def main():
    wf = json.load(io.open(DUMP, encoding='utf-8'))
    N = {n['name']: n for n in wf['nodes']}
    for nm in CHAIN + [N22]:
        if nm not in N:
            sys.exit('missing node in dump: ' + nm)

    def clone(nm):
        n = json.loads(json.dumps(N[nm]))            # deep copy
        n.pop('id', None); n.pop('idVersion', None); n.pop('position', None)
        return n

    nodes = []

    # ---------- 1) trigger รับ doc_id จาก parent (passthrough = รับทุก field) ----------
    trig = {
        'name': TRIGGER,
        'type': 'n8n-nodes-base.executeWorkflowTrigger',
        'typeVersion': 1.1,
        'position': [-220, 300],
        'parameters': {'inputSource': 'passthrough'},
        'notes': 'parent ส่งมาแค่ { doc_id } - binary ขาเข้าข้าม workflow ไม่ได้ (exec 396)',
        'notesInFlow': True,
    }
    nodes.append(trig)

    # ---------- 2) ชุด Stage 1-3 + patch ----------
    for nm in CHAIN:
        n = clone(nm)
        p = n['parameters']

        if nm == '00 CONFIG (single point)':
            # เดิม doc_id = {{ $json.body.doc_id || 23 }} (ผูกกับ Webhook) -> รับ flat {doc_id} จาก parent
            for a in p['assignments']['assignments']:
                if a['name'] == 'doc_id':
                    a['value'] = '={{ $json.doc_id || ($json.body && $json.body.doc_id) || 89 }}'
                    if '$json.doc_id' not in a['value']:
                        sys.exit('PATCH FAIL [CONFIG]: doc_id expression not applied')
        if nm == 'Get a document':
            # เดิม hardcode id=89 -> อ่านจาก CONFIG (single point ตามชื่อ)
            p['id'] = {'__rl': True, 'mode': 'id',
                       'value': "={{ $('00 CONFIG (single point)').first().json.doc_id }}",
                       'cachedResultName': ''}
        if nm == '12 Build final JSON + images':
            js = p['jsCode']
            js = sub(js,
                     "const annotated = await this.helpers.getBinaryDataBuffer(0, 'annotated');",
                     "// ใน blackbox: 11a-11c ย้ายไป parent แล้ว -> ไม่มี 'annotated' ที่นี่ จึงทำให้เป็น optional\n"
                     "let annotated = null;\n"
                     "try { annotated = await this.helpers.getBinaryDataBuffer(0, 'annotated'); } catch (e) { annotated = null; }",
                     nm)
            js = sub(js,
                     "const pageAnnotated = await this.helpers.prepareBinaryData(annotated, 'invoice_p' + sel.invoice_page + '_annotated.jpg', 'image/jpeg');",
                     "const pageAnnotated = annotated ? await this.helpers.prepareBinaryData(annotated, 'invoice_p' + sel.invoice_page + '_annotated.jpg', 'image/jpeg') : null;",
                     nm)
            # ส่ง overlay + ขนาดภาพ ออกไปให้ parent วาดกรอบ (ใส่ใน images เพราะ node 21 ส่ง images ต่ออยู่แล้ว
            # = ไม่ต้องแตะไฟล์ 260 KB ของ node 21 เลย)
            js = sub(js,
                     "images: { invoice_page: sel.invoice_page,",
                     "images: { invoice_page: sel.invoice_page, overlay: s10.overlay || [], img_w: s10.img_w, img_h: s10.img_h,",
                     nm)
            js = sub(js,
                     "annotated_bytes: annotated.length",
                     "annotated_bytes: annotated ? annotated.length : null",  # exec 398 ตกที่นี่ (annotated = null)
                     nm)
            js = sub(js,
                     "binary: { page_original: pageOriginal, annotated: pageAnnotated } }];",
                     "binary: pageAnnotated ? { page_original: pageOriginal, annotated: pageAnnotated } : { page_original: pageOriginal } }];",
                     nm)
            p['jsCode'] = js

        nodes.append(n)

    # ---------- 3) node 21 (engine Oracle) จาก artifact ใน repo ----------
    js21 = io.open(NODE21, encoding='utf-8').read()
    if len(js21) < 200000:
        sys.exit('node21 artifact looks truncated: %d bytes' % len(js21))
    nodes.append({
        'name': N21,
        'type': 'n8n-nodes-base.code',
        'typeVersion': 2,
        'position': [0, 0],
        'parameters': {'mode': 'runOnceForAllItems', 'jsCode': js21},
        'notes': 'ห้ามแก้ไฟล์นี้ข้าม head: ต้อง rebuild ด้วย build_n8n_inline.mjs แล้วรัน harness/test_inline.mjs',
        'notesInFlow': True,
    })

    # ---------- 4) node 22 (report) + patch ส่ง overlay ต่อ ----------
    n22 = clone(N22)
    js = n22['parameters']['jsCode']
    js = sub(js,
             "  engine: engineOk ? payload : null, table, report_text",
             "  engine: engineOk ? payload : null, table, report_text,\n"
             "  // ส่งต่อข้อมูลวาดกรอบให้ parent (node 21 ส่ง images ต่ออยู่แล้ว จึงไม่ต้องแตะ node 21)\n"
             "  overlay: (IN.images && IN.images.overlay) || IN.overlay || [],\n"
             "  img_w: (IN.images && IN.images.img_w) || IN.img_w || null,\n"
             "  img_h: (IN.images && IN.images.img_h) || IN.img_h || null",
             N22)
    n22['parameters']['jsCode'] = js
    nodes.append(n22)

    # ---------- 5) layout + connections ----------
    all_names = [TRIGGER] + CHAIN + [N21, N22]
    for i, n in enumerate(nodes):
        if n['name'] == TRIGGER:
            continue
        n['position'] = [40 + (i - 1) * 240, 300]
    conns = {}
    for a, b in zip(all_names, all_names[1:]):
        conns[a] = {'main': [[{'node': b, 'type': 'main', 'index': 0}]]}

    # ---------- 4b) Manual Trigger สำรอง (เข้าสายที่ 00 CONFIG ตัวเดียวกัน) ----------
    nodes.append({
        'name': MANUAL,
        'type': 'n8n-nodes-base.manualTrigger',
        'typeVersion': 1,
        'position': [-220, 480],
        'parameters': {},
        'notes': 'มีไว้เทสต์ blackbox เดี่ยว ๆ เท่านั้น (trigger แบบ Execute Workflow รัน manual ไม่ได้) - ไม่กระทบสายจริง',
        'notesInFlow': True,
    })
    conns[MANUAL] = {'main': [[{'node': CHAIN[0], 'type': 'main', 'index': 0}]]}

    # ---------- 5b) node groups (แบ่ง 3 Stage เหมือน parent) ----------
    # trigger ทั้งสองตัว + 00 CONFIG อยู่นอก group โดยตั้งใจ:
    #  - n8n ไม่ให้ trigger อยู่ใน group (เจอมาแล้วตอนทำ parent)
    #  - 00 CONFIG เป็นค่ารวมที่ทุก stage ใช้
    GROUPS = [
        {'name': 'Stage 1 - Paperless + แยกหน้า',
         'description': 'ดึงไฟล์จาก Paperless -> ย่อ 80 DPI -> VLM จำแนกหน้า -> คัดหน้า invoice',
         'nodeNames': ['Get a document', '02 PDF to JPEG 80 DPI (classify)', '03 Build classify request',
                       '04 VLM step 1 classify pages', '05 Parse classify pick invoice pages']},
        {'name': 'Stage 2 - OCR หน้า Invoice',
         'description': 'Render 150 DPI -> หมุนหน้าตรง -> VLM สกัด field + bbox -> คํานวณ pixel',
         'nodeNames': ['06 PDF to JPEG 150 DPI', '07 Rotate invoice page upright', '08 Build extract request',
                       '09 VLM step 2 extract bbox', '10 Bbox math pixels + sanitize']},
        {'name': 'Stage 3 - ประกอบ payload + validate',
         'description': 'ประกอบ result/3.0 + รัน rules V-01..V-09 + ตาราง 9 ใบ (logic ทั้งหมดอยู่ใน node 21)',
         'nodeNames': ['12 Build final JSON + images', N21, N22]},
    ]
    have = {n['name'] for n in nodes}
    missing = [x for g in GROUPS for x in g['nodeNames'] if x not in have]
    if missing:
        sys.exit('nodeGroups ชี้ชื่อที่ไม่มีอยู่จริง: %s' % missing)
    grouped = {x for g in GROUPS for x in g['nodeNames']}
    # ทุก group ต้องมี exit ไม่เกิน 1 เส้น (0 ได้ ถ้า group จบท้าย workflow; ไม่งั้น n8n ลบ group ทิ้ง)
    exits = [(g['name'], [b for a, b in zip(all_names, all_names[1:]) if a in set(g['nodeNames']) and b not in set(g['nodeNames'])])
             for g in GROUPS]
    bad = [e for e in exits if len(e[1]) > 1]
    if bad:
        sys.exit('group มี exit เกิน 1 เส้น (n8n จะลบ group): %s' % bad)
    for nm, ex in exits:
        print('  exit ของ %-34s : %s' % (nm, ex or '(จบท้าย workflow)'))

    out = {
        'name': BB_NAME,
        'nodes': nodes,
        'connections': conns,
        'nodeGroups': GROUPS,
        'settings': {'executionOrder': 'v1'},
        'active': False,
        'pinData': {},
        'meta': {'templateCredsSetupCompleted': True},
    }
    io.open(OUT, 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=1))

    total = sum(len(n['parameters'].get('jsCode', '')) for n in nodes)
    print('wrote %s' % OUT)
    print('  nodes        : %d  (trigger + %d เดิม + 21 ใหม่ + 22)' % (len(nodes), len(CHAIN)))
    print('  size         : %s bytes' % format(os.path.getsize(OUT), ','))
    print('  jsCode รวม   : %s chars (node 21 = %s)' % (format(total, ','), format(len(js21), ',')))
    print('  chain        : ' + ' -> '.join(x.split(' ')[0] for x in all_names))
    print('  credentials  : ' + ', '.join(sorted({k for n in nodes for k in (n.get('credentials') or {})})))
    # sanity: ห้ามมี ref ชี้ไป node ที่ไม่ได้อยู่ในไฟล์นี้
    import re
    names = set(all_names)
    bad = []
    for n in nodes:
        for ref in set(re.findall(r"\$\('([^']+)'\)", n['parameters'].get('jsCode', '') + json.dumps(n['parameters'], ensure_ascii=False))):
            if ref not in names and ref != 'Webhook Invoice OCR' and not ref.startswith('...'):
                bad.append((n['name'], ref))
    print('  dangling $() : %s' % (bad if bad else 'none (Webhook Invoice OCR = comment เท่านั้น)'))


if __name__ == '__main__':
    main()
