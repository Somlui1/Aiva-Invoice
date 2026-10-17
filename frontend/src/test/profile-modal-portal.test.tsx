import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Profile Modal Portal & Glassmorphism Tests (Point 2)', () => {
  const modalCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/layout/MyProfileModal.tsx'),
    'utf-8'
  )

  it('MyProfileModal.tsx must use createPortal from react-dom', () => {
    expect(modalCode).toMatch(/createPortal/i)
    expect(modalCode).toMatch(/document\.body/i)
  })

  it('MyProfileModal.tsx must not contain hardcoded #ffffff or #F8FAFC inline styles', () => {
    expect(modalCode).not.toContain("background: '#ffffff'")
    expect(modalCode).not.toContain("background: '#F8FAFC'")
    expect(modalCode).not.toContain("border: '1px solid #E2E8F0'")
  })

  it('MyProfileModal.tsx must bind to design tokens var(--surface) or var(--glass-2)', () => {
    expect(modalCode).toMatch(/var\(--surface|var\(--glass/i)
  })
})
