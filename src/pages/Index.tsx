import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { ChatInterface } from '@/components/advisor/ChatInterface';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import type { MonthData, UploadSuccessData } from '@/lib/types';
import { 
  TrendingUp, 
  MessageSquare, 
  Upload, 
  BarChart3, 
  DollarSign,
  PieChart,
  Activity,
  AlertCircle
} from 'lucide-react';

export default function Index() {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<MonthData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState({ year: 2024, month: 1 });
  const { toast } = useToast();

  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection();
    loadAvailableMonths();
  }, []);

  const checkBackendConnection = async () => {
    try {
      await apiClient.healthCheck();
      setIsBackendConnected(true);
    } catch (error) {
      setIsBackendConnected(false);
      toast({
        title: "Backend Connection Failed",
        description: "Make sure the backend server is running on port 8000",
        variant: "destructive"
      });
    }
  };

  const loadAvailableMonths = async () => {
    try {
      const response = await apiClient.getAvailableMonths();
      setAvailableMonths(response.months || []);
      if (response.months && response.months.length > 0) {
        const latest = response.months[0];
        setSelectedPeriod({ year: latest.year, month: latest.month });
      }
    } catch (error) {
      console.error('Failed to load available months:', error);
    }
  };

  const handleUploadSuccess = (data: UploadSuccessData) => {
    toast({
      title: "Upload Successful",
      description: `Processed ${data.transactions} transactions`,
    });
    loadAvailableMonths();
    setSelectedPeriod({ year: data.year, month: data.month });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  FinanceIQ
                </h1>
                <p className="text-xs text-muted-foreground font-medium">AI-Powered Financial Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={isBackendConnected ? "default" : "destructive"}
                className="px-3 py-1 shadow-sm"
              >
                {isBackendConnected ? "● Live" : "● Offline"}
              </Badge>
              {availableMonths.length > 0 && (
                <Badge variant="outline" className="px-3 py-1 border-primary/30">
                  {availableMonths.length} period{availableMonths.length > 1 ? 's' : ''} tracked
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!isBackendConnected ? (
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-destructive text-xl">
                <AlertCircle className="h-6 w-6" />
                Backend Connection Required
              </CardTitle>
              <CardDescription className="text-base">
                To use this application, please start the backend server:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-5 rounded-xl font-mono text-sm space-y-1">
                <div>cd backend</div>
                <div>pip install -r requirements.txt</div>
                <div>uvicorn app:app --reload --port 8000</div>
              </div>
              <p className="text-sm text-muted-foreground mt-5">
                Make sure to configure your Firebase credentials in the .env file.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upload" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 lg:w-[640px] mx-auto h-14 p-1 bg-muted/50 rounded-xl shadow-sm">
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <Upload className="h-4 w-4" />
                <span className="font-medium">Upload</span>
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="advisor" 
                className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">AI Advisor</span>
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Insights</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-8">
              <div className="max-w-2xl mx-auto">
                <FileUpload onUploadSuccess={handleUploadSuccess} />
                
                {availableMonths.length > 0 && (
                  <Card className="mt-8 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Available Data Periods</CardTitle>
                      <CardDescription>
                        You have financial data for the following periods
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {availableMonths.map(({ year, month }) => (
                          <Badge 
                            key={`${year}-${month}`} 
                            variant={
                              selectedPeriod.year === year && selectedPeriod.month === month 
                                ? "default" 
                                : "secondary"
                            }
                            className="px-3 py-1.5 text-sm font-medium"
                          >
                            {new Date(year, month - 1).toLocaleString('default', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="dashboard">
              <Dashboard 
                selectedYear={selectedPeriod.year} 
                selectedMonth={selectedPeriod.month}
                availableMonths={availableMonths}
                onPeriodChange={setSelectedPeriod}
              />
            </TabsContent>

            <TabsContent value="advisor">
              <div className="max-w-4xl mx-auto">
                <ChatInterface />
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Investment Tips</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Coming Soon</div>
                    <p className="text-xs text-muted-foreground">
                      Personalized investment recommendations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Spending Analysis</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Coming Soon</div>
                    <p className="text-xs text-muted-foreground">
                      Advanced spending pattern analysis
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Budget Planning</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Coming Soon</div>
                    <p className="text-xs text-muted-foreground">
                      AI-powered budget recommendations
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}