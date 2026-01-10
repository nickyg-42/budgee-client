import { format, formatDistanceToNow, isValid } from 'date-fns';
import { Transaction } from '../types';

export const formatCurrency = (amount: number): string => {
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absoluteAmount);
  
  return isNegative ? `-$${formatted.slice(1)}` : `$${formatted.slice(1)}`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const parseYMD = (dateString: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  return isValid(date) ? date : null;
};

export const formatDate = (dateString: string): string => {
  try {
    const date = parseYMD(dateString);
    if (!date) return dateString;
    return format(date, 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

export const formatShortDate = (dateString: string): string => {
  try {
    const date = parseYMD(dateString);
    if (!date) return dateString;
    return format(date, 'MMM yyyy');
  } catch {
    return dateString;
  }
};

export const getRelativeTime = (dateString: string): string => {
  try {
    const date = parseYMD(dateString);
    if (!date) return dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
};

export const monthKey = (dateString: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!m) return dateString;
  return `${m[1]}-${m[2]}`;
};

export const monthLabel = (dateString: string): string => {
  const date = parseYMD(dateString);
  if (!date) return dateString;
  return format(date, 'MMM yyyy');
};

export const formatYMD = (dateString: string): string => {
  const date = parseYMD(dateString);
  if (!date) return dateString.slice(0, 10);
  return format(date, 'yyyy-MM-dd');
};

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

import { getCategoryColorFromConstants } from '../constants/personalFinanceCategories';
export const getCategoryColor = (category: string): string => getCategoryColorFromConstants(category);

export const getUniqueCategoryColorMap = (categories: string[]): Record<string, string> => {
  const unique = Array.from(new Set((categories || []).filter(Boolean)));
  const map: Record<string, string> = {};
  for (const cat of unique) {
    map[cat] = getCategoryColor(cat);
  }
  return map;
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export const groupTransactionsByCategory = (transactions: Transaction[]) => {
  const grouped: Record<string, number> = {};

  transactions.forEach(transaction => {
    if (transaction.expense === true) {
      const category = transaction.primary_category || 'OTHER';
      const amt = Math.abs(transaction.amount || 0);
      grouped[category] = (grouped[category] || 0) + amt;
    }
  });

  return Object.entries(grouped)
    .map(([category, amount]) => ({
      category,
      amount: -amount,
      percentage: 0
    }))
    .sort((a, b) => a.amount - b.amount);
};
