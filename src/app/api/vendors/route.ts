import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const vendors = await db.vendor.findMany({ where: q ? { isActive: true, name: { contains: q, mode: 'insensitive' } } : { isActive: true }, orderBy: { name: 'asc' } });
  return NextResponse.json(vendors);
}
export async function POST(req: Request) {
  const body = await req.json();
  const vendor = await db.vendor.create({ data: { name: body.name, contactPerson: body.contactPerson, phone: body.phone, email: body.email, address: body.address } });
  return NextResponse.json(vendor, { status: 201 });
}
