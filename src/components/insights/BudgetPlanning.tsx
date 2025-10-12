import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Target, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { BudgetRecommendation } from '@/lib/types';

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
};

export function BudgetPlanning({ recommendations }: { recommendations: BudgetRecommendation[] }) {
  console.log("💰 [BudgetPlanning] Received recommendations prop:", recommendations);

  const [appliedRecommendations, setAppliedRecommendations] = useState<string[]>([]);
  const [selectedRec, setSelectedRec] = useState<BudgetRecommendation | null>(null);
  // State to control the new budget plan summary dialog
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0);
  const highPriorityItems = recommendations.filter(rec => rec.priority === 'high');

  const handleApply = (recommendation: BudgetRecommendation) => {
    // Toggle the selection
    setAppliedRecommendations(prev => 
      prev.includes(recommendation.id)
        ? prev.filter(id => id !== recommendation.id)
        : [...prev, recommendation.id]
    );
    
    if (!appliedRecommendations.includes(recommendation.id)) {
      toast.success(`Added ${recommendation.category} to your plan.`);
    }
  };

  const handleCreatePlan = () => {
    if (appliedRecommendations.length === 0) {
      toast.warning("No recommendations have been selected.", {
        description: "Click 'Apply Recommendation' on a card to add it to your plan.",
      });
      return;
    }
    // Set state to true to open the summary dialog
    setIsPlanDialogOpen(true);
  };
  
  // This function handles closing the summary dialog and resetting the state
  const handlePlanDialogChange = (isOpen: boolean) => {
    setIsPlanDialogOpen(isOpen);
    // If the dialog is closing, reset the selections
    if (!isOpen) {
      setAppliedRecommendations([]);
      toast.info("Your temporary budget plan has been cleared.");
    }
  };

  // Calculate savings based only on applied recommendations
  const appliedSavings = recommendations
    .filter(rec => appliedRecommendations.includes(rec.id))
    .reduce((sum, rec) => sum + rec.savings, 0);

  return (
    <div className="space-y-6">
      {/* --- Top Section and Summary Cards (No changes here) --- */}
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recommendations</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground">Budget optimizations available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalPotentialSavings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">If all recommendations applied</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highPriorityItems.length}</div>
            <p className="text-xs text-muted-foreground">Items need immediate attention</p>
          </CardContent>
        </Card>
      </div>
      
      {/* --- Budget Recommendations Section (Updated) --- */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Budget Recommendations</h3>
        
        {recommendations.map((recommendation) => {
          const savingsPercentage = recommendation.currentBudget > 0 
            ? (recommendation.savings / recommendation.currentBudget) * 100 
            : 0;
          const isApplied = appliedRecommendations.includes(recommendation.id);
          
          return (
            <Card key={recommendation.id} className={`transition-all ${isApplied ? 'bg-blue-50 border-blue-200' : 'hover:shadow-md'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{recommendation.category}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={priorityColors[recommendation.priority]}>{recommendation.priority} priority</Badge>
                    {recommendation.savings > 0 && <Badge variant="secondary" className="bg-green-100 text-green-800">Save ₹{recommendation.savings.toLocaleString()}</Badge>}
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
                    <p className="text-xl font-bold text-blue-600">₹{recommendation.recommendedBudget.toLocaleString()}</p>
                  </div>
                </div>
                {recommendation.savings > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Potential Savings</span>
                      <span className="font-medium text-green-600">{savingsPercentage.toFixed(1)}% reduction</span>
                    </div>
                    <Progress value={savingsPercentage} className="h-2" />
                  </div>
                )}
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI Recommendation</p>
                      <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleApply(recommendation)} variant={isApplied ? 'default' : 'secondary'}>
                    <CheckCircle className={`mr-2 h-4 w-4 transition-all ${isApplied ? 'scale-100' : 'scale-0'}`} />
                    {isApplied ? 'Selected' : 'Select for Plan'}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedRec(recommendation)}>Learn More</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Details for {selectedRec?.category}</DialogTitle>
                        <DialogDescription>Here's a detailed breakdown of this budget recommendation.</DialogDescription>
                      </DialogHeader>
                      <div className="mt-4 space-y-4 text-sm">
                        <p><strong className="font-medium">Reasoning:</strong> {selectedRec?.reason}</p>
                        <div className="grid grid-cols-2 gap-2 p-3 rounded-md border">
                          <div><strong className="text-muted-foreground">Current Spend:</strong><br />₹{selectedRec?.currentBudget.toLocaleString()}</div>
                          <div><strong className="text-muted-foreground">Recommended:</strong><br />₹{selectedRec?.recommendedBudget.toLocaleString()}</div>
                          <div><strong className="text-muted-foreground">Potential Savings:</strong><br /><span className="text-green-600 font-semibold">₹{selectedRec?.savings.toLocaleString()}</span></div>
                          <div><strong className="text-muted-foreground">Priority:</strong><br /><Badge variant="outline" className={priorityColors[selectedRec?.priority || 'low']}>{selectedRec?.priority}</Badge></div>
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

      {/* --- Final "Create Plan" Section (Updated with Dialog) --- */}
      <Dialog open={isPlanDialogOpen} onOpenChange={handlePlanDialogChange}>
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100"><TrendingUp className="h-6 w-6 text-purple-600" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900">Finalize Your Budget Plan</h3>
                <p className="text-purple-700 text-sm">
                  You have selected {appliedRecommendations.length} item(s) with a total potential savings of ₹{appliedSavings.toLocaleString()}.
                </p>
              </div>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleCreatePlan}>
                  Create Budget Plan
                </Button>
              </DialogTrigger>
            </div>
          </CardContent>
        </Card>

        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Your New Budget Plan</DialogTitle>
            <DialogDescription>
              Here is a summary of your selected optimizations. This temporary plan will be cleared when you close this window.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-4">
            {recommendations
              .filter(rec => appliedRecommendations.includes(rec.id))
              .map(rec => (
                <div key={rec.id} className="p-3 border rounded-lg bg-muted/50 text-sm">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-base">{rec.category}</h4>
                    <span className="font-bold text-green-600">Save ₹{rec.savings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground mt-1">
                    <span>Current: ₹{rec.currentBudget.toLocaleString()}</span>
                    <span>New: ₹{rec.recommendedBudget.toLocaleString()}</span>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted font-bold flex justify-between text-lg">
            <span>Total Monthly Savings:</span>
            <span className="text-green-600">
              ₹{appliedSavings.toLocaleString()}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}