import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateRefundNumber } from '@/lib/utils';
export const runtime = 'edge';

export async function POST(req: Request) {
  const body = await req.json();
  const refundNumber = generateRefundNumber();
  let totalAmount = 0;
  const sale = await db.sale.findUnique({ where: { id: body.saleId }, include: { lines: true } });
  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

  const refund = await db.refund.create({
    data: {
      refundNumber, saleId: body.saleId, reason: body.reason,
      totalAmount: 0,
      lines: {
        create: body.lines.map((l: any) => {
          const saleLine = sale.lines.find(sl => sl.id === l.saleLineId)!;
          const amt = l.quantity * Number(saleLine.unitPriceSnapshot);
          totalAmount += amt;
          return { saleLineId: l.saleLineId, quantity: l.quantity, amount: amt };
        }),
      },
    },
  });
  await db.refund.update({ where: { id: refund.id }, data: { totalAmount } });
  for (const l of body.lines) {
    await db.saleLine.update({ where: { id: l.saleLineId }, data: { refundedQuantity: { increment: l.quantity } } });
    const saleLine = sale.lines.find(sl => sl.id === l.saleLineId)!;
    await db.inventoryBatch.create({ data: { productId: saleLine.productId, batchNumber: 'REFUND-' + refundNumber, quantityReceivedBaseUnits: l.quantity, quantityRemainingBaseUnits: l.quantity, costPerBaseUnit: saleLine.costPriceSnapshot } });
  }
  const allRefunded = (await db.saleLine.findMany({ where: { saleId: body.saleId } })).every(l => l.refundedQuantity >= l.quantity);
  if (allRefunded) await db.sale.update({ where: { id: body.saleId }, data: { status: 'Refunded' } });
  return NextResponse.json(refund, { status: 201 });
}
