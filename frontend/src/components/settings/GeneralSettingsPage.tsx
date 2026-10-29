/**
 * v5.13 — ตั้งค่า › ตั้งค่าทั่วไป (General)
 * ค่าส่วนบุคคลเท่านั้น (ภาษาเมนู · ธีม) เก็บในเบราว์เซอร์นี้ · ทุกบทบาทเข้าได้ · ไม่มีเนื้อหาเอกสาร
 */
import { useEffect, useState } from 'react'
import { Icon } from '../common/Icon'
import { useToastModal } from '../../context/ToastModalContext'
import { LANGS, setLang, translate, useLang, useT, type Lang } from '../../lib/i18n'
import { THEME_EVENT, getTheme, setTheme, type ThemeName } from '../../lib/theme'

export function GeneralSettingsPage() {
  const t = useT()
  const lang = useLang()
  const { toast } = useToastModal()
  const [theme, setThemeState] = useState<ThemeName>(() => getTheme())

  useEffect(() => {
    const on = () => setThemeState(getTheme())
    window.addEventListener(THEME_EVENT, on)
    return () => window.removeEventListener(THEME_EVENT, on)
  }, [])

  const pickLang = (l: Lang) => {
    if (l === lang) return
    setLang(l)
    // the confirmation is written in the NEW language so the user sees the switch worked
    toast(translate(l, 'set.lang.saved'))
  }

  return (
    <div className="pg" data-testid="general-settings">
      <div className="tbar">
        <span className="lab">{t('set.title')}</span>
        <span className="scope-note">{t('set.note')}</span>
      </div>

      <div className="pg-scroll">
        <section className="panel gset" aria-labelledby="gset-lang-h">
          <div className="gset-row">
            <div className="gset-tx">
              <h3 id="gset-lang-h">
                <Icon name="globe" size="sm" /> {t('set.lang.h')}
              </h3>
              <p>{t('set.lang.d')}</p>
            </div>
            <div className="seg" role="radiogroup" aria-labelledby="gset-lang-h">
              {LANGS.map(l => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={lang === l}
                  className={lang === l ? 'on' : ''}
                  onClick={() => pickLang(l)}
                >
                  {l === 'th' ? t('set.lang.th') : t('set.lang.en')}
                </button>
              ))}
            </div>
          </div>

          <div className="gset-row">
            <div className="gset-tx">
              <h3 id="gset-theme-h">
                <Icon name={theme === 'light' ? 'sun' : 'moon'} size="sm" /> {t('set.theme.h')}
              </h3>
              <p>{t('set.theme.d')}</p>
            </div>
            <div className="seg" role="radiogroup" aria-labelledby="gset-theme-h">
              {(['light', 'dark'] as ThemeName[]).map(m => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={theme === m}
                  className={theme === m ? 'on' : ''}
                  onClick={e => setTheme(m, e.currentTarget)}
                >
                  {m === 'light' ? t('set.theme.light') : t('set.theme.dark')}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default GeneralSettingsPage
