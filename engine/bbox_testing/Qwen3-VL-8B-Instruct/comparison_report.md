# Model Comparison Report: Qwen3-VL-8B-Instruct vs Base (bbox_testing)

- **Base Directory**: `C:\Users\wajeepradit.p\git\DMS_Invoice_Auto_mathing\engine\bbox_testing`
- **Target Directory**: `C:\Users\wajeepradit.p\git\DMS_Invoice_Auto_mathing\engine\bbox_testing\Qwen3-VL-8B-Instruct`
- **Compared Documents**: 13

| Doc ID | Base Model (Sec) | Target Model (Sec) | BBoxes (Base / Target) | Selected Pages | Core Fields Match |
|---|---|---|---|---|---|
| DMS-15 | 27.15s | N/A | 30 / - | [1] vs - | 1/5 ⚠️ Diff |
| DMS-19 | 20.19s | N/A | 32 / - | [1] vs - | 0/5 ⚠️ Diff |
| DMS-20 | 32.51s | 264.55s | 32 / 17 | [1] | 5/5  OK |
| DMS-21 | 32.01s | N/A | 35 / - | [1] vs - | 0/5 ⚠️ Diff |
| DMS-24 | 28.51s | N/A | 40 / - | [1, 2] vs - | 0/5 ⚠️ Diff |
| DMS-25 | 33.07s | N/A | 33 / - | [2] vs - | 0/5 ⚠️ Diff |
| DMS-35 | 31.67s | N/A | 32 / - | [1] vs - | 0/5 ⚠️ Diff |
| DMS-37 | 29.06s | 170.16s | 20 / 13 | [1] | 5/5  OK |
| DMS-48 | 25.42s | N/A | 22 / - | [1] vs - | 0/5 ⚠️ Diff |
| DMS-51 | 35.01s | N/A | 41 / - | [1] vs - | 0/5 ⚠️ Diff |
| DMS-52 | 28.62s | N/A | 24 / - | [1] vs - | 0/5 ⚠️ Diff |
| DMS-55 | 29.87s | N/A | 24 / - | [1] vs - | 0/5 ⚠️ Diff |
| DMS-56 | 37.22s | N/A | 20 / - | [1] vs - | 0/5 ⚠️ Diff |

### Detailed Field Differences:

**DMS-15:**
- invoice_num: 'SQ26/071249' vs '-'
- invoice_date: '08/07/2026' vs '-'
- supplier_tax_id: '0135537003456' vs '-'
- grand_total: '472.94' vs '-'
**DMS-19:**
- invoice_num: '0851392' vs '-'
- invoice_date: '01/09/2026' vs '-'
- po_number: '42052696' vs '-'
- supplier_tax_id: '0115538001783' vs '-'
- grand_total: '27,212.24' vs '-'
**DMS-21:**
- invoice_num: 'IV2609043' vs '-'
- invoice_date: '04/09/26' vs '-'
- po_number: '42052690' vs '-'
- supplier_tax_id: '0245557001458' vs '-'
- grand_total: '4174.50' vs '-'
**DMS-24:**
- invoice_num: '9290186640' vs '-'
- invoice_date: '2026/09/02' vs '-'
- po_number: '42052615' vs '-'
- supplier_tax_id: '0105548003860' vs '-'
- grand_total: '19,144.44' vs '-'
**DMS-25:**
- invoice_num: 'TLP-IV-69-09-0006' vs '-'
- invoice_date: '08/09/2026' vs '-'
- po_number: '42052640' vs '-'
- supplier_tax_id: '0205549020741' vs '-'
- grand_total: '156,990.40' vs '-'
**DMS-35:**
- invoice_num: 'SQ26/085013' vs '-'
- invoice_date: '29/08/2026' vs '-'
- po_number: '43026973-591, 43041729-43, 43043027' vs '-'
- supplier_tax_id: '0135537003456' vs '-'
- grand_total: '5,780.14' vs '-'
**DMS-48:**
- invoice_num: 'IV260904/003' vs '-'
- invoice_date: '04/09/26' vs '-'
- po_number: '43043110' vs '-'
- supplier_tax_id: '0205557010449' vs '-'
- grand_total: '8,062.24' vs '-'
**DMS-51:**
- invoice_num: '035/00303' vs '-'
- invoice_date: '08/09/2569' vs '-'
- po_number: '43042462-6' vs '-'
- supplier_tax_id: '0113528000049' vs '-'
- grand_total: '35,297.16' vs '-'
**DMS-52:**
- invoice_num: '4362' vs '-'
- invoice_date: '08/09/2569' vs '-'
- po_number: '4304076' vs '-'
- supplier_tax_id: '0133539003389' vs '-'
- grand_total: '6420.00' vs '-'
**DMS-55:**
- invoice_num: '691319070' vs '-'
- invoice_date: '07/09/2026' vs '-'
- po_number: '43042818-215' vs '-'
- supplier_tax_id: '0107545000179' vs '-'
- grand_total: '4,536.80' vs '-'
**DMS-56:**
- invoice_num: '691319071' vs '-'
- invoice_date: '07/09/2026' vs '-'
- po_number: '43042818-216' vs '-'
- supplier_tax_id: '0107545000179' vs '-'
- grand_total: '16,611.75' vs '-'