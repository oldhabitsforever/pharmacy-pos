import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const batches = await db.inventoryBatch.findMany({
    where: { quantityRemainingBaseUnits: { gte: 0 }, product: q ? { name: { contains: q, mode: 'insensitive' } } : undefined },
    include: { product: { include: { units: { where: { isBaseUnit: true } } } } },
    orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'desc' }],
    take: 100,
  });
  return NextResponse.json(batches);
}
