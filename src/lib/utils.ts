import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatCurrency(amount: number | string | { toString(): string }): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount.toString());
  return `Rs ${num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateSaleNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `S-${date}-${seq}`;
}

export function generatePONumber(sequence: number): string {
  const year = new Date().getFullYear();
  const seq = sequence.toString().padStart(5, '0');
  return `PO-${year}-${seq}`;
}

export function generateRefundNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `REF-${date}-${seq}`;
}

export function generateAccountId(): string {
  return 'CUS-' + Math.floor(Math.random() * 999999).toString().padStart(6, '0');
}

export function daysUntilExpiry(expiryDate: Date | string): number {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getExpiryAlertLevel(days: number): 'expired' | 'urgent' | 'warning' | 'caution' | null {
  if (days <= 0) return 'expired';
  if (days <= 30) return 'urgent';
  if (days <= 60) return 'warning';
  if (days <= 90) return 'caution';
  return null;
}
