import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const c = await db.customer.update({ where: { id: params.id }, data: { name: body.name, phone: body.phone, email: body.email, address: body.address, discountPercentage: body.discountPercentage, isActive: body.isActive } });
  return NextResponse.json(c);
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await db.customer.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
