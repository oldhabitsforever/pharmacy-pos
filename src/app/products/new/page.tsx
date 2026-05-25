'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';

interface ProductType { id: string; name: string }
interface UnitRow { unitName: string; level: number; conversionRatioToBase: number; retailPrice: number; isDirectlySellable: boolean; isBaseUnit: boolean; sortOrder: number }

const DEFAULT_UNIT_TEMPLATES: Record<string, UnitRow[]> = {
  'Tablet/Capsule': [
    { unitName: 'Box', level: 1, conversionRatioToBase: 200, retailPrice: 0, isDirectlySellable: true, isBaseUnit: false, sortOrder: 0 },
    { unitName: 'Strip', level: 2, conversionRatioToBase: 10, retailPrice: 0, isDirectlySellable: true, isBaseUnit: false, sortOrder: 1 },
    { unitName: 'Tablet', level: 3, conversionRatioToBase: 1, retailPrice: 0, isDirectlySellable: true, isBaseUnit: true, sortOrder: 2 },
  ],
  'Syrup/Liquid': [
    { unitName: 'Bottle', level: 1, conversionRatioToBase: 120, retailPrice: 0, isDirectlySellable: true, isBaseUnit: false, sortOrder: 0 },
    { unitName: 'ml', level: 2, conversionRatioToBase: 1, retailPrice: 0, isDirectlySellable: false, isBaseUnit: true, sortOrder: 1 },
  ],
  default: [
    { unitName: 'Unit', level: 1, conversionRatioToBase: 1, retailPrice: 0, isDirectlySellable: true, isBaseUnit: true, sortOrder: 0 },
  ],
};

export default function NewProductPage() {
  const router = useRouter();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [units, setUnits] = useState<UnitRow[]>(DEFAULT_UNIT_TEMPLATES.default);
  const [form, setForm] = useState({
    name: '', genericName: '', manufacturer: '', productTypeId: '',
    barcode: '', category: '', isPrescription: false, isResellableOnReturn: false,
    notes: '', lowStockThreshold: 10,
  });

  useEffect(() => {
    fetch('/api/product-types').then(r => r.json()).then(setProductTypes);
  }, []);

  const onTypeChange = (typeId: string) => {
    setForm(f => ({ ...f, productTypeId: typeId }));
    const typeName = productTypes.find(t => t.id === typeId)?.name ?? '';
    setUnits(DEFAULT_UNIT_TEMPLATES[typeName] ?? DEFAULT_UNIT_TEMPLATES.default);
  };

  const updateUnit = (i: number, field: keyof UnitRow, value: any) => {
    setUnits(u => u.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };

  const addUnit = () => {
    setUnits(u => [...u, { unitName: '', level: u.length + 1, conversionRatioToBase: 1, retailPrice: 0, isDirectlySellable: true, isBaseUnit: false, sortOrder: u.length }]);
  };

  const removeUnit = (i: number) => {
    setUnits(u => u.filter((_, idx) => idx !== i));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Ensure exactly one base unit
    const baseUnits = units.filter(u => u.isBaseUnit);
    if (baseUnits.length !== 1) {
      setError('Exactly one unit must be marked as the base unit.');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, units }),
    });

    if (res.ok) {
      router.push('/products');
    } else {
      const data = await res.json();
      setError(JSON.stringify(data.error));
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Add New Product" />
      <div className="p-6 max-w-3xl">
        <form onSubmit={submit} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                <input className="input" value={form.genericName} onChange={e => setForm(f => ({ ...f, genericName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                <input className="input" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                <select className="input" value={form.productTypeId} onChange={e => onTypeChange(e.target.value)}>
                  <option value="">Select type...</option>
                  {productTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                <input className="input font-mono" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="Scan or enter barcode" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert Threshold</label>
                <input className="input" type="number" min="0" value={form.lowStockThreshold} onChange={e => setForm(f => ({ ...f, lowStockThreshold: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPrescription} onChange={e => setForm(f => ({ ...f, isPrescription: e.target.checked }))} className="w-4 h-4 text-brand-600" />
                <span className="text-sm text-gray-700">Prescription required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isResellableOnReturn} onChange={e => setForm(f => ({ ...f, isResellableOnReturn: e.target.checked }))} className="w-4 h-4 text-brand-600" />
                <span className="text-sm text-gray-700">Resellable on return</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>

          {/* Units */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Unit Hierarchy</h2>
                <p className="text-xs text-gray-500 mt-0.5">Define how this product is sold (e.g., Box → Strip → Tablet)</p>
              </div>
              <button type="button" onClick={addUnit} className="btn-secondary text-sm">+ Add Unit</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2">Unit Name</th>
                    <th className="pb-2">Base Units in 1</th>
                    <th className="pb-2">Retail Price (Rs)</th>
                    <th className="pb-2 text-center">Sellable</th>
                    <th className="pb-2 text-center">Base Unit</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {units.map((u, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 pr-2">
                        <input className="input" value={u.unitName} onChange={e => updateUnit(i, 'unitName', e.target.value)} placeholder="e.g. Strip" />
                      </td>
                      <td className="py-2 pr-2">
                        <input className="input" type="number" min="1" value={u.conversionRatioToBase}
                          onChange={e => updateUnit(i, 'conversionRatioToBase', parseInt(e.target.value))}
                          disabled={u.isBaseUnit} />
                      </td>
                      <td className="py-2 pr-2">
                        <input className="input" type="number" min="0" step="0.01" value={u.retailPrice}
                          onChange={e => updateUnit(i, 'retailPrice', parseFloat(e.target.value))} />
                      </td>
                      <td className="py-2 pr-2 text-center">
                        <input type="checkbox" checked={u.isDirectlySellable}
                          onChange={e => updateUnit(i, 'isDirectlySellable', e.target.checked)} />
                      </td>
                      <td className="py-2 pr-2 text-center">
                        <input type="radio" name="baseUnit" checked={u.isBaseUnit}
                          onChange={() => setUnits(prev => prev.map((row, idx) => ({ ...row, isBaseUnit: idx === i, conversionRatioToBase: idx === i ? 1 : row.conversionRatioToBase })))} />
                      </td>
                      <td className="py-2">
                        <button type="button" onClick={() => removeUnit(i)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Product'}</button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
