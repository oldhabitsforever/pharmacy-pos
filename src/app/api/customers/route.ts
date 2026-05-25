import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAccountId } from '@/lib/utils';
export const runtime = 'edge';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const customers = await db.customer.findMany({
    where: q ? { isActive: true, OR: [{ name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { accountId: { contains: q } }] } : { isActive: true },
    orderBy: { name: 'asc' }, take: 20,
  });
  return NextResponse.json(customers);
}
export async function POST(req: Request) {
  const body = await req.json();
  const customer = await db.customer.create({ data: { name: body.name, phone: body.phone, email: body.email, address: body.address, accountId: generateAccountId(), discountPercentage: body.discountPercentage ?? 0 } });
  return NextResponse.json(customer, { status: 201 });
}
