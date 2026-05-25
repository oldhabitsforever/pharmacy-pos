'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import { formatCurrency, formatDate } from '@/lib/utils';

type ReportType = 'sales' | 'inventory' | 'vendor-balance';

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>('sales');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const res = await fetch(`/api/reports?${params}`);
    setData(await res.json());
    setLoading(false);
  };

  const exportCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = [headers.join(','), ...data.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${type}-report.csv`; a.click();
  };

  const REPORT_TYPES: [ReportType, string][] = [['sales', 'Sales Report'], ['inventory', 'Inventory Report'], ['vendor-balance', 'Vendor Balances']];

  return (
    <AppShell>
      <PageHeader title="Reports" />
      <div className="p-6 space-y-4">
        {/* Controls */}
        <div className="card p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Report Type</label>
            <select className="input" value={type} onChange={e => { setType(e.target.value as ReportType); setData([]); }}>
              {REPORT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {type === 'sales' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
              </div>
            </>
          )}
          <button onClick={run} disabled={loading} className="btn-primary">{loading ? 'Loading...' : 'Run Report'}</button>
          {data.length > 0 && <button onClick={exportCSV} className="btn-secondary">Export CSV</button>}
        </div>

        {data.length > 0 && (
          <div className="card overflow-hidden">
            {type === 'sales' && (
              <>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex gap-6 text-sm">
                  <span>Total Sales: <strong>{formatCurrency(data.reduce((s, r) => s + r.total, 0))}</strong></span>
                  <span>Transactions: <strong>{data.length}</strong></span>
                  <span>Total Profit: <strong className="text-green-600">{formatCurrency(data.reduce((s, r) => s + r.profit, 0))}</strong></span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Sale #', 'Date', 'Cashier', 'Customer', 'Status', 'Subtotal', 'Discount', 'Total', 'Profit'].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 text-xs">
                        <td className="px-3 py-2 font-mono">{r.saleNumber}</td>
                        <td className="px-3 py-2">{formatDate(r.date)}</td>
                        <td className="px-3 py-2">{r.cashier}</td>
                        <td className="px-3 py-2">{r.customer}</td>
                        <td className="px-3 py-2"><span className="badge-gray">{r.status}</span></td>
                        <td className="px-3 py-2">{formatCurrency(r.subtotal)}</td>
                        <td className="px-3 py-2 text-green-600">{r.discount > 0 ? `-${formatCurrency(r.discount)}` : '—'}</td>
                        <td className="px-3 py-2 font-medium">{formatCurrency(r.total)}</td>
                        <td className="px-3 py-2 text-green-600">{formatCurrency(r.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {type === 'inventory' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['Product', 'Generic', 'Batch #', 'Expiry', 'Qty', 'Cost/Unit', 'Total Value'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 text-xs">
                      <td className="px-3 py-2 font-medium">{r.product}</td>
                      <td className="px-3 py-2 text-gray-500">{r.genericName}</td>
                      <td className="px-3 py-2 font-mono">{r.batchNumber}</td>
                      <td className="px-3 py-2">{r.expiryDate ? formatDate(r.expiryDate) : '—'}</td>
                      <td className="px-3 py-2">{r.quantity}</td>
                      <td className="px-3 py-2">{formatCurrency(r.costPerUnit)}</td>
                      <td className="px-3 py-2 font-medium">{formatCurrency(r.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {type === 'vendor-balance' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['Vendor', 'Total PO Value', 'Total Paid', 'Outstanding'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.vendor}</td>
                      <td className="px-4 py-3">{formatCurrency(r.totalPO)}</td>
                      <td className="px-4 py-3 text-green-600">{formatCurrency(r.totalPaid)}</td>
                      <td className="px-4 py-3">
                        <span className={r.outstanding > 0 ? 'text-orange-600 font-bold' : 'text-gray-400'}>{formatCurrency(r.outstanding)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
