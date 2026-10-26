import { Icon } from '../common/Icon'
import { toggleTheme, useTheme } from '../../lib/theme'

/** สวิตช์สลับโหมดสว่าง / มืด (หน้าตาและเอฟเฟกต์เดียวกับ aiva-react) */
export function ThemeSwitch() {
  const theme = useTheme()
  const light = theme === 'light'
  return (
    <button
      type="button"
      className="theme-sw"
      role="switch"
      aria-checked={light}
      aria-label="สลับโหมดสว่าง / มืด"
      title={light ? 'โหมดสว่าง · คลิกเพื่อสลับเป็นโหมดมืด' : 'โหมดมืด · คลิกเพื่อสลับเป็นโหมดสว่าง'}
      onClick={e => toggleTheme(e.currentTarget)}
    >
      <Icon name={"sun"} className="i-sun" />
      <Icon name={"moon"} className="i-moon" />
      <i className="kn" />
    </button>
  )
}

export default ThemeSwitch
