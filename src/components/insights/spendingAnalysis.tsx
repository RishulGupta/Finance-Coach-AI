import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { SpendingInsight } from '@/lib/types';

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus
};

const trendColors = {
  up: 'text-black',
  down: 'text-black',
  stable: 'text-black'
};

const severityConfig = {
  info: {
    icon: Info,
    color: 'text-blue-800', 
    bgColor: 'bg-blue-100 border-blue-300',
    badgeVariant: 'secondary' as const
  },
  warning: {
    icon: AlertCircle,
    // --- ✅ FIX: Changed icon color to black as requested (and corrected a typo) ---
    color: 'text-black', 
    bgColor: 'bg-yellow-100 border-yellow-300',
    badgeVariant: 'outline' as const
  },
  critical: {
    icon: AlertCircle,
    color: 'text-red-800',
    bgColor: 'bg-red-100 border-red-300',
    badgeVariant: 'destructive' as const
  }
};

export function SpendingAnalysis({ insights }: { insights: SpendingInsight[] }) {
  console.log("📊 [SpendingAnalysis] Received insights prop:", insights);
  const totalCurrentSpend = insights.reduce((sum, insight) => sum + insight.currentSpend, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-black">Spending Analysis</h2>
          <p className="text-slate-600">
            Advanced analysis of your spending patterns and trends
          </p>
        </div>
        <Badge variant="outline" className="text-sm text-black">
          Total: ₹{totalCurrentSpend.toLocaleString()}
        </Badge>
      </div>

      <div className="grid gap-4">
        {insights.map((insight) => {
          const TrendIcon = trendIcons[insight.trend];
          // This will now correctly pull the black color for warnings
          const severityInfo = severityConfig[insight.severity];
          const SeverityIcon = severityInfo.icon;
          
          return (
            <Card key={insight.id} className={`hover:shadow-lg transition-shadow ${severityInfo.bgColor}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg text-black">{insight.category}</CardTitle>
                    <Badge variant={severityInfo.badgeVariant}>
                      {insight.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* The icon's color comes from severityInfo.color */}
                    <TrendIcon className={`h-4 w-4 ${severityInfo.color}`} />
                    <span className={`text-sm font-medium text-black`}>
                      {insight.percentage > 0 ? '+' : ''}{insight.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-black">Current Month</p>
                    <p className="text-xl font-bold text-black">₹{insight.currentSpend.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Previous Month</p>
                    <p className="text-lg font-medium text-black">
                      ₹{insight.avgSpend.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-black">Spending vs Previous</span>
                    <span className="text-black">{Math.abs(insight.percentage)}% {insight.trend === 'up' ? 'above' : insight.trend === 'down' ? 'below' : 'same as'} previous</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (insight.currentSpend / Math.max(1, insight.avgSpend)) * 100)} 
                    className="h-2"
                  />
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70">
                  <SeverityIcon className={`h-4 w-4 mt-0.5 ${severityInfo.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black">Recommendation</p>
                    <p className="text-sm text-black">{insight.recommendation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-200">
              <CheckCircle className="h-6 w-6 text-green-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black">Spending Insights Summary</h3>
              <p className="text-sm text-black">
                You have {insights.filter(i => i.severity === 'critical').length} critical areas to address and {insights.filter(i => i.trend === 'down').length} categories showing improvement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}