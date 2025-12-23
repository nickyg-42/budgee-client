import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategorySpending } from '../../types';
import { getCategoryColor } from '../../utils/formatters';

interface CategoryChartProps {
  data: CategorySpending[];
  title?: string;
  height?: number;
  legend?: boolean;
  outerRadius?: number;
  innerRadius?: number;
}

export const CategoryChart = ({
  data,
  title,
  height = 320,
  legend = false,
  outerRadius = 100,
  innerRadius = 40,
}: CategoryChartProps) => {
  const chartData = data.map(item => ({
    name: item.category,
    value: Math.abs(item.amount),
    color: getCategoryColor(item.category)
  }));

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full" style={{ height }}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
            labelFormatter={(label) => `${label}`}
          />
          {legend && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
