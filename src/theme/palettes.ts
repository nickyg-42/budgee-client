import {
  PERSONAL_FINANCE_CATEGORY_COLORS,
  PERSONAL_FINANCE_CATEGORIES,
  PersonalFinanceCategory,
} from '../constants/personalFinanceCategories';
import { ThemePalette } from './types';

/* =========================
   EARTH PALETTE
   ========================= */

export const earthPalette: ThemePalette = {
  semantic: {
    good: '#2f6f55',     // muted forest green
    bad: '#8c3a2b',      // clay red
    warn: '#b0893f',     // warm ochre
    neutral: '#8a8f85',  // soft stone gray
  },
  progress: {
    low: '#3f7d5a',
    mid: '#b8a46f',
    high: '#9c6b32',
    over: '#7a2e22',
  },
  categories: {} as any,
};

const earthColorMap: Record<PersonalFinanceCategory, string> = {
  INCOME: '#2f6f55',
  LOAN_DISBURSEMENTS: '#4a7c7a',
  LOAN_PAYMENTS: '#8c3a2b',
  TRANSFER_IN: '#3a6f5c',
  TRANSFER_OUT: '#4b5563',
  BANK_FEES: '#7a4a1d',
  ENTERTAINMENT: '#7c4a4a',
  FOOD_AND_DRINK: '#a36a2d',
  GENERAL_MERCHANDISE: '#6b7c3a',
  HOME_IMPROVEMENT: '#8b5a2b',
  MEDICAL: '#3d6f63',
  PERSONAL_CARE: '#5c6f3a',
  GENERAL_SERVICES: '#4a7c7a',
  GOVERNMENT_AND_NON_PROFIT: '#445a7c',
  TRANSPORTATION: '#8b5a2b',
  TRAVEL: '#3a6f5c',
  RENT_AND_UTILITIES: '#7a3f2b',
  OTHER: '#6b7280',
};

/* =========================
   PASTEL PALETTE (SOFT & COHESIVE)
   ========================= */

const pastelColorMap: Record<PersonalFinanceCategory, string> = {
  INCOME: '#c7e7d8',
  LOAN_DISBURSEMENTS: '#cfe4f2',
  LOAN_PAYMENTS: '#ddd6f3',
  TRANSFER_IN: '#c9eef0',
  TRANSFER_OUT: '#d4daf1',
  BANK_FEES: '#e6d8f0',
  ENTERTAINMENT: '#f2cfd6',
  FOOD_AND_DRINK: '#f3e2a6',
  GENERAL_MERCHANDISE: '#d6e4f5',
  HOME_IMPROVEMENT: '#ecd9a2',
  MEDICAL: '#d2ebe2',
  PERSONAL_CARE: '#d9eaf3',
  GENERAL_SERVICES: '#d1eff1',
  GOVERNMENT_AND_NON_PROFIT: '#cfe4f2',
  TRANSPORTATION: '#ecd9a2',
  TRAVEL: '#d2ebe2',
  RENT_AND_UTILITIES: '#f0d2b8',
  OTHER: '#e5e7eb',
};

export const pastelPalette: ThemePalette = {
  semantic: {
    good: '#7fbfa0',
    bad: '#e08a94',
    warn: '#e2c76f',
    neutral: '#9ca3af',
  },
  progress: {
    low: '#7fbfa0',
    mid: '#e2c76f',
    high: '#e6b27a',
    over: '#e07a7a',
  },
  categories: { ...pastelColorMap },
};

/* =========================
   DEFAULT (MODERN FINANCE)
   ========================= */

const defaultColorMap: Record<PersonalFinanceCategory, string> = {
  ...PERSONAL_FINANCE_CATEGORY_COLORS,
};

export const defaultPalette: ThemePalette = {
  semantic: {
    good: '#22a06b',    // refined green
    bad: '#d64545',     // less harsh red
    warn: '#e0a21a',    // warm amber
    neutral: '#6b7280',
  },
  progress: {
    low: '#22a06b',
    mid: '#e0a21a',
    high: '#c27c1a',
    over: '#c53030',
  },
  categories: { ...defaultColorMap },
};

/* =========================
   SLATE PALETTE (MODERN / SLEEK)
   ========================= */

export const slatePalette: ThemePalette = {
  semantic: {
    good: '#3f8f7a',     // cool teal-green
    bad: '#c94a4a',      // muted crimson
    warn: '#c08a2e',     // subdued amber
    neutral: '#64748b',  // slate gray
  },
  progress: {
    low: '#3f8f7a',
    mid: '#c08a2e',
    high: '#9a6b1f',
    over: '#b23b3b',
  },
  categories: {} as any,
};

const slateColorMap: Record<PersonalFinanceCategory, string> = {
  INCOME: '#3f8f7a',
  LOAN_DISBURSEMENTS: '#3b7c8c',
  LOAN_PAYMENTS: '#8c4a3a',
  TRANSFER_IN: '#2f7f73',
  TRANSFER_OUT: '#475569',
  BANK_FEES: '#7c5a2e',
  ENTERTAINMENT: '#7a4f6a',
  FOOD_AND_DRINK: '#a1783a',
  GENERAL_MERCHANDISE: '#5f7c3a',
  HOME_IMPROVEMENT: '#8b623a',
  MEDICAL: '#3a7c6f',
  PERSONAL_CARE: '#5c6b7a',
  GENERAL_SERVICES: '#3b7c8c',
  GOVERNMENT_AND_NON_PROFIT: '#3a5f8c',
  TRANSPORTATION: '#8b623a',
  TRAVEL: '#2f7f73',
  RENT_AND_UTILITIES: '#7a3f3f',
  OTHER: '#64748b',
};

/* =========================
   AURORA PALETTE (FRESH / PREMIUM)
   ========================= */

export const auroraPalette: ThemePalette = {
  semantic: {
    good: '#4db6ac',     // soft teal
    bad: '#e57373',      // gentle coral red
    warn: '#f2c94c',     // warm soft yellow
    neutral: '#8b95a1',  // cool gray-blue
  },
  progress: {
    low: '#4db6ac',
    mid: '#f2c94c',
    high: '#81a1e1',
    over: '#e06666',
  },
  categories: {} as any,
};

const auroraColorMap: Record<PersonalFinanceCategory, string> = {
  INCOME: '#4db6ac',
  LOAN_DISBURSEMENTS: '#81d4fa',
  LOAN_PAYMENTS: '#b39ddb',
  TRANSFER_IN: '#4dd0e1',
  TRANSFER_OUT: '#9fa8da',
  BANK_FEES: '#ce93d8',
  ENTERTAINMENT: '#f48fb1',
  FOOD_AND_DRINK: '#ffd54f',
  GENERAL_MERCHANDISE: '#90caf9',
  HOME_IMPROVEMENT: '#ffcc80',
  MEDICAL: '#80cbc4',
  PERSONAL_CARE: '#b3e5fc',
  GENERAL_SERVICES: '#80deea',
  GOVERNMENT_AND_NON_PROFIT: '#9fa8da',
  TRANSPORTATION: '#ffcc80',
  TRAVEL: '#80cbc4',
  RENT_AND_UTILITIES: '#ffab91',
  OTHER: '#cfd8dc',
};



/* =========================
   PALETTE SELECTOR
   ========================= */

export const getStaticPalette = (
  id: 'default' | 'earth' | 'pastel' | 'slate' | 'aurora'
): ThemePalette => {
  if (id === 'earth')
    return { ...earthPalette, categories: { ...earthColorMap } };
  if (id === 'pastel') 
    return { ...pastelPalette, categories: { ...pastelColorMap } };
  if (id === 'slate')
    return { ...slatePalette, categories: { ...slateColorMap } };
  if (id === 'aurora')
    return { ...auroraPalette, categories: { ...auroraColorMap } };
  return defaultPalette;
};

