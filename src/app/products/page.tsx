'use client';

import { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  barcode?: string;
  category?: string;
  isPrescription: boolean;
  isActive: boolean;
  productType?: { name: string };
  units: Array<{ unitName: string; retailPrice: number; isBaseUnit: boolean; conversionRatioToBase: number }>;
  inventoryBatches: Array<{ quantityRemainingBaseUnits: number }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/products?q=${encodeURIComponent(debouncedSearch)}&limit=50`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  function getStockDisplay(product: Product) {
    const totalBase = product.inventoryBatches.reduce((s, b) => s + b.quantityRemainingBaseUnits, 0);
    const baseUnit = product.units.find(u => u.isBaseUnit);
    if (!baseUnit) return `${totalBase} units`;
    return `${totalBase} ${baseUnit.unitName}`;
  }

  return (
    <AppShell>
      <PageHeader
        title="Products"
        subtitle={`${total} products in catalog`}
        action={
          <Link href="/products/new" className="btn-primary">+ Add Product</Link>
        }
      />
      <div className="p-6 space-y-4">
        <input
          type="search"
          placeholder="Search by name, generic name, barcode, manufacturer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input max-w-md"
        />

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type / Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Units & Prices</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Rx</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No products found</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.genericName && <p className="text-xs text-gray-500">{p.genericName}</p>}
                    {p.manufacturer && <p className="text-xs text-gray-400">{p.manufacturer}</p>}
                    {p.barcode && <p className="text-xs text-gray-400 font-mono">{p.barcode}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {p.productType && <span className="badge-blue">{p.productType.name}</span>}
                    {p.category && <p className="text-xs text-gray-500 mt-1">{p.category}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {p.units.slice(0, 3).map(u => (
                        <div key={u.unitName} className="text-xs text-gray-600">
                          {u.unitName}: <span className="font-medium">{formatCurrency(u.retailPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${
                      p.inventoryBatches.reduce((s, b) => s + b.quantityRemainingBaseUnits, 0) === 0
                        ? 'text-red-600' : 'text-gray-900'
                    }`}>{getStockDisplay(p)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.isPrescription ? <span className="badge-red">Rx</span> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/products/${p.id}`} className="text-brand-600 hover:underline text-xs">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
