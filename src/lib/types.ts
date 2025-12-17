// Core API Response Types
export interface ApiResponse {
  success: boolean;
  message?: string;
  transactions?: number;
  categories?: number;
  year?: number;
  month?: number;
}

export interface UploadSuccessData extends ApiResponse {
  transactions: number;
  categories: number;
  year: number;
  month: number;
}

// User Types for Firebase Authentication
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface SpendingInsight {
  id: string;
  category: string;
  currentSpend: number;
  avgSpend: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  recommendation: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface BudgetRecommendation {
  id: string;
  category: string;
  currentBudget: number;
  recommendedBudget: number;
  reason: string;
  savings: number;
  priority: 'high' | 'medium' | 'low';
}

export interface InvestmentTip {
  id: string;
  title: string;
  description: string;
  category: 'stocks' | 'bonds' | 'crypto' | 'savings' | 'real-estate';
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: string;
  timeHorizon: string;
  priority: number;
}

export interface FinancialInsights {
  spendingAnalysis: SpendingInsight[];
  budgetRecommendations: BudgetRecommendation[];
  investmentTips: InvestmentTip[];
}

// Financial Data Types
export interface Transaction {
  id?: string;
  date: string;
  description: string;
  category: string;
  debit_inr: number;
  credit_inr: number;
  balance_inr?: number;
  month?: string;
  userId?: string; // Added for user-specific data
}

export interface CategorySummary {
  month?: string;
  category: string;
  total_spent: number;
  total_income: number;
  transactions: number;
  userId?: string; // Added for user-specific data
}

export interface FinancialMetrics {
  totalSpent: number;
  totalIncome: number;
  transactionCount: number;
  categories: number;
}

export interface FinancialData {
  exists: boolean;
  transactions: Transaction[];
  summary: CategorySummary[];
  metadata?: {
    upload_ts: string;
    rows: number;
    spent: number;
    income: number;
    categories: number;
    storage_paths?: {
      categorized_csv: string;
      summary_csv: string;
    };
  };
  metrics: FinancialMetrics;
}

// Month Data Type
export interface MonthData {
  year: number;
  month: number;
}

// Chat and Recommendations Types
export interface ChatRequest {
  question: string;
  year?: number;
  month?: number;
  userId?: string; // Added for user-specific data
}

export interface ChatResponse {
  response: string;
}

export interface RecommendationRequest {
  year?: number;
  month?: number;
  userId?: string; // Added for user-specific data
}

export interface IPORecommendation {
  recommendations: string;
}

export interface StockRecommendation {
  recommendations: string;
}

export interface InvestmentAdvice {
  advice: string;
}

// Health Check Types
export interface HealthCheckResponse {
  message: string;
  status: string;
}

// Error Types
export interface ErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
}

// File Upload Types
export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Component Props Types
export interface DashboardProps {
  selectedYear: number;
  selectedMonth: number;
  availableMonths: MonthData[];
  onPeriodChange: (period: { year: number; month: number }) => void;
}

export interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon: any; // LucideIcon
  trend?: 'up' | 'down';
  className?: string;
}

export interface CategoryBreakdownProps {
  data: CategorySummary[];
  showDetails?: boolean;
}

export interface FileUploadProps {
  onUploadSuccess: (data: UploadSuccessData) => void;
}

export interface TransactionTableProps {
  data: Transaction[];
  pageSize?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
}

export interface SpendingChartProps {
  data: CategorySummary[];
  timeframe?: 'monthly' | 'weekly' | 'daily';
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  fullName?: string;
  transactions?: number;
  percentage?: number;
}

// Filter and Sort Types
export interface TransactionFilter {
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  searchTerm?: string;
}

export interface SortConfig {
  field: keyof Transaction;
  direction: 'asc' | 'desc';
}

// Pagination Types
export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

// Theme and UI Types
export type Theme = 'light' | 'dark' | 'system';

export interface ToastConfig {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: React.ReactNode;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;