import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function getDatasourceUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL
  if (envUrl) {
    // If already absolute (Linux container /app/data or Windows drive letter)
    if (envUrl.startsWith('file:/') || envUrl.startsWith('file:///') || envUrl.includes(':\\')) {
      return envUrl
    }
    // Relative file path (e.g. file:./dev.db or file:./prisma/dev.db)
    const cleanPath = envUrl.replace(/^file:/, '').replace(/^\.\//, '')
    const cwdCandidate = path.resolve(process.cwd(), cleanPath)
    if (fs.existsSync(cwdCandidate)) {
      return `file:${cwdCandidate}`
    }
  }

  // Common candidate locations for local & standalone runner
  const candidates = [
    path.resolve(process.cwd(), 'prisma/dev.db'),
    path.resolve(process.cwd(), '.next/standalone/prisma/dev.db'),
    path.resolve(process.cwd(), '../prisma/dev.db'),
  ]

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return `file:${c}`
    }
  }

  return envUrl
}

const resolvedUrl = getDatasourceUrl()

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    resolvedUrl
      ? {
          datasources: {
            db: {
              url: resolvedUrl,
            },
          },
        }
      : undefined
  )

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
