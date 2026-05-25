import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const product = await db.product.findUnique({ where: { id: params.id }, include: { units: true, productType: true } });
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const product = await db.product.update({
    where: { id: params.id },
    data: { name: body.name, genericName: body.genericName, barcode: body.barcode, productTypeId: body.productTypeId, requiresPrescription: body.requiresPrescription, isActive: body.isActive },
    include: { units: true, productType: true },
  });
  return NextResponse.json(product);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await db.product.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
