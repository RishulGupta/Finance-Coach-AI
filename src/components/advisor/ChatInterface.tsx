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
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 space-y-4">
      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <Alert className={connectionStatus === 'disconnected' ? 'border-destructive' : 'border-yellow-500'}>
          <div className="flex items-center space-x-2">
            {connectionStatus === 'checking' ? (
              <Wifi className="h-4 w-4 animate-pulse" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <AlertDescription>
              {connectionStatus === 'checking' 
                ? 'Checking connection to AI advisor...' 
                : 'Disconnected from AI advisor. Please ensure the backend server is running on http://localhost:8000'
              }
            </AlertDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkConnection}
            className="ml-auto"
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Enhanced Data Period Selection - ONLY SHOW AVAILABLE MONTHS */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Data Period for Analysis
            </div>
            <div className="flex items-center space-x-2">
              {historyLength > 0 && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <History className="h-3 w-3" />
                  <span>{historyLength} messages</span>
                </Badge>
              )}
              <Badge variant="outline" className="ml-2">
                {availableMonths.length} {availableMonths.length === 1 ? 'period' : 'periods'} available
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoadingMonths ? (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading available data periods...</span>
              </div>
            ) : availableMonths.length > 0 ? (
              <div className="space-y-2">
                <Select 
                  value={`${selectedYear}-${selectedMonth}`} 
                  onValueChange={(value) => {
                    const [year, month] = value.split('-');
                    setSelectedYear(year);
                    setSelectedMonth(month);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a data period" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map((period) => (
                      <SelectItem 
                        key={`${period.year}-${period.month}`} 
                        value={`${period.year}-${period.month}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{period.displayName}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {period.year === new Date().getFullYear() && 
                             period.month === new Date().getMonth() + 1 ? 'Current' : 'Historical'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Analyzing data for <strong>{getMonthName(parseInt(selectedMonth))} {selectedYear}</strong>
                  </span>
                  {currentSessionId && (
                    <span className="text-blue-600">
                      Session: {currentSessionId}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">No financial data available</p>
                <p className="text-xs text-gray-500">Upload your bank statements to get started</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadAvailableMonths}
                  className="mt-2"
                >
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Chat Interface with History Support */}
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5 text-blue-600" />
            AI Financial Advisor
            {connectionStatus === 'connected' && (
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
            {historyLength > 0 && (
              <Badge variant="outline" className="ml-2 text-xs">
                History: {historyLength}
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Chat
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.type === 'bot' 
                        ? msg.error 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {msg.type === 'bot' && msg.error && <AlertCircle className="h-4 w-4" />}
                      {msg.type === 'bot' && !msg.error && <Bot className="h-4 w-4" />}
                      {msg.type === 'user' && <User className="h-4 w-4" />}
                    </div>
                    <div className={`rounded-2xl p-4 shadow-sm ${
                      msg.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : msg.error
                          ? 'bg-red-50 text-red-900 border border-red-200'
                          : 'bg-white text-gray-900 border border-gray-200'
                    }`} style={{ maxWidth: '100%', wordBreak: 'break-word' }}>
                      <MessageContent 
                        content={msg.content} 
                        isBot={msg.type === 'bot'} 
                        hasError={msg.error} 
                      />
                      <div className={`text-xs mt-2 ${
                        msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Questions */}
          {messages.length === 1 && availableMonths.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600 mb-3 font-medium">Quick questions to get started:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                    disabled={isTyping || connectionStatus === 'disconnected'}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex space-x-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={availableMonths.length > 0 
                  ? "Ask about your finances, investments, or spending patterns..." 
                  : "Please upload financial data first to start chatting..."
                }
                onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
                className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                disabled={isTyping || connectionStatus === 'disconnected' || availableMonths.length === 0}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isTyping || !inputValue.trim() || connectionStatus === 'disconnected' || availableMonths.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            
            {connectionStatus === 'disconnected' && (
              <p className="text-xs text-red-600 mt-2">
                Backend server not available. Please start the server with: uvicorn app:app --reload
              </p>
            )}
            
            {availableMonths.length === 0 && !isLoadingMonths && (
              <p className="text-xs text-amber-600 mt-2">
                No financial data available. Please upload your bank statements first.
              </p>
            )}

            {historyLength > 0 && (
              <p className="text-xs text-blue-600 mt-2">
                Conversation history maintained across messages for this period ({historyLength} messages stored)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}