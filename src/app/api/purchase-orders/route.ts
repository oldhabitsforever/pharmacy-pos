import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatePONumber } from '@/lib/utils';
export const runtime = 'edge';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const pos = await db.purchaseOrder.findMany({
    where: status ? { status } : {},
    include: { vendor: { select: { name: true } }, lines: { select: { id: true } } },
    orderBy: { orderDate: 'desc' }, take: 50,
  });
  return NextResponse.json(pos);
}
export async function POST(req: Request) {
  const body = await req.json();
  const count = await db.purchaseOrder.count();
  const poNumber = generatePONumber(count + 1);
  const total = body.lines.reduce((s: number, l: any) => s + l.orderedQty * l.costPerUnit, 0);
  const po = await db.purchaseOrder.create({
    data: { poNumber, vendorId: body.vendorId, expectedDate: body.expectedDate ? new Date(body.expectedDate) : null, notes: body.notes, totalAmount: total,
      lines: { create: body.lines.map((l: any) => ({ productId: l.productId, orderedQty: l.orderedQty, costPerUnit: l.costPerUnit, batchNumber: l.batchNumber, expiryDate: l.expiryDate ? new Date(l.expiryDate) : null })) },
    }, include: { vendor: true, lines: { include: { product: { include: { units: true } } } } },
  });
  return NextResponse.json(po, { status: 201 });
}
