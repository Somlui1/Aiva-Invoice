/**
 * v5.13 — English for every screen (src/lib/i18nDom.ts)
 *
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { translateText, installDomI18n } from '../lib/i18nDom'
import { setLang } from '../lib/i18n'

const tick = () => new Promise(r => setTimeout(r, 0))

afterEach(() => {
  setLang('th')
  document.body.innerHTML = ''
})

describe('translateText', () => {
  it('exact UI strings, keeping surrounding spaces', () => {
    expect(translateText('คิวตรวจสอบ')).toBe('Review queue')
    expect(translateText(' ฉบับ')).toBe(' doc(s)')
    expect(translateText('ยกเลิก Confirm')).toBe('Cancel Confirm')
  })
  it('template strings and dates', () => {
    expect(translateText('12 วัน')).toBe('12 day(s)')
    expect(translateText('เลือก 3 ฉบับ')).toBe('Selected 3 doc(s)')
    expect(translateText('01 ต.ค. – 31 ต.ค. 2026')).toBe('01 Oct – 31 Oct 2026')
  })
  it('data is left alone', () => {
    expect(translateText('บริษัท จรูญรัตน์ ไพรสิทธิ์ จำกัด')).toBeNull()
    expect(translateText('INV-001')).toBeNull()
  })
})

describe('DOM', () => {
  it('translates text + attributes in English, restores Thai, never touches inputs or data-no-i18n', async () => {
    document.body.innerHTML =
      '<span id="a">คิวตรวจสอบ</span><input id="i" placeholder="ค้นหาผู้ใช้" value="คิวตรวจสอบ"/><b id="d" data-no-i18n>คิวตรวจสอบ</b>'
    installDomI18n()
    setLang('en')
    await tick()
    expect(document.getElementById('a')!.textContent).toBe('Review queue')
    expect(document.getElementById('i')!.getAttribute('placeholder')).toBe('Search users')
    expect((document.getElementById('i') as HTMLInputElement).value).toBe('คิวตรวจสอบ')
    expect(document.getElementById('d')!.textContent).toBe('คิวตรวจสอบ')

    const late = document.createElement('p')
    late.textContent = 'ล้างตัวกรอง'
    document.body.appendChild(late)
    await tick()
    expect(late.textContent).toBe('Clear filters')

    setLang('th')
    await tick()
    expect(document.getElementById('a')!.textContent).toBe('คิวตรวจสอบ')
    expect(late.textContent).toBe('ล้างตัวกรอง')
  })
})
