import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Auto-Seed & Role Quick Switcher Tests (Point 5)', () => {
  const seedCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/lib/autoSeedSample.ts'),
    'utf-8'
  )
  const topbarCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/layout/Topbar.tsx'),
    'utf-8'
  )
  const authCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/context/AuthContext.tsx'),
    'utf-8'
  )

  it('autoSeedSample.ts must check for docCount >= 125 instead of docCount > 0', () => {
    expect(seedCode).not.toMatch(/if\s*\(docCount\s*>\s*0\)\s*return/i)
    expect(seedCode).toMatch(/docCount\s*>=\s*125/i)
  })

  it('AuthContext.tsx must export switchRole function', () => {
    expect(authCode).toMatch(/switchRole:\s*\(role:\s*RoleKey\)\s*=>\s*void/)
  })

  it('Topbar.tsx must provide a role quick switcher dropdown with SA, ACC, APR, and EU', () => {
    expect(topbarCode).toMatch(/role-quick-switcher|role-sel/i)
    expect(topbarCode).toMatch(/value="SA"/i)
    expect(topbarCode).toMatch(/value="ACC"/i)
    expect(topbarCode).toMatch(/value="APR"/i)
    expect(topbarCode).toMatch(/value="EU"/i)
  })
})
