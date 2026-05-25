'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Sale {
  id: string; saleNumber: string; saleDate: string; status: string; total: number;
  customer?: { name: string }; cashier: { fullName: string };
  lines: Array<{ id: string; quantity: number; refundedQuantity: number; unitPriceSnapshot: number; product: { name: string }; productUnit: { unitName: string } }>;
}

export default function RefundsPage() {
  const [saleNumber, setSaleNumber] = useState('');
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLines, setSelectedLines] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState('');

  const lookupSale = async () => {
    setError(''); setSale(null); setSuccess('');
    setLoading(true);
    const res = await fetch(`/api/sales?saleNumber=${encodeURIComponent(saleNumber)}`);
    const data = await res.json();
    setLoading(false);
    const found = Array.isArray(data) ? data.find((s: Sale) => s.saleNumber === saleNumber) : null;
    if (!found) { setError('Sale not found'); return; }
    if (found.status === 'Voided' || found.status === 'Refunded') { setError('This sale cannot be refunded'); return; }
    const days = Math.floor((Date.now() - new Date(found.saleDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 7) { setError('Refund period expired (7 days)'); return; }
    setSale(found);
    const initLines: Record<string, number> = {};
    for (const l of found.lines) { initLines[l.id] = l.quantity - l.refundedQuantity; }
    setSelectedLines(initLines);
  };

  const processRefund = async () => {
    if (!sale) return;
    setLoading(true);
    const lines = Object.entries(selectedLines).filter(([, q]) => q > 0).map(([saleLineId, quantity]) => ({ saleLineId, quantity }));
    const res = await fetch('/api/refunds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saleId: sale.id, lines, reason }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess('Refund processed successfully.');
      setSale(null); setSaleNumber(''); setReason('');
    } else {
      const d = await res.json();
      setError(d.error ?? 'Refund failed');
    }
  };

  const refundTotal = sale ? sale.lines.reduce((s, l) => s + (selectedLines[l.id] ?? 0) * Number(l.unitPriceSnapshot), 0) : 0;

  return (
    <AppShell>
      <PageHeader title="Refunds" subtitle="7-day refund policy — Admin only" />
      <div className="p-6 max-w-2xl space-y-6">
        {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Look Up Sale</h2>
          <div className="flex gap-3">
            <input className="input" placeholder="Enter sale number (e.g. S-20260524-00123)" value={saleNumber}
              onChange={e => setSaleNumber(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookupSale()} />
            <button onClick={lookupSale} disabled={loading} className="btn-primary whitespace-nowrap">Look Up</button>
          </div>
        </div>

        {sale && (
          <div className="card p-5 space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-gray-900">{sale.saleNumber}</p>
                <p className="text-sm text-gray-500">{formatDate(sale.saleDate)} · {sale.cashier.fullName}</p>
                {sale.customer && <p className="text-sm text-gray-600">{sale.customer.name}</p>}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(Number(sale.total))}</p>
                <span className="badge-blue">{sale.status}</span>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2">Item</th>
                  <th className="pb-2 text-center">Original Qty</th>
                  <th className="pb-2 text-center">Refund Qty</th>
                  <th className="pb-2 text-right">Refund Amt</th>
                </tr>
              </thead>
              <tbody>
                {sale.lines.map(l => {
                  const remaining = l.quantity - l.refundedQuantity;
                  return (
                    <tr key={l.id} className="border-b border-gray-50">
                      <td className="py-2">{l.product.name} ({l.productUnit.unitName})</td>
                      <td className="py-2 text-center">{l.quantity}</td>
                      <td className="py-2 text-center">
                        <input type="number" min="0" max={remaining} className="input w-16 text-center text-xs" value={selectedLines[l.id] ?? 0}
                          onChange={e => setSelectedLines(prev => ({ ...prev, [l.id]: Math.min(parseInt(e.target.value) || 0, remaining) }))} />
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency((selectedLines[l.id] ?? 0) * Number(l.unitPriceSnapshot))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 text-right font-bold">Refund Total:</td>
                  <td className="pt-3 text-right font-bold text-brand-600">{formatCurrency(refundTotal)}</td>
                </tr>
              </tfoot>
            </table>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Customer return reason..." />
            </div>

            <button onClick={processRefund} disabled={loading || refundTotal === 0} className="btn-primary">
              {loading ? 'Processing...' : `Process Refund — ${formatCurrency(refundTotal)}`}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
