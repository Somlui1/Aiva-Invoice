import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Layout Hydration Cleanliness', () => {
  it('does not contain media="not all" link tags or mutating inline scripts in layout.tsx', () => {
    const layoutPath = path.resolve(__dirname, '../app/layout.tsx')
    const content = fs.readFileSync(layoutPath, 'utf-8')

    // Must not have media="not all" on stylesheet links
    expect(content).not.toContain('media="not all"')
    // Must not have window.__aivaStyles mutating media attributes
    expect(content).not.toContain('window.__aivaStyles')
  })

  it('imports the full suite of v5.2 modular stylesheets', () => {
    const layoutPath = path.resolve(__dirname, '../app/layout.tsx')
    const content = fs.readFileSync(layoutPath, 'utf-8')

    expect(content).toContain("@/styles/tokens.css")
    expect(content).toContain("@/styles/layout.css")
    expect(content).toContain("@/styles/components.css")
    expect(content).toContain("@/styles/queue.css")
    expect(content).toContain("@/styles/permissionGrid.css")
    expect(content).toContain("@/styles/fx.css")
  })
})
