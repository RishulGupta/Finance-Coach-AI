export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface MonthlyData {
  year: number;
  month: number;
  transactions: Transaction[];
  metrics: {
    totalSpent: number;
    totalIncome: number;
    transactionCount: number;
    categories: number;
  };
}

// Generate sample transactions for different months
const generateTransactions = (year: number, month: number): Transaction[] => {
  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education'];
  const descriptions = {
    Food: ['Restaurant', 'Groceries', 'Coffee Shop', 'Food Delivery'],
    Transport: ['Uber', 'Gas Station', 'Public Transport', 'Parking'],
    Entertainment: ['Movie Theater', 'Streaming Service', 'Concert', 'Games'],
    Shopping: ['Amazon', 'Clothing Store', 'Electronics', 'Books'],
    Bills: ['Electricity', 'Internet', 'Phone', 'Rent'],
    Healthcare: ['Doctor Visit', 'Pharmacy', 'Insurance', 'Dental'],
    Education: ['Course Fee', 'Books', 'Online Learning', 'Certification']
  };

  const transactions: Transaction[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Generate 15-30 transactions per month
  const transactionCount = Math.floor(Math.random() * 16) + 15;
  
  for (let i = 0; i < transactionCount; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const description = descriptions[category][Math.floor(Math.random() * descriptions[category].length)];
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // 80% expenses, 20% income
    const isIncome = Math.random() < 0.2;
    const amount = isIncome 
      ? Math.floor(Math.random() * 5000) + 2000 // Income: 2000-7000
      : Math.floor(Math.random() * 500) + 50;   // Expense: 50-550
    
    transactions.push({
      id: `${year}-${month}-${i}`,
      date,
      description,
      category,
      amount,
      type: isIncome ? 'income' : 'expense'
    });
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate data for the last 12 months
const generateMockData = (): MonthlyData[] => {
  const data: MonthlyData[] = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const transactions = generateTransactions(year, month);
    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');
    
    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const categories = new Set(transactions.map(t => t.category)).size;
    
    data.push({
      year,
      month,
      transactions,
      metrics: {
        totalSpent,
        totalIncome,
        transactionCount: transactions.length,
        categories
      }
    });
  }
  
  return data;
};

export const mockFinancialData = generateMockData();

export const getDataForMonth = (year: number, month: number): MonthlyData | null => {
  return mockFinancialData.find(d => d.year === year && d.month === month) || null;
};

export const getAvailableMonths = () => {
  return mockFinancialData.map(d => ({ year: d.year, month: d.month }));
};