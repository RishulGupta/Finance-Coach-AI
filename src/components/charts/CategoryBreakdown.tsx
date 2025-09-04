import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const mockData = [
  { name: 'Food & Dining', value: 2840, color: 'hsl(var(--primary))' },
  { name: 'Transportation', value: 1560, color: 'hsl(var(--secondary))' },
  { name: 'Shopping', value: 1200, color: 'hsl(var(--accent))' },
  { name: 'Entertainment', value: 980, color: 'hsl(var(--primary-glow))' },
  { name: 'Utilities', value: 870, color: 'hsl(var(--secondary-glow))' },
  { name: 'Healthcare', value: 650, color: 'hsl(var(--accent-glow))' },
  { name: 'Other', value: 331, color: 'hsl(var(--muted-foreground))' },
];

export function CategoryBreakdown() {
  return (
    <div className="chart-container">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">Spending by Category</h3>
        <p className="text-sm text-muted-foreground">Current month breakdown</p>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={mockData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {mockData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}