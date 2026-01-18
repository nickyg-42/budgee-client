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
    bad: '#74a792ff',      // clay red
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
  INCOME: '#2F4F3E',                 // Forest Green
  LOAN_DISBURSEMENTS: '#7B8A5A',     // Moss Green
  LOAN_PAYMENTS: '#5C3A2E',          // Walnut Brown
  TRANSFER_IN: '#9BAF8A',            // Sage Green
  TRANSFER_OUT: '#8A8D84',           // Stone Gray
  BANK_FEES: '#3F2A23',              // Dark Umber
  ENTERTAINMENT: '#B88A5A',          // Soft Ochre
  FOOD_AND_DRINK: '#C9A27E',          // Desert Clay
  GENERAL_MERCHANDISE: '#D8CBB0',    // Warm Linen
  HOME_IMPROVEMENT: '#8F4A32',       // Terracotta
  MEDICAL: '#6F7C45',                // Olive Leaf
  PERSONAL_CARE: '#E6D8B8',          // Sandstone
  GENERAL_SERVICES: '#5E625C',       // Warm Slate
  GOVERNMENT_AND_NON_PROFIT: '#7A3F2C', // Rust
  TRANSPORTATION: '#A45A3F',         // Burnt Sienna
  TRAVEL: '#B88A5A',                 // Soft Ochre (warm, aspirational)
  RENT_AND_UTILITIES: '#1F3A2D',     // Deep Pine
  OTHER: '#6B7280',                  
};

/* =========================
   PASTEL PALETTE (SOFT & COHESIVE)
   ========================= */

const pastelColorMap: Record<PersonalFinanceCategory, string> = {
  INCOME: '#B8E0D2',                     // mint green
  LOAN_DISBURSEMENTS: '#A7C7E7',         // pastel blue
  LOAN_PAYMENTS: '#F7B2B7',              // soft rose
  TRANSFER_IN: '#A8DADC',                // pastel teal
  TRANSFER_OUT: '#CDB4DB',               // lavender
  BANK_FEES: '#FAD4AF',                  // peach
  ENTERTAINMENT: '#F8C8DC',              // pink
  FOOD_AND_DRINK: '#FDE49E',             // pastel yellow
  GENERAL_MERCHANDISE: '#BFD7EA',        // powder blue
  HOME_IMPROVEMENT: '#F7C59F',           // apricot
  MEDICAL: '#F5E6CC',                    // soft mint
  PERSONAL_CARE: '#E9D5FF',              // lilac
  GENERAL_SERVICES: '#E0FBFC',           // ice
  GOVERNMENT_AND_NON_PROFIT: '#CDE7FB',  // baby blue
  TRANSPORTATION: '#F8D5A3',             // pastel orange
  TRAVEL: '#BEE3DB',                     // seafoam
  RENT_AND_UTILITIES: '#CDEDE0',         // warm beige
  OTHER: '#E5E7EB',                      // light gray
};

export const pastelPalette: ThemePalette = {
  semantic: {
    good: '#B795E4',
    bad: '#dccdf0ff',
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
    good: '#2563eb',    
    bad: '#93c5fd',     
    warn: '#e0a21a',    
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
    good: '#2D1E3A',     // cool teal-green
    bad: '#746780ff',      // muted crimson
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
    good: '#faa2d5',     // soft teal
    bad: '#f8d9ebff',      // gentle coral red
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
