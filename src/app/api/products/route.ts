import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const page = parseInt(searchParams.get('page') ?? '1');
  const skip = (page - 1) * limit;
  const where = q ? { isActive: true, OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { genericName: { contains: q, mode: 'insensitive' as const } }, { barcode: { contains: q, mode: 'insensitive' as const } }] } : { isActive: true };
  const [products, total] = await Promise.all([
    db.product.findMany({ where, include: { productType: true, units: true, inventoryBatches: { where: { quantityRemainingBaseUnits: { gt: 0 } }, select: { quantityRemainingBaseUnits: true } } }, take: limit, skip, orderBy: { name: 'asc' } }),
    db.product.count({ where }),
  ]);
  return NextResponse.json({ products, total, page, limit });
}

export async function POST(req: Request) {
  const body = await req.json();
  const product = await db.product.create({
    data: { name: body.name, genericName: body.genericName, barcode: body.barcode, productTypeId: body.productTypeId, requiresPrescription: body.requiresPrescription ?? false,
      units: { create: body.units.map((u: any) => ({ unitName: u.unitName, conversionFactor: u.conversionFactor, isBaseUnit: u.isBaseUnit, isDirectlySellable: u.isDirectlySellable, retailPrice: u.retailPrice })) },
    }, include: { units: true, productType: true },
  });
  return NextResponse.json(product, { status: 201 });
}
