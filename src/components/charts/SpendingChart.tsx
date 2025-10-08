import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/financialUtils';
import type { CategorySummary } from '@/lib/types';

export interface SpendingChartProps {
  data: CategorySummary[];
  timeframe?: 'monthly' | 'weekly' | 'daily';
}

export function SpendingChart({ data, timeframe = 'monthly' }: SpendingChartProps) {
  // Process data for the chart
  const chartData = data
    .filter(item => item.total_spent > 0)
    .map(item => ({
      name: item.category.split(':').pop() || item.category,
      fullName: item.category,
      spent: item.total_spent,
      income: item.total_income,
      transactions: item.transactions
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10); // Show top 10 categories

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">{data.fullName}</p>
          <p className="text-sm text-red-600">
            Spent: {formatCurrency(data.spent)}
          </p>
          {data.income > 0 && (
            <p className="text-sm text-green-600">
              Income: {formatCurrency(data.income)}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {data.transactions} transactions
          </p>
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
            <TrendingUp className="h-5 w-5" />
            Spending Chart
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

  const totalSpent = chartData.reduce((sum, item) => sum + item.spent, 0);

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          Spending Analysis
        </CardTitle>
        <CardDescription className="text-sm font-medium">
          Top spending categories · Total: {formatCurrency(totalSpent)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
                interval={0}
              />
              <YAxis
                fontSize={12}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="spent"
                name="Spent"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
              {chartData.some(item => item.income > 0) && (
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 shadow-sm">
            <div className="text-2xl font-bold text-destructive">
              {chartData.length}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">Categories</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 shadow-sm">
            <div className="text-2xl font-bold">
              {chartData.reduce((sum, item) => sum + item.transactions, 0)}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">Transactions</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 shadow-sm">
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(Math.max(...chartData.map(item => item.spent)))}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">Highest Spend</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 shadow-sm">
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent / chartData.length)}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">Average Spend</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}