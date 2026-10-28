// =================================================================================================
// core.js — shared helpers of the n8n in-flow validator (mirror of src/system_a)
// Money/qty are carried as Decimal-as-string ("2265.00") so every node boundary stays plain JSON.
// Mirrors: python Decimal semantics (exact scaled integers), standard.py, normalize.py helpers,
//          sql_guard.py, contracts.py helpers.
// =================================================================================================

// ---------------------------------------------------------------- Decimal (scaled BigInt, exact)
function D(x) {                                   // -> {v:BigInt, s:scale} ; null/undefined/"" -> null
  if (x === null || x === undefined) return null;
  if (typeof x === 'object' && x !== null && x.v !== undefined && x.s !== undefined) return { v: x.v, s: x.s };
  let t = String(x).trim();
  if (t === '') return null;
  if (!/^[+-]?\d*(\.\d*)?$/.test(t) || t === '.' || t === '-' || t === '+') return { nan: true };
  const neg = t[0] === '-';
  if (neg || t[0] === '+') t = t.slice(1);
  const dot = t.indexOf('.');
  let ip = dot < 0 ? t : t.slice(0, dot), fp = dot < 0 ? '' : t.slice(dot + 1);
  return { v: BigInt((neg ? '-' : '') + (ip + fp || '0')), s: fp.length };
}
function dalign(a, b) {                            // same scale
  const s = Math.max(a.s, b.s), k = BigInt(10);
  return [a.v * k ** BigInt(s - a.s), b.v * k ** BigInt(s - b.s), s];
}
function dAdd(a, b) { if (a === null) return b; if (b === null) return a; const [x, y, s] = dalign(a, b); return { v: x + y, s }; }
function dSub(a, b) { if (a === null) return null; if (b === null) return a; const [x, y, s] = dalign(a, b); return { v: x - y, s }; }
function dMul(a, b) { if (a === null || b === null) return null; return { v: a.v * b.v, s: a.s + b.s }; }
function dCmp(a, b) { if (a === null || b === null) return null; const [x, y] = dalign(a, b); return x < y ? -1 : (x > y ? 1 : 0); }
function dAbs(a) { return a === null ? null : { v: a.v < 0n ? -a.v : a.v, s: a.s }; }
function dNeg(a) { return a === null ? null : { v: -a.v, s: a.s }; }
function dIsPos(a) { return a !== null && a.v > 0n; }
function dIsZero(a) { return a !== null && a.v === 0n; }
function dQuant(a, decimals) {                     // ROUND_HALF_EVEN to 10^-decimals (python quantize default)
  if (a === null) return null;
  if (a.s <= decimals) return { v: a.v * BigInt(10) ** BigInt(decimals - a.s), s: decimals };
  const k = BigInt(10) ** BigInt(a.s - decimals);
  const q = a.v / k, r = a.v % k, an = a.v < 0n ? -a.v : a.v, ar = r < 0n ? -r : r;
  let nq = q;
  if (ar * 2n > k) nq = a.v < 0n ? q - 1n : q + 1n;
  else if (ar * 2n === k) { if (q % 2n !== 0n) nq = (an / k) % 2n === 0n ? q : (a.v < 0n ? q - 1n : q + 1n); }
  return { v: nq, s: decimals };
}
// python (a / b).quantize(10^-dec) with ROUND_HALF_EVEN.  a = a.v / 10^a.s, b = b.v / 10^b.s, so
//   a / b = (a.v * 10^b.s) / (b.v * 10^a.s)
// and both powers of ten have to be there.  The first port divided a.v * 10^(dec + b.s) by b.v only,
// which is right solely when the dividend has no decimals - it turned 75000.00 / 250000.00 into 30.000
// instead of 0.300 (DMS-116), and the same wrong quotient fed V-07's price tolerance and V-08's fraction.
function dDiv(a, b, dec) {
  if (a === null || b === null || b.v === 0n) return null;
  const dd = dec === null || dec === undefined ? 12 : dec;
  const num = a.v * (10n ** BigInt(b.s));
  const den = b.v * (10n ** BigInt(a.s));
  const neg = (num < 0n) !== (den < 0n);
  const n = (num < 0n ? -num : num) * (10n ** BigInt(dd));
  const d = den < 0n ? -den : den;
  let q = n / d;
  const r = n % d, twice = r * 2n;
  if (twice > d || (twice === d && q % 2n !== 0n)) q += 1n;      // HALF_EVEN on the magnitude
  return { v: neg ? -q : q, s: dd };
}
function dStr(a) {                                 // python str(Decimal)
  if (a === null) return null;
  let t = (a.v < 0n ? '-' : '') + (a.v < 0n ? (-a.v) : a.v).toString();
  if (a.s === 0) return t;
  const neg = t[0] === '-'; if (neg) t = t.slice(1);
  while (t.length <= a.s) t = '0' + t;
  t = t.slice(0, t.length - a.s) + '.' + t.slice(t.length - a.s);
  return (neg ? '-' : '') + t;
}
function dNorm(a) {                                // python Decimal.normalize() -> str
  if (a === null) return null;
  let v = a.v, s = a.s;
  while (s > 0 && v % 10n === 0n) { v = v / 10n; s--; }
  if (s === 0) return (v < 0n ? '-' : '') + (v < 0n ? -v : v).toString();
  let t = (v < 0n ? '-' : '') + (v < 0n ? -v : v).toString();
  const neg = t[0] === '-'; if (neg) t = t.slice(1);
  while (t.length <= s) t = '0' + t;
  return (neg ? '-' : '') + t.slice(0, t.length - s) + '.' + t.slice(t.length - s);
}
function dNum(a) { return a === null ? null : Number(dStr(a)); }
const D0 = D(0), Q2 = 2;
const dS = (x) => dStr(D(x));                      // anything -> Decimal string
function dToFixed(a, dp) { return dStr(dQuant(D(a), dp)); }
function fmtThousand(a) {                          // python f"{x:,}" for the few messages that use it
  const s = dStr(a); if (s === null) return 'null';
  const neg = s[0] === '-'; let t = neg ? s.slice(1) : s;
  const dot = t.indexOf('.');
  let ip = dot < 0 ? t : t.slice(0, dot), fp = dot < 0 ? '' : t.slice(dot);
  ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + ip + fp;
}

// ---------------------------------------------------------------- Standard (config/standards/v6.6)
function Std(raw) {
  const policy = raw.policy, codes = raw.codes.codes, rules = raw.rules.rules;
  return {
    version: raw.codes.standard_version, ruleset: raw.rules.ruleset_version,
    policy, codes, rules, entities: raw.buyer_entity.entities, uom_groups: raw.uom_groups,
    // The decision-layer prompts ride in standard.json (a Code node has no filesystem).  dump_standard.py
    // writes them straight out of config/prompts, so a tape replay proves the model is asked the same thing.
    prompts: raw.prompts || {},
    tol(k) { return D(String(policy.tolerance[k])); },
    ruleVersion(id) { return String(rules[id].version); },
    codeName(code) { return codes[code].name; },
    severity(code) { return codes[code].severity; },
    threshold(name) {
      for (const grp of Object.values(policy.confidence)) {
        if ((grp.fields || []).indexOf(name) >= 0) return [Number(grp.min), !!grp.require_agreement];
      }
      return [0.70, false];
    },
    uomGroup(u) {                                   // standard.py::uom_group
      if (u === null || u === undefined) return null;
      const x = String(u).trim().toUpperCase().replace(/ /g, '');
      const fx = foldTone(x);
      for (const [g, members] of Object.entries(this.uom_groups)) {
        const up = members.map(m => String(m).toUpperCase());
        const upDot = members.map(m => String(m).toUpperCase().replace(/\.+$/, ''));
        if (up.indexOf(x) >= 0 || upDot.indexOf(x.replace(/\.+$/, '')) >= 0) return g;
        if (fx && fx !== '') {
          let hit = false;
          for (const m of members) { if (foldTone(String(m).toUpperCase()) === fx) { hit = true; break; } }
          if (hit) return g;
        }
      }
      return (x.replace(/\.+$/, '')) || null;
    }
  };
}
const TONE = /[\u0E47-\u0E4C]/g;
function foldTone(s) { return String(s || '').normalize('NFC').replace(TONE, '').replace(/\.+$/, ''); }

// ---------------------------------------------------------------- small shared text helpers
const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';
function thaiToArabic(s) {
  let o = ''; const t = String(s === null || s === undefined ? '' : s);
  for (const c of t) { const i = THAI_DIGITS.indexOf(c); o += i >= 0 ? String(i) : c; }
  return o;
}
const shaCache = {};
function pySorted(obj) { return obj; }             // canonicalisation happens in canonicalJson()

// python json.dumps(..., sort_keys=True, ensure_ascii=False) byte-compatible encoder
function pyEsc(s, ascii) {
  let o = '';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (ch === '"') o += '\\"';
    else if (ch === '\\') o += '\\\\';
    else if (ch === '\n') o += '\\n';
    else if (ch === '\r') o += '\\r';
    else if (ch === '\t') o += '\\t';
    else if (ch === '\b') o += '\\b';
    else if (ch === '\f') o += '\\f';
    else if (c < 0x20) o += '\\u' + c.toString(16).padStart(4, '0');
    else if (ascii && c > 0x7f) {
      // json.dumps default ensure_ascii=True: every non-ASCII code point becomes \uXXXX, and a code point
      // above the BMP is written as its UTF-16 surrogate pair - which is what python's encoder emits.
      if (c <= 0xFFFF) o += '\\u' + c.toString(16).padStart(4, '0');
      else {
        const v = c - 0x10000;
        o += '\\u' + (0xD800 + (v >> 10)).toString(16).padStart(4, '0');
        o += '\\u' + (0xDC00 + (v & 0x3FF)).toString(16).padStart(4, '0');
      }
    } else o += ch;
  }
  return o;
}
const PY_FLOAT_KEYS = ['confidence', 'skew', 'total', 'uncertainty', 'width_pt', 'height_pt',
  'type_confidence', 'ocr_quality'];                 // float-typed in contracts.py / perception/orientation.py
function pyFloat(k, v) {                             // python json.dumps of a float: 1 -> "1.0"
  if (PY_FLOAT_KEYS.indexOf(k) < 0 || !Number.isInteger(v)) return null;
  return (Object.is(v, -0) ? '-0' : String(v)) + '.0';
}
const PY_FLOAT_LIST_KEYS = ['bbox', 'rbox'];       // BBox/rbox are tuple[float,...]: Pydantic coerces every echo to float
class PyInts extends Array { }                      // exception: literals the engine itself writes as ints
function pyInts(...a) { const x = new PyInts(); for (const v of a) x.push(v); return x; }
function pyFloatList(k, arr) {
  if (PY_FLOAT_LIST_KEYS.indexOf(k) < 0 || arr instanceof PyInts) return null;
  return '[' + arr.map(v => (typeof v === 'number' ? (Number.isInteger(v) ? String(v) + '.0' : JSON.stringify(v)) : canonicalJson(v))).join(', ') + ']';
}
function canonicalJson(o, ascii) {                 // json.dumps(sort_keys=True, ensure_ascii=False)
  if (o === null) return 'null';
  const t = typeof o;
  if (t === 'number') return Number.isInteger(o) ? String(o) : JSON.stringify(o);
  if (t === 'boolean') return o ? 'true' : 'false';
  if (t === 'string') return '"' + pyEsc(o, ascii) + '"';
  if (Array.isArray(o)) return '[' + o.map(x => canonicalJson(x === undefined ? null : x, ascii)).join(', ') + ']';
  if (t === 'object') {
    const keys = Object.keys(o).filter(k => o[k] !== undefined).sort();
    return '{' + keys.map(k => {
      const v = o[k];
      let s = Array.isArray(v) ? pyFloatList(k, v) : null;
      if (s === null) s = (typeof v === 'number') ? pyFloat(k, v) : null;
      return '"' + pyEsc(k, ascii) + '": ' + (s === null ? canonicalJson(v, ascii) : s);
    }).join(', ') + '}';
  }
  return 'null';
}
// OracleSnapshot.fingerprint() hashes with json.dumps(default=str, sort_keys=True) - and python's default
// is ensure_ascii=True, so a non-breaking space in an item description is written \u00a0 there and would
// not be by canonicalJson.  Different escaping, different sha, different payload_sha256.
function canonicalJsonAscii(o) { return canonicalJson(o, true); }
function stripTimes(o) {                            // assembler._strip_times
  if (Array.isArray(o)) return o.map(stripTimes);
  if (o && typeof o === 'object') {
    const out = {};
    for (const k of Object.keys(o)) if (k !== 'evaluated_at' && k !== 'queried_at') out[k] = stripTimes(o[k]);
    return out;
  }
  return o;
}
function sha256hex(text) {                          // only used by the local Node harness
  if (shaCache[text] !== undefined) return shaCache[text];
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const bytes = new TextEncoder().encode(text);
  const l = bytes.length, withOne = l + 1, pad = (56 - (withOne % 64) + 64) % 64, total = withOne + pad + 8;
  const m = new Uint8Array(total); m.set(bytes); m[l] = 0x80;
  const bits = BigInt(l) * 8n;
  for (let i = 0; i < 8; i++) m[total - 1 - i] = Number((bits >> BigInt(8 * i)) & 0xffn);
  let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Int32Array(64);
  const rotr = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = ((m[off + 4 * i] << 24) | (m[off + 4 * i + 1] << 16) | (m[off + 4 * i + 2] << 8) | m[off + 4 * i + 3]) | 0;
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H = [H[0] + a | 0, H[1] + b | 0, H[2] + c | 0, H[3] + d | 0, H[4] + e | 0, H[5] + f | 0, H[6] + g | 0, H[7] + h | 0];
  }
  const hex = H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  shaCache[text] = hex; return hex;
}

// ---------------------------------------------------------------- sql_guard.py
const WHITELIST = {
  po_number: /^[0-9]{8}$/,
  invoice_num: /^[A-Za-z0-9/\-_.]{1,40}$/,
  tax_id: /^[0-9]{13}$/,
  receipt_num: /^[0-9]{6,15}$/
};
const FORBIDDEN = /\b(INSERT|UPDATE|DELETE|MERGE|UPSERT|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|COMMIT|ROLLBACK|CALL|EXECUTE|BEGIN|DECLARE|LOCK|EXPLAIN|PLAN|RENAME|COMMENT|SAVEPOINT)\b/i;
const NAMED_PARAM = /:([a-z_][a-z0-9_]*)/gi;
const INVOICE_VARIANT_LIMIT = 6;

class OracleInputRejected extends Error { }
class OracleTechnicalError extends Error { }

function invoiceVariants(raw) {                     // sql_guard.invoice_variants
  const s = String(raw === null || raw === undefined ? '' : raw).trim();
  const out = [];
  for (const cand of [s, s.toUpperCase(), s.replace(/ /g, ''), s.replace(/\//g, ''),
    s.toUpperCase().replace(/ /g, '').replace(/\//g, ''), s.toUpperCase().replace(/\//g, '')]) {
    const c = cand.trim();
    if (out.length >= INVOICE_VARIANT_LIMIT) break;
    if (c && out.indexOf(c) < 0 && WHITELIST.invoice_num.test(c)) out.push(c);
  }
  return out;
}
function stripSqlComments(sql) { return String(sql).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' '); }
function ensureReadOnly(sql) {
  const body = stripSqlComments(sql).trim().replace(/;+$/, '').trim();
  if (!body) throw new OracleTechnicalError('EMPTY_SQL');
  if (/;\s*\S/.test(body)) throw new OracleTechnicalError('SQL_NOT_READ_ONLY: multiple statements');
  const head = body.split(/\s+/)[0].toUpperCase();
  if (head !== 'SELECT' && head !== 'WITH') throw new OracleTechnicalError('SQL_NOT_READ_ONLY: ' + head);
  if (FORBIDDEN.test(body)) throw new OracleTechnicalError('SQL_NOT_READ_ONLY: forbidden keyword');
  if (/\bFOR\s+UPDATE\b/i.test(body)) throw new OracleTechnicalError('SQL_NOT_READ_ONLY: FOR UPDATE');
  return body;
}
function bindLiteral(raw, kind) {
  if (!WHITELIST[kind]) throw new OracleInputRejected('UNKNOWN_BIND_KIND:' + kind);
  const s = String(raw === null || raw === undefined ? '' : raw).trim();
  if (!WHITELIST[kind].test(s)) throw new OracleInputRejected('INPUT_REJECTED:' + kind);
  return "'" + s.replace(/'/g, "''") + "'";
}
function renderInList(values, kind) {
  const lits = [];
  for (const v of values || []) {
    const s = String(v === null || v === undefined ? '' : v).trim();
    if (s && WHITELIST[kind].test(s)) lits.push("'" + s.replace(/'/g, "''") + "'");
  }
  return lits.length ? lits.join(', ') : 'NULL';
}
function renderSql(template, values) {              // values: {name: [kind, value]}
  let out = template.replace(NAMED_PARAM, (m, name) => {
    const kv = values[name];
    if (!kv) throw new OracleTechnicalError('MISSING_BIND:' + name);
    const kind = kv[0], val = kv[1];
    if (kind === 'invoice_in') return renderInList((val || []).map(String), 'invoice_num');
    if (kind === 'tax_in') return renderInList((val || []).map(String), 'tax_id');
    if (kind === 'po_in') return renderInList((val || []).map(String), 'po_number');
    return bindLiteral(val, String(kind));
  });
  NAMED_PARAM.lastIndex = 0;
  if (NAMED_PARAM.test(out)) throw new OracleTechnicalError('UNBOUND_PLACEHOLDER');
  return out;
}
function checkKeys(obj) { for (const [kind, value] of Object.entries(obj)) bindLiteral(value, kind); }

// ---------------------------------------------------------------- invoice_variants.py
const SAFE_INVOICE = /^[A-Z0-9/\-_.]{1,40}$/;
const VARIANT_LIMIT = 6;
function safeInvoice(v) { return SAFE_INVOICE.test(String(v === null || v === undefined ? '' : v).trim()); }
function tsStripChar(v, spec) { const ch = String(spec.char || ''); return ch ? v.split(ch).join('') : null; }
function tsInsertAfterPrefix(v, spec) {
  const p = String(spec.prefix || ''), ins = String(spec.insert || '');
  if (!p || !ins || v.indexOf(p) !== 0 || v.length <= p.length) return null;
  const rest = v.slice(p.length);
  return rest.indexOf(ins) === 0 ? null : p + ins + rest;
}
function tsRemoveAfterPrefix(v, spec) {
  const p = String(spec.prefix || ''), rem = String(spec.remove || '');
  if (!p || !rem || v.slice(0, p.length + rem.length) !== p + rem) return null;
  return p + v.slice(p.length + rem.length);
}
const TRANSFORMS = { strip_char: tsStripChar, insert_after_prefix: tsInsertAfterPrefix, remove_after_prefix: tsRemoveAfterPrefix };
function buildVariants(raw, specs, limit) {
  const lim = limit || VARIANT_LIMIT;
  const s = String(raw === null || raw === undefined ? '' : raw).trim();
  if (!s) return [];
  const out = [];
  const add = (cand) => { const c = String(cand === null || cand === undefined ? '' : cand).trim(); if (c && out.indexOf(c) < 0 && SAFE_INVOICE.test(c)) out.push(c); };
  add(s);
  for (const spec of specs || []) {
    const fn = TRANSFORMS[String((spec || {}).type || '')];
    if (!fn) continue;
    add(fn(s, spec));
    if (out.length >= lim) break;
  }
  return out.slice(0, lim);
}

// ---------------------------------------------------------------- misc
function normAlnum(s) { return String(s === null || s === undefined ? '' : s).toUpperCase().replace(/[^\p{L}\p{N}]/gu, ''); }
function normNoSpace(s) { return String(s === null || s === undefined ? '' : s).split(/\s+/).join('').toUpperCase(); }
function uniq(list) { const o = []; for (const x of list) if (o.indexOf(x) < 0) o.push(x); return o; }
function firstN(a, n) { return (a || []).slice(0, n); }
function sortedNum(a) { return (a || []).slice().sort((x, y) => x - y); }
function pyStr(s) {                                    // python f"{x}" for None/True inside messages
  if (s === null || s === undefined) return 'None';
  if (s === true) return 'True';
  if (s === false) return 'False';
  return typeof s === 'object' ? String(s) : String(s);
}
function sortedStr(a) { return (a || []).slice().sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)); }
function maxOf(a) { return (a || []).reduce((m, x) => (m === null || x > m ? x : m), null); }
function sevRank(s) { return s === 'High' ? 3 : (s === 'Medium' ? 2 : (s === 'Low' ? 1 : 0)); }
function maxSev(list) { let m = ''; for (const s of list) if (sevRank(s) > sevRank(m)) m = s; return m || 'Low'; }

function stdFromJson(raw) { return Std(raw); }     // standard.json (dump of config/standards/v6.6)
