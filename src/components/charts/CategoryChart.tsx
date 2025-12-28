import { useMemo, useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { CategorySpending } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getCategoryLabelFromConstants } from '../../constants/personalFinanceCategories';
import { useTheme } from '../../theme/ThemeContext';
import { Transaction } from '../../types';

interface CategoryChartProps {
  data: CategorySpending[];
  title?: string;
  height?: number;
  legend?: boolean;
  outerRadius?: number;
  innerRadius?: number;
  transactionsForMonth?: Transaction[];
  selectedMonth?: string;
}

export const CategoryChart = ({
  data,
  title,
  height = 380,
  outerRadius,
  innerRadius,
  transactionsForMonth = [],
  selectedMonth = '',
}: CategoryChartProps) => {
  const { getCategoryColor } = useTheme();
  const chartData = useMemo(() => data.map(item => ({
    name: getCategoryLabelFromConstants(item.category),
    rawName: item.category,
    value: Math.abs(item.amount),
    color: getCategoryColor(item.category)
  })), [data]);
  const totalSpent = useMemo(() => chartData.reduce((s, i) => s + (Number(i.value) || 0), 0), [chartData]);
  const [selected, setSelected] = useState<{ name: string; value: number; color: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedRaw, setSelectedRaw] = useState<string | null>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setContainerSize({ w: rect.width, h: rect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);
  const computedOuter = useMemo(() => {
    const base = Math.min(containerSize.w || 0, containerSize.h || height) / 2 - 50; // this controls chart size
    return Math.max(90, Math.floor(base));
  }, [containerSize, height]);
  const finalOuter = useMemo(() => outerRadius ?? computedOuter ?? 100, [outerRadius, computedOuter]);
  const finalInner = useMemo(() => innerRadius ?? Math.max(50, Math.floor(finalOuter * 0.42)), [innerRadius, finalOuter]);
  const startAnimation = (to: number, onDone?: () => void) => {
    const from = animProgress;
    const duration = 180;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = from + (to - from) * eased;
      setAnimProgress(val);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        setAnimProgress(to);
        onDone && onDone();
      }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
  };
  const renderActiveShape = (props: any) => {
    return <Sector {...props} outerRadius={(props.outerRadius || 0) + Math.round(8 * animProgress)} innerRadius={props.innerRadius} cornerRadius={6} />;
  };
  const legendData = useMemo(() => {
    return [...chartData].sort((a, b) => Number(b.value) - Number(a.value));
  }, [chartData]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filteredTxns = useMemo(() => {
    if (!selectedRaw) return [];
    const list = (transactionsForMonth || []).filter((t: any) => {
      if ((t as any)?.expense !== true) return false;
      const cat = String((t as any)?.primary_category || 'OTHER');
      return cat === selectedRaw;
    });
    return list
      .slice()
      .sort((a: any, b: any) => Math.abs(Number((b as any)?.amount || 0)) - Math.abs(Number((a as any)?.amount || 0)));
  }, [transactionsForMonth, selectedRaw]);
  const totalPages = Math.max(1, Math.ceil(filteredTxns.length / pageSize));
  const paged = filteredTxns.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div ref={containerRef} className="w-full relative pb-6" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={finalOuter}
              innerRadius={finalInner}
              fill="#8884d8"
              stroke="none"
              dataKey="value"
              activeShape={renderActiveShape}
              activeIndex={selectedIndex === null ? undefined : selectedIndex}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  cursor="pointer"
                  onClick={() => {
                    if (selectedIndex === index) {
                      startAnimation(0, () => {
                        setSelected(null);
                        setSelectedIndex(null);
                        setSelectedRaw(null);
                        setPage(1);
                      });
                    } else {
                      setSelected({ name: entry.name, value: Number(entry.value) || 0, color: entry.color });
                      setSelectedIndex(index);
                      setSelectedRaw(entry.rawName);
                      setPage(1);
                      setAnimProgress(0);
                      startAnimation(1);
                    }
                  }}
                  opacity={selectedIndex === null ? 1 : (selectedIndex === index ? 1 : 0.6)}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span
              className="mx-auto mb-1 block w-5 h-5 rounded-full border border-gray-200"
              style={{ backgroundColor: selected?.color || 'transparent' }}
            />
            <div className="text-xs text-gray-500">{selected ? selected.name : 'Total spent'}</div>
            <div className="text-lg font-semibold text-gray-900">{formatCurrency(selected ? selected.value : totalSpent)}</div>
          </div>
        </div>
      </div>
      <div className="mt-4 mb-0 flex flex-wrap gap-3 justify-center">
        {legendData.map((entry) => (
          <button
            key={entry.rawName}
            className="flex items-center space-x-2 text-xs text-gray-700"
            onClick={() => {
              const idx = chartData.findIndex(c => c.rawName === entry.rawName);
              if (selectedIndex === idx) {
                startAnimation(0, () => {
                  setSelected(null);
                  setSelectedIndex(null);
                  setSelectedRaw(null);
                  setPage(1);
                });
              } else {
                setSelected({ name: entry.name, value: Number(entry.value) || 0, color: entry.color });
                setSelectedIndex(idx >= 0 ? idx : null);
                setSelectedRaw(entry.rawName);
                setPage(1);
                setAnimProgress(0);
                startAnimation(1);
              }
            }}
          >
            <span
              className={`inline-block w-3 h-3 rounded-sm ${selected?.name === entry.name ? 'ring-2 ring-gray-300' : ''}`}
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        {selectedRaw ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700">
                Showing {filteredTxns.length} transaction{filteredTxns.length !== 1 ? 's' : ''} for {getCategoryLabelFromConstants(selectedRaw)} {selectedMonth ? `• ${selectedMonth}` : ''}
              </div>
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
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
                  {paged.map((t: any) => (
                    <tr key={String((t as any).id)}>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium text-gray-900">{String((t as any).name || (t as any).merchant_name || 'Unknown')}</div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">{formatDate(String((t as any).date || ''))}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900 text-right">{formatCurrency(Math.abs(Number((t as any).amount || 0)))}</td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-600" colSpan={3}>No transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white disabled:opacity-50 text-xs"
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white disabled:opacity-50 text-xs"
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-600 text-center">Select a category to view transactions</div>
        )}
      </div>
    </div>
  );
};
