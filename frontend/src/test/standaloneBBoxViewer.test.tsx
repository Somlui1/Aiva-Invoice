/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { StandaloneBBoxViewer, type BBoxItem } from '../features/pdf-viewer/components/StandaloneBBoxViewer'

describe('Task 4: Standalone PDF BBox Viewer', () => {
  const sampleItems: BBoxItem[] = [
    {
      id: 'b1',
      pageNo: 1,
      type: 'header',
      label: 'doc_title',
      text: 'ต้นฉบับใบกำกับภาษี',
      bbox_norm: [0.45, 0.02, 0.50, 0.04],
    },
    {
      id: 'b2',
      pageNo: 1,
      type: 'supplier',
      label: 'supplier_name',
      text: 'THAI WORTH COMPANY LIMITED',
      bbox_norm: [0.10, 0.02, 0.32, 0.04],
    },
    {
      id: 'b3',
      pageNo: 1,
      type: 'customer',
      label: 'customer_name',
      text: 'บริษัท อาปิโก ไฮเทค จำกัด',
      bbox_norm: [0.02, 0.19, 0.35, 0.03],
    },
    {
      id: 'b4',
      pageNo: 1,
      type: 'table',
      label: 'table_header',
      text: 'ลำดับ รายการ จำนวน',
      bbox_norm: [0.02, 0.31, 0.93, 0.03],
    },
    {
      id: 'b5',
      pageNo: 1,
      type: 'line',
      label: 'line_1',
      text: '1 SOLID CARBIDE 3 PCS',
      bbox_norm: [0.02, 0.34, 0.93, 0.02],
    },
    {
      id: 'b6',
      pageNo: 1,
      type: 'total',
      label: 'grand_total',
      text: 'ยอดเงินสุทธิ 53,660.85',
      bbox_norm: [0.54, 0.77, 0.41, 0.04],
    },
    {
      id: 'b7',
      pageNo: 1,
      type: 'signature',
      label: 'receiver_signature',
      text: 'signed',
      bbox_norm: [0.40, 0.82, 0.19, 0.07],
    },
    {
      id: 'b8',
      pageNo: 1,
      type: 'stamp',
      label: 'company_stamp',
      text: 'DIE ENGINEER',
      bbox_norm: [0.24, 0.54, 0.21, 0.08],
    },
    {
      id: 'b9',
      pageNo: 1,
      type: 'payment',
      label: 'credit_term',
      text: '60 วัน',
      bbox_norm: [0.59, 0.25, 0.30, 0.02],
    },
    {
      id: 'b10',
      pageNo: 1,
      type: 'other',
      label: 'remark',
      text: 'หมายเหตุ',
      bbox_norm: [0.02, 0.71, 0.23, 0.02],
    },
  ]

  it('renders top toolbar with doc title, zoom controls, and all 10 category filters', () => {
    render(
      <StandaloneBBoxViewer
        docId="DMS-20"
        title="Doc 20 · TAX INVOICE"
        items={sampleItems}
        pageCount={1}
      />
    )

    // Document title
    expect(screen.getByText(/Doc 20/i)).toBeDefined()

    // Zoom controls
    expect(screen.getByRole('button', { name: '−' })).toBeDefined()
    expect(screen.getByRole('button', { name: '+' })).toBeDefined()
    expect(screen.getByText('140%')).toBeDefined()

    // Label toggle
    const labelCheckbox = screen.getByLabelText(/label/i) as HTMLInputElement
    expect(labelCheckbox).toBeDefined()
    expect(labelCheckbox.checked).toBe(true)

    // All 10 category toggles should be rendered
    const categories = [
      'header',
      'supplier',
      'customer',
      'table',
      'line',
      'total',
      'payment',
      'signature',
      'stamp',
      'other',
    ]
    for (const cat of categories) {
      const checkbox = screen.getByLabelText(new RegExp(`^${cat}$`, 'i')) as HTMLInputElement
      expect(checkbox).toBeDefined()
      expect(checkbox.checked).toBe(true)
    }

    // Boxes rendered
    const boxes = document.querySelectorAll('.box')
    expect(boxes.length).toBe(10)
  })

  it('toggles category visibility when checkbox is unchecked and rechecked', async () => {
    render(
      <StandaloneBBoxViewer
        docId="DMS-20"
        items={sampleItems}
        pageCount={1}
      />
    )

    const headerCheckbox = screen.getByLabelText(/^header$/i) as HTMLInputElement
    expect(headerCheckbox.checked).toBe(true)

    const headerBox = document.querySelector('.box[data-t="header"]') as HTMLElement
    expect(headerBox).toBeDefined()
    expect(headerBox.style.display).not.toBe('none')

    // Uncheck header
    await act(async () => {
      fireEvent.click(headerCheckbox)
    })
    expect(headerCheckbox.checked).toBe(false)
    expect(headerBox.style.display).toBe('none')

    // Recheck header
    await act(async () => {
      fireEvent.click(headerCheckbox)
    })
    expect(headerCheckbox.checked).toBe(true)
    expect(headerBox.style.display).toBe('')
  })

  it('toggles label badges when label checkbox is clicked', async () => {
    const { container } = render(
      <StandaloneBBoxViewer
        docId="DMS-20"
        items={sampleItems}
        pageCount={1}
      />
    )

    const labelCheckbox = screen.getByLabelText(/label/i) as HTMLInputElement
    expect(container.querySelector('.hide-labels')).toBeNull()

    // Uncheck label
    await act(async () => {
      fireEvent.click(labelCheckbox)
    })
    expect(labelCheckbox.checked).toBe(false)
    expect(container.querySelector('.hide-labels')).toBeDefined()
  })

  it('updates scale percentage when clicking zoom in and zoom out', async () => {
    render(
      <StandaloneBBoxViewer
        docId="DMS-20"
        items={sampleItems}
        pageCount={1}
      />
    )

    const zoomVal = screen.getByTestId('zoom-val')
    expect(zoomVal.textContent).toBe('140%')

    const zoomIn = screen.getByRole('button', { name: '+' })
    await act(async () => {
      fireEvent.click(zoomIn)
    })
    expect(zoomVal.textContent).toBe('160%')

    const zoomOut = screen.getByRole('button', { name: '−' })
    await act(async () => {
      fireEvent.click(zoomOut)
    })
    expect(zoomVal.textContent).toBe('140%')
  })

  it('displays tooltip on box mousemove and hides on mouseleave', async () => {
    render(
      <StandaloneBBoxViewer
        docId="DMS-20"
        items={sampleItems}
        pageCount={1}
      />
    )

    const box = document.querySelector('.box[data-t="supplier"]') as HTMLElement
    const tooltip = screen.getByTestId('bbox-tooltip')
    expect(tooltip.style.display).toBe('none')

    // Mouse move on box
    await act(async () => {
      fireEvent.mouseMove(box, { clientX: 200, clientY: 150 })
    })

    expect(tooltip.style.display).toBe('block')
    expect(tooltip.textContent).toContain('supplier_name')
    expect(tooltip.textContent).toContain('THAI WORTH COMPANY LIMITED')

    // Mouse leave box
    await act(async () => {
      fireEvent.mouseLeave(box)
    })
    expect(tooltip.style.display).toBe('none')
  })

  it('correctly classifies various field names into 10 categories with mapBBoxType', async () => {
    const { mapBBoxType } = await import('../features/pdf-viewer/components/StandaloneBBoxViewer')
    expect(mapBBoxType('supplier_name', 'field')).toBe('supplier')
    expect(mapBBoxType('customer_tax_id', 'field')).toBe('customer')
    expect(mapBBoxType('doc_title', 'field')).toBe('header')
    expect(mapBBoxType('grand_total', 'field')).toBe('total')
    expect(mapBBoxType('line_amount', 'field')).toBe('line')
    expect(mapBBoxType('', 'table')).toBe('table')
    expect(mapBBoxType('credit_term', 'field')).toBe('payment')
    expect(mapBBoxType('', 'signature')).toBe('signature')
    expect(mapBBoxType('', 'stamp')).toBe('stamp')
    expect(mapBBoxType('unrecognized_key', 'custom')).toBe('other')
  })
})

