import { useEffect, useMemo, useState } from 'react';
import { CategoryChart } from './CategoryChart';
import { Transaction } from '../../types';

interface YearlyCategoryChartProps {
  transactions?: Transaction[];
  title?: string;
  height?: number;
}

const asNumber = (v: any) => {
  const n = typeof v === 'number' ? v : v === undefined || v === null ? 0 : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safePrimaryCategory = (t: any) => (t?.primary_category ?? 'OTHER');

export const YearlyCategoryChart = ({
  transactions = [],
  title = 'Yearly Spending Breakdown',
  height = 520,
}: YearlyCategoryChartProps) => {
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (let i = 0; i < 5; i++) {
      const y = String(currentYear - i);
      opts.push({ value: y, label: y });
    }
    return opts;
  }, [currentYear]);

  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  useEffect(() => {
    setSelectedYear(String(currentYear));
  }, [currentYear]);

  const yearTxns = useMemo(() => {
    const y = selectedYear;
    return (transactions || []).filter((t: any) => {
      const s = String((t as any)?.date || '');
      if (s.length < 4) return false;
      const ty = s.slice(0, 4);
      return ty === y;
    });
  }, [transactions, selectedYear]);

  const data = useMemo(() => {
    const grouped = new Map<string, number>();
    (yearTxns || []).forEach((t: any) => {
      if ((t as any)?.expense === true) {
        const amt = Math.abs(asNumber((t as any)?.amount));
        const cat = safePrimaryCategory(t);
        grouped.set(cat, (grouped.get(cat) || 0) + amt);
      }
    });
    const entries = Array.from(grouped.entries());
    if (entries.length === 0) {
      return [{ category: 'DEFAULT', amount: -0, percentage: 0 }];
    }
    return entries.map(([category, amount]) => ({ category, amount: -amount, percentage: 0 }));
  }, [yearTxns]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {yearOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <CategoryChart
        data={data as any}
        height={height}
        transactionsForMonth={yearTxns as any}
        selectedMonth={selectedYear}
      />
    </div>
  );
};

