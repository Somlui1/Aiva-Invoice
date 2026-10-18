import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Logo Assets', () => {
  it('has logo.png present in public/ and public/assets/', () => {
    const publicLogo = path.resolve(__dirname, '../../public/logo.png')
    const publicAssetsLogo = path.resolve(__dirname, '../../public/assets/logo.png')

    expect(fs.existsSync(publicLogo)).toBe(true)
    expect(fs.existsSync(publicAssetsLogo)).toBe(true)
    expect(fs.statSync(publicLogo).size).toBeGreaterThan(100000)
  })

  it('defines --logo-sm and --logo-big pointing to authentic WebP logo assets in tokens.css', () => {
    const tokensPath = path.resolve(__dirname, '../styles/tokens.css')
    const content = fs.readFileSync(tokensPath, 'utf-8')

    expect(content).toMatch(/--logo-sm:\s*url\(['"]?\/assets\/logo-sm\.webp['"]?\)/)
    expect(content).toMatch(/--logo-big:\s*url\(['"]?\/assets\/logo-big\.webp['"]?\)/)
  })
})
