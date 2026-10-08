import { Icon } from '../common/Icon'
import { useToastModal } from '../../context/ToastModalContext'

export function Toast() {
  const { toasts, removeToast } = useToastModal()

  if (!toasts.length) return <div className="toasts" id="toasts" aria-live="polite" />

  return (
    <div className="toasts" id="toasts" aria-live="polite">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast ${t.isError ? 'e' : ''}`}
          role="status"
          onClick={() => removeToast(t.id)}
        >
          <Icon name={t.isError ? 'alert' : 'checkc'} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

export default Toast
