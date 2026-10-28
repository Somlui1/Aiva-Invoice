"""Reference run of the Oracle lookup for THIS document against the real ORDS endpoint.

  python harness/py_lookup.py   -> fixtures/oracle_rows.json  [{query_id, sql, csv}]   (replay tape)
                                   fixtures/lookup_py.json     {snapshot, trace, calls, candidates}

The JS port replays the same tape in harness/js_lookup.mjs; harness/diff.py compares the two.
"""
import json, os, sys, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))            # .../engine/temp/n8n_port
ENGINE = os.path.dirname(os.path.dirname(ROOT))
FIX = os.path.join(ROOT, 'fixtures')
sys.path.insert(0, os.path.join(ENGINE, 'src'))

from decimal import Decimal                                                   # noqa: E402
from system_a.domain.contracts import ExtractionResult                        # noqa: E402
from system_a.domain.standard import load_standard                            # noqa: E402
from system_a.domain.normalize import normalize                               # noqa: E402
from system_a.application.invoice_keys import document_candidates, receipt_num_candidates  # noqa: E402
from system_a.application.oracle_lookup import OracleSession, TAX_MODE, lookup_mode       # noqa: E402
from system_a.adapters.oracle.mcp_repository import McpSqlClient, OracleMcpRepository     # noqa: E402

url = token = None
for line in open(os.path.join(ENGINE, '.env'), encoding='utf-8'):
    line = line.strip()
    if line.startswith('ORACLE_MCP_URL='): url = line.split('=', 1)[1].strip().strip('"')
    if line.startswith('ORACLE_MCP_TOKEN='): token = line.split('=', 1)[1].strip().strip('"')

std = load_standard()
policy = std.policy['oracle']
ext = ExtractionResult.model_validate(json.load(open(os.path.join(FIX, 'extraction.json'), encoding='utf-8'))['extraction'])
doc, meta = normalize(ext, std)
lk = policy['lookup']

inv_key = doc.value_any('invoice_num')
po_key = doc.value_any('po_number')
sup_key = doc.value_any('supplier_tax_id')
inv_cands = document_candidates(ext.extra, inv_key, page_types=lk.get('invoice_candidate_page_types') or (),
                                labels=lk.get('invoice_candidate_labels') or (),
                                exclude=list(meta.get('po_numbers') or ()) + ([po_key] if po_key else []),
                                receipt_patterns=lk.get('receipt_num_patterns') or ())
rcv_cands = receipt_num_candidates(ext.extra, lk.get('receipt_num_patterns') or (), int(lk.get('receipt_num_max_candidates') or 2))

tape = []
_run = McpSqlClient.run


def spy(self, sql, *, database='default'):
    text = _run(self, sql, database=database)
    qid = ('PO-SUPPLIER' if '\nWHERE ph.SEGMENT1 = ' in sql and 'AS SUPPLIER_TAX_ID' in sql and 'MULTI' not in sql and 'RCV_SHIPMENT_LINES' not in sql
           else 'TAX-INV-SUFFIX' if 'SUBSTR(UPPER(REPLACE(h.SHIPMENT_NUM' in sql
           else 'RCV-BY-NUM' if 'h.RECEIPT_NUM = :' in sql
           else 'TAX-INV')
    tape.append({'query_id': qid, 'sql': sql, 'csv': text})
    print('  %-16s bytes=%-7d receipts=%s' % (qid, len(text), sorted({l.split(',')[0] for l in text.splitlines()[1:6]})))
    return text


McpSqlClient.run = spy
client = McpSqlClient(url, token, timeout_s=90.0)
repo = OracleMcpRepository(client, row_cap=policy['row_cap'], match_columns=lk['invoice_match_columns'], row_caps=policy.get('row_caps'))
session = OracleSession(repo, policy['row_cap'], max_queries=policy.get('max_queries_per_round'),
                        lookup_cfg=lk, row_caps=policy.get('row_caps'))
sub = doc.value_any('sub_total')
t0 = time.time()
snap = session.lookup_tax_invoice(inv_key, ocr_supplier_tax_id=sup_key, po_number=po_key,
                                  invoice_candidates=inv_cands, receipt_candidates=rcv_cands,
                                  customer_tax_id=doc.value_any('customer_tax_id'),
                                  sub_total=sub if isinstance(sub, Decimal) else None, total_tol=std.tol('total'))
print('lookup %.1fs path=%s rows=%d calls=%d trace=%s' % ((time.time() - t0) * 1000, snap.lookup_path, len(snap.rows), snap.calls, session.trace))


def _s(v):
    return None if v is None else str(v)


def rowd(r):
    from system_a.domain.contracts import row_payload
    return {k: (str(v) if not isinstance(v, (str, int, float, bool, dict, type(None))) else v) for k, v in row_payload(r).items()}


snapshot = {'queried_at': 'T', 'lookup_path': snap.lookup_path, 'query_keys': snap.query_keys,
            'rows': [rowd(r) for r in snap.rows], 'row_cap_hit': snap.row_cap_hit, 'calls': snap.calls,
            'po_numbers': list(snap.po_numbers), 'matched_on_column': snap.matched_on_column}
json.dump(tape, open(os.path.join(FIX, 'oracle_rows.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump({'snapshot': json.loads(json.dumps(snapshot, default=str, sort_keys=True)), 'trace': list(session.trace),
           'calls': session.calls, 'invoice_candidates': inv_cands, 'receipt_candidates': rcv_cands,
           'keys': {'invoice_num': _s(inv_key), 'po_number': _s(po_key), 'supplier_tax_id': _s(sup_key),
                    'customer_tax_id': _s(doc.value_any('customer_tax_id')), 'sub_total': _s(sub)},
           'rejected': session.rejected},
          open(os.path.join(FIX, 'lookup_py.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1, sort_keys=True)
print('written oracle_rows.json (%d queries) + lookup_py.json' % len(tape))
