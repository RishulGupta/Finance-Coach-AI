import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { PieChart as PieChartIcon } from 'lucide-react';

interface CategoryBreakdownProps {
  data: Array<{
    category: string;
    total_spent: number;
    total_income: number;
    transactions: number;
  }>;
  showDetails?: boolean;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
];

export function CategoryBreakdown({ data, showDetails = false }: CategoryBreakdownProps) {
  // Process data for the pie chart
  const chartData = data
    .filter(item => item.total_spent > 0)
    .map(item => ({
      name: item.category.split(':').pop() || item.category,
      fullName: item.category,
      value: item.total_spent,
      transactions: item.transactions,
      percentage: 0 // Will be calculated below
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate percentages
  const totalSpent = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach(item => {
    item.percentage = (item.value / totalSpent) * 100;
  });

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.fullName}</p>
          <p className="text-sm">Amount: {formatCurrency(data.value)}</p>
          <p className="text-sm">Percentage: {data.percentage.toFixed(1)}%</p>
          <p className="text-sm">Transactions: {data.transactions}</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Category Breakdown
          </CardTitle>
          <CardDescription>
            No spending data available for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-border/50">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-accent/10">
            <PieChartIcon className="h-6 w-6 text-accent" />
          </div>
          Category Breakdown
        </CardTitle>
        <CardDescription className="text-sm font-medium">
          Spending distribution across categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {!showDetails && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        </div>

        {showDetails && (
          <div className="mt-6 space-y-3">
            <h4 className="font-semibold text-lg">Category Details</h4>
            {chartData.map((item, index) => (
              <div key={item.fullName} className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-gradient-to-br from-card to-muted/20 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-5 h-5 rounded-lg shadow-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-muted-foreground font-medium">{item.fullName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{formatCurrency(item.value)}</div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {item.percentage.toFixed(1)}% · {item.transactions} txns
                  </div>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total Spending</span>
                <span className="text-primary">{formatCurrency(totalSpent)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}