import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export function formatCurrency(
  amount: number | string,
  currency: string = 'INR',
  symbol?: string
): string {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;

  if (symbol && symbol.trim()) {
    return `${symbol}${numericAmount.toFixed(2)}`;
  }

  const code = (currency || 'INR').toUpperCase().trim();

  if (code === 'INR' || code === 'RS' || code === 'RUPEES' || code === 'RUPEE' || code === '₹') {
    return `₹${numericAmount.toFixed(2)}`;
  }
  if (code === 'USD' || code === '$') {
    return `$${numericAmount.toFixed(2)}`;
  }
  if (code === 'EUR' || code === '€') {
    return `€${numericAmount.toFixed(2)}`;
  }
  if (code === 'GBP' || code === '£') {
    return `£${numericAmount.toFixed(2)}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
    }).format(numericAmount);
  } catch (e) {
    return `${code} ${numericAmount.toFixed(2)}`;
  }
}
