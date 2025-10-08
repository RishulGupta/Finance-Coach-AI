import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import type { BudgetRecommendation } from '@/lib/types';

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
};

export function BudgetPlanning({ recommendations }: { recommendations: BudgetRecommendation[] }) {
  // --- DEBUGGER ADDED ---
  console.log("💰 [BudgetPlanning] Received recommendations prop:", recommendations);

  // These were already correct
  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0);
  const highPriorityItems = recommendations.filter(rec => rec.priority === 'high');
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Budget Planning</h2>
          <p className="text-muted-foreground">
            AI-powered budget recommendations to optimize your finances
          </p>
        </div>
        <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
          Potential Savings: ₹{totalPotentialSavings.toLocaleString()}/month
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recommendations</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground">
              Budget optimizations available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalPotentialSavings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              If all recommendations applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highPriorityItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items need immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Budget Recommendations</h3>
        
        {recommendations.map((recommendation) => {
          const savingsPercentage = recommendation.currentBudget > 0 
            ? (recommendation.savings / recommendation.currentBudget) * 100 
            : 0;
          
          return (
            <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{recommendation.category}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={priorityColors[recommendation.priority]}
                    >
                      {recommendation.priority} priority
                    </Badge>
                    {recommendation.savings > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Save ₹{recommendation.savings.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Budget</p>
                    <p className="text-xl font-bold">₹{recommendation.currentBudget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recommended Budget</p>
                    <p className="text-xl font-bold text-blue-600">
                      ₹{recommendation.recommendedBudget.toLocaleString()}
                    </p>
                  </div>
                </div>

                {recommendation.savings > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Potential Savings</span>
                      <span className="font-medium text-green-600">
                        {savingsPercentage.toFixed(1)}% reduction
                      </span>
                    </div>
                    <Progress value={savingsPercentage} className="h-2" />
                  </div>
                )}

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Recommendation</p>
                      <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    Apply Recommendation
                  </Button>
                  <Button size="sm" variant="outline">
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900">Budget Optimization Complete</h3>
              <p className="text-purple-700 text-sm">
                Implementing all recommendations could save you ₹{totalPotentialSavings.toLocaleString()} per month (₹{(totalPotentialSavings * 12).toLocaleString()} annually).
              </p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Create Budget Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}