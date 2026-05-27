'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

const adminNav = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'POS / Sales', href: '/pos', icon: '🛒' },
  { label: 'Products', href: '/products', icon: '💊' },
  { label: 'Inventory', href: '/inventory', icon: '📦' },
  { label: 'Customers', href: '/customers', icon: '👥' },
  { label: 'Vendors', href: '/vendors', icon: '🏭' },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: '📋' },
  { label: 'Refunds', href: '/refunds', icon: '↩️' },
  { label: 'Reports', href: '/reports', icon: '📈' },
  { label: 'Users', href: '/users', icon: '👤' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

const cashierNav = [
  { label: 'POS / Sales', href: '/pos', icon: '🛒' },
];

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const nav = role === 'admin' ? adminNav : cashierNav;

  return (
    <aside className={cn("w-56 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-20 transition-transform duration-300", isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">Rx</div>
          <span className="font-semibold text-gray-900 text-sm">Pharmacy POS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold">
            {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{session?.user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-xs text-gray-500 hover:text-red-600 transition-colors text-left px-1"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
