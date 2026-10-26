'use client'

import { useMemo } from 'react'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import type { Finding, InvoiceDoc } from '../../types/invoice'
import { VENDOR_PROFILES } from '../../mock/vendors'
import { documentFindings, findingState } from '../../features/evidence/findings'
import type { PdfProxySource } from '../../features/pdf-viewer/types'
import {
  MIN_ZOOM,
  MAX_ZOOM,
  zoomForStep,
} from '../../features/pdf-viewer/lib/coordinateTransform'

export interface DockControlsProps {
  doc?: InvoiceDoc
  currentPage: number
  totalPages: number
  zoom: number
  onPageChange: (p: number) => void
  onZoomChange: (z: number) => void
  onRotate?: () => void
  onClose: () => void
  mode?: 'pdf' | 'mock'
  source?: PdfProxySource
  showEvidence?: boolean
  onToggleEvidence?: (show?: boolean) => void
  showAllFields?: boolean
  onToggleAllFields?: () => void
  boxCount?: number
  activeRuleId?: string | null
  /** @deprecated chips are per finding now; kept so older callers still compile. */
  onSelectRule?: (ruleId: string, page?: number) => void
  /** Chip strip: one chip per finding. Defaults to `documentFindings(doc)`. */
  findings?: Finding[]
  activeFindingId?: string | null
  onSelectFinding?: (finding: Finding) => void
  onRunTests?: () => void
  onOpenNewTab?: () => void
  onPrint?: () => void
}

/** Human label for proxy source fallback display */
const SOURCE_LABEL: Record<PdfProxySource, string> = {
  dms_live: 'DMS (สด)',
  cache: 'คลังเอกสาร',
  fallback_mock: 'เอกสารจำลอง',
}

export function DockControls({
  doc,
  currentPage,
  totalPages,
  zoom,
  onPageChange,
  onZoomChange,
  onClose,
  source,
  showEvidence = true,
  onToggleEvidence,
  activeRuleId,
  onSelectRule,
  findings,
  activeFindingId,
  onSelectFinding,
  onRunTests,
  onOpenNewTab,
  onPrint,
}: DockControlsProps) {
  const { currentUser } = useAuth()

  const docId = doc?.doc || 'DMS-2026-000131'
  const invNumber = doc?.inv || 'A631577'
  const vendorName = doc?.vendor || 'Thai Steel Service Co., Ltd.'
  const stax = doc?.stax || ''

  const vendorProfile = VENDOR_PROFILES[stax]
  const sourceTypeLabel =
    vendorProfile?.st === 'scan'
      ? 'ไฟล์สแกน'
      : source === 'fallback_mock'
        ? SOURCE_LABEL.fallback_mock
        : 'PDF จากระบบผู้ขาย'

  // Evidence chips: one per finding (evidence row), not one per rule. A rule with no finding has no
  // chip; a finding with no box gets a dashed chip and never turns the page.
  const evidenceList = useMemo(() => findings ?? (doc ? documentFindings(doc) : []), [findings, doc])

  const handleOpenNewTab = () => {
    if (onOpenNewTab) {
      onOpenNewTab()
    } else if (doc?.doc) {
      // Carry the finding in focus, so the new tab opens on the same evidence (plan F8).
      const q = activeFindingId ? `?finding=${encodeURIComponent(activeFindingId)}` : ''
      window.open(`/viewer/${doc.doc}${q}`, '_blank')
    }
  }

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else if (doc?.doc) {
      const printWin = window.open(`/api/documents/${doc.doc}/pdf`, '_blank')
      if (printWin) {
        printWin.addEventListener('load', () => {
          try {
            printWin.print()
          } catch {
            // Ignore print dialog errors
          }
        })
      }
    }
  }

  const handleRunTests = () => {
    if (onRunTests) {
      onRunTests()
    }
  }

  return (
    <div className="dock-chrome" id="dockChrome">
      {/* Tier 1: Document Header (.dock-h) */}
      <div className="dock-h">
        <Icon name="file" size="lg" />
        <div className="ttl">
          <b>
            {invNumber} · {docId}
          </b>
          <span>
            {vendorName} · {totalPages} หน้า · {sourceTypeLabel}
          </span>
        </div>

        <button
          type="button"
          className="ibtn"
          title="ทดสอบการแสดงผล"
          aria-label="ทดสอบการแสดงผล"
          onClick={handleRunTests}
        >
          <Icon name="checkc" size="sm" />
        </button>

        <button
          type="button"
          className="ibtn"
          title="เปิดในแท็บใหม่"
          aria-label="เปิดในแท็บใหม่"
          onClick={handleOpenNewTab}
        >
          <Icon name="ext" size="sm" />
        </button>

        <button
          type="button"
          className="ibtn"
          title="พิมพ์ หรือบันทึกเป็น PDF"
          aria-label="พิมพ์ หรือบันทึกเป็น PDF"
          onClick={handlePrint}
        >
          <Icon name="dl" size="sm" />
        </button>

        <span className="sep" aria-hidden="true" />

        <button
          type="button"
          className="btn-close-pdf"
          id="pdfClose"
          onClick={onClose}
          title="ปิด PDF และแสดงคิวเอกสาร (Esc)"
          aria-label="ปิด PDF"
        >
          <Icon name="x" size="sm" />
          ปิด PDF <kbd>Esc</kbd>
        </button>
      </div>

      {/* Tier 2: Toolbar (.dock-tb) */}
      <div className="dock-tb">
        <div className="seg" role="group" aria-label="โหมดแสดงผล">
          <button
            type="button"
            className={!showEvidence ? 'on' : ''}
            onClick={() => onToggleEvidence?.(false)}
          >
            <Icon name="file" size="sm" />
            เอกสาร
          </button>
          <button
            type="button"
            className={showEvidence ? 'on' : ''}
            onClick={() => onToggleEvidence?.(true)}
          >
            <Icon name="target" size="sm" />
            หลักฐาน
          </button>
        </div>

        <span className="grow" />

        {/* Zoom controls */}
        <div className="pager">
          <button
            type="button"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => onZoomChange(zoomForStep(zoom, -0.1))}
            title="ย่อ"
          >
            <Icon name="zout" size="sm" />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => onZoomChange(zoomForStep(zoom, 0.1))}
            title="ขยาย"
          >
            <Icon name="zin" size="sm" />
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(zoomForStep(zoom, 'fit'))}
            title="พอดีความกว้าง"
          >
            <Icon name="fitw" size="sm" />
          </button>
        </div>

        {/* Pagination */}
        <div className="pager">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            title="หน้าก่อน"
          >
            <Icon name="chevL" size="sm" />
          </button>
          <span>
            หน้า {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            title="หน้าถัดไป"
          >
            <Icon name="chevR" size="sm" />
          </button>
        </div>
      </div>

      {/* Tier 3: Evidence bar (.evbar) */}
      {showEvidence && evidenceList.length > 0 && (
        <div className="evbar" aria-label="หลักฐาน">
          {evidenceList.map(f => {
            const located = findingState(f) === 'located'
            // No finding in focus (legacy "open rule" request): the rule's first chip is the active one.
            const on = activeFindingId
              ? activeFindingId === f.id
              : !!activeRuleId && activeRuleId === f.ruleId && evidenceList.find(x => x.ruleId === f.ruleId) === f
            const where = located
              ? `${f.targets[0].label ? `${f.targets[0].label} · ` : ''}หน้า ${f.targets[0].pageNo}`
              : 'ไม่มีตำแหน่ง'
            return (
              <button
                key={f.id}
                type="button"
                className={['evchip', located ? 'loc' : 'noloc', f.kind === 'review' ? 'review' : '', on ? 'on' : '']
                  .filter(Boolean)
                  .join(' ')}
                data-finding={f.id}
                data-rule={f.ruleId}
                title={f.messageTh ?? f.ruleId}
                aria-pressed={on}
                onClick={() => {
                  onToggleEvidence?.(true)
                  if (onSelectFinding) onSelectFinding(f)
                  else onSelectRule?.(f.ruleId, f.targets[0]?.pageNo) // older callers
                }}
              >
                <span className={`code ${f.severity ?? 'Low'}${f.code ? '' : ' review'}`}>{f.code ?? 'ต้องตรวจ'}</span>
                {f.ruleId}
                <span className="muted xs">· {where}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DockControls
