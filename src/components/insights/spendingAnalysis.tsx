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
  up: 'text-red-500',
  down: 'text-green-500',
  stable: 'text-gray-500'
};

const severityConfig = {
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 border-blue-200',
    badgeVariant: 'secondary' as const
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 border-yellow-200',
    badgeVariant: 'outline' as const
  },
  critical: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 border-red-200',
    badgeVariant: 'destructive' as const
  }
};

export function SpendingAnalysis({ insights }: { insights: SpendingInsight[] }) {
  // --- DEBUGGER ADDED ---
  console.log("📊 [SpendingAnalysis] Received insights prop:", insights);
  // This should show the array of spending insights.

  // This was already correct, using the prop
  const totalCurrentSpend = insights.reduce((sum, insight) => sum + insight.currentSpend, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Spending Analysis</h2>
          <p className="text-muted-foreground">
            Advanced analysis of your spending patterns and trends
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Total: ₹{totalCurrentSpend.toLocaleString()}
        </Badge>
      </div>

      <div className="grid gap-4">
        {insights.map((insight) => {
          const TrendIcon = trendIcons[insight.trend];
          const severityInfo = severityConfig[insight.severity];
          const SeverityIcon = severityInfo.icon;
          
          return (
            <Card key={insight.id} className={`hover:shadow-md transition-shadow ${severityInfo.bgColor}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{insight.category}</CardTitle>
                    <Badge variant={severityInfo.badgeVariant}>
                      {insight.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendIcon className={`h-4 w-4 ${trendColors[insight.trend]}`} />
                    <span className={`text-sm font-medium ${trendColors[insight.trend]}`}>
                      {insight.percentage > 0 ? '+' : ''}{insight.percentage}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Month</p>
                    <p className="text-xl font-bold">₹{insight.currentSpend.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average</p>
                    <p className="text-lg font-medium text-muted-foreground">
                      ₹{insight.avgSpend.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spending vs Average</span>
                    <span>{Math.abs(insight.percentage)}% {insight.trend === 'up' ? 'above' : insight.trend === 'down' ? 'below' : 'same as'} average</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (insight.currentSpend / Math.max(insight.currentSpend, insight.avgSpend)) * 100)} 
                    className="h-2"
                  />
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50">
                  <SeverityIcon className={`h-4 w-4 mt-0.5 ${severityInfo.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Recommendation</p>
                    <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Spending Insights Summary</h3>
              <p className="text-green-700 text-sm">
                You have {insights.filter(i => i.severity === 'critical').length} critical areas to address and {insights.filter(i => i.trend === 'down').length} categories showing improvement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}