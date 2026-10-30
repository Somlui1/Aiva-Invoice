'use client'

/**
 * v5.14 — ไทย / English switch in the top bar (same setting as ตั้งค่า › ตั้งค่าทั่วไป).
 * A two-option segmented control: both choices are visible, the current one is filled, one click.
 * Labels never get translated (data-no-i18n) — "TH | EN" must read the same in both languages.
 */
import { setLang, useLang, type Lang } from '../../lib/i18n'

const OPTS: { k: Lang; label: string; title: string }[] = [
  { k: 'th', label: 'TH', title: 'ภาษาไทย' },
  { k: 'en', label: 'EN', title: 'English' },
]

export function LangSwitch() {
  const lang = useLang()
  return (
    <div className="lsw" role="radiogroup" aria-label="Language / ภาษา" data-no-i18n title="Language / ภาษา">
      {OPTS.map(o => (
        <button
          key={o.k}
          type="button"
          role="radio"
          aria-checked={lang === o.k}
          className={`lsw-opt${lang === o.k ? ' on' : ''}`}
          title={o.title}
          onClick={() => lang !== o.k && setLang(o.k)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default LangSwitch
