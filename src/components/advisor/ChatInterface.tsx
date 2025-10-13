import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Trash2, Calendar, AlertCircle, Wifi, WifiOff, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  error?: boolean;
}

interface AvailableMonth {
  year: number;
  month: number;
  displayName: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your AI Financial Advisor powered by real data analysis. I can help you understand your spending patterns, provide investment advice, and answer questions about your financial data. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('1');
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [isLoadingMonths, setIsLoadingMonths] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [historyLength, setHistoryLength] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load available months on component mount
  useEffect(() => {
    loadAvailableMonths();
    checkConnection();
  }, []);

  // Clear chat when period changes - SAME AS STREAMLIT
  useEffect(() => {
    const newSessionId = `demo_user_${selectedYear}_${selectedMonth}`;
    if (currentSessionId && newSessionId !== currentSessionId) {
      // Period changed - clear current chat like Streamlit does
      setMessages([{
        id: '1',
        type: 'bot',
        content: "Hello! I'm your AI Financial Advisor powered by real data analysis. I can help you understand your spending patterns, provide investment advice, and answer questions about your financial data. What would you like to know?",
        timestamp: new Date()
      }]);
      setHistoryLength(0);
      
      toast({
        title: "Period Changed",
        description: `Switched to ${getMonthName(parseInt(selectedMonth))} ${selectedYear}. Chat history cleared.`,
        variant: "default"
      });
    }
    setCurrentSessionId(newSessionId);
  }, [selectedYear, selectedMonth, currentSessionId, toast]);

  const loadAvailableMonths = async () => {
    setIsLoadingMonths(true);
    try {
      const monthsData = await apiClient.getAvailableMonths();
      const months: AvailableMonth[] = monthsData.months.map((m: any) => ({
        year: m.year,
        month: m.month,
        displayName: `${getMonthName(m.month)} ${m.year}`
      }));
      
      setAvailableMonths(months);
      
      // Set default to most recent month if available
      if (months.length > 0) {
        const mostRecent = months[months.length - 1];
        setSelectedYear(mostRecent.year.toString());
        setSelectedMonth(mostRecent.month.toString());
      }
      
      console.log('[ChatInterface] Loaded available months:', months);
    } catch (error) {
      console.error('[ChatInterface] Failed to load available months:', error);
      toast({
        title: "Data Loading Error",
        description: "Could not load available data periods. Please upload some financial data first.",
        variant: "default"
      });
    } finally {
      setIsLoadingMonths(false);
    }
  };

  const getMonthName = (month: number): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1] || 'Unknown';
  };

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const isConnected = await apiClient.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (!isConnected) {
        toast({
          title: "Connection Issue",
          description: "Unable to connect to the AI advisor. Please check if the backend server is running.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error('Connection check failed:', error);
    }
  };

  // Clean format message content - NO BOLD FORMATTING
  const formatMessageContent = (content: string) => {
    // Simple clean formatting without bold asterisks
    let formatted = content
      // Clean line breaks
      .replace(/\n\n\n/g, '\n\n')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      // Highlight currency amounts in a subtle way (no bold)
      .replace(/₹(\d+(?:,\d{3})*)/g, '<span class="text-green-700 font-mono">₹$1</span>')
      .replace(/Rs\s*(\d+(?:,\d{3})*)/g, '<span class="text-green-700 font-mono">₹$1</span>')
      // Clean bullet points
      .replace(/^\s*[•-]\s/gm, '• ');

    return formatted;
  };

  // Clean message component without bold formatting
  const MessageContent = ({ content, isBot, hasError }: { content: string, isBot: boolean, hasError?: boolean }) => {
    if (!isBot) {
      return <div className="text-sm whitespace-pre-wrap">{content}</div>;
    }

    // For bot messages, apply clean formatting without bold
    const formatted = formatMessageContent(content);
    
    return (
      <div 
        className={`text-sm ${hasError ? 'text-red-800' : 'text-gray-800'} leading-relaxed`}
        style={{ maxWidth: '100%', wordWrap: 'break-word' }}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    // Check connection before sending
    if (connectionStatus === 'disconnected') {
      toast({
        title: "Connection Error",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      
      console.log(`[ChatInterface] Sending message: "${currentInput}" for ${month}/${year}`);
      
      const response = await apiClient.sendChatMessage(currentInput, year, month);
      
      console.log(`[ChatInterface] Received response:`, response);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.response || 'I apologize, but I couldn\'t process your request at the moment.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Update history length from response
      if (response.history_length !== undefined) {
        setHistoryLength(response.history_length);
      }
      
      // Update connection status to connected on successful response
      setConnectionStatus('connected');

    } catch (error) {
      console.error('[ChatInterface] Error:', error);
      
      let errorContent = '';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorContent = `I'm sorry, the request timed out. This might happen with complex queries or if the server is processing large amounts of data. Please try a simpler question or wait a moment and try again.`;
        } else if (error.message.includes('No financial data found')) {
          errorContent = `I don't have financial data for ${getMonthName(parseInt(selectedMonth))} ${selectedYear}. Please make sure you have uploaded your bank statements for this period, or try selecting a different month from the dropdown above.`;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorContent = `I'm having trouble connecting to the server. Please check if the backend is running on http://localhost:8000 and try again.`;
        } else {
          errorContent = `I'm sorry, I encountered an error: ${error.message}. Please make sure you have uploaded financial data for the selected period and the backend server is running.`;
        }
      } else {
        errorContent = 'An unexpected error occurred. Please try again.';
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: errorContent,
        timestamp: new Date(),
        error: true
      };

      setMessages(prev => [...prev, errorMessage]);
      setConnectionStatus('disconnected');
      
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: "destructive"
      });

    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    try {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      
      // Call API to clear server-side history
      await apiClient.clearChatHistory(year, month);
      
      // Clear UI messages but keep initial message
      setMessages([{
        id: '1',
        type: 'bot',
        content: "Hello! I'm your AI Financial Advisor powered by real data analysis. I can help you understand your spending patterns, provide investment advice, and answer questions about your financial data. What would you like to know?",
        timestamp: new Date()
      }]);
      
      setHistoryLength(0);
      
      toast({
        title: "Chat Cleared",
        description: "Chat history has been cleared on both client and server."
      });
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear server-side history, but UI has been cleared.",
        variant: "destructive"
      });
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const quickQuestions = [
    "What did I spend the most on this month?",
    "How does my spending compare to last month?", 
    "Give me investment recommendations",
    "What are the latest IPO opportunities?",
    "Show me my spending breakdown by category"
  ];

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className={`backdrop-blur-xl border-2 ${connectionStatus === 'disconnected' ? 'border-destructive/50 bg-destructive/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                {connectionStatus === 'checking' ? (
                  <Wifi className="h-5 w-5 animate-pulse text-yellow-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-destructive" />
                )}
                <AlertDescription className="font-medium">
                  {connectionStatus === 'checking' 
                    ? 'Connecting to your AI advisor...' 
                    : 'Connection lost. Please ensure the backend server is running.'
                  }
                </AlertDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkConnection}
                className="ml-4"
              >
                Retry
              </Button>
            </div>
          </Alert>
        </motion.div>
      )}

      {/* Enhanced Data Period Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-l-4 border-l-primary shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold">Analysis Period</span>
              </div>
              <div className="flex items-center space-x-2">
                {historyLength > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
                    <History className="h-3.5 w-3.5" />
                    <span className="font-medium">{historyLength} messages</span>
                  </Badge>
                )}
                <Badge variant="outline" className="px-3 py-1 border-primary/30">
                  {availableMonths.length} {availableMonths.length === 1 ? 'period' : 'periods'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoadingMonths ? (
                <div className="flex items-center space-x-3 text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading available periods...</span>
                </div>
              ) : availableMonths.length > 0 ? (
                <div className="space-y-3">
                  <Select 
                    value={`${selectedYear}-${selectedMonth}`} 
                    onValueChange={(value) => {
                      const [year, month] = value.split('-');
                      setSelectedYear(year);
                      setSelectedMonth(month);
                    }}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all">
                      <SelectValue placeholder="Select a data period" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {availableMonths.map((period) => (
                        <SelectItem 
                          key={`${period.year}-${period.month}`} 
                          value={`${period.year}-${period.month}`}
                          className="rounded-lg"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{period.displayName}</span>
                            <Badge variant="secondary" className="ml-3 text-xs">
                              {period.year === new Date().getFullYear() && 
                               period.month === new Date().getMonth() + 1 ? 'Current' : 'Past'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between text-sm px-1">
                    <span className="text-muted-foreground">
                      Analyzing <strong className="text-foreground">{getMonthName(parseInt(selectedMonth))} {selectedYear}</strong>
                    </span>
                    {currentSessionId && (
                      <span className="text-xs text-primary/70 font-mono">
                        {currentSessionId}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/30 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No financial data available</p>
                  <p className="text-xs text-muted-foreground mb-4">Upload your bank statements to get started</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadAvailableMonths}
                    className="rounded-xl"
                  >
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 flex flex-col"
      >
        <Card className="flex-1 flex flex-col shadow-xl border-border/50 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold">AI Financial Advisor</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {connectionStatus === 'connected' && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-600 font-medium">Online</span>
                      </div>
                    )}
                    {historyLength > 0 && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {historyLength} msgs
                      </Badge>
                    )}
                  </div>
                </div>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearChat} className="rounded-xl gap-2">
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 bg-gradient-to-b from-background/50 to-muted/10">
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-4 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                      msg.type === 'user' 
                        ? 'bg-gradient-to-br from-primary to-primary-glow' 
                        : msg.error 
                          ? 'bg-gradient-to-br from-destructive/20 to-destructive/10 border border-destructive/30'
                          : 'bg-gradient-to-br from-accent to-accent-glow'
                    }`}>
                      {msg.type === 'user' ? (
                        <User className="h-5 w-5 text-white" />
                      ) : (
                        <Bot className={`h-5 w-5 ${msg.error ? 'text-destructive' : 'text-white'}`} />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={`flex-1 max-w-3xl ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
                      <div className={`rounded-2xl px-5 py-4 shadow-md backdrop-blur-sm transition-all hover:shadow-lg ${
                        msg.type === 'user'
                          ? 'bg-gradient-to-br from-primary to-primary-glow text-white'
                          : msg.error
                            ? 'bg-destructive/10 border-2 border-destructive/20'
                            : 'bg-card/80 border border-border/50'
                      }`}>
                        <MessageContent content={msg.content} isBot={msg.type === 'bot'} hasError={msg.error} />
                        <div className={`text-xs mt-2.5 flex items-center gap-1.5 ${
                          msg.type === 'user' ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'
                        }`}>
                          <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl px-5 py-4 shadow-md">
                      <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-6 py-4 border-t border-border/50 bg-muted/20">
                <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wide">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickQuestion(question)}
                        className="text-xs rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                      >
                        {question}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-6 border-t border-border/50 bg-card/30 backdrop-blur-sm">
              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask me anything about your finances..."
                  disabled={isTyping || connectionStatus === 'disconnected'}
                  className="flex-1 h-12 rounded-xl border-border/50 bg-background/80 backdrop-blur-sm focus:border-primary/50 transition-all px-4"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping || connectionStatus === 'disconnected'}
                  size="icon"
                  className="h-12 w-12 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  {isTyping ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}