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
   <div
  className="min-h-screen relative bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: `
      linear-gradient(to bottom right, #1a1a1a, #0f0f0f, #1e1e1e)`,
    backgroundAttachment: "fixed",
  }}
>






      {/* Enhanced Premium Header */}
      <motion.header
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
  className="
    sticky top-0 z-50 
    border-b border-white/10 
    bg-[rgba(20,20,20,0.6)] 
    backdrop-blur-xl 
    shadow-[0_4px_40px_rgba(0,0,0,0.6)]
    supports-[backdrop-filter]:bg-[rgba(20,20,20,0.4)]
  "
>
  <div className="container mx-auto px-6 py-5">
    <div className="flex items-center justify-between">
      
      {/* Logo + Title Section */}
      <motion.div 
        className="flex items-center gap-4"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Icon with Neon Ring */}
        <div className="relative">
          <div className="
            h-12 w-12 rounded-2xl flex items-center justify-center 
            bg-gradient-to-br from-emerald-400/20 via-emerald-500/30 to-cyan-400/10
            border border-white/10 
            shadow-[0_0_30px_rgba(0,255,163,0.15)]
          ">
            <DollarSign className="h-7 w-7 text-emerald-300 drop-shadow-[0_0_10px_rgba(0,255,163,0.6)]" />
          </div>

          {/* Sparkle Accent */}
          <div className="
            absolute -top-1 -right-1 w-4 h-4 
            bg-gradient-to-br from-emerald-400 to-cyan-400 
            rounded-full border-2 border-[#0f0f0f] shadow-[0_0_12px_rgba(0,255,200,0.6)]
          ">
            <Sparkles className="w-2 h-2 text-white m-0.5" />
          </div>
        </div>

        {/* Title + Subtitle */}
        <div>
          <h1 className="
            text-3xl font-black 
            bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-200 
            bg-clip-text text-transparent 
            drop-shadow-[0_0_20px_rgba(0,255,163,0.3)]
          ">
            Finance Coach
          </h1>
          <p className="text-sm text-neutral-400 font-medium flex items-center gap-2">
            <Zap className="w-3 h-3 text-emerald-400" />
            Your AI-Powered Financial Advisor
          </p>
        </div>
      </motion.div>

      {/* Status Indicators */}
      <div className="flex items-center gap-4">
        
        {/* Connection Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Badge 
            variant={isBackendConnected ? "default" : "destructive"}
            className={`px-4 py-2 font-semibold text-xs uppercase tracking-wide rounded-xl border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] ${
              isBackendConnected 
                ? 'bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 text-white hover:opacity-90' 
                : 'bg-gradient-to-r from-rose-500/80 to-rose-600/80 text-white'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isBackendConnected ? 'bg-emerald-300 animate-pulse' : 'bg-rose-300'
            }`} />
            {isBackendConnected ? "Live" : "Offline"}
          </Badge>
        </motion.div>

        {/* Data Period Badge */}
        {availableMonths.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Badge 
              variant="outline" 
              className="
                px-4 py-2 border-white/10 
                bg-[rgba(255,255,255,0.05)] 
                text-emerald-300 font-semibold 
                rounded-xl shadow-[0_0_12px_rgba(0,255,163,0.15)]
                backdrop-blur-md hover:bg-[rgba(255,255,255,0.1)]
              "
            >
              <Activity className="w-3 h-3 mr-2 text-emerald-400" />
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
              <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-white/20"
>
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
                <TabsList className="grid w-full grid-cols-4 lg:w-[720px] h-16 p-2 bg-white/5 backdrop-blur-xl rounded-2xl shadow-inner border border-white/10">

                    <TabsTrigger 
                      value="upload" 
                      className="flex items-center justify-center gap-2 text-sm font-semibold text-white/80 
data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent 
data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(0,255,163,0.3)] 
rounded-xl transition-all duration-300 hover:text-white"

                    >
                      <Upload className="h-5 w-5" />
                      <span>Upload</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="dashboard" 
                      className="flex items-center justify-center gap-2 text-sm font-semibold text-white/80 
data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent 
data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(0,255,163,0.3)] 
rounded-xl transition-all duration-300 hover:text-white"

                    >
                      <BarChart3 className="h-5 w-5" />
                      <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="advisor" 
                      className="flex items-center justify-center gap-2 text-sm font-semibold text-white/80 
data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent 
data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(0,255,163,0.3)] 
rounded-xl transition-all duration-300 hover:text-white"

                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>AI Advisor</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="insights" 
                      className="flex items-center justify-center gap-2 text-sm font-semibold text-white/80 
data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent 
data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(0,255,163,0.3)] 
rounded-xl transition-all duration-300 hover:text-white"

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
                          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-white/20"
>
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
                        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-white/20"
>
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