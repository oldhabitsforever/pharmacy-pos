import { neon } from '@neondatabase/serverless';

export const runtime = 'edge';

export async function GET() {
  let dbResult = 'not tested';
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT username, "passwordHash" FROM "User" LIMIT 1`;
    dbResult = rows.length > 0 ? 'found user: ' + rows[0].username : 'no users in db';
  } catch (e: any) {
    dbResult = 'db error: ' + e.message;
  }
  return Response.json({
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    dbResult,
  });
}
