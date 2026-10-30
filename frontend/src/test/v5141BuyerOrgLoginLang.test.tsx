/**
 * v5.14.1 — (1) language switch on the login page · (2) "Buyer ORG" replaces "ชื่อผู้ขายใน Oracle"
 *
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { LoginPage } from '../features/login/LoginPage'
import { setLang } from '../lib/i18n'
import { translateText } from '../lib/i18nDom'
import { buyerOrgOf, COMPANIES } from '../mock/companies'

describe('buyerOrgOf — บริษัทผู้ซื้อ (Buyer ORG) จาก master "บริษัทและ ORG_ID"', () => {
  it('uses the master name of the document company, not the name printed on the invoice', () => {
    const b = buyerOrgOf({ company: 'AH', org: 101, oname: 'AAPICO HITECH PUBLIC CO., LTD.' })
    expect(b).toEqual({ name: COMPANIES.AH.name, code: 'AH', source: 'master' })
    expect(b.name).toBe('อาปิโก ไฮเทค (มหาชน)')
  })

  it('falls back to the receipt ORG_ID when the company code is unknown ("?")', () => {
    expect(buyerOrgOf({ company: '?', org: 195, oname: 'x' })).toMatchObject({ code: 'AHT', source: 'master' })
  })

  it('falls back to the invoice customer name, then to nothing', () => {
    expect(buyerOrgOf({ company: '?', org: null, oname: ' ACME CO. ' })).toEqual({ name: 'ACME CO.', code: '', source: 'invoice' })
    expect(buyerOrgOf({ company: '?', org: 556, oname: '' })).toEqual({ name: '', code: '', source: 'none' })
    expect(buyerOrgOf({})).toEqual({ name: '', code: '', source: 'none' })
  })

  it('English: master company names and the new labels are translated', () => {
    expect(translateText('อาปิโก ไฮเทค (มหาชน)')).toBe('AAPICO Hitech (PCL)')
    expect(translateText('บริษัทผู้ซื้อ (Buyer ORG)')).toBe('Buyer (ORG)')
  })
})

describe('Login page language switch', () => {
  afterEach(() => {
    cleanup()
    setLang('th')
  })

  it('shows TH | EN next to the theme switch', () => {
    render(<LoginPage mock={false} />)
    expect(screen.getByRole('radio', { name: 'TH' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: 'EN' })).toBeTruthy()
  })

  it('login texts (form, errors, explainer) have an English translation', () => {
    for (const th of [
      'เลือกวิธีที่องค์กรกำหนดให้คุณ',
      'ลงชื่อเข้าใช้ด้วย Microsoft',
      'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
      'ระบบทำงานอย่างไร',
      'สแกนเข้า DMS',
      'ขั้นที่ 2 ค้นใบรับใน Oracle',
      ' ใส่รหัสผิดครบ 5 ครั้ง · ลองใหม่ได้ใน ',
    ]) {
      const en = translateText(th)
      expect(en, th).not.toBeNull()
      expect(/[\u0E00-\u0E7F]/.test(en as string), th).toBe(false)
    }
  })
})
