'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';

interface User { id: string; username: string; fullName: string; role: string; isActive: boolean; createdAt: string }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ username: '', fullName: '', password: '', role: 'cashier' });

  const load = () => fetch('/api/users').then(r => r.json()).then(setUsers);
  useEffect(() => { load(); }, []);

  const save = async () => {
    await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowNew(false); setForm({ username: '', fullName: '', password: '', role: 'cashier' }); load();
  };

  return (
    <AppShell>
      <PageHeader title="User Management" action={<button onClick={() => setShowNew(true)} className="btn-primary">+ Add User</button>} />
      <div className="p-6 space-y-4">
        {showNew && (
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold">New User</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                <input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input className="input" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select></div>
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="btn-primary text-sm">Save</button>
              <button onClick={() => setShowNew(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{u.username}</td>
                  <td className="px-4 py-3"><span className={u.role === 'admin' ? 'badge-blue' : 'badge-gray'}>{u.role}</span></td>
                  <td className="px-4 py-3"><span className={u.isActive ? 'badge-green' : 'badge-red'}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
