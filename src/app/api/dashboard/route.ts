import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';

export async function GET() {
  const today = new Date(); today.setHours(0,0,0,0);
  const [todaySales, totalProducts, lowStock, expiringBatches, recentSales] = await Promise.all([
    db.sale.aggregate({ where: { saleDate: { gte: today }, status: 'Completed' }, _sum: { total: true }, _count: true }),
    db.product.count({ where: { isActive: true } }),
    db.inventoryBatch.findMany({ where: { quantityRemainingBaseUnits: { gt: 0, lte: 10 } }, include: { product: { select: { name: true } } }, take: 5 }),
    db.inventoryBatch.findMany({ where: { expiryDate: { lte: new Date(Date.now() + 90*24*60*60*1000), gte: new Date() }, quantityRemainingBaseUnits: { gt: 0 } }, include: { product: { select: { name: true } } }, take: 5, orderBy: { expiryDate: 'asc' } }),
    db.sale.findMany({ take: 5, orderBy: { saleDate: 'desc' }, include: { customer: { select: { name: true } }, cashier: { select: { fullName: true } } } }),
  ]);
  return NextResponse.json({ todaySales: { total: todaySales._sum.total ?? 0, count: todaySales._count }, totalProducts, lowStock, expiringBatches, recentSales });
}
