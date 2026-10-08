'use client'

import { useState, type CSSProperties } from 'react'
import { InvoiceDoc } from '../../types/invoice'
import { DockControls } from './DockControls'
import { EvidenceCanvas } from './EvidenceCanvas'
import { useInvoices } from '../../context/InvoiceContext'

interface EvidenceViewerDockProps {
  doc: InvoiceDoc
}

export function EvidenceViewerDock({ doc }: EvidenceViewerDockProps) {
  const { closeEvidenceDock, evidenceDockFocus } = useInvoices()
  const [currentPage, setCurrentPage] = useState<number>(evidenceDockFocus?.page || 1)
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  return (
    <section className="col dock" id="dock" aria-label="เอกสาร PDF">
      <DockControls
        currentPage={currentPage}
        totalPages={doc.pages || 1}
        zoom={zoom}
        onPageChange={p => setCurrentPage(p)}
        onZoomChange={z => setZoom(z)}
        onRotate={handleRotate}
        onClose={closeEvidenceDock}
      />

      <div
        className="dock-body"
        id="dockBody"
        style={{
          overflow: 'auto',
          padding: 16,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div
          className="evd"
          id="evd"
          style={
            {
              '--s': zoom,
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            } as CSSProperties
          }
        >
          <EvidenceCanvas doc={doc} pageNumber={currentPage} scale={zoom} />
        </div>
      </div>
    </section>
  )
}

export default EvidenceViewerDock
