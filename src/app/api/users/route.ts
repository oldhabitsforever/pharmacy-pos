import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
export const runtime = 'edge';
export async function GET() {
  const users = await db.user.findMany({ select: { id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true }, orderBy: { fullName: 'asc' } });
  return NextResponse.json(users);
}
export async function POST(req: Request) {
  const body = await req.json();
  const hash = await bcrypt.hash(body.password, 10);
  const user = await db.user.create({ data: { username: body.username, passwordHash: hash, fullName: body.fullName, role: body.role ?? 'cashier' }, select: { id: true, username: true, fullName: true, role: true, isActive: true } });
  return NextResponse.json(user, { status: 201 });
}
