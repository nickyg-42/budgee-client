import { PersonalFinanceCategory } from '../constants/personalFinanceCategories';

export type ThemeId = 'default' | 'earth' | 'pastel' | 'monochrome';

export interface ThemePalette {
  semantic: {
    good: string;
    bad: string;
    warn: string;
    neutral: string;
  };
  progress: {
    low: string;
    mid: string;
    high: string;
    over: string;
  };
  categories: Record<PersonalFinanceCategory, string>;
}
