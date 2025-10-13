import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Trash2, Calendar, AlertCircle, Wifi, WifiOff, Loader2, History, Sparkles, Zap, MessageCircle } from 'lucide-react';
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
      .replace(/₹(\d+(?:,\d{3})*)/g, '<span class="text-emerald-400 font-mono">₹$1</span>')
      .replace(/Rs\s*(\d+(?:,\d{3})*)/g, '<span class="text-emerald-400 font-mono">₹$1</span>')
      // Clean bullet points
      .replace(/^\s*[•-]\s/gm, '• ');

    return formatted;
  };

  // Clean message component without bold formatting
  const MessageContent = ({ content, isBot, hasError }: { content: string, isBot: boolean, hasError?: boolean }) => {
    if (!isBot) {
      return <div className="text-sm whitespace-pre-wrap font-medium">{content}</div>;
    }

    // For bot messages, apply clean formatting without bold
    const formatted = formatMessageContent(content);
    
    return (
      <div 
        className={`text-sm ${hasError ? 'text-red-300' : 'text-card-foreground'} leading-relaxed`}
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
    <div className="flex flex-col h-full max-w-7xl mx-auto p-6 space-y-8">
      {/* Enhanced Connection Status */}
      <AnimatePresence>
        {connectionStatus !== 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Alert className={`chat-container border-2 ${connectionStatus === 'disconnected' ? 'border-destructive/50 bg-destructive/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-4">
                  {connectionStatus === 'checking' ? (
                    <Wifi className="h-6 w-6 animate-pulse text-yellow-500" />
                  ) : (
                    <WifiOff className="h-6 w-6 text-destructive" />
                  )}
                  <AlertDescription className="font-semibold text-base">
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
                  className="ml-4 premium-button"
                >
                  Retry
                </Button>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Data Period Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card className="chat-container shadow-2xl border-l-4 border-l-primary">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl font-black">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15 shadow-lg"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Calendar className="h-6 w-6 text-primary" />
                </motion.div>
                <span className="text-3xl font-black text-white">
                  Analysis Period
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {historyLength > 0 && (
                  <Badge className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent/20 to-primary/20 border-accent/30">
                    <History className="h-4 w-4" />
                    <span className="font-bold">{historyLength} messages</span>
                  </Badge>
                )}
                <Badge className="px-4 py-2 border-primary/40 bg-primary/10 text-primary font-bold">
                  {availableMonths.length} {availableMonths.length === 1 ? 'period' : 'periods'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingMonths ? (
                <div className="flex items-center space-x-4 text-base text-muted-foreground p-6 bg-muted/20 rounded-2xl border border-border/50">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">Loading available periods...</span>
                </div>
              ) : availableMonths.length > 0 ? (
                <div className="space-y-4">
                  <Select 
                    value={`${selectedYear}-${selectedMonth}`} 
                    onValueChange={(value) => {
                      const [year, month] = value.split('-');
                      setSelectedYear(year);
                      setSelectedMonth(month);
                    }}
                  >
                    <SelectTrigger className="chat-input w-full h-14 text-base font-medium">
                      <SelectValue placeholder="Select a data period" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {availableMonths.map((period) => (
                        <SelectItem 
                          key={`${period.year}-${period.month}`} 
                          value={`${period.year}-${period.month}`}
                          className="rounded-xl py-3"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold text-base">{period.displayName}</span>
                            <Badge variant="secondary" className="ml-4 text-xs">
                              {period.year === new Date().getFullYear() && 
                               period.month === new Date().getMonth() + 1 ? 'Current' : 'Past'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between text-sm px-2">
                    <span className="text-muted-foreground font-medium">
                      Analyzing <strong className="text-foreground text-base">{getMonthName(parseInt(selectedMonth))} {selectedYear}</strong>
                    </span>
                    {currentSessionId && (
                      <span className="text-xs text-primary/70 font-mono bg-primary/10 px-2 py-1 rounded-lg">
                        {currentSessionId}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 px-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-muted/30 to-muted/20 flex items-center justify-center"
                  >
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                  </motion.div>
                  <p className="text-base font-bold text-foreground mb-2">No financial data available</p>
                  <p className="text-sm text-muted-foreground mb-6">Upload your bank statements to get started</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadAvailableMonths}
                    className="premium-button rounded-2xl"
                  >
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ultra Enhanced Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex-1 flex flex-col"
      >
        <Card className="chat-container flex-1 flex flex-col shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card/40 to-card/20 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-4">
                <motion.div 
                  className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 shadow-xl"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Bot className="h-8 w-8 text-primary" />
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-2 h-2 text-white m-1" />
                  </motion.div>
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-white">
                    AI Financial Advisor
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    {connectionStatus === 'connected' && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                        <span className="text-sm text-emerald-400 font-bold">Online & Ready</span>
                      </div>
                    )}
                    {historyLength > 0 && (
                      <Badge className="text-xs px-3 py-1 bg-accent/20 text-accent border-accent/30">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {historyLength} msgs
                      </Badge>
                    )}
                  </div>
                </div>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearChat} 
                className="premium-button rounded-2xl gap-2 border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Clear Chat
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 bg-gradient-to-b from-background/30 to-muted/5">
            <ScrollArea className="flex-1 p-8" ref={scrollAreaRef}>
              <div className="space-y-8 max-w-5xl mx-auto">
                <AnimatePresence>
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className={`flex gap-6 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Enhanced Avatar */}
                      <motion.div 
                        className={`chat-avatar flex-shrink-0 ${
                          msg.type === 'user' ? 'chat-avatar-user' : 'chat-avatar-bot'
                        } ${msg.error ? 'bg-gradient-to-br from-destructive/30 to-destructive/20 border-2 border-destructive/40' : ''}`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        {msg.type === 'user' ? (
                          <User className="h-6 w-6 text-white" />
                        ) : (
                          <Bot className={`h-6 w-6 ${msg.error ? 'text-destructive' : 'text-white'}`} />
                        )}
                      </motion.div>

                      {/* Enhanced Message Bubble */}
                      <div className={`flex-1 max-w-4xl ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
                        <motion.div 
                          className={`${
                            msg.type === 'user'
                              ? 'chat-message chat-message-user'
                              : msg.error
                                ? 'chat-message chat-message-error'
                                : 'chat-message chat-message-bot'
                          }`}
                          whileHover={{ 
                            scale: 1.02,
                            boxShadow: msg.type === 'user' 
                              ? '0 20px 40px rgba(59, 130, 246, 0.3)' 
                              : '0 20px 40px rgba(0, 0, 0, 0.1)'
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <MessageContent content={msg.content} isBot={msg.type === 'bot'} hasError={msg.error} />
                          <div className={`text-xs mt-3 flex items-center gap-2 ${
                            msg.type === 'user' ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'
                          }`}>
                            <span className="font-medium">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-6"
                  >
                    <div className="chat-avatar chat-avatar-bot">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div className="chat-message chat-message-bot">
                      <div className="flex space-x-3">
                        <motion.div 
                          className="w-3 h-3 bg-primary rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div 
                          className="w-3 h-3 bg-accent rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div 
                          className="w-3 h-3 bg-primary rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Enhanced Quick Questions */}
            <AnimatePresence>
              {messages.length === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="px-8 py-6 border-t border-border/50 bg-gradient-to-r from-muted/20 via-muted/10 to-muted/20"
                >
                  <p className="text-sm text-muted-foreground mb-4 font-bold uppercase tracking-wide flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    Quick questions to get started:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {quickQuestions.map((question, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1, duration: 0.3 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickQuestion(question)}
                          className="text-sm rounded-2xl hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-300 hover:scale-105 premium-button"
                        >
                          {question}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Input Area */}
            <div className="p-8 border-t border-border/50 bg-gradient-to-r from-card/40 via-card/30 to-card/40 backdrop-blur-xl">
              <div className="flex gap-4">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask me anything about your finances..."
                  disabled={isTyping || connectionStatus === 'disconnected'}
                  className="chat-input flex-1 h-14 text-base px-6"
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping || connectionStatus === 'disconnected'}
                    size="icon"
                    className="h-14 w-14 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 premium-button"
                  >
                    {isTyping ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Send className="h-6 w-6" />
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}