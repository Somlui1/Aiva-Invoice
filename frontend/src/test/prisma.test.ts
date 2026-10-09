import { describe, it, expect } from 'vitest'
import { prisma } from '../lib/prisma'

describe('Prisma Database Client', () => {
  it('initializes prisma client and connects to database', async () => {
    expect(prisma).toBeDefined()
    const count = await prisma.document.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
