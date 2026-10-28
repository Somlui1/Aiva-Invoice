"""Capture the real Oracle answers for THIS document so both sides of the port replay the same rows.

  python harness/capture_oracle.py        -> fixtures/oracle_rows.json  {"TAX-INV": "<csv>", ...}
Uses the real ORDS MCP endpoint with ORACLE_MCP_TOKEN from engine/.env (read-only SELECTs).
"""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))     # .../engine/temp/n8n_port
ENGINE = os.path.dirname(os.path.dirname(ROOT))                        # .../engine
FIX = os.path.join(ROOT, 'fixtures')
sys.path.insert(0, os.path.join(ENGINE, 'src'))

from system_a.domain.standard import load_standard                          # noqa: E402
from system_a.domain.normalize import tax_id                                # noqa: E402
from system_a.adapters.oracle.mcp_repository import McpSqlClient, OracleMcpRepository  # noqa: E402

ENV = os.path.join(ENGINE, '.env')
url = token = None
for line in open(ENV, encoding='utf-8'):
    line = line.strip()
    if line.startswith('ORACLE_MCP_URL='): url = line.split('=', 1)[1].strip().strip('"')
    if line.startswith('ORACLE_MCP_TOKEN='): token = line.split('=', 1)[1].strip().strip('"')
print('endpoint:', url)

std = load_standard()
policy = std.policy['oracle']
PO = '42052615'
INV = 'TLP-IV-69-09-0025'
OCR_TAX = '0105549023741'
tax_id(OCR_TAX)                                                      # never query with an unusable Tax ID

client = McpSqlClient(url, token, timeout_s=90.0)
repo = OracleMcpRepository(client, row_cap=policy['row_cap'],
                           match_columns=policy['lookup']['invoice_match_columns'],
                           row_caps=policy.get('row_caps'))
capt = McpSqlClient.run
rows = {}


def spy(self, sql, *, database='default'):
    text = capt(self, sql, database=database)
    qid = ('PO-SUPPLIER' if 'AS SUPPLIER_TAX_ID' in sql else
           'TAX-INV-SUFFIX' if 'SUBSTR(UPPER(REPLACE(h.SHIPMENT_NUM' in sql else
           'RCV-BY-NUM' if sql.strip().startswith('SELECT ph.ORG_ID') and 'h.RECEIPT_NUM = ' in sql else
           'TAX-INV')
    rows.setdefault(qid, text)
    print('  %-16s rows=%-4s bytes=%d' % (qid, max(0, len(text.splitlines()) - 1), len(text)))
    return text


McpSqlClient.run = spy
tax = repo.supplier_tax_by_po(PO)
print('PO-SUPPLIER tax =', tax)
got = repo.receipts_by_tax_invoice(OCR_TAX, [INV, INV.replace('/', ''), INV.replace('.', '')])
print('TAX-INV rows =', len(got), 'receipts =', sorted({r.receipt_num for r in got}))
json.dump(rows, open(os.path.join(FIX, 'oracle_rows.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('written fixtures/oracle_rows.json:', list(rows))
