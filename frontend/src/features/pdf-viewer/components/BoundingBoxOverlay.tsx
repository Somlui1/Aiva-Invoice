'use client'

/**
 * Interactive evidence bounding boxes, drawn as HTML on top of whichever surface
 * is showing the page (design §4.2).
 *
 * Boxes are DOM elements rather than canvas pixels for three reasons: they are
 * hit-testable and keyboard-focusable for free, the existing `.hl` stylesheet
 * (ported from the approved mockup) already defines the severity colours and the
 * exception tag, and they stay crisp at any zoom.
 *
 * The parent owns the coordinate frame: it renders this layer inside the page
 * element and passes the page's CSS pixel size, so a box at `left: 0` is at the
 * page's top-left corner in both PDF and mock mode.
 */
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react'
import type { SizeBox } from '../lib/coordinateTransform'
import type { OverlayBox } from '../lib/overlayModel'

export interface BoundingBoxOverlayProps {
  boxes: OverlayBox[]
  /** CSS px size of the page element this layer is absolutely positioned in. */
  pageSize: SizeBox
  onSelect?: (box: OverlayBox) => void
  onHover?: (box: OverlayBox | null) => void
  /** Keep the last hovered box visually raised (driven by the dock). */
  hoveredId?: string | null
  /** Hide every box: the dock's evidence toggle. */
  visible?: boolean
}

const severityClass = (box: OverlayBox, hoveredId: string | null): string =>
  [
    'hl',
    box.category ? `cat-${box.category}` : '',
    box.severity === 'High' ? 'High' : box.severity === 'Medium' ? 'Medium' : '',
    box.focused ? 'focus' : '',
    box.dim ? 'dim' : '',
    box.id === hoveredId ? 'hover' : '',
  ]
    .filter(Boolean)
    .join(' ')

export function BoundingBoxOverlay({
  boxes,
  pageSize,
  onSelect,
  onHover,
  hoveredId = null,
  visible = true,
}: BoundingBoxOverlayProps) {
  const handleClick = (box: OverlayBox) => (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
    onSelect?.(box)
  }

  const handleKeyDown = (box: OverlayBox) => (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    event.stopPropagation()
    onSelect?.(box)
  }

  return (
    <div
      className="evd-overlay"
      style={{ position: 'absolute', inset: 0, width: pageSize.width, height: pageSize.height }}
      data-testid="bbox-overlay"
      data-box-count={boxes.length}
      aria-hidden={!visible}
    >
      {visible
        ? boxes.map(box => {
            const style: CSSProperties = {
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
            }
            return (
              <div
                key={box.id}
                className={severityClass(box, hoveredId)}
                style={style}
                data-id={box.id}
                data-rule={box.ruleId ?? undefined}
                data-finding={box.findingIds?.length ? box.findingIds.join(' ') : undefined}
                data-line={box.lineNo ?? undefined}
                title={box.tooltip || undefined}
                role={onSelect ? 'button' : undefined}
                tabIndex={onSelect ? 0 : undefined}
                aria-label={box.tag ? `${box.tag}${box.tooltip ? ` — ${box.tooltip}` : ''}` : box.tooltip || undefined}
                onClick={onSelect ? handleClick(box) : undefined}
                onKeyDown={onSelect ? handleKeyDown(box) : undefined}
                onMouseEnter={onHover ? () => onHover(box) : undefined}
                onMouseLeave={onHover ? () => onHover(null) : undefined}
                onFocus={onHover ? () => onHover(box) : undefined}
                onBlur={onHover ? () => onHover(null) : undefined}
              >
                {box.tag ? <span className="tag">{box.tag}</span> : null}
              </div>
            )
          })
        : null}
    </div>
  )
}

export default BoundingBoxOverlay
