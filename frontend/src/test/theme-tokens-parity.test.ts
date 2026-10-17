import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Theme Tokens Parity Tests (Point 1 & 3)', () => {
  const componentsCss = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/components.css'), 'utf-8')
  const queueCss = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/queue.css'), 'utf-8')

  it('components.css .panel must bind background to var(--surface) without hardcoded #fff', () => {
    // Should NOT have .panel { background: #fff; }
    expect(componentsCss).not.toMatch(/\.panel\s*\{\s*background:\s*#fff/i)
    // Should have var(--surface)
    expect(componentsCss).toMatch(/\.panel\s*\{[^}]*background:\s*var\(--surface\)/s)
  })

  it('queue.css .tbl-wrap must bind background to var(--surface) without hardcoded #fff', () => {
    expect(queueCss).not.toMatch(/\.tbl-wrap\s*\{\s*background:\s*#fff/i)
    expect(queueCss).toMatch(/\.tbl-wrap\s*\{[^}]*background:\s*var\(--surface\)/s)
  })

  it('queue.css tr:nth-child(even) and tr:hover must not use hardcoded light hex colors', () => {
    expect(queueCss).not.toContain('#FAFBFC')
    expect(queueCss).not.toContain('#EEF4FB')
    expect(queueCss).toMatch(/tr:nth-child\(even\)\s*td\s*\{[^}]*var\(--surface/s)
  })

  it('queue.css .kpi.on must not use hardcoded #F5F9FE', () => {
    expect(queueCss).not.toContain('#F5F9FE')
    expect(queueCss).toMatch(/\.kpi\.on\s*\{[^}]*background:\s*var\(--surface/s)
  })
})
