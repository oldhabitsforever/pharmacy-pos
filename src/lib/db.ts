import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

declare global { var prisma: PrismaClient | undefined }

function getPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL environment variable is not set');
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter } as any);
}

export const db: PrismaClient = globalThis.prisma ?? getPrismaClient();
if (process.env.NODE_ENV !== 'production') { globalThis.prisma = db; }
