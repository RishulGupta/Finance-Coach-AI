import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  PieChart,
  Calendar,
  ChevronDown 
} from 'lucide-react';
import { MetricCard } from './MetricCard';
import { SpendingChart } from '../charts/SpendingChart';
import { CategoryBreakdown } from '../charts/CategoryBreakdown';
import { TransactionTable } from './TransactionTable';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data - replace with real API calls
const mockMetrics = {
  totalSpent: '$8,431.00',
  income: '$12,500.00',
  transactions: '127',
  categories: '8'
};

const mockTransactions = [
  { id: 1, date: '2024-01-15', description: 'Grocery Store', category: 'Food', amount: -156.78 },
  { id: 2, date: '2024-01-14', description: 'Salary Deposit', category: 'Income', amount: 4500.00 },
  { id: 3, date: '2024-01-13', description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99 },
  { id: 4, date: '2024-01-12', description: 'Gas Station', category: 'Transportation', amount: -67.43 },
  { id: 5, date: '2024-01-11', description: 'Coffee Shop', category: 'Food', amount: -12.50 },
];

export function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState('2024-01');
  const [selectedYear, setSelectedYear] = useState('2024');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Financial Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-01">January 2024</SelectItem>
              <SelectItem value="2023-12">December 2023</SelectItem>
              <SelectItem value="2023-11">November 2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Spent"
          value={mockMetrics.totalSpent}
          change="-12.3%"
          changeType="positive"
          icon={DollarSign}
          variant="primary"
        />
        <MetricCard
          title="Income"
          value={mockMetrics.income}
          change="+5.2%"
          changeType="positive"
          icon={TrendingUp}
          variant="secondary"
        />
        <MetricCard
          title="Transactions"
          value={mockMetrics.transactions}
          change="+8"
          changeType="neutral"
          icon={CreditCard}
          variant="accent"
        />
        <MetricCard
          title="Categories"
          value={mockMetrics.categories}
          icon={PieChart}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SpendingChart />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CategoryBreakdown />
        </motion.div>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <TransactionTable transactions={mockTransactions} />
      </motion.div>
    </div>
  );
}