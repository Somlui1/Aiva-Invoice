import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Splash & Login FX Animation Tests (Point 4 & 5)', () => {
  const fxCss = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/fx.css'), 'utf-8')
  const splashCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/layout/SplashScreen.tsx'),
    'utf-8'
  )
  const loginCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/features/login/LoginPage.tsx'),
    'utf-8'
  )

  it('fx.css must define orbital ring animations spR1, spR2, and spBeam', () => {
    expect(fxCss).toContain('@keyframes spR1')
    expect(fxCss).toContain('@keyframes spR2')
    expect(fxCss).toContain('@keyframes spBeam')
  })

  it('SplashScreen.tsx must not render hardcoded letter "A" in logo-mark', () => {
    expect(splashCode).not.toMatch(/className="logo-mark"[^>]*>\s*A\s*</)
  })

  it('LoginPage.tsx must integrate FX.warp or FX.welcome on login success', () => {
    expect(loginCode).toMatch(/FX\.warp|FX\.welcome/i)
  })
})
