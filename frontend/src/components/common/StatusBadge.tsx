import { InvoiceStatus } from '../../types/invoice'

interface StatusBadgeProps {
  status: InvoiceStatus | string
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const prefix = status.split(' ')[0]
  return (
    <span className={`badge st-${prefix} ${className}`}>
      <i></i>
      {status}
    </span>
  )
}

export default StatusBadge
