'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { formatCurrency } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface Product {
  id: string; name: string; genericName?: string; barcode?: string;
  units: Array<{ id: string; unitName: string; retailPrice: number; isDirectlySellable: boolean; isBaseUnit: boolean }>;
  inventoryBatches: Array<{ quantityRemainingBaseUnits: number }>;
}
interface CartItem {
  productId: string; productName: string;
  unitId: string; unitName: string; unitPrice: number;
  quantity: number; lineTotal: number;
}
interface Customer { id: string; name: string; phone?: string; accountId: string; discountPercentage: number }

export default function POSPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [adminDiscount, setAdminDiscount] = useState(0);
  const [pharmacyName, setPharmacyName] = useState('Al-Shifa Pharmacy');

  const searchRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Load pharmacy name
  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s.pharmacy_name) setPharmacyName(s.pharmacy_name);
    }).catch(() => {});
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F2') { e.preventDefault(); customerSearchRef.current?.focus(); }
      if (e.key === 'F4') { e.preventDefault(); if (cart.length > 0) completeSale(); }
      if (e.key === 'Escape') { e.preventDefault(); if (confirm('Clear cart?')) clearCart(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart]);

  // Product search
  useEffect(() => {
    if (search.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/products?q=${encodeURIComponent(search)}&limit=8`);
      const data = await res.json();
      setSearchResults(data.products ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  // Customer search
  useEffect(() => {
    if (customerSearch.length < 2) { setCustomerResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(customerSearch)}`);
      setCustomerResults(await res.json());
    }, 200);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const addToCart = (product: Product, unitId: string) => {
    const unit = product.units.find(u => u.id === unitId);
    if (!unit) return;
    setCart(prev => {
      const existing = prev.findIndex(i => i.productId === product.id && i.unitId === unitId);
      if (existing >= 0) {
        return prev.map((item, i) => i === existing
          ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * item.unitPrice }
          : item
        );
      }
      return [...prev, {
        productId: product.id, productName: product.name,
        unitId, unitName: unit.unitName, unitPrice: Number(unit.retailPrice),
        quantity: 1, lineTotal: Number(unit.retailPrice),
      }];
    });
    setSearch('');
    setSearchResults([]);
    searchRef.current?.focus();
  };

  const updateQty = (i: number, qty: number) => {
    if (qty <= 0) { removeItem(i); return; }
    setCart(prev => prev.map((item, idx) => idx === i ? { ...item, quantity: qty, lineTotal: qty * item.unitPrice } : item));
  };

  const removeItem = (i: number) => setCart(prev => prev.filter((_, idx) => idx !== i));

  const clearCart = () => {
    setCart([]);
    setCustomer(null);
    setCustomerSearch('');
    setAmountPaid('');
    setAdminDiscount(0);
    setLastSale(null);
    searchRef.current?.focus();
  };

  // Totals
  const subtotal = cart.reduce((s, i) => s + i.lineTotal, 0);
  const discountPct = customer ? Number(customer.discountPercentage) : (role === 'admin' ? adminDiscount : 0);
  const discountAmt = subtotal * discountPct / 100;
  const total = subtotal - discountAmt;
  const change = parseFloat(amountPaid || '0') - total;

  const completeSale = async () => {
    if (cart.length === 0 || parseFloat(amountPaid || '0') < total) return;
    setLoading(true);
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: customer?.id,
        discountPercentage: discountPct,
        amountPaid: parseFloat(amountPaid),
        lines: cart.map(i => ({
          productId: i.productId, productUnitId: i.unitId,
          quantity: i.quantity, unitPrice: i.unitPrice,
        })),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setLastSale({ ...data, subtotal, discountAmt, total, amountPaid: parseFloat(amountPaid), change, customer, pharmacyName, cart: [...cart] });
      setShowReceipt(true);
    } else {
      alert(data.error ?? 'Sale failed');
    }
  };

  if (showReceipt && lastSale) {
    return (
      <AppShell>
        <div className="p-6 max-w-sm mx-auto">
          <div id="receipt" className="bg-white border border-gray-200 rounded-xl p-6 font-mono text-xs">
            <div className="text-center mb-4">
              <p className="font-bold text-base">{lastSale.pharmacyName}</p>
              <p className="text-gray-500">Sale #{lastSale.saleNumber}</p>
              <p className="text-gray-500">{new Date(lastSale.saleDate ?? Date.now()).toLocaleString()}</p>
              {lastSale.customer && <p className="text-gray-600 mt-1">Customer: {lastSale.customer.name}</p>}
            </div>
            <div className="border-t border-dashed border-gray-300 my-3" />
            {lastSale.cart.map((item: CartItem, i: number) => (
              <div key={i} className="flex justify-between mb-1">
                <span>{item.productName} × {item.quantity} {item.unitName}</span>
                <span>{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-gray-300 my-3" />
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(lastSale.subtotal)}</span></div>
            {lastSale.discountAmt > 0 && <div className="flex justify-between text-green-700"><span>Discount ({discountPct}%)</span><span>-{formatCurrency(lastSale.discountAmt)}</span></div>}
            <div className="flex justify-between font-bold text-sm mt-1"><span>TOTAL</span><span>{formatCurrency(lastSale.total)}</span></div>
            <div className="flex justify-between mt-1"><span>Cash</span><span>{formatCurrency(lastSale.amountPaid)}</span></div>
            <div className="flex justify-between"><span>Change</span><span>{formatCurrency(lastSale.change)}</span></div>
            <div className="border-t border-dashed border-gray-300 my-3" />
            <p className="text-center text-gray-500">Thank you! Returns within 7 days with slip.</p>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => window.print()} className="btn-secondary flex-1">Print Receipt</button>
            <button onClick={clearCart} className="btn-primary flex-1">New Sale</button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-screen flex overflow-hidden" style={{ height: 'calc(100vh - 0px)' }}>
        {/* Left — Product search + cart */}
        <div className="flex-1 flex flex-col border-r border-gray-200 overflow-hidden">
          {/* Search bar */}
          <div className="p-3 bg-white border-b border-gray-200">
            <div className="relative">
              <input
                ref={searchRef}
                type="search"
                placeholder="F1 — Search product by name or scan barcode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 text-sm"
                autoFocus
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-72 overflow-y-auto w-96">
                {searchResults.map(p => {
                  const stock = p.inventoryBatches.reduce((s, b) => s + b.quantityRemainingBaseUnits, 0);
                  const sellableUnits = p.units.filter(u => u.isDirectlySellable);
                  return (
                    <div key={p.id} className="px-4 py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-medium text-sm">{p.name}</span>
                          {p.genericName && <span className="text-xs text-gray-500 ml-1">({p.genericName})</span>}
                        </div>
                        <span className={`text-xs ${stock === 0 ? 'text-red-500' : 'text-gray-500'}`}>Stock: {stock}</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {sellableUnits.map(u => (
                          <button key={u.id} onClick={() => addToCart(p, u.id)} disabled={stock === 0}
                            className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded hover:bg-brand-100 disabled:opacity-40 disabled:cursor-not-allowed">
                            {u.unitName} — {formatCurrency(u.retailPrice)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Search or scan a product above</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Item</th>
                    <th className="text-center px-2 py-2 font-medium text-gray-600">Qty</th>
                    <th className="text-right px-2 py-2 font-medium text-gray-600">Price</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-600">Total</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cart.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.unitName}</p>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateQty(i, item.quantity - 1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">−</button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button onClick={() => updateQty(i, item.quantity + 1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">+</button>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                      <td className="px-2 py-2.5">
                        <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right — Customer + Payment */}
        <div className="w-72 bg-white flex flex-col">
          {/* Customer section */}
          <div className="p-4 border-b border-gray-200">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer (F2)</label>
            {customer ? (
              <div className="bg-brand-50 rounded-lg p-3 flex items-start justify-between">
                <div>
                  <p className="font-medium text-brand-900 text-sm">{customer.name}</p>
                  {customer.phone && <p className="text-xs text-brand-600">{customer.phone}</p>}
                  {customer.discountPercentage > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">{Number(customer.discountPercentage)}% discount applied</p>
                  )}
                </div>
                <button onClick={() => { setCustomer(null); setCustomerSearch(''); }} className="text-brand-400 hover:text-brand-600 text-sm">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  ref={customerSearchRef}
                  type="search"
                  placeholder="Name, phone or account ID..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="input text-sm"
                />
                {customerResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {customerResults.map(c => (
                      <button key={c.id} onClick={() => { setCustomer(c); setCustomerSearch(''); setCustomerResults([]); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone} · {c.accountId}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Admin discount */}
          {role === 'admin' && !customer && (
            <div className="px-4 py-3 border-b border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Manual Discount %</label>
              <input type="number" min="0" max="100" className="input text-sm" value={adminDiscount}
                onChange={e => setAdminDiscount(parseFloat(e.target.value) || 0)} />
            </div>
          )}

          {/* Totals */}
          <div className="p-4 border-b border-gray-200 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({discountPct}%)</span><span>-{formatCurrency(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-100">
              <span>TOTAL</span><span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cash Received</label>
              <input
                ref={amountRef}
                type="number"
                min="0"
                step="0.01"
                className="input text-lg font-bold"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {parseFloat(amountPaid || '0') >= total && total > 0 && (
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-green-600">Change</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(change)}</p>
              </div>
            )}
            <button
              onClick={completeSale}
              disabled={loading || cart.length === 0 || parseFloat(amountPaid || '0') < total || total === 0}
              className="btn-primary w-full text-base py-3"
            >
              {loading ? 'Processing...' : 'Complete Sale (F4)'}
            </button>
            <button onClick={clearCart} className="btn-secondary w-full text-sm">Clear Cart (Esc)</button>
          </div>

          {/* Shortcuts reminder */}
          <div className="mt-auto p-3 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
            <p><kbd className="bg-gray-100 px-1 rounded">F1</kbd> Search product</p>
            <p><kbd className="bg-gray-100 px-1 rounded">F2</kbd> Attach customer</p>
            <p><kbd className="bg-gray-100 px-1 rounded">F4</kbd> Complete sale</p>
            <p><kbd className="bg-gray-100 px-1 rounded">Esc</kbd> Clear cart</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
