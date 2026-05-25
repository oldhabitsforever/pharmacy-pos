'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PO {
  id: string; poNumber: string; status: string;
  vendor: { name: string }; total: number;
  createdAt: string; orderedDate?: string;
  lines: any[]; payments: Array<{ amount: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'badge-gray', Ordered: 'badge-blue',
  Partially_Received: 'badge-yellow', Received: 'badge-green', Cancelled: 'badge-red',
};

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const url = filter ? `/api/purchase-orders?status=${filter}` : '/api/purchase-orders';
    const res = await fetch(url);
    setPos(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <AppShell>
      <PageHeader title="Purchase Orders"
        action={<Link href="/purchase-orders/new" className="btn-primary">+ New PO</Link>} />
      <div className="p-6 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {['', 'Draft', 'Ordered', 'Partially_Received', 'Received', 'Cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-brand-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
              {s === '' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">PO Number</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Paid</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              : pos.map(po => {
                const paid = po.payments.reduce((s, p) => s + Number(p.amount), 0);
                return (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium">{po.poNumber}</td>
                    <td className="px-4 py-3">{po.vendor.name}</td>
                    <td className="px-4 py-3"><span className={STATUS_COLORS[po.status] ?? 'badge-gray'}>{po.status.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(po.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(po.total))}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={paid >= Number(po.total) ? 'text-green-600' : 'text-orange-600'}>{formatCurrency(paid)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/purchase-orders/${po.id}`} className="text-brand-600 hover:underline text-xs">View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
