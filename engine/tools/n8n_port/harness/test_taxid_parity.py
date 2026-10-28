"""R6-13 regression: the tax-id second look must use the ENGINE's rule, in both copies, with the engine's words.

Why each check exists
  (a) byte identity  — nodes 09t (decide) and 09d (accept/reject) each inline the rule because a n8n Code node
      ships as one file. Two copies of a rule drift; this makes drift a test failure.
  (b) verdict parity — the rule is the Thai check-digit rule as domain/normalize.py::tax_id implements it
      (weights 13-i over the first twelve digits, (11-sum%11)%10, Thai digits, the 0155 twelve-digit shorthand).
      The widely-published variant (weights 10..2 over eleven digits) disagrees on real numbers, so agreement
      with python — not with a formula from the internet — is what is asserted here.
  (c) the reason text is contract: single_pass writes taxid_retry[].reason = the rule's message, the assembler
      copies extra.taxid_retry verbatim into the payload, and payload_sha256 covers it. "TAX_ID_CHECKSUM" and a
      prose sentence are not interchangeable.

Run:  cd engine/tools/n8n_port && python harness/test_taxid_parity.py
"""
import glob
import io
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(ROOT)), 'src'))
from system_a.domain.normalize import tax_id                     # noqa: E402  the engine's own rule
from system_a.perception.single_pass import tax_id_problem        # noqa: E402  the engine's own trigger
from system_a.sandbox.scenarios import tax_id_of                  # noqa: E402  synthetic valid ids

N = os.path.join(ROOT, 'n8n_nodes_v58')
fails = []


def check(cond, msg):
    print(('  OK   ' if cond else '  FAIL ') + msg)
    if not cond:
        fails.append(msg)


# ---------------------------------------------------------------- (a) the two canvas copies are one rule
lib = io.open(os.path.join(N, 'lib_taxid.js'), encoding='utf-8').read()
block = lib.split('// >>>TAXID-BLOCK-START>>>\n', 1)[1].split('// <<<TAXID-BLOCK-END<<<', 1)[0].rstrip('\n')
for node, label in (('09t_taxid_triage.js', '09t decide'), ('09d_taxid_merge.js', '09d accept/reject')):
    src = io.open(os.path.join(N, node), encoding='utf-8').read()
    check(block in src, '%s carries the canonical rule byte-for-byte' % label)


# ---------------------------------------------------------------- (b) verdict parity on a mutated corpus
def js_problems(answers):
    """Run the node code's rule (the same bytes) over a list of answers, in one node process.

    The answers travel in a file: a few hundred Thai invoice fields are more than Windows will accept
    on a command line (WinError 206), and this test is about the rule, not about the transport.
    """
    script = io.open(os.path.join(N, 'lib_taxid.js'), encoding='utf-8').read().split(chr(10))
    body = chr(10).join(l for l in script if not l.startswith('//'))
    tmp = os.path.join(HERE, '_taxid_probe_input.json')
    io.open(tmp, 'w', encoding='utf-8').write(json.dumps(answers))
    probe = ('const A = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));' + chr(10)
             + 'console.log(JSON.stringify(A.map((a) => { try {'
             + ' return taxIdProblem(a) === undefined ? "UNDEF" : taxIdProblem(a);'
             + ' } catch (e) { return "THREW:" + e.message; } })));' + chr(10))
    r = subprocess.run(['node', '-e', body + chr(10) + probe, tmp],
                       capture_output=True, text=True, cwd=ROOT, timeout=300)
    if r.returncode:
        raise SystemExit('node probe failed:' + chr(10) + r.stderr[:1500])
    return json.loads(r.stdout)


def cases():
    """Every recorded extract answer, each with its tax ids replaced by every interesting failure mode."""
    out = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'fixtures', 'scn', '*.json'))):
        scen = json.load(io.open(f, encoding='utf-8'))
        for e in scen.get('extract') or []:
            try:
                ans = json.loads(e.get('answer') or '{}')
            except Exception:
                continue
            fields = ans.get('fields') or {}
            base = {'supplier_tax_id': '0123456789011', 'customer_tax_id': tax_id_of('015512345678')}
            for sup in ('MISSING', '', '1234', '012345678901', '0123456789012', base['supplier_tax_id']):
                for cus in ('KEEP', 'MISSING', '9999999999999', base['customer_tax_id']):
                    a = json.loads(json.dumps(ans))
                    a['fields'] = dict(fields)
                    a['fields']['supplier_tax_id'] = {'raw': sup, 'bbox_2d': [1, 2, 3, 4]} if sup != 'MISSING' else None
                    if cus == 'KEEP':
                        a['fields']['customer_tax_id'] = {'raw': base['customer_tax_id'], 'bbox_2d': [1, 2, 3, 4]}
                    else:
                        a['fields']['customer_tax_id'] = {'raw': cus, 'bbox_2d': [1, 2, 3, 4]} if cus != 'MISSING' else None
                    out.append(('%s p%s sup=%r cus=%r' % (os.path.basename(f), e.get('page_no'), sup, cus), a))
            # the same id written with Thai digits and with separators - normalize accepts both
            for spelling in ('\u0e08\u0e01?', base['supplier_tax_id'][:6] + '-' + base['supplier_tax_id'][6:]):
                a = json.loads(json.dumps(ans))
                a['fields'] = dict(fields)
                a['fields']['supplier_tax_id'] = {'raw': spelling, 'bbox_2d': [1, 2, 3, 4]}
                out.append(('%s p%s spelling=%r' % (os.path.basename(f), e.get('page_no'), spelling), a))
    return out


cases_list = cases()
print('corpus: %d mutated answers (%d recorded extract answers)'
      % (len(cases_list), len({c[0].split(' sup=')[0].split(' spelling=')[0] for c in cases_list})))
CHUNK = 400
pyv = [tax_id_problem(a) for _, a in cases_list]
jv = []
for i in range(0, len(cases_list), CHUNK):
    jv += js_problems([a for _, a in cases_list[i:i + CHUNK]])
bad = [(cases_list[i][0], pyv[i], jv[i]) for i in range(len(cases_list)) if pyv[i] != jv[i]]
for b in bad[:10]:
    print('    DIFF %-60s python=%r js=%r' % b)
check(not bad, 'js rule == single_pass.tax_id_problem on all %d cases (reason text included)' % len(cases_list))

# engine wording is what the payload hash covers
for probe, want in (({'fields': {'supplier_tax_id': {'raw': '012345678901'}}}, 'TAX_ID_NOT_13_DIGITS'),
                    ({'fields': {'supplier_tax_id': {'raw': '9999999999999'}}}, 'TAX_ID_CHECKSUM'),
                    ({'fields': {}}, 'TAX_ID_MISSING')):
    got = tax_id_problem(probe)
    check(got == want, 'engine reason for %s is %s' % (json.dumps(probe)[:34], want))
    jg = js_problems([probe])[0]
    check(jg == want, '  ...and the node copy produces the same string for it')
# an absent CUSTOMER id must not fire the retry: the engine docstring (single_pass.py:477) says plenty of
# documents genuinely do not print one, and firing here would spend the document's single second look on a
# field that was never a problem. The supplier id still has to be valid, or the supplier triggers first.
VALID = tax_id_of('011551234567')
absent_customer = {'fields': {'supplier_tax_id': {'raw': VALID}, 'customer_tax_id': None}}
check(tax_id_problem(absent_customer) is None,
      'valid supplier id + absent customer id is not a trigger (engine docstring, single_pass.py:477)')
check(js_problems([absent_customer])[0] is None, '  ...and the node copy agrees')
bad_customer = {'fields': {'supplier_tax_id': {'raw': VALID}, 'customer_tax_id': {'raw': '9999999999999'}}}
check(tax_id_problem(bad_customer) == 'TAX_ID_CHECKSUM', 'a WRONG customer id is a trigger (it is read too)')
check(js_problems([bad_customer])[0] == 'TAX_ID_CHECKSUM', '  ...and the node copy agrees')

# the 0155 shorthand: normalize.tax_id accepts a 12-digit 0155… id when 011+rest passes the checksum, so the
# trigger must not be a naive length test — otherwise every such page burns the retry on a correct reading.
SHORT = '01' + VALID[3:]                                  # the same id printed as 0155xxxxxxxxxx (12 digits)
assert SHORT.startswith('0155') and len(SHORT) == 12, (SHORT, len(SHORT))
check(tax_id(SHORT) == VALID, 'normalize.tax_id expands the 0155 twelve-digit form')
shorthand = {'fields': {'supplier_tax_id': {'raw': SHORT}, 'customer_tax_id': None}}
check(tax_id_problem(shorthand) is None, 'the engine does not treat the shorthand as a tax-id problem')
check(js_problems([shorthand])[0] is None, '  ...and neither does the node copy')
# Digits: normalize.py:11 builds THAI_DIGITS from U+0E50-U+0E59 (Tai Tham), NOT the ordinary Thai digits at
# U+0E60-U+0E69. Both codepoints are asserted on both sides: the flow must convert exactly what the engine
# converts. Copying the asymmetry is deliberate — silently "fixing" it in the port is divergence, and the
# engine table is the owner's call, not this port's.
thai_lanna = {'fields': {'supplier_tax_id': {'raw': ''.join(chr(0x0E50 + int(c)) for c in VALID)}}}
check(tax_id_problem(thai_lanna) is None, 'U+0E50-series digits are read as digits by the engine')
check(js_problems([thai_lanna])[0] is None, '  ...and by the node copy')
thai_ascii_range = {'fields': {'supplier_tax_id': {'raw': ''.join(chr(0x0E60 + int(c)) for c in VALID)}}}
check(tax_id_problem(thai_ascii_range) == 'TAX_ID_NOT_13_DIGITS',
      'U+0E60-series digits are NOT converted by the engine (normalize.py:11 table) — recorded, not fixed here')
check(js_problems([thai_ascii_range])[0] == 'TAX_ID_NOT_13_DIGITS', '  ...and the node copy behaves the same way')
seps = {'fields': {'supplier_tax_id': {'raw': VALID[:4] + '-' + VALID[4:8] + ' ' + VALID[8:]}}}
check(tax_id_problem(seps) is None, 'separators inside the id are stripped, not treated as a mis-read')
check(js_problems([seps])[0] is None, '  ...and the node copy strips them too')

print()
print('R6-13 TAX-ID RULE PARITY: ' + ('PASS' if not fails else 'FAIL (%d)' % len(fails)))
sys.exit(1 if fails else 0)
