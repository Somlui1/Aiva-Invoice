'use client'

import { Icon } from '../common/Icon'
import { useToastModal } from '../../context/ToastModalContext'

const TONE_STYLES: Record<string, { bg: string; color: string }> = {
  ok: { bg: '#ECFDF5', color: '#047857' },
  err: { bg: '#FEF2F2', color: '#B91C1C' },
  warn: { bg: '#FFF7ED', color: '#C2410C' },
  info: { bg: '#EFF6FF', color: '#1D4ED8' }
}

export function Modal() {
  const { currentModal, closeModal } = useToastModal()

  if (!currentModal) return null

  const tone = TONE_STYLES[currentModal.variant || 'info'] || TONE_STYLES.info

  return (
    <div
      className="ov on"
      id="ov"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mtitle"
      onClick={e => {
        if (e.target === e.currentTarget) closeModal()
      }}
    >
      <div className="modal">
        <div className="mh">
          {currentModal.icon && (
            <span
              className="mi"
              style={{ background: tone.bg, color: tone.color }}
            >
              <Icon name={currentModal.icon} size="lg" />
            </span>
          )}
          <div>
            <h4 id="mtitle">{currentModal.title}</h4>
            {currentModal.subtitle && <p>{currentModal.subtitle}</p>}
          </div>
        </div>

        <div className="mb">{currentModal.body}</div>

        <div className="mf">
          <button type="button" className="btn btn-sec" onClick={closeModal}>
            ยกเลิก
          </button>
          {currentModal.onConfirm && (
            <button
              type="button"
              className={`btn ${currentModal.confirmClass || 'btn-primary'}`}
              onClick={() => {
                currentModal.onConfirm?.()
                closeModal()
              }}
            >
              {currentModal.confirmText || 'ยืนยัน'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal
