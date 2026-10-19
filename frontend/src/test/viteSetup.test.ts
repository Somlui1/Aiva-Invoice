import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Vite & SPA Entrypoint Scaffolding', () => {
  it('has index.html at root with root div and main.tsx script', () => {
    const indexPath = path.resolve(__dirname, '../../index.html')
    expect(fs.existsSync(indexPath)).toBe(true)
    const content = fs.readFileSync(indexPath, 'utf-8')
    expect(content).toContain('<div id="root"></div>')
    expect(content).toContain('/src/main.tsx')
  })

  it('has vite.config.ts with /api proxy configured', () => {
    const vitePath = path.resolve(__dirname, '../../vite.config.ts')
    expect(fs.existsSync(vitePath)).toBe(true)
    const content = fs.readFileSync(vitePath, 'utf-8')
    expect(content).toContain('/api')
    expect(content).toContain('3001')
  })
})
