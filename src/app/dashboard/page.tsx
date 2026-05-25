'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { formatCurrency, formatDate, daysUntilExpiry, getExpiryAlertLevel } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/dashboard').then(r => r.json()).then(setData); }, []);
  if (!data) return <AppShell><div className="p-6 text-gray-400 animate-pulse">Loading dashboard...</div></AppShell>;

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's Sales</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(Number(data.todaySales.total))}</p>
            <p className="text-sm text-gray-500 mt-0.5">{data.todaySales.count} transactions</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Products</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalProducts}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">⚠️ Low Stock</h2>
            {data.lowStock.length === 0 ? <p className="text-sm text-gray-400">All good!</p> :
              <ul className="space-y-2">{data.lowStock.map((b: any) => (
                <li key={b.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{b.product.name}</span>
                  <span className="badge-red">{b.quantityRemainingBaseUnits} left</span>
                </li>
              ))}</ul>}
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">📅 Expiring Soon</h2>
            {data.expiringBatches.length === 0 ? <p className="text-sm text-gray-400">None expiring</p> :
              <ul className="space-y-2">{data.expiringBatches.map((b: any) => {
                const days = daysUntilExpiry(b.expiryDate);
                const level = getExpiryAlertLevel(days);
                return (
                  <li key={b.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{b.product.name}</span>
                    <span className={level === 'urgent' || level === 'expired' ? 'badge-red' : 'badge-yellow'}>{days <= 0 ? 'Expired' : `${days}d`}</span>
                  </li>
                );
              })}</ul>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Recent Sales</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="pb-2">Sale #</th><th className="pb-2">Date</th><th className="pb-2">Customer</th><th className="pb-2">Cashier</th><th className="pb-2 text-right">Total</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentSales.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-2 font-mono text-xs">{s.saleNumber}</td>
                  <td className="py-2 text-gray-500">{formatDate(s.saleDate)}</td>
                  <td className="py-2">{s.customer?.name ?? '—'}</td>
                  <td className="py-2 text-gray-500">{s.cashier.fullName}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(Number(s.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
