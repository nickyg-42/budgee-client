import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeExpenseChartProps {
  data: MonthlyData[];
  title?: string;
}

export const IncomeExpenseChart = ({ data, title }: IncomeExpenseChartProps) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const income = Number(payload.find((p: any) => p?.dataKey === 'income')?.value || 0);
    const expenses = Number(payload.find((p: any) => p?.dataKey === 'expenses')?.value || 0);
    const cashFlow = income - expenses;
    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-md p-3">
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="mt-1 space-y-1">
          <div className="text-sm text-gray-700">
            <span className="inline-block w-3 h-3 mr-2 align-middle" style={{ backgroundColor: '#10b981' }} />
            Income: {formatCurrency(income)}
          </div>
          <div className="text-sm text-gray-700">
            <span className="inline-block w-3 h-3 mr-2 align-middle" style={{ backgroundColor: '#ef4444' }} />
            Expenses: {formatCurrency(expenses)}
          </div>
          <div className={`text-sm font-semibold ${cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Cash Flow: {formatCurrency(cashFlow)}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="w-full h-80">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar 
            dataKey="income" 
            fill="#10b981" 
            name="Income"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="expenses" 
            fill="#ef4444" 
            name="Expenses"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
