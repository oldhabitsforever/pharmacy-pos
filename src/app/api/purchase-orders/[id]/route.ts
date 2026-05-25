import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const po = await db.purchaseOrder.findUnique({ where: { id: params.id }, include: { vendor: true, lines: { include: { product: { include: { units: true } } } }, payments: true } });
  if (!po) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(po);
}
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const po = await db.purchaseOrder.update({ where: { id: params.id }, data: { status: body.status, notes: body.notes }, include: { vendor: true } });
  return NextResponse.json(po);
}
