import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const po = await db.purchaseOrder.findUnique({ where: { id: params.id }, include: { lines: true } });
  if (!po) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  for (const recv of body.lines) {
    const line = po.lines.find(l => l.id === recv.lineId);
    if (!line || recv.qty <= 0) continue;
    const product = await db.product.findUnique({ where: { id: line.productId }, include: { units: { where: { isBaseUnit: true } } } });
    const baseUnit = product?.units[0];
    await db.inventoryBatch.create({ data: { productId: line.productId, purchaseOrderId: params.id, batchNumber: recv.batchNumber || line.batchNumber, expiryDate: recv.expiryDate ? new Date(recv.expiryDate) : line.expiryDate, quantityReceivedBaseUnits: recv.qty, quantityRemainingBaseUnits: recv.qty, costPerBaseUnit: line.costPerUnit } });
    await db.purchaseOrderLine.update({ where: { id: line.id }, data: { receivedQty: { increment: recv.qty } } });
  }
  const updatedPO = await db.purchaseOrder.findUnique({ where: { id: params.id }, include: { lines: true } });
  const allReceived = updatedPO!.lines.every(l => l.receivedQty >= l.orderedQty);
  const anyReceived = updatedPO!.lines.some(l => l.receivedQty > 0);
  await db.purchaseOrder.update({ where: { id: params.id }, data: { status: allReceived ? 'Received' : anyReceived ? 'PartiallyReceived' : 'Ordered' } });
  return NextResponse.json({ ok: true });
}
