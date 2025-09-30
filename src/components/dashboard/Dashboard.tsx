import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from './MetricCard';
import { TransactionTable } from './TransactionTable';
import { SpendingChart } from '../charts/SpendingChart';
import { CategoryBreakdown } from '../charts/CategoryBreakdown';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Calendar, TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import type { FinancialData, MonthData } from '@/lib/types';

interface DashboardProps {
  selectedYear: number;
  selectedMonth: number;
  availableMonths: MonthData[];
  onPeriodChange: (period: {year: number, month: number}) => void;
}

export function Dashboard({ selectedYear, selectedMonth, availableMonths, onPeriodChange }: DashboardProps) {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFinancialData();
  }, [selectedYear, selectedMonth]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getFinancialData(selectedYear, selectedMonth);
      if (response.exists) {
        setFinancialData(response);
      } else {
        setFinancialData(null);
        toast({
          title: "No Data Found",
          description: `No financial data available for ${selectedMonth}/${selectedYear}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Load Data",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    onPeriodChange({ year, month });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px]" />
                <Skeleton className="h-3 w-[80px] mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            No Data Available
          </CardTitle>
          <CardDescription>
            No financial data found for the selected period. Please upload your bank statement first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={handlePeriodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a different period" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(({ year, month }) => (
                  <SelectItem key={`${year}-${month}`} value={`${year}-${month}`}>
                    {new Date(year, month - 1).toLocaleString('default', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { transactions, summary, metrics } = financialData;

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Financial Dashboard
          </CardTitle>
          <CardDescription>
            View and analyze your financial data for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Select 
              value={`${selectedYear}-${selectedMonth}`} 
              onValueChange={handlePeriodChange}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(({ year, month }) => (
                  <SelectItem key={`${year}-${month}`} value={`${year}-${month}`}>
                    {new Date(year, month - 1).toLocaleString('default', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {metrics?.transactionCount || 0} transactions
              </Badge>
              <Badge variant="outline">
                {metrics?.categories || 0} categories
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Spent"
          value={`₹${metrics?.totalSpent?.toLocaleString() || '0'}`}
          description="This month"
          icon={CreditCard}
          trend={metrics?.totalSpent > 0 ? "down" : undefined}
        />
        <MetricCard
          title="Total Income"
          value={`₹${metrics?.totalIncome?.toLocaleString() || '0'}`}
          description="This month"
          icon={DollarSign}
          trend={metrics?.totalIncome > 0 ? "up" : undefined}
        />
        <MetricCard
          title="Transactions"
          value={metrics?.transactionCount?.toString() || '0'}
          description="This month"
          icon={TrendingUp}
        />
        <MetricCard
          title="Categories"
          value={metrics?.categories?.toString() || '0'}
          description="Spending areas"
          icon={TrendingUp}
        />
      </div>

      {/* Charts and Data */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SpendingChart data={summary || []} />
            <CategoryBreakdown data={summary || []} />
          </div>
        </TabsContent>
        
        <TabsContent value="transactions">
          <TransactionTable data={transactions || []} />
        </TabsContent>
        
        <TabsContent value="categories">
          <CategoryBreakdown data={summary || []} showDetails={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}