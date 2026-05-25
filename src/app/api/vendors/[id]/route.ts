import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const vendor = await db.vendor.update({ where: { id: params.id }, data: { name: body.name, contactPerson: body.contactPerson, phone: body.phone, email: body.email, address: body.address, isActive: body.isActive } });
  return NextResponse.json(vendor);
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await db.vendor.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
