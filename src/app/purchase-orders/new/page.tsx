'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import { formatCurrency } from '@/lib/utils';

interface Vendor { id: string; name: string }
interface Product { id: string; name: string; genericName?: string; units: Array<{ id: string; unitName: string; retailPrice: number; isBaseUnit: boolean }> }
interface LineItem { productId: string; productName: string; orderedUnitId: string; unitName: string; orderedQuantity: number; agreedUnitPrice: number }

export default function NewPOPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch('/api/vendors').then(r => r.json()).then(setVendors); }, []);

  useEffect(() => {
    if (productSearch.length < 2) { setProducts([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(productSearch)}&limit=10`).then(r => r.json()).then(d => setProducts(d.products ?? []));
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const addProduct = (p: Product) => {
    const defaultUnit = p.units[0];
    if (!defaultUnit) return;
    setLines(prev => [...prev, {
      productId: p.id, productName: p.name,
      orderedUnitId: defaultUnit.id, unitName: defaultUnit.unitName,
      orderedQuantity: 1, agreedUnitPrice: 0,
    }]);
    setProductSearch('');
    setProducts([]);
  };

  const updateLine = (i: number, field: string, value: any) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const subtotal = lines.reduce((s, l) => s + l.orderedQuantity * l.agreedUnitPrice, 0);

  const submit = async (status: 'Draft' | 'Ordered') => {
    if (!vendorId || lines.length === 0) return;
    setLoading(true);
    const res = await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId, lines, notes, expectedReceiveDate: expectedDate, status }),
    });
    if (res.ok) {
      const po = await res.json();
      if (status === 'Ordered') {
        await fetch(`/api/purchase-orders/${po.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Ordered', orderedDate: new Date().toISOString() }) });
      }
      router.push(`/purchase-orders/${po.id}`);
    }
    setLoading(false);
  };

  return (
    <AppShell>
      <PageHeader title="New Purchase Order" />
      <div className="p-6 max-w-4xl space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Order Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
              <select className="input" value={vendorId} onChange={e => setVendorId(e.target.value)}>
                <option value="">Select vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
              <input type="date" className="input" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Line Items</h2>
          <div className="relative">
            <input className="input" placeholder="Search product to add..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
            {products.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {products.map(p => (
                  <button key={p.id} onClick={() => addProduct(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm">
                    <span className="font-medium">{p.name}</span>
                    {p.genericName && <span className="text-gray-500 ml-1">({p.genericName})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {lines.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Unit</th>
                  <th className="pb-2">Quantity</th>
                  <th className="pb-2">Unit Price (Rs)</th>
                  <th className="pb-2 text-right">Line Total</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 pr-2 font-medium">{line.productName}</td>
                    <td className="py-2 pr-2">
                      <select className="input text-xs" value={line.orderedUnitId} onChange={e => updateLine(i, 'orderedUnitId', e.target.value)}>
                        <option value={line.orderedUnitId}>{line.unitName}</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" min="1" className="input w-20" value={line.orderedQuantity}
                        onChange={e => updateLine(i, 'orderedQuantity', parseInt(e.target.value))} />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" min="0" step="0.01" className="input w-28" value={line.agreedUnitPrice}
                        onChange={e => updateLine(i, 'agreedUnitPrice', parseFloat(e.target.value))} />
                    </td>
                    <td className="py-2 text-right font-medium">{formatCurrency(line.orderedQuantity * line.agreedUnitPrice)}</td>
                    <td className="py-2 pl-2">
                      <button onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="pt-3 text-right font-semibold text-gray-700">Subtotal:</td>
                  <td className="pt-3 text-right font-bold text-gray-900">{formatCurrency(subtotal)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => submit('Draft')} disabled={loading || !vendorId || lines.length === 0} className="btn-secondary">Save as Draft</button>
          <button onClick={() => submit('Ordered')} disabled={loading || !vendorId || lines.length === 0} className="btn-primary">Mark as Ordered</button>
          <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </AppShell>
  );
}
