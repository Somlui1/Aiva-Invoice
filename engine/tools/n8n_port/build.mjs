// build.mjs — concatenate the port modules into a Node-testable bundle (dist/bundle.cjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MODULES = ['src_core.js', 'src_ai.js', 'src_normalize.js', 'src_extract.js', 'src_oracle_sql.js',
  'src_oracle_lookup.js', 'src_invoice_keys.js', 'src_evidence.js', 'src_matching.js', 'src_rules.js', 'src_rules3.js', 'src_evidence_check.js', 'src_assemble.js', 'src_orchestrate.js'];
const EXPORTS = ['D', 'dStr', 'dCmp', 'dAdd', 'dSub', 'dMul', 'dDiv', 'dQuant', 'dNorm', 'dIsPos', 'dToFixed', 'fmtThousand',
  'Std', 'splitNumber', 'money', 'dateIso', 'invoiceNum', 'poAndRelease', 'taxId', 'taxIdLoose', 'poTokens',
  'normalizeOne', 'normalizeDocument', 'normName', 'addrKey', 'buildExtraction', 'buildVariants', 'safeInvoice',
  'renderSql', 'bindLiteral', 'ensureReadOnly', 'invoiceVariants', 'OracleInputRejected', 'OracleTechnicalError',
  'RCV_V01', 'RCV_V02', 'PO_SUPPLIER_TAX', 'RCV_BY_NUM', 'PO_LIST', 'taxInvSql', 'taxInvSuffixSql', 'invByPoVendorSql',
  'mcpTextOf', 'parseCsvRowsText', 'rowFrom', 'rowPayload', 'OracleSession', 'McpOracleRepository', 'validSupplierTax', 'lookupMode',
  'documentCandidates', 'receiptNumCandidates', 'narrowPoList', 'canonicalJson', 'canonicalJsonAscii', 'aiRequestKey', 'AiServiceError', 'AiClient', 'buildAiServices', 'extractJsonObject', 'salvageJsonObject', 'collapseGhostRows', 'collapseRepeatedCopies', 'corroborateArithmetic', 'corroborateOracle', 'corroborateLines', 'stripTimes', 'sha256hex',
  'normKey', 'stdFromJson', 'validate', 'runInFlow', 'recommend', 'assemble', 'STEP1', 'ALL_RULE_IDS', 'PortPending', 'evidenceReport', 'normalizeDocument', 'resolve', 'priceCheck', 'v08BuildPayload', 'v08Decide', 'v08ValidateUnitPriceGroups', 'STEP3', 'corroborateLines', 'buildSummary', 'num'];

const parts = MODULES.filter(f => fs.existsSync(path.join(ROOT, f))).map(f => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]);
const bundle = parts.map(([f, s]) => `\n// ==================== ${f} ====================\n${s}`).join('\n');
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'bundle.cjs'), bundle + '\nmodule.exports = { ' + EXPORTS.join(', ') + ' };\n');
console.log('dist/bundle.cjs: ' + parts.map(p => p[0]).join(' + ') + ' = ' + bundle.length + ' bytes');
