'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import { formatCurrency } from '@/lib/utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'', discountPercentage:0 });
  const [loading, setLoading] = useState(false);

  const load = async () => { const r = await fetch(`/api/customers?q=${encodeURIComponent(q)}`); setCustomers(await r.json()); };
  useEffect(() => { load(); }, [q]);

  const save = async () => {
    setLoading(true);
    await fetch('/api/customers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    setLoading(false); setShowForm(false); setForm({ name:'', phone:'', email:'', address:'', discountPercentage:0 }); load();
  };

  return (
    <AppShell>
      <PageHeader title="Customers" subtitle={`${customers.length} customers`} action={<button onClick={() => setShowForm(true)} className="btn-primary">+ Add Customer</button>} />
      <div className="p-6 space-y-4">
        <input className="input max-w-sm" placeholder="Search by name, phone or account ID..." value={q} onChange={e => setQ(e.target.value)} />
        {showForm && (
          <div className="card p-5 space-y-3 max-w-lg">
            <h2 className="font-semibold text-gray-900">New Customer</h2>
            {['name','phone','email','address'].map(f => (
              <div key={f}><label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{f}</label>
                <input className="input" value={(form as any)[f]} onChange={e => setForm(p => ({...p,[f]:e.target.value}))} /></div>
            ))}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
              <input type="number" min="0" max="100" className="input" value={form.discountPercentage} onChange={e => setForm(p => ({...p,discountPercentage:parseFloat(e.target.value)||0}))} /></div>
            <div className="flex gap-2"><button onClick={save} disabled={loading||!form.name} className="btn-primary">{loading?'Saving...':'Save'}</button><button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button></div>
          </div>
        )}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200"><tr>
              {['Account ID','Name','Phone','Email','Discount','Credit Balance','Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-600">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.accountId}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone??'—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email??'—'}</td>
                  <td className="px-4 py-3">{Number(c.discountPercentage)>0?<span className="badge-green">{Number(c.discountPercentage)}%</span>:'—'}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(c.creditBalance))}</td>
                  <td className="px-4 py-3"><span className={c.isActive?'badge-green':'badge-gray'}>{c.isActive?'Active':'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
