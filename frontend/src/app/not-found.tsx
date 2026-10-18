import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        background: 'var(--canvas, #07090e)',
        color: 'var(--s-900, #f8fafc)',
        gap: '16px',
      }}
    >
      <h1 style={{ fontSize: '32px', fontWeight: 800 }}>404 · ไม่พบหน้าที่ต้องการ</h1>
      <p style={{ color: 'var(--s-500, #94a3b8)', fontSize: '14px' }}>
        หน้าที่คุณกำลังค้นหาไม่มีอยู่ในระบบ AIVA หรือคุณอาจไม่มีสิทธิ์เข้าถึง
      </p>
      <Link
        href="/queue"
        style={{
          padding: '8px 16px',
          background: 'var(--teal, #00b5af)',
          color: '#ffffff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        กลับสู่หน้าหลัก (คิวเอกสาร)
      </Link>
    </div>
  )
}
