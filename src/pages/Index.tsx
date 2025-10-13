import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { ChatInterface } from '@/components/advisor/ChatInterface';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { InsightsContainer } from '@/components/insights/InsightsContainer';

import type { MonthData, UploadSuccessData } from '@/lib/types';
import { 
  TrendingUp, 
  MessageSquare, 
  Upload, 
  BarChart3, 
  DollarSign,
  PieChart,
  Activity,
  AlertCircle,
  Target,
  Brain,
  Sparkles,
  Zap
} from 'lucide-react';

export default function Index() {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<MonthData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState({ year: 2024, month: 1 });
  const [activeInsightTab, setActiveInsightTab] = useState('investment');
  const [isLoading, setIsLoading] = useState(true);
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
    } finally {
      setIsLoading(false);
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

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Enhanced Premium Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-border/40 bg-card/60 backdrop-blur-2xl shadow-xl"
      >
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-4"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative">
                <div className="h-12 w-12 gradient-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/25">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-2 border-background shadow-lg">
                  <Sparkles className="w-2 h-2 text-white m-0.5" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">
                  Finance Coach
                </h1>
                <p className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  Your AI-Powered Financial Advisor
                </p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <Badge 
                  variant={isBackendConnected ? "default" : "destructive"}
                  className={`px-4 py-2 shadow-lg font-bold text-xs uppercase tracking-wide ${
                    isBackendConnected 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' 
                      : 'bg-gradient-to-r from-rose-500 to-rose-600'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    isBackendConnected ? 'bg-emerald-200 animate-pulse' : 'bg-rose-200'
                  }`} />
                  {isBackendConnected ? "Live" : "Offline"}
                </Badge>
              </motion.div>
              
              {availableMonths.length > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Badge 
                    variant="outline" 
                    className="px-4 py-2 border-primary/40 bg-primary/5 text-primary font-bold shadow-lg backdrop-blur-sm"
                  >
                    <Activity className="w-3 h-3 mr-2" />
                    {availableMonths.length} period{availableMonths.length > 1 ? 's' : ''} tracked
                  </Badge>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {!isBackendConnected ? (
            <motion.div
              key="offline"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto"
            >
              <Card className="premium-card shadow-2xl border-destructive/20">
                <CardHeader className="text-center pb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-3xl flex items-center justify-center"
                  >
                    <AlertCircle className="h-10 w-10 text-destructive" />
                  </motion.div>
                  <CardTitle className="text-2xl font-black text-destructive mb-2">
                    Backend Connection Required
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    To use this application, please start the backend server:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-6 rounded-2xl font-mono text-sm space-y-2 border border-border/50">
                    <div className="text-primary">cd backend</div>
                    <div className="text-accent">pip install -r requirements.txt</div>
                    <div className="text-secondary">uvicorn app:app --reload --port 8000</div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-6 text-center">
                    Make sure to configure your Firebase credentials in the .env file.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="online"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-10"
            >
              <Tabs defaultValue="upload" className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="flex justify-center"
                >
                  <TabsList className="premium-tabs grid grid-cols-4 lg:w-[720px] h-16 p-2 shadow-xl">
                    <TabsTrigger 
                      value="upload" 
                      className="premium-tab flex items-center gap-3 text-sm font-bold"
                    >
                      <Upload className="h-5 w-5" />
                      <span>Upload</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="dashboard" 
                      className="premium-tab flex items-center gap-3 text-sm font-bold"
                    >
                      <BarChart3 className="h-5 w-5" />
                      <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="advisor" 
                      className="premium-tab flex items-center gap-3 text-sm font-bold"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>AI Advisor</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="insights" 
                      className="premium-tab flex items-center gap-3 text-sm font-bold"
                    >
                      <TrendingUp className="h-5 w-5" />
                      <span>Insights</span>
                    </TabsTrigger>
                  </TabsList>
                </motion.div>

                <AnimatePresence mode="wait">
                  <TabsContent value="upload" className="space-y-8">
                    <motion.div
                      variants={tabVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="max-w-3xl mx-auto"
                    >
                      <FileUpload onUploadSuccess={handleUploadSuccess} />
                      
                      {availableMonths.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          <Card className="premium-card mt-8 shadow-xl">
                            <CardHeader>
                              <CardTitle className="text-xl font-bold flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10">
                                  <Target className="h-5 w-5 text-primary" />
                                </div>
                                Available Data Periods
                              </CardTitle>
                              <CardDescription className="text-base">
                                You have financial data for the following periods
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-3">
                                {availableMonths.map(({ year, month }, index) => (
                                  <motion.div
                                    key={`${year}-${month}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1, duration: 0.3 }}
                                  >
                                    <Badge 
                                      variant={
                                        selectedPeriod.year === year && selectedPeriod.month === month 
                                          ? "default" 
                                          : "secondary"
                                      }
                                      className={`px-4 py-2 text-sm font-bold shadow-lg transition-all duration-300 hover:scale-105 ${
                                        selectedPeriod.year === year && selectedPeriod.month === month
                                          ? 'bg-gradient-to-r from-primary to-accent text-white shadow-primary/25'
                                          : 'hover:bg-muted/80'
                                      }`}
                                    >
                                      {new Date(year, month - 1).toLocaleString('default', { 
                                        month: 'long', 
                                        year: 'numeric' 
                                      })}
                                    </Badge>
                                  </motion.div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="dashboard">
                    <motion.div
                      variants={tabVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <Dashboard 
                        selectedYear={selectedPeriod.year} 
                        selectedMonth={selectedPeriod.month}
                        availableMonths={availableMonths}
                        onPeriodChange={setSelectedPeriod}
                      />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="advisor">
                    <motion.div
                      variants={tabVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="max-w-6xl mx-auto"
                    >
                      <ChatInterface />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="insights">
                    <motion.div
                      variants={tabVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {availableMonths.length > 0 ? (
                        <InsightsContainer 
                          year={selectedPeriod.year} 
                          month={selectedPeriod.month} 
                        />
                      ) : (
                        <Card className="premium-card max-w-2xl mx-auto shadow-xl">
                          <CardHeader className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-accent/20 to-accent/10 rounded-3xl flex items-center justify-center">
                              <Brain className="h-8 w-8 text-accent" />
                            </div>
                            <CardTitle className="text-xl font-bold">No Data for Insights</CardTitle>
                            <CardDescription className="text-base">
                              Please upload a financial statement to generate AI-powered insights.
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      )}
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}