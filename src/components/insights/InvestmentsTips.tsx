import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, Clock, Target, AlertTriangle, Loader2, Brain } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { InvestmentTip } from '@/lib/types';

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

interface InvestmentTipsProps {
  tips: InvestmentTip[];
  year: number;
  month: number;
}

// ✅ UPDATED HELPER FUNCTION: Extracts and cleans text from API responses
const getInvestmentDataText = (
  response: unknown
): string => {
  let rawText = '';

  // Step 1: Extract the raw string from the various possible response shapes
  if (typeof response === 'string') {
    rawText = response;
  } else if (typeof response === 'object' && response !== null) {
    const data = response as { recommendations?: string; advice?: string };
    rawText = data.recommendations || data.advice || 'No data available';
  } else {
    return 'No data available';
  }

  // Step 2: Clean the extracted text to remove all markdown formatting
  const cleanedText = rawText
    // Remove markdown headings (e.g., #, ##, ###)
    .replace(/#{1,3}\s/g, '')
    // Remove bold and italic asterisks (e.g., **, *)
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    // Remove markdown table formatting characters and lines
    .replace(/\|/g, ' ')
    .replace(/---\s*$/gm, '')
    .replace(/:---\s*:/g, ' ')
    .replace(/:-/g, ' ')
    .replace(/--:/g, ' ')
    // Normalize line breaks to prevent large empty spaces
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace from the start and end
    .trim();

  return cleanedText;
};


export function InvestmentTips({ tips, year, month }: InvestmentTipsProps) {
  const [loading, setLoading] = useState(false);
  const [detailedAdvice, setDetailedAdvice] = useState<string>('');
  const [selectedTip, setSelectedTip] = useState<InvestmentTip | null>(null);

  console.log("💡 [InvestmentTips] Received tips prop:", tips);

  const handleViewAllTips = async () => {
    setLoading(true);
    try {
      console.log(`[InvestmentTips] Fetching investment advice for ${month}/${year}`);
      const response = await apiClient.getInvestmentAdvice(year, month);
      console.log('[InvestmentTips] Investment advice response:', response);
      
      // The helper function now automatically cleans the response
      const advice = getInvestmentDataText(response);
      setDetailedAdvice(advice);
    } catch (error) {
      console.error('Failed to load detailed tips:', error);
      setDetailedAdvice(`Failed to load detailed investment advice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLearnMore = (tip: InvestmentTip) => {
    setSelectedTip(tip);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Investment Tips</h2>
          <p className="text-muted-foreground">
            Real-time investment recommendations for {month}/{year}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViewAllTips}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  View All Tips
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detailed Investment Advice</DialogTitle>
              <DialogDescription>
                Comprehensive investment recommendations for {month}/{year}, based on your financial data.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {detailedAdvice ? (
                <div className="whitespace-pre-wrap text-sm">
                  {detailedAdvice}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  Click "View All Tips" to load detailed advice from the backend.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleLearnMore(tip)}
                      >
                        Learn More
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{selectedTip?.title}</DialogTitle>
                        <DialogDescription>
                          Detailed analysis for this investment tip
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4 space-y-4">
                        <div>
                          <h4 className="font-semibold">Description</h4>
                          <p className="text-sm text-muted-foreground">{selectedTip?.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold">Risk Level</h4>
                            <Badge className={riskColors[selectedTip?.riskLevel || 'medium']}>
                              {selectedTip?.riskLevel} risk
                            </Badge>
                          </div>
                          <div>
                            <h4 className="font-semibold">Category</h4>
                            <p className="text-sm capitalize">{selectedTip?.category}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold">Expected Return</h4>
                          <p className="text-sm font-medium text-green-600">{selectedTip?.expectedReturn}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Time Horizon</h4>
                          <p className="text-sm">{selectedTip?.timeHorizon}</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}