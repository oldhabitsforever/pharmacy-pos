'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import { formatCurrency, formatDate, daysUntilExpiry, getExpiryAlertLevel } from '@/lib/utils';

export default function InventoryPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [adjustId, setAdjustId] = useState('');
  const [adjustment, setAdjustment] = useState('');

  const load = async () => { const r = await fetch(`/api/inventory?q=${encodeURIComponent(q)}`); setBatches(await r.json()); };
  useEffect(() => { load(); }, [q]);

  const doAdjust = async (id: string) => {
    const qty = parseInt(adjustment);
    if (isNaN(qty)) return;
    await fetch('/api/inventory/adjust', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ batchId: id, adjustment: qty }) });
    setAdjustId(''); setAdjustment(''); load();
  };

  const expiryBadge = (expiryDate: string | null) => {
    if (!expiryDate) return <span className="text-gray-400">—</span>;
    const days = daysUntilExpiry(expiryDate);
    const level = getExpiryAlertLevel(days);
    const cls = level === 'expired' || level === 'urgent' ? 'badge-red' : level === 'warning' ? 'badge-yellow' : 'badge-gray';
    return <span className={cls}>{formatDate(expiryDate)}{level ? ` (${days <= 0 ? 'Expired' : days + 'd'})` : ''}</span>;
  };

  return (
    <AppShell>
      <PageHeader title="Inventory" subtitle={`${batches.length} batches`} />
      <div className="p-6 space-y-4">
        <input className="input max-w-sm" placeholder="Search product..." value={q} onChange={e => setQ(e.target.value)} />
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200"><tr>
              {['Product','Batch #','Expiry','Qty Remaining','Cost/Unit','Total Value','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-600">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {batches.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{b.product.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{b.batchNumber??'—'}</td>
                  <td className="px-4 py-3">{expiryBadge(b.expiryDate)}</td>
                  <td className="px-4 py-3">
                    {adjustId === b.id ? (
                      <div className="flex gap-1 items-center">
                        <input type="number" className="input w-20 text-xs" placeholder="±qty" value={adjustment} onChange={e => setAdjustment(e.target.value)} />
                        <button onClick={() => doAdjust(b.id)} className="btn-primary py-1 px-2 text-xs">OK</button>
                        <button onClick={() => setAdjustId('')} className="btn-secondary py-1 px-2 text-xs">✕</button>
                      </div>
                    ) : (
                      <span className={b.quantityRemainingBaseUnits <= 10 ? 'text-red-600 font-medium' : 'text-gray-900'}>{b.quantityRemainingBaseUnits}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(Number(b.costPerBaseUnit))}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(b.quantityRemainingBaseUnits * Number(b.costPerBaseUnit))}</td>
                  <td className="px-4 py-3"><button onClick={() => { setAdjustId(b.id); setAdjustment(''); }} className="text-xs text-brand-600 hover:text-brand-800">Adjust</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
