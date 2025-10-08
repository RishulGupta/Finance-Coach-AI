import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, Target, AlertTriangle } from 'lucide-react';
import type { InvestmentTip } from '@/lib/types'; // Import type

const riskColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200'
};

const categoryIcons = {
  stocks: TrendingUp,
  bonds: Target,
  crypto: AlertTriangle,
  savings: Clock,
  'real-estate': Target
};

export function InvestmentTips({ tips }: { tips: InvestmentTip[] }) {
  // --- DEBUGGER ADDED ---
  console.log("💡 [InvestmentTips] Received tips prop:", tips);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Investment Tips</h2>
          <p className="text-muted-foreground">
            Personalized investment recommendations based on your financial profile
          </p>
        </div>
        <Button variant="outline" size="sm">
          View All Tips
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tips.map((tip) => {
          const IconComponent = categoryIcons[tip.category];
          return (
            <Card key={tip.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={riskColors[tip.riskLevel]}
                    >
                      {tip.riskLevel} risk
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Priority {tip.priority}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{tip.title}</CardTitle>
                <CardDescription className="text-sm">
                  {tip.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Expected Return</p>
                      <p className="font-medium text-green-600">{tip.expectedReturn}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time Horizon</p>
                      <p className="font-medium">{tip.timeHorizon}</p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Ready to Start Investing?</h3>
              <p className="text-blue-700 text-sm">
                Get personalized investment advice from our AI advisor based on your spending patterns.
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}