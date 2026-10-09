'use client'

/**
 * Measures the regions of the *simulated* invoice page and expresses them in the
 * Engine's normalised coordinate system, so the mock surface can feed the same
 * overlay pipeline as a real PDF.
 *
 * `EvidenceCanvas` marks the parts a rule can point at with `data-k` (header,
 * supplier, totals, …) and each line-item row with `data-line`. Reading those
 * rectangles with `getBoundingClientRect()` and dividing by the page's own
 * rectangle is deliberate: the dock scales and reflows the page with CSS
 * variables, and a ratio cancels any scale factor, so the numbers stay valid at
 * every zoom level (`pixelBoxToNormalized` is the one place that math lives).
 *
 * Measurement is skipped while the page is CSS-rotated, because a rotated
 * element's client rectangle is the enclosing axis-aligned box (its `offsetWidth`
 * is unaffected). Normalised boxes are page-frame values, so the last good
 * measurement stays correct while the analyst rotates, and the next unrotated
 * layout refresh replaces it.
 */
import { useEffect, useState } from 'react'
import { pixelBoxToNormalized, type NormalizedBBox, type SizeBox } from '../lib/coordinateTransform'

export interface MeasuredRegions {
  /** `data-k` value (and `line<n>` for rows) → normalised box. */
  regions: Record<string, NormalizedBBox>
  /**
   * The page's own **layout** size in CSS px — deliberately not the transformed
   * rectangle: the overlay is a child of the page element, so the dock's zoom and
   * rotation are applied to it by the same transform that scales the page.
   */
  pageSize: SizeBox
}

const EMPTY: MeasuredRegions = { regions: {}, pageSize: { width: 0, height: 0 } }

function sameRegions(a: MeasuredRegions, b: MeasuredRegions): boolean {
  if (a.pageSize.width !== b.pageSize.width || a.pageSize.height !== b.pageSize.height) return false
  const ak = Object.keys(a.regions)
  const bk = Object.keys(b.regions)
  if (ak.length !== bk.length) return false
  return bk.every(k => {
    const x = a.regions[k]
    const y = b.regions[k]
    if (!x) return false
    return x.every((v, i) => Math.abs(v - y[i]) < 0.0005)
  })
}

export function useMeasuredRegions(page: HTMLElement | null, enabled = true): MeasuredRegions {
  const [measured, setMeasured] = useState<MeasuredRegions>(EMPTY)

  useEffect(() => {
    if (!enabled || !page) return

    const measure = (): void => {
      const pageRect = page.getBoundingClientRect()
      if (!(pageRect.width > 0) || !(pageRect.height > 0)) return

      const regions: Record<string, NormalizedBBox> = {}
      const remember = (key: string | null, el: Element): void => {
        if (!key) return
        const r = el.getBoundingClientRect()
        const bbox = pixelBoxToNormalized(
          {
            left: r.left - pageRect.left,
            top: r.top - pageRect.top,
            width: r.width,
            height: r.height,
          },
          { width: pageRect.width, height: pageRect.height },
        )
        if (bbox && bbox[2] > 0 && bbox[3] > 0) regions[key] = bbox
      }

      page.querySelectorAll('[data-k]').forEach(el => remember(el.getAttribute('data-k'), el))
      page.querySelectorAll('[data-line]').forEach(el => {
        const no = el.getAttribute('data-line')
        if (no) remember(`line${no}`, el)
      })

      const next: MeasuredRegions = {
        regions,
        // Layout size, not `pageRect`: `pageRect` already includes the dock's
        // zoom/rotation transform, which the overlay receives again from CSS.
        pageSize: { width: page.offsetWidth, height: page.offsetHeight },
      }
      setMeasured(prev => (sameRegions(prev, next) ? prev : next))
    }

    // Layout settles a frame after mount, and again whenever the page is scaled.
    const frame = requestAnimationFrame(measure)
    const observer = new ResizeObserver(() => measure())
    observer.observe(page)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [page, enabled])

  return measured
}

export default useMeasuredRegions
