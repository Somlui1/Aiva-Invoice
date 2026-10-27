'use client'

/**
 * v5.8 — popover rendered into <body> (portal) and positioned against its trigger.
 *
 * Why: the v5.7 date popover lived inside the 360 px queue column (`overflow: hidden`) and was
 * clipped / covered by the list. A portal is never clipped by any ancestor and always stacks above
 * the page. Positioning rules:
 *  - below the trigger, left-aligned (or right-aligned with `align="end"`);
 *  - flips above when there is no room below; clamped 8 px inside the viewport horizontally;
 *  - re-measured on scroll (any scroller), resize and content size change;
 *  - closes on Esc (focus returns to the trigger), outside pointer-down, and trigger unmount.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

export interface AnchoredPopoverProps {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  onClose: (reason: 'escape' | 'outside') => void
  children: ReactNode
  align?: 'start' | 'end'
  /** Desired width in px (clamped to the viewport). */
  width?: number
  id?: string
  ariaLabel?: string
  className?: string
}

const GAP = 6
const EDGE = 8

export function AnchoredPopover({
  open,
  anchorRef,
  onClose,
  children,
  align = 'start',
  width = 340,
  id,
  ariaLabel,
  className = '',
}: AnchoredPopoverProps) {
  const popRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number; placement: 'below' | 'above' } | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const measure = useCallback(() => {
    const a = anchorRef.current
    const p = popRef.current
    if (!a || typeof window === 'undefined') return
    const r = a.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = Math.min(width, vw - EDGE * 2)
    const h = p?.offsetHeight ?? 0
    let left = align === 'end' ? r.right - w : r.left
    left = Math.max(EDGE, Math.min(left, vw - w - EDGE))
    const roomBelow = vh - r.bottom - GAP - EDGE
    const placement: 'below' | 'above' = h > roomBelow && r.top - GAP - EDGE > roomBelow ? 'above' : 'below'
    const top = placement === 'below' ? r.bottom + GAP : Math.max(EDGE, r.top - GAP - h)
    setPos(prev =>
      prev && prev.top === top && prev.left === left && prev.width === w && prev.placement === placement
        ? prev
        : { top, left, width: w, placement },
    )
  }, [anchorRef, align, width])

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    measure()
    // second pass once the content has its real height (flip decision)
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [open, measure])

  useEffect(() => {
    if (!open) return
    const onScroll = () => measure()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && popRef.current) {
      ro = new ResizeObserver(() => measure())
      ro.observe(popRef.current)
    }
    const onDown = (e: PointerEvent | MouseEvent) => {
      const t = e.target as Node
      if (popRef.current?.contains(t) || anchorRef.current?.contains(t)) return
      onCloseRef.current('outside')
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopImmediatePropagation()
      onCloseRef.current('escape')
      anchorRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown, true)
    document.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      ro?.disconnect()
      document.removeEventListener('mousedown', onDown, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, measure, anchorRef])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={popRef}
      id={id}
      role="dialog"
      aria-label={ariaLabel}
      className={`apop ${className}`}
      data-placement={pos?.placement ?? 'below'}
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: pos?.width ?? width,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>,
    document.body,
  )
}

export default AnchoredPopover
