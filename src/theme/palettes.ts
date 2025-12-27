import { PERSONAL_FINANCE_CATEGORY_COLORS, PERSONAL_FINANCE_CATEGORIES, PersonalFinanceCategory } from '../constants/personalFinanceCategories';
import { ThemePalette } from './types';

export const earthPalette: ThemePalette = {
  semantic: {
    good: '#166534',
    bad: '#8b1a1a',
    warn: '#b45309',
    neutral: '#374151',
  },
  progress: {
    low: '#166534',
    mid: '#b45309',
    high: '#92400e',
    over: '#8b1a1a',
  },
  categories: {} as any,
};

const pastelColorMap: Record<PersonalFinanceCategory, string> = {
  INCOME: '#a7f3d0',
  LOAN_DISBURSEMENTS: '#bae6fd',
  LOAN_PAYMENTS: '#ddd6fe',
  TRANSFER_IN: '#a5f3fc',
  TRANSFER_OUT: '#c7d2fe',
  BANK_FEES: '#e9d5ff',
  ENTERTAINMENT: '#fecdd3',
  FOOD_AND_DRINK: '#fde68a',
  GENERAL_MERCHANDISE: '#bfdbfe',
  HOME_IMPROVEMENT: '#fde68a',
  MEDICAL: '#d1fae5',
  PERSONAL_CARE: '#e0f2fe',
  GENERAL_SERVICES: '#cffafe',
  GOVERNMENT_AND_NON_PROFIT: '#bae6fd',
  TRANSPORTATION: '#fde68a',
  TRAVEL: '#d1fae5',
  RENT_AND_UTILITIES: '#fed7aa',
  OTHER: '#e5e7eb',
};

export const pastelPalette: ThemePalette = {
  semantic: {
    good: '#86efac',
    bad: '#fda4af',
    warn: '#fcd34d',
    neutral: '#9ca3af',
  },
  progress: {
    low: '#86efac',
    mid: '#fcd34d',
    high: '#fdba74',
    over: '#f87171',
  },
  categories: { ...pastelColorMap },
};

const defaultColorMap: Record<PersonalFinanceCategory, string> = {
  ...PERSONAL_FINANCE_CATEGORY_COLORS,
};

const earthColorMap: Record<PersonalFinanceCategory, string> = {
  INCOME: '#166534',
  LOAN_DISBURSEMENTS: '#0f766e',
  LOAN_PAYMENTS: '#7c2d12',
  TRANSFER_IN: '#14532d',
  TRANSFER_OUT: '#374151',
  BANK_FEES: '#78350f',
  ENTERTAINMENT: '#8b1a1a',
  FOOD_AND_DRINK: '#b45309',
  GENERAL_MERCHANDISE: '#4d7c0f',
  HOME_IMPROVEMENT: '#92400e',
  MEDICAL: '#166534',
  PERSONAL_CARE: '#365314',
  GENERAL_SERVICES: '#0f766e',
  GOVERNMENT_AND_NON_PROFIT: '#1e3a8a',
  TRANSPORTATION: '#92400e',
  TRAVEL: '#14532d',
  RENT_AND_UTILITIES: '#7c2d12',
  OTHER: '#374151',
};

export const defaultPalette: ThemePalette = {
  semantic: {
    good: '#10b981',
    bad: '#ef4444',
    warn: '#f59e0b',
    neutral: '#6b7280',
  },
  progress: {
    low: '#10b981',
    mid: '#f59e0b',
    high: '#d97706',
    over: '#dc2626',
  },
  categories: { ...defaultColorMap },
};

export const getStaticPalette = (id: 'default' | 'earth' | 'pastel'): ThemePalette => {
  if (id === 'earth') return { ...earthPalette, categories: { ...earthColorMap } };
  if (id === 'pastel') return pastelPalette;
  return defaultPalette;
};
