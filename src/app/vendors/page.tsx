'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';

interface Vendor {
  id: string; name: string; contactPerson?: string; phone?: string;
  paymentTerms?: string; isActive: boolean;
  _count: { purchaseOrders: number };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', address: '', gstNumber: '', paymentTerms: 'Net 30', notes: '' });

  useEffect(() => {
    fetch(`/api/vendors?q=${encodeURIComponent(search)}`).then(r => r.json()).then(setVendors).finally(() => setLoading(false));
  }, [search]);

  const save = async () => {
    const res = await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      const v = await res.json();
      setVendors(prev => [v, ...prev]);
      setShowNew(false);
      setForm({ name: '', contactPerson: '', phone: '', address: '', gstNumber: '', paymentTerms: 'Net 30', notes: '' });
    }
  };

  return (
    <AppShell>
      <PageHeader title="Vendors" subtitle={`${vendors.length} vendors`}
        action={<button onClick={() => setShowNew(true)} className="btn-primary">+ Add Vendor</button>} />
      <div className="p-6 space-y-4">
        {showNew && (
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">New Vendor</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input className="input" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input className="input" value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <input className="input" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} className="btn-primary">Save</button>
              <button onClick={() => setShowNew(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        <input type="search" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} className="input max-w-sm" />

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Terms</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">POs</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td></tr>
              : vendors.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{v.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    {v.contactPerson && <p className="text-gray-700">{v.contactPerson}</p>}
                    {v.phone && <p className="text-xs text-gray-500">{v.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.paymentTerms ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{v._count.purchaseOrders}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/vendors/${v.id}`} className="text-brand-600 hover:underline text-xs">View</Link>
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
