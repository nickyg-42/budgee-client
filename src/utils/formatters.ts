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
  const colors: Record<string, string> = {
    'GENERAL MERCHANDISE': '#3B82F6',
    'ENTERTAINMENT': '#EF4444',
    'TRAVEL': '#10B981',
    'TRANSPORTATION': '#F59E0B',
    'FOOD_AND_DRINK': '#8B5CF6',
    'SHOPS': '#EC4899',
    'RECREATION': '#06B6D4',
    'SERVICE': '#84CC16',
  };
  
  return colors[category] || '#6B7280';
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
    const category = transaction.primary_category || 'OTHER';
    grouped[category] = (grouped[category] || 0) + Math.abs(transaction.amount);
  });
  
  return Object.entries(grouped)
    .map(([category, amount]) => ({
      category,
      amount: -amount, // Make negative for expense display
      percentage: 0 // Will be calculated later
    }))
    .sort((a, b) => a.amount - b.amount);
};