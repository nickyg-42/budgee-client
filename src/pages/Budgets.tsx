import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { apiService } from '../services/api';
import { Budget, Transaction } from '../types';
import { PERSONAL_FINANCE_CATEGORIES, PersonalFinanceCategory, PERSONAL_FINANCE_CATEGORY_OPTIONS, getCategoryLabelFromConstants, getAnyCategoryLabel, isDetailedCategory, getParentCategory } from '../constants/personalFinanceCategories';
import { formatCurrency, formatDate, monthLabel } from '../utils/formatters';
import { Plus, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { PillButton } from '../components/ui/PillButton';
import { MinimalSelect } from '../components/ui/MinimalSelect';
import { useAppStore } from '../stores/appStore';
import { toast } from 'sonner';
import { CategoryChart } from '../components/charts/CategoryChart';
import CategoryBreakdownBar from '../components/charts/CategoryBreakdownBar';
import { useTheme } from '../theme/ThemeContext';
import { PersonalFinanceIcon } from '../components/icons/PersonalFinanceIcon';
import { CategoryPicker } from '../components/ui/CategoryPicker';

const isValidCategory = (c: string): boolean =>
  (PERSONAL_FINANCE_CATEGORIES as readonly string[]).includes(c) || isDetailedCategory(c);
const EXCLUDED_BUDGET_CATEGORIES: readonly PersonalFinanceCategory[] = [
  'INCOME',
  'LOAN_DISBURSEMENTS',
  'TRANSFER_IN',
];
const BUDGET_CATEGORY_OPTIONS = PERSONAL_FINANCE_CATEGORY_OPTIONS.filter(
  (opt) => !EXCLUDED_BUDGET_CATEGORIES.includes(opt.value)
);

export const Budgets = () => {
  const { transactions, setTransactions, setAccounts, setPlaidItems } = useAppStore();
  const { progress, semantic, getCategoryColor } = useTheme();
  const lightenWithWhite = (hex: string, t: number) => {
    const h = String(hex || '').replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const R = Math.round(r + (255 - r) * t);
    const G = Math.round(g + (255 - g) * t);
    const B = Math.round(b + (255 - b) * t);
    return `rgb(${R}, ${G}, ${B})`;
  };
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const initRef = useRef(false);
  const dataInitRef = useRef(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.getBudgets();
        setBudgets(Array.isArray(data) ? data : []);
      } catch (e) {
        toast.error('Failed to load budgets');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (dataInitRef.current) return;
    if ((transactions || []).length > 0) return;
    dataInitRef.current = true;
    const loadStoreData = async () => {
      try {
        setIsLoading(true);
        const items = await apiService.getPlaidItems();
        setPlaidItems(items || []);
        if (!items || items.length === 0) {
          setTransactions([]);
          setAccounts([]);
          return;
        }
        const accountsByItem = await Promise.all(items.map((item) => apiService.getAccountsFromDB(item.id).catch(() => [])));
        const allAccounts: any[] = ([] as any[]).concat(...accountsByItem).filter((a) => !!a && typeof a === 'object');
        setAccounts(allAccounts || []);
        const txnsByAccount = await Promise.all((allAccounts || []).map((acc: any) => apiService.getTransactions(String(acc.id)).catch(() => [])));
        const normalized = (txnsByAccount || []).map((arr) => Array.isArray(arr) ? arr : (arr ? [arr] : []));
        const allTxns = ([] as any[]).concat(...normalized).filter((t) => !!t && typeof t === 'object');
        setTransactions(allTxns as any);
      } catch (e) {
        toast.error('Failed to load transactions for budgets');
      } finally {
        setIsLoading(false);
      }
    };
    loadStoreData();
  }, [transactions, setPlaidItems, setAccounts, setTransactions]);
  const daysInMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }, []);
  const dayOfMonth = useMemo(() => new Date().getDate(), []);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  useEffect(() => {
    if (!selectedMonth) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setSelectedMonth(`${y}-${m}`);
    }
  }, [selectedMonth]);
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
  const monthProgressPct = useMemo(() => {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (selectedMonth === currentYM) {
      return Math.round((dayOfMonth / daysInMonth) * 100);
    }
    return 100;
  }, [selectedMonth, dayOfMonth, daysInMonth]);

  const asNumber = (v: any) => {
    const n = typeof v === 'number' ? v : v === undefined || v === null ? 0 : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const currentMonthSpentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    const ym = selectedMonth;
    (transactions || []).forEach((t: any) => {
      const v: any = (t as Transaction).date;
      const txm = String(v || '').slice(0, 7);
      if (txm !== ym) return;
      if ((t as any).expense !== true) return;
      const amt = Math.abs(asNumber((t as any).amount));
      const primaryCat = String((t as any).primary_category || 'OTHER');
      const detailedCat = String((t as any).detailed_category || '');
      // Accumulate under primary category
      map.set(primaryCat, (map.get(primaryCat) || 0) + amt);
      // Also accumulate under detailed category if present
      if (detailedCat) {
        map.set(detailedCat, (map.get(detailedCat) || 0) + amt);
      }
    });
    return map;
  }, [transactions, selectedMonth]);

  const monthlyIncome = useMemo(() => {
    const ym = selectedMonth;
    return (transactions || []).reduce((sum, t: any) => {
      const txm = String(t?.date || '').slice(0, 7);
      if (txm !== ym || t?.income !== true) return sum;
      return sum + Math.abs(asNumber(t?.amount));
    }, 0);
  }, [transactions, selectedMonth]);

  const categoryChartData = useMemo(() => {
    const entries = Array.from(currentMonthSpentByCategory.entries())
      .filter(([category]) => (PERSONAL_FINANCE_CATEGORIES as readonly string[]).includes(category));
    if (entries.length === 0) {
      return [{ category: 'DEFAULT', amount: -0, percentage: 0 }];
    }
    return entries.map(([category, amount]) => ({ category, amount: -Math.abs(amount), percentage: 0 }));
  }, [currentMonthSpentByCategory]);

  const getBarColor = (pct: number) => {
    if (pct <= 50) return progress.low;
    if (pct <= 80) return progress.mid;
    if (pct <= 100) return progress.high;
    return progress.over;
  };
  const expandAll = () => {
    const map: Record<number, boolean> = {};
    (budgets || []).forEach(b => { map[Number(b.id)] = true; });
    setExpanded(map);
  };
  const collapseAll = () => {
    setExpanded({});
  };

  const handleAddBudget = async () => {
    const cat = newCategory.trim();
    const amt = Number(newAmount);
    if (!cat || !isValidCategory(cat)) {
      toast.error('Select a valid category');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (budgets.some(b => String(b.personal_finance_category) === cat)) {
      toast.error('A budget already exists for this category');
      return;
    }
    try {
      const created = await apiService.createBudget({ personal_finance_category: cat, amount: amt });
      setBudgets([...(budgets || []), created]);
      toast.success('Budget created');
      setIsAddOpen(false);
      setNewCategory('');
      setNewAmount('');
    } catch (e) {
      toast.error('Failed to create budget');
    }
  };

  const handleDeleteBudget = async (b: Budget) => {
    const ok = window.confirm(`Delete budget for ${b.personal_finance_category}?`);
    if (!ok) return;
    try {
      await apiService.deleteBudget(Number(b.id));
      setBudgets((budgets || []).filter(x => Number(x.id) !== Number(b.id)));
      toast.success('Budget deleted');
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  const handleStartEdit = (b: Budget) => {
    setEditBudget(b);
    setEditAmount(String(b.amount));
    setEditCategory(String(b.personal_finance_category));
  };
  const handleSaveEdit = async () => {
    if (!editBudget) return;
    const amt = Number(editAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const cat = editCategory.trim();
    if (!cat || !isValidCategory(cat)) {
      toast.error('Select a valid category');
      return;
    }
    if (budgets.some(b => String(b.personal_finance_category) === cat && Number(b.id) !== Number(editBudget.id))) {
      toast.error('A budget already exists for this category');
      return;
    }
    try {
      const updated = await apiService.updateBudget(Number(editBudget.id), { amount: amt, personal_finance_category: cat });
      setBudgets((budgets || []).map(x => Number(x.id) === Number(editBudget.id) ? { ...x, ...(updated || {}), amount: amt, personal_finance_category: cat } : x));
      toast.success('Budget updated');
      setEditBudget(null);
      setEditAmount('');
      setEditCategory('');
    } catch {
      toast.error('Failed to update budget');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <PillButton size="md" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </PillButton>
      </div>

      {/* Budget Allocation Gauge */}
      {budgets.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">Budget Allocation</span>
              <span className="text-sm font-semibold" style={{ color: semantic.good }}>
                {monthlyIncome > 0 ? formatCurrency(monthlyIncome) : 'No income data'}
                {monthlyIncome > 0 && <span className="text-xs font-normal text-gray-500 ml-1">monthly income</span>}
              </span>
            </div>
            {(() => {
              const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
              const hasIncome = monthlyIncome > 0;
              const capacity = hasIncome ? monthlyIncome : totalBudgeted;
              const overAllocated = hasIncome && totalBudgeted > monthlyIncome;
              const unallocated = hasIncome ? monthlyIncome - totalBudgeted : 0;
              const allocPct = hasIncome ? Math.round((totalBudgeted / monthlyIncome) * 100) : 100;
              const sorted = [...budgets].sort((a, b) => String(a.personal_finance_category).localeCompare(String(b.personal_finance_category)));
              const denominator = overAllocated ? totalBudgeted : capacity;

              return (
                <>
                  <div className="relative h-6 bg-gray-200 rounded-lg overflow-hidden flex">
                    {sorted.map((b) => {
                      const budgetCat = String(b.personal_finance_category);
                      const catColor = getCategoryColor(isDetailedCategory(budgetCat) ? getParentCategory(budgetCat) : budgetCat);
                      const widthPct = denominator > 0 ? (Number(b.amount) / denominator) * 100 : 0;
                      return (
                        <div
                          key={b.id}
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: catColor,
                            minWidth: widthPct > 0 ? '2px' : '0',
                          }}
                          title={`${getAnyCategoryLabel(budgetCat)}: ${formatCurrency(Number(b.amount))}`}
                        />
                      );
                    })}
                  </div>
                  {overAllocated && (
                    <div className="h-1 rounded-b-lg mt-0.5" style={{ backgroundColor: semantic.bad, opacity: 0.6 }} />
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                    <span>Total Budgeted: <span className="font-semibold text-gray-800">{formatCurrency(totalBudgeted)}</span></span>
                    {hasIncome ? (
                      overAllocated ? (
                        <span>Over-allocated: <span className="font-semibold" style={{ color: semantic.bad }}>{formatCurrency(totalBudgeted - monthlyIncome)}</span></span>
                      ) : (
                        <span>Unallocated: <span className="font-semibold text-gray-800">{formatCurrency(unallocated)}</span></span>
                      )
                    ) : null}
                    {hasIncome && (
                      <span>
                        Allocated:{' '}
                        <span className={`font-semibold ${overAllocated ? '' : 'text-gray-800'}`} style={overAllocated ? { color: semantic.bad } : undefined}>
                          {allocPct}%
                        </span>
                      </span>
                    )}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">Monthly Budgets</span>
              <div className="flex items-center space-x-3">
                <span className="hidden md:inline text-xs text-gray-700">Month progress: <span className="font-bold">{monthProgressPct}%</span></span>
                <MinimalSelect
                  size="sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-auto"
                >
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </MinimalSelect>
              </div>
            </div>
            <div className="block md:hidden mt-2">
              <span className="text-xs text-gray-700">Month progress: <span className="font-bold">{monthProgressPct}%</span></span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="py-6 text-center text-gray-600">Loading...</div>
            ) : budgets.length === 0 ? (
              <div className="py-6 text-center text-gray-600">No budgets yet. Add one to get started.</div>
            ) : (
              <div className="space-y-4">
              {(budgets || []).slice().sort((a, b) => String(a.personal_finance_category).localeCompare(String(b.personal_finance_category))).map((b) => {
                const spent = currentMonthSpentByCategory.get(String(b.personal_finance_category)) || 0;
                const amt = Number(b.amount);
                const ratio = amt > 0 ? spent / amt : 0;
                const fillPct = Math.min(100, Math.round(ratio * 100));
                const over = spent > amt;
                const budgetCat = String(b.personal_finance_category);
                const budgetIsDetailed = isDetailedCategory(budgetCat);
                const catColor = getCategoryColor(budgetIsDetailed ? getParentCategory(budgetCat) : budgetCat);
                const color = catColor;
                const light = lightenWithWhite(catColor, 0.6);
                const txns = (transactions || []).filter((t: any) => {
                  const v: any = (t as Transaction).date;
                  const txm = String(v || '').slice(0, 7);
                  if (txm !== selectedMonth) return false;
                  if ((t as any).expense !== true) return false;
                  if (budgetIsDetailed) {
                    return String((t as any).detailed_category || '') === budgetCat;
                  }
                  return String((t as any).primary_category || 'OTHER') === budgetCat;
                });
                return (
                  <div key={b.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex">
                          <PersonalFinanceIcon category={isDetailedCategory(String(b.personal_finance_category)) ? getParentCategory(String(b.personal_finance_category)) : String(b.personal_finance_category)} size={20} className="mr-3 mt-0.5" />
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900">{getAnyCategoryLabel(String(b.personal_finance_category))}</div>
                            {isDetailedCategory(String(b.personal_finance_category)) && (
                              <div className="text-xs text-gray-500">{getCategoryLabelFromConstants(getParentCategory(String(b.personal_finance_category)))}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800" onClick={() => handleStartEdit(b)}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800" onClick={() => handleDeleteBudget(b)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="relative h-5 bg-gray-100 rounded-lg mb-2">
                        <div
                          className="h-full rounded-lg"
                          style={{ width: `${fillPct}%`, backgroundImage: `linear-gradient(90deg, ${light} 0%, ${color} 100%)` }}
                        ></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-800">
                        <span className={over ? 'font-bold' : 'font-medium'}>{formatCurrency(spent)}</span>
                        <span> out of </span>
                        <span className="font-medium">{formatCurrency(amt)}</span>
                      </div>
                  </div>
                );
              })}
              {(() => {
                const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
                const totalSpent = budgets.reduce((sum, b) => sum + (currentMonthSpentByCategory.get(String(b.personal_finance_category)) || 0), 0);
                const totalRatio = totalBudgeted > 0 ? totalSpent / totalBudgeted : 0;
                const totalFillPct = Math.min(100, Math.round(totalRatio * 100));
                const totalOver = totalSpent > totalBudgeted;
                const barColor = getBarColor(Math.round(totalRatio * 100));
                const totalLight = lightenWithWhite(barColor, 0.6);
                return (
                  <div className="border-t border-gray-300 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">Total</span>
                      <span className="text-sm text-gray-600">{totalFillPct}% used</span>
                    </div>
                    <div className="relative h-5 bg-gray-100 rounded-lg mb-2">
                      <div
                        className="h-full rounded-lg"
                        style={{ width: `${totalFillPct}%`, backgroundImage: `linear-gradient(90deg, ${totalLight} 0%, ${barColor} 100%)` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm text-gray-800">
                      <span className={totalOver ? 'font-bold' : 'font-medium'}>{formatCurrency(totalSpent)}</span>
                      <span> out of </span>
                      <span className="font-medium">{formatCurrency(totalBudgeted)}</span>
                    </div>
                  </div>
                );
              })()}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex justify-start mb-4 text-sm text-gray-600">Monthly Spending Breakdown</div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="w-full">
                {(() => {
                  const ym = selectedMonth;
                  const monthTxns = (transactions || []).filter((t: any) => {
                    const v: any = (t as Transaction).date;
                    const txm = String(v || '').slice(0, 7);
                    return txm === ym;
                  });
                  return (
                    <>
                      <div className="hidden md:block">
                        <CategoryChart data={categoryChartData} height={560} transactionsForMonth={monthTxns as any} selectedMonth={ym} />
                      </div>
                      <div className="block md:hidden">
                        <CategoryBreakdownBar data={categoryChartData as any} transactionsForMonth={monthTxns as any} />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isAddOpen}
        title="Add Budget"
        onClose={() => setIsAddOpen(false)}
        actions={(
          <>
            <PillButton variant="inactive" size="md" onClick={() => setIsAddOpen(false)}>Cancel</PillButton>
            <PillButton size="md" onClick={handleAddBudget}>Save</PillButton>
          </>
        )}
      >
        <div className="space-y-4 min-h-[340px]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <CategoryPicker
              value={newCategory}
              onChange={(cat) => setNewCategory(cat)}
              excludeCategories={EXCLUDED_BUDGET_CATEGORIES as unknown as string[]}
              placeholder="Select a category"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editBudget}
        title={editBudget ? `Edit Budget` : 'Edit Budget'}
        onClose={() => setEditBudget(null)}
        actions={(
          <>
            <PillButton variant="inactive" size="md" onClick={() => setEditBudget(null)}>Cancel</PillButton>
            <PillButton size="md" onClick={handleSaveEdit}>Save</PillButton>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <CategoryPicker
              value={editCategory}
              onChange={(cat) => setEditCategory(cat)}
              excludeCategories={EXCLUDED_BUDGET_CATEGORIES as unknown as string[]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
