import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../theme/ThemeContext';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeExpenseChartProps {
  data: MonthlyData[];
  title?: string;
  height?: number;
}

export const IncomeExpenseChart = ({ data, title, height = 520 }: IncomeExpenseChartProps) => {
  const { semantic } = useTheme();
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
            <span className="inline-block w-3 h-3 mr-2 align-middle" style={{ backgroundColor: semantic.good }} />
            Income: {formatCurrency(income)}
          </div>
          <div className="text-sm text-gray-700">
            <span className="inline-block w-3 h-3 mr-2 align-middle" style={{ backgroundColor: semantic.bad }} />
            Expenses: {formatCurrency(expenses)}
          </div>
          <div className="text-sm font-semibold" style={{ color: cashFlow >= 0 ? semantic.good : semantic.bad }}>
            Cash Flow: {formatCurrency(cashFlow)}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="w-full" style={{ height }}>
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
            iconType="circle"
            formatter={(value) => <span style={{ color: '#000' }}>{value}</span>}
          />
          <Bar 
            dataKey="income" 
            fill={semantic.good} 
            name="Income"
            radius={[10, 10, 0, 0]}
          />
          <Bar 
            dataKey="expenses" 
            fill={semantic.bad} 
            name="Expenses"
            radius={[10, 10, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
