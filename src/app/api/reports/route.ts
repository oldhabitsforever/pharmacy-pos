import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'sales';
  const from = searchParams.get('from'); const to = searchParams.get('to');

  if (type === 'sales') {
    const where: any = { status: { not: 'Voided' } };
    if (from) where.saleDate = { ...(where.saleDate ?? {}), gte: new Date(from) };
    if (to) where.saleDate = { ...(where.saleDate ?? {}), lte: new Date(to + 'T23:59:59') };
    const sales = await db.sale.findMany({ where, include: { customer: { select: { name: true } }, cashier: { select: { fullName: true } }, lines: true }, orderBy: { saleDate: 'desc' } });
    return NextResponse.json(sales.map(s => ({ saleNumber: s.saleNumber, date: s.saleDate, cashier: s.cashier.fullName, customer: s.customer?.name ?? '-', status: s.status, subtotal: Number(s.subtotal), discount: Number(s.discountAmount), total: Number(s.total), profit: s.lines.reduce((acc, l) => acc + (Number(l.unitPriceSnapshot) - Number(l.costPriceSnapshot)) * l.quantity, 0) })));
  }
  if (type === 'inventory') {
    const batches = await db.inventoryBatch.findMany({ where: { quantityRemainingBaseUnits: { gt: 0 } }, include: { product: { select: { name: true, genericName: true } } }, orderBy: { expiryDate: 'asc' } });
    return NextResponse.json(batches.map(b => ({ product: b.product.name, genericName: b.product.genericName ?? '-', batchNumber: b.batchNumber ?? '-', expiryDate: b.expiryDate, quantity: b.quantityRemainingBaseUnits, costPerUnit: Number(b.costPerBaseUnit), totalValue: b.quantityRemainingBaseUnits * Number(b.costPerBaseUnit) })));
  }
  if (type === 'vendor-balance') {
    const vendors = await db.vendor.findMany({ where: { isActive: true }, include: { purchaseOrders: { select: { totalAmount: true, amountPaid: true } } } });
    return NextResponse.json(vendors.map(v => ({ vendor: v.name, totalPO: v.purchaseOrders.reduce((s, p) => s + Number(p.totalAmount), 0), totalPaid: v.purchaseOrders.reduce((s, p) => s + Number(p.amountPaid), 0), outstanding: v.purchaseOrders.reduce((s, p) => s + Number(p.totalAmount) - Number(p.amountPaid), 0) })));
  }
  return NextResponse.json([]);
}
