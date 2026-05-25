import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';
export async function GET() {
  const types = await db.productType.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(types);
}
export async function POST(req: Request) {
  const { name } = await req.json();
  const type = await db.productType.create({ data: { name } });
  return NextResponse.json(type, { status: 201 });
}
