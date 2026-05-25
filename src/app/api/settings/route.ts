import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';
export async function GET() {
  const settings = await db.setting.findMany();
  return NextResponse.json(Object.fromEntries(settings.map(s => [s.key, s.value])));
}
export async function PUT(req: Request) {
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await db.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } });
  }
  return NextResponse.json({ ok: true });
}
