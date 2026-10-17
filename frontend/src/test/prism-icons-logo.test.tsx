// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import React from 'react'
import { render } from '@testing-library/react'
import { Icon } from '../components/common/Icon'

describe('Brand Tile Logo & Prism v2 Duotone Icon Tests (Point 6)', () => {
  const sidebarCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/layout/Sidebar.tsx'),
    'utf-8'
  )
  const layoutCss = fs.readFileSync(
    path.resolve(process.cwd(), 'src/styles/layout.css'),
    'utf-8'
  )

  it('Sidebar.tsx must not render hardcoded letter "A" in logo-mark', () => {
    expect(sidebarCode).not.toMatch(/className="logo-mark"[^>]*>\s*A\s*</)
  })

  it('Sidebar.tsx must use branding AIVA and Auto Invoice Matching', () => {
    expect(sidebarCode).toContain('AIVA')
    expect(sidebarCode).toContain('Auto Invoice Matching')
    expect(sidebarCode).not.toContain('AAPICO AP Hub')
  })

  it('layout.css must bind brand-tile .logo-mark to var(--logo-big) and var(--mark-glow)', () => {
    expect(layoutCss).toMatch(/\.brand-tile\s+\.logo-mark\s*\{[^}]*var\(--logo-big\)/s)
    expect(layoutCss).toMatch(/\.brand-tile\s+\.logo-mark\s*\{[^}]*var\(--mark-glow\)/s)
  })

  it('Icon component must render duotone layers (.f and .a) for Prism v2 icons', () => {
    const { container } = render(<Icon name="lock" />)
    const svg = container.querySelector('svg.ico')
    expect(svg).toBeTruthy()
    // Prism v2 lock icon has .f (translucent fill) and .a (accent point)
    const fillPath = container.querySelector('path.f')
    const accentPath = container.querySelector('path.a')
    expect(fillPath).toBeTruthy()
    expect(accentPath).toBeTruthy()
  })
})
