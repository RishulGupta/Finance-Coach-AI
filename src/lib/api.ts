import type { ApiResponse, FinancialData, MonthData } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use default error
        }
        
        const errorMessage = errorData.detail || 
                            errorData.message || 
                            `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  }

  // Upload file to backend
  async uploadFile(file: File, year: number, month: number): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Use query parameters for year and month
    const url = `${this.baseURL}/api/upload?year=${year}&month=${month}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - let browser set it for FormData
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use default error
        }
        
        const errorMessage = errorData.detail || 
                            errorData.message || 
                            `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout - please try again');
        }
        throw error;
      }
      
      throw new Error('Upload failed - unknown error');
    }
  }

  // Get financial data for a specific month
  async getFinancialData(year: number, month: number): Promise<FinancialData> {
    return this.request<FinancialData>(`/api/data/${year}/${month}`);
  }

  // Get available months
  async getAvailableMonths(): Promise<{ months: MonthData[] }> {
    return this.request<{ months: MonthData[] }>('/api/months');
  }

  // Send chat message
  async sendChatMessage(
    question: string, 
    year: number = 2024, 
    month: number = 1
  ): Promise<{ response: string }> {
    return this.request<{ response: string }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ question, year, month }),
    });
  }

  // Get IPO recommendations
  async getIPORecommendations(): Promise<{ recommendations: string }> {
    return this.request<{ recommendations: string }>('/api/recommendations/ipo');
  }

  // Get stock recommendations
  async getStockRecommendations(
    year: number = 2024, 
    month: number = 1
  ): Promise<{ recommendations: string }> {
    return this.request<{ recommendations: string }>('/api/recommendations/stocks', {
      method: 'POST',
      body: JSON.stringify({ year, month }),
    });
  }

  // Get investment advice
  async getInvestmentAdvice(
    year: number = 2024, 
    month: number = 1
  ): Promise<{ advice: string }> {
    return this.request<{ advice: string }>('/api/recommendations/investment', {
      method: 'POST',
      body: JSON.stringify({ year, month }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ message: string; status: string }> {
    return this.request<{ message: string; status: string }>('/');
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for convenience
export type { ApiResponse, FinancialData, MonthData };