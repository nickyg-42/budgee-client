import { useMemo } from 'react';
import { CategorySpending } from '../../types';
import { useTheme } from '../../theme/ThemeContext';
import { getCategoryLabelFromConstants } from '../../constants/personalFinanceCategories';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  data: CategorySpending[];
  height?: number;
  selectedMonth?: string;
}

export default function CategoryBreakdownBar({ data }: Props) {
  const { getCategoryColor } = useTheme();

  const items = useMemo(() => {
    const normalized = (data || [])
      .map((d) => ({ category: d.category, amount: Math.abs(Number(d.amount || 0)) }))
      .filter((d) => d.amount > 0);
    const total = normalized.reduce((s, x) => s + x.amount, 0);
    const sorted = normalized.sort((a, b) => b.amount - a.amount);
    const top = sorted.slice(0, 5);
    const remainder = sorted.slice(5);
    const otherTotal = remainder.reduce((s, x) => s + x.amount, 0);
    const withOther = otherTotal > 0 ? [...top, { category: 'OTHER', amount: otherTotal }] : top;
    return { total, entries: withOther };
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="w-full h-4 rounded-full bg-gray-200 overflow-hidden">
        <div className="flex h-full">
          {items.entries.map((e, idx) => {
            const pct = items.total > 0 ? (e.amount / items.total) * 100 : 0;
            return (
              <div
                key={`${e.category}-${idx}`}
                className="h-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: getCategoryColor(e.category),
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        {items.entries.map((e, idx) => {
          const label = e.category === 'OTHER' ? 'Other categories' : getCategoryLabelFromConstants(e.category);
          return (
            <div key={`${e.category}-legend-${idx}`} className="flex items-center justify-between">
              <div className="flex items-center">
                <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getCategoryColor(e.category) }}
                />
                <span className="text-sm text-gray-800">{label}</span>
              </div>
              <span className="text-sm text-gray-900">{formatCurrency(e.amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
