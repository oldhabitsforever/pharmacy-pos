import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'edge';
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const payment = await db.pOPayment.create({ data: { purchaseOrderId: params.id, amount: body.amount, note: body.note } });
  const po = await db.purchaseOrder.findUnique({ where: { id: params.id }, include: { payments: true } });
  const totalPaid = po!.payments.reduce((s, p) => s + Number(p.amount), 0);
  const status = totalPaid >= Number(po!.totalAmount) ? 'Paid' : 'PartiallyPaid';
  await db.purchaseOrder.update({ where: { id: params.id }, data: { amountPaid: totalPaid, status: po!.status === 'Received' || po!.status === 'PartiallyReceived' ? status : po!.status } });
  return NextResponse.json(payment, { status: 201 });
}
