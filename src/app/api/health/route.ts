export const runtime = 'edge';

export async function GET() {
  return Response.json({
    ok: true,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    timestamp: new Date().toISOString(),
  });
}
