import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSaleNumber } from '@/lib/utils';
export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const saleNumber = searchParams.get('saleNumber');
  const sales = await db.sale.findMany({
    where: saleNumber ? { saleNumber: { contains: saleNumber } } : {},
    include: { customer: { select: { name: true } }, cashier: { select: { fullName: true } }, lines: { include: { product: { select: { name: true } }, productUnit: { select: { unitName: true } } } } },
    orderBy: { saleDate: 'desc' }, take: 20,
  });
  return NextResponse.json(sales);
}

export async function POST(req: Request) {
  const body = await req.json();
  const saleNumber = generateSaleNumber();
  const subtotal = body.lines.reduce((s: number, l: any) => s + l.quantity * l.unitPrice, 0);
  const discountAmt = subtotal * (body.discountPercentage ?? 0) / 100;
  const total = subtotal - discountAmt;

  const sale = await db.sale.create({
    data: {
      saleNumber, customerId: body.customerId ?? null,
      cashierId: body.cashierId,
      subtotal, discountPercentage: body.discountPercentage ?? 0,
      discountAmount: discountAmt, total,
      amountPaid: body.amountPaid, changeDue: body.amountPaid - total,
      lines: {
        create: await Promise.all(body.lines.map(async (l: any) => {
          const batches = await db.inventoryBatch.findMany({ where: { productId: l.productId, quantityRemainingBaseUnits: { gt: 0 } }, orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'asc' }] });
          const cost = batches[0]?.costPerBaseUnit ?? 0;
          let remaining = l.quantity;
          for (const b of batches) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, b.quantityRemainingBaseUnits);
            await db.inventoryBatch.update({ where: { id: b.id }, data: { quantityRemainingBaseUnits: { decrement: take } } });
            remaining -= take;
          }
          return { productId: l.productId, productUnitId: l.productUnitId, quantity: l.quantity, unitPriceSnapshot: l.unitPrice, costPriceSnapshot: cost, lineTotal: l.quantity * l.unitPrice };
        })),
      },
    },
    include: { lines: true, customer: true, cashier: { select: { fullName: true } } },
  });
  return NextResponse.json(sale, { status: 201 });
}
