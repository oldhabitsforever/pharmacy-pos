import { neon } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

declare global { var prisma: PrismaClient | undefined; }

function getPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL environment variable is not set');
  const sql = neon(databaseUrl);
  const adapter = new PrismaNeon(sql);
  return new PrismaClient({ adapter } as any);
}

export const db: PrismaClient = globalThis.prisma ?? getPrismaClient();
if (process.env.NODE_ENV !== 'production') { globalThis.prisma = db; }
