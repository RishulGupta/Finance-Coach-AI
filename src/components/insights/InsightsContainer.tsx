// src/components/insights/InsightsContainer.tsx
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvestmentTips } from '@/components/insights/InvestmentsTips';
import { SpendingAnalysis } from '@/components/insights/spendingAnalysis';
import { BudgetPlanning } from '@/components/insights/BudgetPlanning';
import { apiClient } from '@/lib/api';
import type { FinancialInsights } from '@/lib/types';
import { Brain, Target, PieChart, Activity, AlertCircle, Calendar } from 'lucide-react';

interface InsightsContainerProps {
  year: number;
  month: number;
  onPeriodChange?: (year: number, month: number) => void;
}

export function InsightsContainer({ year, month, onPeriodChange }: InsightsContainerProps) {
  const [activeInsightTab, setActiveInsightTab] = useState('investment');
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(month);

  // Generate year options (current year and previous 2 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);
  
  // Month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const handlePeriodChange = (newYear: number, newMonth: number) => {
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    onPeriodChange?.(newYear, newMonth);
  };

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.getInsights(selectedYear, selectedMonth);
        
        // --- DEBUGGER ADDED ---
        console.log("✅ [InsightsContainer] Data received from API:", data); 
        // You should see the full object with spendingAnalysis, budgetRecommendations, etc.

        setInsights(data);
      } catch (err: any) {
        // --- DEBUGGER ADDED ---
        console.error("❌ [InsightsContainer] Error fetching insights:", err);
        
        setError(err.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [selectedYear, selectedMonth]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Financial Insights
            </CardTitle>
            <CardDescription>
              AI-powered analysis and recommendations for your financial health
            </CardDescription>
          </div>
          
          {/* Month/Year Selection */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(value) => handlePeriodChange(selectedYear, parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => handlePeriodChange(parseInt(value), selectedMonth)}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption.toString()}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="text-center p-8">
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-5 w-5 animate-pulse" />
              Generating AI insights for {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}...
            </div>
          </div>
        )}
        {error && (
            <div className="text-center p-8 text-destructive flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p>Error: {error}</p>
            </div>
        )}
        {!isLoading && !error && insights && (
          <Tabs value={activeInsightTab} onValueChange={setActiveInsightTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="investment" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Investment Tips
              </TabsTrigger>
              <TabsTrigger value="spending" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Spending Analysis
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Budget Planning
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="investment">
                <InvestmentTips 
                  tips={insights.investmentTips} 
                  year={selectedYear} 
                  month={selectedMonth} 
                />
              </TabsContent>
              <TabsContent value="spending">
                <SpendingAnalysis insights={insights.spendingAnalysis} />
              </TabsContent>
              <TabsContent value="budget">
                <BudgetPlanning recommendations={insights.budgetRecommendations} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}