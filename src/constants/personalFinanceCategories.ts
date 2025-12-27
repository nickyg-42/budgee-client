export const PERSONAL_FINANCE_CATEGORIES = [
  'INCOME',
  'LOAN_DISBURSEMENTS',
  'LOAN_PAYMENTS',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'BANK_FEES',
  'ENTERTAINMENT',
  'FOOD_AND_DRINK',
  'GENERAL_MERCHANDISE',
  'HOME_IMPROVEMENT',
  'MEDICAL',
  'PERSONAL_CARE',
  'GENERAL_SERVICES',
  'GOVERNMENT_AND_NON_PROFIT',
  'TRANSPORTATION',
  'TRAVEL',
  'RENT_AND_UTILITIES',
  'OTHER',
] as const;

export type PersonalFinanceCategory = typeof PERSONAL_FINANCE_CATEGORIES[number];

export const PERSONAL_FINANCE_CATEGORY_COLORS: Record<PersonalFinanceCategory, string> = {
  INCOME: '#22C55E',
  LOAN_DISBURSEMENTS: '#0EA5E9',
  LOAN_PAYMENTS: '#6D28D9',
  TRANSFER_IN: '#14B8A6',
  TRANSFER_OUT: '#6366F1',
  BANK_FEES: '#A855F7',
  ENTERTAINMENT: '#EF4444',
  FOOD_AND_DRINK: '#8B5CF6',
  GENERAL_MERCHANDISE: '#3B82F6',
  HOME_IMPROVEMENT: '#F59E0B',
  MEDICAL: '#10B981',
  PERSONAL_CARE: '#60A5FA',
  GENERAL_SERVICES: '#06B6D4',
  GOVERNMENT_AND_NON_PROFIT: '#0EA5E9',
  TRANSPORTATION: '#F59E0B',
  TRAVEL: '#10B981',
  RENT_AND_UTILITIES: '#F97316',
  OTHER: '#9CA3AF',
};

export const getCategoryColorFromConstants = (category: string): string => {
  const key = String(category || 'OTHER') as PersonalFinanceCategory;
  return PERSONAL_FINANCE_CATEGORY_COLORS[key] ?? PERSONAL_FINANCE_CATEGORY_COLORS.OTHER;
};

export const PERSONAL_FINANCE_CATEGORY_LABELS: Record<PersonalFinanceCategory, string> = {
  INCOME: 'Income',
  LOAN_DISBURSEMENTS: 'Loan Disbursements',
  LOAN_PAYMENTS: 'Loan Payments',
  TRANSFER_IN: 'Transfer In',
  TRANSFER_OUT: 'Transfer Out',
  BANK_FEES: 'Bank Fees',
  ENTERTAINMENT: 'Entertainment',
  FOOD_AND_DRINK: 'Food & Drink',
  GENERAL_MERCHANDISE: 'General Merchandise',
  HOME_IMPROVEMENT: 'Home Improvement',
  MEDICAL: 'Medical',
  PERSONAL_CARE: 'Personal Care',
  GENERAL_SERVICES: 'General Services',
  GOVERNMENT_AND_NON_PROFIT: 'Government & Non-Profit',
  TRANSPORTATION: 'Transportation',
  TRAVEL: 'Travel',
  RENT_AND_UTILITIES: 'Rent & Utilities',
  OTHER: 'Other',
};

export const getCategoryLabelFromConstants = (category: string): string => {
  const key = String(category || 'OTHER') as PersonalFinanceCategory;
  return PERSONAL_FINANCE_CATEGORY_LABELS[key] ?? PERSONAL_FINANCE_CATEGORY_LABELS.OTHER;
};

export const PERSONAL_FINANCE_CATEGORY_OPTIONS: { value: PersonalFinanceCategory; label: string }[] =
  (PERSONAL_FINANCE_CATEGORIES as readonly PersonalFinanceCategory[]).map((c) => ({
    value: c,
    label: PERSONAL_FINANCE_CATEGORY_LABELS[c],
  }));
