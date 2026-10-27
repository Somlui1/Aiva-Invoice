/**
 * v5.7 — "ตรวจ BBox (แท็บใหม่)": tags = System A element_type, as engine/src/test-portal draws them.
 *
 * @vitest-environment jsdom
 */
import { beforeEach, describe, it, expect } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import {
  StandaloneBBoxViewer,
  BBOX_TAG_COLORS,
  BBOX_TAG_DEFAULT,
  bboxTagOf,
  type BBoxItem,
} from '../features/pdf-viewer/components/StandaloneBBoxViewer'
import { bboxItemsFromDocument } from '../components/viewer/StandaloneViewerRoute'

const sampleItems: BBoxItem[] = [
  { id: 'f1', pageNo: 1, type: 'field', label: 'supplier_name', text: 'THAI WORTH COMPANY LIMITED', bbox_norm: [0.1, 0.02, 0.32, 0.04], confidence: 0.98 },
  { id: 'f2', pageNo: 1, type: 'field', label: 'grand_total', text: '53,660.85', bbox_norm: [0.54, 0.77, 0.41, 0.04], codes: ['E10'], severity: 'High' },
  { id: 'r1', pageNo: 1, type: 'row', label: 'items[1]', text: '1 SOLID CARBIDE 3 PCS', bbox_norm: [0.02, 0.34, 0.93, 0.02] },
  { id: 'c1', pageNo: 1, type: 'cell', label: 'qty', text: '3', bbox_norm: [0.6, 0.34, 0.05, 0.02] },
  { id: 't1', pageNo: 1, type: 'table', label: 'table', text: '', bbox_norm: [0.02, 0.31, 0.93, 0.3] },
  { id: 's1', pageNo: 1, type: 'signature', label: 'signature.receiver', text: 'true', bbox_norm: [0.4, 0.82, 0.19, 0.07] },
  { id: 'st1', pageNo: 1, type: 'stamp', label: 'company_stamp', text: 'DIE ENGINEER', bbox_norm: [0.24, 0.54, 0.21, 0.08] },
  { id: 'w1', pageNo: 1, type: 'word', label: 'word', text: 'หมายเหตุ', bbox_norm: [0.02, 0.71, 0.23, 0.0] },
]

const boxOf = (container: HTMLElement, id: string) =>
  container.querySelector(`.box[data-id="${id}"]`) as HTMLDivElement

describe('StandaloneBBoxViewer v5.7 (element_type tags)', () => {
  beforeEach(() => localStorage.clear())

  it('lists only the tags present, in engine order, with counts', () => {
    render(<StandaloneBBoxViewer docId="DMS-20" title="Doc 20" items={sampleItems} />)
    const chips = Array.from(document.querySelectorAll('#types input[type="checkbox"]')).map(i => i.getAttribute('data-t'))
    expect(chips).toEqual(['field', 'row', 'cell', 'table', 'signature', 'stamp', 'word'])
    expect(screen.getByRole('checkbox', { name: 'field' }).closest('label')!.textContent).toContain('2')
  })

  it('shows field / row / signature / stamp by default and hides the rest', () => {
    const { container } = render(<StandaloneBBoxViewer docId="DMS-20" items={sampleItems} />)
    expect(BBOX_TAG_DEFAULT).toEqual(['field', 'row', 'signature', 'stamp'])
    expect(boxOf(container, 'f1').style.display).toBe('')
    expect(boxOf(container, 'r1').style.display).toBe('')
    expect(boxOf(container, 's1').style.display).toBe('')
    expect(boxOf(container, 'c1').style.display).toBe('none')
    expect(boxOf(container, 't1').style.display).toBe('none')
    expect(screen.getByTestId('bbox-count').textContent).toContain('5/8')
  })

  it('toggles a tag and remembers the choice', async () => {
    const { container } = render(<StandaloneBBoxViewer docId="DMS-20" items={sampleItems} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'cell' }))
    })
    expect(boxOf(container, 'c1').style.display).toBe('')
    expect(JSON.parse(localStorage.getItem('aiva.viewer.types.v1') || '[]')).toContain('cell')
  })

  it('uses the engine palette and the field name as label (max 22 chars)', () => {
    const long: BBoxItem = { id: 'L', type: 'field', label: 'supplier_address_line_number_two', bbox_norm: [0, 0, 0.1, 0.1] }
    const { container } = render(<StandaloneBBoxViewer docId="DMS-1" items={[long, sampleItems[5]]} />)
    expect(boxOf(container, 'L').querySelector('span')!.textContent).toBe('supplier_address_line_'.slice(0, 22))
    expect(boxOf(container, 's1').style.borderColor).toBe('rgb(214, 39, 40)')
    expect(BBOX_TAG_COLORS.field).toBe('#1f77b4')
  })

  it('keeps a hairline box visible (min height) and focuses a finding even when its tag is off', () => {
    const { container } = render(<StandaloneBBoxViewer docId="DMS-1" items={sampleItems} focusIds={['w1']} />)
    const w = boxOf(container, 'w1')
    expect(w.style.display).toBe('')
    expect(parseFloat(w.style.height)).toBeGreaterThan(0)
    expect(w.className).toContain('focus')
    expect(boxOf(container, 'f1').className).toContain('dim')
  })

  it('tooltip carries tag, value, confidence and exception code', async () => {
    const { container } = render(<StandaloneBBoxViewer docId="DMS-1" items={sampleItems} />)
    await act(async () => {
      fireEvent.mouseMove(boxOf(container, 'f2'), { clientX: 10, clientY: 10 })
    })
    const tip = screen.getByTestId('bbox-tooltip')
    expect(tip.style.display).toBe('block')
    expect(tip.textContent).toContain('[field] grand_total: 53,660.85')
    expect(tip.textContent).toContain('E10')
    expect(boxOf(container, 'f2').className).toContain('bx-sev-high')
    // v5.7.1: must never carry the app's global `.ev` card class (solid dark fill)
    expect(boxOf(container, 'f2').classList.contains('ev')).toBe(false)
  })

  it('shows a spinner and hides the pages while the document is loading', () => {
    const { container } = render(<StandaloneBBoxViewer docId="DMS-1" items={sampleItems} loading />)
    expect(screen.getByTestId('viewer-loading')).toBeDefined()
    expect(container.querySelector('.standalone-pages.is-loading')).not.toBeNull()
  })

  it('zoom and label switch still work', async () => {
    const { container } = render(<StandaloneBBoxViewer docId="DMS-1" items={sampleItems} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '+' }))
    })
    expect(screen.getByTestId('zoom-val').textContent).toBe('160%')
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'label' }))
    })
    expect(container.querySelector('.hide-labels')).not.toBeNull()
  })
})

describe('bboxTagOf / bboxItemsFromDocument', () => {
  it('tag = element_type, lower-cased; empty falls back to field', () => {
    expect(bboxTagOf('signature')).toBe('signature')
    expect(bboxTagOf('ROW')).toBe('row')
    expect(bboxTagOf(undefined)).toBe('field')
  })

  it('maps Portal bboxes[] and skips boxes without a usable bbox', () => {
    const items = bboxItemsFromDocument({
      bboxes: [
        { id: 'a', pageNo: 2, bbox: [0.1, 0.2, 0.3, 0.04], elementType: 'field', fieldName: 'vat', rawValue: '7%', confidence: 0.9, exceptionCode: 'E15', severity: 'Medium' },
        { id: 'b', pageNo: 1, bbox: null, elementType: 'row' },
      ],
    })
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ id: 'a', pageNo: 2, type: 'field', label: 'vat', text: '7%', codes: ['E15'], severity: 'Medium' })
  })

  it('falls back to raw result/3.0 ocr.elements', () => {
    const items = bboxItemsFromDocument({
      raw_payload: { ocr: { elements: [{ element_id: 'e1', page_no: 1, element_type: 'stamp', bbox: [0, 0, 0.1, 0.1] }] } },
    })
    expect(items[0]).toMatchObject({ id: 'e1', type: 'stamp', label: 'stamp' })
  })
})
