/**
 * v5.8 — Dynamic document search ("ค้นหาอะไรก็เจอ").
 *
 * One box, used by the queue (browser) and `GET /api/documents?q=` (server) — same rules on both.
 *
 * Free text: every word must match somewhere in the document (AND). A word matches when it is found
 * in the document's search text, which covers:
 *   เลขเอกสาร (DMS-…) · Invoice · ผู้ขาย · Tax ID · ชื่อใน Oracle · PO / Release · ใบรับ · Receiver ·
 *   บริษัท (code + name) · ORG_ID · สถานะ (EN + ไทย) · ผู้รับผิดชอบ · รหัสข้อยกเว้น (E11) · กฎ (V-07) ·
 *   ยอดเงิน (190995 / 190,995 / 190,995.00) · วันที่ (ใบแจ้งหนี้ / เข้าระบบ / สร้าง) · รายการสินค้า
 *
 * Dates typed in any common form are understood, and match any of the document's dates:
 *   2026-10-26 · 26/10/2026 · 26-10-2026 · 26.10.26 · 26/10/69 (พ.ศ.) · 2569-10-26 · 2026-10 · 10/2026 ·
 *   ต.ค. 2026 · ตุลาคม 69 · oct 2026 · 26 ต.ค. 2569
 *
 * Optional field filters (power users; plain words work without them):
 *   status:hold · st:review · code:E11 · rule:V-07 · co:AHT · vendor:crv · po:4205 · inv:IV26 · rcv:5022 ·
 *   date:2026-10 · date:2026-10-01..2026-10-15 · inv-date:… · created:… · amt:>100000 · amt:5000..9000
 *   "quoted phrase" keeps words together · a leading - excludes: -auto-pass
 *
 * Robustness: never throws (bad input = no filter for that word), accent/case/width-insensitive,
 * commas/spaces inside numbers ignored, the search text is cached per document object.
 */
import type { InvoiceDoc } from '../types/invoice'

// ---------------------------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------------------------

/** Thai / alternative words per status (all lower-case, searched as part of the document text). */
export const STATUS_WORDS: Readonly<Record<string, string>> = Object.freeze({
  'Auto-pass': 'auto-pass autopass auto pass ผ่านอัตโนมัติ ผ่าน',
  Review: 'review รอตรวจ ตรวจสอบ ต้องตรวจ',
  Hold: 'hold พักไว้ ระงับ',
  'Manual Review': 'manual review manual-review manual ตรวจด้วยคน',
  Confirmed: 'confirmed confirm ยืนยันแล้ว อนุมัติแล้ว',
  Sent: 'sent ส่งแล้ว ส่งเข้า ap',
  Posted: 'posted post ลงบัญชีแล้ว ปิดแล้ว',
  Rejected: 'rejected reject ปฏิเสธ ตีกลับ ปิดแล้ว',
  Superseded: 'superseded ถูกแทนที่',
  Duplicate: 'duplicate dup ซ้ำ',
  'Import Failed': 'import failed import-failed นำเข้าไม่สำเร็จ',
})

const TH_MONTHS: Array<[number, string[]]> = [
  [1, ['มกราคม', 'ม.ค.', 'มค', 'jan', 'january']],
  [2, ['กุมภาพันธ์', 'ก.พ.', 'กพ', 'feb', 'february']],
  [3, ['มีนาคม', 'มี.ค.', 'มีค', 'mar', 'march']],
  [4, ['เมษายน', 'เม.ย.', 'เมย', 'apr', 'april']],
  [5, ['พฤษภาคม', 'พ.ค.', 'พค', 'may']],
  [6, ['มิถุนายน', 'มิ.ย.', 'มิย', 'jun', 'june']],
  [7, ['กรกฎาคม', 'ก.ค.', 'กค', 'jul', 'july']],
  [8, ['สิงหาคม', 'ส.ค.', 'สค', 'aug', 'august']],
  [9, ['กันยายน', 'ก.ย.', 'กย', 'sep', 'sept', 'september']],
  [10, ['ตุลาคม', 'ต.ค.', 'ตค', 'oct', 'october']],
  [11, ['พฤศจิกายน', 'พ.ย.', 'พย', 'nov', 'november']],
  [12, ['ธันวาคม', 'ธ.ค.', 'ธค', 'dec', 'december']],
]
const MONTH_OF = new Map<string, number>()
for (const [m, names] of TH_MONTHS) for (const n of names) MONTH_OF.set(n, m)

// ---------------------------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------------------------

/** Lower-case, NFKC (full-width → ascii), collapse whitespace. */
export function norm(s: unknown): string {
  return String(s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Letters/digits only — so `iv-2026/09002`, `IV2026 09002` and `iv202609002` meet. */
const compact = (s: string) => s.replace(/[\s\-_/.,:#()[\]]+/g, '')

const pad2 = (n: number) => String(n).padStart(2, '0')
const isValidYmd = (y: number, m: number, d: number) => {
  if (!(y >= 1900 && y <= 2200 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return false
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}
/** Two/four-digit year, Buddhist era accepted (2569 → 2026, 69 → 2026). */
function fullYear(raw: string): number | null {
  const n = Number(raw)
  if (!Number.isInteger(n)) return null
  if (raw.length === 2) {
    // 2-digit: ≥ 50 reads as พ.ศ. 25xx (69 → 2569 → 2026); < 50 as ค.ศ. 20xx (26 → 2026)
    return n >= 50 ? 2500 + n - 543 : 2000 + n
  }
  if (raw.length === 4) return n > 2400 ? n - 543 : n
  return null
}

/** A typed date → ISO prefix (`2026-10-26` or `2026-10` or `2026`), or null if it is not a date. */
export function parseDateToken(raw: string): string | null {
  const t = norm(raw)
  if (!t) return null
  let m: RegExpMatchArray | null

  // yyyy-mm-dd / yyyy/mm/dd (ค.ศ. or พ.ศ.)
  if ((m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/))) {
    const y = fullYear(m[1]), mo = +m[2], d = +m[3]
    return y && isValidYmd(y, mo, d) ? `${y}-${pad2(mo)}-${pad2(d)}` : null
  }
  // dd/mm/yyyy · dd-mm-yy · dd.mm.yyyy (Thai order: day first)
  if ((m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/))) {
    const y = fullYear(m[3]), d = +m[1], mo = +m[2]
    return y && isValidYmd(y, mo, d) ? `${y}-${pad2(mo)}-${pad2(d)}` : null
  }
  // yyyy-mm
  if ((m = t.match(/^(\d{4})[-/.](\d{1,2})$/))) {
    const y = fullYear(m[1]), mo = +m[2]
    return y && y >= 1900 && mo >= 1 && mo <= 12 ? `${y}-${pad2(mo)}` : null
  }
  // mm/yyyy
  if ((m = t.match(/^(\d{1,2})[-/.](\d{4})$/))) {
    const y = fullYear(m[2]), mo = +m[1]
    return y && y >= 1900 && mo >= 1 && mo <= 12 ? `${y}-${pad2(mo)}` : null
  }
  // 26 ต.ค. 2569 · ต.ค. 2026 · october 69 · oct (no year = any year → handled by caller)
  if ((m = t.match(/^(?:(\d{1,2})\s*)?([a-z.\u0E00-\u0E7F]+)\s*(\d{2}|\d{4})$/))) {
    const mo = MONTH_OF.get(m[2]) ?? MONTH_OF.get(m[2].replace(/\./g, ''))
    const y = fullYear(m[3])
    if (!mo || !y) return null
    if (m[1]) return isValidYmd(y, mo, +m[1]) ? `${y}-${pad2(mo)}-${pad2(+m[1])}` : null
    return `${y}-${pad2(mo)}`
  }
  return null
}

/** "ต.ค." alone → month number (matches that month in any year). */
function monthOnly(raw: string): number | null {
  const t = norm(raw)
  return MONTH_OF.get(t) ?? MONTH_OF.get(t.replace(/\./g, '')) ?? null
}

/** A typed amount → number (commas, ฿, "บาท" ignored). Null when it is not purely numeric. */
export function parseAmount(raw: string): number | null {
  const t = norm(raw).replace(/[,฿\s]|บาท|thb/g, '')
  if (!/^\d+(\.\d+)?$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

// ---------------------------------------------------------------------------------------------
// Per-document search index (cached)
// ---------------------------------------------------------------------------------------------

interface DocIndex {
  text: string
  compactText: string
  dates: string[]
  amounts: number[]
  status: string
}

const cache = new WeakMap<InvoiceDoc, DocIndex>()

const isoDay = (s?: string | null) => {
  const d = String(s ?? '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''
}

function dateForms(iso: string): string[] {
  const [y, m, d] = iso.split('-')
  const be = String(+y + 543)
  return [iso, `${d}/${m}/${y}`, `${d}/${m}/${be}`, `${+d}/${+m}/${y}`, `${d}-${m}-${y}`, `${d}.${m}.${y}`]
}

const money = (n?: number | null) =>
  typeof n === 'number' && Number.isFinite(n)
    ? [String(n), n.toFixed(2), n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })]
    : []

export function indexOf(d: InvoiceDoc): DocIndex {
  const hit = cache.get(d)
  if (hit) return hit

  const dates = [isoDay(d.dt), isoDay(d.up), isoDay(d.created)].filter(Boolean)
  const amounts = [d.total, d.sub, d.vat, d.rtotal].filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
  const ruleBits = (d.rules || []).flatMap(r => [r.rule, (r as any).exception_code, (r as any).id]).filter(Boolean)
  const lineBits = (d.lines || []).flatMap(l => [(l as any).desc, (l as any).item, (l as any).description]).filter(Boolean)

  const parts: unknown[] = [
    d.doc, d.inv, d.vendor, d.stax, d.oname, d.po, d.release, d.rcv, d.receiver, d.company, d.org,
    d.status, STATUS_WORDS[d.status] ?? '',
    d.assigned === 'eu' ? 'ผู้ใช้งาน end user eu รอผู้ใช้งาน' : 'ฝ่ายบัญชี accounting acc',
    d.unres ? 'ไม่ทราบเจ้าของ ไม่มี receiver unresolved' : '',
    d.receiver && d.receiverActive === false ? 'รอผูกบัญชี ยังไม่เชื่อมบัญชี bind' : '',
    d.identityStatus, d.duplicate_of, d.supersededBy, d.supersedes, d.batch, d.apId,
    ...d.codes, ...ruleBits, ...lineBits,
    ...dates.flatMap(dateForms),
    ...amounts.flatMap(money),
  ]
  const text = norm(parts.filter(p => p !== undefined && p !== null && p !== '').join(' \u0001 '))
  const idx: DocIndex = { text, compactText: compact(text), dates, amounts, status: norm(d.status) }
  cache.set(d, idx)
  return idx
}

// ---------------------------------------------------------------------------------------------
// Query parsing
// ---------------------------------------------------------------------------------------------

export type SearchField =
  | 'any' | 'status' | 'code' | 'rule' | 'co' | 'vendor' | 'po' | 'inv' | 'rcv' | 'doc'
  | 'date' | 'inv-date' | 'created' | 'updated' | 'amt'

const FIELD_ALIAS: Record<string, SearchField> = {
  status: 'status', st: 'status', สถานะ: 'status',
  code: 'code', e: 'code', รหัส: 'code',
  rule: 'rule', กฎ: 'rule',
  co: 'co', company: 'co', บริษัท: 'co',
  vendor: 'vendor', supplier: 'vendor', ผู้ขาย: 'vendor',
  po: 'po',
  inv: 'inv', invoice: 'inv',
  rcv: 'rcv', receipt: 'rcv', receiver: 'rcv', ใบรับ: 'rcv',
  doc: 'doc', dms: 'doc',
  date: 'date', วันที่: 'date',
  'inv-date': 'inv-date', invdate: 'inv-date',
  created: 'created', สร้าง: 'created',
  updated: 'updated', up: 'updated', เข้าระบบ: 'updated',
  amt: 'amt', amount: 'amt', total: 'amt', ยอด: 'amt',
}

export interface SearchTerm {
  field: SearchField
  value: string
  negate: boolean
}

/** Split on spaces, keep "quoted phrases", read `field:value` and a leading `-`. Never throws. */
export function parseQuery(raw: string): SearchTerm[] {
  const q = norm(raw).slice(0, 300)
  if (!q) return []
  const out: SearchTerm[] = []
  const re = /(-?)(?:([\p{L}\p{N}-]+):)?(?:"([^"]*)"|(\S+))/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(q))) {
    const negate = m[1] === '-'
    const key = m[2] ? FIELD_ALIAS[m[2]] : undefined
    // `abc:def` with an unknown key is plain text (e.g. a time "10:30" or a URL)
    let value = (m[3] ?? m[4] ?? '').trim()
    if (m[2] && !key) value = `${m[2]}:${value}`
    if (!value) continue
    out.push({ field: key ?? 'any', value, negate })
  }
  // Join date words the user typed with spaces ("26 ต.ค. 2569", "ต.ค. 2026") into one term.
  return mergeDateWords(out)
}

function mergeDateWords(terms: SearchTerm[]): SearchTerm[] {
  const out: SearchTerm[] = []
  let i = 0
  while (i < terms.length) {
    let merged = false
    for (const span of [3, 2]) {
      const group = terms.slice(i, i + span)
      if (group.length !== span || !group.every(g => g.field === 'any' && !g.negate)) continue
      const joined = group.map(g => g.value).join(' ')
      if (parseDateToken(joined)) {
        out.push({ field: 'date', value: joined, negate: false })
        i += span
        merged = true
        break
      }
    }
    if (!merged) {
      out.push(terms[i])
      i += 1
    }
  }
  return out
}

// ---------------------------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------------------------

function dateRange(value: string): [string, string] | null {
  const parts = value.split('..')
  if (parts.length === 2) {
    const a = parts[0] ? parseDateToken(parts[0]) : '0000'
    const b = parts[1] ? parseDateToken(parts[1]) : '9999'
    if (!a || !b) return null
    const lo = a, hi = b + '\uffff'
    return lo <= hi ? [lo, hi] : [b, a + '\uffff']
  }
  const one = parseDateToken(value)
  return one ? [one, one + '\uffff'] : null
}

const inRange = (iso: string, r: [string, string]) => iso >= r[0] && iso <= r[1]

function amountTest(value: string): ((n: number) => boolean) | null {
  const v = value.replace(/\s/g, '')
  let m: RegExpMatchArray | null
  if ((m = v.match(/^(>=|<=|>|<|=)?(.+)$/)) && !v.includes('..')) {
    const n = parseAmount(m[2])
    if (n === null) return null
    switch (m[1]) {
      case '>': return x => x > n
      case '<': return x => x < n
      case '>=': return x => x >= n
      case '<=': return x => x <= n
      default: return x => Math.abs(x - n) < 0.005
    }
  }
  const [a, b] = v.split('..')
  const lo = a ? parseAmount(a) : -Infinity
  const hi = b ? parseAmount(b) : Infinity
  if (lo === null || hi === null) return null
  return x => x >= Math.min(lo, hi) && x <= Math.max(lo, hi)
}

const has = (hay: string, needle: string) => !!needle && hay.includes(needle)

function matchAny(d: InvoiceDoc, ix: DocIndex, value: string): boolean {
  const v = norm(value)
  if (has(ix.text, v)) return true
  const c = compact(v)
  if (c.length >= 3 && has(ix.compactText, c)) return true
  // A date in any form → compare against the document's dates
  const iso = parseDateToken(v)
  if (iso && ix.dates.some(x => x.startsWith(iso))) return true
  const mo = monthOnly(v)
  if (mo && ix.dates.some(x => +x.slice(5, 7) === mo)) return true
  // An amount typed with/without commas
  const n = parseAmount(v)
  if (n !== null && /[.,]/.test(v) && ix.amounts.some(x => Math.abs(x - n) < 0.005)) return true
  return false
}

function matchTerm(d: InvoiceDoc, ix: DocIndex, t: SearchTerm): boolean {
  const v = norm(t.value)
  switch (t.field) {
    case 'any':
      return matchAny(d, ix, v)
    case 'status': {
      const words = norm(`${d.status} ${STATUS_WORDS[d.status] ?? ''}`)
      return words.includes(v) || compact(words).includes(compact(v))
    }
    case 'code':
      return d.codes.some(c => norm(c).startsWith(v)) || (d.rules || []).some(r => norm((r as any).exception_code).startsWith(v))
    case 'rule':
      return (d.rules || []).some(r => compact(norm(r.rule)).startsWith(compact(v)))
    case 'co':
      // exact: AH ≠ AHT ≠ AHA
      return norm(d.company) === v
    case 'vendor':
      return has(norm(`${d.vendor} ${d.oname ?? ''} ${d.stax}`), v)
    case 'po':
      return has(compact(norm(`${d.po ?? ''} ${d.release ?? ''}`)), compact(v))
    case 'inv':
      return has(compact(norm(d.inv)), compact(v))
    case 'rcv':
      return has(norm(`${d.rcv ?? ''} ${d.receiver ?? ''}`), v)
    case 'doc':
      return has(compact(norm(d.doc)), compact(v))
    case 'amt': {
      const test = amountTest(v)
      return test ? ix.amounts.some(test) : false
    }
    case 'date':
    case 'inv-date':
    case 'created':
    case 'updated': {
      const r = dateRange(v)
      if (!r) {
        const mo = monthOnly(v)
        return mo ? ix.dates.some(x => +x.slice(5, 7) === mo) : false
      }
      const pick =
        t.field === 'inv-date' ? [isoDay(d.dt)] :
        t.field === 'created' ? [isoDay(d.created) || isoDay(d.up)] :
        t.field === 'updated' ? [isoDay(d.up)] :
        ix.dates
      return pick.filter(Boolean).some(x => inRange(x, r))
    }
  }
}

/** True when the document matches every term of the query. Empty query = everything. */
export function smartMatch(d: InvoiceDoc, rawQuery: string): boolean {
  let terms: SearchTerm[]
  try {
    terms = parseQuery(rawQuery)
  } catch {
    return true
  }
  if (!terms.length) return true
  const ix = indexOf(d)
  for (const t of terms) {
    let ok: boolean
    try {
      ok = matchTerm(d, ix, t)
    } catch {
      ok = false
    }
    if (ok === t.negate) return false
  }
  return true
}

/** Short, human description of what the query is doing (shown under the box). */
export function describeQuery(rawQuery: string): string[] {
  const label: Record<SearchField, string> = {
    any: 'คำ', status: 'สถานะ', code: 'รหัส', rule: 'กฎ', co: 'บริษัท', vendor: 'ผู้ขาย', po: 'PO', inv: 'Invoice',
    rcv: 'ใบรับ', doc: 'DMS', date: 'วันที่ใดก็ได้', 'inv-date': 'วันที่ใบแจ้งหนี้', created: 'วันที่สร้าง',
    updated: 'วันที่เข้าระบบ', amt: 'ยอดเงิน',
  }
  return parseQuery(rawQuery).map(t => {
    const v = t.value
    if (t.field === 'any' || t.field === 'date') {
      const iso = parseDateToken(t.value)
      if (iso) return `${t.negate ? 'ไม่ใช่ ' : ''}วันที่ ${iso}`
    }
    return `${t.negate ? 'ไม่ใช่ ' : ''}${label[t.field]}: ${v}`
  })
}
