import type { Transaction, CategorySummary } from './types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function calculateCategoryTotals(transactions: Transaction[]): CategorySummary[] {
  const categoryMap = new Map<string, { debit: number; credit: number; count: number }>();
  
  transactions.forEach(transaction => {
    const debitAmount = transaction.debit_inr || 0;
    const creditAmount = transaction.credit_inr || 0;
    
    if (debitAmount > 0 || creditAmount > 0) {
      const existing = categoryMap.get(transaction.category) || { debit: 0, credit: 0, count: 0 };
      categoryMap.set(transaction.category, {
        debit: existing.debit + debitAmount,
        credit: existing.credit + creditAmount,
        count: existing.count + 1,
      });
    }
  });

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    total_spent: data.debit,
    total_income: data.credit,
    transactions: data.count, // Changed from transaction_count to transactions to match type
    month: transactions[0]?.month || '', // Add month if available
  }));
}

export function getTransactionType(transaction: Transaction): 'debit' | 'credit' {
  return transaction.debit_inr > 0 ? 'debit' : 'credit';
}

export function getTransactionAmount(transaction: Transaction): number {
  return transaction.debit_inr > 0 ? transaction.debit_inr : transaction.credit_inr;
}

export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= start && transactionDate <= end;
  });
}

export function groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  return transactions.reduce((groups, transaction) => {
    const date = transaction.date.split('T')[0]; // Get date part only
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);
}

export function sortTransactions(
  transactions: Transaction[],
  field: keyof Transaction,
  direction: 'asc' | 'desc' = 'desc'
): Transaction[] {
  return [...transactions].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });
}

export function getTotalSpent(transactions: Transaction[]): number {
  return transactions.reduce((total, transaction) => total + (transaction.debit_inr || 0), 0);
}

export function getTotalIncome(transactions: Transaction[]): number {
  return transactions.reduce((total, transaction) => total + (transaction.credit_inr || 0), 0);
}