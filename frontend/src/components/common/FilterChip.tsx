import React from 'react'

interface FilterChipProps {
  label: string
  count?: number
  active?: boolean
  onClick?: () => void
  title?: string
  icon?: React.ReactNode
}

export function FilterChip({ label, count, active, onClick, title, icon }: FilterChipProps) {
  return (
    <button
      type="button"
      className={`chip ${active ? 'on' : ''}`}
      aria-pressed={active}
      onClick={onClick}
      title={title}
    >
      {icon}
      {label}
      {count !== undefined && <span className="n">{count}</span>}
    </button>
  )
}

export default FilterChip
