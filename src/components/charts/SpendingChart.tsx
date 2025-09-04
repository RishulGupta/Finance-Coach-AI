import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { month: 'Sep', amount: 7200 },
  { month: 'Oct', amount: 8100 },
  { month: 'Nov', amount: 7800 },
  { month: 'Dec', amount: 9200 },
  { month: 'Jan', amount: 8431 },
];

export function SpendingChart() {
  return (
    <div className="chart-container">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">Monthly Spending Trend</h3>
        <p className="text-sm text-muted-foreground">Last 5 months spending comparison</p>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
          />
          <Bar 
            dataKey="amount" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}