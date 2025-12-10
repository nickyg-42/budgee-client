import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
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

export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    return format(date, 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

export const formatShortDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    return format(date, 'MMM yyyy');
  } catch {
    return dateString;
  }
};

export const getRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
};

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

export const getCategoryColor = (category: string): string => {
  const key = (category || '').toUpperCase().replace(/\s+/g, '_');
  const colors: Record<string, string> = {
    TRANSPORTATION: '#F59E0B',
    TRAVEL: '#10B981',
    FOOD_AND_DRINK: '#8B5CF6',
    ENTERTAINMENT: '#EF4444',
    TRANSFER_OUT: '#6366F1',
    INCOME: '#22C55E',
    LOAN_PAYMENTS: '#6D28D9',
    GENERAL_MERCHANDISE: '#3B82F6',
    PERSONAL_CARE: '#60A5FA',
    RENT_AND_UTILITIES: '#F97316',
    DEFAULT: '#9CA3AF'
  };
  return colors[key] || colors.DEFAULT;
};

export const getUniqueCategoryColorMap = (categories: string[]): Record<string, string> => {
  const unique = Array.from(new Set((categories || []).filter(Boolean)));
  const sorted = unique.slice().sort((a, b) => a.localeCompare(b));
  const palette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#60A5FA', '#06B6D4', '#84CC16',
    '#A855F7', '#D946EF', '#F97316', '#22D3EE', '#65A30D', '#4ADE80', '#C026D3', '#FB7185',
    '#0EA5E9', '#14B8A6', '#E11D48', '#7C3AED'
  ];
  const used = new Set<string>();
  const map: Record<string, string> = {};
  let idx = 0;
  for (const cat of sorted) {
    let color = getCategoryColor(cat);
    if (used.has(color)) {
      while (idx < palette.length && used.has(palette[idx])) idx++;
      color = palette[idx % palette.length];
      idx++;
    }
    used.add(color);
    map[cat] = color;
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
    if (transaction.amount > 0) {
      const category = transaction.primary_category || 'OTHER';
      grouped[category] = (grouped[category] || 0) + transaction.amount;
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
