// src/components/insights/InsightsContainer.tsx
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvestmentTips } from '@/components/insights/InvestmentsTips';
import { SpendingAnalysis } from '@/components/insights/spendingAnalysis';
import { BudgetPlanning } from '@/components/insights/BudgetPlanning';
import { apiClient } from '@/lib/api';
import type { FinancialInsights } from '@/lib/types';
import { Brain, Target, PieChart, Activity, AlertCircle } from 'lucide-react';

interface InsightsContainerProps {
  year: number;
  month: number;
}

export function InsightsContainer({ year, month }: InsightsContainerProps) {
  const [activeInsightTab, setActiveInsightTab] = useState('investment');
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.getInsights(year, month);
        
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
  }, [year, month]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Financial Insights
        </CardTitle>
        <CardDescription>
          AI-powered analysis and recommendations for your financial health
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="text-center p-8">Generating AI insights...</div>}
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
                <InvestmentTips tips={insights.investmentTips} />
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