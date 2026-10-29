/**
 * v5.13 — English for the whole app (menus + every screen) without rewriting ~900 Thai strings in
 * ~60 components.
 *
 * How: when the language is English, a MutationObserver translates the text React renders —
 * text nodes and the attributes placeholder / title / aria-label — from the dictionaries:
 *   i18n-en.json        UI strings generated from src/ (exact + template patterns)
 *   i18n-en-extra.json  v5.13.1: strings the first pass missed (simulated invoice, company master,
 *                       sign-in page, PDF page labels) + the Engine's fixed finding sentences
 *                       ("ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: …", "บรรทัดที่ 3 (Invoice: …): …")
 *   + Thai month abbreviations inside dates ("01 ต.ค. 2026" → "01 Oct 2026")
 *   + "<known Thai label>: <anything>" → "<English label>: <anything>" (Engine messages)
 *
 * What stays Thai (by design): data — vendor names, receivers, reasons already saved, free-text
 * reasoning from the Engine's AI, item descriptions. Only an EXACT dictionary hit (or a known
 * template) is replaced, so data that merely contains a UI word is never altered.
 * Inputs (value) and anything under [data-no-i18n] are never touched.
 *
 * React keeps working: it only writes a text node when its own value changes; the observer then
 * translates the new value again. Switching back to Thai restores every original string.
 *
 * Keep the dictionary current: `npm run i18n:missing` lists Thai strings without English.
 */
import dict from './i18n-en.json'
import extra from './i18n-en-extra.json'
import { getLang, LANG_EVENT } from './i18n'

type Dict = { exact: Record<string, string>; patterns: [string, string][] }

const dictTyped = dict as unknown as Dict
const extraTyped = extra as unknown as Dict

const EXACT: Record<string, string> = { ...dictTyped.exact, ...extraTyped.exact }
const PATTERNS: Array<[RegExp, string]> = [...extraTyped.patterns, ...dictTyped.patterns].map(
  ([rx, t]) => [new RegExp(rx), t] as [RegExp, string],
)
const TH = /[\u0E00-\u0E7F]/
const MONTHS: Record<string, string> = {
  'ม.ค.': 'Jan', 'ก.พ.': 'Feb', 'มี.ค.': 'Mar', 'เม.ย.': 'Apr', 'พ.ค.': 'May', 'มิ.ย.': 'Jun',
  'ก.ค.': 'Jul', 'ส.ค.': 'Aug', 'ก.ย.': 'Sep', 'ต.ค.': 'Oct', 'พ.ย.': 'Nov', 'ธ.ค.': 'Dec',
}
const MONTH_RX = /(\d{1,2}\s*)(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)/g
/** "<label>: <rest>" — label up to 120 chars, no colon inside */
const LABEL_RX = /^([^:]{1,120}?):\s([\s\S]*)$/
const ATTRS = ['placeholder', 'title', 'aria-label'] as const
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE'])

/** Translate one string; returns null when nothing applies (leave as is). */
export function translateText(raw: string, depth = 0): string | null {
  if (!raw || !TH.test(raw) || depth > 3) return null
  const norm = raw.replace(/\s+/g, ' ')
  const core = norm.trim()
  const lead = /^\s/.test(raw) ? ' ' : ''
  const trail = /\s$/.test(raw) ? ' ' : ''
  const hit = EXACT[core]
  if (hit !== undefined) return lead + hit + trail
  for (const [rx, t] of PATTERNS) {
    const m = rx.exec(core)
    if (!m) continue
    const out = t.replace(/\{(\d+)\}/g, (_, i) => {
      const g = m[Number(i) + 1] ?? ''
      const whole = translateText(g, depth + 1)
      if (whole !== null) return whole.trim()
      // inside a known template only: translate the words that are exact UI strings ("เลือก 3" → "Selected 3")
      return g.split(' ').map(w => (TH.test(w) && EXACT[w] !== undefined ? EXACT[w] : w)).join(' ')
    })
    return lead + out + trail
  }
  // v5.13.1: "<known label>: <rest>" (Engine messages) — the rest is translated when it can be, else kept
  const lm = LABEL_RX.exec(core)
  if (lm && EXACT[lm[1].trim()] !== undefined) {
    const rest = translateText(lm[2], depth + 1)
    return lead + EXACT[lm[1].trim()] + ': ' + (rest !== null ? rest.trim() : lm[2]) + trail
  }
  if (MONTH_RX.test(core)) {
    MONTH_RX.lastIndex = 0
    const out = core.replace(MONTH_RX, (_, d, mo) => d + MONTHS[mo])
    return out === core ? null : lead + out + trail
  }
  return null
}

// original Thai per node / attribute, to restore on switching back
const textOrig = new WeakMap<Text, { th: string; en: string }>()
const attrOrig = new WeakMap<Element, Record<string, { th: string; en: string }>>()

function skipped(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName)) return true
    if (e.hasAttribute('data-no-i18n')) return true
  }
  return false
}

function doText(n: Text) {
  const cur = n.nodeValue ?? ''
  const rec = textOrig.get(n)
  if (rec && cur === rec.en) return // ours
  const en = translateText(cur)
  if (en === null || en === cur) {
    textOrig.delete(n)
    return
  }
  if (skipped(n.parentElement)) return
  textOrig.set(n, { th: cur, en })
  n.nodeValue = en
}

function doAttrs(el: Element) {
  for (const a of ATTRS) {
    const cur = el.getAttribute(a)
    if (cur == null) continue
    const recs = attrOrig.get(el) ?? {}
    if (recs[a] && recs[a].en === cur) continue
    const en = translateText(cur)
    if (en === null || en === cur) continue
    if (skipped(el)) return
    recs[a] = { th: cur, en }
    attrOrig.set(el, recs)
    el.setAttribute(a, en)
  }
}

function walk(root: Node) {
  if (root.nodeType === 3) return doText(root as Text)
  if (root.nodeType !== 1 && root.nodeType !== 11) return
  if (root.nodeType === 1) {
    if (SKIP_TAGS.has((root as Element).tagName) || (root as Element).hasAttribute('data-no-i18n')) return
    doAttrs(root as Element)
  }
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (n.nodeType === 3) doText(n as Text)
    else doAttrs(n as Element)
  }
}

function restore(root: Node) {
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  for (let n: Node | null = root; n; n = tw.nextNode()) {
    if (n.nodeType === 3) {
      const r = textOrig.get(n as Text)
      if (r && n.nodeValue === r.en) n.nodeValue = r.th
      textOrig.delete(n as Text)
    } else if (n.nodeType === 1) {
      const recs = attrOrig.get(n as Element)
      if (recs) for (const [a, r] of Object.entries(recs)) if ((n as Element).getAttribute(a) === r.en) (n as Element).setAttribute(a, r.th)
      attrOrig.delete(n as Element)
    }
  }
}

let observer: MutationObserver | null = null

function start() {
  if (observer || typeof MutationObserver === 'undefined') return
  walk(document.body)
  observer = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'characterData') doText(m.target as Text)
      else if (m.type === 'attributes') doAttrs(m.target as Element)
      else m.addedNodes.forEach(walk)
    }
  })
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  })
}

function stop() {
  observer?.disconnect()
  observer = null
  restore(document.body)
}

/** Call once at startup (main.tsx). Follows ตั้งค่า › ตั้งค่าทั่วไป › ภาษา. */
export function installDomI18n() {
  if (typeof document === 'undefined') return
  const apply = () => (getLang() === 'en' ? start() : stop())
  window.addEventListener(LANG_EVENT, apply)
  window.addEventListener('storage', apply)
  if (document.body) apply()
  else document.addEventListener('DOMContentLoaded', apply, { once: true })
}
