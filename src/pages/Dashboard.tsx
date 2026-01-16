import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { CategoryChart } from '../components/charts/CategoryChart';
import { YearlyCategoryChart } from '../components/charts/YearlyCategoryChart';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { formatCurrency, formatPercentage, formatShortDate, getCategoryColor, monthLabel, formatYMD } from '../utils/formatters';
import { getCategoryLabelFromConstants } from '../constants/personalFinanceCategories';
import { PiggyBank, Calendar, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PillButton } from '../components/ui/PillButton';
import { toast } from 'sonner';
import { useTheme } from '../theme/ThemeContext';

export const Dashboard = () => {
  const { transactions, accounts, setTransactions, setAccounts, plaidItems, setPlaidItems, setLoading, setError } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const initRef = useRef(false);
  const { semantic } = useTheme();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const items = await apiService.getPlaidItems();
        setPlaidItems(items || []);
        if (!items || items.length === 0) {
          setTransactions([]);
          setAccounts([]);
          return;
        }
        const accountsByItem = await Promise.all(items.map((item) => apiService.getAccountsFromDB(item.id).catch(() => [])));
        const allAccounts: any[] = ([] as any[])
          .concat(...accountsByItem)
          .filter((a) => !!a && typeof a === 'object');
        setAccounts(allAccounts || []);
        const txnsByAccount = await Promise.all((allAccounts || []).map((acc) => apiService.getTransactions(acc.id).catch(() => [])));
        const normalized = (txnsByAccount || []).map((arr) => Array.isArray(arr) ? arr : (arr ? [arr] : []));
        const allTxns = ([] as any[]).concat(...normalized).filter((t) => !!t && typeof t === 'object');
        setTransactions(allTxns as any);
      } catch (error) {
        setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setAccounts, setTransactions, setPlaidItems, setLoading, setError]);

  const asNumber = (v: any) => {
    const n = typeof v === 'number' ? v : v === undefined || v === null ? 0 : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const safePrimaryCategory = (t: any) => (t?.primary_category ?? 'OTHER');

  const monthOptions = useMemo(() => {
    const now = new Date();
    const options: { value: string; label: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const value = `${y}-${m}`;
      const label = monthLabel(`${value}-01`);
      options.push({ value, label });
    }
    return options;
  }, []);

  useEffect(() => {
    if (!selectedMonth) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setSelectedMonth(`${y}-${m}`);
    }
  }, [selectedMonth]);

  const currentMonthLabel = useMemo(() => {
    const ym = selectedMonth || (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    })();
    return monthLabel(`${ym}-01`);
  }, [selectedMonth]);

  const monthAgg = useMemo(() => {
    const now = new Date();
    const buckets = new Map<string, { income: number; expenses: number; label: string }>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const label = monthLabel(`${key}-01`);
      buckets.set(key, { income: 0, expenses: 0, label });
    }
    (transactions || []).forEach((t: any) => {
      const s = String(t?.date || '');
      const key = s.length >= 7 ? s.slice(0, 7) : '';
      const b = buckets.get(key);
      if (!b) return;
      const amt = asNumber(t?.amount);
      if ((t as any).expense === true) {
        b.expenses += Math.abs(amt);
      }
      if ((t as any).income === true) {
        b.income += Math.abs(amt);
      }
    });
    return Array.from(buckets.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>({ key:k, month:v.label, income:v.income, expenses:v.expenses }));
  }, [transactions]);

  const sixMonthData = useMemo(() => {
    const d = monthAgg.map(({ month, income, expenses }) => ({ month, income, expenses }));
    return d.slice(Math.max(0, d.length - 6));
  }, [monthAgg]);

  const yearlyAgg = useMemo(() => {
    const now = new Date();
    const buckets = new Map<number, { income: number; expenses: number }>();
    for (let i = 0; i < 5; i++) {
      const y = now.getFullYear() - i;
      buckets.set(y, { income: 0, expenses: 0 });
    }
    (transactions || []).forEach((t: any) => {
      const s = String(t?.date || '');
      const y = Number(s.slice(0, 4));
      const bucket = buckets.get(y);
      if (!bucket) return;
      const amt = asNumber(t?.amount);
      if ((t as any)?.expense === true) {
        bucket.expenses += Math.abs(amt);
      }
      if ((t as any)?.income === true) {
        bucket.income += Math.abs(amt);
      }
    });
    const entries = Array.from(buckets.entries()).sort((a,b)=>a[0]-b[0]);
    return entries.map(([year, { income, expenses }]) => ({ month: String(year), income, expenses }));
  }, [transactions]);

  const [chartMode, setChartMode] = useState<'months' | 'years'>('months');
  const [incomeSortKey, setIncomeSortKey] = useState<'date' | 'amount' | null>('date');
  const [incomeSortDir, setIncomeSortDir] = useState<'desc' | 'asc' | null>('desc');
  const handleIncomeSortClick = (id: 'date' | 'amount') => {
    if (incomeSortKey === id) {
      if (incomeSortDir === 'desc') {
        setIncomeSortDir('asc');
      } else if (incomeSortDir === 'asc') {
        setIncomeSortKey(null);
        setIncomeSortDir(null);
      } else {
        setIncomeSortDir('desc');
      }
    } else {
      setIncomeSortKey(id);
      setIncomeSortDir('desc');
    }
  };
  const incomeTxnsForMonth = useMemo(() => {
    const ym = selectedMonth || '';
    return (transactions || []).filter((t: any) => {
      const v: any = t?.date;
      const txm = String(v || '').slice(0, 7);
      return txm === ym && (t as any)?.income === true;
    });
  }, [transactions, selectedMonth]);
  const sortedIncomeTxns = useMemo(() => {
    const data = [...incomeTxnsForMonth];
    if (!incomeSortKey || !incomeSortDir) return data;
    const cmp = (a: any, b: any) => {
      if (incomeSortKey === 'date') {
        const as = String(a?.date || '').slice(0, 10);
        const bs = String(b?.date || '').slice(0, 10);
        const r = as.localeCompare(bs);
        return incomeSortDir === 'desc' ? -r : r;
      }
      const aa = Math.abs(Number(a?.amount || 0));
      const bb = Math.abs(Number(b?.amount || 0));
      return incomeSortDir === 'desc' ? bb - aa : aa - bb;
    };
    data.sort(cmp);
    return data;
  }, [incomeTxnsForMonth, incomeSortKey, incomeSortDir]);

  const currentMonthStats = useMemo(() => {
    const key = selectedMonth || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    const b = monthAgg.find(m => m.key === key);
    const income = b ? b.income : 0;
    const expenses = b ? b.expenses : 0;
    const savings = income - expenses;
    const savings_rate = income > 0 ? (savings / income) * 100 : 0;
    return { income, expenses, savings, savings_rate };
  }, [monthAgg, selectedMonth]);

  const previousMonthStats = useMemo(() => {
    const [y, m] = (selectedMonth || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })()).split('-').map(Number);
    const prev = new Date(y, (m || 1) - 2, 1);
    const key = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const b = monthAgg.find(m => m.key === key);
    return { income: b ? b.income : 0, expenses: b ? b.expenses : 0 };
  }, [monthAgg, selectedMonth]);

  const expenseChangeValue = calculatePercentageChange(currentMonthStats.expenses, previousMonthStats.expenses);
  const expenseChange = formatPercentage(expenseChangeValue);
  const incomeChangeValue = calculatePercentageChange(currentMonthStats.income, previousMonthStats.income);
  const incomeChange = formatPercentage(incomeChangeValue);

  return (
    <Layout>
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center text-blue-500 mb-2">
                  <PiggyBank className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">{currentMonthLabel} Savings Rate</span>
                </div>
                <div className="text-3xl font-bold mb-1" style={{ color: currentMonthStats.savings >= 0 ? semantic.good : semantic.bad }}>
                  {formatPercentage(currentMonthStats.savings_rate)}
                </div>
                <p className="text-sm text-gray-600">
                  {currentMonthStats.savings > 0
                    ? `You saved ${formatCurrency(currentMonthStats.savings)}`
                    : currentMonthStats.savings < 0
                      ? `You spent ${formatCurrency(Math.abs(currentMonthStats.savings))} more than you made`
                      : 'You broke even'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center text-blue-500 mb-2">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">{currentMonthLabel} Expenses</span>
                </div>
                <div className="text-3xl font-bold mb-1" style={{ color: semantic.bad }}>
                  {formatCurrency(currentMonthStats.expenses)}
                </div>
                <div className="flex items-center text-sm mb-1" style={{ color: expenseChangeValue > 0 ? semantic.bad : semantic.good }}>
                  {expenseChangeValue > 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" style={{ color: expenseChangeValue > 0 ? semantic.bad : semantic.good }} />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" style={{ color: expenseChangeValue > 0 ? semantic.bad : semantic.good }} />
                  )}
                  {expenseChange}
                </div>
                <p className="text-sm text-gray-600">
                  from {formatCurrency(previousMonthStats.expenses)} last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center text-blue-500 mb-2">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">{currentMonthLabel} Income</span>
                </div>
                <div className="text-3xl font-bold mb-1" style={{ color: semantic.good }}>
                  {formatCurrency(currentMonthStats.income)}
                </div>
                <div className="flex items-center text-sm mb-1" style={{ color: incomeChangeValue >= 0 ? semantic.good : semantic.bad }}>
                  {incomeChangeValue >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" style={{ color: incomeChangeValue >= 0 ? semantic.good : semantic.bad }} />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" style={{ color: incomeChangeValue >= 0 ? semantic.good : semantic.bad }} />
                  )}
                  {incomeChange}
                </div>
                <p className="text-sm text-gray-600">
                  from {formatCurrency(previousMonthStats.income)} last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monthly Spending Breakdown</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const ym = selectedMonth;
              const d = (transactions || []).filter((t: any) => {
                const v: any = t?.date;
                const txm = String(v || '').slice(0, 7);
                return txm === ym;
              });
              const hasExpenses = d.some((t: any) => (t as any)?.expense === true);
              if (!hasExpenses) {
                return <CategoryChart data={[{ category: 'DEFAULT', amount: -0, percentage: 0 }]} height={520} transactionsForMonth={d as any} selectedMonth={ym} />;
              }
              const grouped = new Map<string, number>();
              d.forEach((t: any) => {
                const amt = asNumber(t?.amount);
                if ((t as any)?.expense === true) {
                  const cat = safePrimaryCategory(t);
                  const prev = grouped.get(cat) || 0;
                  grouped.set(cat, prev + Math.abs(amt));
                }
              });
              const data = Array.from(grouped.entries()).map(([category, amount]) => ({ category, amount: -amount, percentage: 0 }));
              return <CategoryChart data={data} height={520} transactionsForMonth={d as any} selectedMonth={ym} />;
            })()}
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {chartMode === 'months' ? 'Last 6 months' : 'Last 5 years'}
              </div>
              <div className="flex items-center space-x-2">
                <PillButton
                  size="sm"
                  variant={chartMode === 'months' ? 'active' : 'inactive'}
                  onClick={() => setChartMode('months')}
                >
                  Months
                </PillButton>
                <PillButton
                  size="sm"
                  variant={chartMode === 'years' ? 'active' : 'inactive'}
                  onClick={() => setChartMode('years')}
                >
                  Years
                </PillButton>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={chartMode === 'months' ? sixMonthData : yearlyAgg} height={560} />
          </CardContent>
        </Card>
      </div>
      {/* Detailed Segments - Stacked Bars
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-start-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Detailed Segments</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const ym = selectedMonth;
                const monthTxns = (transactions || []).filter((t: any) => {
                  const v: any = t?.date;
                  const txm = String(v || '').slice(0, 7);
                  return txm === ym;
                });
                const hasExpenses = monthTxns.some((t: any) => (t as any)?.expense === true);
                if (!hasExpenses) {
                  return <div className="text-sm text-gray-600">No expenses for this month.</div>;
                }
                return <DetailedStackedBarsChart transactionsForMonth={monthTxns as any} selectedMonth={ym} height={560} />;
              })()}
            </CardContent>
          </Card>
        </div>
      </div> */}
      
      {/* Yearly Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
        <Card className="self-start">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monthly Income</span>
              <span className="text-xs text-gray-500">{currentMonthLabel}</span>
            </div>
          </CardHeader>
          <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-medium text-gray-600">
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">
                          <button
                            onClick={() => handleIncomeSortClick('date')}
                            className={
                              incomeSortKey === 'date' && incomeSortDir
                                ? 'flex items-center space-x-2 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded'
                                : 'flex items-center space-x-2 text-gray-700 hover:text-gray-900'
                            }
                          >
                            <span>Date</span>
                            {!(incomeSortKey === 'date' && incomeSortDir) && <ArrowUpRight className="w-3 h-3 text-gray-300" />}
                            {incomeSortKey === 'date' && incomeSortDir === 'desc' && <ArrowDownRight className="w-3 h-3 text-blue-600" />}
                            {incomeSortKey === 'date' && incomeSortDir === 'asc' && <ArrowUpRight className="w-3 h-3 text-blue-600" />}
                          </button>
                        </th>
                        <th className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleIncomeSortClick('amount')}
                            className={
                              incomeSortKey === 'amount' && incomeSortDir
                                ? 'flex items-center justify-end space-x-2 w-full text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded'
                                : 'flex items-center justify-end space-x-2 w-full text-gray-700 hover:text-gray-900'
                            }
                          >
                            <span>Amount</span>
                            {!(incomeSortKey === 'amount' && incomeSortDir) && <ArrowUpRight className="w-3 h-3 text-gray-300" />}
                            {incomeSortKey === 'amount' && incomeSortDir === 'desc' && <ArrowDownRight className="w-3 h-3 text-blue-600" />}
                            {incomeSortKey === 'amount' && incomeSortDir === 'asc' && <ArrowUpRight className="w-3 h-3 text-blue-600" />}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedIncomeTxns.map((t: any) => (
                        <tr key={String((t as any).id)}>
                          <td className="px-3 py-2">
                            <div className="text-sm font-medium text-gray-900">{String((t as any).name || (t as any).merchant_name || 'Unknown')}</div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">{formatYMD(String((t as any).date || ''))}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-gray-900 text-right">
                            <span className="font-bold" style={{ color: semantic.good }}>
                              {formatCurrency(Math.abs(Number((t as any).amount || 0)))}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {sortedIncomeTxns.length === 0 && (
                        <tr>
                          <td className="px-3 py-4 text-sm text-gray-600" colSpan={3}>No income transactions for this month</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 text-sm font-semibold text-gray-900">Total</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-sm font-semibold text-right">
                          <span className="font-bold" style={{ color: semantic.good }}>
                            {formatCurrency(currentMonthStats.income)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <YearlyCategoryChart transactions={transactions as any} height={520} />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}
