import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '../../types';
import { formatCurrency, formatYMD } from '../../utils/formatters';
import { getCategoryLabelFromConstants, getDetailedCategoryLabelFromConstants } from '../../constants/personalFinanceCategories';

interface DetailedStackedBarsChartProps {
  transactionsForMonth: Transaction[];
  selectedMonth: string;
  height?: number;
  topDetailedCount?: number;
}

type Selection = { primary: string; detailed?: string; amount: number; label: string } | null;

const PALETTE = [
  '#4F46E5', '#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6',
  '#14B8A6', '#6366F1', '#F97316', '#10B981', '#A855F7', '#3B82F6'
];

export const DetailedStackedBarsChart = ({
  transactionsForMonth = [],
  selectedMonth = '',
  height = 520,
  topDetailedCount = 6,
}: DetailedStackedBarsChartProps) => {
  const expenses = useMemo(() => (transactionsForMonth || []).filter(t => (t as any).expense === true), [transactionsForMonth]);

  const { rows, stackKeys, keyToColor, primaryTotals } = useMemo(() => {
    // Global totals per detailed category across the month
    const detailedTotals = new Map<string, number>();
    const primarySet = new Set<string>();
    for (const t of expenses) {
      const d = String(t.detailed_category || '');
      const amt = Math.abs(Number((t as any).amount || 0));
      if (d) detailedTotals.set(d, (detailedTotals.get(d) || 0) + amt);
      primarySet.add(String(t.primary_category || 'OTHER'));
    }
    const sortedDetailed = Array.from(detailedTotals.entries()).sort((a, b) => b[1] - a[1]);
    const topKeys = sortedDetailed.slice(0, Math.max(1, topDetailedCount)).map(([k]) => k);
    const stackKeys = [...topKeys, 'Other'];
    const keyToColor: Record<string, string> = {};
    stackKeys.forEach((k, i) => { keyToColor[k] = PALETTE[i % PALETTE.length]; });

    // Per primary totals and rows
    const primaryTotals = new Map<string, number>();
    const perPrimaryPerDetailed = new Map<string, Map<string, number>>();
    for (const t of expenses) {
      const p = String(t.primary_category || 'OTHER');
      const d = String(t.detailed_category || '');
      const amt = Math.abs(Number((t as any).amount || 0));
      primaryTotals.set(p, (primaryTotals.get(p) || 0) + amt);
      const inner = perPrimaryPerDetailed.get(p) || new Map<string, number>();
      if (d) inner.set(d, (inner.get(d) || 0) + amt);
      perPrimaryPerDetailed.set(p, inner);
    }
    const rows = Array.from(primarySet.values()).map((p) => {
      const inner = perPrimaryPerDetailed.get(p) || new Map<string, number>();
      const base: any = {
        primaryKey: p,
        primaryLabel: getCategoryLabelFromConstants(p),
      };
      let otherSum = 0;
      stackKeys.forEach((key) => {
        if (key === 'Other') return;
        base[key] = inner.get(key) || 0;
      });
      // Sum remaining detailed into Other
      inner.forEach((val, key) => {
        if (!topKeys.includes(key)) otherSum += val;
      });
      base['Other'] = otherSum;
      return base;
    }).sort((a, b) => (primaryTotals.get(b.primaryKey) || 0) - (primaryTotals.get(a.primaryKey) || 0));

    return { rows, stackKeys, keyToColor, primaryTotals };
  }, [expenses, topDetailedCount]);

  const [selection, setSelection] = useState<Selection>(null);

  const filteredTxns = useMemo(() => {
    if (!selection) return [];
    const list = (transactionsForMonth || []).filter((t: any) => {
      if ((t as any)?.expense !== true) return false;
      if (String((t as any)?.primary_category || 'OTHER') !== selection.primary) return false;
      if (!selection.detailed) {
        // Other: include those detailed not in stack keys
        const d = String((t as any)?.detailed_category || '');
        return d && !stackKeys.includes(d);
      }
      return String((t as any)?.detailed_category || '') === selection.detailed;
    });
    return list
      .slice()
      .sort((a: any, b: any) => Math.abs(Number((b as any)?.amount || 0)) - Math.abs(Number((a as any)?.amount || 0)));
  }, [transactionsForMonth, selection, stackKeys]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const p = payload[0]?.payload;
      const total = stackKeys.reduce((s, k) => s + (Number(p?.[k] || 0)), 0);
      const items = payload.filter((entry: any) => entry?.value > 0);
      return (
        <div className="rounded-md bg-white border border-gray-200 p-2 text-xs">
          <div className="font-semibold text-gray-800 mb-1">{p?.primaryLabel}</div>
          {items.map((entry: any, idx: number) => {
            const key = entry?.dataKey;
            const val = Number(entry?.value || 0);
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            const label = key === 'Other' ? 'Other' : getDetailedCategoryLabelFromConstants(key);
            return (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: keyToColor[key] }} />
                  <span className="text-gray-700">{label}</span>
                </div>
                <div className="text-gray-900">{formatCurrency(val)} ({pct}%)</div>
              </div>
            );
          })}
          <div className="mt-1 text-gray-600">Total: {formatCurrency(total)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">Detailed Segments • {selectedMonth}</div>
        {selection && (
          <div className="text-sm text-gray-900">
            {selection.label}: {formatCurrency(selection.amount)}
          </div>
        )}
      </div>
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
            <XAxis dataKey="primaryLabel" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {stackKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="spent"
                fill={keyToColor[key]}
                onClick={(data: any) => {
                  const amount = Number(data?.[key] || 0);
                  const label = key === 'Other' ? 'Other' : getDetailedCategoryLabelFromConstants(key);
                  setSelection({
                    primary: String(data?.primaryKey || 'OTHER'),
                    detailed: key === 'Other' ? undefined : key,
                    amount,
                    label: `${data?.primaryLabel} • ${label}`,
                  });
                }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4">
        {selection ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700">
                Showing {filteredTxns.length} transaction{filteredTxns.length !== 1 ? 's' : ''} for {selection.label} • {selectedMonth}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-600">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTxns.map((t: any) => (
                    <tr key={String((t as any).id)}>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium text-gray-900">{String((t as any).name || (t as any).merchant_name || 'Unknown')}</div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">{formatYMD(String((t as any).date || ''))}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900 text-right">{formatCurrency(Math.abs(Number((t as any).amount || 0)))}</td>
                    </tr>
                  ))}
                  {filteredTxns.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-600" colSpan={3}>No transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-600 text-center">Click a segment to view transactions</div>
        )}
      </div>
    </div>
  );
};
