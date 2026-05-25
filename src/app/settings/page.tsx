'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';

export default function SettingsPage() {
  const [form, setForm] = useState({
    pharmacy_name: '', pharmacy_address: '', pharmacy_phone: '',
    pharmacy_gst: '', pharmacy_license: '', slip_footer: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => {
      setForm(f => ({ ...f, ...Object.fromEntries(Object.entries(s).map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])) }));
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const fields = [
    { key: 'pharmacy_name', label: 'Pharmacy Name' },
    { key: 'pharmacy_address', label: 'Address' },
    { key: 'pharmacy_phone', label: 'Phone Number' },
    { key: 'pharmacy_gst', label: 'GST Number' },
    { key: 'pharmacy_license', label: 'License Number' },
    { key: 'slip_footer', label: 'Receipt Footer Text', multiline: true },
  ];

  return (
    <AppShell>
      <PageHeader title="Settings" />
      <div className="p-6 max-w-xl space-y-6">
        {saved && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">Settings saved successfully.</div>}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Pharmacy Details</h2>
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              {f.multiline ? (
                <textarea className="input" rows={3} value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              ) : (
                <input className="input" value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              )}
            </div>
          ))}
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Settings'}</button>
        </div>
      </div>
    </AppShell>
  );
}
