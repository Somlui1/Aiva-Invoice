/**
 * v5.13.1 — PDF: all pages in one scroll (dock + new-tab viewer) · English for Engine messages.
 *
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StandaloneBBoxViewer, type BBoxItem } from '../features/pdf-viewer/components/StandaloneBBoxViewer'
import { translateText } from '../lib/i18nDom'

const items: BBoxItem[] = [
  { id: 'a', pageNo: 1, type: 'field', label: 'invoice_num', bbox_norm: [0.1, 0.1, 0.2, 0.03] },
  { id: 'b', pageNo: 3, type: 'field', label: 'grand_total', bbox_norm: [0.5, 0.8, 0.3, 0.03] },
  { id: 'c', pageNo: 3, type: 'row', label: 'items[1]', bbox_norm: [0.05, 0.4, 0.9, 0.02] },
]

describe('new-tab viewer: every page, boxes on their own page', () => {
  it('renders all pages with a page tag, box count per page and a page jump list', () => {
    const { container } = render(<StandaloneBBoxViewer docId="DMS-1" items={items} pageCount={4} />)
    const pages = container.querySelectorAll('.standalone-pages .page')
    expect(pages.length).toBe(4)
    expect(pages[2].querySelectorAll('.box').length).toBe(2)
    expect(pages[2].querySelector('.page-tag')!.textContent).toBe('หน้า 3 / 4 · 2 กรอบ')
    expect(pages[1].querySelector('.page-tag')!.textContent).toBe('หน้า 2 / 4')
    const opts = Array.from(screen.getByTestId('page-jump').querySelectorAll('option')).map(o => o.textContent)
    expect(opts).toEqual(['หน้า 1 / 4 · 1 กรอบ', 'หน้า 2 / 4', 'หน้า 3 / 4 · 2 กรอบ', 'หน้า 4 / 4'])
  })

  it('the viewer is its own scroll container (body overflow is hidden in the app shell)', () => {
    const { container } = render(<StandaloneBBoxViewer docId="DMS-1" items={items} pageCount={2} />)
    expect(container.querySelector('.standalone-viewer')).not.toBeNull()
  })
})

describe('English: Engine finding sentences', () => {
  it('translates the fixed part and keeps the data', () => {
    expect(translateText('ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(CONFLICT_BETWEEN_SOURCES)')).toBe(
      'Required fields unreadable or incomplete: po_number(CONFLICT_BETWEEN_SOURCES)',
    )
    expect(translateText('บรรทัดที่ 6 (Invoice: PUNCH 1,560.86): ระบุบรรทัดในใบรับไม่ได้')).toBe(
      'Line 6 (Invoice: PUNCH 1,560.86): Cannot identify the receipt line',
    )
    expect(translateText('ยอดรวมสุทธิ')).toBe('Net total')
    expect(translateText('อาปิโก ไฮเทค ออโตโมชั่น')).toBe('AAPICO Hitech Automation')
    expect(translateText('หน้า 2 / 5')).toBe('Page 2 / 5')
    // vendor names (data) stay as they are
    expect(translateText('บริษัท เอสซีเอ็มเอ จำกัด')).toBeNull()
  })
})
