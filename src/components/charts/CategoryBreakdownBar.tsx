import { useMemo, useState } from 'react';
import { CategorySpending, Transaction } from '../../types';
import { useTheme } from '../../theme/ThemeContext';
import { getCategoryLabelFromConstants, getAnyCategoryLabel } from '../../constants/personalFinanceCategories';
import { formatCurrency } from '../../utils/formatters';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { generateSubcategoryColors } from '../../utils/colorUtils';

interface Props {
  data: CategorySpending[];
  height?: number;
  selectedMonth?: string;
  transactionsForMonth?: Transaction[];
}

export default function CategoryBreakdownBar({ data, transactionsForMonth = [] }: Props) {
  const { getCategoryColor } = useTheme();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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

  const detailedForCategory = useMemo(() => {
    if (!expandedCategory) return [];
    const map = new Map<string, number>();
    (transactionsForMonth || []).forEach((t: any) => {
      if ((t as any)?.expense !== true) return;
      if (String((t as any)?.primary_category || '') !== expandedCategory) return;
      const dc = String((t as any)?.detailed_category || 'Other');
      map.set(dc, (map.get(dc) || 0) + Math.abs(Number((t as any)?.amount || 0)));
    });
    return Array.from(map.entries())
      .map(([cat, amount]) => ({ category: cat, label: getAnyCategoryLabel(cat), amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expandedCategory, transactionsForMonth]);

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
      <div className="space-y-1">
        {items.entries.map((e, idx) => {
          const label = e.category === 'OTHER' ? 'Other categories' : getCategoryLabelFromConstants(e.category);
          const isExpanded = expandedCategory === e.category;
          const canExpand = e.category !== 'OTHER';
          return (
            <div key={`${e.category}-legend-${idx}`}>
              <button
                className="flex items-center justify-between w-full py-1.5 hover:bg-gray-50 rounded px-1"
                onClick={() => canExpand && setExpandedCategory(isExpanded ? null : e.category)}
              >
                <div className="flex items-center">
                  {canExpand ? (
                    isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-1" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 mr-1" />
                  ) : (
                    <span className="w-5 mr-1" />
                  )}
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getCategoryColor(e.category) }}
                  />
                  <span className="text-sm text-gray-800">{label}</span>
                </div>
                <span className="text-sm text-gray-900">{formatCurrency(e.amount)}</span>
              </button>
              {isExpanded && detailedForCategory.length > 1 && (() => {
                const subColors = generateSubcategoryColors(getCategoryColor(e.category), detailedForCategory.length);
                return (
                  <div className="pl-8 space-y-1 mb-1">
                    {detailedForCategory.map((d, di) => (
                      <div key={d.category} className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center">
                          <span
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: subColors[di] }}
                          />
                          <span>{d.label}</span>
                        </div>
                        <span>{formatCurrency(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
