import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { CategoryChart } from '../components/charts/CategoryChart';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { PiggyBank, Calendar, TrendingUp, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { dashboardStats, recurringTransactions, accounts, setDashboardStats, setRecurringTransactions, setLoading, setError } = useAppStore();
  const [activeCategoryTab, setActiveCategoryTab] = useState<'primary' | 'detailed'>('primary');
  const [activeTimeTab, setActiveTimeTab] = useState<'yearly' | 'monthly'>('monthly');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        console.log('Loading dashboard data...');
        
        const [stats, recurring] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecurringTransactions()
        ]);
        
        console.log('Dashboard stats loaded:', stats);
        console.log('Recurring transactions loaded:', recurring);
        
        setDashboardStats(stats);
        setRecurringTransactions(recurring);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [setDashboardStats, setRecurringTransactions, setLoading, setError]);

  if (!dashboardStats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      </Layout>
    );
  }

  const monthlyChartData = [
    { month: 'May', income: 1500, expenses: 1200 },
    { month: 'Jun', income: 1800, expenses: 1400 },
    { month: 'Jul', income: 2100, expenses: 1600 },
    { month: 'Aug', income: 1900, expenses: 1500 },
    { month: 'Sep', income: 2300, expenses: 1800 },
    { month: 'Oct', income: 1008, expenses: 1392 },
    { month: 'Nov', income: 2079, expenses: 3591 },
  ];

  const expenseChange = formatPercentage(
    calculatePercentageChange(dashboardStats.current_month.expenses, dashboardStats.previous_month.expenses)
  );
  
  const incomeChange = formatPercentage(
    calculatePercentageChange(dashboardStats.current_month.income, dashboardStats.previous_month.income)
  );

  return (
    <Layout>
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center text-pink-500 mb-2">
                  <PiggyBank className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">November Savings Rate</span>
                </div>
                <div className="text-3xl font-bold text-red-500 mb-1">
                  {formatPercentage(dashboardStats.current_month.savings_rate)}
                </div>
                <p className="text-sm text-gray-600">
                  You spent {formatCurrency(Math.abs(dashboardStats.current_month.savings))} more than you made 😊
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center text-pink-500 mb-2">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">November Expenses</span>
                </div>
                <div className="text-3xl font-bold text-red-500 mb-1">
                  {formatCurrency(dashboardStats.current_month.expenses)}
                </div>
                <div className="flex items-center text-sm text-red-500 mb-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {expenseChange}
                </div>
                <p className="text-sm text-gray-600">
                  from {formatCurrency(dashboardStats.previous_month.expenses)} in October
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center text-pink-500 mb-2">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">November Income</span>
                </div>
                <div className="text-3xl font-bold text-green-500 mb-1">
                  {formatCurrency(dashboardStats.current_month.income)}
                </div>
                <div className="flex items-center text-sm text-green-500 mb-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {incomeChange}
                </div>
                <p className="text-sm text-gray-600">
                  from {formatCurrency(dashboardStats.previous_month.income)} in October
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
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setActiveCategoryTab('primary')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeCategoryTab === 'primary'
                    ? 'text-pink-500 border-pink-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Primary Category
              </button>
              <button
                onClick={() => setActiveCategoryTab('detailed')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeCategoryTab === 'detailed'
                    ? 'text-pink-500 border-pink-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Detailed Category
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Last 12 Months</span>
              <div className="flex space-x-2 text-sm text-gray-500">
                {['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map(month => (
                  <span key={month}>{month}</span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex">
              <div className="w-1/2 pr-4">
                {dashboardStats.top_categories.map((category, index) => (
                  <div key={index} className="flex justify-between items-center py-2 text-sm">
                    <span className="font-medium text-gray-900">{category.category}</span>
                    <span className="text-blue-600 font-medium">
                      {formatCurrency(category.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-1/2">
                <CategoryChart data={dashboardStats.top_categories} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-end space-x-4 mb-4">
              <button
                onClick={() => setActiveTimeTab('yearly')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTimeTab === 'yearly'
                    ? 'text-pink-500 border-pink-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setActiveTimeTab('monthly')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTimeTab === 'monthly'
                    ? 'text-pink-500 border-pink-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Monthly
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={monthlyChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Accounts and Recurring Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-pink-500">Accounts</h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">Net Worth</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(dashboardStats.net_worth)}
                </p>
                <p className="text-xs text-gray-500">
                  from {formatCurrency(dashboardStats.previous_month.net_worth || 0)} in {dashboardStats.previous_month.month}
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
                accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span className="font-medium text-gray-900">{account.name}</span>
                      <p className="text-sm text-gray-600">{account.subtype || account.type}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${
                        (account.balance.current || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {formatCurrency(account.balance.current || 0)}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-pink-500">Recurring Transactions</h3>
              <div className="flex space-x-4 text-sm text-gray-600">
                <span>est. Amount</span>
                <span>Upcoming</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {recurringTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    <span className="font-medium text-gray-900">{transaction.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`font-medium ${
                      transaction.estimated_amount >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      ≈ {formatCurrency(Math.abs(transaction.estimated_amount))}
                    </span>
                    <span className="text-gray-600">
                      approx. {Math.ceil((new Date(transaction.upcoming_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
              ))}
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