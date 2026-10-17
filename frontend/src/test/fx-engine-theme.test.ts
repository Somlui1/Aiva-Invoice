import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('FX Animation Engine Tests (Point 4)', () => {
  it('src/lib/fxEngine.ts must exist and export core fx functions', () => {
    const fxEnginePath = path.resolve(process.cwd(), 'src/lib/fxEngine.ts')
    expect(fs.existsSync(fxEnginePath)).toBe(true)
    const code = fs.readFileSync(fxEnginePath, 'utf-8')
    expect(code).toMatch(/export function bloom/i)
    expect(code).toMatch(/export function sparks/i)
    expect(code).toMatch(/export function ring/i)
    expect(code).toMatch(/export function sweep/i)
    expect(code).toMatch(/export function hud/i)
    expect(code).toMatch(/export const FX/i)
  })

  it('src/styles/fx.css must contain FX layer and animation styles', () => {
    const fxCss = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/fx.css'), 'utf-8')
    expect(fxCss).toContain('.fx-layer')
    expect(fxCss).toContain('.fx-bloom')
    expect(fxCss).toContain('.fx-spark')
    expect(fxCss).toContain('.fx-ring')
    expect(fxCss).toContain('.fx-sweep')
    expect(fxCss).toContain('.fx-hud')
    expect(fxCss).toContain('.fx-warp')
    expect(fxCss).toContain('.fx-welcome')
  })

  it('ThemeContext.tsx must integrate fxEngine on theme toggle', () => {
    const themeContextCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/context/ThemeContext.tsx'),
      'utf-8'
    )
    expect(themeContextCode).toMatch(/bloom|sparks|hud|triggerThemeFx/i)
  })
})
