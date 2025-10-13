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
  up: 'text-green-700',
  down: 'text-red-700',
  stable: 'text-gray-700'
};

const severityConfig = {
  info: {
    icon: Info,
    color: 'text-blue-800', 
    bgColor: 'bg-blue-50 border-blue-200',
    badgeVariant: 'secondary' as const
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-800', 
    bgColor: 'bg-yellow-50 border-yellow-200',
    badgeVariant: 'outline' as const
  },
  critical: {
    icon: AlertCircle,
    color: 'text-red-800',
    bgColor: 'bg-red-50 border-red-200',
    badgeVariant: 'destructive' as const
  }
};

export function SpendingAnalysis({ insights }: { insights: SpendingInsight[] }) {
  const totalCurrentSpend = insights.reduce((sum, insight) => sum + insight.currentSpend, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Spending Analysis</h2>
          <p className="text-slate-600">
            Advanced analysis of your spending patterns and trends
          </p>
        </div>
        <Badge variant="outline" className="text-sm text-white">
          Total: ₹{totalCurrentSpend.toLocaleString()}
        </Badge>
      </div>

      {/* Spending Insights Cards */}
      <div className="grid gap-4">
        {insights.map((insight) => {
          const TrendIcon = trendIcons[insight.trend];
          const severityInfo = severityConfig[insight.severity];
          const SeverityIcon = severityInfo.icon;

          return (
            <Card
              key={insight.id}
              className={`hover:shadow-md transition-shadow border ${severityInfo.bgColor}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg text-black">{insight.category}</CardTitle>
                    <Badge variant={severityInfo.badgeVariant} className="capitalize">
                      {insight.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendIcon className={`h-4 w-4 ${trendColors[insight.trend]}`} />
                    <span className={`text-sm font-medium ${trendColors[insight.trend]}`}>
                      {insight.percentage > 0 ? '+' : ''}{insight.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Spending Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-black">Current Month</p>
                    <p className="text-xl font-bold text-black">₹{insight.currentSpend.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Previous Month</p>
                    <p className="text-lg font-medium text-black">₹{insight.avgSpend.toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-black">Spending vs Previous</span>
                    <span className="text-black">
                      {Math.abs(insight.percentage)}% {insight.trend === 'up' ? 'above' : insight.trend === 'down' ? 'below' : 'same as'} previous
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (insight.currentSpend / Math.max(1, insight.avgSpend)) * 100)}
                    className="h-2 rounded-full"
                  />
                </div>

                {/* Recommendation */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/80 border">
                  <SeverityIcon className={`h-5 w-5 mt-0.5 ${severityInfo.color}`} />
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

      {/* Summary Card */}
      <Card className="bg-green-50 border-green-200">
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
