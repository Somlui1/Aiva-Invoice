/** โลโก้ AIVA แบบกระเบื้องเรืองแสง (ภาพจาก --logo-sm / --logo-big ใน theme.css) */
export function BrandTile({ size }: { size?: 'md' }) {
  return (
    <span className={`brand-tile${size ? ` ${size}` : ''}`}>
      <span className="logo-mark" role="img" aria-label="AIVA" />
    </span>
  )
}

export default BrandTile
