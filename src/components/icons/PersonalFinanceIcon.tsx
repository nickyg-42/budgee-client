import React from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Music2,
  Utensils,
  ShoppingBag,
  Hammer,
  Heart,
  Sparkles,
  Wrench,
  Landmark,
  Car,
  Plane,
  Home,
  Circle,
} from 'lucide-react';
import { type PersonalFinanceCategory, getCategoryColorFromConstants } from '../../constants/personalFinanceCategories';
import type { LucideProps } from 'lucide-react';

type IconComponent = React.ComponentType<LucideProps>;

const CATEGORY_ICONS: Record<PersonalFinanceCategory, IconComponent> = {
  INCOME: Wallet,
  LOAN_DISBURSEMENTS: ArrowDownRight,
  LOAN_PAYMENTS: ArrowUpRight,
  TRANSFER_IN: ArrowDownRight,
  TRANSFER_OUT: ArrowUpRight,
  BANK_FEES: Banknote,
  ENTERTAINMENT: Music2,
  FOOD_AND_DRINK: Utensils,
  GENERAL_MERCHANDISE: ShoppingBag,
  HOME_IMPROVEMENT: Hammer,
  MEDICAL: Heart,
  PERSONAL_CARE: Sparkles,
  GENERAL_SERVICES: Wrench,
  GOVERNMENT_AND_NON_PROFIT: Landmark,
  TRANSPORTATION: Car,
  TRAVEL: Plane,
  RENT_AND_UTILITIES: Home,
  OTHER: Circle,
};

export const PersonalFinanceIcon: React.FC<{
  category: string;
  size?: number;
  className?: string;
  color?: string;
}> = ({ category, size = 24, className, color }) => {
  const key = (String(category || 'OTHER') as PersonalFinanceCategory) || 'OTHER';
  const Icon = CATEGORY_ICONS[key] ?? Circle;
  const iconColor = color ?? getCategoryColorFromConstants(key);
  return <Icon size={size} className={className} color={iconColor} />;
};
