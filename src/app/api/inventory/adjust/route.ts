import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';
export async function POST(req: Request) {
  const body = await req.json();
  const batch = await db.inventoryBatch.update({
    where: { id: body.batchId },
    data: { quantityRemainingBaseUnits: { increment: body.adjustment } },
  });
  return NextResponse.json(batch);
}
