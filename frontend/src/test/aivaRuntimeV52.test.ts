import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('AIVA v5.2 Ported Runtime & Stylesheets Integrity', () => {
  it('verifies all 17 mockup stylesheets exist in public/styles and are populated', () => {
    const publicStylesDir = path.resolve(process.cwd(), 'public/styles')
    expect(fs.existsSync(publicStylesDir)).toBe(true)

    const expectedStyles = [
      { name: 'style-00.css', minSize: 10000 },
      { name: 'style-01.css', minSize: 10000 },
      { name: 'style-02.css', minSize: 5000 },
      { name: 'style-03.css', minSize: 4000 },
      { name: 'style-04.css', minSize: 4000 },
      { name: 'style-05.css', minSize: 5000 },
      { name: 'style-06.css', minSize: 5000 },
      { name: 'style-07.css', minSize: 1000 },
      { name: 'style-08.css', minSize: 1000 },
      { name: 'style-09.css', minSize: 20000 },
      { name: 'style-10.css', minSize: 20000 },
      { name: 'style-11.css', minSize: 4000 },
      { name: 'style-12.css', minSize: 4000 },
      { name: 'style-13.css', minSize: 10000 },
      { name: 'style-14.css', minSize: 10000 },
      { name: 'style-15.css', minSize: 100000 },
      { name: 'style-16.css', minSize: 15000 },
    ]

    for (const style of expectedStyles) {
      const fullPath = path.join(publicStylesDir, style.name)
      expect(fs.existsSync(fullPath)).toBe(true)
      const stat = fs.statSync(fullPath)
      expect(stat.size).toBeGreaterThan(style.minSize)
    }
  })

  it('verifies core runtime modules exist and export initialize hooks', async () => {
    const bridge = await import('../runtime/bridge.js')
    expect(typeof bridge.initialize).toBe('function')
    expect(typeof bridge.dispatch).toBe('function')

    const core = await import('../runtime/core.js')
    expect(typeof core.initializeCore).toBe('function')

    const effects = await import('../runtime/effects.js')
    expect(typeof effects.initializeEffects).toBe('function')

    const icons = await import('../runtime/icons.js')
    expect(typeof icons.initializeIcons).toBe('function')

    const permissions = await import('../runtime/permissions.js')
    expect(typeof permissions.initializePermissions).toBe('function')

    const login = await import('../runtime/login.js')
    expect(typeof login.initializeLogin).toBe('function')
  })

  it('verifies v5.2 React components exist in src/components/aiva', () => {
    const aivaDir = path.resolve(process.cwd(), 'src/components/aiva')
    expect(fs.existsSync(path.join(aivaDir, 'AppShell.jsx'))).toBe(true)
    expect(fs.existsSync(path.join(aivaDir, 'SplashScreen.jsx'))).toBe(true)
    expect(fs.existsSync(path.join(aivaDir, 'ModalHost.jsx'))).toBe(true)
    expect(fs.existsSync(path.join(aivaDir, 'ToastHost.jsx'))).toBe(true)
  })
})
