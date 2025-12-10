import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { CategoryChart } from '../components/charts/CategoryChart';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { formatCurrency, formatPercentage, formatShortDate, getCategoryColor } from '../utils/formatters';
import { PiggyBank, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { transactions, accounts, setTransactions, setAccounts, plaidItems, setPlaidItems, setLoading, setError } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const initRef = useRef(false);

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

  const safePrimaryCategory = (t: any) => (t?.primary_category ?? t?.category ?? 'OTHER');

  const monthOptions = useMemo(() => {
    const now = new Date();
    const options: { value: string; label: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const value = `${y}-${m}`;
      const label = `${d.toLocaleString(undefined, { month: 'long' })} ${y}`;
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
    const d = new Date();
    return d.toLocaleString(undefined, { month: 'long' });
  }, []);

  const monthAgg = useMemo(() => {
    const now = new Date();
    const buckets = new Map<string, { income: number; expenses: number; label: string }>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const label = `${d.toLocaleString(undefined, { month: 'short' })} ${y}`;
      buckets.set(key, { income: 0, expenses: 0, label });
    }
    (transactions || []).forEach((t: any) => {
      const d: any = t?.date;
      const dt = typeof d === 'string' ? new Date(d) : new Date(d);
      if (isNaN(dt.getTime())) return;
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const b = buckets.get(key);
      if (!b) return;
      const amt = asNumber(t?.amount);
      if (amt > 0) b.expenses += amt; else b.income += Math.abs(amt);
    });
    return Array.from(buckets.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>({ key:k, month:v.label, income:v.income, expenses:v.expenses }));
  }, [transactions]);

  const sixMonthData = useMemo(() => {
    const d = monthAgg.map(({ month, income, expenses }) => ({ month, income, expenses }));
    return d.slice(Math.max(0, d.length - 6));
  }, [monthAgg]);

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const b = monthAgg.find(m => m.key === key);
    const income = b ? b.income : 0;
    const expenses = b ? b.expenses : 0;
    const savings = income - expenses;
    const savings_rate = income > 0 ? (savings / income) * 100 : 0;
    return { income, expenses, savings, savings_rate };
  }, [monthAgg]);

  const previousMonthStats = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const key = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const b = monthAgg.find(m => m.key === key);
    return { income: b ? b.income : 0, expenses: b ? b.expenses : 0 };
  }, [monthAgg]);

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
                <div className={`text-3xl font-bold ${currentMonthStats.savings >= 0 ? 'text-green-500' : 'text-red-500'} mb-1`}>
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
                <div className="text-3xl font-bold text-red-500 mb-1">
                  {formatCurrency(currentMonthStats.expenses)}
                </div>
                <div className={`flex items-center text-sm ${expenseChangeValue > 0 ? 'text-red-500' : 'text-green-500'} mb-1`}>
                  {expenseChangeValue > 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
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
                <div className="text-3xl font-bold text-green-500 mb-1">
                  {formatCurrency(currentMonthStats.income)}
                </div>
                <div className={`flex items-center text-sm ${incomeChangeValue >= 0 ? 'text-green-500' : 'text-red-500'} mb-1`}>
                  {incomeChangeValue >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
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
            <div className="flex">
               <div className="w-1/2 pr-4">
                {(() => {
                  const ym = selectedMonth;
                  const d = (transactions || []).filter((t: any) => {
                    const v: any = t?.date;
                    const txm = typeof v === 'string' ? v.slice(0,7) : new Date(v).toISOString().slice(0,7);
                    return txm === ym;
                  });
                  const hasExpenses = d.some((t: any) => asNumber(t?.amount) > 0);
                  if (!hasExpenses) {
                    return (
                      <div className="py-4 text-sm text-gray-600">No expenses for this month</div>
                    );
                  }
                  const grouped = new Map<string, number>();
                  d.forEach((t: any) => {
                    const amt = asNumber(t?.amount);
                    if (amt > 0) {
                      const cat = safePrimaryCategory(t);
                      const prev = grouped.get(cat) || 0;
                      grouped.set(cat, prev + amt);
                    }
                  });
                  const entries = Array.from(grouped.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10);
                  return entries.map(([cat, amt], index) => (
                    <div key={index} className="py-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-900">{cat}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(amt)}</span>
                      </div>
                      <div className="mt-1 h-3 w-full rounded" style={{ backgroundColor: getCategoryColor(cat) }}></div>
                    </div>
                  ));
                })()}
              </div>
              <div className="w-1/2">
                {(() => {
                  const ym = selectedMonth;
                  const d = (transactions || []).filter((t: any) => {
                    const v: any = t?.date;
                    const txm = typeof v === 'string' ? v.slice(0,7) : new Date(v).toISOString().slice(0,7);
                    return txm === ym;
                  });
                  const hasExpenses = d.some((t: any) => asNumber(t?.amount) > 0);
                  if (!hasExpenses) {
                    return <CategoryChart data={[{ category: 'DEFAULT', amount: -1, percentage: 0 }]} />;
                  }
                  const grouped = new Map<string, number>();
                  d.forEach((t: any) => {
                    const amt = asNumber(t?.amount);
                    if (amt > 0) {
                      const cat = safePrimaryCategory(t);
                      const prev = grouped.get(cat) || 0;
                      grouped.set(cat, prev + amt);
                    }
                  });
                  const data = Array.from(grouped.entries()).map(([category, amount]) => ({ category, amount: -amount, percentage: 0 }));
                  return <CategoryChart data={data} />;
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-end mb-4 text-sm text-gray-600">Last 6 months</div>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={sixMonthData} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-blue-500">Accounts</h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">Net Worth</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency((accounts || []).reduce((sum, acc: any) => sum + asNumber(acc?.balance?.current ?? (acc as any)?.current_balance ?? 0), 0))}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {accounts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>No accounts connected yet</p>
                  <p className="text-sm">Connect your bank accounts to see your financial overview</p>
                </div>
              ) : (
                (accounts || [])
                  .filter((a: any) => !!a && typeof a === 'object')
                  .map((account, idx) => (
                   <div key={account.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                     <div>
                       <span className="font-medium text-gray-900">{account?.name || 'Unknown Account'}</span>
                       <p className="text-sm text-gray-600">{account?.subtype || account?.type || 'Unknown'}</p>
                     </div>
                     <div className="flex items-center space-x-2">
                       <span className={`font-bold ${
                         (asNumber(account?.balance?.current ?? (account as any)?.current_balance ?? 0)) >= 0 ? 'text-green-500' : 'text-red-500'
                       }`}>
                         {formatCurrency(asNumber(account?.balance?.current ?? (account as any)?.current_balance ?? 0))}
                       </span>
                     </div>
                   </div>
                 ))
              )}
            </div>
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
