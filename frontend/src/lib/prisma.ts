import { PrismaClient } from '@prisma/client'
import { resolveDatasourceUrl } from './prismaUrl'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const resolvedUrl = resolveDatasourceUrl(process.env.DATABASE_URL, {
  production: process.env.NODE_ENV === 'production',
})

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
