import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('AIVA v5.2 CSS Foundation & Design Tokens', () => {
  const stylesDir = path.resolve(__dirname, '../styles')

  it('tokens.css contains v5.2 font definitions and dimension variables', () => {
    const tokensContent = fs.readFileSync(path.join(stylesDir, 'tokens.css'), 'utf-8')
    expect(tokensContent).toContain('--font')
    expect(tokensContent).toContain('Bai Jamjuree')
    expect(tokensContent).toContain('--hdr-h: 52px')
    expect(tokensContent).toContain('--nav-w: 236px')
    expect(tokensContent).toContain('--nav-w-c: 60px')
    expect(tokensContent).toContain('--q-w: 360px')
  })

  it('tokens.css contains dark and light theme tokens', () => {
    const tokensContent = fs.readFileSync(path.join(stylesDir, 'tokens.css'), 'utf-8')
    expect(tokensContent).toContain('data-theme=dark')
    expect(tokensContent).toContain('data-theme=light')
    expect(tokensContent).toContain('--canvas')
    expect(tokensContent).toContain('--surface')
    expect(tokensContent).toContain('--teal')
  })

  it('base.css locks viewport height to 100dvh with font size 12.5px', () => {
    const baseContent = fs.readFileSync(path.join(stylesDir, 'base.css'), 'utf-8')
    expect(baseContent).toMatch(/font-size:\s*12\.5px/)
    expect(baseContent).toContain('height: 100%')
  })

  it('layout.css establishes unified 2x2 grid with body display: contents', () => {
    const layoutContent = fs.readFileSync(path.join(stylesDir, 'layout.css'), 'utf-8')
    expect(layoutContent).toContain('100dvh')
    expect(layoutContent).toContain('min-height: 640px')
    expect(layoutContent).toContain('grid-template-columns: var(--nav-w) minmax(0, 1fr)')
    expect(layoutContent).toContain('grid-template-rows: var(--hdr-h) minmax(0, 1fr)')
    expect(layoutContent).toMatch(/\.body\s*\{\s*display:\s*contents;?\s*\}/)
  })

  it('cf.css, pm.css, and fx.css exist with required class rules', () => {
    expect(fs.existsSync(path.join(stylesDir, 'cf.css'))).toBe(true)
    expect(fs.existsSync(path.join(stylesDir, 'pm.css'))).toBe(true)
    expect(fs.existsSync(path.join(stylesDir, 'fx.css'))).toBe(true)

    const cfContent = fs.readFileSync(path.join(stylesDir, 'cf.css'), 'utf-8')
    expect(cfContent).toContain('.cfp')
    expect(cfContent).toContain('.cfbar')

    const pmContent = fs.readFileSync(path.join(stylesDir, 'pm.css'), 'utf-8')
    expect(pmContent).toContain('.pm')
    expect(pmContent).toContain('.pm-mx')
    expect(pmContent).toContain('.pm-cg')
    expect(pmContent).toContain('.pm-tst')
    expect(pmContent).toContain('.pm-insp')

    const fxContent = fs.readFileSync(path.join(stylesDir, 'fx.css'), 'utf-8')
    expect(fxContent).toContain('#splash')
    expect(fxContent).toContain('.cmdk-ov')
    expect(fxContent).toContain('.theme-sw')
  })
})
