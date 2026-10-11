/**
 * Overlay Category & Single-Active Filtering Tests.
 * Design: docs/plans/2026-10-11-validation-evidence-pdf-linking-design.md
 * Plan:   docs/plans/2026-10-11-validation-evidence-pdf-linking.md
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { projectOverlayBoxes, type ViewerBBox } from '../features/pdf-viewer/lib/overlayModel'
import { BoundingBoxOverlay } from '../features/pdf-viewer/components/BoundingBoxOverlay'

const A4 = { width: 794, height: 1123 }

const sampleBoxes: ViewerBBox[] = [
  {
    id: 'b1',
    pageNo: 1,
    origin: 'engine',
    bbox: [0.1, 0.1, 0.2, 0.05],
    ruleId: 'V-01',
    exceptionCode: 'E01',
    severity: 'Medium',
  },
  {
    id: 'b2',
    pageNo: 1,
    origin: 'engine',
    bbox: [0.1, 0.2, 0.2, 0.05],
    ruleId: 'V-07',
    exceptionCode: 'E09',
    severity: 'High',
  },
  {
    id: 'b3',
    pageNo: 1,
    origin: 'engine',
    bbox: [0.1, 0.3, 0.2, 0.05],
    ruleId: 'V-08',
    exceptionCode: 'E14',
    severity: 'High',
  },
]

describe('Task 3: Single-Active BBox Filtering & Cell Specificity in Projector', () => {
  it('assigns validation category to projected overlay boxes', () => {
    const projected = projectOverlayBoxes(sampleBoxes, {
      page: 1,
      pageSize: A4,
    })

    expect(projected.length).toBe(3)
    const b1 = projected.find(b => b.id === 'b1')
    const b2 = projected.find(b => b.ruleId === 'V-07')
    const b3 = projected.find(b => b.ruleId === 'V-08')

    expect(b1?.category).toBe('missing')
    expect(b2?.category).toBe('mismatch')
    expect(b3?.category).toBe('calculation')
  })

  it('filters strictly to the active validation rule when activeRuleId is specified', () => {
    // When V-01 is active, ONLY V-01 box is projected, clearing others
    const projectedV1 = projectOverlayBoxes(sampleBoxes, {
      page: 1,
      pageSize: A4,
      activeRuleId: 'V-01',
    })

    expect(projectedV1.length).toBe(1)
    expect(projectedV1[0].id).toBe('b1')
    expect(projectedV1[0].ruleId).toBe('V-01')

    // When switching to V-07, V-01 is cleared and ONLY V-07 is returned
    const projectedV7 = projectOverlayBoxes(sampleBoxes, {
      page: 1,
      pageSize: A4,
      activeRuleId: 'V-07',
    })

    expect(projectedV7.length).toBe(1)
    expect(projectedV7[0].id).toBe('b2')
    expect(projectedV7[0].ruleId).toBe('V-07')
  })

  it('renders category class names on BoundingBoxOverlay elements', () => {
    const projected = projectOverlayBoxes(sampleBoxes, {
      page: 1,
      pageSize: A4,
      activeRuleId: 'V-08',
    })

    const { container } = render(
      <BoundingBoxOverlay
        boxes={projected}
        pageSize={A4}
        visible={true}
      />
    )

    const el = container.querySelector('.hl')
    expect(el).not.toBeNull()
    expect(el?.classList.contains('cat-calculation')).toBe(true)
  })
})
