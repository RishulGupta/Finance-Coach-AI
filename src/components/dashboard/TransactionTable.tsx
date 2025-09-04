import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Filter } from 'lucide-react';

interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    return amount < 0 ? `-${formatted}` : formatted;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food': 'bg-primary/20 text-primary',
      'Income': 'bg-secondary/20 text-secondary',
      'Entertainment': 'bg-accent/20 text-accent',
      'Transportation': 'bg-primary-glow/20 text-primary',
      'Shopping': 'bg-secondary-glow/20 text-secondary'
    };
    return colors[category] || 'bg-muted/20 text-muted-foreground';
  };

  return (
    <div className="financial-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">Latest financial activity</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <motion.tr
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-4 text-sm">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium">{transaction.description}</span>
                </td>
                <td className="py-3 px-4">
                  <Badge 
                    variant="secondary" 
                    className={getCategoryColor(transaction.category)}
                  >
                    {transaction.category}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`font-semibold ${
                    transaction.amount < 0 ? 'text-destructive' : 'text-secondary'
                  }`}>
                    {formatAmount(transaction.amount)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}